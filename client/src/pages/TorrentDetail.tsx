import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useTorrent, useDeleteTorrent } from "@/hooks/use-torrents";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  ArrowLeft,
  Calendar,
  Trash2,
  Share2,
  ShieldCheck,
  Heart,
  Plus,
  Check
} from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

  // --- 1. AUTH & LIST CHECK ---
  useEffect(() => {
    // Check Admin Status
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === "ashiksa88@gmail.com") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });

    // Check Local Storage Lists
    const favorites = JSON.parse(localStorage.getItem("spade_favorites") || "[]");
    const watchLater = JSON.parse(localStorage.getItem("spade_watch_later") || "[]");
   
    setIsFavorited(favorites.some((item: any) => item.id === id));
    setIsWatchLater(watchLater.some((item: any) => item.id === id));

    return () => unsubscribe();
  }, [id]);

  // --- 2. TOGGLE LISTS LOGIC ---
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

  // --- 3. SMART BACK BUTTON ---
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  // --- 4. SHARE LOGIC ---
  const handleShare = async () => {
    if (!torrent) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: torrent.title,
          text: `Check out ${torrent.title} on Spade Hub!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share canceled");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link Copied", description: "Page URL copied to clipboard." });
    }
  };

  // --- 5. MAGNET DOWNLOAD ---
  const handleDownload = () => {
    if (!torrent) return;
    navigator.clipboard.writeText(torrent.magnetLink);
    toast({ title: "Magnet Copied!", description: "Link copied to clipboard." });
    window.location.href = torrent.magnetLink;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-8">
          <Skeleton className="h-8 w-32" />
          <div className="grid md:grid-cols-3 gap-8">
            <Skeleton className="h-[400px] w-full rounded-2xl md:col-span-1" />
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !torrent) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Torrent Not Found</h2>
          <Button onClick={() => window.location.href = "/"}>Back to Home</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={handleBack} className="mb-6 pl-0 hover:bg-transparent hover:text-primary transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid md:grid-cols-[350px_1fr] gap-8 lg:gap-12">
          {/* Left Column: Image & Actions */}
          <div className="space-y-6">
            <div className="rounded-2xl overflow-hidden bg-muted aspect-[3/4] shadow-2xl relative group border border-white/10">
              {torrent.imageUrl ? (
                <img
                  src={torrent.imageUrl}
                  alt={torrent.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-card border border-white/5">
                  <span className="text-4xl text-muted-foreground/20 font-display font-bold">No Cover</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <Badge className="bg-primary hover:bg-primary text-white border-none text-lg py-1 px-4">
                  {torrent.category}
                </Badge>
              </div>
            </div>

            {/* UPDATED BUTTON STYLE */}
            <Button
              size="lg"
              onClick={handleDownload}
              className="w-full text-lg font-bold h-12 bg-black/40 text-white border border-white/10 hover:bg-primary hover:text-white transition-all duration-300 shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] group/btn"
            >
              <Download className="mr-2 h-5 w-5 transition-transform duration-300 group-hover/btn:translate-y-1" />
              Download Magnet
            </Button>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-white/5 p-4 rounded-xl text-center">
                <ShieldCheck className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Verified</span>
              </div>
             
              <button
                onClick={handleShare}
                className="bg-card border border-white/5 p-4 rounded-xl text-center hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Share2 className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Share</span>
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
               
                {/* ACTION BUTTONS (Fav, WatchLater, Delete) */}
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => toggleLocalAction("Favorites")}
                    className={`rounded-xl border-white/10 transition-all ${
                      isFavorited ? "bg-primary text-white border-primary hover:bg-primary/90" : "bg-white/5 hover:bg-white/10 text-white"
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`} />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => toggleLocalAction("WatchLater")}
                    className={`rounded-xl border-white/10 transition-all ${
                      isWatchLater ? "bg-primary text-white border-primary hover:bg-primary/90" : "bg-white/5 hover:bg-white/10 text-white"
                    }`}
                  >
                    {isWatchLater ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  </Button>

                  {/* ADMIN ONLY DELETE */}
                  {isAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="rounded-xl shrink-0">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Torrent?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the torrent listing.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteTorrent.mutate(id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
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
              <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {torrent.description}
              </div>
            </div>
           
            <div className="bg-card border border-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4 font-display">Technical Specs</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Status</span>
                  <span className="font-mono text-green-400">Active</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Type</span>
                  <span className="font-mono text-foreground">Magnet URI</span>
                </div>
                 <div>
                  <span className="text-xs text-muted-foreground block mb-1">Hash</span>
                  <span className="font-mono text-foreground truncate block w-24">
                    {Math.random().toString(16).substring(2, 10).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}