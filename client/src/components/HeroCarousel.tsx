import * as React from "react";
import { type TorrentWithAuthor } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Info, Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Link } from "wouter";

interface HeroCarouselProps {
  featured: TorrentWithAuthor[];
}

export function HeroCarousel({ featured }: HeroCarouselProps) {
  if (!featured || featured.length === 0) return null;

  return (
    <div className="relative w-full h-[60vh] md:h-[75vh] min-h-[500px] overflow-hidden group">
      <Carousel
        opts={{
          loop: true,
          duration: 60,
        }}
        plugins={[
          Autoplay({
            delay: 6000,
            stopOnInteraction: false,
            stopOnMouseEnter: true,
          }),
        ]}
        className="w-full h-full [&>div]:h-full"
      >
        <CarouselContent className="h-full ml-0">
          {featured.map((item) => (
            <CarouselItem key={item.id} className="relative w-full h-full pl-0 basis-full bg-zinc-900">
              {/* Background Image with Gradient Overlay */}
              <div className="absolute inset-0 w-full h-full">
                {/* Image */}
                <img
                  src={item.imageUrl || ""}
                  alt={item.title}
                  className="w-full h-full object-cover object-top opacity-60"
                />

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 lg:p-16 z-10 flex flex-col justify-end h-full">
                <div className="max-w-3xl space-y-4">
                  {/* Metadata Tags */}
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border-0 rounded-md px-2 py-1">
                      {item.category}
                    </Badge>
                    <div className="flex items-center text-yellow-400 text-sm font-medium">
                      <Star className="w-4 h-4 fill-current mr-1" />
                      <span>4.5</span>
                    </div>
                    <span className="text-white/60 text-sm font-medium">
                      {item.releaseYear ||
                        (item.title.match(/\b(19|20)\d{2}\b/)?.[0]) ||
                        new Date(item.createdAt || new Date()).getFullYear()}
                    </span>
                  </div>

                  {/* Title */}
                  <h1 className="text-4xl md:text-5xl lg:text-7xl font-display font-bold text-white tracking-tight leading-none line-clamp-2">
                    {item.title}
                  </h1>

                  {/* Description */}
                  <p className="text-lg md:text-xl text-white/70 max-w-2xl line-clamp-2">
                    {item.description}
                  </p>

                  {/* Buttons */}
                  <div className="flex flex-wrap items-center gap-4 pt-4">
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 h-12 text-base font-semibold shadow-xl shadow-primary/20"
                      onClick={async () => {
                        const cleanTitle = item.title.replace(/\s*\(?\d{4}\)?\s*$/, '').trim();
                        const yr = item.releaseYear || item.title.match(/\b(19|20)\d{2}\b/)?.[0] || '';
                        let tmdbId = '';
                        try {
                          const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=6ee1bab484e315e98c68e10e963e59d1&query=${encodeURIComponent(cleanTitle)}${yr ? `&year=${yr}` : ''}`);
                          const data = await res.json();
                          if (data.results && data.results.length > 0) tmdbId = String(data.results[0].id);
                        } catch { /* fallback */ }
                        if (!tmdbId) tmdbId = String(item.id);
                        const params = new URLSearchParams({
                          id: tmdbId, type: 'movie', title: item.title,
                          year: String(yr), poster: item.imageUrl || '',
                          overview: item.description || '', rating: '4.5',
                        });
                        window.location.href = `/stream.html?${params.toString()}`;
                      }}
                    >
                      <Play className="w-5 h-5 mr-2 fill-current" />
                      Watch Now
                    </Button>
                    <Link href={`/torrents/${item.id}`}>
                      <a className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-white backdrop-blur-md rounded-full px-8 h-12 text-base font-semibold border border-white/10 transition-all hover:scale-105">
                        <Info className="w-5 h-5 mr-2" />
                        More Info
                      </a>
                    </Link>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation Buttons (Hidden on mobile, visible on hover desktop) */}
        <div className="absolute right-12 bottom-12 hidden md:flex gap-2">
          <CarouselPrevious className="static translate-y-0 bg-white/10 border-white/10 text-white hover:bg-white/20" />
          <CarouselNext className="static translate-y-0 bg-white/10 border-white/10 text-white hover:bg-white/20" />
        </div>
      </Carousel>
    </div>
  );
}
