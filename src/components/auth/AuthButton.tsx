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
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
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
            <span className="text-sm font-medium text-slate-900">
              {user.displayName || "User"}
            </span>
            <span className="text-xs text-slate-500">{user.email}</span>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-300"
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
