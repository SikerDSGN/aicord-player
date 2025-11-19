import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

// Register service worker for PWA
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("Nová verze aplikace je k dispozici. Aktualizovat?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log("Aplikace je připravena pro offline režim");
  },
});

createRoot(document.getElementById("root")!).render(<App />);
