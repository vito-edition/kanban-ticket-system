import type { FC } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Sidebar } from "./Sidebar";

export const AppLayout: FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};
