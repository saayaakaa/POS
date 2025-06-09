import { useState } from 'react';
import ProductInput from '../components/ProductInput';

interface Product {
  id: number;
  product_code: string;
  product_name: string;
  price: number;
  tax_rate: number;
  category: string;
  is_local: boolean;
}

export default function ScannerTest() {
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string>('');

  const handleProductFound = (product: Product) => {
    setFoundProduct(product);
    setError('');
    console.log('商品が見つかりました:', product);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setFoundProduct(null);
    console.error('エラー:', errorMessage);
  };

  const clearResults = () => {
    setFoundProduct(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          📱 バーコードスキャナーテスト
        </h1>
        
        <div className="mb-6">
          <ProductInput
            onProductFound={handleProductFound}
            onError={handleError}
          />
        </div>

        {/* 結果表示エリア */}
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="text-red-400">⚠️</div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">エラー</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {foundProduct && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="text-green-400">✅</div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-green-800">商品が見つかりました</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p><strong>商品コード:</strong> {foundProduct.product_code}</p>
                    <p><strong>商品名:</strong> {foundProduct.product_name}</p>
                    <p><strong>価格:</strong> ¥{foundProduct.price.toLocaleString()}</p>
                    <p><strong>税率:</strong> {(foundProduct.tax_rate * 100).toFixed(0)}%</p>
                    <p><strong>カテゴリ:</strong> {foundProduct.category}</p>
                    {foundProduct.is_local && (
                      <p className="text-orange-600"><strong>🏷️ 地域限定商品</strong></p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {(foundProduct || error) && (
            <button
              onClick={clearResults}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
            >
              結果をクリア
            </button>
          )}
        </div>

        {/* 使用方法 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">📖 使用方法</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• 手入力: 13桁のJANコードを直接入力</li>
            <li>• スキャン: 📷ボタンでカメラを起動してバーコードをスキャン</li>
            <li>• テスト用商品コード: 4901234567001, 4901234567101</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 