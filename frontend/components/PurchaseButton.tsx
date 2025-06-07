interface PurchaseButtonProps {
  onPurchase: () => void;
  loading: boolean;
  disabled: boolean;
}

const PurchaseButton: React.FC<PurchaseButtonProps> = ({ 
  onPurchase, 
  loading, 
  disabled 
}) => {
  return (
    <button
      onClick={onPurchase}
      disabled={disabled || loading}
      className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          処理中...
        </div>
      ) : (
        '購入する'
      )}
    </button>
  );
};

export default PurchaseButton; 