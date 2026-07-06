import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Editorial serif — a few weight cuts used across the hero.
import "@fontsource/fraunces/400.css";
import "@fontsource/fraunces/500.css";
import "@fontsource/fraunces/600.css";

import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
