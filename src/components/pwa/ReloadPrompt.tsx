import { useRegisterSW } from "virtual:pwa-register/react";

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between rounded-lg bg-green-600 px-4 py-3 text-white shadow-lg sm:left-auto sm:right-4 sm:w-auto">
      <span className="mr-4 text-sm font-medium">
        New version available
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => updateServiceWorker(true)}
          className="rounded bg-white px-3 py-1 text-sm font-medium text-green-700 hover:bg-green-50"
        >
          Update
        </button>
        <button
          onClick={() => setNeedRefresh(false)}
          className="rounded px-3 py-1 text-sm font-medium text-green-100 hover:text-white"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
