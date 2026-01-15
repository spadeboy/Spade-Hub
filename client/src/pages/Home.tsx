import { useState } from "react";
import { useTorrents } from "@/hooks/use-torrents";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/Layout";
import { TorrentCard } from "@/components/TorrentCard";
import { CreateTorrentModal } from "@/components/CreateTorrentModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { user } = useAuth();
  const isAdmin = user?.email === "ashiksa88@gmail.com";
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  
  // Debounce search could be added here for optimization
  const { data: torrents, isLoading, error } = useTorrents({
    search: search || undefined,
    category: category !== "all" ? category : undefined,
    sort
  });

  return (
    <Layout>
      {/* Hero / Header Section */}
      <section className="mb-12 relative">
        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full -z-10 transform -translate-y-1/2" />
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
              Smoke it
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl">
              The premier destination for sharing and discovering magnet links safely and securely.
            </p>
          </div>
          
          {isAdmin && <CreateTorrentModal />}
        </div>

        {/* Filters Bar */}
        <div className="bg-card/30 backdrop-blur-md border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search torrents..." 
              className="pl-10 bg-background/50 border-transparent focus:border-primary/50 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full md:w-[180px] bg-background/50 border-transparent">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Movies">Movies</SelectItem>
                <SelectItem value="Games">Games</SelectItem>
                <SelectItem value="Music">Music</SelectItem>
                <SelectItem value="Software">Software</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(v: any) => setSort(v)}>
              <SelectTrigger className="w-full md:w-[150px] bg-background/50 border-transparent">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <section>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground animate-pulse">Loading torrents...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <h3 className="text-xl font-bold mb-2">Failed to load torrents</h3>
            <p className="text-muted-foreground max-w-md">
              There was a problem connecting to the server. Please try again later.
            </p>
          </div>
        ) : torrents?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-3xl bg-card/10">
            <div className="bg-muted/30 p-4 rounded-full mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No torrents found</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              We couldn't find anything matching your criteria. Try adjusting your filters or share something new!
            </p>
            {isAdmin && (
              <div className="opacity-50 pointer-events-none">
                {/* Visual cue only, modal trigger is in header */}
                <Button variant="outline">Share your first torrent</Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {torrents?.map((torrent) => (
              <TorrentCard key={torrent.id} torrent={torrent} />
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
