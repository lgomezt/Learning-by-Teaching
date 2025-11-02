import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Auth0Provider } from '@auth0/auth0-react';
import ProtectedRoute from './components/ProtectedRoute';
import "./index.css";

import App from "./App.tsx";
import LandingPage from "./components/landingpage.tsx";
import ProblemSelection from "./components/ProblemSelection/index.tsx";
import FileProvider from "../context/filecontext.tsx";

import 'prism-themes/themes/prism-nord.css';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Auth0Provider
        domain="dev-fkayw3cti8dktcjt.us.auth0.com" 
        clientId="9xyEgfcl5B8DFTUvMZYeUPSh7O4nzlmB" 
        authorizationParams={{
          redirect_uri: `${window.location.origin}/problem_selection`
        }}
    >
      <BrowserRouter>
        <FileProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route element = {<ProtectedRoute />}>
                <Route path="/problem_selection" element={<ProblemSelection />} />
                <Route path="/ide" element={<App />} />
            </Route>
          </Routes>
        </FileProvider>
      </BrowserRouter>
    </Auth0Provider>
  </StrictMode>
);