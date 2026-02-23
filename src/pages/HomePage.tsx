import { Link } from "react-router-dom";
import {
  Home,
  PlusCircle,
  Settings,
  User,
  Users,
  Trophy,
  Flag,
  ClipboardList,
  Tag,
  Calendar,
  Dice5,
  RefreshCw,
  LogIn,
} from "lucide-react";
import { useTours } from "../hooks/useTours";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { HowItWorksModal } from "@/components/ui/Howitworksmodal";
import { BottomNav } from "../components/BottomNav";
import { CreateMockDataDialog } from "@/components/mock/CreateMockDataDialog";
import { Logo } from "@/components/ui/Logo";
import { AuthButton } from "@/components/auth/AuthButton";
import { useAuth } from "../contexts/AuthContext";
import { usePullToRefresh } from "../hooks/usePullToRefresh";

export const HomePage = () => {
  useDocumentTitle("My Tournaments");
  const { data: tours = [], isLoading, error } = useTours();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const queryClient = useQueryClient();
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showMockDataDialog, setShowMockDataDialog] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign in failed:", error);
    } finally {
      setIsSigningIn(false);
    }
  };
  const [showMockDataFeatures, setShowMockDataFeatures] = useState(() => {
    if (!import.meta.env.DEV) return false;
    return localStorage.getItem("showMockDataFeatures") === "true";
  });

  const handleToggleMockDataFeatures = (checked: boolean) => {
    setShowMockDataFeatures(checked);
    localStorage.setItem("showMockDataFeatures", checked.toString());
  };

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["tours"] });
  }, [queryClient]);

  const { pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

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
      id: "settings",
      label: "Settings",
      icon: <Settings size={22} strokeWidth={2} />,
      path: "/settings",
    },
  ];

  // Show "How It Works" for first-time users
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome && tours.length === 0 && !isLoading) {
      setShowHowItWorks(true);
      localStorage.setItem("hasSeenWelcome", "true");
    }
  }, [tours.length, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white/60 font-medium">Loading tournaments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center px-4">
          <p className="text-red-400 font-medium mb-2">Failed to load tournaments</p>
          <p className="text-white/40 text-sm mb-4">{(error as Error).message}</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["tours"] })}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "individual":
        return <User size={20} strokeWidth={2.5} />;
      case "team":
        return <Users size={20} strokeWidth={2.5} />;
      case "ryder-cup":
        return <Trophy size={20} strokeWidth={2.5} />;
      default:
        return <Flag size={20} strokeWidth={2.5} />;
    }
  };

  const getStatusInfo = (tour: any) => {
    if (!tour.isActive) {
      return {
        text: "Completed",
        style: {
          color: "rgb(96, 165, 250)",
          background: "rgba(59, 130, 246, 0.15)",
          border: "1px solid rgba(59, 130, 246, 0.3)",
        },
      };
    }

    const hasActiveRounds = tour.rounds.some(
      (r: any) => r.status === "in-progress"
    );
    if (hasActiveRounds) {
      return {
        text: "Live",
        style: {
          color: "rgb(248, 113, 113)",
          background: "rgba(239, 68, 68, 0.15)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        },
      };
    }

    return {
      text: "Active",
      style: {
        color: "rgb(52, 211, 153)",
        background: "rgba(16, 185, 129, 0.15)",
        border: "1px solid rgba(16, 185, 129, 0.3)",
      },
    };
  };

  return (
    <div className="min-h-screen w-full">
      {/* Pull-to-refresh indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="fixed top-0 left-0 right-0 z-[55] flex items-center justify-center pointer-events-none"
          style={{ height: `${Math.max(pullDistance, isRefreshing ? 48 : 0)}px` }}
        >
          <RefreshCw
            size={24}
            className={`text-emerald-400 transition-transform ${
              isRefreshing ? "animate-spin" : ""
            }`}
            style={{
              transform: isRefreshing
                ? undefined
                : `rotate(${Math.min(pullDistance * 3, 360)}deg)`,
              opacity: Math.min(pullDistance / 40, 1),
            }}
          />
        </div>
      )}

      {/* Auth & Dev Mode */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 items-end">
        {user && (
          <div
            className="rounded-xl p-3"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            }}
          >
            <AuthButton />
          </div>
        )}
        {import.meta.env.DEV && (
          <div
            className="rounded-xl p-3"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            }}
          >
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showMockDataFeatures}
                onChange={(e) => handleToggleMockDataFeatures(e.target.checked)}
                className="w-4 h-4 text-purple-500 border-white/20 rounded focus:ring-purple-500 bg-white/10"
              />
              <span className="text-sm font-medium text-white/70">Dev Mode</span>
            </label>
          </div>
        )}
      </div>

      <div className="golf-hero-bg safe-area-top w-full">
        <div className="p-6 pb-12 w-full max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center">
            <Logo size="xl" variant="white" className="mb-4" />
            <p className="text-emerald-200/80 text-lg md:text-xl font-medium">
              Playing with drunk friends can actually be organized
            </p>
          </div>
        </div>
      </div>

      <div className="-mt-6 pb-8 w-full max-w-6xl mx-auto">
        {/* Sign-in banner for unauthenticated users */}
        {!authLoading && !user && (
          <div className="w-full max-w-2xl mx-auto mb-4 px-4">
            <div
              className="rounded-xl p-5 flex flex-col sm:flex-row items-center gap-4"
              style={{
                background: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
              }}
            >
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-semibold text-white mb-1">
                  Sign in to get started
                </h3>
                <p className="text-sm text-white/60">
                  Create and manage your golf tournaments by signing in with Google.
                </p>
              </div>
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-white transition-all disabled:opacity-50 whitespace-nowrap"
                style={{
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.7), rgba(37, 99, 235, 0.8))",
                  border: "1px solid rgba(96, 165, 250, 0.3)",
                  boxShadow: "0 0 20px rgba(59, 130, 246, 0.2), 0 8px 24px rgba(0, 0, 0, 0.3)",
                }}
              >
                <LogIn size={18} />
                {isSigningIn ? "Signing in..." : "Sign in with Google"}
              </button>
            </div>
          </div>
        )}

        <div className="card-elevated section-spacing w-full max-w-2xl mx-auto">
          <div className="text-center">
            <p className="text-white/60 text-lg section-spacing leading-relaxed">
              Get started by simply creating a golf tournament and follow the
              wizard
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center">
              <Link
                to="/create"
                className="btn-primary text-lg py-4 px-8 w-full sm:w-auto"
                data-testid="create-tournament-button"
              >
                Create Tournament
              </Link>
              {showMockDataFeatures && (
                <button
                  onClick={() => setShowMockDataDialog(true)}
                  className="btn-secondary text-lg py-4 px-8 w-full sm:w-auto flex items-center justify-center gap-2"
                  style={{
                    borderColor: "rgba(168, 85, 247, 0.3)",
                    color: "rgb(192, 132, 252)",
                  }}
                  data-testid="mock-data-button"
                >
                  <Dice5 size={20} />
                  Generate Mock Data
                </button>
              )}
              <button
                onClick={() => setShowHowItWorks(true)}
                className="btn-secondary text-lg py-4 px-8 w-full sm:w-auto"
                data-testid="how-it-works-button"
              >
                How It Works
              </button>
            </div>
          </div>
        </div>

        {/* How It Works Modal */}
        <HowItWorksModal
          isOpen={showHowItWorks}
          onClose={() => setShowHowItWorks(false)}
        />

        {/* Mock Data Dialog */}
        <CreateMockDataDialog
          isOpen={showMockDataDialog}
          onClose={() => setShowMockDataDialog(false)}
        />

        {/* Tournaments Section */}
        <div className="section-spacing">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 section-spacing w-full max-w-5xl mx-auto">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Your Tournaments
              </h2>
              <p className="text-white/50 text-base md:text-lg">
                Manage and track all your golf competitions
              </p>
            </div>
            <span
              className="px-4 py-2 rounded-full font-semibold self-start sm:self-auto"
              style={{
                color: "rgb(52, 211, 153)",
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
              }}
            >
              {tours.length} Total
            </span>
          </div>

          {tours.length === 0 ? (
            <div className="card-elevated w-full max-w-2xl mx-auto">
              <div className="text-center py-16">
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto card-spacing"
                  style={{ background: "rgba(255, 255, 255, 0.05)" }}
                >
                  <ClipboardList
                    className="text-white/30"
                    size={48}
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="text-2xl font-bold text-white/80 mb-4">
                  No Tournaments Yet
                </h3>
                <p className="text-white/40 text-lg section-spacing leading-relaxed max-w-md mx-auto">
                  Create your first tournament to get started with professional
                  golf management
                </p>
                <Link to="/create" className="btn-primary text-lg py-3 px-6">
                  Get Started
                </Link>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-5xl mx-auto space-y-4">
              {tours.map((tour) => {
                const statusInfo = getStatusInfo(tour);

                return (
                  <Link
                    key={tour.id}
                    to={`/tour/${tour.id}`}
                    className="block rounded-2xl p-4 md:p-6 transition-all duration-300 group cursor-pointer hover:-translate-y-0.5"
                    style={{
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.18)";
                      e.currentTarget.style.boxShadow = "0 16px 48px rgba(0, 0, 0, 0.4), 0 0 20px rgba(16, 185, 129, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                      e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)";
                    }}
                  >
                    <div className="flex justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="space-y-3">
                          <div className="flex flex-col md:flex-row md:items-center gap-4">
                            {/* Tournament Icon & Header */}
                            <div className="flex items-center gap-4">
                              <div className="flex-shrink-0">
                                <div
                                  className="w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-white"
                                  style={{
                                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.5), rgba(5, 150, 105, 0.7))",
                                    border: "1px solid rgba(16, 185, 129, 0.3)",
                                    boxShadow: "0 0 20px rgba(16, 185, 129, 0.15), 0 4px 16px rgba(0, 0, 0, 0.2)",
                                  }}
                                >
                                  <span className="text-xl md:text-2xl">
                                    {getFormatIcon(tour.format)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <h3 className="text-lg md:text-xl font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                                    {tour.name}
                                  </h3>
                                  <span
                                    className="px-2 py-1 rounded-full text-xs font-semibold self-start"
                                    style={statusInfo.style}
                                  >
                                    {statusInfo.text}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Tournament Stats */}
                            <div className="grid grid-cols-2 md:flex md:items-center gap-3 md:gap-6 text-xs md:text-sm text-white/40">
                              <div className="flex items-center gap-1.5">
                                <Users size={16} strokeWidth={2} className="text-white/30" />
                                <span className="font-medium">{tour.players.length} Players</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <ClipboardList size={16} strokeWidth={2} className="text-white/30" />
                                <span className="font-medium">{tour.rounds.length} Rounds</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Tag size={16} strokeWidth={2} className="text-white/30" />
                                <span className="font-medium capitalize">{tour.format.replace("-", " ")}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar size={16} strokeWidth={2} className="text-white/30" />
                                <span className="font-medium">{new Date(tour.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          {tour.description && (
                            <div className="flex items-start gap-4">
                              <div className="w-12 md:w-16 flex-shrink-0"></div>
                              <p className="text-white/40 text-sm line-clamp-2 leading-relaxed flex-1 min-w-0">
                                {tour.description}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-2">
                        <div className="flex-shrink-0">
                          <svg
                            className="w-5 h-5 md:w-6 md:h-6 text-white/20 group-hover:text-emerald-400/70 transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <BottomNav tabs={tabs} />
    </div>
  );
};
