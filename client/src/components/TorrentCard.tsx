import { Link } from "wouter";
import { type TorrentWithAuthor } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Play, Heart, Plus, Check, Star, Tv } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { auth } from "@/firebase";

// Helper: build stream.html URL from torrent data using TMDB search
async function openStreamPage(torrent: TorrentWithAuthor) {
  const title = torrent.title.replace(/\s*\(?\d{4}\)?\s*$/, '').trim();
  const year = torrent.releaseYear ||
    torrent.title.match(/\b(19|20)\d{2}\b/)?.[0] || '';
  const poster = torrent.imageUrl || '';

  // Try to find TMDB ID by searching title
  let tmdbId = '';
  try {
    const TMDB_KEY = '6ee1bab484e315e98c68e10e963e59d1';
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}${year ? `&year=${year}` : ''}`
    );
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const match = data.results[0];
      tmdbId = String(match.id);
    }
  } catch {
    // If TMDB search fails, we can't stream — but still navigate
  }

  if (!tmdbId) {
    // Fallback: use the torrent's own ID (won't work with most sources, but avoids dead-end)
    tmdbId = String(torrent.id);
  }

  const params = new URLSearchParams({
    id: tmdbId,
    type: 'movie',
    title: torrent.title,
    year: String(year),
    poster: poster,
    overview: torrent.description || '',
    rating: '4.5',
  });

  window.location.href = `/stream.html?${params.toString()}`;
}

export function TorrentCard({
  torrent,
  onToggle
}: {
  torrent: TorrentWithAuthor;
  onToggle?: () => void;
}) {
  const { toast } = useToast();

  const [isFavorited, setIsFavorited] = useState(false);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });

    const favorites = JSON.parse(localStorage.getItem("spade_favorites") || "[]");
    const watchLater = JSON.parse(localStorage.getItem("spade_watch_later") || "[]");

    setIsFavorited(favorites.some((item: any) => item.id === torrent.id));
    setIsWatchLater(watchLater.some((item: any) => item.id === torrent.id));

    return () => unsubscribe();
  }, [torrent.id]);

  const toggleAction = (listType: "Favorites" | "WatchLater", e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const storageKey = listType === "Favorites" ? "spade_favorites" : "spade_watch_later";
    const existingData = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const isAdded = existingData.some((item: any) => item.id === torrent.id);

    let updatedData;
    if (isAdded) {
      updatedData = existingData.filter((item: any) => item.id !== torrent.id);
      if (listType === "Favorites") setIsFavorited(false);
      else setIsWatchLater(false);

      toast({ title: `Removed from ${listType}`, description: `"${torrent.title}" removed.` });

      if (onToggle) onToggle();

    } else {
      updatedData = [...existingData, torrent];
      if (listType === "Favorites") setIsFavorited(true);
      else setIsWatchLater(true);
      toast({ title: `Added to ${listType}`, description: `"${torrent.title}" added!` });
    }
    localStorage.setItem(storageKey, JSON.stringify(updatedData));
  };

  const handleWatchNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (torrent.category === "Movies") {
      openStreamPage(torrent);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="group relative w-full h-full"
    >
      <div className="relative w-full aspect-[2/3] overflow-hidden rounded-xl bg-card border border-white/5 shadow-md cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:scale-[1.02]">

        {/* MAIN CLICKABLE AREA - WRAPPED IN LINK */}
        <Link href={`/torrents/${torrent.id}`}>
          <a className="block w-full h-full relative">
            {/* Image */}
            {torrent.imageUrl ? (
              <img
                src={torrent.imageUrl}
                alt={torrent.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground/50">
                No Image
              </div>
            )}

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Hover Action Overlay (Play Button) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
              <div className="bg-primary/90 text-white rounded-full p-4 shadow-lg scale-50 group-hover:scale-100 transition-transform duration-300">
                <Play className="w-6 h-6 fill-current pl-1" />
              </div>
            </div>

            {/* Badges / Rating */}
            <div className="absolute top-2 right-2 z-10">
              <Badge className="bg-black/60 backdrop-blur text-white border-white/10 shadow-sm text-[10px] px-1.5 h-5">
                HD
              </Badge>
            </div>

            <div className="absolute top-2 left-2 z-10 flex gap-1">
              <div className="bg-yellow-500/90 text-black font-bold text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-current" />
                4.5
              </div>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-0 left-0 w-full p-3 z-10">
              <h3 className="font-display font-semibold text-white text-base leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                {torrent.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>{torrent.category}</span>
                <span>
                  {torrent.releaseYear ||
                    (torrent.title.match(/\b(19|20)\d{2}\b/)?.[0]) ||
                    new Date(torrent.createdAt || new Date()).getFullYear()}
                </span>
              </div>
            </div>
          </a>
        </Link>

        {/* WATCH NOW BUTTON (Movies only) — bottom overlay */}
        {torrent.category === "Movies" && (
          <button
            onClick={handleWatchNow}
            className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/90 text-black text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-amber-400 active:scale-95"
            title="Stream Now"
          >
            <Tv className="w-3.5 h-3.5" />
            Watch Now
          </button>
        )}

        {/* SEPARATE ACTION BUTTONS (OUTSIDE LINK) */}
        {isAuthenticated && (
          <div className="absolute top-2 right-2 flex flex-col gap-2 z-20 translate-x-10 group-hover:translate-x-0 transition-transform duration-300 delay-75 pointer-events-auto">
            <button
              onClick={(e) => toggleAction("Favorites", e)}
              className={`p-2 rounded-full backdrop-blur border border-white/10 shadow-lg ${isFavorited ? "bg-primary/80 text-white" : "bg-black/60 text-white hover:bg-primary"
                }`}
              title="Favorite"
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorited ? "fill-current" : ""}`} />
            </button>
            <button
              onClick={(e) => toggleAction("WatchLater", e)}
              className={`p-2 rounded-full backdrop-blur border border-white/10 shadow-lg ${isWatchLater ? "bg-primary/80 text-white" : "bg-black/60 text-white hover:bg-primary"
                }`}
              title="Watch Later"
            >
              {isWatchLater ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}