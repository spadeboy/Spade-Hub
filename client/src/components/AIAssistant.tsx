import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, User } from "lucide-react";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

type Message = {
  id: number;
  text: string;
  sender: "user" | "bot";
};

// --- CHAT RESPONSES ---
const LINK_ROASTS = [
  "Bro, the download button is HUGE. It's right there. 🤦‍♂️",
  "I am an AI, not your butler. Click the 'Magnet Download' button yourself.",
  "You really asking me for the link? Open your eyes, human.",
  "It's the big button that says 'DOWNLOAD'. Do I need to hold your hand?",
  "404 Error: User capability not found. Just click the button."
];

const GENERIC_VIBES = [
  "I'm just here to look cool and judge your taste in torrents.",
  "Spade Hub rules, you drool. Just kidding... mostly.",
  "I'd help you, but I'm busy calculating the meaning of life. (It's 42).",
  "Yo. What's good?",
  "Don't download viruses, okay? That's my only advice.",
  "I'm vibing. You vibing?",
  "Cool story, bro."
];

const GREETINGS = [
  "Sup. What do you want?",
  "Oh look, a human. Hello.",
  "Spade Bot online. Unfortunately.",
  "Make it quick, I have pixels to push."
];

// --- BUBBLE TEXTS (IDLE) ---
const IDLE_MESSAGES = [
  "Want my wisdom? 🤔",
  "I judge choices. 🤖",
  "Psst. Down here. 👇",
  "Bored? Click me. ✨",
  "I have opinions. 💬",
  "Need a magnet? 🧲",
  "Silence is boring. 🎵"
];

// --- BUBBLE TEXTS (POKE/DOUBLE CLICK) ---
const POKE_REACTIONS = [
  "Aeyy don't touch me! 😠",
  "Personal space, bro! 🛑",
  "Ouch! Watch the paint! 🤕",
  "Stop poking me! 👉",
  "Do I look like a stress ball? 😤",
  "Hands off the merchandise! 💅"
];

const BOT_AVATAR = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Robot.png";

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Sup. I'm Spade Bot. Don't ask me stupid questions.", sender: "bot" }
  ]);
  
  // State for the floating bubble text
  const [bubbleText, setBubbleText] = useState(IDLE_MESSAGES[0]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Randomize initial message
    setBubbleText(IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)]);

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // --- HANDLE DOUBLE CLICK (POKE) ---
  const handlePoke = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Pick a random angry reaction
    const angryText = POKE_REACTIONS[Math.floor(Math.random() * POKE_REACTIONS.length)];
    setBubbleText(angryText);

    // Reset back to normal after 2 seconds
    setTimeout(() => {
      const normalText = IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)];
      setBubbleText(normalText);
    }, 2500);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userText = input.trim();
    const newMsg: Message = { id: Date.now(), text: userText, sender: "user" };
    
    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    setTimeout(() => {
      let botResponse = "";
      const lowerText = userText.toLowerCase();

      if (lowerText.includes("link") || lowerText.includes("download") || lowerText.includes("magnet") || lowerText.includes("where")) {
        botResponse = LINK_ROASTS[Math.floor(Math.random() * LINK_ROASTS.length)];
      } else if (lowerText.includes("hello") || lowerText.includes("hi") || lowerText.includes("hey")) {
        botResponse = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
      } else {
        botResponse = GENERIC_VIBES[Math.floor(Math.random() * GENERIC_VIBES.length)];
      }

      const botMsg: Message = { id: Date.now() + 1, text: botResponse, sender: "bot" };
      setMessages((prev) => [...prev, botMsg]);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <div className="pointer-events-auto flex flex-col items-end">
        
        {isOpen && (
          <div className="mb-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
            {!user ? (
              <Card className="w-80 p-6 bg-zinc-950 border-white/10 shadow-2xl relative">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-white" onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center p-2 shadow-inner">
                     <img src={BOT_AVATAR} alt="Spade Bot" className="w-full h-full object-contain drop-shadow-md" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg font-display">Who are you?</h3>
                    <p className="text-muted-foreground text-sm mt-2">
                      I don't talk to strangers.<br/> 
                      <span className="font-bold text-primary">Sign in</span> if you want my wisdom.
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="w-80 md:w-96 h-[450px] flex flex-col bg-black/80 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center p-1 border border-white/10">
                      <img src={BOT_AVATAR} alt="Spade Bot" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <span className="font-bold font-display block leading-none text-white">Spade Bot</span>
                      <span className="text-[10px] text-primary font-mono font-bold">ONLINE</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/10 text-white" onClick={() => setIsOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <ScrollArea className="flex-1 p-4 space-y-4">
                  <div className="flex flex-col gap-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex items-start gap-2 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                        {msg.sender === "bot" && (
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-white/10 p-1">
                            <img src={BOT_AVATAR} alt="Bot" className="w-full h-full object-contain" />
                          </div>
                        )}
                        {msg.sender === "user" && (
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className={`px-4 py-2 rounded-2xl text-sm max-w-[80%] shadow-sm ${
                          msg.sender === "user" 
                            ? "bg-white text-black rounded-tr-none" 
                            : "bg-zinc-800 border border-white/10 text-white rounded-tl-none"
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="p-3 border-t border-white/10 bg-black/40 flex gap-2">
                  <Input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Say something..." 
                    className="bg-white/5 border-white/10 focus-visible:ring-primary text-white placeholder:text-muted-foreground"
                  />
                  <Button size="icon" onClick={handleSend} className="bg-primary hover:bg-primary/90 text-white">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        <div className="relative group">
          {/* DYNAMIC BUBBLE TEXT */}
          {!isOpen && (
            <div className="absolute bottom-full right-0 mb-4 w-52 animate-bounce transition-opacity duration-300">
               <div className="bg-white text-black text-xs font-bold px-4 py-2 rounded-2xl rounded-br-none shadow-[0_10px_30px_-10px_rgba(255,255,255,0.5)] relative border-2 border-primary flex items-center gap-2">
                  <span>{bubbleText}</span>
                  
                  <div className="absolute top-full right-0 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-white border-r-[0px] border-r-transparent translate-x-[-15px]"></div>
                  <div className="absolute top-full right-0 w-0 h-0 border-l-[12px] border-l-transparent border-t-[12px] border-t-primary border-r-[0px] border-r-transparent translate-x-[-14px] -z-10 translate-y-[1px]"></div>
               </div>
            </div>
          )}

          <Button 
            onClick={() => setIsOpen(!isOpen)}
            onDoubleClick={handlePoke} // ADDED DOUBLE CLICK HANDLER
            className="h-16 w-16 rounded-full shadow-[0_0_30px_rgba(124,58,237,0.5)] bg-primary hover:bg-primary/90 hover:scale-110 active:scale-95 transition-all duration-300 border-4 border-black/50 overflow-hidden p-0 z-50"
          >
            {isOpen ? (
              <X className="w-8 h-8 text-white" />
            ) : (
              <img 
                src={BOT_AVATAR} 
                alt="AI" 
                className="w-full h-full object-cover scale-90 translate-y-1 drop-shadow-lg" 
              />
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}