import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
// @ts-ignore
import WebTorrent from "webtorrent";

interface StreamPlayerProps {
  magnetLink: string;
}

export function StreamPlayer({ magnetLink }: StreamPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "playing" | "error" | "no_peers">("loading");
  const [progress, setProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [peers, setPeers] = useState(0);
  const clientRef = useRef<any>(null);

  useEffect(() => {
    const client = new WebTorrent();
    clientRef.current = client;

    // Timeout: If no peers found in 15 seconds, show a specific warning
    const timeout = setTimeout(() => {
      if (peers === 0 && status === "loading") {
        setStatus("no_peers");
      }
    }, 15000);

    // Add trackers explicitly to help find WebRTC peers
    const opts = {
      announce: [
        "wss://tracker.openwebtorrent.com",
        "wss://tracker.btorrent.xyz",
        "wss://tracker.webtorrent.dev",
        "wss://tracker.files.fm:7073/announce",
      ]
    };

    client.add(magnetLink, opts, (torrent: any) => {
      // Find a video file
      const file = torrent.files.find((f: any) => 
        f.name.endsWith(".mp4") || 
        f.name.endsWith(".webm") || 
        f.name.endsWith(".mkv")
      );

      if (!file) {
        setStatus("error");
        return;
      }

      // Render to the container
      file.renderTo(containerRef.current!, {
        autoplay: true,
        controls: true,
      });

      setStatus("playing");

      torrent.on("download", () => {
        setProgress(Math.round(torrent.progress * 100));
        setDownloadSpeed(Math.round(torrent.downloadSpeed / 1024));
        setPeers(torrent.numPeers);
        
        // If we found peers, clear the "no peers" warning
        if (torrent.numPeers > 0 && status === "no_peers") {
          setStatus("playing"); // Or back to loading if not ready, but usually this means we are good
        }
      });
    });

    client.on("error", () => setStatus("error"));

    return () => {
      clearTimeout(timeout);
      if (clientRef.current) {
        clientRef.current.destroy();
      }
    };
  }, [magnetLink]);

  return (
    <div className="w-full h-full bg-black rounded-xl overflow-hidden relative flex flex-col items-center justify-center min-h-[400px]">
      <div ref={containerRef} className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-contain" />

      {/* Loading State */}
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 text-white space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <div className="text-center">
            <p className="font-bold text-lg">Connecting to Peers...</p>
            <p className="text-sm text-muted-foreground">Finding WebRTC seeds</p>
          </div>
        </div>
      )}

      {/* No Peers Warning (Timeout) */}
      {status === "no_peers" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 text-white space-y-4 p-8 text-center">
          <AlertCircle className="w-10 h-10 text-yellow-500" />
          <p className="font-bold text-xl">No WebRTC Peers Found</p>
          <div className="text-sm text-muted-foreground max-w-md space-y-2">
            <p>We couldn't connect to anyone streaming this file right now.</p>
            <p className="text-xs bg-white/10 p-2 rounded">
              <strong>Technical Note:</strong> Browsers can only connect to other browser-based peers. Standard desktop torrent clients are not visible to this player unless they enable WebRTC.
            </p>
          </div>
        </div>
      )}

      {/* General Error */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 text-white space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <p className="font-bold">Cannot Stream this Torrent</p>
          <p className="text-sm text-muted-foreground">File type not supported or invalid magnet.</p>
        </div>
      )}

      {/* Playing Stats */}
      {(status === "playing" || peers > 0) && (
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono text-white/80 flex gap-3 z-20 pointer-events-none">
          <span className={downloadSpeed > 0 ? "text-green-400" : "text-white"}>{downloadSpeed} KB/s</span>
          <span>{peers} Peers</span>
          <span className="text-primary">{progress}%</span>
        </div>
      )}
    </div>
  );
}