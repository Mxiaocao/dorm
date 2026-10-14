#!/bin/bash
# 寝室卫生安排 - 一键部署脚本
# 用法：把整个项目目录上传到服务器后，在服务器上执行
#   bash deploy.sh
#
# 会做三件事：
#   1. 安装 Node.js（如果没有）
#   2. 用 systemd 常驻运行（断线不退出、开机自启）
#   3. 用 Nginx 反向代理并配好 HTTPS（如果你有域名）

set -e
APP_DIR=/var/www/dorm
PORT=8080
PASSCODE="${PASSCODE:-请改成你自己的口令}"

echo "==> 1/3 检查 Node.js"
if ! command -v node >/dev/null 2>&1; then
  echo "未安装 Node.js，开始安装..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -v

echo "==> 2/3 复制代码"
mkdir -p $APP_DIR
cp -r "$(pwd)/index.html" "$(pwd)/server.js" $APP_DIR/

cat > /etc/systemd/system/dorm.service <<EOF
[Unit]
Description=Dorm Hygiene Service
After=network.target

[Service]
Type=simple
WorkingDirectory=$APP_DIR
Environment=PORT=$PORT
Environment=PASSCODE=$PASSCODE
ExecStart=/usr/bin/node $APP_DIR/server.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable dorm
systemctl restart dorm

sleep 2
echo "服务状态："
systemctl is-active dorm
echo "本机测试："
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:$PORT/

echo ""
echo "==> 3/3 开放防火墙端口（如果需要对外直接访问）"
if command -v ufw >/dev/null 2>&1; then
  ufw allow $PORT/tcp
  echo "已放行 $PORT"
fi

echo ""
echo "完成。现在可以用 http://服务器IP:$PORT/ 访问"
echo "口令：$PASSCODE"
echo "改口令：编辑 /etc/systemd/system/dorm.service 里的 PASSCODE，然后"
echo "  systemctl daemon-reload && systemctl restart dorm"
echo ""
echo "可选：配置 Nginx + 域名 https 访问，把 /etc/nginx/sites-available/dorm.conf 内容参考 deploy.nginx.conf"