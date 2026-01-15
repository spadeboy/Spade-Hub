import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@shared/routes";
import { useCreateTorrent } from "@/hooks/use-torrents";
import type { InsertTorrent } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Plus, Upload } from "lucide-react";

export function CreateTorrentModal() {
  const [open, setOpen] = useState(false);
  const createTorrent = useCreateTorrent();
  
  const form = useForm<InsertTorrent>({
    resolver: zodResolver(api.torrents.create.input),
    defaultValues: {
      title: "",
      description: "",
      magnetLink: "",
      category: "Other",
      imageUrl: "",
    },
  });

  const onSubmit = (data: InsertTorrent) => {
    createTorrent.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 rounded-full px-6">
          <Plus className="w-5 h-5 mr-2" />
          Share Torrent
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display text-white">Share a New Torrent</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Movie or Game Title" {...field} className="bg-background/50 border-white/10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background/50 border-white/10">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {["Movies", "Games", "Music", "Software", "Other"].map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} className="bg-background/50 border-white/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="magnetLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Magnet Link</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        placeholder="magnet:?xt=urn:btih:..." 
                        {...field} 
                        className="bg-background/50 border-white/10 pl-10" 
                      />
                      <Upload className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us about this torrent..." 
                      className="bg-background/50 border-white/10 min-h-[100px] resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={createTorrent.isPending}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 font-semibold"
              >
                {createTorrent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {createTorrent.isPending ? "Sharing..." : "Publish Torrent"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
