import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// No need to load Google Maps here anymore,
// it's now handled by the Map component itself
// for better initialization control and error handling

// Render the app
createRoot(document.getElementById("root")!).render(<App />);
