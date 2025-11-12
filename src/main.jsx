import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./style.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error('index.html içinde id="root" olan bir <div> yok!');
}
createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
