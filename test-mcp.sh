#!/bin/bash
# MCP Tool Tester — sends JSON-RPC to stdin, captures responses
# Usage: ./test-mcp.sh <tool_name> '<json_args>'

TOOL=$1
ARGS=${2:-'{}'}

INIT='{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
CALL="{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"$TOOL\",\"arguments\":$ARGS}}"

cd "$(dirname "$0")"
(echo "$INIT"; sleep 0.5; echo "$CALL"; sleep 8) | node dist/index.js 2>/dev/null | while IFS= read -r line; do
  echo "$line" | python3 -c "
import json, sys, textwrap
try:
    data = json.loads(sys.stdin.read())
    if data.get('id') == 1:
        result = data.get('result', data.get('error', {}))
        if 'content' in result:
            for c in result['content']:
                print(c.get('text', json.dumps(c, indent=2)))
        else:
            print(json.dumps(result, indent=2))
except: pass
" 2>/dev/null
done
