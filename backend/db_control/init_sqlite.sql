-- POSシステム用初期データベースセットアップ（SQLite版）
-- JANコード形式13桁数字対応

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

-- 商品マスタテーブルの作成（JANコード形式13桁数字対応）
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_code VARCHAR(13) UNIQUE NOT NULL, -- JANコード形式13桁数字
    product_name VARCHAR(100) NOT NULL,
    price INTEGER NOT NULL, -- 税抜き価格
    tax_rate REAL NOT NULL DEFAULT 0.10, -- 消費税率（デフォルト10%）
    category VARCHAR(50), -- 商品カテゴリ
    is_local INTEGER NOT NULL DEFAULT 0 -- 地域商品フラグ（0: 通常商品, 1: 地域商品）
    -- 将来的にbarcodeカラムを追加予定（レベル2実装時）
    -- barcode VARCHAR(20) -- JANコード等のバーコード値
);

-- 購入履歴テーブルの作成
CREATE TABLE purchase_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total_amount INTEGER NOT NULL,
    purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 購入詳細テーブルの作成
CREATE TABLE purchase_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id INTEGER NOT NULL,
    product_code VARCHAR(13) NOT NULL,
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

-- サンプル商品データの投入（JANコード形式13桁・標準運用）
-- 文房具（49012345670XX）- 標準JANコード形式
INSERT INTO products (product_code, product_name, price, tax_rate, category, is_local) VALUES
('4901234567001', 'シャープペンシル（0.5mm）', 150, 0.10, '文房具', 0),
('4901234567002', '消しゴム（スリムタイプ）', 120, 0.10, '文房具', 0),
('4901234567003', 'ノートB5（横罫）', 250, 0.10, '文房具', 0),
('4901234567004', 'ボールペン（赤）', 180, 0.10, '文房具', 0),
('4901234567005', '蛍光ペンセット（5色）', 480, 0.10, '文房具', 0),
('4901234567006', '付箋セット（正方形・パステル）', 320, 0.10, '文房具', 0),
('4901234567007', 'ペンケース（メッシュタイプ）', 650, 0.10, '文房具', 0),
('4901234567008', 'A4クリアファイル（10枚セット）', 380, 0.10, '文房具', 0);

-- 地域限定商品（49012345671XX）- 地域商品識別
INSERT INTO products (product_code, product_name, price, tax_rate, category, is_local) VALUES
('4901234567101', '名古屋限定・しゃちほこ消しゴム', 200, 0.10, '文房具', 1),
('4901234567102', '大阪限定・たこ焼きメモ帳', 350, 0.10, '文房具', 1);

-- テスト用商品（99000000000XX）- テスト識別コード
INSERT INTO products (product_code, product_name, price, tax_rate, category, is_local) VALUES
('9900000000001', 'テスト商品A', 100, 0.10, 'テスト', 0),
('9900000000002', 'テスト商品B', 150, 0.08, 'テスト', 0),
('9900000000003', 'テスト商品C', 200, 0.10, 'テスト', 0); 