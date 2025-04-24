// Force cache busting with version check MUST BE FIRST
const APP_VERSION = "20240424-2"; // Change this version when deploying major updates

// IMPORTANT: Place this script at the very top to immediately block Firebase
// This script will run immediately before any other JavaScript
if (typeof window !== 'undefined') {
  console.log("%c⚠️ INITIALIZING PASSPORT.JS AUTHENTICATION", 
    "background: #004085; color: white; padding: 10px; font-size: 16px; font-weight: bold; border-radius: 3px;");
    
  // Add blocking variables to window object immediately
  window.__FIREBASE_PERMANENTLY_DISABLED__ = true;
  window.__USING_PASSPORT_OAUTH__ = true;
}

// Force immediate loading of the Firebase disabler
import "@/lib/firebase";

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import i18n (internationalization)
import "./i18n";

// Clean localStorage cache if version changed
const lastVersion = localStorage.getItem('app_version');
if (lastVersion !== APP_VERSION) {
  // Clear all cached data
  try {
    console.log(`Version change detected: ${lastVersion || 'none'} → ${APP_VERSION}`);
    
    // Aggressively clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Set minimal required values
    localStorage.setItem('app_version', APP_VERSION);
    
    // If previous version existed, force reload with cache busting
    if (lastVersion) {
      console.log("Performing hard reload to clear cache...");
      
      // Add extreme cache-busting parameters
      const url = new URL(window.location.href);
      url.searchParams.set('v', APP_VERSION);
      url.searchParams.set('t', Date.now().toString());
      url.searchParams.set('nocache', 'true');
      
      // Force reload
      window.location.href = url.toString();
    }
  } catch (e) {
    console.warn("Cache clearing failed:", e);
  }
}

// No need to load Google Maps here anymore,
// it's now handled by the Map component itself
// for better initialization control and error handling

// Render the app
createRoot(document.getElementById("root")!).render(<App />);
