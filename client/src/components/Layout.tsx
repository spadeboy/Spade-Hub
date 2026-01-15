import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogIn, LogOut, Spade, Heart, Plus, ListVideo } from "lucide-react";

// --- FIREBASE IMPORTS ---
import { useEffect, useState } from "react";
import { auth, googleProvider } from "@/firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

export function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const isAuthenticated = !!user;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
              <Spade className="w-6 h-6 text-primary" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">
              Spade<span className="text-primary"> Hub</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
              {/* Favorites & Watch Later Links */}
              {isAuthenticated && (
                <>
                  <Link href="/favorites" className="flex items-center gap-1.5 text-sm font-medium hover:text-red-500 transition-colors">
                    <Heart className="w-4 h-4" />
                    <span>Favorites</span>
                  </Link>
                  <Link href="/watch-later" className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors">
                    <Plus className="w-4 h-4" />
                    <span>Watch Later</span>
                  </Link>
                </>
              )}
              
              {user?.email === "ashiksa88@gmail.com" && (
                <Link href="/my-uploads" className="text-sm font-medium hover:text-primary transition-colors border-l border-white/10 pl-4">
                  My Uploads
                </Link>
              )}
            </nav>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border border-white/10">
                      <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || ""} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {user?.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-card border-white/10" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user?.displayName || "User"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={handleGoogleLogin} 
                variant="default" 
                className="bg-primary hover:bg-primary/90 font-semibold shadow-lg shadow-primary/20"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-white/5 py-8 bg-black/20">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Spade Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}