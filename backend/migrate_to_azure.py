#!/usr/bin/env python3
"""
Azure Database for MySQL データ移行スクリプト
ローカルの初期データをAzure Database for MySQLに移行します
"""

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
import pymysql

# プロジェクトルートをパスに追加
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db_control.create_tables import init_db
from db_control.crud import init_sample_products

def test_azure_connection():
    """Azure Database for MySQL接続テスト"""
    load_dotenv()
    
    # 環境変数の確認
    required_vars = ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT', 'DB_NAME']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"❌ 必要な環境変数が設定されていません: {missing_vars}")
        print("📝 .envファイルに以下の設定を追加してください:")
        print("""
DB_USER=your-mysql-username
DB_PASSWORD=your-mysql-password
DB_HOST=your-server-name.mysql.database.azure.com
DB_PORT=3306
DB_NAME=pos_system
DB_SSL_MODE=REQUIRED
ENVIRONMENT=production
        """)
        return False
    
    try:
        # PyMySQLで直接接続テスト
        connection = pymysql.connect(
            host=os.getenv('DB_HOST'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            database=os.getenv('DB_NAME'),
            port=int(os.getenv('DB_PORT')),
            ssl={'ssl_disabled': False},
            charset='utf8mb4'
        )
        
        with connection.cursor() as cursor:
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()
            print(f"✅ Azure MySQL接続成功")
            print(f"📊 MySQLバージョン: {version[0]}")
            
        connection.close()
        return True
        
    except Exception as e:
        print(f"❌ Azure MySQL接続エラー: {e}")
        print("\n🔧 トラブルシューティング:")
        print("1. Azure Database for MySQLインスタンスが作成されているか確認")
        print("2. ファイアウォール設定でIPアドレスが許可されているか確認")
        print("3. 接続情報（ホスト名、ユーザー名、パスワード）が正しいか確認")
        return False

def migrate_data():
    """データ移行を実行"""
    print("🚀 Azure Database for MySQLへのデータ移行を開始します...")
    
    # 接続テスト
    if not test_azure_connection():
        return False
    
    try:
        # テーブル作成
        print("\n📋 テーブル構造を作成中...")
        init_db()
        print("✅ テーブル作成完了")
        
        # サンプルデータ投入
        print("\n📦 初期データを投入中...")
        init_sample_products()
        print("✅ 初期データ投入完了")
        
        # データ確認
        print("\n📊 移行結果を確認中...")
        from db_control.connect import engine
        
        with engine.connect() as conn:
            # 商品数確認
            result = conn.execute(text("SELECT COUNT(*) as count FROM products"))
            product_count = result.fetchone()[0]
            print(f"📦 商品データ: {product_count}件")
            
            # テーブル一覧確認
            result = conn.execute(text("SHOW TABLES"))
            tables = [row[0] for row in result.fetchall()]
            print(f"📋 作成されたテーブル: {', '.join(tables)}")
        
        print("\n🎉 Azure Database for MySQLへのデータ移行が完了しました！")
        return True
        
    except Exception as e:
        print(f"❌ データ移行エラー: {e}")
        return False

def verify_migration():
    """移行結果の詳細確認"""
    print("\n🔍 移行結果の詳細確認...")
    
    try:
        from db_control.connect import engine
        
        with engine.connect() as conn:
            # 商品データサンプル表示
            result = conn.execute(text("""
                SELECT product_code, product_name, price, tax_rate, category, is_local 
                FROM products 
                LIMIT 5
            """))
            
            print("\n📦 商品データサンプル:")
            print("コード\t\t商品名\t\t\t価格\t税率\tカテゴリ\t地域商品")
            print("-" * 80)
            
            for row in result.fetchall():
                local_flag = "✓" if row[5] else ""
                print(f"{row[0]}\t{row[1][:20]:<20}\t{row[2]}円\t{int(row[3]*100)}%\t{row[4]}\t{local_flag}")
            
            # カテゴリ別集計
            result = conn.execute(text("""
                SELECT category, COUNT(*) as count, AVG(price) as avg_price
                FROM products 
                GROUP BY category
            """))
            
            print("\n📊 カテゴリ別集計:")
            print("カテゴリ\t\t商品数\t平均価格")
            print("-" * 40)
            
            for row in result.fetchall():
                print(f"{row[0]}\t\t{row[1]}件\t{int(row[2])}円")
        
        return True
        
    except Exception as e:
        print(f"❌ 確認エラー: {e}")
        return False

def main():
    """メイン処理"""
    print("=" * 60)
    print("🌟 Azure Database for MySQL データ移行ツール")
    print("=" * 60)
    
    # 移行実行
    if migrate_data():
        # 詳細確認
        verify_migration()
        
        print("\n✨ 移行完了！次のステップ:")
        print("1. フロントエンドアプリケーションの動作確認")
        print("2. APIエンドポイントのテスト")
        print("3. 本番環境へのデプロイ")
        
    else:
        print("\n❌ 移行に失敗しました。エラーを確認して再実行してください。")
        sys.exit(1)

if __name__ == "__main__":
    main() 