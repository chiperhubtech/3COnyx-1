import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0d10] text-white">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto flex flex-col min-h-0">
        {children}
      </main>
    </div>
  );
}
