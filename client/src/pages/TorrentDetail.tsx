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
  Check,
  Play,
  Construction,
  ThumbsUp,
  ThumbsDown,
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
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

// --- SARCASTIC TOAST MESSAGES ---
const LIKE_MESSAGES = [
  "Wow, you actually have good taste. Rare.",
  "Validation received. The server feels loved.",
  "Finally, a correct opinion.",
  "Approved. You may continue existing.",
  "You pressed the button. Do you want a medal?",
  "A white thumbs up? How original."
];

const DISLIKE_MESSAGES = [
  "Welcome to the dark side.",
  "Your hate has been registered in the void.",
  "Black heart, black hand, black soul.",
  "Throwing shade? We respect the hustle.",
  "Hater energy detected. We love it.",
  "Yeah, keep spreading that negativity. It fuels us."
];

export default function TorrentDetail() {
  const [, params] = useRoute("/torrents/:id");
  const id = parseInt(params?.id || "0");
 
  const { data: torrent, isLoading, error } = useTorrent(id);
  const deleteTorrent = useDeleteTorrent();
  const { toast } = useToast();
 
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [isFavorited, setIsFavorited] = useState(false);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [showFunnyPopup, setShowFunnyPopup] = useState(false);

  // --- VOTE STATES ---
  const [voteStatus, setVoteStatus] = useState<'like' | 'dislike' | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);

  // SCROLL TO TOP
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // AUTH & LIST CHECK
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAdmin(currentUser?.email === "ashiksa88@gmail.com");
    });

    const favorites = JSON.parse(localStorage.getItem("spade_favorites") || "[]");
    const watchLater = JSON.parse(localStorage.getItem("spade_watch_later") || "[]");
    setIsFavorited(favorites.some((item: any) => item.id === id));
    setIsWatchLater(watchLater.some((item: any) => item.id === id));

    // Load Local Likes
    const likedItems = JSON.parse(localStorage.getItem("spade_likes") || "[]");
    const dislikedItems = JSON.parse(localStorage.getItem("spade_dislikes") || "[]");

    if (likedItems.includes(id)) {
      setVoteStatus('like');
      setLikesCount(1);
    } else if (dislikedItems.includes(id)) {
      setVoteStatus('dislike');
      setDislikesCount(1);
    } else {
      setVoteStatus(null);
    }

    return () => unsubscribe();
  }, [id]);

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

  const handleVote = (type: 'like' | 'dislike') => {
    if (!user) {
      toast({ title: "Sign in required", description: "You must be logged in to vote.", variant: "destructive" });
      return;
    }

    let likedItems = JSON.parse(localStorage.getItem("spade_likes") || "[]");
    let dislikedItems = JSON.parse(localStorage.getItem("spade_dislikes") || "[]");

    likedItems = likedItems.filter((itemId: number) => itemId !== id);
    dislikedItems = dislikedItems.filter((itemId: number) => itemId !== id);

    if (voteStatus === type) {
      setVoteStatus(null);
      setLikesCount(0);
      setDislikesCount(0);
      toast({ title: "Vote Removed", description: "Indecisive much?" });
    } else {
      setVoteStatus(type);
      
      // GET RANDOM MESSAGE
      const randomMsg = type === 'like' 
        ? LIKE_MESSAGES[Math.floor(Math.random() * LIKE_MESSAGES.length)]
        : DISLIKE_MESSAGES[Math.floor(Math.random() * DISLIKE_MESSAGES.length)];

      if (type === 'like') {
        likedItems.push(id);
        setLikesCount(1);
        setDislikesCount(0);
        // WHITE HAND TOAST
        toast({ 
          title: "👍🏻 Liked", 
          description: randomMsg,
          className: "bg-white text-black border-black/10"
        });
      } else {
        dislikedItems.push(id);
        setLikesCount(0);
        setDislikesCount(1);
        // BLACK HAND TOAST (Dark Mode style)
        toast({ 
          title: "👎🏿 Disliked", 
          description: randomMsg,
          className: "bg-zinc-950 text-white border-white/10"
        });
      }
    }

    localStorage.setItem("spade_likes", JSON.stringify(likedItems));
    localStorage.setItem("spade_dislikes", JSON.stringify(dislikedItems));
  };

  const handleDownload = () => {
    if (!torrent) return;
    navigator.clipboard.writeText(torrent.magnetLink);
    toast({ title: "Magnet Copied!", description: "Link copied to clipboard." });
    window.location.href = torrent.magnetLink;
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

  if (isLoading) return <Layout><Skeleton className="h-[500px] w-full" /></Layout>;
  if (error || !torrent) return <Layout>Torrent Not Found</Layout>;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto pb-20">
        <Button variant="ghost" onClick={() => window.history.back()} className="mb-6 pl-0 hover:bg-transparent hover:text-primary transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="grid md:grid-cols-[350px_1fr] gap-8 lg:gap-12 mb-16">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="rounded-2xl overflow-hidden bg-muted aspect-[3/4] shadow-2xl relative group border border-white/10">
              <img src={torrent.imageUrl || ""} alt={torrent.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Badge className="bg-primary text-white border-none text-lg py-1 px-4">{torrent.category}</Badge>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {torrent.category === "Movies" && (
                <Button 
                  size="lg"
                  onClick={() => setShowFunnyPopup(true)}
                  className="w-full text-lg font-bold h-12 bg-white text-black hover:bg-primary hover:text-white transition-all duration-300 shadow-lg hover:scale-[1.02] active:scale-[0.98] group"
                >
                  <Play className="mr-2 h-5 w-5 fill-current" /> Watch Now
                </Button>
              )}

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
              <button onClick={handleShare} className="bg-card border border-white/5 p-4 rounded-xl text-center hover:bg-white/5 transition-colors cursor-pointer">
                <Share2 className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <span className="text-xs font-bold text-muted-foreground">SHARE</span>
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight text-white transition-all duration-300 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-br hover:from-primary hover:to-purple-400 cursor-default">
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

            <div className="flex items-center gap-4">
               {/* LIKE / DISLIKE BUTTONS */}
               <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/10">
                  
                  {/* LIKE BUTTON */}
                  <button 
                    onClick={() => handleVote('like')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold transition-all duration-300 ${
                      voteStatus === 'like' 
                      ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105" 
                      : "text-white hover:bg-white/10"
                    }`}
                  >
                    <span className="text-lg">👍🏻</span>
                    <span>{likesCount}</span>
                  </button>

                  <div className="w-px h-4 bg-white/10"></div>

                  {/* DISLIKE BUTTON */}
                  <button 
                    onClick={() => handleVote('dislike')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold transition-all duration-300 ${
                      voteStatus === 'dislike' 
                      ? "bg-black text-white border border-white/20 shadow-[0_0_15px_rgba(0,0,0,0.5)] scale-105" 
                      : "text-white hover:bg-white/10"
                    }`}
                  >
                    <span className="text-lg">👎🏿</span>
                    <span>{dislikesCount}</span>
                  </button>

               </div>

              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full w-fit">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{torrent.createdAt ? format(new Date(torrent.createdAt), 'PPP') : 'Unknown Date'}</span>
              </div>
            </div>

            <div className="prose prose-invert max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {torrent.description}
            </div>
          </div>
        </div>

        {/* FUNNY POPUP */}
        <Dialog open={showFunnyPopup} onOpenChange={setShowFunnyPopup}>
          <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-center p-8">
             <div className="flex flex-col items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
                  <Construction className="w-10 h-10 text-yellow-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white font-display">Whoa there, eager beaver!</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    I'm working on it, okay? Rome wasn't built in a day, and neither is this streaming feature. 
                    <br/><br/>
                    <span className="text-primary font-medium">Go download the magnet link like a caveman for now.</span>
                  </p>
                </div>
                <Button onClick={() => setShowFunnyPopup(false)} variant="outline" className="mt-2 w-full border-white/10 hover:bg-white/5">
                  Fine, I'll wait...
                </Button>
             </div>
          </DialogContent>
        </Dialog>

      </div>
    </Layout>
  );
}