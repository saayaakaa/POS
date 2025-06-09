-- POSシステム用初期データベースセットアップ
-- バーコードスキャン対応を前提とした設計

-- 既存テーブルの削除（クリーンセットアップ）
DROP TABLE IF EXISTS purchase_items;
DROP TABLE IF EXISTS purchase_history;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;

-- 顧客マスタテーブルの作成（既存システム互換性のため）
CREATE TABLE customers (
    customer_id VARCHAR(10) PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(10) NOT NULL
);

-- 商品マスタテーブルの作成（バーコード対応）
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    product_code VARCHAR(100) UNIQUE NOT NULL COMMENT 'バーコード対応：JANコード13桁や独自コードに対応',
    product_name VARCHAR(100) NOT NULL,
    price INTEGER NOT NULL COMMENT '税抜き価格',
    tax_rate FLOAT NOT NULL DEFAULT 0.10 COMMENT '消費税率（デフォルト10%）',
    category VARCHAR(50) COMMENT '商品カテゴリ',
    is_local INTEGER NOT NULL DEFAULT 0 COMMENT '地域商品フラグ（0: 通常商品, 1: 地域商品）'
    -- 将来的にbarcodeカラムを追加予定（レベル2実装時）
    -- barcode VARCHAR(20) COMMENT 'JANコード等のバーコード値'
);

-- 購入履歴テーブルの作成
CREATE TABLE purchase_history (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    total_amount INTEGER NOT NULL,
    purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 購入詳細テーブルの作成
CREATE TABLE purchase_items (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    purchase_id INTEGER NOT NULL,
    product_code VARCHAR(100) NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    price INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    FOREIGN KEY (purchase_id) REFERENCES purchase_history (id),
    FOREIGN KEY (product_code) REFERENCES products (product_code)
);

-- インデックスの作成（検索性能向上）
CREATE INDEX idx_products_code ON products(product_code);
CREATE INDEX idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_product_code ON purchase_items(product_code);

-- サンプル商品データの投入（バーコード対応商品コード）
-- 通常商品（TWN-xxx）
INSERT INTO products (product_code, product_name, price, tax_rate, category, is_local) VALUES
('TWN-001', 'ジェットストリームボールペン（黒）', 200, 0.10, '文房具', 0),
('TWN-002', 'ノートA5（方眼）', 300, 0.10, '文房具', 0),
('TWN-003', 'フリクション蛍光ペンセット', 500, 0.10, '文房具', 0),
('TWN-004', 'ワイヤレスプレゼンリモコン', 2500, 0.10, '設備用品', 0),
('TWN-005', 'テクワン・カフェブレンド（ドリップバッグ）', 180, 0.08, '飲料', 0);

-- 地域限定商品（LOC-xxx）
INSERT INTO products (product_code, product_name, price, tax_rate, category, is_local) VALUES
('LOC-001', '名古屋限定・ういろう風もちグミ', 220, 0.08, '食品', 1),
('LOC-002', '北海道限定・じゃがバターあられ', 280, 0.08, '食品', 1),
('LOC-003', '京都限定・抹茶ノートセット', 650, 0.10, '文房具', 1),
('LOC-004', '大阪限定・たこ焼き風ふせん', 400, 0.10, '文房具', 1),
('LOC-005', '沖縄限定・さんぴん茶ペットボトル', 160, 0.08, '飲料', 1);

-- バーコードテスト用商品（JANコード形式）
INSERT INTO products (product_code, product_name, price, tax_rate, category, is_local) VALUES
('4901234567890', 'テスト商品A（JANコード）', 100, 0.10, 'テスト', 0),
('4901234567891', 'テスト商品B（JANコード）', 150, 0.08, 'テスト', 0),
('4901234567892', 'テスト商品C（JANコード）', 200, 0.10, 'テスト', 0);

-- 初期化完了メッセージ
SELECT 'POSシステム初期データベースセットアップ完了' AS message;
SELECT 'バーコードスキャン対応設計' AS design_note;
SELECT COUNT(*) AS total_products FROM products; 