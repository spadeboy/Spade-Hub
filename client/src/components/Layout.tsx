import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetHeader,
  SheetTitle, 
  SheetClose
} from "@/components/ui/sheet"; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  LogIn, 
  LogOut, 
  Spade, 
  Heart, 
  Plus, 
  UploadCloud 
} from "lucide-react";

// --- COMPONENTS ---
import { AIAssistant } from "./AIAssistant"; 

// --- FIREBASE IMPORTS ---
import { useEffect, useState } from "react";
import { auth, googleProvider } from "@/firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

export function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const isAuthenticated = !!user;
  const isAdmin = user?.email === "ashiksa88@gmail.com";

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

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {isAuthenticated && (
        <>
          <Link href="/favorites">
            <a className={`flex items-center gap-2 font-medium hover:text-red-500 transition-colors ${mobile ? "text-lg py-2" : "text-sm"}`}>
              <Heart className={mobile ? "w-5 h-5" : "w-4 h-4"} />
              <span>Favorites</span>
            </a>
          </Link>
          <Link href="/watch-later">
            <a className={`flex items-center gap-2 font-medium hover:text-primary transition-colors ${mobile ? "text-lg py-2" : "text-sm"}`}>
              <Plus className={mobile ? "w-5 h-5" : "w-4 h-4"} />
              <span>Watch Later</span>
            </a>
          </Link>
        </>
      )}
      
      {isAdmin && (
        <Link href="/my-uploads">
          <a className={`flex items-center gap-2 font-medium hover:text-primary transition-colors ${mobile ? "text-lg py-2" : "text-sm border-l border-white/10 pl-4"}`}>
            {mobile && <UploadCloud className="w-5 h-5" />}
            <span>My Uploads</span>
          </a>
        </Link>
      )}
    </>
  );

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
            
            {/* DESKTOP NAV (Hidden on Mobile) */}
            <nav className="hidden md:flex items-center gap-6">
              <NavLinks />
            </nav>

            {/* USER PROFILE / LOGOUT (Desktop & Mobile if Logged In) */}
            {isAuthenticated ? (
              <>
                 {/* DESKTOP DROPDOWN */}
                 <div className="hidden md:block">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                          <Avatar className="h-10 w-10 border border-white/10 cursor-pointer">
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
                 </div>

                 {/* MOBILE PROFILE TRIGGER (Replaces Hamburger) */}
                 <div className="md:hidden">
                    <Sheet>
                      <SheetTrigger asChild>
                        {/* CHANGED: Replaced Menu Icon with User Avatar */}
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                          <Avatar className="h-9 w-9 border border-white/10 ring-2 ring-transparent active:ring-primary/50 transition-all">
                            <AvatarImage src={user?.photoURL || ""} />
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {user?.email?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="bg-background border-white/10 w-[300px]">
                        <SheetHeader>
                          <SheetTitle className="text-left font-display font-bold text-xl">Menu</SheetTitle>
                        </SheetHeader>
                        <div className="flex flex-col gap-6 mt-8">
                          
                          {/* User Info in Mobile Menu */}
                          <div className="flex items-center gap-3 pb-6 border-b border-white/10">
                              <Avatar className="h-12 w-12 border border-white/10">
                                <AvatarImage src={user?.photoURL || ""} />
                                <AvatarFallback className="bg-primary/20 text-primary">
                                  {user?.email?.[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-medium text-lg">{user?.displayName || "User"}</span>
                                <span className="text-xs text-muted-foreground truncate w-40">{user?.email}</span>
                              </div>
                          </div>

                          <NavLinks mobile={true} />
                          
                          <div className="mt-auto">
                            <SheetClose asChild>
                              <Button 
                                onClick={handleLogout} 
                                variant="destructive" 
                                className="w-full justify-start"
                              >
                                <LogOut className="w-4 h-4 mr-2" />
                                Log Out
                              </Button>
                            </SheetClose>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                 </div>
              </>
            ) : (
              // --- GUEST USER: Show Sign In Button Directly (Desktop & Mobile) ---
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

      <AIAssistant />
    </div>
  );
}