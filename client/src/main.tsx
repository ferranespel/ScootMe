import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Define a custom interface for the window object
declare global {
  interface Window {
    google: any;
  }
}

/**
 * Load the Google Maps API script dynamically
 */
function loadGoogleMapsScript() {
  // Get the API key from environment variables
  const apiKey = import.meta.env.GOOGLE_MAPS_API_KEY || "AIzaSyBCZRjiJ5OcOqlAfySG56ExYIcJ-9DLo4E";
  
  // Create the script element
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
  script.async = true;
  script.defer = true;
  
  // Add error handling
  script.onerror = () => {
    console.error("Failed to load Google Maps API script");
  };
  
  // Append to the document head
  document.head.appendChild(script);
  console.log("Google Maps script loaded dynamically");
}

// Load the Google Maps script
loadGoogleMapsScript();

// Render the app
createRoot(document.getElementById("root")!).render(<App />);
