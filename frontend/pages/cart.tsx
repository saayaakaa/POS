import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface CartItem {
  id: number;
  product_code: string;
  product_name: string;
  price: number;
  quantity: number;
}

interface PurchaseHistoryItem {
  id: number;
  purchase_date: string;
  total_amount: number;
  items: {
    product_code: string;
    product_name: string;
    price: number;
    quantity: number;
    total_price: number;
  }[];
}

interface LastPurchase {
  totalAmount: number;
  purchaseId: string;
}

const Cart: NextPage = () => {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryItem[]>([]);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [lastPurchase, setLastPurchase] = useState<LastPurchase | null>(null);

  // APIベースURLを動的に取得
  const getApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      return `http://${hostname}:8000`;
    }
    return 'http://localhost:8000';
  };

  useEffect(() => {
    // URLパラメータからカート商品を取得
    if (router.query.items) {
      try {
        const items = JSON.parse(router.query.items as string);
        setCartItems(items);
      } catch (error) {
        console.error('カートデータの解析に失敗しました:', error);
      }
    }
    fetchPurchaseHistory();
  }, [router.query.items]);

  const fetchPurchaseHistory = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/purchase-history?limit=5`);
      if (response.ok) {
        const result = await response.json();
        setPurchaseHistory(result.data);
      }
    } catch (error) {
      console.error('購入履歴の取得に失敗しました:', error);
    }
  };

  const updateQuantity = (productCode: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCartItems(cartItems.filter(item => item.product_code !== productCode));
    } else {
      setCartItems(cartItems.map(item => 
        item.product_code === productCode 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const removeItem = (productCode: string) => {
    setCartItems(cartItems.filter(item => item.product_code !== productCode));
  };

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const purchaseData = {
        items: cartItems.map(item => ({
          product_code: item.product_code,
          quantity: item.quantity
        }))
      };

      const response = await fetch(`${getApiBaseUrl()}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      });

      if (response.ok) {
        const result = await response.json();
        
        // 成功POPUPを表示
        setLastPurchase({
          totalAmount: result.total_amount,
          purchaseId: result.purchase_id
        });
        setShowSuccessPopup(true);
        
        // カートをクリア
        setCartItems([]);
        
        // 購入履歴を更新
        await fetchPurchaseHistory();
        
        // 3秒後にPOPUPを自動で閉じる
        setTimeout(() => {
          setShowSuccessPopup(false);
        }, 3000);
        
      } else {
        const errorData = await response.json();
        router.push(`/result?success=false&error=${encodeURIComponent(errorData.detail || '購入処理に失敗しました')}`);
      }
    } catch (error) {
      console.error('購入処理エラー:', error);
      router.push(`/result?success=false&error=${encodeURIComponent('サーバーとの通信に失敗しました')}`);
    } finally {
      setLoading(false);
    }
  };

  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (cartItems.length === 0 && purchaseHistory.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🛒</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">カートが空です</h1>
            <p className="text-gray-600 mb-8">カートに商品がありません</p>
            <Link 
              href="/search"
              className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-400 to-pink-400 hover:opacity-90 transition block text-center"
            >
              🔍 商品検索に戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-4 py-8">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* 成功POPUP */}
        {showSuccessPopup && lastPurchase && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 mx-4 max-w-sm w-full text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">購入完了！</h2>
              <p className="text-gray-600 mb-4">ご購入ありがとうございました！</p>
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">購入ID:</span>
                  <span className="font-bold text-green-700">{lastPurchase.purchaseId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">合計金額:</span>
                  <span className="font-bold text-green-700">¥{lastPurchase.totalAmount.toLocaleString()}</span>
                </div>
              </div>
              <button
                onClick={() => setShowSuccessPopup(false)}
                className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-400 to-green-600 hover:opacity-90 transition"
              >
                閉じる
              </button>
            </div>
          </div>
        )}

        {/* カート部分 */}
        {cartItems.length > 0 && (
          <>
            {/* ヘッダー */}
            <div className="bg-white rounded-2xl shadow-md p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛒</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">購入確認</h1>
              <p className="text-gray-600 mt-2">商品内容をご確認ください</p>
            </div>

            {/* カート商品一覧 */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">📦 商品一覧</h2>
              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{item.product_name}</h3>
                        <p className="text-sm text-gray-600">コード: {item.product_code}</p>
                        <p className="text-sm text-gray-600">単価: ¥{item.price.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-2">
                          <button
                            onClick={() => updateQuantity(item.product_code, item.quantity - 1)}
                            className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product_code, item.quantity + 1)}
                            className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition"
                          >
                            +
                          </button>
                        </div>
                        <p className="font-bold text-gray-800">¥{(item.price * item.quantity).toLocaleString()}</p>
                        <button
                          onClick={() => removeItem(item.product_code)}
                          className="text-xs text-red-500 hover:text-red-700 transition mt-1"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 合計金額 */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl shadow-md p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700 font-medium">商品数:</span>
                <span className="font-bold text-green-700">{totalQuantity}点</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">💰 合計金額:</span>
                <span className="text-2xl font-bold text-green-700">¥{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* ボタン */}
            <div className="space-y-4">
              <button
                onClick={handlePurchase}
                disabled={loading || cartItems.length === 0}
                className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-green-400 to-green-600 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ 処理中...' : '💳 購入する'}
              </button>
              
              <Link 
                href="/search"
                className="w-full py-4 rounded-xl font-semibold text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 hover:opacity-90 transition block text-center"
              >
                🔍 商品検索に戻る
              </Link>
            </div>
          </>
        )}

        {/* 購入履歴 */}
        {purchaseHistory.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 購入履歴</h2>
            <div className="space-y-4">
              {purchaseHistory.map((purchase) => (
                <div key={purchase.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-sm text-gray-600">購入日時</p>
                      <p className="font-medium text-gray-800">{purchase.purchase_date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">合計金額</p>
                      <p className="font-bold text-green-700">¥{purchase.total_amount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-sm text-gray-600 mb-2">購入商品</p>
                    <div className="space-y-1">
                      {purchase.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.product_name} × {item.quantity}</span>
                          <span className="text-gray-700">¥{item.total_price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* カートが空の場合の商品検索ボタン */}
        {cartItems.length === 0 && purchaseHistory.length > 0 && (
          <div className="text-center">
            <Link 
              href="/search"
              className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-400 to-pink-400 hover:opacity-90 transition block text-center"
            >
              🔍 新しい商品を検索
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart; 