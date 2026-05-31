import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { useTorrent, useDeleteTorrent } from "@/hooks/use-torrents";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  MessageSquare,
  Send
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; // ADDED: React Query for comments

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

// --- ANONYMOUS COMMENT ASSETS ---
const ANON_EMOJIS = ["👻", "👽", "🤖", "👾", "🤡", "💀", "👺", "🎃", "💩", "🦄"];
const ANON_COLORS = [
  "bg-red-500/20 text-red-500",
  "bg-blue-500/20 text-blue-500",
  "bg-green-500/20 text-green-500",
  "bg-yellow-500/20 text-yellow-500",
  "bg-purple-500/20 text-purple-500",
  "bg-pink-500/20 text-pink-500",
];

export default function TorrentDetail() {
  const [, params] = useRoute("/torrents/:id");
  const id = parseInt(params?.id || "0");
  const queryClient = useQueryClient();

  const { data: torrent, isLoading, error } = useTorrent(id);
  const deleteTorrent = useDeleteTorrent();
  const { toast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [isFavorited, setIsFavorited] = useState(false);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [showFunnyPopup, setShowFunnyPopup] = useState(false);
  const [isStreamLoading, setIsStreamLoading] = useState(false);

  const [voteStatus, setVoteStatus] = useState<'like' | 'dislike' | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);

  const [newComment, setNewComment] = useState("");

  // --- FETCH COMMENTS FROM SERVER ---
  const { data: comments = [] } = useQuery({
    queryKey: [`/api/torrents/${id}/comments`],
    queryFn: async () => {
      const res = await fetch(`/api/torrents/${id}/comments`);
      if (!res.ok) throw new Error("Failed to load comments");
      return res.json();
    }
  });

  // --- POST COMMENT TO SERVER ---
  const postCommentMutation = useMutation({
    mutationFn: async (newCommentData: any) => {
      const res = await fetch(`/api/torrents/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCommentData),
      });
      if (!res.ok) throw new Error("Failed to post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/torrents/${id}/comments`] });
      setNewComment("");
      toast({ title: "Posted anonymously", description: "Your secret is safe with the server." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not post comment.", variant: "destructive" });
    }
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAdmin(currentUser?.email === "ashiksa88@gmail.com");
    });

    const favorites = JSON.parse(localStorage.getItem("spade_favorites") || "[]");
    const watchLater = JSON.parse(localStorage.getItem("spade_watch_later") || "[]");
    setIsFavorited(favorites.some((item: any) => item.id === id));
    setIsWatchLater(watchLater.some((item: any) => item.id === id));

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

      const randomMsg = type === 'like'
        ? LIKE_MESSAGES[Math.floor(Math.random() * LIKE_MESSAGES.length)]
        : DISLIKE_MESSAGES[Math.floor(Math.random() * DISLIKE_MESSAGES.length)];

      if (type === 'like') {
        likedItems.push(id);
        setLikesCount(1);
        setDislikesCount(0);
        toast({
          title: "👍🏻 Liked",
          description: randomMsg,
          className: "bg-white text-black border-black/10"
        });
      } else {
        dislikedItems.push(id);
        setLikesCount(0);
        setDislikesCount(1);
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

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    // GENERATE RANDOM IDENTITY FOR DB
    const randomEmoji = ANON_EMOJIS[Math.floor(Math.random() * ANON_EMOJIS.length)];
    const randomColor = ANON_COLORS[Math.floor(Math.random() * ANON_COLORS.length)];

    postCommentMutation.mutate({
      text: newComment.trim(),
      emoji: randomEmoji,
      colorClass: randomColor
    });
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
      }).catch(() => { });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link Copied", description: "Copied to clipboard." });
    }
  };

  if (isLoading) return <Layout><Skeleton className="h-[500px] w-full" /></Layout>;
  if (error || !torrent) return <Layout>Torrent Not Found</Layout>;

  return (
    <Layout transparentHeader={true}>

      {/* IMMERSIVE BACKGROUND */}
      <div className="absolute inset-0 w-full h-[80vh] overflow-hidden -z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent z-10" />
        {torrent.imageUrl && (
          <img
            src={torrent.imageUrl}
            alt="Background"
            className="w-full h-full object-cover opacity-30 blur-sm scale-105"
          />
        )}
      </div>

      <div className="max-w-7xl mx-auto pt-24 pb-20 px-4 md:px-8 relative z-20">
        <Button variant="ghost" onClick={() => window.history.back()} className="mb-6 pl-0 hover:bg-transparent text-white/70 hover:text-primary transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
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
                  disabled={isStreamLoading}
                  onClick={async () => {
                    setIsStreamLoading(true);
                    const title = torrent.title.replace(/\s*\(?\d{4}\)?\s*$/, '').trim();
                    const year = torrent.releaseYear || torrent.title.match(/\b(19|20)\d{2}\b/)?.[0] || '';
                    let tmdbId = '';
                    try {
                      const TMDB_KEY = '6ee1bab484e315e98c68e10e963e59d1';
                      const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}${year ? `&year=${year}` : ''}`);
                      const data = await res.json();
                      if (data.results && data.results.length > 0) tmdbId = String(data.results[0].id);
                    } catch { /* fallback */ }
                    if (!tmdbId) tmdbId = String(torrent.id);
                    const params = new URLSearchParams({
                      id: tmdbId, type: 'movie', title: torrent.title,
                      year: String(year), poster: torrent.imageUrl || '',
                      overview: torrent.description || '', rating: '4.5',
                    });
                    window.location.href = `/stream.html?${params.toString()}`;
                  }}
                  className="w-full text-lg font-bold h-12 bg-white text-black hover:bg-primary hover:text-white transition-all duration-300 shadow-lg hover:scale-[1.02] active:scale-[0.98] group"
                >
                  <Play className="mr-2 h-5 w-5 fill-current" /> {isStreamLoading ? 'Finding Stream…' : 'Watch Now'}
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
                {/* User Action Buttons */}
                {user && (
                  <>
                    <Button variant="outline" size="icon" onClick={() => toggleLocalAction("Favorites")}
                      className={`rounded-xl border-white/10 transition-all ${isFavorited ? "bg-primary text-white border-primary" : "bg-white/5 hover:bg-white/10 text-white"}`}>
                      <Heart className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`} />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => toggleLocalAction("WatchLater")}
                      className={`rounded-xl border-white/10 transition-all ${isWatchLater ? "bg-primary text-white border-primary" : "bg-white/5 hover:bg-white/10 text-white"}`}>
                      {isWatchLater ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    </Button>
                  </>
                )}

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
                <button
                  onClick={() => handleVote('like')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold transition-all duration-300 ${voteStatus === 'like'
                    ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105"
                    : "text-white hover:bg-white/10"
                    }`}
                >
                  <span className="text-lg">👍🏻</span>
                  <span>{likesCount}</span>
                </button>
                <div className="w-px h-4 bg-white/10"></div>
                <button
                  onClick={() => handleVote('dislike')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold transition-all duration-300 ${voteStatus === 'dislike'
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

            {/* --- PUBLIC COMMUNITY BOARD (Database Powered) --- */}
            <div className="pt-8 border-t border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-white font-display">Community Board</h3>
              </div>

              {/* Input Area */}
              <div className="flex gap-2 mb-6">
                <Input
                  placeholder="Any issue or feels slow in the link? Drop a message here..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="bg-white/5 border-white/10 focus-visible:ring-primary text-white"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <Button onClick={handleAddComment} size="icon" className="bg-primary hover:bg-primary/90 text-white" disabled={postCommentMutation.isPending}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Comment List */}
              <ScrollArea className="h-[300px] w-full pr-4 rounded-xl border border-white/5 bg-black/20 p-4">
                {comments.length === 0 ? (
                  <div className="text-center text-muted-foreground py-10">No comments yet. Be the first! 👻</div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {comments.map((comment: any) => (
                      <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Anonymous Avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${comment.colorClass}`}>
                          {comment.emoji}
                        </div>

                        {/* Message Body */}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white/80">Anonymous</span>
                            <span className="text-[10px] text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded-sm">
                              {comment.createdAt ? format(new Date(comment.createdAt), 'MMM d, h:mm a') : 'Just now'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground bg-white/5 p-3 rounded-r-xl rounded-bl-xl leading-relaxed">
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

          </div>
        </div>

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
                  <br /><br />
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