import * as React from "react";
import { type TorrentWithAuthor } from "@shared/schema";
import { TorrentCard } from "@/components/TorrentCard";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { ChevronRight } from "lucide-react";

interface MediaRowProps {
    title: string;
    torrents: TorrentWithAuthor[];
    viewAllLink?: string;
}

export function MediaRow({ title, torrents, viewAllLink }: MediaRowProps) {
    if (!torrents || torrents.length === 0) return null;

    return (
        <section className="space-y-4 py-8 relative group/row">
            <div className="flex items-center justify-between px-4 md:px-12">
                <h2 className="text-2xl md:text-3xl font-display font-bold text-white flex items-center gap-2">
                    <span className="w-1.5 h-8 bg-primary rounded-full block"></span>
                    {title}
                </h2>
                {viewAllLink && (
                    <a
                        href={viewAllLink}
                        className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group/link"
                    >
                        View All <ChevronRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                    </a>
                )}
            </div>

            <div className="relative px-4 md:px-12">
                <Carousel
                    opts={{
                        align: "start",
                        loop: false,
                        dragFree: true,
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-4">
                        {torrents.map((item) => (
                            <CarouselItem key={item.id} className="pl-4 basis-[160px] md:basis-[200px] lg:basis-[240px] xl:basis-[280px]">
                                <div className="h-full">
                                    {/* Passing a prop 'aspect="portrait"' if we wanted to enforce it in TorrentCard, 
                      but we will refactor TorrentCard to be portrait by default or flexible. */}
                                    <TorrentCard torrent={item} />
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 transition-opacity bg-background/80 backdrop-blur border-white/10 text-white h-12 w-12 disabled:opacity-0" />
                    <CarouselNext className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 transition-opacity bg-background/80 backdrop-blur border-white/10 text-white h-12 w-12 disabled:opacity-0" />
                </Carousel>
            </div>
        </section>
    );
}
