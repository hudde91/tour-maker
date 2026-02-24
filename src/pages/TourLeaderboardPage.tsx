import { RyderCupTournamentLeaderboard } from "@/components/tournament/RyderCupTournamentLeaderboard";
import { TournamentLeaderboard } from "@/components/tournament/TournamentLeaderboard";
import { useTour } from "@/hooks/useTours";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useParams, Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Trophy, XCircle, Users, ClipboardList, User } from "lucide-react";

export const TourLeaderboardPage = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const { data: tour, isLoading } = useTour(tourId!);
  useDocumentTitle(tour ? `${tour.name} - Leaderboard` : "Leaderboard");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Trophy className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="text-lg font-semibold text-white/70">
            Loading tournament...
          </div>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen safe-area-top">
        <div className="p-4 md:p-6">
          <div className="card text-center py-12">
            <div className="w-20 h-20 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-white/70 mb-3">
              Tournament Not Found
            </h3>
            <p className="text-white/40 mb-6">
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

  // Check if tournament has any completed or in-progress rounds
  const hasCompletedRounds = tour.rounds.some(
    (r) =>
      r.status === "completed" || r.completedAt || r.status === "in-progress",
  );

  const isRyderCup = tour.format === "ryder-cup";

  const breadcrumbs = [
    { label: "Home", path: "/", icon: "home" },
    { label: tour.name, path: `/tour/${tourId}`, icon: "flag" },
    { label: "Leaderboard", icon: "trophy" },
  ];

  return (
    <div className="min-h-screen safe-area-top">
      <PageHeader
        title={tour.name}
        subtitle={tour.description}
        breadcrumbs={breadcrumbs}
        showShare={true}
        shareUrl={`${window.location.origin}/tour/${tourId}`}
      />

      <div className="pb-8 w-full max-w-6xl mx-auto">
        <div className="card-elevated rounded-2xl card-spacing">
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="p-3 md:p-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-1 text-white/50" />
              <div className="text-xl md:text-2xl font-bold text-white">
                {tour.players.length}
              </div>
              <div className="text-xs text-white/40 font-medium">Players</div>
            </div>

            <div className="rounded-lg p-3 md:p-4 text-center">
              <ClipboardList className="w-6 h-6 mx-auto mb-1 text-white/50" />
              <div className="text-xl md:text-2xl font-bold text-white">
                {tour.rounds.length}
              </div>
              <div className="text-xs text-white/40 font-medium">Rounds</div>
            </div>

            <div className="rounded-lg p-3 md:p-4 text-center">
              {tour.format === "individual" ? (
                <User className="w-6 h-6 mx-auto mb-1 text-white/50" />
              ) : tour.format === "team" ? (
                <Users className="w-6 h-6 mx-auto mb-1 text-white/50" />
              ) : (
                <Trophy className="w-6 h-6 mx-auto mb-1 text-white/50" />
              )}
              <div className="text-base md:text-lg font-bold text-white capitalize">
                {tour.format.replace("-", " ")}
              </div>
              <div className="text-xs text-white/40 font-medium">Format</div>
            </div>
          </div>
        </div>

        {!hasCompletedRounds ? (
          <div className="card text-center py-12">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-white/30" />
            </div>
            <h3 className="text-xl font-semibold text-white/70 mb-3">
              No Scores Yet
            </h3>
            <p className="text-white/40 mb-6">
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
