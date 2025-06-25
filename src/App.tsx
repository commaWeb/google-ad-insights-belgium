import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { OAuthCallback } from "./components/OAuthCallback";
import React, { useState } from "react";
import CompetitorAdScraperPage from "./pages/CompetitorAdScraper";

const queryClient = new QueryClient();

const LOGIN_KEY = "isLoggedIn";
const USERNAME = "admin";
const PASSWORD = "belgium2024";

const LoginShield = ({ children }: { children: React.ReactNode }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(
    typeof window !== "undefined" && localStorage.getItem(LOGIN_KEY) === "true"
  );

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === USERNAME && password === PASSWORD) {
      localStorage.setItem(LOGIN_KEY, "true");
      setIsLoggedIn(true);
    } else {
      setError("Invalid username or password");
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <form onSubmit={handleLogin} style={{ background: "white", padding: 32, borderRadius: 12, boxShadow: "0 2px 16px #0001", minWidth: 320 }}>
          <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 24, textAlign: "center" }}>Login</h2>
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
            />
          </div>
          {error && <div style={{ color: "#dc2626", marginBottom: 12, textAlign: "center" }}>{error}</div>}
          <button type="submit" style={{ width: "100%", padding: 10, borderRadius: 6, background: "#2563eb", color: "white", fontWeight: 600, border: "none" }}>Login</button>
        </form>
      </div>
    );
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <LoginShield>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            <Route path="/competitor-ad-scraper" element={<CompetitorAdScraperPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LoginShield>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
