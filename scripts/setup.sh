#!/bin/bash
# Byreal MCP — 快速配置
# 用法: bash scripts/setup.sh

set -e

CONFIG_DIR="$HOME/.byreal-mcp"
CONFIG_FILE="$CONFIG_DIR/config.json"

echo "🔧 Byreal MCP 配置"
echo ""

# Create config dir
mkdir -p "$CONFIG_DIR"

# Write config (rpcUrl and heliusApiKey)
cat > "$CONFIG_FILE" << 'EOF'
{
  "rpcUrl": "https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY",
  "heliusApiKey": "YOUR_HELIUS_API_KEY"
}
EOF

chmod 600 "$CONFIG_FILE"

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
