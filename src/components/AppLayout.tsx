import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";

export function AppLayout() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col">
      <main className="flex-1 px-4 pb-2 pt-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
