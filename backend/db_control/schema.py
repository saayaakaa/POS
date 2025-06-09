from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
import re

# 商品情報のスキーマ
class ProductBase(BaseModel):
    product_code: str = Field(..., description="商品コード（JANコード形式13桁数字）", min_length=13, max_length=13)
    product_name: str
    price: int
    tax_rate: float = 0.10  # 消費税率（デフォルト10%）
    category: Optional[str] = None  # 商品カテゴリ
    is_local: bool = False  # 地域商品フラグ

    @validator('product_code')
    def validate_product_code(cls, v):
        """商品コードのバリデーション：13桁の数字のみ許可"""
        if not re.match(r'^\d{13}$', v):
            raise ValueError('商品コードは13桁の数字である必要があります')
        return v

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    
    class Config:
        from_attributes = True

# 購入アイテムのスキーマ
class PurchaseItemBase(BaseModel):
    product_code: str = Field(..., description="商品コード（JANコード形式13桁数字・バーコードスキャン対応）", min_length=13, max_length=13)
    quantity: int

    @validator('product_code')
    def validate_product_code(cls, v):
        """商品コードのバリデーション：13桁の数字のみ許可"""
        if not re.match(r'^\d{13}$', v):
            raise ValueError('商品コードは13桁の数字である必要があります')
        return v

class PurchaseItemCreate(PurchaseItemBase):
    pass

class PurchaseItemResponse(PurchaseItemBase):
    id: int
    product_name: str
    price: int
    total_price: int
    
    class Config:
        from_attributes = True

# 購入リストのスキーマ
class PurchaseListResponse(BaseModel):
    items: List[PurchaseItemResponse]
    total_amount: int
    item_count: int

# 購入完了のスキーマ
class PurchaseCompleteRequest(BaseModel):
    items: List[PurchaseItemCreate]
    subtotal: Optional[int] = None
    tax: Optional[int] = None
    total_amount: Optional[int] = None

class TaxBreakdown(BaseModel):
    subtotal: int
    tax: int

class PurchaseCompleteResponse(BaseModel):
    success: bool
    total_amount: int
    purchase_id: Optional[int] = None
    message: str
    subtotal: Optional[int] = None
    total_tax: Optional[int] = None
    tax_breakdown: Optional[dict] = None  # 税率別の詳細 