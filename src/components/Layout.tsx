import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-50 safe-area-top safe-area-bottom">
      <main className="pb-16">{children}</main>
    </div>
  );
};
