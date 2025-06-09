# from sqlalchemy import ForeignKey
# from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
# from datetime import datetime


# class Base(DeclarativeBase):
#     pass


# class Customers(Base):
#     __tablename__ = 'customers'
#     customer_id: Mapped[str] = mapped_column(primary_key=True)
#     customer_name: Mapped[str] = mapped_column()
#     age: Mapped[int] = mapped_column()
#     gender: Mapped[str] = mapped_column()


# class Items(Base):
#     __tablename__ = 'items'
#     item_id: Mapped[str] = mapped_column(primary_key=True)
#     item_name: Mapped[str] = mapped_column()
#     price: Mapped[int] = mapped_column()


# class Purchases(Base):
#     __tablename__ = 'purchases'
#     purchase_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
#     purchase_name: Mapped[str] = mapped_column(ForeignKey("customers.customer_id"))
#     date: Mapped[datetime] = mapped_column()


# class PurchaseDetails(Base):
#     __tablename__ = 'purchase_details'
#     purchase_id: Mapped[int] = mapped_column(ForeignKey("purchases.purchase_id"), primary_key=True)
#     item_name: Mapped[str] = mapped_column(ForeignKey("items.item_id"), primary_key=True)
#     quantity: Mapped[int] = mapped_column()

from sqlalchemy import String, Integer, DateTime, ForeignKey, Float, Column
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from datetime import datetime


class Base(DeclarativeBase):
    pass


class Customers(Base):
    __tablename__ = 'customers'
    customer_id: Mapped[str] = mapped_column(String(10), primary_key=True)
    customer_name: Mapped[str] = mapped_column(String(100))
    age: Mapped[int] = mapped_column(Integer)
    gender: Mapped[str] = mapped_column(String(10))


class Items(Base):
    __tablename__ = 'items'
    item_id: Mapped[str] = mapped_column(String(10), primary_key=True)
    item_name: Mapped[str] = mapped_column(String(100))
    price: Mapped[int] = mapped_column(Integer)


class Purchases(Base):
    __tablename__ = 'purchases'
    purchase_id: Mapped[str] = mapped_column(String(10), primary_key=True)
    customer_id: Mapped[str] = mapped_column(String(10))
    purchase_date: Mapped[str] = mapped_column(String(10))


class PurchaseDetails(Base):
    __tablename__ = 'purchase_details'
    detail_id: Mapped[str] = mapped_column(String(10), primary_key=True)
    purchase_id: Mapped[str] = mapped_column(String(10))
    item_id: Mapped[str] = mapped_column(String(10))
    quantity: Mapped[int] = mapped_column(Integer)


# POSシステム用のモデル
class Products(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    # JANコード形式13桁数字に最適化（バーコードスキャン対応）
    product_code = Column(String(13), unique=True, index=True, nullable=False)
    product_name = Column(String(100), nullable=False)
    price = Column(Integer, nullable=False)  # 税抜き価格
    tax_rate = Column(Float, nullable=False, default=0.10)  # 消費税率（デフォルト10%）
    category = Column(String(50), nullable=True)  # 商品カテゴリ
    is_local = Column(Integer, nullable=False, default=0)  # 地域商品フラグ（0: 通常商品, 1: 地域商品）
    # 将来的にbarcodeカラムを追加予定（レベル2実装時）
    # barcode = Column(String(20), nullable=True, index=True)  # JANコード等のバーコード値


class PurchaseHistory(Base):
    __tablename__ = 'purchase_history'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    total_amount: Mapped[int] = mapped_column(Integer, nullable=False)
    purchase_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PurchaseItems(Base):
    __tablename__ = 'purchase_items'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    purchase_id: Mapped[int] = mapped_column(Integer, ForeignKey("purchase_history.id"), nullable=False)
    product_code: Mapped[str] = mapped_column(String(13), ForeignKey("products.product_code"), nullable=False)
    product_name: Mapped[str] = mapped_column(String(100), nullable=False)
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    total_price: Mapped[int] = mapped_column(Integer, nullable=False)
