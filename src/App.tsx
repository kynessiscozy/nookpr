import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/AppLayout";
import { Loading } from "@/components/States";
import Login from "@/pages/Login";
import Today from "@/pages/Today";
import Plans from "@/pages/Plans";
import PlanDetail from "@/pages/PlanDetail";
import Workout from "@/pages/Workout";
import Exercises from "@/pages/Exercises";
import Checkin from "@/pages/Checkin";
import Goals from "@/pages/Goals";
import Me from "@/pages/Me";
import type { ReactNode } from "react";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading text="正在唤醒 Nook…" />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<Today />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/exercises" element={<Exercises />} />
            <Route path="/checkin" element={<Checkin />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/me" element={<Me />} />
          </Route>
          {/* 计划详情在布局内、训练播放页全屏 */}
          <Route
            path="/plans/:id"
            element={<RequireAuth><div className="mx-auto max-w-md"><PlanDetail /></div></RequireAuth>}
          />
          <Route
            path="/workout/:id"
            element={<RequireAuth><Workout /></RequireAuth>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
