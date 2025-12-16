import { Outlet, useParams } from "react-router-dom";
import { Home, Users, ClipboardList, Trophy, Settings } from "lucide-react";
import { BottomNav } from "../BottomNav";
import { useTour } from "../../hooks/useTours";

export const TourLayout = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const { data: tour } = useTour(tourId!);

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
    <div className="min-h-screen bg-slate-50 pb-20">
      <Outlet />
      <BottomNav tabs={tabs} />
    </div>
  );
};
