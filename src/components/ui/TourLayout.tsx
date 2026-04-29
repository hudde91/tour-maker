import { Navigate, Outlet, useParams } from "react-router-dom";
import { Home, Users, ClipboardList, Trophy, Settings } from "lucide-react";
import { BottomNav } from "../BottomNav";
import { useTour } from "../../hooks/useTours";
import { useAuth } from "../../contexts/AuthContext";
import { useEnsureOwnerIsPlayer } from "../../hooks/useEnsureOwnerIsPlayer";
import { useReconcileTeamCaptains } from "../../hooks/useReconcileTeamCaptains";

export const TourLayout = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { data: tour, isLoading: tourLoading } = useTour(tourId!);

  // Backfill the owner into `tour.players` if a previous flow skipped it.
  useEnsureOwnerIsPlayer(tour);

  // Self-heal teams whose captain isn't in `team.playerIds` (old addTeam bug).
  useReconcileTeamCaptains(tour);

  // Funnel non-participants (and signed-out visitors) through the join flow
  // so old `/tour/:id` share links keep working.
  if (!authLoading && !user) {
    return <Navigate to={`/tour/${tourId}/join`} replace />;
  }
  if (
    user &&
    !tourLoading &&
    tour &&
    !tour.participantIds.includes(user.uid)
  ) {
    return <Navigate to={`/tour/${tourId}/join`} replace />;
  }

  const activeRoundsCount =
    tour?.rounds.filter((r) => r.status === "in-progress").length || 0;

  const tabs = [
    {
      id: "home",
      label: "Home",
      icon: <Home size={22} strokeWidth={2} />,
      path: "/",
    },
    {
      id: "players",
      label: "Players",
      icon: <Users size={22} strokeWidth={2} />,
      path: `/tour/${tourId}/players`,
    },
    {
      id: "rounds",
      label: "Rounds",
      icon: <ClipboardList size={22} strokeWidth={2} />,
      path: `/tour/${tourId}/rounds`,
      badge: activeRoundsCount, // Show badge if there are active rounds
    },
    {
      id: "leaderboard",
      label: "Leaderboard",
      icon: <Trophy size={22} strokeWidth={2} />,
      path: `/tour/${tourId}/leaderboard`,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings size={22} strokeWidth={2} />,
      path: `/tour/${tourId}/settings`,
    },
  ];

  return (
    <div className="min-h-screen pb-20">
      <Outlet />
      <BottomNav tabs={tabs} />
    </div>
  );
};
