import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Auth0Provider } from '@auth0/auth0-react';
import ProtectedRoute from './components/ProtectedRoute';
import "./index.css";

// 1. Read the variables from the special 'import.meta.env' object
const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN;
const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const auth0Audience = import.meta.env.VITE_AUTH0_AUDIENCE;

import App from "./components/IDE/IDE.tsx";
import LandingPage from "./components/landingpage.tsx";
import ProblemSelection from "./components/ProblemSelection/index.tsx";
import FileProvider from "../context/filecontext.tsx";

import 'prism-themes/themes/prism-nord.css';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Auth0Provider
        domain={auth0Domain}
        clientId={auth0ClientId}
        authorizationParams={{
          redirect_uri: `${window.location.origin}/problem_selection`,
          audience: auth0Audience,
          scope: "openid profile email"
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