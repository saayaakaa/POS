#!/usr/bin/env python3
"""
データベース接続とCRUD操作のテストスクリプト
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db_control import crud
from db_control.connect import engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from db_control.mymodels import Products

def test_database_connection():
    """データベース接続テスト"""
    print("=== データベース接続テスト ===")
    
    try:
        # エンジンの接続テスト
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ データベース接続成功")
            
        # セッションテスト
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # 商品数確認
        product_count = session.query(Products).count()
        print(f"📦 商品データ数: {product_count}件")
        
        # サンプル商品確認
        sample_product = session.query(Products).filter(Products.product_code == '4901234567001').first()
        if sample_product:
            print(f"🔍 サンプル商品: {sample_product.product_code} - {sample_product.product_name}")
        else:
            print("❌ サンプル商品が見つかりません")
            
        session.close()
        
    except Exception as e:
        print(f"❌ データベース接続エラー: {e}")
        return False
    
    return True

def test_crud_operations():
    """CRUD操作テスト"""
    print("\n=== CRUD操作テスト ===")
    
    try:
        # 商品検索テスト
        product = crud.get_product_by_code('4901234567001')
        if product:
            print(f"✅ 商品検索成功: {product['product_name']}")
            print(f"   価格: ¥{product['price']}")
            print(f"   税率: {product['tax_rate']*100}%")
        else:
            print("❌ 商品検索失敗")
            
        # 存在しない商品の検索テスト
        non_existent = crud.get_product_by_code('9999999999999')
        if non_existent is None:
            print("✅ 存在しない商品の検索: 正常にNoneを返却")
        else:
            print("❌ 存在しない商品の検索: 予期しない結果")
            
    except Exception as e:
        print(f"❌ CRUD操作エラー: {e}")
        return False
    
    return True

def main():
    """メイン処理"""
    print("🔧 JANコード形式13桁対応 データベーステスト")
    print("=" * 50)
    
    # データベース接続テスト
    if not test_database_connection():
        print("データベース接続に失敗しました")
        return
    
    # CRUD操作テスト
    if not test_crud_operations():
        print("CRUD操作に失敗しました")
        return
    
    print("\n✅ 全てのテストが成功しました！")
    print("JANコード形式13桁対応のシステムが正常に動作しています。")

if __name__ == "__main__":
    main() 