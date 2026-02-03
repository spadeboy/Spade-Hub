import { useState, useEffect } from "react";
import { useTorrents } from "@/hooks/use-torrents";
import { Layout } from "@/components/Layout";
import { HeroCarousel } from "@/components/HeroCarousel";
import { MediaRow } from "@/components/MediaRow";
import { TorrentCard } from "@/components/TorrentCard";
import { CreateTorrentModal } from "@/components/CreateTorrentModal";
import { Input } from "@/components/ui/input";
import { Search, Loader2, AlertCircle, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

// --- FIREBASE IMPORTS ---
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

import { useDebounce } from "@/hooks/use-debounce";

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500); // 500ms delay

  // We can fetch "all" and then filter client-side for rows if the API doesn't support flexible queries efficiently 
  // or we can just fetch everything since it's likely a small DB for now.
  // Ideally, we'd have specific hooks for "Featured", "Movies", etc.

  const { data: torrents, isLoading, error } = useTorrents({
    search: debouncedSearch || undefined,
    sort: "newest"
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === "ashiksa88@gmail.com") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Filter functionality
  // In a real large-scale app, these should be separate API calls.
  const featured = torrents?.slice(0, 5) || [];
  const latestUploads = torrents || [];
  const movies = torrents?.filter(t => t.category === "Movies") || [];
  const games = torrents?.filter(t => t.category === "Games") || [];
  const software = torrents?.filter(t => t.category === "Software") || [];

  return (
    <Layout transparentHeader={true}>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground animate-pulse">Loading experience...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-screen text-center bg-black">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h3 className="text-xl font-bold mb-2">Connection Error</h3>
          <p className="text-muted-foreground max-w-md">
            Failed to load content. Please check your connection.
          </p>
        </div>
      ) : (
        <div className="pb-20 bg-background min-h-screen">

          {/* HERO SECTION - Always visible to prevent layout shift */}
          <HeroCarousel featured={featured} />

          {/* MAIN CONTENT CONTAINER */}
          <div className="space-y-8 relative z-20 -mt-28">

            {/* SEARCH BAR */}
            <div className="w-full px-6 md:px-12 lg:px-16 mb-12 flex justify-end">
              {/* Mobile/Desktop Search Input */}
              <div className="relative max-w-xl w-full">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search titles, actors, genres..."
                  className="pl-10 h-11 bg-white/5 border-white/10 focus:border-primary/50 text-white rounded-full backdrop-blur-md transition-all focus:bg-white/10 hover:bg-white/10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {search ? (
              // SEARCH RESULTS VIEW
              <div className="w-full px-6 md:px-12 lg:px-16">
                <h2 className="text-2xl font-bold mb-6">Search Results for "{search}"</h2>
                {torrents?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-3xl bg-card/10">
                    <div className="bg-muted/30 p-4 rounded-full mb-4">
                      <SearchX className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No results found</h3>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                    {torrents?.map((torrent) => (
                      <div key={torrent.id} className="aspect-[2/3] w-full h-full">
                        <TorrentCard torrent={torrent} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // STANDARD "ROWS" VIEW
              <div className="space-y-4 md:space-y-12">
                <MediaRow title="Latest Uploads" torrents={latestUploads} />
                {movies.length > 0 && <MediaRow title="Popular Movies" torrents={movies} />}
                {games.length > 0 && <MediaRow title="Trending Games" torrents={games} />}
                {software.length > 0 && <MediaRow title="Software & Tools" torrents={software} />}

                {/* Create Button (Admin) */}
                {isAdmin && (
                  <div className="fixed bottom-8 right-8 z-50">
                    <div className="shadow-2xl shadow-primary/50 rounded-full">
                      <CreateTorrentModal />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}