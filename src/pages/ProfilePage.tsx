import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "../contexts/AuthContext";
import { useUserProfile, useUpdateHandicap } from "../hooks/useUserProfile";
import { useTours } from "../hooks/useTours";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { Home, User, Pencil, Check, X, Trophy, Target, TrendingUp, Award } from "lucide-react";
import { BottomNav } from "../components/BottomNav";
import { Link } from "react-router-dom";
import { PlusCircle, Settings } from "lucide-react";
import { isRoundCompleted } from "../lib/roundUtils";

export const ProfilePage = () => {
  useDocumentTitle("My Profile");
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile(
    user?.uid ?? null
  );
  const { data: tours = [] } = useTours();
  const updateHandicap = useUpdateHandicap();
  const { showToast, ToastComponent } = useToast();

  const [isEditingHandicap, setIsEditingHandicap] = useState(false);
  const [handicapInput, setHandicapInput] = useState("");

  useEffect(() => {
    if (profile?.handicap != null) {
      setHandicapInput(profile.handicap.toString());
    } else {
      setHandicapInput("");
    }
  }, [profile?.handicap]);

  // Calculate player stats from tours
  const stats = useMemo(() => {
    if (!user || tours.length === 0) {
      return {
        tournamentsPlayed: 0,
        roundsPlayed: 0,
        totalHoles: 0,
        bestRoundScore: null as number | null,
        averageScore: null as number | null,
      };
    }

    let tournamentsPlayed = 0;
    let roundsPlayed = 0;
    let totalHoles = 0;
    let totalStrokes = 0;
    let bestRoundScore: number | null = null;

    tours.forEach((tour) => {
      const player = tour.players.find((p) => p.userId === user.uid);
      if (!player) return;

      let hasPlayedInTour = false;

      tour.rounds.forEach((round) => {
        if (!isRoundCompleted(round)) return;
        const playerScore = round.scores[player.id];
        if (!playerScore || playerScore.totalScore <= 0) return;

        hasPlayedInTour = true;
        roundsPlayed++;
        totalStrokes += playerScore.totalScore;

        const holesPlayed = playerScore.scores.filter(
          (s) => s !== null && s > 0
        ).length;
        totalHoles += holesPlayed;

        if (
          bestRoundScore === null ||
          playerScore.totalScore < bestRoundScore
        ) {
          bestRoundScore = playerScore.totalScore;
        }
      });

      if (hasPlayedInTour) {
        tournamentsPlayed++;
      }
    });

    const averageScore =
      roundsPlayed > 0 ? Math.round((totalStrokes / roundsPlayed) * 10) / 10 : null;

    return {
      tournamentsPlayed,
      roundsPlayed,
      totalHoles,
      bestRoundScore,
      averageScore,
    };
  }, [user, tours]);

  const handleEditHandicap = () => {
    setHandicapInput(
      profile?.handicap != null ? profile.handicap.toString() : ""
    );
    setIsEditingHandicap(true);
  };

  const handleCancelEdit = () => {
    setIsEditingHandicap(false);
    setHandicapInput(
      profile?.handicap != null ? profile.handicap.toString() : ""
    );
  };

  const handleSaveHandicap = async () => {
    if (!user) return;

    const normalized = handicapInput.replace(",", ".").trim();
    const handicapValue = normalized ? parseFloat(normalized) : undefined;

    if (handicapValue !== undefined && (handicapValue < 0 || handicapValue > 54 || isNaN(handicapValue))) {
      showToast("Handicap must be between 0 and 54", "error");
      return;
    }

    try {
      await updateHandicap.mutateAsync({
        userId: user.uid,
        handicap: handicapValue,
      });
      setIsEditingHandicap(false);
      showToast("Handicap updated successfully", "success");
    } catch (error) {
      console.error("Failed to update handicap:", error);
      showToast("Failed to update handicap", "error");
    }
  };

  const tabs = [
    {
      id: "home",
      label: "Home",
      icon: <Home size={22} strokeWidth={2} />,
      path: "/",
    },
    {
      id: "create",
      label: "Create",
      icon: <PlusCircle size={22} strokeWidth={2} />,
      path: "/create",
    },
    {
      id: "profile",
      label: "Profile",
      icon: <User size={22} strokeWidth={2} />,
      path: "/profile",
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings size={22} strokeWidth={2} />,
      path: "/settings",
    },
  ];

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <User className="text-emerald-400" size={32} strokeWidth={2} />
          </div>
          <div className="text-lg font-semibold text-white/70">
            Loading profile...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center px-4">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="text-white/40" size={32} strokeWidth={2} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Sign in to view your profile
          </h2>
          <p className="text-white/50 mb-4">
            You need to be signed in to view and edit your profile.
          </p>
          <Link to="/" className="btn-primary">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const breadcrumbs = [
    { label: "Home", path: "/", icon: <Home size={16} strokeWidth={2} /> },
    { label: "Profile", icon: <User size={16} strokeWidth={2} /> },
  ];

  // Handicap ring percentage (0-54 scale, lower = better = more filled)
  const handicapPercent = profile?.handicap != null
    ? Math.max(0, Math.min(100, (1 - profile.handicap / 54) * 100))
    : 0;

  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference - (handicapPercent / 100) * circumference;

  return (
    <div className="min-h-screen pb-24">
      <PageHeader
        title="My Profile"
        subtitle="Your player identity and stats"
        breadcrumbs={breadcrumbs}
      />

      <div className="pb-8 w-full max-w-6xl mx-auto space-y-6">
        {/* Player Card - Sports Trading Card Style */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10"
          style={{
            background: "linear-gradient(135deg, rgba(5, 150, 105, 0.15) 0%, rgba(6, 182, 212, 0.08) 50%, rgba(16, 185, 129, 0.1) 100%)",
          }}
        >
          {/* Top accent gradient */}
          <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />

          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-4 sm:gap-6">
              {/* Avatar with Handicap Ring */}
              <div className="relative flex-shrink-0">
                <svg className="w-28 h-28 sm:w-32 sm:h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60" cy="60" r="52"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="6"
                  />
                  {profile?.handicap != null && (
                    <circle
                      cx="60" cy="60" r="52"
                      fill="none"
                      stroke="url(#handicapGradient)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-1000 ease-out"
                    />
                  )}
                  <defs>
                    <linearGradient id="handicapGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-white/10"
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center border-2 border-white/10">
                      <User size={36} className="text-emerald-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0 pt-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate"
                  style={{ fontFamily: "'Poppins', 'Inter', system-ui, sans-serif" }}
                >
                  {profile?.playerName || user.displayName || "Player"}
                </h2>
                <p className="text-sm text-white/40 mt-0.5 truncate">{user.email}</p>

                {/* Handicap badge */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5 border border-white/10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">HC</span>
                    <span className="text-lg font-bold text-white">
                      {profile?.handicap != null ? profile.handicap : "--"}
                    </span>
                  </div>
                  {!isEditingHandicap && (
                    <button
                      onClick={handleEditHandicap}
                      className="flex items-center gap-1 text-xs text-white/40 hover:text-emerald-400 transition-colors"
                    >
                      <Pencil size={12} />
                      Edit
                    </button>
                  )}
                </div>

                {profile?.createdAt && (
                  <p className="text-[11px] text-white/25 mt-2">
                    Member since {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </p>
                )}
              </div>
            </div>

            {/* Handicap edit form */}
            {isEditingHandicap && (
              <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Update Handicap
                </label>
                <input
                  type="number"
                  value={handicapInput}
                  onChange={(e) => setHandicapInput(e.target.value)}
                  className="input-field text-lg"
                  placeholder="Enter handicap (0-54)"
                  min="0"
                  max="54"
                  step="0.1"
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveHandicap}
                    disabled={updateHandicap.isPending}
                    className="btn-primary flex items-center gap-2 py-2 px-4 disabled:opacity-50"
                  >
                    <Check size={16} />
                    {updateHandicap.isPending ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="btn-secondary flex items-center gap-2 py-2 px-4"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={<Trophy size={18} className="text-amber-400" />}
            label="Tournaments"
            value={stats.tournamentsPlayed}
          />
          <StatCard
            icon={<Target size={18} className="text-emerald-400" />}
            label="Rounds"
            value={stats.roundsPlayed}
          />
          <StatCard
            icon={<TrendingUp size={18} className="text-blue-400" />}
            label="Best Round"
            value={stats.bestRoundScore ?? "--"}
          />
          <StatCard
            icon={<Award size={18} className="text-purple-400" />}
            label="Avg Score"
            value={stats.averageScore ?? "--"}
          />
        </div>

        {/* Detailed Stats */}
        {stats.roundsPlayed > 0 && (
          <div className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.02]">
            <div className="px-4 py-3 border-b border-white/10 bg-white/[0.03]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Career Summary
              </h3>
            </div>
            <div className="divide-y divide-white/6">
              <StatRow label="Total Holes Played" value={stats.totalHoles.toLocaleString()} />
              <StatRow label="Tournaments Entered" value={stats.tournamentsPlayed} />
              <StatRow label="Rounds Completed" value={stats.roundsPlayed} />
              {stats.bestRoundScore && (
                <StatRow label="Personal Best (18 holes)" value={stats.bestRoundScore} highlight />
              )}
              {stats.averageScore && (
                <StatRow label="Average Round Score" value={stats.averageScore} />
              )}
            </div>
          </div>
        )}

        {/* Empty state for new players */}
        {stats.roundsPlayed === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target size={24} className="text-white/30" />
            </div>
            <h3 className="text-base font-semibold text-white/60 mb-2">
              No rounds played yet
            </h3>
            <p className="text-sm text-white/30 mb-4 max-w-sm mx-auto">
              Join a tournament and complete rounds to start tracking your stats
            </p>
            <Link to="/create" className="btn-primary inline-flex items-center gap-2">
              <PlusCircle size={16} />
              Create Tournament
            </Link>
          </div>
        )}
      </div>

      <BottomNav tabs={tabs} />
      <ToastComponent />
    </div>
  );
};

/** Small stat card for the grid */
const StatCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) => (
  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/40">
        {label}
      </span>
    </div>
    <div className="text-2xl sm:text-3xl font-bold text-white"
      style={{ fontFamily: "'Poppins', 'Inter', system-ui, sans-serif" }}
    >
      {value}
    </div>
  </div>
);

/** Simple row for detailed stats list */
const StatRow = ({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) => (
  <div className="flex items-center justify-between px-4 py-2.5">
    <span className="text-sm text-white/50">{label}</span>
    <span
      className={`text-sm font-semibold ${
        highlight ? "text-emerald-400" : "text-white"
      }`}
    >
      {value}
    </span>
  </div>
);
