# Azure Database for MySQL を使用したPOSシステム デプロイメントガイド

## 概要
このガイドでは、Azure Database for MySQLを使用してPOSシステムをAzureにデプロイする手順を説明します。

## 前提条件
- Azureアカウント
- Azure CLI または Azureポータルへのアクセス
- Git
- Node.js 18以上
- Python 3.8以上

## 1. Azure Database for MySQLの作成

### 1.1 Azureポータルでの作成
1. [Azureポータル](https://portal.azure.com)にログイン
2. 「リソースの作成」→「データベース」→「Azure Database for MySQL」を選択
3. 以下の設定で作成：
   - **サーバー名**: `pos-system-mysql-server`
   - **管理者ユーザー名**: `posadmin`
   - **パスワード**: 強力なパスワード（記録しておく）
   - **場所**: Japan East
   - **バージョン**: MySQL 8.0
   - **価格レベル**: Basic または General Purpose

### 1.2 ファイアウォール設定
1. 作成したMySQLサーバーのリソースページに移動
2. 「接続のセキュリティ」を選択
3. 「Azureサービスへのアクセスを許可」を有効化
4. 開発環境からアクセスする場合は、クライアントIPアドレスを追加

### 1.3 データベースの作成
1. MySQLサーバーに接続
2. `pos_system`データベースを作成：
```sql
CREATE DATABASE pos_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 2. 環境変数の設定

### 2.1 バックエンド用環境変数ファイル
`backend/.env`ファイルを作成：

```env
# POSシステム環境変数設定（Azure Database for MySQL用）

# データベース設定（Azure Database for MySQL）
DB_USER=posadmin
DB_PASSWORD=your-strong-password-here
DB_HOST=pos-system-mysql-server.mysql.database.azure.com
DB_PORT=3306
DB_NAME=pos_system

# 本番環境フラグ
ENVIRONMENT=production

# CORS設定（フロントエンドのドメインに合わせて変更）
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain.com

# ログレベル
LOG_LEVEL=info

# SSL設定（Azure Database for MySQLでは必須）
DB_SSL_MODE=REQUIRED
```

## 3. データベースの初期化

### 3.1 テーブルとサンプルデータの作成
```bash
# バックエンドディレクトリに移動
cd backend

# 依存関係のインストール
pip install -r requirements.txt

# データベース初期化
python -c "from db_control.create_tables import init_db; init_db()"

# サンプルデータの投入
python -c "from db_control import crud; crud.init_sample_products()"
```

### 3.2 データベース接続テスト
```bash
python test_db_connection.py
```

## 4. Azure App Serviceでのデプロイ

### 4.1 バックエンドのデプロイ
1. Azure App Serviceを作成（Python 3.8以上）
2. 環境変数を設定：
   - `DB_USER`: posadmin
   - `DB_PASSWORD`: MySQLパスワード
   - `DB_HOST`: pos-system-mysql-server.mysql.database.azure.com
   - `DB_PORT`: 3306
   - `DB_NAME`: pos_system
   - `ENVIRONMENT`: production
   - `DB_SSL_MODE`: REQUIRED

3. デプロイコマンド：
```bash
# Azure CLIでログイン
az login

# App Serviceにデプロイ
az webapp up --name pos-system-backend --resource-group your-resource-group --runtime "PYTHON:3.8"
```

### 4.2 フロントエンドのデプロイ
1. Azure Static Web Appsまたは別のApp Serviceを作成
2. 環境変数でバックエンドAPIのURLを設定
3. ビルドとデプロイ：
```bash
cd frontend
npm install
npm run build
```

## 5. セキュリティ設定

### 5.1 SSL/TLS設定
- Azure Database for MySQLは自動的にSSL/TLSを有効化
- アプリケーションでSSL接続を強制

### 5.2 ネットワークセキュリティ
- Virtual Network (VNet) の使用を検討
- Private Endpointの設定（高セキュリティ要件の場合）

### 5.3 認証・認可
- Azure Active Directory統合の検討
- API Keyまたはトークンベース認証の実装

## 6. 監視とメンテナンス

### 6.1 Azure Monitor設定
- データベースパフォーマンスの監視
- アプリケーションログの収集
- アラートの設定

### 6.2 バックアップ設定
- Azure Database for MySQLの自動バックアップ確認
- Point-in-time復元の設定

### 6.3 スケーリング
- データベースのスケールアップ/ダウン
- App Serviceのオートスケール設定

## 7. トラブルシューティング

### 7.1 接続エラー
```bash
# 接続テスト
python test_db_connection.py

# ファイアウォール設定確認
# Azureポータルで「接続のセキュリティ」を確認
```

### 7.2 SSL証明書エラー
- `DB_SSL_MODE=REQUIRED`が設定されているか確認
- Azure Database for MySQLのSSL証明書が最新か確認

### 7.3 パフォーマンス問題
- データベースのメトリクス確認
- インデックスの最適化
- 接続プールの調整

## 8. コスト最適化

### 8.1 データベース
- 適切な価格レベルの選択
- 使用量に応じたスケーリング
- 開発環境での自動停止設定

### 8.2 App Service
- 適切なプランの選択
- 開発環境での自動停止
- リソースの共有

## 参考リンク
- [Azure Database for MySQL ドキュメント](https://docs.microsoft.com/ja-jp/azure/mysql/)
- [Azure App Service ドキュメント](https://docs.microsoft.com/ja-jp/azure/app-service/)
- [Azure Static Web Apps ドキュメント](https://docs.microsoft.com/ja-jp/azure/static-web-apps/) 