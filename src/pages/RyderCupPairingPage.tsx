import { useParams, useNavigate } from "react-router-dom";
import { useTour } from "../hooks/useTours";
import { CaptainPairingInterface } from "../components/matchplay/rydercup/CaptainPairingInterface";
import { PageHeader } from "../components/ui/PageHeader";
import { Settings, XCircle, Home, Flag, ClipboardList, Flag as GolfFlag, Swords } from "lucide-react";

export const RyderCupPairingPage = () => {
  const { tourId, roundId } = useParams<{ tourId: string; roundId: string }>();
  const navigate = useNavigate();
  const { data: tour, isLoading } = useTour(tourId!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Settings className="w-8 h-8 text-emerald-600" />
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
              <XCircle className="w-10 h-10 text-red-600" />
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
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-3">
              Round Not Found
            </h3>
            <p className="text-slate-500 mb-6">
              The round you're looking for doesn't exist.
            </p>
            <button
              onClick={() => navigate(`/tour/${tourId}/rounds`)}
              className="btn-primary"
            >
              Back to Tournament
            </button>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbs = [
    { label: "Home", path: "/", icon: <Home className="w-4 h-4" /> },
    { label: tour.name, path: `/tour/${tourId}`, icon: <Flag className="w-4 h-4" /> },
    { label: "Rounds", path: `/tour/${tourId}/rounds`, icon: <ClipboardList className="w-4 h-4" /> },
    { label: round.name, path: `/tour/${tourId}/round/${roundId}`, icon: <GolfFlag className="w-4 h-4" /> },
    { label: "Setup Pairings", icon: <Swords className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 safe-area-top pb-20">
      <PageHeader
        title="Setup Pairings"
        subtitle={`${round.name} • ${tour.name}`}
        breadcrumbs={breadcrumbs}
        backPath={`/tour/${tourId}/round/${roundId}`}
      />

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
