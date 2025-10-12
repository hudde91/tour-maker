import { Outlet, useParams } from "react-router-dom";
import { BottomNav } from "../BottomNav";
import { useTour } from "../../hooks/useTours";

export const TourLayout = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const { data: tour } = useTour(tourId!);

  const activeRoundsCount =
    tour?.rounds.filter((r) => r.status === "in-progress").length || 0;

  const tabs = [
    {
      id: "leaderboard",
      label: "Leaderboard",
      icon: "🏆",
      path: `/tour/${tourId}`,
    },
    {
      id: "rounds",
      label: "Rounds",
      icon: "📋",
      path: `/tour/${tourId}/rounds`,
      badge: activeRoundsCount, // Show badge if there are active rounds
    },
    {
      id: "players",
      label: "Players",
      icon: "👥",
      path: `/tour/${tourId}/players`,
    },
    {
      id: "settings",
      label: "Settings",
      icon: "⚙️",
      path: `/tour/${tourId}/settings`,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Outlet />
      <BottomNav tabs={tabs} />
    </div>
  );
};
