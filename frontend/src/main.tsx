import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import LandingPage from "./components/landingpage.tsx";
import FileProvider from "../context/filecontext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
      <BrowserRouter>
        <FileProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/ide" element={<App />} />
          </Routes>
        </FileProvider>
      </BrowserRouter>
  </StrictMode>
);