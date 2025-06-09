#SQlite

# from sqlalchemy import create_engine
# # import sqlalchemy

# import os
# # uname() error回避
# import platform
# print("platform:", platform.uname())


# main_path = os.path.dirname(os.path.abspath(__file__))
# path = os.chdir(main_path)
# print("path:", path)
# engine = create_engine("sqlite:///CRM.db", echo=True)



#MySQl
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

# 環境変数の読み込み
load_dotenv()

# データベース接続情報
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_HOST = os.getenv('DB_HOST')
DB_PORT = os.getenv('DB_PORT')
DB_NAME = os.getenv('DB_NAME')
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')

print(f"環境: {ENVIRONMENT}")

# データベース接続の設定
try:
    # 本番環境またはMySQL環境変数が適切に設定されている場合
    if (ENVIRONMENT == 'production' or 
        (all([DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME]) and 
         all([var.strip() for var in [DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME]]) and 
         not any(['your-' in str(var) for var in [DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME]]))):
        
        DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        engine = create_engine(
            DATABASE_URL,
            echo=False,  # 本番環境ではログを抑制
            pool_pre_ping=True,
            pool_recycle=3600,
            pool_size=10,
            max_overflow=20
        )
        print(f"MySQL接続を使用します: {DB_HOST}")
        
        # 接続テスト
        with engine.connect() as conn:
            result = conn.execute("SELECT 1")
            print("MySQL接続テスト成功")
    else:
        raise ValueError("MySQL環境変数が設定されていないか無効です")
        
except Exception as e:
    # MySQLに接続できない場合はSQLiteにフォールバック
    print(f"MySQL接続エラー: {e}")
    print("SQLiteにフォールバック（開発環境用）")
    
    # SQLiteデータベースファイルのパス
    main_path = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(main_path, "pos_system.db")
    
    engine = create_engine(
        f"sqlite:///{db_path}", 
        echo=True if ENVIRONMENT == 'development' else False
    )
    print(f"SQLiteデータベース: {db_path}")
    
    # SQLiteファイルが存在しない場合の警告
    if not os.path.exists(db_path):
        print("⚠️  警告: SQLiteデータベースファイルが存在しません")
        print("初期化スクリプトを実行してください: sqlite3 pos_system.db < init_sqlite.sql")