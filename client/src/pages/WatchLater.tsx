import { useState, useEffect } from "react";
import { TorrentCard } from "@/components/TorrentCard";
import { type TorrentWithAuthor } from "@shared/schema";
import { Layout } from "@/components/Layout";
import { ListVideo, ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function WatchLater() {
  const [items, setItems] = useState<TorrentWithAuthor[]>([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("spade_watch_later") || "[]");
    setItems(data);
  }, []);

  return (
    <Layout>
      <div className="space-y-8 py-4">
        {/* Navigation & Header Section */}
        <div className="space-y-6">
          <Button variant="ghost" asChild className="-ml-2 text-muted-foreground hover:text-primary">
            <Link href="/" className="flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" />
              Back to Browse
            </Link>
          </Button>

          <div className="max-w-4xl">
            <h1 className="text-7xl font-display font-bold text-white tracking-tighter mb-4">
              Watch Later
            </h1>
            <p className="text-2xl text-muted-foreground font-medium max-w-2xl leading-relaxed">
              The graveyard of things you'll definitely forget to watch. Procrastination at its finest.
            </p>
          </div>
        </div>

        {/* Grid Section */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-card/10 rounded-3xl border border-dashed border-white/5">
            <ListVideo className="w-12 h-12 text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground text-lg">Nothing here. Productivity: 100.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((torrent) => (
              <TorrentCard key={torrent.id} torrent={torrent} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}