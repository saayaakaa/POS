# POSシステム フロントエンド

Next.js と TypeScript を使用したPOSシステムのフロントエンドアプリケーションです。

## 機能

- 商品検索（JANコード13桁対応）
- バーコードスキャン機能
- カート管理
- 購入処理
- 購入履歴表示
- レスポンシブデザイン（モバイル対応）

## 技術スタック

- **フレームワーク**: Next.js 15
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS + DaisyUI
- **バーコードスキャン**: @zxing/browser, @zxing/library
- **状態管理**: React Hooks

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成して、バックエンドAPIのURLを設定してください：

```bash
# 本番環境用（Azure App Service）
cp env.example .env.local
```

`.env.local`ファイルの内容：
```bash
# バックエンドAPI URL
NEXT_PUBLIC_API_URL=https://your-backend-app.azurewebsites.net

# 開発環境用（ローカル開発時）
# NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは http://localhost:3000 で起動します。

### 4. 本番ビルド

```bash
npm run build
npm start
```

## 主要ページ

### `/search` - 商品検索・購入ページ
- JANコード手入力による商品検索
- バーコードスキャン機能
- カート管理
- 購入処理
- 購入履歴表示

### `/cart` - カート確認ページ
- カート内容の確認・編集
- 購入処理
- 購入履歴表示

## バーコードスキャン機能

### 対応ブラウザ
- Chrome (推奨)
- Firefox
- Safari (iOS 11+)
- Edge

### 使用方法
1. 「バーコードをスキャン」ボタンをクリック
2. カメラへのアクセスを許可
3. バーコードをカメラに向ける
4. 自動的に商品検索が実行される

### 注意事項
- HTTPS環境でのみ動作（本番環境）
- カメラへのアクセス許可が必要
- 十分な照明が必要

## API連携

### バックエンドAPI
- **商品検索**: `GET /products/{product_code}`
- **購入処理**: `POST /purchase`
- **購入履歴**: `GET /purchase-history`

### エラーハンドリング
- ネットワークエラー
- タイムアウト（10-15秒）
- 商品未発見（404）
- サーバーエラー（5xx）

## 環境変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| NEXT_PUBLIC_API_URL | バックエンドAPIのベースURL | https://app-step4-21.azurewebsites.net |

## デプロイ

### Azure App Service へのデプロイ

1. **Azure App Serviceリソースの作成**
   ```bash
   # Azure CLIでApp Serviceを作成
   az webapp create --resource-group myResourceGroup --plan myAppServicePlan --name myPOSFrontend --runtime "NODE|18-lts"
   ```

2. **GitHubリポジトリとの連携**
   - Azure PortalでApp Serviceを開く
   - 「デプロイメント センター」を選択
   - GitHubを選択してリポジトリを接続

3. **環境変数の設定**
   - Azure Portalで「構成」→「アプリケーション設定」
   - 新しいアプリケーション設定を追加：
     - 名前: `NEXT_PUBLIC_API_URL`
     - 値: `https://app-step4-21.azurewebsites.net`

4. **デプロイ設定ファイル**
   - `.deployment` - デプロイ設定
   - `deploy.cmd` - デプロイスクリプト
   - `web.config` - IISルーティング設定

### Azure Static Web Apps へのデプロイ

1. Azure Static Web Appsリソースを作成
2. GitHubリポジトリを接続
3. ビルド設定を構成：
   ```yaml
   app_location: "/"
   api_location: ""
   output_location: "out"
   ```
4. 環境変数を設定

### Vercel へのデプロイ

1. GitHubリポジトリをVercelに接続
2. 環境変数 `NEXT_PUBLIC_API_URL` を設定
3. 自動デプロイが実行される

### その他のプラットフォーム

- Netlify
- AWS Amplify
- Firebase Hosting

## 開発

### ローカル開発環境の起動

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp env.example .env.local
# .env.localファイルを編集

# 開発サーバーの起動
npm run dev
```

### ビルドとテスト

```bash
# 本番ビルド
npm run build

# 本番サーバーの起動
npm start

# 型チェック
npm run lint
```

## トラブルシューティング

### バーコードスキャンが動作しない
1. HTTPS環境で実行しているか確認
2. カメラへのアクセス許可を確認
3. ブラウザの対応状況を確認

### API接続エラー
1. `NEXT_PUBLIC_API_URL`の設定を確認
2. バックエンドサーバーの稼働状況を確認
3. CORS設定を確認

### ビルドエラー
1. Node.jsのバージョンを確認（推奨: 18.x以上）
2. 依存関係を再インストール：`rm -rf node_modules package-lock.json && npm install`

### Azure App Service デプロイエラー
1. Node.jsバージョンの確認（Azure App Serviceで18.x LTSを使用）
2. ビルドログの確認（Azure Portal > App Service > ログストリーム）
3. 環境変数の設定確認
4. デプロイスクリプトの実行権限確認

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
