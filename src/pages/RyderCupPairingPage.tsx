import { useParams, useNavigate } from "react-router-dom";
import { useTour } from "../hooks/useTours";
import { CaptainPairingInterface } from "../components/matchplay/rydercup/CaptainPairingInterface";

export const RyderCupPairingPage = () => {
  const { tourId, roundId } = useParams<{ tourId: string; roundId: string }>();
  const navigate = useNavigate();
  const { data: tour, isLoading } = useTour(tourId!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-3xl">⚙️</span>
          </div>
          <div className="text-lg font-semibold text-slate-700">
            Loading pairing interface...
          </div>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-slate-50 safe-area-top">
        <div className="p-4 md:p-6">
          <div className="card text-center py-12">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">❌</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-3">
              Tournament Not Found
            </h3>
            <p className="text-slate-500 mb-6">
              The tournament you're looking for doesn't exist or has been
              removed.
            </p>
            <button onClick={() => navigate("/")} className="btn-primary">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const round = tour.rounds.find((r) => r.id === roundId);

  if (!round) {
    return (
      <div className="min-h-screen bg-slate-50 safe-area-top">
        <div className="p-4 md:p-6">
          <div className="card text-center py-12">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">❌</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-3">
              Round Not Found
            </h3>
            <p className="text-slate-500 mb-6">
              The round you're looking for doesn't exist.
            </p>
            <button
              onClick={() => navigate(`/tour/${tourId}`)}
              className="btn-primary"
            >
              Back to Tournament
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 safe-area-top pb-20">
      <div className="golf-hero-bg">
        <div className="p-4 md:p-6 w-full max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(`/tour/${tourId}/round/${roundId}`)}
              className="nav-back"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Setup Pairings
              </h1>
              <p className="text-emerald-100 text-sm md:text-base">
                {round.name} • {tour.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-6xl mx-auto -mt-4">
        <CaptainPairingInterface
          round={round}
          tour={tour}
          onClose={() => navigate(`/tour/${tourId}/round/${roundId}`)}
          onPaired={() => navigate(`/tour/${tourId}/round/${roundId}`)}
        />
      </div>
    </div>
  );
};
