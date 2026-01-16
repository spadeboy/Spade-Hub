import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useTorrent, useDeleteTorrent } from "@/hooks/use-torrents";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { StreamPlayer } from "@/components/StreamPlayer"; // Ensure this component exists
import {
  Download,
  ArrowLeft,
  Calendar,
  Trash2,
  Share2,
  ShieldCheck,
  Heart,
  Plus,
  Check,
  Play, 
  X
} from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// --- FIREBASE IMPORTS ---
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function TorrentDetail() {
  const [, params] = useRoute("/torrents/:id");
  const id = parseInt(params?.id || "0");
 
  const { data: torrent, isLoading, error } = useTorrent(id);
  const deleteTorrent = useDeleteTorrent();
  const { toast } = useToast();
 
  // --- STATE ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false); // NEW: Streaming State

  // --- 1. AUTH & LIST CHECK ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAdmin(user?.email === "ashiksa88@gmail.com");
    });

    const favorites = JSON.parse(localStorage.getItem("spade_favorites") || "[]");
    const watchLater = JSON.parse(localStorage.getItem("spade_watch_later") || "[]");
   
    setIsFavorited(favorites.some((item: any) => item.id === id));
    setIsWatchLater(watchLater.some((item: any) => item.id === id));

    return () => unsubscribe();
  }, [id]);

  // --- 2. TOGGLE LISTS ---
  const toggleLocalAction = (listType: "Favorites" | "WatchLater") => {
    if (!torrent) return;
    const storageKey = listType === "Favorites" ? "spade_favorites" : "spade_watch_later";
    const existingData = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const isAdded = existingData.some((item: any) => item.id === id);

    let updatedData;
    if (isAdded) {
      updatedData = existingData.filter((item: any) => item.id !== id);
      listType === "Favorites" ? setIsFavorited(false) : setIsWatchLater(false);
      toast({ title: `Removed from ${listType}`, description: "Item removed." });
    } else {
      updatedData = [...existingData, torrent];
      listType === "Favorites" ? setIsFavorited(true) : setIsWatchLater(true);
      toast({ title: `Added to ${listType}`, description: "Item added!" });
    }
    localStorage.setItem(storageKey, JSON.stringify(updatedData));
  };

  const handleBack = () => {
    window.history.length > 1 ? window.history.back() : window.location.href = "/";
  };

  const handleShare = async () => {
    if (!torrent) return;
    if (navigator.share) {
      await navigator.share({
        title: torrent.title,
        text: `Check out ${torrent.title} on Spade Hub!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link Copied", description: "Copied to clipboard." });
    }
  };

  const handleDownload = () => {
    if (!torrent) return;
    navigator.clipboard.writeText(torrent.magnetLink);
    toast({ title: "Magnet Copied!", description: "Link copied to clipboard." });
    window.location.href = torrent.magnetLink;
  };

  if (isLoading) return <Layout><Skeleton className="h-[500px] w-full" /></Layout>;
  if (error || !torrent) return <Layout>Torrent Not Found</Layout>;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={handleBack} className="mb-6 pl-0 hover:bg-transparent hover:text-primary transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="grid md:grid-cols-[350px_1fr] gap-8 lg:gap-12">
          {/* Left Column: Image & Actions */}
          <div className="space-y-6">
            <div className="rounded-2xl overflow-hidden bg-muted aspect-[3/4] shadow-2xl relative group border border-white/10">
              {torrent.imageUrl ? (
                <img src={torrent.imageUrl} alt={torrent.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-card">
                  <span className="text-muted-foreground/20 font-bold">No Cover</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                <Badge className="bg-primary text-white border-none text-lg py-1 px-4">
                  {torrent.category}
                </Badge>
              </div>
            </div>

            {/* ACTION BUTTONS ROW */}
            <div className="flex flex-col gap-3">
              
              {/* --- FIXED: WATCH NOW BUTTON (Only Shows for Movies) --- */}
              {torrent.category === "Movies" && (
                <Button 
                  size="lg"
                  onClick={() => setIsStreaming(true)}
                  className="w-full text-lg font-bold h-12 bg-white text-black hover:bg-white/90 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all group"
                >
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  Watch Now
                </Button>
              )}
              {/* ----------------------------------------------------- */}

              {/* DOWNLOAD BUTTON */}
              <Button
                size="lg"
                onClick={handleDownload}
                className="w-full text-lg font-bold h-12 bg-black/40 text-white border border-white/10 hover:bg-primary hover:text-white transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] group"
              >
                <Download className="mr-2 h-5 w-5 group-hover:translate-y-1 transition-transform" />
                Download Magnet
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-white/5 p-4 rounded-xl text-center">
                <ShieldCheck className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <span className="text-xs font-bold text-muted-foreground">VERIFIED</span>
              </div>
              <button
                onClick={handleShare}
                className="bg-card border border-white/5 p-4 rounded-xl text-center hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Share2 className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <span className="text-xs font-bold text-muted-foreground">SHARE</span>
              </button>
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="space-y-8">
            <div>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <h1 className="text-4xl md:text-5xl font-display font-bold text-glow leading-tight text-white">
                  {torrent.title}
                </h1>
               
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="icon" onClick={() => toggleLocalAction("Favorites")}
                    className={`rounded-xl border-white/10 transition-all ${isFavorited ? "bg-primary text-white border-primary" : "bg-white/5 hover:bg-white/10 text-white"}`}>
                    <Heart className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`} />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => toggleLocalAction("WatchLater")}
                    className={`rounded-xl border-white/10 transition-all ${isWatchLater ? "bg-primary text-white border-primary" : "bg-white/5 hover:bg-white/10 text-white"}`}>
                    {isWatchLater ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  </Button>
                  {isAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="rounded-xl shrink-0"><Trash2 className="h-5 w-5" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Delete Torrent?</AlertDialogTitle></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteTorrent.mutate(id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
             
              <div className="flex items-wrap gap-4 text-sm text-muted-foreground border-b border-white/10 pb-6">
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full">
                  <Calendar className="w-4 h-4" />
                  <span>{torrent.createdAt ? format(new Date(torrent.createdAt), 'PPP') : 'Unknown Date'}</span>
                </div>
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              <h3 className="text-xl font-bold mb-4 font-display text-white">Description</h3>
              <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{torrent.description}</div>
            </div>
          </div>
        </div>

        {/* --- VIDEO PLAYER MODAL --- */}
        <Dialog open={isStreaming} onOpenChange={setIsStreaming}>
          <DialogContent className="sm:max-w-5xl bg-black border-white/10 p-0 overflow-hidden aspect-video">
             <div className="relative w-full h-full">
               <Button 
                  onClick={() => setIsStreaming(false)}
                  className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black text-white rounded-full p-2 h-auto"
                >
                  <X className="w-5 h-5" />
               </Button>
               {/* Pass magnet link to the player */}
               <StreamPlayer magnetLink={torrent.magnetLink} />
             </div>
          </DialogContent>
        </Dialog>

      </div>
    </Layout>
  );
}