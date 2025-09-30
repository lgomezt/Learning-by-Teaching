import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import LandingPage from "./components/landingpage.tsx";
import ProblemSelection from "./components/ProblemSelection/index.tsx";
import FileProvider from "../context/filecontext.tsx";
import Prism from 'prismjs';
// import 'prismjs/themes/prism-okaidia.css';
import 'prism-themes/themes/prism-nord.css';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
      <BrowserRouter>
        <FileProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/problem_selection" element={<ProblemSelection />} />
            <Route path="/ide" element={<App />} />
          </Routes>
        </FileProvider>
      </BrowserRouter>
  </StrictMode>
);