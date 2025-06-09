import { useState, useEffect } from 'react';
import BarcodeScanner from './BarcodeScanner';

interface Product {
  id: number;
  product_code: string;
  product_name: string;
  price: number;
  tax_rate?: number;
  category?: string;
  is_local?: boolean;
}

interface ProductInputProps {
  onProductFound: (product: Product) => void;
  onError?: (error: string) => void;
  onSearchError?: (error: string) => void;
  code?: string;
  onCodeChange?: (code: string) => void;
  className?: string;
}

const ProductInput: React.FC<ProductInputProps> = ({ 
  onProductFound, 
  onError, 
  onSearchError,
  code: externalCode,
  onCodeChange,
  className
}) => {
  const [internalCode, setInternalCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  // 外部からcodeが渡された場合はそれを使用、そうでなければ内部状態を使用
  const productCode = externalCode !== undefined ? externalCode : internalCode;
  const setProductCode = onCodeChange || setInternalCode;

  // APIベースURLを動的に取得
  const getApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      return `http://${hostname}:8000`;
    }
    return 'http://localhost:8000';
  };

  // JANコード形式（13桁数字）のバリデーション
  const validateProductCode = (code: string): boolean => {
    return /^\d{13}$/.test(code);
  };

  // バーコードスキャン成功時の処理
  const handleScanSuccess = (scannedCode: string) => {
    setProductCode(scannedCode);
    setValidationError('');
    // スキャン成功後、自動的に商品検索を実行
    handleSearch(scannedCode);
  };

  // バーコードスキャンエラー時の処理
  const handleScanError = (error: string) => {
    if (onError) onError(error);
    if (onSearchError) onSearchError(error);
  };

  // バーコードスキャナーを開く
  const openScanner = () => {
    setShowScanner(true);
  };

  // バーコードスキャナーを閉じる
  const closeScanner = () => {
    setShowScanner(false);
  };

  // バーコードスキャナーからの入力を検出するための処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // 数字のみ許可（13桁まで）
    const numericValue = value.replace(/\D/g, '').slice(0, 13);
    setProductCode(numericValue);
    
    // バリデーションエラーのクリア
    if (validationError) {
      setValidationError('');
    }
    
    // リアルタイムバリデーション
    if (numericValue.length > 0 && numericValue.length < 13) {
      setValidationError(`商品コードは13桁の数字である必要があります（現在: ${numericValue.length}桁）`);
    } else if (numericValue.length === 13) {
      setValidationError('');
      // バーコードスキャナーの場合、13桁入力完了後に自動検索
      setTimeout(() => {
        if (productCode === numericValue) {
          handleSearch(numericValue);
        }
      }, 100);
    }
  };

  const handleSearch = async (code?: string) => {
    const searchCode = code || productCode;
    
    if (!searchCode.trim()) {
      const errorMsg = '商品コードを入力してください';
      if (onError) onError(errorMsg);
      if (onSearchError) onSearchError(errorMsg);
      return;
    }

    if (!validateProductCode(searchCode)) {
      setValidationError('商品コードは13桁の数字である必要があります');
      return;
    }

    setLoading(true);
    setValidationError('');
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/products/${searchCode}`);
      
      if (response.ok) {
        const product = await response.json();
        onProductFound(product);
        if (externalCode === undefined) {
          setProductCode('');
        }
      } else if (response.status === 404) {
        const errorMsg = '商品が見つかりませんでした';
        if (onError) onError(errorMsg);
        if (onSearchError) onSearchError(errorMsg);
      } else {
        const errorMsg = '商品の検索中にエラーが発生しました';
        if (onError) onError(errorMsg);
        if (onSearchError) onSearchError(errorMsg);
      }
    } catch (error) {
      console.error('商品検索エラー:', error);
      const errorMsg = 'サーバーとの通信に失敗しました';
      if (onError) onError(errorMsg);
      if (onSearchError) onSearchError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSearch();
  };

  const isValidCode = validateProductCode(productCode);
  const canSubmit = isValidCode && !loading;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 大きなスキャンボタン */}
        <button
          type="button"
          onClick={openScanner}
          disabled={loading}
          className="w-full py-4 px-6 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-xl font-bold text-lg hover:opacity-90 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-lg"
        >
          <span>バーコードをスキャン</span>
        </button>

        <div>
          <label htmlFor="productCode" className="block text-sm font-medium text-gray-700 mb-2">
            商品コード（JANコード形式）
          </label>
          <input
            type="text"
            id="productCode"
            value={productCode}
            onChange={handleInputChange}
            className={className || `w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${
              validationError ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="13桁の数字を入力"
            autoFocus
            disabled={loading}
            maxLength={13}
          />
          {validationError && (
            <p className="mt-1 text-xs text-red-600">
              {validationError}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            JANコード形式13桁数字・手入力/バーコードスキャン両対応
          </p>
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-400 to-pink-400 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
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

      {/* バーコードスキャナーモーダル */}
      <BarcodeScanner
        isActive={showScanner}
        onScanSuccess={handleScanSuccess}
        onScanError={handleScanError}
        onClose={closeScanner}
      />
    </>
  );
};

export default ProductInput; 