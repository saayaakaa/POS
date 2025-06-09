# uname() error回避
import platform
print("platform", platform.uname())


from sqlalchemy import create_engine, insert, delete, update, select
import sqlalchemy
from sqlalchemy.orm import sessionmaker
import json
import pandas as pd

from db_control.connect import engine
from db_control.mymodels import Customers, Products, PurchaseHistory, PurchaseItems


def myinsert(mymodel, values):
    # session構築
    Session = sessionmaker(bind=engine)
    session = Session()

    query = insert(mymodel).values(values)
    try:
        # トランザクションを開始
        with session.begin():
            # データの挿入
            result = session.execute(query)
    except sqlalchemy.exc.IntegrityError:
        print("一意制約違反により、挿入に失敗しました")
        session.rollback()

    # セッションを閉じる
    session.close()
    return "inserted"


def myselect(mymodel, customer_id):
    # session構築
    Session = sessionmaker(bind=engine)
    session = Session()
    query = session.query(mymodel).filter(mymodel.customer_id == customer_id)
    try:
        # トランザクションを開始
        with session.begin():
            result = query.all()
        # 結果をオブジェクトから辞書に変換し、リストに追加
        result_dict_list = []
        for customer_info in result:
            result_dict_list.append({
                "customer_id": customer_info.customer_id,
                "customer_name": customer_info.customer_name,
                "age": customer_info.age,
                "gender": customer_info.gender
            })
        # リストをJSONに変換
        result_json = json.dumps(result_dict_list, ensure_ascii=False)
    except sqlalchemy.exc.IntegrityError:
        print("一意制約違反により、挿入に失敗しました")

    # セッションを閉じる
    session.close()
    return result_json


def myselectAll(mymodel):
    # session構築
    Session = sessionmaker(bind=engine)
    session = Session()
    query = select(mymodel)
    try:
        # トランザクションを開始
        with session.begin():
            df = pd.read_sql_query(query, con=engine)
            result_json = df.to_json(orient='records', force_ascii=False)

    except sqlalchemy.exc.IntegrityError:
        print("一意制約違反により、挿入に失敗しました")
        result_json = None

    # セッションを閉じる
    session.close()
    return result_json


def myupdate(mymodel, values):
    # session構築
    Session = sessionmaker(bind=engine)
    session = Session()

    customer_id = values.pop("customer_id")

    query = (
        update(mymodel)
        .where(mymodel.customer_id == customer_id)  # 条件指定
        .values(**values)  # 更新するカラムと値を設定
    )

    try:
        # トランザクションを開始
        with session.begin():
            result = session.execute(query)
    except sqlalchemy.exc.IntegrityError:
        print("一意制約違反により、挿入に失敗しました")
        session.rollback()
    # セッションを閉じる
    session.close()
    return "put"


def mydelete(mymodel, customer_id):
    # session構築
    Session = sessionmaker(bind=engine)
    session = Session()
    query = delete(mymodel).where(mymodel.customer_id == customer_id)
    try:
        # トランザクションを開始
        with session.begin():
            result = session.execute(query)
    except sqlalchemy.exc.IntegrityError:
        print("一意制約違反により、挿入に失敗しました")
        session.rollback()

    # セッションを閉じる
    session.close()
    return customer_id + " is deleted"


# POSシステム用のCRUD操作

def get_product_by_code(product_code: str):
    """商品コードで商品を検索"""
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        with session.begin():
            product = session.query(Products).filter(Products.product_code == product_code).first()
            if product:
                return {
                    "id": product.id,
                    "product_code": product.product_code,
                    "product_name": product.product_name,
                    "price": product.price,
                    "tax_rate": getattr(product, 'tax_rate', 0.10),  # デフォルト10%
                    "category": getattr(product, 'category', ''),
                    "is_local": bool(getattr(product, 'is_local', 0))
                }
            return None
    except Exception as e:
        print(f"商品検索エラー: {e}")
        return None
    finally:
        session.close()


def create_purchase(items_data: list, total_amount: int):
    """購入処理を実行"""
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        with session.begin():
            # 購入履歴を作成
            purchase = PurchaseHistory(total_amount=total_amount)
            session.add(purchase)
            session.flush()  # IDを取得するためにflush
            
            purchase_id = purchase.id
            
            # 購入アイテムを作成
            for item in items_data:
                # 商品情報を取得
                product = session.query(Products).filter(Products.product_code == item['product_code']).first()
                if not product:
                    raise ValueError(f"商品コード {item['product_code']} が見つかりません")
                
                purchase_item = PurchaseItems(
                    purchase_id=purchase_id,
                    product_code=product.product_code,
                    product_name=product.product_name,
                    price=product.price,
                    quantity=item['quantity'],
                    total_price=product.price * item['quantity']
                )
                session.add(purchase_item)
            
            return purchase_id
            
    except Exception as e:
        print(f"購入処理エラー: {e}")
        session.rollback()
        return None
    finally:
        session.close()


def init_sample_products():
    """サンプル商品データを初期化（JANコード形式13桁）"""
    Session = sessionmaker(bind=engine)
    session = Session()
    
    sample_products = [
        # 文房具（49012345670XX）- 標準JANコード形式
        {"product_code": "4901234567001", "product_name": "シャープペンシル（0.5mm）", "price": 150, "tax_rate": 0.10, "category": "文房具", "is_local": 0},
        {"product_code": "4901234567002", "product_name": "消しゴム（スリムタイプ）", "price": 120, "tax_rate": 0.10, "category": "文房具", "is_local": 0},
        {"product_code": "4901234567003", "product_name": "ノートB5（横罫）", "price": 250, "tax_rate": 0.10, "category": "文房具", "is_local": 0},
        {"product_code": "4901234567004", "product_name": "ボールペン（赤）", "price": 180, "tax_rate": 0.10, "category": "文房具", "is_local": 0},
        {"product_code": "4901234567005", "product_name": "蛍光ペンセット（5色）", "price": 480, "tax_rate": 0.10, "category": "文房具", "is_local": 0},
        {"product_code": "4901234567006", "product_name": "付箋セット（正方形・パステル）", "price": 320, "tax_rate": 0.10, "category": "文房具", "is_local": 0},
        {"product_code": "4901234567007", "product_name": "ペンケース（メッシュタイプ）", "price": 650, "tax_rate": 0.10, "category": "文房具", "is_local": 0},
        {"product_code": "4901234567008", "product_name": "A4クリアファイル（10枚セット）", "price": 380, "tax_rate": 0.10, "category": "文房具", "is_local": 0},
        
        # 地域限定商品（49012345671XX）- 地域商品識別
        {"product_code": "4901234567101", "product_name": "名古屋限定・しゃちほこ消しゴム", "price": 200, "tax_rate": 0.10, "category": "文房具", "is_local": 1},
        {"product_code": "4901234567102", "product_name": "大阪限定・たこ焼きメモ帳", "price": 350, "tax_rate": 0.10, "category": "文房具", "is_local": 1},
        
        # テスト用商品（99000000000XX）- テスト識別コード
        {"product_code": "9900000000001", "product_name": "テスト商品A", "price": 100, "tax_rate": 0.10, "category": "テスト", "is_local": 0},
        {"product_code": "9900000000002", "product_name": "テスト商品B", "price": 150, "tax_rate": 0.08, "category": "テスト", "is_local": 0},
        {"product_code": "9900000000003", "product_name": "テスト商品C", "price": 200, "tax_rate": 0.10, "category": "テスト", "is_local": 0},
    ]
    
    # 既存の商品データをクリア（新しいスキーマに対応するため）
    try:
        session.query(Products).delete()
        session.commit()
        print("既存の商品データをクリアしました")
    except Exception as e:
        session.rollback()
        print(f"商品データクリアエラー: {e}")
    
    # 新しい商品データを追加
    for product_data in sample_products:
        product = Products(**product_data)
        session.add(product)
    
    try:
        session.commit()
        print("JANコード形式13桁の商品マスタデータを初期化しました")
        print("商品数:", len(sample_products))
    except Exception as e:
        session.rollback()
        print(f"商品データ初期化エラー: {e}")
    finally:
        session.close()


def get_purchase_history(limit: int = 10):
    """購入履歴を取得（最新順）"""
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        with session.begin():
            # 購入履歴を最新順で取得
            purchases = session.query(PurchaseHistory).order_by(PurchaseHistory.purchase_date.desc()).limit(limit).all()
            
            result = []
            for purchase in purchases:
                # 各購入の詳細アイテムを取得
                items = session.query(PurchaseItems).filter(PurchaseItems.purchase_id == purchase.id).all()
                
                purchase_data = {
                    "id": purchase.id,
                    "purchase_date": purchase.purchase_date.strftime("%Y-%m-%d %H:%M:%S"),
                    "total_amount": purchase.total_amount,
                    "items": [
                        {
                            "product_code": item.product_code,
                            "product_name": item.product_name,
                            "price": item.price,
                            "quantity": item.quantity,
                            "total_price": item.total_price
                        }
                        for item in items
                    ]
                }
                result.append(purchase_data)
            
            return result
            
    except Exception as e:
        print(f"購入履歴取得エラー: {e}")
        return []
    finally:
        session.close()


def calculate_tax_by_product(items):
    """商品ごとの税率で税額を計算"""
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        tax_breakdown = {}
        total_tax = 0
        subtotal = 0
        
        for item in items:
            product = session.query(Products).filter(Products.product_code == item["product_code"]).first()
            if product:
                item_subtotal = product.price * item["quantity"]
                item_tax = int(item_subtotal * product.tax_rate)
                
                subtotal += item_subtotal
                total_tax += item_tax
                
                # 税率別の集計
                tax_rate_key = f"{int(product.tax_rate * 100)}%"
                if tax_rate_key not in tax_breakdown:
                    tax_breakdown[tax_rate_key] = {"subtotal": 0, "tax": 0}
                
                tax_breakdown[tax_rate_key]["subtotal"] += item_subtotal
                tax_breakdown[tax_rate_key]["tax"] += item_tax
        
        return {
            "subtotal": subtotal,
            "total_tax": total_tax,
            "total_amount": subtotal + total_tax,
            "tax_breakdown": tax_breakdown
        }
    
    finally:
        session.close()