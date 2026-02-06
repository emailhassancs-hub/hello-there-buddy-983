import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Hide ONLY console.log in production (keep warn/error visible)
if (
  import.meta.env.MODE === "production" ||
  String(import.meta.env.VITE_APP_ENV).toLowerCase() === "production"
) {
  // eslint-disable-next-line no-console
  console.log = () => {};
}

createRoot(document.getElementById("root")!).render(<App />);
