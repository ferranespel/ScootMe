import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import i18n (internationalization)
import "./i18n";

// Force cache busting with version check
const APP_VERSION = "20240424-1"; // Change this version when deploying major updates
const lastVersion = localStorage.getItem('app_version');
if (lastVersion !== APP_VERSION) {
  // Clear all cached data
  try {
    // Clear auth cache items
    localStorage.removeItem('auth_user');
    localStorage.removeItem('firebase_auth_success_time');
    localStorage.removeItem('auth_success_timestamp');
    
    // Update version and force reload to clear JS cache
    localStorage.setItem('app_version', APP_VERSION);
    console.log(`Updated from version ${lastVersion || 'none'} to ${APP_VERSION} - clearing cache`);
    
    // If there was a previous version, force reload the page to ensure clean state
    if (lastVersion) {
      // Add cache-busting parameter to URL before reloading
      const url = new URL(window.location.href);
      url.searchParams.set('cache_bust', Date.now().toString());
      window.location.href = url.toString();
    }
  } catch (e) {
    console.warn("Cache clearing failed:", e);
  }
}

// Load firebase compatibility layer first - ensures OAuth setup
import "@/lib/firebase";

// No need to load Google Maps here anymore,
// it's now handled by the Map component itself
// for better initialization control and error handling

// Render the app
createRoot(document.getElementById("root")!).render(<App />);
