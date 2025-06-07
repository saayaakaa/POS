import { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';

const Result: NextPage = () => {
  const router = useRouter();
  const [success, setSuccess] = useState<boolean | null>(null);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [purchaseId, setPurchaseId] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (router.query.success) {
      setSuccess(router.query.success === 'true');
      if (router.query.totalAmount) {
        setTotalAmount(parseInt(router.query.totalAmount as string));
      }
      if (router.query.purchaseId) {
        setPurchaseId(router.query.purchaseId as string);
      }
      if (router.query.error) {
        setError(router.query.error as string);
      }
    }
  }, [router.query]);

  if (success === null) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-2xl">⏳</span>
            </div>
            <p className="text-gray-600 font-medium">処理中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-md p-8 text-center">
          {success ? (
            <>
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">✅</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                購入完了！
              </h1>
              <p className="text-gray-600 mb-6">
                ご購入ありがとうございました！
              </p>
              
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-6 mb-6">
                <div className="space-y-4">
                  {purchaseId && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">📋 購入ID:</span>
                      <span className="font-bold text-green-700">{purchaseId}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">💰 合計金額:</span>
                    <span className="font-bold text-2xl text-green-700">¥{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">📅 購入日時:</span>
                    <span className="font-medium text-green-700">{new Date().toLocaleString('ja-JP')}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-gradient-to-r from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">❌</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                購入失敗
              </h1>
              <p className="text-red-600 mb-6 font-medium">
                {error || '購入処理中にエラーが発生しました。'}
              </p>
              
              <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl p-6 mb-6">
                <p className="text-gray-700 font-medium">
                  😔 申し訳ございません。もう一度お試しください。
                </p>
              </div>
            </>
          )}

          <div className="space-y-4">
            <Link 
              href="/search"
              className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-400 to-pink-400 hover:opacity-90 transition block text-center"
            >
              🔍 新しい商品を検索
            </Link>
            <Link 
              href="/"
              className="w-full py-4 rounded-xl font-semibold text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 hover:opacity-90 transition block text-center"
            >
              🏠 トップページに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Result; 