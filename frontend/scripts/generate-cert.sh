#!/bin/bash

# 開発用HTTPS証明書生成スクリプト
echo "開発用HTTPS証明書を生成しています..."

# 証明書ディレクトリを作成
mkdir -p certs

# 秘密鍵を生成
openssl genrsa -out certs/localhost.key 2048

# 証明書署名要求を生成
openssl req -new -key certs/localhost.key -out certs/localhost.csr -subj "/C=JP/ST=Tokyo/L=Tokyo/O=Development/CN=localhost"

# 自己署名証明書を生成
openssl x509 -req -in certs/localhost.csr -signkey certs/localhost.key -out certs/localhost.crt -days 365 -extensions v3_req -extfile <(
cat <<EOF
[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = 192.168.11.12
EOF
)

echo "証明書が生成されました:"
echo "- certs/localhost.key (秘密鍵)"
echo "- certs/localhost.crt (証明書)"
echo ""
echo "Next.jsでHTTPS開発サーバーを起動するには:"
echo "npm run dev:https"
echo ""
echo "注意: ブラウザで「安全でない」警告が表示された場合は、"
echo "「詳細設定」→「localhost にアクセスする（安全ではありません）」をクリックしてください。" 