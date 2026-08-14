import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
