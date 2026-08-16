import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, BrowserRouter, Routes, Route } from "react-router-dom";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import NamePage from "./pages/NamePage";
import GamesCatalogPage from "./pages/GamesCatalogPage";
import LiveDirectoryPage from "./pages/LiveDirectoryPage";
import ChessGamePage from "./pages/ChessGamePage";
import AdminPage from "./pages/AdminPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// In Electron / file:// environments, HashRouter is required for local static file loading
const isFileOrDesktop =
  typeof window !== "undefined" &&
  (window.location.protocol === "file:" || (window as unknown as { electronAPI?: { isDesktop?: boolean } }).electronAPI?.isDesktop);

const Router = isFileOrDesktop ? HashRouter : BrowserRouter;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Router>
        <Routes>
          <Route path="/" element={<NamePage />} />
          <Route path="/games" element={<GamesCatalogPage />} />
          <Route path="/live-directory" element={<LiveDirectoryPage />} />
          <Route path="/chess" element={<ChessGamePage />} />
          <Route path="/play" element={<ChessGamePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
