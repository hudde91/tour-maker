import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, X } from "lucide-react";

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 animate-slide-up">
      <div className="flex items-center gap-3 bg-emerald-700 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-600 max-w-sm w-full">
        <div className="flex-shrink-0 bg-emerald-600 rounded-full p-2">
          <RefreshCw size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Update available</p>
          <p className="text-xs text-emerald-200">Tap to get the latest version</p>
        </div>
        <button
          onClick={() => updateServiceWorker(true)}
          className="flex-shrink-0 bg-white text-emerald-700 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-emerald-50 transition-colors"
        >
          Update
        </button>
        <button
          onClick={() => setNeedRefresh(false)}
          className="flex-shrink-0 p-1.5 hover:bg-emerald-600 rounded-lg transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
