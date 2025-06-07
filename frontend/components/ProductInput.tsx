import { useState } from 'react';

interface Product {
  id: number;
  product_code: string;
  product_name: string;
  price: number;
}

interface ProductInputProps {
  onProductFound: (product: Product) => void;
  onError: (error: string) => void;
}

const ProductInput: React.FC<ProductInputProps> = ({ onProductFound, onError }) => {
  const [productCode, setProductCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productCode.trim()) {
      onError('商品コードを入力してください');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/products/${productCode}`);
      
      if (response.ok) {
        const product = await response.json();
        onProductFound(product);
        setProductCode('');
      } else if (response.status === 404) {
        onError('商品が見つかりませんでした');
      } else {
        onError('商品の検索中にエラーが発生しました');
      }
    } catch (error) {
      console.error('商品検索エラー:', error);
      onError('サーバーとの通信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="productCode" className="block text-sm font-medium text-gray-700 mb-2">
          商品コード
        </label>
        <input
          type="text"
          id="productCode"
          value={productCode}
          onChange={(e) => setProductCode(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="商品コードを入力してください"
          disabled={loading}
        />
      </div>
      <button
        type="submit"
        disabled={loading || !productCode.trim()}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            検索中...
          </div>
        ) : (
          '商品を検索'
        )}
      </button>
    </form>
  );
};

export default ProductInput; 