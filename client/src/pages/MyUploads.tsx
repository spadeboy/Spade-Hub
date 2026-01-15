import { useTorrents } from "@/hooks/use-torrents";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/Layout";
import { TorrentCard } from "@/components/TorrentCard";
import { Loader2, Package } from "lucide-react";
import { Redirect } from "wouter";

export default function MyUploads() {
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const { data: torrents, isLoading: isTorrentsLoading } = useTorrents({
    // In a real app we might have a specific endpoint or filter by current user
    // For now, since only one admin can upload, we show all if admin
  });

  if (isAuthLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  if (user?.email !== "ashiksa88@gmail.com") {
    return <Redirect to="/" />;
  }

  const myTorrents = torrents?.filter(t => t.createdById === user.id) || [];

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">My Uploads</h1>
        <p className="text-muted-foreground">Manage your shared torrents.</p>
      </div>

      {isTorrentsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      ) : myTorrents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-3xl bg-card/10">
          <Package className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-bold mb-2">No uploads yet</h3>
          <p className="text-muted-foreground">You haven't shared any torrents yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {myTorrents.map((torrent) => (
            <TorrentCard key={torrent.id} torrent={torrent} />
          ))}
        </div>
      )}
    </Layout>
  );
}
