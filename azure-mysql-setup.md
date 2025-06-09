# Azure Database for MySQL セットアップガイド

## 🚀 Azure Database for MySQL インスタンス作成

### 1. Azure Portal でのリソース作成

```bash
# Azure CLI を使用する場合
az mysql flexible-server create \
  --resource-group pos-system-rg \
  --name pos-mysql-server \
  --location japaneast \
  --admin-user posadmin \
  --admin-password 'YourSecurePassword123!' \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 8.0
```

### 2. ファイアウォール設定

```bash
# 開発環境用（全IPアドレス許可）
az mysql flexible-server firewall-rule create \
  --resource-group pos-system-rg \
  --name pos-mysql-server \
  --rule-name AllowAll \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 255.255.255.255

# 本番環境用（特定IPのみ許可）
az mysql flexible-server firewall-rule create \
  --resource-group pos-system-rg \
  --name pos-mysql-server \
  --rule-name AllowMyIP \
  --start-ip-address YOUR_IP_ADDRESS \
  --end-ip-address YOUR_IP_ADDRESS
```

### 3. データベース作成

```bash
# データベース作成
az mysql flexible-server db create \
  --resource-group pos-system-rg \
  --server-name pos-mysql-server \
  --database-name pos_system
```

## 🔧 環境変数設定

### `.env` ファイルの設定

```env
# Azure Database for MySQL設定
DB_USER=posadmin
DB_PASSWORD=YourSecurePassword123!
DB_HOST=pos-mysql-server.mysql.database.azure.com
DB_PORT=3306
DB_NAME=pos_system
DB_SSL_MODE=REQUIRED
ENVIRONMENT=production

# CORS設定（本番環境用）
ALLOWED_ORIGINS=https://your-frontend-domain.com,http://localhost:3000
```

## 📊 接続確認

### 接続テスト用スクリプト

```python
# test_azure_connection.py
import os
from dotenv import load_dotenv
import pymysql

load_dotenv()

try:
    connection = pymysql.connect(
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME'),
        port=int(os.getenv('DB_PORT')),
        ssl={'ssl_disabled': False},
        charset='utf8mb4'
    )
    
    with connection.cursor() as cursor:
        cursor.execute("SELECT VERSION()")
        version = cursor.fetchone()
        print(f"✅ Azure MySQL接続成功: {version[0]}")
        
    connection.close()
    
except Exception as e:
    print(f"❌ 接続エラー: {e}")
```

## 🔐 SSL証明書設定（必要に応じて）

```bash
# SSL証明書をダウンロード
curl -o backend/db_control/DigiCertGlobalRootG2.crt.pem \
  https://dl.cacerts.digicert.com/DigiCertGlobalRootG2.crt.pem
```

## 📋 次のステップ

1. Azure Database for MySQLインスタンス作成
2. 環境変数設定
3. 初期データ移行実行
4. 接続テスト
5. アプリケーションデプロイ 