#!/bin/bash
# Byreal MCP — 内部测试快速配置
# 用法: bash scripts/setup.sh

set -e

CONFIG_DIR="$HOME/.byreal-mcp"
CONFIG_FILE="$CONFIG_DIR/config.json"

echo "🔧 Byreal MCP 内部测试配置"
echo ""

# Create config dir
mkdir -p "$CONFIG_DIR"

# Write shared credentials
cat > "$CONFIG_FILE" << 'EOF'
{
  "privyAppId": "cmlkq3sed004v0cjgplkuyedu",
  "privyAppSecret": "privy_app_secret_3nHHz6izK6YFajvMfgg4cfrzffgQ2RZoMgYkNgrWEzLvfK4z61GXjdKbmJMKy3ZsnQVRBZ7QxZNcf9DAgGHuExML",
  "resendApiKey": "YOUR_RESEND_API_KEY",
  "resendFrom": "Byreal <onboarding@resend.dev>",
  "rpcUrl": "https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY"
}
EOF

echo "✅ 配置已写入 $CONFIG_FILE"
echo ""
echo "下一步："
echo "  1. 在 Claude Code 中注册 MCP："
echo "     claude mcp add byreal -- node $(cd "$(dirname "$0")/.." && pwd)/dist/index.js"
echo ""
echo "  2. 重启 Claude Code"
echo ""
echo "  3. 对话框里说："
echo "     '帮我创建钱包，邮箱 xxx@xxx.com'"
echo "     → 输入邮箱收到的验证码 → 钱包创建完成"
echo ""
echo "  ⚠️  创建后务必备份 ~/.byreal-mcp/auth_key.pem"
echo "     丢了 = 钱包永久丢失，无法恢复"
