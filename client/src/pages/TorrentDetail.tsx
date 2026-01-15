import { useRoute, Link } from "wouter";
import { useTorrent, useDeleteTorrent } from "@/hooks/use-torrents";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Download, 
  ArrowLeft, 
  Calendar, 
  User, 
  Trash2, 
  Share2, 
  ShieldCheck 
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

export default function TorrentDetail() {
  const [, params] = useRoute("/torrents/:id");
  const id = parseInt(params?.id || "0");
  
  const { data: torrent, isLoading, error } = useTorrent(id);
  const { user } = useAuth();
  const deleteTorrent = useDeleteTorrent();
  
  const isOwner = user && torrent && user.id === torrent.createdById;

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
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" asChild className="mb-6 pl-0 hover:pl-2 transition-all">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Browse
          </Link>
        </Button>

        <div className="grid md:grid-cols-[350px_1fr] gap-8 lg:gap-12">
          {/* Left Column: Image & Actions */}
          <div className="space-y-6">
            <div className="rounded-2xl overflow-hidden bg-muted aspect-[3/4] shadow-2xl relative group">
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

            <Button size="lg" className="w-full text-lg font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" asChild>
              <a href={torrent.magnetLink}>
                <Download className="mr-2 h-5 w-5" />
                Download Magnet
              </a>
            </Button>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-white/5 p-4 rounded-xl text-center">
                <ShieldCheck className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Verified</span>
              </div>
              <div className="bg-card border border-white/5 p-4 rounded-xl text-center">
                <Share2 className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Share</span>
              </div>
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="space-y-8">
            <div>
              <div className="flex items-start justify-between">
                <h1 className="text-4xl md:text-5xl font-display font-bold text-glow leading-tight mb-4">
                  {torrent.title}
                </h1>
                {isOwner && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon" className="shrink-0">
                        <Trash2 className="h-4 w-4" />
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
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-b border-white/10 pb-6">
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full">
                  <User className="w-4 h-4" />
                  <span>Uploaded by <span className="text-foreground font-medium">{torrent.author?.username || "Unknown"}</span></span>
                </div>
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
            
            {/* Technical Details placeholder - could be expanded if schema had file size, seeders etc */}
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
                    {/* Fake hash derived from ID just for visuals */}
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
