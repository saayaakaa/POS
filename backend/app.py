from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import os
from db_control import crud
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


app = FastAPI(title="POSシステムAPI（JANコード形式13桁対応）", version="1.0.0")

# CORS設定（環境変数から取得、デフォルトは開発環境用）
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
if allowed_origins == ["*"]:
    print("⚠️  警告: CORS設定が全てのオリジンを許可しています（開発環境用）")
else:
    print(f"CORS許可オリジン: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Accept",
        "Accept-Language", 
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
    ],
    expose_headers=["*"],
    max_age=3600,
)


@app.options("/{path:path}")
def options_handler(path: str):
    """全てのパスでOPTIONSリクエストを処理"""
    return {"message": "CORS preflight OK"}


@app.get("/")
def index():
    return {"message": "POSシステム FastAPI（JANコード形式13桁対応）!", "version": "1.0.0"}


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
