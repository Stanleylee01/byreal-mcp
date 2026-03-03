#!/bin/bash
# Byreal MCP — 快速配置
# 用法: bash scripts/setup.sh

set -e

CONFIG_DIR="$HOME/.byreal-mcp"
CONFIG_FILE="$CONFIG_DIR/config.json"

echo "🔧 Byreal MCP 配置"
echo ""

# Skip if already configured
if [ -f "$CONFIG_FILE" ]; then
  echo "✅ 配置文件已存在: $CONFIG_FILE"
  read -r -p "覆盖重新配置? [y/N] " overwrite
  if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
    echo "跳过配置，保留现有配置。"
    echo ""
    echo "下一步："
    echo "  claude mcp add byreal -- node $(cd "$(dirname "$0")/.." && pwd)/dist/index.js"
    exit 0
  fi
fi

# Create config dir
mkdir -p "$CONFIG_DIR"

# Prompt for Helius API key
echo "📡 Solana RPC 配置"
echo "  免费申请 Helius key: https://helius.dev"
echo "  (直接回车跳过，使用公共 RPC — 有速率限制)"
echo ""
read -r -p "Helius API Key (留空使用公共 RPC): " helius_key

if [ -z "$helius_key" ]; then
  RPC_URL="https://api.mainnet-beta.solana.com"
  HELIUS_KEY=""
  echo ""
  echo "⚠️  使用公共 RPC — 会有速率限制，建议后续申请 Helius key"
else
  RPC_URL="https://mainnet.helius-rpc.com/?api-key=${helius_key}"
  HELIUS_KEY="$helius_key"
  echo ""
  echo "✅ 使用 Helius RPC"
fi

# Write config
if [ -z "$HELIUS_KEY" ]; then
  cat > "$CONFIG_FILE" << EOF
{
  "rpcUrl": "${RPC_URL}"
}
EOF
else
  cat > "$CONFIG_FILE" << EOF
{
  "rpcUrl": "${RPC_URL}",
  "heliusApiKey": "${HELIUS_KEY}"
}
EOF
fi

chmod 600 "$CONFIG_FILE"

echo ""
echo "✅ 配置已写入 $CONFIG_FILE"
echo ""
echo "下一步："
echo "  1. 在 Claude Code 中注册 MCP："
echo "     claude mcp add byreal -- node $(cd "$(dirname "$0")/.." && pwd)/dist/index.js"
echo ""
echo "  2. 重启 Claude Code"
echo ""
echo "  3. 对话框里说："
echo "     '帮我创建钱包' → byreal_wallet_setup"
echo "     钱包将保存到 ~/.byreal-mcp/wallet.json"
echo ""
echo "  ⚠️  创建后务必备份 ~/.byreal-mcp/wallet.json"
echo "     丢了 = 资金永久丢失，无法恢复"
