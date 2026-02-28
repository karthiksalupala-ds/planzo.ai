import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import DesktopNav from "./DesktopNav";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />
      <main className="pb-20 md:pb-0 md:pt-16">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
