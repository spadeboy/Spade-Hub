import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type TorrentInput, type TorrentsQueryParams } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useTorrents(params?: TorrentsQueryParams) {
  const queryString = params 
    ? "?" + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
    : "";

  return useQuery({
    queryKey: [api.torrents.list.path, params],
    queryFn: async () => {
      const res = await fetch(api.torrents.list.path + queryString, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch torrents");
      return api.torrents.list.responses[200].parse(await res.json());
    },
  });
}

export function useTorrent(id: number) {
  return useQuery({
    queryKey: [api.torrents.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.torrents.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch torrent");
      return api.torrents.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateTorrent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: TorrentInput) => {
      const validated = api.torrents.create.input.parse(data);
      const res = await fetch(api.torrents.create.path, {
        method: api.torrents.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create torrent");
      }
      
      return api.torrents.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.torrents.list.path] });
      toast({
        title: "Success",
        description: "Torrent shared successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteTorrent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.torrents.delete.path, { id });
      const res = await fetch(url, { 
        method: api.torrents.delete.method, 
        credentials: "include" 
      });

      if (!res.ok) throw new Error("Failed to delete torrent");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.torrents.list.path] });
      toast({
        title: "Deleted",
        description: "Torrent has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
