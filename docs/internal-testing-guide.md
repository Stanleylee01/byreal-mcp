# Byreal MCP 内部测试部署说明

> 版本：v0.6.2 | 更新：2026-03-03 | 面向：内部开发者 / 测试人员

---

## 项目简介

Byreal MCP Server 将 Byreal Solana CLMM DEX 的全部操作封装为 **41 个 MCP 工具**，让 AI Agent（Claude Code / Cursor / OpenClaw）自主完成查询池子、swap、开关仓、Copy Farm 等操作。

两种钱包模式：
- **本地密钥对** — 标准 Solana Ed25519 keypair，自托管，可导入 Phantom
- **Privy MPC 钱包** — 通过 config.json 配置（需 appId/appSecret）

---

## 前置条件

| 条件 | 说明 |
|------|------|
| **Node.js** | v18+ 推荐 v20+ |
| **Solana RPC** | 推荐 [Helius](https://helius.dev)（免费），公共节点限速严重 |
| **网络** | 国内需代理（`HTTPS_PROXY`） |

---

## 安装（3 步）

```bash
# 1. Clone
git clone https://github.com/Stanleylee01/byreal-mcp.git
cd byreal-mcp && npm install

# 2. 配置 RPC
bash scripts/setup.sh
# → 输入 Helius API Key → 写入 ~/.byreal-mcp/config.json

# 3. Build
npm run build    # → dist/
```

---

## 注册到 AI 客户端

### Claude Code
```bash
claude mcp add byreal -- node $(pwd)/dist/index.js
```

### Cursor
`.cursor/mcp.json`:
```json
{ "byreal": { "command": "node", "args": ["/path/to/byreal-mcp/dist/index.js"] } }
```

### mcporter (OpenClaw)
```bash
mcporter config add byreal --stdio "node ~/clawd/byreal-mcp/dist/index.js"
mcporter list byreal    # 应列出 41 个工具
```

---

## 钱包配置

### 方式 A：生成新密钥对（推荐）

在 AI 客户端中调用 `byreal_wallet_setup`，或对 AI 说"帮我创建钱包"。

- 生成 Ed25519 keypair → `~/.byreal-mcp/wallet.json`
- **立即备份** wallet.json — 丢失 = 资金不可恢复
- 标准 Solana 格式，可随时导入 Phantom

### 方式 B：使用已有密钥对文件

编辑 `~/.byreal-mcp/wallet.json`：
```json
{ "keypairPath": "/path/to/your/id.json" }
```

### 充值

1. `byreal_wallet_status` → 获取钱包地址
2. 转 **≥ 0.01 SOL**（Gas）+ 目标代币到该地址
3. 内测建议：SOL ≤ 0.1，USDC ≤ 50

---

## 测试用例（5 个核心场景）

### Test 1：查询活跃池子 + 池子分析

```
byreal_list_pools → 按 feeApr24h 排序，找高收益池
byreal_pool_analyze → poolAddress=..., amountUsd=1000, ranges="5,10,20"
  → 多区间 APR 分析，风险评估，投资模拟
```

✅ 预期：返回池子列表 + 详细分析报告（APR/TVL/波动率/风险等级）

### Test 2：Swap 报价 + 执行

```
# 预览（不执行）
byreal_easy_swap → fromToken=SOL, toToken=USDC, amount=0.01, dryRun=true

# 执行
byreal_easy_swap → fromToken=SOL, toToken=USDC, amount=0.01
```

✅ 预期：dryRun 返回报价 + "🔍 Dry-run mode"；执行返回 signature + Solscan 链接

### Test 3：开仓（amountUsd 模式）

```
byreal_pool_analyze → 选定池子和区间
byreal_open_position → poolAddress=..., priceLower=..., priceUpper=..., amountUsd=50, userAddress=...
```

✅ 预期：自动计算 token A/B 比例，返回 unsigned tx → auto-sign → signature

### Test 4：仓位监控 + 关仓

```
byreal_list_positions → walletAddress=...（查看所有仓位）
byreal_position_analyze → walletAddress=..., nftMint=...（健康检查）
byreal_close_position → nftMint=..., userAddress=...
```

✅ 预期：仓位列表含 PnL；分析含 Pool Context；关仓返回 signature

### Test 5：Copy Farm

```
byreal_top_positions → poolAddress=..., sortField=earned, pageSize=5
byreal_copy_position → positionAddress=..., amountUsd=50
```

✅ 预期：复制目标仓位 tick range，链上写入 `REFERER_POSITION` memo

---

## v0.6 新功能速查

| 功能 | 工具 | 说明 |
|------|------|------|
| 池子分析 | `byreal_pool_analyze` | 多区间 APR + 风险 + 投资模拟 |
| 仓位分析 | `byreal_position_analyze` | 健康检查 + Pool Context |
| 人话 Swap | `byreal_easy_swap` | symbol → 报价 → 签名 → 广播 |
| USD 开仓 | `open_position` / `copy_position` | `amountUsd=100` 自动拆分 |
| 预览模式 | `easy_swap` | `dryRun=true` 只报价 |
| 错误建议 | 所有写操作 | `💡 Suggestions` 上下文感知 |
| 工具发现 | `byreal_catalog` | 关键词搜索所有工具 |
| 外部钱包 | `wallet.json` | `keypairPath` 支持 |

---

## 已知限制

| 限制 | 说明 |
|------|------|
| 国内代理 | SDK 子进程需 `HTTPS_PROXY` |
| amountUsd 近似 | 线性插值，非 CLMM tick math，误差 1-2% |
| Reward Claim | `claim_rewards_tx` 返回 orderCode，传给 `submit_claim`，不能丢 |
| Copy 需 open | 目标仓位必须为 🟢 状态 |

---

## 联系方式

| 事项 | 联系人 |
|------|--------|
| MCP 工具 / Bug | Stanley（李硕）飞书 |
| Byreal API | Dawson / James |
| 链上数据 / 合约 | Yuqing / James |

> Bug 反馈请附：工具名、入参、报错、Node 版本、是否代理。

---

*仅限内部测试，请勿外传。*
