# POSシステム バックエンド デプロイガイド

## 概要
FastAPIベースのPOSシステムバックエンドのデプロイ手順です。

## 技術スタック
- **フレームワーク**: FastAPI 0.109.0
- **データベース**: Azure Database for MySQL
- **Python**: 3.10+
- **デプロイ先**: Azure App Service (推奨)

## 主要機能
- 商品検索（JANコード13桁対応）
- 購入処理（税率別計算）
- 購入履歴取得
- CORS対応（モバイルアクセス可能）

## デプロイ前の準備

### 1. 環境変数設定
以下の環境変数を設定してください：

```bash
# データベース接続
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_HOST=your_mysql_host.mysql.database.azure.com
DB_PORT=3306
DB_NAME=your_database_name

# CORS設定（本番環境では具体的なドメインを指定）
ALLOWED_ORIGINS=https://your-frontend-domain.com

# アプリケーション設定
ENVIRONMENT=production
```

### 2. 依存関係インストール
```bash
pip install -r requirements.txt
```

### 3. データベース初期化
アプリケーション起動時に自動的に以下が実行されます：
- テーブル作成
- サンプル商品データ投入（JANコード形式）

## Azure App Serviceデプロイ

### 1. Azure CLIでログイン
```bash
az login
```

### 2. リソースグループ作成
```bash
az group create --name pos-system-rg --location "Japan East"
```

### 3. App Serviceプラン作成
```bash
az appservice plan create --name pos-backend-plan --resource-group pos-system-rg --sku B1 --is-linux
```

### 4. Web App作成
```bash
az webapp create --resource-group pos-system-rg --plan pos-backend-plan --name pos-backend-app --runtime "PYTHON|3.10"
```

### 5. 環境変数設定
```bash
az webapp config appsettings set --resource-group pos-system-rg --name pos-backend-app --settings \
  DB_USER="your_mysql_username" \
  DB_PASSWORD="your_mysql_password" \
  DB_HOST="your_mysql_host.mysql.database.azure.com" \
  DB_PORT="3306" \
  DB_NAME="your_database_name" \
  ALLOWED_ORIGINS="https://your-frontend-domain.com"
```

### 6. デプロイ
```bash
az webapp deployment source config --resource-group pos-system-rg --name pos-backend-app --repo-url https://github.com/your-username/your-repo --branch main --manual-integration
```

## API エンドポイント

### 商品検索
```
GET /products/{product_code}
```

### 購入処理
```
POST /purchase
```

### 購入履歴
```
GET /purchase-history?limit=10
```

## ヘルスチェック
```
GET /
```

## セキュリティ設定
- CORS設定済み
- 環境変数による設定管理
- HTTPSリダイレクト推奨

## トラブルシューティング

### データベース接続エラー
1. Azure Database for MySQLのファイアウォール設定を確認
2. 接続文字列の確認
3. SSL証明書の確認

### CORS エラー
1. `ALLOWED_ORIGINS`環境変数の確認
2. フロントエンドドメインの正確性確認

## 監視・ログ
- Azure Application Insightsの設定推奨
- ログレベル設定
- パフォーマンス監視 