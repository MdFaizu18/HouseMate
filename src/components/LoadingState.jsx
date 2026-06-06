export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-sm text-[#8896b0] animate-pulse">{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 px-4 text-center">
      <p className="text-sm text-red-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs px-4 py-2 rounded-lg bg-[#1a2236] border border-[#1e2d45] text-white hover:border-emerald-500/30 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export default LoadingState;
