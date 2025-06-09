# 📦 POSシステム デプロイガイド

## 🚀 プロジェクト概要

**TECHONE STATIONERY POS System**
- **フロントエンド**: Next.js 15 + TypeScript + Tailwind CSS
- **バックエンド**: FastAPI + Python 3.11
- **データベース**: SQLite (開発) / MySQL (本番)
- **特殊機能**: バーコードスキャナー (ZXing)

## 📁 プロジェクト構造

```
POS/
├── frontend/                 # Next.jsフロントエンド
│   ├── components/          # Reactコンポーネント
│   │   ├── BarcodeScanner.tsx    # バーコードスキャナー
│   │   └── ProductInput.tsx      # 商品入力
│   ├── pages/               # ページコンポーネント
│   │   └── search.tsx       # メインPOSページ
│   ├── types/               # TypeScript型定義
│   └── scripts/             # 開発用スクリプト
├── backend/                 # FastAPIバックエンド
│   ├── app.py              # メインアプリケーション
│   ├── db_control/         # データベース制御
│   └── requirements.txt    # Python依存関係
└── BARCODE_SCANNER_README.md # バーコード機能詳細
```

## 🔧 ローカル開発環境

### 1. 依存関係のインストール

**フロントエンド**:
```bash
cd frontend
npm install
```

**バックエンド**:
```bash
cd backend
pip install -r requirements.txt
```

### 2. サーバー起動

**バックエンド** (ポート8000):
```bash
cd backend
python app.py
```

**フロントエンド** (ポート3000):
```bash
cd frontend
npm run dev
```

### 3. アクセス方法

- **PC**: http://localhost:3000/search
- **モバイル**: http://192.168.11.12:3000/search
- **HTTPS**: `npm run dev:https` (証明書生成後)

## 🌐 本番デプロイ

### Azure Static Web Apps + Azure App Service

#### フロントエンド (Azure Static Web Apps)

1. **ビルド設定**:
```yaml
# .github/workflows/azure-static-web-apps.yml
build_and_deploy_job:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - name: Build And Deploy
      uses: Azure/static-web-apps-deploy@v1
      with:
        app_location: "/frontend"
        output_location: "out"
        app_build_command: "npm run build && npm run export"
```

2. **環境変数**:
```bash
NEXT_PUBLIC_API_URL=https://your-backend.azurewebsites.net
```

#### バックエンド (Azure App Service)

1. **startup.py** (Azure用):
```python
import os
from app import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port)
```

2. **環境変数**:
```bash
ENVIRONMENT=production
MYSQL_HOST=your-mysql-server.mysql.database.azure.com
MYSQL_USER=your-username
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=pos_system
ALLOWED_ORIGINS=https://your-frontend-domain.azurestaticapps.net
```

## 📱 バーコードスキャナー機能

### 技術仕様
- **ライブラリ**: ZXing (@zxing/library, @zxing/browser)
- **対応形式**: JANコード13桁
- **カメラAPI**: MediaDevices.getUserMedia()
- **HTTPS要件**: モバイルブラウザで必須

### 対応ブラウザ
- Chrome 53+ (推奨)
- Safari 11+
- Firefox 36+
- Edge 12+

### HTTPS設定 (開発環境)
```bash
cd frontend
./scripts/generate-cert.sh
npm run dev:https
```

## 🗄️ データベース

### 開発環境 (SQLite)
- **ファイル**: `backend/db_control/pos_system.db`
- **自動初期化**: サーバー起動時に商品マスタを自動作成

### 本番環境 (MySQL)
```sql
-- 必要なテーブル
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_code VARCHAR(13) UNIQUE NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    price INT NOT NULL,
    tax_rate DECIMAL(3,2) DEFAULT 0.10,
    category VARCHAR(100),
    is_local BOOLEAN DEFAULT FALSE
);

CREATE TABLE purchase_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total_amount INT NOT NULL,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT,
    product_code VARCHAR(13),
    quantity INT NOT NULL,
    unit_price INT NOT NULL,
    FOREIGN KEY (purchase_id) REFERENCES purchase_history(id)
);
```

## 🧪 テスト用データ

### 商品コード (JANコード13桁)
```
4901234567001 - シャープペンシル（0.5mm） - ¥150
4901234567002 - 消しゴム（スリムタイプ） - ¥120
4901234567003 - ノートB5（横罫） - ¥250
4901234567101 - 名古屋限定・しゃちほこ消しゴム - ¥200
4901234567102 - 大阪限定・たこ焼きメモ帳 - ¥350
```

## 🔒 セキュリティ

### CORS設定
```python
# 本番環境
ALLOWED_ORIGINS = [
    "https://your-frontend-domain.azurestaticapps.net",
    "https://your-custom-domain.com"
]

# 開発環境
ALLOWED_ORIGINS = ["*"]  # 開発時のみ
```

### HTTPS要件
- **本番環境**: 必須 (Azure自動対応)
- **開発環境**: モバイルテスト時のみ必要

## 📊 パフォーマンス

### フロントエンド最適化
- Next.js 15の最新機能活用
- 静的生成 (SSG) 対応
- 画像最適化
- コード分割

### バックエンド最適化
- FastAPIの非同期処理
- SQLAlchemyのクエリ最適化
- レスポンスキャッシュ

## 🚨 トラブルシューティング

### よくある問題

1. **バーコードスキャナーが動作しない**
   - HTTPS接続を確認
   - カメラ権限を確認
   - 対応ブラウザを確認

2. **API通信エラー**
   - CORS設定を確認
   - 環境変数を確認
   - ネットワーク接続を確認

3. **データベース接続エラー**
   - MySQL環境変数を確認
   - SQLiteファイルの権限を確認

## 📞 サポート

### 開発環境
- **フロントエンド**: http://localhost:3000
- **バックエンド**: http://localhost:8000
- **API仕様**: http://localhost:8000/docs

### 本番環境
- **フロントエンド**: https://your-app.azurestaticapps.net
- **バックエンド**: https://your-api.azurewebsites.net
- **監視**: Azure Application Insights

---

**最終更新**: 2025年6月9日
**バージョン**: v2.0 (バーコードスキャナー対応) 