# from mymodels import Base  # User, Comment
# from connect import engine

# import platform
# print(platform.uname())


# print("Creating tables >>> ")
# Base.metadata.create_all(bind=engine)


from db_control.mymodels import Base
from db_control.connect import engine
from sqlalchemy import inspect


def init_db():
    # インスペクターを作成
    inspector = inspect(engine)

    # 既存のテーブルを取得
    existing_tables = inspector.get_table_names()

    print("Checking tables...")
    print(f"Existing tables: {existing_tables}")

    # 必要なテーブルのリスト
    required_tables = ['customers', 'products', 'purchase_history', 'purchase_items']
    
    # いずれかのテーブルが存在しない場合は全テーブルを作成
    missing_tables = [table for table in required_tables if table not in existing_tables]
    
    if missing_tables:
        print(f"Missing tables: {missing_tables}")
        print("Creating all tables >>> ")
        try:
            Base.metadata.create_all(bind=engine)
            print("Tables created successfully!")
        except Exception as e:
            print(f"Error creating tables: {e}")
            raise
    else:
        print("All required tables already exist.")
    
    # 既存の商品テーブルに税率カラムが存在するかチェック
    if 'products' in existing_tables:
        try:
            from sqlalchemy import text
            # productsテーブルのカラム情報を取得
            columns = inspector.get_columns('products')
            column_names = [col['name'] for col in columns]
            
            # tax_rateカラムが存在しない場合は追加
            if 'tax_rate' not in column_names:
                print("税率カラムを追加中...")
                with engine.connect() as conn:
                    # tax_rateカラムを追加（デフォルト値10%）
                    conn.execute(text("ALTER TABLE products ADD COLUMN tax_rate FLOAT NOT NULL DEFAULT 0.10"))
                    conn.commit()
                    print("税率カラムを追加しました")
            else:
                print("税率カラムは既に存在します")
                
            # categoryカラムが存在しない場合は追加
            if 'category' not in column_names:
                print("カテゴリカラムを追加中...")
                with engine.connect() as conn:
                    conn.execute(text("ALTER TABLE products ADD COLUMN category VARCHAR(50)"))
                    conn.commit()
                    print("カテゴリカラムを追加しました")
            else:
                print("カテゴリカラムは既に存在します")
                
            # is_localカラムが存在しない場合は追加
            if 'is_local' not in column_names:
                print("地域商品フラグカラムを追加中...")
                with engine.connect() as conn:
                    conn.execute(text("ALTER TABLE products ADD COLUMN is_local INTEGER NOT NULL DEFAULT 0"))
                    conn.commit()
                    print("地域商品フラグカラムを追加しました")
            else:
                print("地域商品フラグカラムは既に存在します")
                
        except Exception as e:
            print(f"カラム追加エラー: {e}")
            # エラーが発生してもアプリケーションは継続


if __name__ == "__main__":
    init_db()
