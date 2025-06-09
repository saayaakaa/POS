from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import json
import os
from db_control import crud, mymodels
from db_control.schema import ProductResponse, PurchaseCompleteRequest, PurchaseCompleteResponse

# MySQLのテーブル作成
from db_control.create_tables import init_db

# アプリケーション初期化時にテーブルを作成
print("データベース初期化中...")
init_db()

# サンプル商品データを初期化（JANコード形式13桁対応）
print("商品マスタデータ初期化中...")
try:
    crud.init_sample_products()
    print("商品マスタデータ初期化完了")
except Exception as e:
    print(f"商品マスタデータ初期化エラー: {e}")


class Customer(BaseModel):
    customer_id: str
    customer_name: str
    age: int
    gender: str


app = FastAPI(title="POSシステムAPI（JANコード形式13桁対応）", version="1.0.0")

# CORS設定（本番環境対応）
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
if allowed_origins == ["*"]:
    print("⚠️  警告: CORS設定が全てのオリジンを許可しています（開発環境用）")
else:
    print(f"CORS許可オリジン: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def index():
    return {"message": "POSシステム FastAPI（JANコード形式13桁対応）!"}


# POSシステム用のAPIエンドポイント

@app.get("/products/{product_code}", response_model=ProductResponse)
def get_product(product_code: str):
    """
    商品コードで商品を検索（JANコード形式13桁対応）
    
    レベル1: 手入力による商品コード検索
    レベル2: バーコードスキャンによる商品検索にも対応予定
    - JANコード13桁数字（例：4901234567001）
    - 完全一致検索（バーコードは誤入力が少ないため）
    - 13桁数字のみ受け入れ（フロントエンドでバリデーション済み）
    """
    product = crud.get_product_by_code(product_code)
    if not product:
        raise HTTPException(status_code=404, detail="商品が見つかりません")
    return product


@app.post("/purchase", response_model=PurchaseCompleteResponse)
def create_purchase(request: PurchaseCompleteRequest):
    """購入処理を実行"""
    try:
        # 商品ごとの税率で計算
        tax_calculation = crud.calculate_tax_by_product(
            [{"product_code": item.product_code, "quantity": item.quantity} for item in request.items]
        )
        
        # 購入処理を実行
        purchase_id = crud.create_purchase(
            [{"product_code": item.product_code, "quantity": item.quantity} for item in request.items],
            tax_calculation["total_amount"]
        )
        
        if purchase_id:
            return PurchaseCompleteResponse(
                success=True,
                total_amount=tax_calculation["total_amount"],
                purchase_id=str(purchase_id),
                message="購入が完了しました",
                subtotal=tax_calculation["subtotal"],
                total_tax=tax_calculation["total_tax"],
                tax_breakdown=tax_calculation["tax_breakdown"]
            )
        else:
            raise HTTPException(status_code=500, detail="購入処理に失敗しました")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"購入処理エラー: {e}")
        raise HTTPException(status_code=500, detail="内部サーバーエラーが発生しました")


@app.get("/purchase-history")
def get_purchase_history(limit: int = Query(10, description="取得する履歴の件数")):
    """購入履歴を取得"""
    try:
        history = crud.get_purchase_history(limit)
        return {"success": True, "data": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail="購入履歴の取得に失敗しました")


# 既存のCustomer関連API（互換性のため残す）

@app.post("/customers")
def create_customer(customer: Customer):
    values = customer.dict()
    tmp = crud.myinsert(mymodels.Customers, values)
    result = crud.myselect(mymodels.Customers, values.get("customer_id"))

    if result:
        result_obj = json.loads(result)
        return result_obj if result_obj else None
    return None


@app.get("/customers")
def read_one_customer(customer_id: str = Query(...)):
    result = crud.myselect(mymodels.Customers, customer_id)
    if not result:
        raise HTTPException(status_code=404, detail="Customer not found")
    result_obj = json.loads(result)
    return result_obj[0] if result_obj else None


@app.get("/allcustomers")
def read_all_customer():
    result = crud.myselectAll(mymodels.Customers)
    # 結果がNoneの場合は空配列を返す
    if not result:
        return []
    # JSON文字列をPythonオブジェクトに変換
    return json.loads(result)


@app.put("/customers")
def update_customer(customer: Customer):
    values = customer.dict()
    values_original = values.copy()
    tmp = crud.myupdate(mymodels.Customers, values)
    result = crud.myselect(mymodels.Customers, values_original.get("customer_id"))
    if not result:
        raise HTTPException(status_code=404, detail="Customer not found")
    result_obj = json.loads(result)
    return result_obj[0] if result_obj else None


@app.delete("/customers")
def delete_customer(customer_id: str = Query(...)):
    result = crud.mydelete(mymodels.Customers, customer_id)
    if not result:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"customer_id": customer_id, "status": "deleted"}


@app.get("/fetchtest")
def fetchtest():
    response = requests.get('https://jsonplaceholder.typicode.com/users')
    return response.json()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
