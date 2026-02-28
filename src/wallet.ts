/**
 * Wallet module — Local Solana Ed25519 keypair
 *
 * Flow:
 * 1. wallet_setup: Generate keypair locally, save to ~/.byreal-mcp/wallet.json
 * 2. wallet_status: Read wallet.json, query SOL/USDC balance via RPC
 * 3. signAndSend: Deserialize VersionedTransaction, sign with local keypair, broadcast
 *
 * Config: ~/.byreal-mcp/config.json (rpcUrl, heliusApiKey)
 * Wallet: ~/.byreal-mcp/wallet.json (publicKey, secretKey[], createdAt)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Connection, Keypair, VersionedTransaction, PublicKey } from '@solana/web3.js';

// ==================== Paths ====================

const CONFIG_DIR = path.join(os.homedir(), '.byreal-mcp');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const WALLET_FILE = path.join(CONFIG_DIR, 'wallet.json');

// ==================== Types ====================

export interface WalletConfig {
  rpcUrl?: string;
  heliusApiKey?: string;
}

export interface WalletInfo {
  publicKey: string;
  secretKey: number[];
  createdAt: string;
}

// ==================== Helpers ====================

function ensureDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): WalletConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch {}
  return {};
}

export function loadWallet(): WalletInfo | null {
  try {
    if (fs.existsSync(WALLET_FILE)) {
      return JSON.parse(fs.readFileSync(WALLET_FILE, 'utf-8'));
    }
  } catch {}
  return null;
}

function getRpcUrl(config: WalletConfig): string {
  return config.rpcUrl || process.env.SOL_RPC || process.env.SOL_ENDPOINT || 'https://api.mainnet-beta.solana.com';
}

// ==================== Public API ====================

/**
 * Generate a new local Solana keypair and save to wallet.json
 */
export async function setupWallet(): Promise<{ success: boolean; message: string; address?: string }> {
  if (loadWallet()) {
    const existing = loadWallet()!;
    return {
      success: false,
      message: `Wallet already exists: ${existing.publicKey}\nUse byreal_wallet_status to check balance. Delete ~/.byreal-mcp/wallet.json to reset (⚠️ funds will be lost).`,
    };
  }

  ensureDir();
  const keypair = Keypair.generate();

  const walletInfo: WalletInfo = {
    publicKey: keypair.publicKey.toBase58(),
    secretKey: Array.from(keypair.secretKey),
    createdAt: new Date().toISOString(),
  };

  fs.writeFileSync(WALLET_FILE, JSON.stringify(walletInfo, null, 2), { mode: 0o600 });

  return {
    success: true,
    message: `Wallet created! Address: ${walletInfo.publicKey}\n\n⚠️ IMPORTANT: Private key saved to ~/.byreal-mcp/wallet.json (chmod 600)\nBack up this file securely. If lost, your funds are unrecoverable.`,
    address: walletInfo.publicKey,
  };
}

/**
 * Sign an unsigned base64 VersionedTransaction with local keypair and broadcast
 */
export async function signAndSend(unsignedTxB64: string): Promise<{ signature: string }> {
  const walletInfo = loadWallet();
  if (!walletInfo) throw new Error('No wallet found. Run byreal_wallet_setup first.');

  const config = loadConfig();
  const rpc = getRpcUrl(config);
  const connection = new Connection(rpc);

  const keypair = Keypair.fromSecretKey(Uint8Array.from(walletInfo.secretKey));

  // Deserialize and sign
  const txBuf = Buffer.from(unsignedTxB64, 'base64');
  const tx = VersionedTransaction.deserialize(txBuf);
  tx.sign([keypair]);

  // Broadcast
  const signature = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });

  // Poll for confirmation (2s interval, 60s timeout)
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

  // Timeout but tx might still confirm
  return { signature };
}

/**
 * Get wallet status: public key + SOL/USDC balance
 */
export async function getWalletStatus(): Promise<{
  hasWallet: boolean;
  address?: string;
  balance?: { sol: number; usdc: number };
}> {
  const walletInfo = loadWallet();

  if (!walletInfo) return { hasWallet: false };

  const result: any = {
    hasWallet: true,
    address: walletInfo.publicKey,
  };

  try {
    const config = loadConfig();
    const rpc = getRpcUrl(config);
    const connection = new Connection(rpc);
    const pubkey = new PublicKey(walletInfo.publicKey);

    const solBalance = await connection.getBalance(pubkey);
    result.balance = { sol: solBalance / 1e9, usdc: 0 };

    // USDC balance
    try {
      const { getAssociatedTokenAddress } = await import('@solana/spl-token');
      const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
      const ata = await getAssociatedTokenAddress(USDC_MINT, pubkey);
      const tokenBalance = await connection.getTokenAccountBalance(ata);
      result.balance.usdc = Number(tokenBalance.value.uiAmount ?? 0);
    } catch {
      // No USDC ATA yet
    }
  } catch {}

  return result;
}
