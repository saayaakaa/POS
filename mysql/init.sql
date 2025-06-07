-- POSシステム用初期データ

-- 商品マスタテーブルの作成
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_code TEXT UNIQUE NOT NULL,
    product_name TEXT NOT NULL,
    price INTEGER NOT NULL
);

-- 購入履歴テーブルの作成
CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total_amount INTEGER NOT NULL,
    purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 購入詳細テーブルの作成
CREATE TABLE IF NOT EXISTS purchase_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id INTEGER NOT NULL,
    product_code TEXT NOT NULL,
    product_name TEXT NOT NULL,
    price INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    FOREIGN KEY (purchase_id) REFERENCES purchases (id)
);

-- サンプル商品データの投入
INSERT OR REPLACE INTO products (product_code, product_name, price) VALUES
('P001', 'りんご', 150),
('P002', 'バナナ', 100),
('P003', 'オレンジ', 200),
('P004', 'ぶどう', 300),
('P005', 'いちご', 400),
('P006', 'パン', 120),
('P007', '牛乳', 180),
('P008', '卵', 250),
('P009', 'チーズ', 350),
('P010', 'ヨーグルト', 130),
('P011', 'お茶', 100),
('P012', 'コーヒー', 200),
('P013', 'ジュース', 150),
('P014', 'お米', 500),
('P015', '醤油', 300),
('P016', '味噌', 280),
('P017', '砂糖', 200),
('P018', '塩', 100),
('P019', '油', 250),
('P020', '酢', 180); 