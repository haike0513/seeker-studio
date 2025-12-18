#!/bin/bash

# 文件上传功能测试脚本
# 使用方法: ./test-file-upload.sh

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "🧪 开始测试文件上传功能..."
echo ""

# 检查服务器是否运行
echo "1. 检查服务器是否运行..."
if ! curl -s "$BASE_URL" > /dev/null; then
  echo "❌ 错误: 无法连接到服务器 $BASE_URL"
  echo "   请确保开发服务器正在运行: pnpm dev"
  exit 1
fi
echo "✅ 服务器运行正常"
echo ""

# 创建测试文件
echo "2. 创建测试文件..."
TEST_FILE="test-upload-$(date +%s).txt"
echo "这是一个测试文件" > "$TEST_FILE"
echo "✅ 测试文件已创建: $TEST_FILE"
echo ""

# 提示用户需要登录
echo "⚠️  注意: 文件上传需要认证"
echo "   请先登录获取 session cookie，然后修改脚本中的 SESSION_TOKEN"
echo ""

# 检查是否有 session token
if [ -z "$SESSION_TOKEN" ]; then
  echo "❌ 错误: 未设置 SESSION_TOKEN 环境变量"
  echo ""
  echo "使用方法:"
  echo "  1. 在浏览器中登录应用"
  echo "  2. 打开开发者工具 -> Application -> Cookies"
  echo "  3. 复制 better-auth.session_token 的值"
  echo "  4. 运行: SESSION_TOKEN='your-token' ./test-file-upload.sh"
  echo ""
  echo "或者手动测试:"
  echo "  curl -X POST $BASE_URL/api/files/upload \\"
  echo "    -H 'Cookie: better-auth.session_token=YOUR_TOKEN' \\"
  echo "    -F 'file=@$TEST_FILE'"
  echo ""
  rm -f "$TEST_FILE"
  exit 1
fi

# 测试文件上传
echo "3. 测试文件上传..."
UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/api/files/upload" \
  -H "Cookie: better-auth.session_token=$SESSION_TOKEN" \
  -F "file=@$TEST_FILE")

echo "响应: $UPLOAD_RESPONSE"
echo ""

# 检查响应
if echo "$UPLOAD_RESPONSE" | grep -q '"success":true'; then
  echo "✅ 文件上传成功"
  
  # 提取 fileUrl
  FILE_URL=$(echo "$UPLOAD_RESPONSE" | grep -o '"/uploads/[^"]*"' | head -1 | tr -d '"')
  
  if [ -n "$FILE_URL" ]; then
    echo "   文件 URL: $FILE_URL"
    echo ""
    
    # 测试文件访问
    echo "4. 测试文件访问..."
    if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$FILE_URL" | grep -q "200"; then
      echo "✅ 文件访问成功"
    else
      echo "❌ 文件访问失败"
    fi
  fi
else
  echo "❌ 文件上传失败"
  echo "   响应: $UPLOAD_RESPONSE"
fi

# 清理测试文件
rm -f "$TEST_FILE"
echo ""
echo "🧪 测试完成"
