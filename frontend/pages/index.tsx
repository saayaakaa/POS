import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // アプリ起動時に自動的にサーチページにリダイレクト
    router.push('/search');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
          <span className="text-2xl">🔍</span>
        </div>
        <p className="text-gray-600">商品検索ページに移動中...</p>
      </div>
    </div>
  );
} 