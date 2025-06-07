interface Product {
  id: number;
  product_code: string;
  product_name: string;
  price: number;
}

interface ProductInfoProps {
  product: Product;
}

const ProductInfo: React.FC<ProductInfoProps> = ({ product }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">商品情報</h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">商品コード:</span>
          <span className="font-medium">{product.product_code}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">商品名:</span>
          <span className="font-medium">{product.product_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">価格:</span>
          <span className="font-bold text-lg text-blue-600">¥{product.price.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo; 