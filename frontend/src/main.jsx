import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App";

import { DataProvider } from "./context/DataContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>

  <DataProvider>

    <Toaster position="top-right" />

    <App />

  </DataProvider>

</StrictMode>
);