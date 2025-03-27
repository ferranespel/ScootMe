import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Make API key available globally
if (import.meta.env.GOOGLE_MAPS_API_KEY) {
  window.GOOGLE_MAPS_API_KEY = import.meta.env.GOOGLE_MAPS_API_KEY;
}

createRoot(document.getElementById("root")!).render(<App />);
