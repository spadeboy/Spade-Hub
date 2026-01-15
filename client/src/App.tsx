import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import TorrentDetail from "@/pages/TorrentDetail";
import MyUploads from "@/pages/MyUploads";
import Favorites from "./pages/Favorites";
import WatchLater from "./pages/WatchLater";

function Router() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Watch for login/logout to protect routes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary font-display text-2xl">Spade Hub...</div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      
      {/* Protected Routes: Redirect to home if not logged in */}
      <Route path="/favorites">
        {user ? <Favorites /> : <Redirect to="/" />}
      </Route>
      <Route path="/watch-later">
        {user ? <WatchLater /> : <Redirect to="/" />}
      </Route>

      <Route path="/torrents/:id" component={TorrentDetail} />
      <Route path="/my-uploads" component={MyUploads} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;