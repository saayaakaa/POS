import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

interface BarcodeScannerProps {
  onScanSuccess: (code: string) => void;
  onScanError: (error: string) => void;
  isActive: boolean;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScanSuccess,
  onScanError,
  isActive,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [reader, setReader] = useState<BrowserMultiFormatReader | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isHttpsRequired, setIsHttpsRequired] = useState(false);

  useEffect(() => {
    if (isActive) {
      initializeScanner();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isActive]);

  // ブラウザ対応チェック
  const checkBrowserSupport = (): { supported: boolean; error?: string } => {
    // HTTPS要件チェック
    const isSecure = window.location.protocol === 'https:' || 
                    window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';
    
    if (!isSecure) {
      setIsHttpsRequired(true);
      return {
        supported: false,
        error: 'カメラアクセスにはHTTPS接続が必要です。本番環境ではHTTPS URLでアクセスしてください。'
      };
    }

    // MediaDevices API対応チェック
    if (!navigator.mediaDevices) {
      return {
        supported: false,
        error: 'お使いのブラウザはカメラアクセスに対応していません。Chrome、Safari、Firefoxの最新版をお試しください。'
      };
    }

    // getUserMedia対応チェック
    if (!navigator.mediaDevices.getUserMedia) {
      return {
        supported: false,
        error: 'お使いのブラウザはカメラアクセス機能に対応していません。ブラウザを最新版に更新してください。'
      };
    }

    return { supported: true };
  };

  const initializeScanner = async () => {
    try {
      // ブラウザ対応チェック
      const supportCheck = checkBrowserSupport();
      if (!supportCheck.supported) {
        setErrorMessage(supportCheck.error || '');
        setHasPermission(false);
        onScanError(supportCheck.error || 'ブラウザが対応していません');
        return;
      }

      // カメラ権限の確認（対応している場合のみ）
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
          setHasPermission(permission.state === 'granted');
        } catch (permError) {
          console.log('権限チェックをスキップ:', permError);
          // 権限チェックに失敗してもカメラアクセスを試行
        }
      }

      // カメラストリームの取得
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment', // 背面カメラを優先
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setHasPermission(true);
      setErrorMessage('');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      // ZXingリーダーの初期化
      const codeReader = new BrowserMultiFormatReader();
      setReader(codeReader);
      setIsScanning(true);

      // バーコードスキャン開始
      startScanning(codeReader);

    } catch (error) {
      console.error('カメラ初期化エラー:', error);
      setHasPermission(false);
      
      let errorMsg = 'カメラにアクセスできません。';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMsg = 'カメラの使用が拒否されました。ブラウザの設定でカメラの使用を許可してください。';
        } else if (error.name === 'NotFoundError') {
          errorMsg = 'カメラが見つかりません。デバイスにカメラが接続されているか確認してください。';
        } else if (error.name === 'NotSupportedError') {
          errorMsg = 'お使いのブラウザはカメラアクセスに対応していません。';
        } else if (error.name === 'NotReadableError') {
          errorMsg = 'カメラが他のアプリケーションで使用中です。他のアプリを閉じてから再試行してください。';
        }
      }
      
      setErrorMessage(errorMsg);
      onScanError(errorMsg);
    }
  };

  const startScanning = async (codeReader: BrowserMultiFormatReader) => {
    if (!videoRef.current) return;

    try {
      const result = await codeReader.decodeFromVideoDevice(
        undefined, // デフォルトのビデオデバイスを使用
        videoRef.current,
        (result, error) => {
          if (result) {
            const scannedCode = result.getText();
            
            // JANコード13桁の検証
            if (/^\d{13}$/.test(scannedCode)) {
              onScanSuccess(scannedCode);
              stopScanning();
              onClose();
            } else {
              onScanError(`無効なバーコード形式です。JANコード13桁が必要です。（読み取り値: ${scannedCode}）`);
            }
          }
          
          if (error && !(error instanceof NotFoundException)) {
            console.error('スキャンエラー:', error);
          }
        }
      );
    } catch (error) {
      console.error('スキャン開始エラー:', error);
      onScanError('バーコードスキャンを開始できませんでした。');
    }
  };

  const stopScanning = () => {
    if (reader) {
      reader.reset();
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    setIsScanning(false);
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">バーコードスキャン</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {hasPermission === false && (
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              カメラへのアクセスができません
            </div>
            
            {isHttpsRequired && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="text-yellow-800 text-sm">
                  <strong>HTTPS接続が必要です</strong>
                  <p className="mt-2">
                    モバイルデバイスでカメラを使用するには、HTTPS接続が必要です。
                    本番環境では https:// で始まるURLでアクセスしてください。
                  </p>
                </div>
              </div>
            )}
            
            <p className="text-sm text-gray-600 mb-4">
              {errorMessage || 'ブラウザの設定でカメラの使用を許可してください。'}
            </p>
            
            <div className="text-xs text-gray-500 mb-4">
              <p>対応ブラウザ:</p>
              <p>• Chrome 53+</p>
              <p>• Safari 11+</p>
              <p>• Firefox 36+</p>
              <p>• Edge 12+</p>
            </div>
            
            <button
              onClick={initializeScanner}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              再試行
            </button>
          </div>
        )}

        {hasPermission === true && (
          <div>
            <div className="relative mb-4">
              <video
                ref={videoRef}
                className="w-full h-64 bg-black rounded"
                autoPlay
                playsInline
                muted
              />
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-red-500 w-48 h-32 bg-transparent"></div>
                </div>
              )}
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                JANコード13桁のバーコードを赤い枠内に合わせてください
              </p>
              <p className="text-xs text-gray-500">
                自動的に読み取りが開始されます
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-center">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner; 