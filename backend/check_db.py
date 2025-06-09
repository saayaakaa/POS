#!/usr/bin/env python3
"""
データベースの中身を確認するスクリプト
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db_control.connect import engine
from sqlalchemy import text, inspect
import pandas as pd

def check_database():
    """データベースの構造とデータを確認"""
    
    print('=' * 60)
    print('POSシステム データベース確認')
    print('=' * 60)
    
    # データベース接続確認
    print('\n=== データベース接続確認 ===')
    try:
        with engine.connect() as conn:
            result = conn.execute(text('SELECT 1'))
            print('✅ データベース接続成功')
    except Exception as e:
        print(f'❌ データベース接続エラー: {e}')
        return False

    # テーブル一覧の確認
    print('\n=== テーブル一覧 ===')
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f'テーブル数: {len(tables)}')
    for table in tables:
        print(f'- {table}')

    if not tables:
        print('⚠️  テーブルが存在しません。データベースを初期化してください。')
        return False

    # 各テーブルの構造とデータを確認
    for table in tables:
        print(f'\n{"=" * 50}')
        print(f'{table} テーブル')
        print(f'{"=" * 50}')
        
        # テーブル構造
        columns = inspector.get_columns(table)
        print('\n📋 カラム構造:')
        for col in columns:
            nullable = 'NULL' if col['nullable'] else 'NOT NULL'
            default = f' DEFAULT {col["default"]}' if col.get('default') else ''
            print(f'  - {col["name"]}: {col["type"]} {nullable}{default}')
        
        # データ件数
        try:
            with engine.connect() as conn:
                count_result = conn.execute(text(f'SELECT COUNT(*) as count FROM {table}'))
                count = count_result.fetchone()[0]
                print(f'\n📊 データ件数: {count}件')
                
                # データサンプル（最大10件）
                if count > 0:
                    sample_result = conn.execute(text(f'SELECT * FROM {table} LIMIT 10'))
                    df = pd.DataFrame(sample_result.fetchall(), columns=sample_result.keys())
                    print('\n📄 データサンプル:')
                    print(df.to_string(index=False, max_colwidth=30))
                else:
                    print('📭 データが登録されていません')
                    
        except Exception as e:
            print(f'❌ データ取得エラー: {e}')

    # 商品データの詳細確認
    print(f'\n{"=" * 50}')
    print('商品データ詳細分析')
    print(f'{"=" * 50}')
    
    try:
        with engine.connect() as conn:
            # 税率別商品数
            tax_result = conn.execute(text('''
                SELECT tax_rate, COUNT(*) as count 
                FROM products 
                GROUP BY tax_rate 
                ORDER BY tax_rate
            '''))
            print('\n📈 税率別商品数:')
            for row in tax_result:
                print(f'  - {int(row[0]*100)}%: {row[1]}件')
            
            # カテゴリ別商品数
            category_result = conn.execute(text('''
                SELECT category, COUNT(*) as count 
                FROM products 
                GROUP BY category 
                ORDER BY count DESC
            '''))
            print('\n📂 カテゴリ別商品数:')
            for row in category_result:
                print(f'  - {row[0] or "未分類"}: {row[1]}件')
            
            # 地域商品の確認
            local_result = conn.execute(text('''
                SELECT is_local, COUNT(*) as count 
                FROM products 
                GROUP BY is_local
            '''))
            print('\n🌍 商品種別:')
            for row in local_result:
                product_type = "地域限定商品" if row[0] == 1 else "通常商品"
                print(f'  - {product_type}: {row[1]}件')
                
    except Exception as e:
        print(f'❌ 商品データ分析エラー: {e}')

    print(f'\n{"=" * 60}')
    print('データベース確認完了')
    print(f'{"=" * 60}')
    
    return True

def initialize_database():
    """データベースを初期化"""
    print('データベースを初期化しています...')
    
    try:
        from db_control.create_tables import init_db
        from db_control.crud import init_sample_products
        
        # テーブル作成
        init_db()
        
        # サンプルデータ投入
        init_sample_products()
        
        print('✅ データベース初期化完了')
        return True
        
    except Exception as e:
        print(f'❌ データベース初期化エラー: {e}')
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == '--init':
        # 初期化モード
        if initialize_database():
            check_database()
    else:
        # 確認モード
        success = check_database()
        if not success:
            print('\n💡 データベースを初期化するには以下のコマンドを実行してください:')
            print('python check_db.py --init') 