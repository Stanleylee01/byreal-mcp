/**
 * Wallet module — Privy MPC wallet with email OTP verification
 *
 * Flow:
 * 1. User provides email → send OTP via Resend
 * 2. User enters OTP → verify
 * 3. Create Privy user + Solana wallet
 * 4. Store credentials locally (~/.byreal-mcp/)
 * 5. All write ops auto-sign via Privy
 *
 * Config: ~/.byreal-mcp/config.json (privyAppId, privyAppSecret, resendApiKey)
 * Wallet: ~/.byreal-mcp/wallet.json (userId, walletId, address, email)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { Connection, VersionedTransaction } from '@solana/web3.js';
import * as canonicalizeModule from 'canonicalize';
const canonicalize = (canonicalizeModule as any).default || canonicalizeModule;

// Proxy support: Node.js fetch doesn't respect system proxy
const PROXY_URL = process.env.HTTPS_PROXY || process.env.https_proxy;
let _proxyInitialized = false;

async function proxyFetch(url: string, init: RequestInit): Promise<Response> {
  if (PROXY_URL && !_proxyInitialized) {
    try {
      const { ProxyAgent, setGlobalDispatcher } = await import('undici');
      setGlobalDispatcher(new ProxyAgent(PROXY_URL));
      _proxyInitialized = true;
    } catch {
      // undici not available, try without proxy
    }
  }
  return fetch(url, init);
}

// ==================== Paths ====================

const CONFIG_DIR = path.join(os.homedir(), '.byreal-mcp');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const WALLET_FILE = path.join(CONFIG_DIR, 'wallet.json');
const OTP_FILE = path.join(CONFIG_DIR, 'pending_otp.json');
const AUTH_KEY_FILE = path.join(CONFIG_DIR, 'auth_key.pem');

const PRIVY_API = 'https://api.privy.io';

// ==================== Types ====================

export interface WalletConfig {
  privyAppId: string;
  privyAppSecret: string;
  resendApiKey: string;
  resendFrom?: string;        // e.g. "Byreal <noreply@yourdomain.com>"
  rpcUrl?: string;
  authorizationKeyPem?: string;  // P-256 private key in PEM format for signing wallet RPC requests
}

export interface WalletInfo {
  userId: string;
  walletId: string;
  address: string;
  email: string;
  createdAt: string;
}

interface PendingOTP {
  email: string;
  code: string;
  expiresAt: number;    // unix ms
  attempts: number;
}

// ==================== Config Helpers ====================

function ensureDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): WalletConfig | null {
  // Support env vars as override
  const envConfig: Partial<WalletConfig> = {};
  if (process.env.PRIVY_APP_ID) envConfig.privyAppId = process.env.PRIVY_APP_ID;
  if (process.env.PRIVY_APP_SECRET) envConfig.privyAppSecret = process.env.PRIVY_APP_SECRET;
  if (process.env.RESEND_API_KEY) envConfig.resendApiKey = process.env.RESEND_API_KEY;
  if (process.env.RESEND_FROM) envConfig.resendFrom = process.env.RESEND_FROM;

  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const file = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      return { ...file, ...envConfig } as WalletConfig;
    }
  } catch {}

  // If all required fields from env
  if (envConfig.privyAppId && envConfig.privyAppSecret && envConfig.resendApiKey) {
    return envConfig as WalletConfig;
  }

  return null;
}

function saveConfig(config: WalletConfig) {
  ensureDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function loadWallet(): WalletInfo | null {
  try {
    if (fs.existsSync(WALLET_FILE)) {
      return JSON.parse(fs.readFileSync(WALLET_FILE, 'utf-8'));
    }
  } catch {}
  return null;
}

function saveWallet(wallet: WalletInfo) {
  ensureDir();
  fs.writeFileSync(WALLET_FILE, JSON.stringify(wallet, null, 2));
}

function loadPendingOTP(): PendingOTP | null {
  try {
    if (fs.existsSync(OTP_FILE)) {
      return JSON.parse(fs.readFileSync(OTP_FILE, 'utf-8'));
    }
  } catch {}
  return null;
}

function savePendingOTP(otp: PendingOTP) {
  ensureDir();
  fs.writeFileSync(OTP_FILE, JSON.stringify(otp));
}

function clearPendingOTP() {
  try { fs.unlinkSync(OTP_FILE); } catch {}
}

// ==================== Privy API ====================

function privyHeaders(config: WalletConfig) {
  const auth = Buffer.from(`${config.privyAppId}:${config.privyAppSecret}`).toString('base64');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${auth}`,
    'privy-app-id': config.privyAppId,
  };
}

async function privyCreateUser(config: WalletConfig, email: string): Promise<{ id: string }> {
  const res = await proxyFetch(`${PRIVY_API}/v1/users`, {
    method: 'POST',
    headers: privyHeaders(config),
    body: JSON.stringify({
      linked_accounts: [{ type: 'custom_auth', custom_user_id: email }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Privy create user failed (${res.status}): ${text}`);
  }

  return res.json() as any;
}

/**
 * Generate a P-256 key pair for wallet authorization.
 * Private key is stored locally; public key is sent to Privy as the wallet owner.
 * This ensures only the holder of auth_key.pem can sign transactions.
 */
function generateAuthorizationKey(): { privateKeyPem: string; publicKeySpkiBase64: string } {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'P-256',
  });

  const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
  const publicKeyDer = publicKey.export({ type: 'spki', format: 'der' });
  const publicKeySpkiBase64 = publicKeyDer.toString('base64');

  return { privateKeyPem, publicKeySpkiBase64 };
}

function saveAuthKey(pem: string) {
  ensureDir();
  fs.writeFileSync(AUTH_KEY_FILE, pem, { mode: 0o600 }); // owner-only read/write
}

function loadAuthKeyPem(): string | null {
  try {
    if (fs.existsSync(AUTH_KEY_FILE)) {
      return fs.readFileSync(AUTH_KEY_FILE, 'utf-8');
    }
  } catch {}
  return null;
}

async function privyCreateWallet(config: WalletConfig): Promise<{ id: string; address: string; authKeyPem: string }> {
  // Generate authorization key — user-owned, stored locally
  const { privateKeyPem, publicKeySpkiBase64 } = generateAuthorizationKey();

  const res = await proxyFetch(`${PRIVY_API}/v1/wallets`, {
    method: 'POST',
    headers: privyHeaders(config),
    body: JSON.stringify({
      chain_type: 'solana',
      owner: { public_key: publicKeySpkiBase64 },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Privy create wallet failed (${res.status}): ${text}`);
  }

  const data = await res.json() as any;

  // Save auth key locally — this is the user's ownership proof
  saveAuthKey(privateKeyPem);

  return { id: data.id, address: data.address, authKeyPem: privateKeyPem };
}

/**
 * Compute privy-authorization-signature header for wallets with an owner.
 * Privy requires signing a structured payload (not just the body).
 * See: https://docs.privy.io/controls/authorization-keys/using-owners/sign/direct-implementation
 */
function computeAuthorizationSignature(
  config: WalletConfig,
  method: string,
  url: string,
  body: any,
  privyHeaders: Record<string, string>,
): string | null {
  const pemKey = config.authorizationKeyPem || loadAuthKeyPem();
  if (!pemKey) return null;

  const privateKey = crypto.createPrivateKey({ key: pemKey, format: 'pem' });

  // Build the signature payload per Privy spec
  const signaturePayload = {
    version: 1,
    method: method.toUpperCase(),
    url,
    body,
    headers: {
      'privy-app-id': privyHeaders['privy-app-id'] || config.privyAppId,
    },
  };

  // JSON-canonicalize per RFC 8785 (sorted keys, no whitespace)
  const canonicalized = canonicalize(signaturePayload) as string;
  const payloadBuf = Buffer.from(canonicalized);

  // Sign with P-256 / SHA-256 — DER encoding (Privy expects DER base64)
  const derSig = crypto.sign('sha256', payloadBuf, privateKey);

  return derSig.toString('base64');
}

async function privySignTransaction(config: WalletConfig, walletId: string, unsignedTxB64: string): Promise<Buffer> {
  const body = {
    method: 'signTransaction',
    params: { transaction: unsignedTxB64, encoding: 'base64' },
  };

  const url = `${PRIVY_API}/v1/wallets/${walletId}/rpc`;
  const hdrs = privyHeaders(config);

  // Add authorization signature if auth key is available
  const authSig = computeAuthorizationSignature(config, 'POST', url, body, hdrs);
  if (authSig) {
    (hdrs as any)['privy-authorization-signature'] = authSig;
  }

  const res = await proxyFetch(url, {
    method: 'POST',
    headers: hdrs,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Privy sign failed (${res.status}): ${text}`);
  }

  const json = await res.json() as any;
  const d = json.data;
  if (typeof d === 'string') return Buffer.from(d, 'base64');
  if (d?.signed_transaction) return Buffer.from(d.signed_transaction, 'base64');
  if (d?.signedTransaction) return Buffer.from(d.signedTransaction, 'base64');
  throw new Error('Unexpected Privy sign response');
}

// ==================== Email OTP ====================

function generateOTP(): string {
  return String(crypto.randomInt(100000, 999999));
}

async function sendOTPEmail(config: WalletConfig, email: string, code: string): Promise<void> {
  const from = config.resendFrom || 'Byreal <onboarding@resend.dev>';

  const res = await proxyFetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.resendApiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Byreal Wallet Verification Code',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #1a1a1a; margin-bottom: 8px;">Byreal Wallet</h2>
          <p style="color: #666; margin-bottom: 24px;">Your verification code:</p>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
          </div>
          <p style="color: #999; font-size: 13px;">This code expires in 5 minutes. If you didn't request this, ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to send email (${res.status}): ${text}`);
  }
}

// ==================== Public API ====================

/**
 * Step 1: Send OTP to email
 */
export async function startVerification(email: string): Promise<{ success: boolean; message: string }> {
  const config = loadConfig();
  if (!config) {
    return {
      success: false,
      message: 'Wallet not configured. Set PRIVY_APP_ID, PRIVY_APP_SECRET, and RESEND_API_KEY environment variables, or create ~/.byreal-mcp/config.json',
    };
  }

  // Rate limit: max 3 attempts per email per 10 min
  const pending = loadPendingOTP();
  if (pending?.email === email && pending.attempts >= 3 && Date.now() < pending.expiresAt) {
    return { success: false, message: 'Too many attempts. Please wait 5 minutes.' };
  }

  const code = generateOTP();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min

  await sendOTPEmail(config, email, code);

  savePendingOTP({
    email,
    code,
    expiresAt,
    attempts: (pending?.email === email ? pending.attempts : 0) + 1,
  });

  return {
    success: true,
    message: `Verification code sent to ${email}. Please enter the 6-digit code.`,
  };
}

/**
 * Step 2: Verify OTP and create wallet
 */
export async function verifyAndCreateWallet(code: string): Promise<{ success: boolean; message: string; address?: string }> {
  const config = loadConfig();
  if (!config) {
    return { success: false, message: 'Wallet not configured.' };
  }

  const pending = loadPendingOTP();
  if (!pending) {
    return { success: false, message: 'No pending verification. Call byreal_wallet_setup first.' };
  }

  if (Date.now() > pending.expiresAt) {
    clearPendingOTP();
    return { success: false, message: 'Verification code expired. Please request a new one.' };
  }

  if (pending.code !== code.trim()) {
    return { success: false, message: 'Invalid code. Please try again.' };
  }

  // OTP verified — create Privy user + wallet
  clearPendingOTP();

  const user = await privyCreateUser(config, pending.email);
  const wallet = await privyCreateWallet(config);

  const walletInfo: WalletInfo = {
    userId: user.id,
    walletId: wallet.id,
    address: wallet.address,
    email: pending.email,
    createdAt: new Date().toISOString(),
  };

  saveWallet(walletInfo);

  return {
    success: true,
    message: `Wallet created! Address: ${wallet.address}\n\n⚠️ IMPORTANT: Your authorization key has been saved to ~/.byreal-mcp/auth_key.pem\nThis key is your proof of ownership. Back it up! Without it, you cannot sign transactions.`,
    address: wallet.address,
  };
}

/**
 * Sign an unsigned base64 transaction and broadcast to Solana
 */
export async function signAndSend(unsignedTxB64: string): Promise<{ signature: string }> {
  const config = loadConfig();
  const wallet = loadWallet();

  if (!config) throw new Error('Wallet not configured');
  if (!wallet) throw new Error('No wallet found. Run byreal_wallet_setup first.');

  const rpc = config.rpcUrl || process.env.SOL_RPC || process.env.SOL_ENDPOINT || 'https://api.mainnet-beta.solana.com';
  const connection = new Connection(rpc);

  // Sign via Privy
  const signedBuf = await privySignTransaction(config, wallet.walletId, unsignedTxB64);

  // Broadcast
  const signature = await connection.sendRawTransaction(signedBuf, {
    skipPreflight: false,
    maxRetries: 3,
  });

  // Confirm with polling (more reliable than WebSocket in China)
  const start = Date.now();
  const timeout = 60_000;
  while (Date.now() - start < timeout) {
    const status = await connection.getSignatureStatus(signature);
    if (status?.value?.confirmationStatus === 'confirmed' || status?.value?.confirmationStatus === 'finalized') {
      return { signature };
    }
    if (status?.value?.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  // Timeout but tx might still be valid
  return { signature };
}

/**
 * Get wallet status
 */
export async function getWalletStatus(): Promise<{
  configured: boolean;
  hasWallet: boolean;
  address?: string;
  email?: string;
  balance?: { sol: number; usdc: number };
}> {
  const config = loadConfig();
  const wallet = loadWallet();

  if (!config) return { configured: false, hasWallet: false };
  if (!wallet) return { configured: true, hasWallet: false };

  const result: any = {
    configured: true,
    hasWallet: true,
    address: wallet.address,
    email: wallet.email,
  };

  // Fetch balances
  try {
    const rpc = config.rpcUrl || process.env.SOL_RPC || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpc);
    const { PublicKey } = await import('@solana/web3.js');
    const pubkey = new PublicKey(wallet.address);

    const solBalance = await connection.getBalance(pubkey);
    result.balance = { sol: solBalance / 1e9, usdc: 0 };

    // USDC balance
    const { getAssociatedTokenAddress } = await import('@solana/spl-token');
    const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
    try {
      const ata = await getAssociatedTokenAddress(USDC_MINT, pubkey);
      const tokenBalance = await connection.getTokenAccountBalance(ata);
      result.balance.usdc = Number(tokenBalance.value.uiAmount ?? 0);
    } catch {
      // No USDC ATA yet
    }
  } catch {}

  return result;
}
