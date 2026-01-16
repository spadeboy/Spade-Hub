import { Link } from "wouter";
import { type TorrentWithAuthor } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Download, Film, Gamepad2, Globe, Music, Save, Terminal, Heart, Plus, Check } from "lucide-react";
import { motion } from "framer-motion";
import { FaWindows, FaApple, FaAndroid } from "react-icons/fa";
import { SiQbittorrent } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
// Import auth to check login status
import { auth } from "@/firebase";

const categoryIcons: Record<string, any> = {
  Movies: Film,
  Games: Gamepad2,
  Music: Music,
  Software: Terminal,
  Anime: Save,
};

export function TorrentCard({ torrent }: { torrent: TorrentWithAuthor }) {
  const Icon = categoryIcons[torrent.category] || Globe;
  const { toast } = useToast();
  
  const [isFavorited, setIsFavorited] = useState(false);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!auth.currentUser);

  useEffect(() => {
    // Listen for auth changes to update button visibility
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });

    const favorites = JSON.parse(localStorage.getItem("spade_favorites") || "[]");
    const watchLater = JSON.parse(localStorage.getItem("spade_watch_later") || "[]");
    
    setIsFavorited(favorites.some((item: any) => item.id === torrent.id));
    setIsWatchLater(watchLater.some((item: any) => item.id === torrent.id));

    return () => unsubscribe();
  }, [torrent.id]);

  const getDeviceClient = () => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("iphone") || ua.includes("ipad")) {
      return { name: "iTorrent", icon: <FaApple className="w-3.5 h-3.5 text-gray-300" /> };
    }
    if (ua.includes("macintosh")) {
      return { name: "iTransmission", icon: <FaApple className="w-3.5 h-3.5 text-red-500" /> };
    }
    if (ua.includes("android")) {
      return { name: "Flud", icon: <FaAndroid className="w-3.5 h-3.5 text-green-500" /> };
    }
    if (ua.includes("windows")) {
      return { name: "qbittorrent", icon: <FaWindows className="w-3.5 h-3.5 text-blue-400" /> };
    }
    return { name: "qbittorrent", icon: <SiQbittorrent className="w-3.5 h-3.5 text-primary" /> };
  };

  const client = getDeviceClient();

  const toggleAction = (listType: "Favorites" | "WatchLater") => {
    const storageKey = listType === "Favorites" ? "spade_favorites" : "spade_watch_later";
    const existingData = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const isAdded = existingData.some((item: any) => item.id === torrent.id);

    let updatedData;
    if (isAdded) {
      updatedData = existingData.filter((item: any) => item.id !== torrent.id);
      if (listType === "Favorites") setIsFavorited(false);
      else setIsWatchLater(false);
      toast({ title: `Removed from ${listType}`, description: `"${torrent.title}" removed.` });
    } else {
      updatedData = [...existingData, torrent];
      if (listType === "Favorites") setIsFavorited(true);
      else setIsWatchLater(true);
      toast({ title: `Added to ${listType}`, description: `"${torrent.title}" added!` });
    }
    localStorage.setItem(storageKey, JSON.stringify(updatedData));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-card overflow-hidden hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 group h-full flex flex-col">
        <div className="relative h-48 overflow-hidden bg-muted/50">
          {torrent.imageUrl && (
            <img 
              src={torrent.imageUrl} 
              alt={torrent.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          
          {/* ONLY SHOW ACTIONS IF LOGGED IN */}
          {isAuthenticated && (
            <div className="absolute top-3 left-3 flex gap-2">
              <button 
                onClick={() => toggleAction("Favorites")}
                className={`p-2 rounded-full backdrop-blur border border-white/10 transition-all shadow-lg ${
                  isFavorited ? "bg-primary/80 text-white" : "bg-background/60 text-white hover:text-red-500"
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
              </button>
              <button 
                onClick={() => toggleAction("WatchLater")}
                className={`p-2 rounded-full backdrop-blur border border-white/10 transition-all shadow-lg ${
                  isWatchLater ? "bg-primary/80 text-white" : "bg-background/60 text-white hover:text-primary"
                }`}
              >
                {isWatchLater ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>
          )}

          <div className="absolute top-3 right-3">
            <Badge className="bg-background/80 backdrop-blur text-foreground border-white/10 shadow-sm">
              {torrent.category}
            </Badge>
          </div>
        </div>

        <CardHeader className="p-5 pb-2">
          <Link href={`/torrents/${torrent.id}`} className="hover:text-primary transition-colors cursor-pointer">
            <h3 className="font-display text-xl font-bold truncate" title={torrent.title}>
              {torrent.title}
            </h3>
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 font-medium">
            <div className="flex items-center gap-1.5 bg-secondary/30 px-2 py-0.5 rounded-md border border-white/5">
              {client.icon}
              <span className="text-xs uppercase tracking-tight">{client.name}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-2 flex-grow">
          <p className="text-muted-foreground text-sm line-clamp-2">
            {torrent.description}
          </p>
        </CardContent>

        <CardFooter className="p-5 pt-0 mt-auto">
          <Button 
            onClick={() => {
              navigator.clipboard.writeText(torrent.magnetLink);
              toast({ title: "Link Copied!", description: "Magnet link copied to clipboard." });
              window.location.href = torrent.magnetLink;
            }}
            className="w-full bg-secondary/50 hover:bg-primary hover:text-white text-foreground border border-white/5 transition-all duration-300 group-hover:border-primary/50"
          >
            <Download className="w-4 h-4 mr-2" />
            Magnet Download
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}