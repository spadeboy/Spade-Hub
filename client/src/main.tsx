import { Buffer } from 'buffer';

// Polyfill Buffer globally
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

// ... rest of your imports
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);