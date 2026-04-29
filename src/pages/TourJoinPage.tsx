import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Flag, LogIn, Trophy, Users } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTour } from "../hooks/useTours";
import { useUserProfile, useSaveUserProfile } from "../hooks/useUserProfile";
import { useJoinTour } from "../hooks/usePlayers";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export const TourJoinPage = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { data: tour, isLoading: tourLoading } = useTour(tourId!);
  const { data: profile, isLoading: profileLoading } = useUserProfile(
    user?.uid ?? null
  );
  const saveProfile = useSaveUserProfile();
  const joinMutation = useJoinTour(tourId!);

  useDocumentTitle(tour ? `Join ${tour.name}` : "Join Tournament");

  const [signInError, setSignInError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [handicap, setHandicap] = useState("");

  const isParticipant =
    !!user && !!tour && tour.participantIds.includes(user.uid);
  const profileReady = !!profile && !!profile.playerName;
  const profileHasHandicap = profileReady && profile?.handicap !== undefined;

  // Auto-join when the profile already has everything we need.
  useEffect(() => {
    if (!user || !tour || isParticipant) return;
    if (!profileHasHandicap) return;
    if (joinMutation.isPending || joinMutation.isSuccess) return;

    joinMutation
      .mutateAsync({
        userId: user.uid,
        playerName: profile!.playerName,
        handicap: profile!.handicap,
      })
      .catch((err) => {
        console.error("Auto-join failed:", err);
        setJoinError(
          err instanceof Error ? err.message : "Failed to join tournament"
        );
      });
  }, [user, tour, isParticipant, profileHasHandicap, profile, joinMutation]);

  // Pre-fill name from existing profile or Google display name.
  useEffect(() => {
    if (profile?.playerName) setName(profile.playerName);
    else if (user?.displayName) setName(user.displayName);
  }, [profile?.playerName, user?.displayName]);

  // Pre-fill handicap from existing profile.
  useEffect(() => {
    if (profile?.handicap !== undefined) {
      setHandicap(String(profile.handicap));
    }
  }, [profile?.handicap]);

  if (!tourId) return <Navigate to="/" replace />;

  // Already in the tournament — go straight to players page.
  if (isParticipant) {
    return <Navigate to={`/tour/${tourId}/players`} replace />;
  }

  if (authLoading) {
    return <CenteredSpinner label="Loading…" />;
  }

  // Signed-out landing screen.
  if (!user) {
    return (
      <Shell>
        <div className="card text-center py-10 px-6">
          <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            You've been invited to a tournament
          </h1>
          <p className="text-white/50 mb-6">
            Sign in to join and start tracking scores.
          </p>
          <button
            onClick={async () => {
              setSignInError(null);
              try {
                await signInWithGoogle();
              } catch (err) {
                setSignInError(
                  err instanceof Error ? err.message : "Sign-in failed"
                );
              }
            }}
            className="btn-primary inline-flex items-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Sign in with Google
          </button>
          {signInError && (
            <p className="text-sm text-red-400 mt-4">{signInError}</p>
          )}
          <p className="text-xs text-white/30 mt-6">
            <Link to="/" className="underline hover:text-white/50">
              Back to home
            </Link>
          </p>
        </div>
      </Shell>
    );
  }

  // Signed in, but tour data still loading or unreadable.
  if (tourLoading || profileLoading) {
    return <CenteredSpinner label="Loading tournament…" />;
  }

  if (!tour) {
    return (
      <Shell>
        <div className="card text-center py-10 px-6">
          <h1 className="text-xl font-semibold text-white/70 mb-3">
            Tournament Not Found
          </h1>
          <p className="text-white/40 text-sm mb-4">
            The link may be broken or the tournament was deleted.
          </p>
          <Link to="/" className="btn-primary">
            Back to Home
          </Link>
        </div>
      </Shell>
    );
  }

  // Auto-join in progress.
  if (profileHasHandicap && joinMutation.isPending) {
    return <CenteredSpinner label={`Joining ${tour.name}…`} />;
  }

  // Auto-join finished — navigate.
  if (profileHasHandicap && joinMutation.isSuccess) {
    return <Navigate to={`/tour/${tourId}/players`} replace />;
  }

  // Need to gather name and/or handicap before joining.
  const needsName = !profileReady;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);

    const trimmedName = name.trim();
    if (needsName && !trimmedName) return;

    const normalized = handicap.replace(",", ".").trim();
    const handicapValue = normalized ? parseFloat(normalized) : undefined;
    if (
      handicapValue === undefined ||
      isNaN(handicapValue) ||
      handicapValue < 0 ||
      handicapValue > 54
    ) {
      setJoinError("Handicap must be a number between 0 and 54.");
      return;
    }

    try {
      if (needsName) {
        await saveProfile.mutateAsync({
          userId: user.uid,
          playerName: trimmedName,
          handicap: handicapValue,
        });
      }
      await joinMutation.mutateAsync({
        userId: user.uid,
        playerName: needsName ? trimmedName : profile!.playerName,
        handicap: handicapValue,
      });
    } catch (err) {
      console.error("Join failed:", err);
      setJoinError(
        err instanceof Error ? err.message : "Failed to join tournament"
      );
    }
  };

  if (joinMutation.isSuccess) {
    return <Navigate to={`/tour/${tourId}/players`} replace />;
  }

  const submitting = saveProfile.isPending || joinMutation.isPending;

  return (
    <Shell>
      <form
        onSubmit={handleSubmit}
        className="card px-6 py-7 space-y-5"
      >
        <div className="text-center">
          <div className="w-14 h-14 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-3">
            <Flag className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">{tour.name}</h1>
          <p className="text-white/50 text-sm mt-1 flex items-center justify-center gap-1.5">
            <Users className="w-4 h-4" />
            {tour.players.length} player
            {tour.players.length !== 1 ? "s" : ""} so far
          </p>
        </div>

        {needsName && (
          <div className="form-group">
            <label className="form-label">Your name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field text-lg"
              placeholder="Enter your name"
              required
              autoFocus
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Golf handicap *</label>
          <input
            type="number"
            value={handicap}
            onChange={(e) => setHandicap(e.target.value)}
            className="input-field text-lg"
            placeholder="0–54"
            min="0"
            max="54"
            step="0.1"
            inputMode="decimal"
            pattern="[0-9]*[.,]?[0-9]*"
            required
            autoFocus={!needsName}
          />
          <p className="form-help">
            We'll save this to your profile so you don't have to enter it
            again.
          </p>
        </div>

        {joinError && (
          <p className="text-sm text-red-400">{joinError}</p>
        )}

        <button
          type="submit"
          disabled={submitting || (needsName && !name.trim()) || !handicap.trim()}
          className="btn-primary w-full py-3 text-base disabled:opacity-50"
        >
          {submitting ? "Joining…" : `Join ${tour.name}`}
        </button>
      </form>
    </Shell>
  );
};

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex items-center justify-center px-4 py-8 safe-area-top safe-area-bottom">
    <div className="w-full max-w-md">{children}</div>
  </div>
);

const CenteredSpinner = ({ label }: { label: string }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
        <Trophy className="w-8 h-8 text-emerald-400" />
      </div>
      <div className="text-lg font-semibold text-white/70">{label}</div>
    </div>
  </div>
);
