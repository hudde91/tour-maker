import { LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useState } from "react";

export function AuthButton() {
  const { user, signInWithGoogle, signOut, loading } = useAuth();
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

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-white/50">
        <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
        <span>Loading...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || "User"}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">
              <User size={16} />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">
              {user.displayName || "User"}
            </span>
            <span className="text-xs text-white/40">{user.email}</span>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-slate-300"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={isSigningIn}
      className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
    >
      <LogIn size={16} />
      {isSigningIn ? "Signing in..." : "Sign in with Google"}
    </button>
  );
}
