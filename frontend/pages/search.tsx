"use client"

import { useState, useEffect } from "react"
import ProductInput from '../components/ProductInput'

interface Product {
  id: number;
  product_code: string;
  product_name: string;
  price: number;
  tax_rate?: number;
  category?: string;
  is_local?: boolean;
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

interface TaxBreakdown {
  [key: string]: {
    subtotal: number;
    tax: number;
  };
}

export default function ProductSearchPage() {
  const [code, setCode] = useState("")
  const [product, setProduct] = useState<Product | null>(null)
  const [cart, setCart] = useState<any[]>([])
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryItem[]>([])
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [lastPurchase, setLastPurchase] = useState<{totalAmount: number, purchaseId: string} | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false)
  const [showTaxDetails, setShowTaxDetails] = useState(false)
  const [searchError, setSearchError] = useState("")

  // APIベースURLを環境変数から取得（フォールバック付き）
  const getApiBaseUrl = () => {
    // 環境変数が設定されている場合はそれを使用
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    
    // フォールバック: 動的にホスト名から構築（開発環境用）
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      return `http://${hostname}:8000`;
    }
    return 'http://localhost:8000';
  };

  // ページ読み込み時に購入履歴を取得
  useEffect(() => {
    fetchPurchaseHistory()
  }, [])

  const fetchPurchaseHistory = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト
      
      const response = await fetch(`${getApiBaseUrl()}/purchase-history?limit=5`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const result = await response.json()
        setPurchaseHistory(result.data)
      } else {
        console.error(`購入履歴取得エラー: HTTP ${response.status} - ${response.statusText}`)
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('購入履歴取得タイムアウト')
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error('購入履歴取得: ネットワークエラー')
      } else {
        console.error('購入履歴の取得に失敗しました:', error)
      }
    }
  }

  const togglePurchaseHistory = () => {
    setShowPurchaseHistory(!showPurchaseHistory)
    if (!showPurchaseHistory) {
      fetchPurchaseHistory() // 表示する時に最新データを取得
    }
  }

  // バーコードスキャナーからの商品検索成功時の処理
  const handleProductFound = (foundProduct: Product) => {
    setProduct(foundProduct)
    setCode(foundProduct.product_code)
    setSearchError("")
  }

  // バーコードスキャナーからのエラー処理
  const handleSearchError = (error: string) => {
    setSearchError(error)
    setProduct(null)
  }

  const handleSearch = async () => {
    if (!code) return

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト
      
      const res = await fetch(`${getApiBaseUrl()}/products/${code}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const data = await res.json()
        setProduct(data)
        setSearchError("")
      } else if (res.status === 404) {
        setProduct(null)
        setSearchError("商品が見つかりません")
      } else {
        setProduct(null)
        setSearchError(`サーバーエラー: HTTP ${res.status} - ${res.statusText}`)
      }
    } catch (err: any) {
      console.error("検索失敗:", err)
      setProduct(null)
      if (err.name === 'AbortError') {
        setSearchError("タイムアウト: サーバーの応答が遅すぎます")
      } else if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setSearchError("ネットワークエラー: サーバーに接続できません")
      } else {
        setSearchError(`通信エラー: ${err.name} - ${err.message}`)
      }
    }
  }

  const addToCart = () => {
    if (product) {
      const existingItem = cart.find(item => item.product_code === product.product_code)
      if (existingItem) {
        setCart(cart.map(item =>
          item.product_code === product.product_code
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ))
      } else {
        setCart([...cart, { ...product, quantity: 1 }])
      }
      setProduct(null)
      setCode("")
    }
  }

  const updateQuantity = (productCode: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.product_code !== productCode))
    } else {
      setCart(cart.map(item => 
        item.product_code === productCode 
          ? { ...item, quantity: newQuantity }
          : item
      ))
    }
  }

  const removeItem = (productCode: string) => {
    setCart(cart.filter(item => item.product_code !== productCode))
  }

  const handlePurchase = async () => {
    if (cart.length === 0) return
    
    setLoading(true)
    try {
      const purchaseData = {
        items: cart.map(item => ({
          product_code: item.product_code,
          quantity: item.quantity
        }))
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒タイムアウト

      const res = await fetch(`${getApiBaseUrl()}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(purchaseData),
        signal: controller.signal
      })

      clearTimeout(timeoutId);

      if (res.ok) {
        const result = await res.json()
        
        // 成功POPUPを表示
        setLastPurchase({
          totalAmount: result.total_amount,
          purchaseId: result.purchase_id
        })
        setShowSuccessPopup(true)
        
        // カートをクリア
        setCart([])
        
        // 購入履歴を更新
        await fetchPurchaseHistory()
        
      } else {
        const errorText = await res.text().catch(() => 'レスポンス読み取りエラー');
        alert(`購入処理に失敗しました: HTTP ${res.status} - ${errorText}`)
      }
    } catch (err: any) {
      console.error("購入失敗:", err)
      if (err.name === 'AbortError') {
        alert("タイムアウト: サーバーの応答が遅すぎます")
      } else if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        alert("ネットワークエラー: サーバーに接続できません")
      } else {
        alert(`通信エラー: ${err.name} - ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  
  // 税率別の計算
  const calculateTaxDetails = () => {
    const taxBreakdown: TaxBreakdown = {}
    let totalTax = 0
    
    cart.forEach(item => {
      const itemSubtotal = item.price * item.quantity
      const taxRate = item.tax_rate || 0.10 // デフォルト10%
      const itemTax = Math.floor(itemSubtotal * taxRate)
      const taxRateKey = `${(taxRate * 100).toFixed(0)}%`
      
      if (!taxBreakdown[taxRateKey]) {
        taxBreakdown[taxRateKey] = { subtotal: 0, tax: 0 }
      }
      
      taxBreakdown[taxRateKey].subtotal += itemSubtotal
      taxBreakdown[taxRateKey].tax += itemTax
      totalTax += itemTax
    })
    
    return { taxBreakdown, totalTax }
  }
  
  const { taxBreakdown, totalTax } = calculateTaxDetails()

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-4 py-8">
      <div className="max-w-6xl mx-auto">
        
        {/* アプリ名 */}
        <div className="text-center mb-6">
          <h1 className="text-lg font-medium text-gray-600">TECHONE STATIONERY</h1>
        </div>

        {/* 成功POPUP */}
        {showSuccessPopup && lastPurchase && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            {/* 紙吹雪演出 */}
            <div className="fixed inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`
                  }}
                />
              ))}
            </div>
            
            <div className="bg-white rounded-2xl p-8 mx-4 max-w-sm w-full text-center relative">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <span className="text-xs font-bold text-white">THANKS</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">購入完了！</h2>
              <p className="text-gray-600 mb-4">ご購入ありがとうございました！</p>
              <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">合計金額:</span>
                  <span className="font-bold text-orange-600">¥{lastPurchase.totalAmount.toLocaleString()}</span>
                </div>
              </div>
              <button
                onClick={() => setShowSuccessPopup(false)}
                className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-400 to-pink-400 hover:opacity-90 transition"
              >
                閉じる
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          
          {/* 左側：商品入力エリア */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xm font-semibold mb-4 text-gray-700">商品コード入力・スキャン</h2>
              
              <ProductInput
                code={code}
                onCodeChange={(newCode: string) => setCode(newCode)}
                onProductFound={handleProductFound}
                onSearchError={handleSearchError}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 mb-4"
              />
              {searchError && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{searchError}</p>
                </div>
              )}
            </div>

            {product && (
              <div className="bg-white rounded-2xl shadow-md p-6 text-center">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{product.product_name}</h3>
                <div className="flex justify-center items-center space-x-2 mb-2">
                  {product.is_local && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                      地域限定
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-orange-500 mb-4">¥{product.price.toLocaleString()}</p>
                <button
                  onClick={addToCart}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-400 to-pink-400 hover:opacity-90 transition"
                >
                  カートに追加
                </button>
              </div>
            )}

            {/* 合計カード */}
            <div className="bg-white rounded-2xl shadow-md p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">合計金額</h3>
              {cart.length > 0 ? (
                <div className="text-2xl font-bold text-pink-500">
                  ¥{(totalAmount + totalTax).toLocaleString()}
                </div>
              ) : (
                <div className="text-2xl text-gray-400">
                  ¥0
                </div>
              )}
            </div>
          </div>

          {/* 右側：カート表示エリア */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-xm font-semibold mb-4 text-gray-700">カート</h2>
            
            <div className="space-y-2 mb-6">
              {cart.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  商品を追加してください
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 mb-2">
                    <div className="space-y-2">
                      {/* 商品名 */}
                      <div className="font-medium text-gray-800 text-lg">{item.product_name}</div>
                      
                      {/* 詳細情報 */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">数量:</span>
                          <div className="flex items-center space-x-2 mt-1">
                            <button
                              onClick={() => updateQuantity(item.product_code, item.quantity - 1)}
                              className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition text-sm"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product_code, item.quantity + 1)}
                              className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition text-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-gray-600">単価:</span>
                          <div className="font-medium">¥{item.price.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">税率{((item.tax_rate || 0.10) * 100).toFixed(0)}%</div>
                        </div>
                      </div>
                      
                      {/* 単品合計と削除ボタン */}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <div>
                          <span className="text-gray-600 text-sm">単品合計:</span>
                          <span className="font-bold text-gray-800 ml-2">¥{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                        <button
                          onClick={() => removeItem(item.product_code)}
                          className="text-xs text-red-500 hover:text-red-700 transition px-2 py-1 rounded"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 合計表示 */}
            {cart.length > 0 && (
              <div className="text-right border-t pt-4 mb-6">
                <div className="text-lg text-gray-700 mb-2">
                  商品点数: <span className="font-bold">{totalQuantity}点</span>
                </div>
                <div className="text-lg text-gray-700 mb-2">
                  小計: <span className="font-bold">¥{totalAmount.toLocaleString()}</span>
                </div>
                
                {/* 消費税詳細表示ボタン */}
                <button
                  onClick={() => setShowTaxDetails(!showTaxDetails)}
                  className="text-sm text-blue-600 hover:text-blue-800 mb-2 underline"
                >
                  {showTaxDetails ? '税率詳細を非表示' : '税率詳細を表示'}
                </button>
                
                {/* 税率別の詳細表示 */}
                {showTaxDetails && Object.keys(taxBreakdown).length > 0 && (
                  <div className="text-sm text-gray-600 mb-2 border border-gray-200 rounded p-2">
                    <div className="font-medium mb-1">税率別詳細:</div>
                    {Object.entries(taxBreakdown).map(([rate, details]) => (
                      <div key={rate} className="flex justify-between">
                        <span>{rate}対象: ¥{details.subtotal.toLocaleString()}</span>
                        <span>税額: ¥{details.tax.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="text-lg text-gray-700 mb-2">
                  消費税合計: <span className="font-bold">¥{totalTax.toLocaleString()}</span>
                </div>
                <div className="text-xl font-bold text-gray-700 border-t pt-2">
                  合計: ¥{(totalAmount + totalTax).toLocaleString()}
                </div>
              </div>
            )}

            {/* 購入ボタン */}
            <button
              onClick={handlePurchase}
              disabled={cart.length === 0 || loading}
              className="w-full py-4 text-xl font-bold text-white rounded-xl transition 
                disabled:bg-gray-300 disabled:cursor-not-allowed
                bg-gradient-to-r from-gray-600 to-gray-800 hover:opacity-90"
            >
              {loading ? '処理中...' : '購入する'}
            </button>

            {/* 購入履歴表示ボタン */}
            <button
              onClick={togglePurchaseHistory}
              className="w-full mt-3 py-3 text-lg font-semibold text-gray-700 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-blue-200 transition"
            >
              {showPurchaseHistory ? '購入履歴を非表示' : '購入履歴を表示'}
            </button>
          </div>
        </div>

        {/* 購入履歴 */}
        {showPurchaseHistory && (
          <div className="mt-8 bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">購入履歴</h2>
            {purchaseHistory.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                購入履歴がありません
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {purchaseHistory.map((purchase) => (
                  <div key={purchase.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="text-sm text-gray-600">購入日時</p>
                        <p className="font-medium text-gray-800 text-sm">{purchase.purchase_date}</p>
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
            )}
          </div>
        )}
      </div>
    </div>
  )
}
