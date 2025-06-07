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

# MySQLのURL構築
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# エンジンの作成
engine = create_engine(
    DATABASE_URL,
    echo=True,
    pool_pre_ping=True,
    pool_recycle=3600
)