# Byreal MCP 内部测试部署说明

> 版本：v0.4.0 | 更新：2026-02-27 | 面向：内部开发者 / 测试人员

---

## 项目简介

Byreal MCP Server 是一个将 Byreal Solana CLMM DEX 的全部操作（38个工具）封装为 [Model Context Protocol](https://modelcontextprotocol.io) 工具的服务，让 AI Agent 可以自主完成查询池子、swap、开关仓、Copy Farm 等操作，支持通过 Privy MPC 钱包自动签名广播交易。

---

## 前置条件

| 条件 | 说明 |
|------|------|
| **Node.js** | v18+ 推荐 v20+，需在 PATH 中 |
| **npm** | v9+（随 Node.js 安装） |
| **Privy 账号** | 需创建 App，获取 `appId` 和 `appSecret`。地址：[privy.io](https://privy.io) |
| **Resend 账号** | 用于发送 OTP 邮件，获取 `API Key`。地址：[resend.com](https://resend.com) |
| **Solana RPC** | 推荐用 Helius，公共节点限速严重（国内需要代理） |
| **mcporter**（可选） | OpenClaw 的 MCP 管理工具，用于注册和调用工具 |

验证 Node 版本：
```bash
node --version  # 应 >= 18
npm --version
```

---

## 安装步骤

```bash
# 1. Clone 项目（或直接用已有目录）
git clone https://github.com/byreal/byreal-mcp.git ~/clawd/byreal-mcp
cd ~/clawd/byreal-mcp

# 2. 安装依赖（包含本地 @byreal/clmm-sdk）
npm install

# 3. 编译 TypeScript
npm run build
# → 产物在 dist/ 目录

# 4. 验证编译成功
node dist/index.js --help  # 或直接看 dist/ 有无文件
```

开发模式（无需每次 build）：
```bash
npm run dev  # 使用 tsx 直接运行 src/index.ts
```

---

## 配置

所有配置放在 `~/.byreal-mcp/config.json`。这个文件存储 Privy 和 Resend 凭据，**不要提交到 git**。

```bash
mkdir -p ~/.byreal-mcp
cat > ~/.byreal-mcp/config.json << 'EOF'
{
  "privyAppId": "clxxxxxxxxxxxxxxxxxxxxxxx",
  "privyAppSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "resendApiKey": "re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "rpcUrl": "https://mainnet.helius-rpc.com/?api-key=your-key"
}
EOF
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `privyAppId` | string | ✅ | Privy App ID，格式 `clxxx...`，从 Privy Dashboard → Settings 获取 |
| `privyAppSecret` | string | ✅ | Privy App Secret，同 Dashboard 获取，只显示一次，注意保存 |
| `resendApiKey` | string | ✅ | Resend API Key，用于发送 OTP 邮件。格式 `re_xxx...` |
| `rpcUrl` | string | ✅ | Solana RPC 地址。推荐 Helius（`https://mainnet.helius-rpc.com/?api-key=xxx`）或其他付费节点 |

> ⚠️ **国内用户**：SDK 子进程发起的链上请求默认走 `SOL_RPC` 环境变量，需要同时设置代理：
> ```bash
> export HTTPS_PROXY=http://127.0.0.1:7890
> export SOL_RPC=https://mainnet.helius-rpc.com/?api-key=your-key
> ```

### 环境变量（可选覆盖）

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `BYREAL_API_BASE` | `https://api2.byreal.io/byreal/api` | Byreal REST API 地址 |
| `SOL_RPC` | `https://api.mainnet-beta.solana.com` | Solana RPC（公共节点限速严重，建议替换） |
| `HTTPS_PROXY` | 未设置 | 代理地址，国内开发必须设置 |

---

## 注册到 mcporter（推荐）

```bash
# 基础注册
mcporter config add byreal --stdio "node ~/clawd/byreal-mcp/dist/index.js"

# 带环境变量注册（推荐）
SOL_RPC=https://mainnet.helius-rpc.com/?api-key=xxx \
HTTPS_PROXY=http://127.0.0.1:7890 \
mcporter config add byreal --stdio "node ~/clawd/byreal-mcp/dist/index.js"

# 验证注册（应列出 38 个工具）
mcporter list byreal
```

---

## 钱包创建流程

Byreal MCP 使用 **Privy MPC 钱包**实现自动签名。钱包创建是一次性操作，完成后所有写操作（开仓、关仓、swap）都会自动签名广播。

### Step 1：发送 OTP

```
工具：byreal_wallet_setup
参数：email="your@email.com"
```

执行后，你的邮箱会收到一封包含 **6位数字验证码** 的邮件。
- 验证码有效期：**5分钟**
- 最多尝试：**3次**

### Step 2：验证并创建钱包

```
工具：byreal_wallet_verify
参数：code="123456"
```

验证成功后：
- 创建 Solana MPC 钱包
- 钱包信息保存到 `~/.byreal-mcp/wallet.json`
- **授权私钥保存到 `~/.byreal-mcp/auth_key.pem`**（重要！见安全须知）
- 返回钱包地址

### Step 3：备份 auth_key.pem ⚠️

```bash
# 立刻备份！这是钱包的唯一控制凭证
cp ~/.byreal-mcp/auth_key.pem ~/your-secure-backup/byreal-auth-key-backup.pem

# 或加密备份
gpg --symmetric --cipher-algo AES256 ~/.byreal-mcp/auth_key.pem
```

> **丢失 `auth_key.pem` = 永久失去钱包控制权，没有任何恢复手段。**

### Step 4：验证钱包状态

```
工具：byreal_wallet_status
```

应看到类似输出：
```
💼 Byreal Wallet

Address: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
Email: your@email.com
SOL: 0.000000
USDC: 0.00
Gas: ⚠️ Low — send at least 0.01 SOL
```

---

## 充值

钱包创建后需要充值才能进行链上操作。

### 必须充值 SOL（Gas 费）

- **最少充值**：0.01 SOL（用于 Gas）
- **建议充值**：0.05 SOL（开仓、关仓各需约 0.005-0.01 SOL）
- 转账到：`byreal_wallet_status` 返回的 `Address`

### 充值目标代币

根据你要测试的池子，充值对应的代币，例如：

| 场景 | 需要充值 |
|------|----------|
| 测试 SOL/USDC 池 | SOL + USDC |
| 测试 bbSOL/USDC 池 | bbSOL + USDC |
| 只测试 swap | 输入代币即可 |

> 常用 Token 地址：
> - USDC: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
> - bbSOL: `Bybit2vBJGhPF52GBdNaQfUJ6ZpThSgHBobjWZpLPb4B`

充值后检查余额：
```
工具：byreal_wallet_status
```

---

## 测试用例

以下是 5 个核心测试用例，涵盖主要功能路径。

---

### Test 1：查询活跃池子

**目标**：验证 API 连通性，查看高收益池子。

```
工具：byreal_list_pools
参数：{
  "sortBy": "feeApr24h",
  "sortOrder": "desc",
  "pageSize": 10
}
```

**预期结果**：返回按 24h 手续费 APR 排序的池子列表，包含 `poolAddress`、`tvl`、`apr` 等字段。

进一步查看某个池子详情：
```
工具：byreal_pool_details
参数：{ "poolAddress": "<从上一步获取的地址>" }
```

---

### Test 2：获取 Swap 报价

**目标**：验证 Router 报价功能，检查价格和滑点。

以 1 SOL → USDC 为例：
```
工具：byreal_swap_quote
参数：{
  "inputMint": "So11111111111111111111111111111111111111112",
  "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "amount": "1000000000"
}
```

> 注意：`amount` 是 **raw lamports**（1 SOL = 1,000,000,000）

**预期结果**：返回报价金额、价格影响（priceImpact）、最小获得量（minReceived）、路由信息。

---

### Test 3：开仓（Open Position）

**目标**：验证 CLMM 开仓全流程（需要钱包 + 足够余额）。

1. 先 preview 需要的 token 数量：
```
工具：byreal_create_position_info
参数：{
  "poolAddress": "<目标池子地址>",
  "priceLower": "140",
  "priceUpper": "160",
  "baseToken": "A",
  "baseAmount": "10"
}
```

2. 确认金额后开仓：
```
工具：byreal_open_position
参数：{
  "poolAddress": "<池子地址>",
  "priceLower": "140",
  "priceUpper": "160",
  "baseToken": "A",
  "baseAmount": "10",
  "userAddress": "<你的钱包地址>"
}
```

**预期结果（Auto-Sign 模式）**：
```json
{
  "signature": "5KD3...",
  "explorerUrl": "https://solscan.io/tx/5KD3..."
}
```

> 价格范围（priceLower/priceUpper）是 **UI 单位的价格**，不是 tick。SDK 会自动处理 tick 对齐。

---

### Test 4：关仓（Close Position）

**目标**：验证关仓流程（需要有开仓的 position）。

1. 查看当前持仓，找到 `nftMintAddress`：
```
工具：byreal_list_positions
参数：{ "walletAddress": "<你的钱包地址>" }
```

2. 关仓：
```
工具：byreal_close_position
参数：{
  "nftMint": "<从上一步获取的 nftMintAddress>",
  "userAddress": "<你的钱包地址>"
}
```

**预期结果**：返回当前仓位 token 余额、预计取回金额，Auto-Sign 模式下直接广播并返回 signature。

---

### Test 5：Copy Farm

**目标**：验证 Copy Farm 全链路，包括 on-chain memo 写入。

1. 找顶级 farmer：
```
工具：byreal_top_farmers
参数：{ "pageSize": 5 }
```

2. 查看他们的最佳持仓（注意 status 为 🟢 的才能 copy）：
```
工具：byreal_top_positions
参数：{ "pageSize": 10 }
```

3. 确认持仓详情：
```
工具：byreal_position_detail
参数：{ "address": "<positionAddress>" }
```

4. 复制开仓（会在链上写入 REFERER_POSITION memo）：
```
工具：byreal_copy_position
参数：{
  "positionAddress": "<被 copy 的 positionAddress>",
  "userAddress": "<你的钱包地址>",
  "baseToken": "A",
  "baseAmount": "20"
}
```

**预期结果**：使用与目标 position 相同的 tick range 开仓，交易中包含 `REFERER_POSITION=<positionAddress>` memo，Byreal CLMM 合约会在链上验证关联关系。

---

## 安全须知

### 1. auth_key.pem 是唯一控制凭证

- `~/.byreal-mcp/auth_key.pem` 是 P-256 授权私钥，**丢失即永久失去钱包控制权**
- **没有任何恢复机制**，Privy 团队也无法帮你恢复
- 立刻做多份备份，存放在不同介质（U 盘、加密云存储、纸质打印）

```bash
# 查看文件是否存在
ls -la ~/.byreal-mcp/

# 验证文件内容（应为 PEM 格式）
head -1 ~/.byreal-mcp/auth_key.pem
# 应输出：-----BEGIN EC PRIVATE KEY-----
```

### 2. 双重授权机制

Privy MPC 钱包签名需要同时满足：
- **Privy App 凭据**（`privyAppId` + `privyAppSecret`）
- **用户授权密钥**（`auth_key.pem`）

两者缺一不可。即使 Privy 服务器被攻击，没有你的 `auth_key.pem`，攻击者也无法签名交易。

### 3. 私钥不可导出

这不是传统自托管钱包。你**不能**把这个钱包导入 Phantom 或其他钱包 App。控制权通过 `auth_key.pem` 实现，而非助记词/私钥导出。

### 4. config.json 权限保护

```bash
# 限制 config.json 只有当前用户可读
chmod 600 ~/.byreal-mcp/config.json
chmod 600 ~/.byreal-mcp/auth_key.pem
chmod 600 ~/.byreal-mcp/wallet.json
```

### 5. 不要在生产环境用测试资金

内测阶段建议资金规模：SOL ≤ 0.1，USDC ≤ 50，仅用于功能验证。

---

## 已知限制

| 限制 | 说明 | 临时方案 |
|------|------|----------|
| **国内代理** | SDK 子进程发起的 RPC 调用不走系统代理，国内环境下 `byreal_open_position`、`byreal_copy_position` 等会超时 | 设置 `HTTPS_PROXY` 环境变量，或使用海外服务器部署 |
| **私钥不可导出** | 钱包无法导入 Phantom/Backpack 等钱包 App | 使用 Manual Mode（不配置钱包），外部签名后用 `byreal_submit_liquidity_tx` 提交 |
| **WebSocket 确认不稳定** | SDK 用 RPC polling 确认交易，偶尔可能提前返回 "finalized" | 收到 signature 后自行在 [Solscan](https://solscan.io) 验证 |
| **Reward Claim 需要 orderCode** | `byreal_claim_rewards_tx` 返回 orderCode，必须传给 `byreal_submit_claim`，不能丢失 | 在日志中保存 orderCode |
| **Copy 仓位必须为 open 状态** | `byreal_copy_position` 会报错如果目标 position 已关闭 | 先用 `byreal_top_positions` 确认 status 为 🟢 |
| **amount 单位差异** | Swap 类工具用 raw lamports，LP 类工具用 UI 单位 | 查文档或调用 `byreal_known_tokens` 确认 decimals |

---

## 联系方式

| 事项 | 联系人 |
|------|--------|
| MCP 工具问题 / Bug 反馈 | Stanley（李硕）飞书 |
| Privy / 钱包集成问题 | Stanley |
| Byreal API 问题 | Dawson / James |
| 链上数据 / 合约问题 | Yuqing / James |

> 反馈 Bug 时请附上：工具名称、入参、报错信息、Node.js 版本、是否使用代理。

---

*本文档仅供内部测试使用，请勿对外传播。*
