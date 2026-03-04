import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "../contexts/AuthContext";
import { useUserProfile, useUpdateHandicap } from "../hooks/useUserProfile";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { Home, User, Pencil, Check, X } from "lucide-react";
import { BottomNav } from "../components/BottomNav";
import { Link } from "react-router-dom";
import { PlusCircle, Settings } from "lucide-react";

export const ProfilePage = () => {
  useDocumentTitle("My Profile");
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile(
    user?.uid ?? null
  );
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

  return (
    <div className="min-h-screen pb-24">
      <PageHeader
        title="My Profile"
        subtitle="View and manage your player profile"
        breadcrumbs={breadcrumbs}
      />

      <div className="pb-8 w-full max-w-6xl mx-auto space-y-6">
        {/* User Info */}
        <div className="card-elevated">
          <h2 className="section-header mb-4">Player Information</h2>

          <div className="flex items-center gap-4 mb-6">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                <User size={32} className="text-emerald-400" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-white">
                {profile?.playerName || user.displayName || "Player"}
              </h3>
              <p className="text-sm text-white/40">{user.email}</p>
            </div>
          </div>

          {/* Handicap Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-white/50">
                Golf Handicap
              </label>
              {!isEditingHandicap && (
                <button
                  onClick={handleEditHandicap}
                  className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <Pencil size={14} />
                  Edit
                </button>
              )}
            </div>

            {isEditingHandicap ? (
              <div className="space-y-3">
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
                <p className="text-xs text-white/40">
                  Official USGA handicap index (0-54). Leave empty to remove.
                </p>
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
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <span className="text-emerald-400 font-bold text-sm">HC</span>
                </div>
                <div>
                  <div className="text-lg font-semibold text-white">
                    {profile?.handicap != null ? profile.handicap : "Not set"}
                  </div>
                  <div className="text-xs text-white/40">
                    {profile?.handicap != null
                      ? "Your current handicap index"
                      : "Tap Edit to set your handicap"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back to Home */}
        <div className="card">
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 p-3 text-white/50 hover:text-white font-semibold transition-colors"
          >
            <Home size={20} strokeWidth={2} />
            Back to Home
          </Link>
        </div>
      </div>

      <BottomNav tabs={tabs} />
      <ToastComponent />
    </div>
  );
};
