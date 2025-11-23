import { useState } from "react";
import { useClaimPlayerByCode } from "../../hooks/usePlayers";
import { getDeviceId } from "../../lib/deviceIdentity";

interface ClaimPlayerCodeDialogProps {
  tourId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ClaimPlayerCodeDialog = ({
  tourId,
  isOpen,
  onClose,
}: ClaimPlayerCodeDialogProps) => {
  const [playerCode, setPlayerCode] = useState("");
  const claimByCode = useClaimPlayerByCode(tourId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerCode.trim() || playerCode.length !== 6) {
      alert("Please enter a valid 6-digit player code");
      return;
    }

    try {
      const player = await claimByCode.mutateAsync({
        playerCode: playerCode.trim(),
        deviceId: getDeviceId(),
      });

      alert(`Successfully claimed player: ${player.name}`);
      setPlayerCode("");
      onClose();
    } catch (error) {
      console.error("Failed to claim player by code:", error);
      alert("Invalid player code. Please check and try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 mx-4">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Claim Player by Code
            </h2>
            <p className="text-slate-600 mt-1 text-sm">
              Enter your 6-digit player code
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Player Code
            </label>
            <input
              type="text"
              value={playerCode}
              onChange={(e) => setPlayerCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full px-4 py-3 text-2xl font-mono font-bold text-center border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              placeholder="000000"
              maxLength={6}
              inputMode="numeric"
              pattern="[0-9]*"
              autoFocus
            />
            <p className="text-slate-500 text-sm mt-2">
              Your player code was provided when the tournament was created. It allows you to claim your player on any device.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={claimByCode.isPending || playerCode.length !== 6}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {claimByCode.isPending ? "Claiming..." : "Claim Player"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
