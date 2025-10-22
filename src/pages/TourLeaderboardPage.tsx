import { RyderCupTournamentLeaderboard } from "@/components/tournament/RyderCupTournamentLeaderboard";
import { TournamentLeaderboard } from "@/components/tournament/TournamentLeaderboard";
import { useTour } from "@/hooks/useTours";
import { useParams, Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";

export const TourLeaderboardPage = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const { data: tour, isLoading } = useTour(tourId!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-3xl">🏆</span>
          </div>
          <div className="text-lg font-semibold text-slate-700">
            Loading tournament...
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
            <Link to="/" className="btn-primary">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if tournament has any completed rounds
  const hasCompletedRounds = tour.rounds.some(
    (r) => r.status === "completed" || r.completedAt
  );

  const isRyderCup = tour.format === "ryder-cup";

  const breadcrumbs = [
    { label: "Home", path: "/", icon: "🏠" },
    { label: tour.name, path: `/tour/${tourId}`, icon: "⛳" },
    { label: "Leaderboard", icon: "🏆" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 safe-area-top">
      <PageHeader
        title={tour.name}
        subtitle={tour.description}
        breadcrumbs={breadcrumbs}
        backPath="/"
        showShare={true}
        shareUrl={`${window.location.origin}/tour/${tourId}`}
      />

      <div className="px-4 -mt-4 pb-8 w-full max-w-6xl mx-auto">
        <div className="card-elevated card-spacing mt-1">
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="bg-slate-50 rounded-lg p-3 md:p-4 text-center">
              <div className="text-xl md:text-2xl mb-1">👥</div>
              <div className="text-xl md:text-2xl font-bold text-slate-900">
                {tour.players.length}
              </div>
              <div className="text-xs text-slate-500 font-medium">Players</div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 md:p-4 text-center">
              <div className="text-xl md:text-2xl mb-1">📋</div>
              <div className="text-xl md:text-2xl font-bold text-slate-900">
                {tour.rounds.length}
              </div>
              <div className="text-xs text-slate-500 font-medium">Rounds</div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 md:p-4 text-center">
              <div className="text-xl md:text-2xl mb-1">
                {tour.format === "individual"
                  ? "👤"
                  : tour.format === "team"
                  ? "👥"
                  : "🏆"}
              </div>
              <div className="text-base md:text-lg font-bold text-slate-900 capitalize">
                {tour.format.replace("-", " ")}
              </div>
              <div className="text-xs text-slate-500 font-medium">Format</div>
            </div>
          </div>
        </div>

        {!hasCompletedRounds ? (
          <div className="card text-center py-12">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🏆</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-3">
              No Scores Yet
            </h3>
            <p className="text-slate-500 mb-6">
              The leaderboard will appear once rounds are completed
            </p>
            <Link to={`/tour/${tourId}/rounds`} className="btn-primary">
              View Rounds
            </Link>
          </div>
        ) : isRyderCup ? (
          <RyderCupTournamentLeaderboard tour={tour} />
        ) : (
          <TournamentLeaderboard tour={tour} />
        )}
      </div>
    </div>
  );
};
