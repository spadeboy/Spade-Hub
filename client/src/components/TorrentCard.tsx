import { Link } from "wouter";
import { type TorrentWithAuthor } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Download, Film, Gamepad2, Globe, Music, Save, Terminal } from "lucide-react";
import { motion } from "framer-motion";
import { FaWindows, FaApple, FaAndroid } from "react-icons/fa";
import { SiQbittorrent } from "react-icons/si";

const categoryIcons: Record<string, any> = {
  Movies: Film,
  Games: Gamepad2,
  Music: Music,
  Software: Terminal,
  Other: Save,
};

export function TorrentCard({ torrent }: { torrent: TorrentWithAuthor }) {
  const Icon = categoryIcons[torrent.category] || Globe;

  // --- DEVICE DETECTION LOGIC ---
  const getDeviceClient = () => {
    // We check the browser's userAgent to determine the icon/text
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
    // Default fallback
    return { name: "qbittorrent", icon: <SiQbittorrent className="w-3.5 h-3.5 text-primary" /> };
  };

  const client = getDeviceClient();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-card overflow-hidden hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 group h-full flex flex-col">
        <div className="relative h-48 overflow-hidden bg-muted/50">
          {torrent.imageUrl ? (
            <img 
              src={torrent.imageUrl} 
              alt={torrent.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground/30">
              <Icon className="w-16 h-16" />
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
          
          {/* FIXED: Dynamic Client Display replaces "Anonymous" */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 font-medium">
            <div className="flex items-center gap-1.5 bg-secondary/30 px-2 py-0.5 rounded-md border border-white/5">
              {client.icon}
              <span>{client.name}</span>
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
            asChild 
            className="w-full bg-secondary/50 hover:bg-primary hover:text-white text-foreground border border-white/5 transition-all duration-300 group-hover:border-primary/50"
          >
            <a href={torrent.magnetLink}>
              <Download className="w-4 h-4 mr-2" />
              Magnet Download
            </a>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}