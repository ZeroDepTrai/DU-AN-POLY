import { Outlet } from "react-router-dom";
import AuroraBackground from "./aurora/AuroraBackground";
import Footer from "./Footer";
import Header from "./Header";

export default function Layout() {
  return (
    <div className="relative flex min-h-screen flex-col text-warmwhite">
      <AuroraBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}