# POSシステム バックエンド

Flask を使用したPOSシステムのバックエンドAPIです。

## 機能

- 商品管理（CRUD操作）
- 売上管理
- バーコードスキャン対応
- Azure Database for MySQL対応

## セットアップ

### 1. 依存関係のインストール

```bash
pip install -r requirements.txt
```

### 2. 環境変数の設定

`.env`ファイルを作成して、以下の環境変数を設定してください：

```bash
# 開発環境用
cp env.example .env
```

または

```bash
# Azure本番環境用
cp env.azure.example .env
```

### 3. データベースの設定

#### ローカル開発環境の場合

```bash
# MySQLサーバーを起動
# データベースを作成
mysql -u root -p
CREATE DATABASE pos_system;
```

#### Azure Database for MySQL の場合

1. Azureポータルでデータベースを作成
2. `.env`ファイルの接続情報を更新
3. SSL接続を有効化

### 4. データベースマイグレーション

```bash
python check_db.py
```

### 5. アプリケーションの起動

```bash
# 開発環境
python app.py

# または
flask run
```

## API エンドポイント

- `GET /api/products` - 商品一覧取得
- `POST /api/products` - 商品追加
- `PUT /api/products/<id>` - 商品更新
- `DELETE /api/products/<id>` - 商品削除
- `POST /api/sales` - 売上記録
- `GET /api/sales` - 売上履歴取得

## デプロイ

### Azure App Service へのデプロイ

詳細は `DEPLOYMENT.md` を参照してください。

## 環境変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| DB_USER | データベースユーザー名 | posadmin |
| DB_PASSWORD | データベースパスワード | YourSecurePassword123! |
| DB_HOST | データベースホスト | localhost |
| DB_PORT | データベースポート | 3306 |
| DB_NAME | データベース名 | pos_system |
| ENVIRONMENT | 環境設定 | development/production |
| ALLOWED_ORIGINS | CORS許可オリジン | http://localhost:3000 |
| LOG_LEVEL | ログレベル | debug/info |
| DB_SSL_MODE | SSL設定 | DISABLED/REQUIRED |

## 開発

### ローカル開発環境の起動

```bash
# 仮想環境の作成
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係のインストール
pip install -r requirements.txt

# 環境変数の設定
cp env.example .env
# .envファイルを編集

# アプリケーションの起動
python app.py
```

### データベースの確認

```bash
python check_db.py
```

## トラブルシューティング

### データベース接続エラー

1. `.env`ファイルの設定を確認
2. データベースサーバーが起動しているか確認
3. ネットワーク接続を確認

### CORS エラー

`ALLOWED_ORIGINS`環境変数にフロントエンドのURLを追加してください。 