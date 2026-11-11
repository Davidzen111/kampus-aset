import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/base.css";
import "./styles/admin.css";
import "./styles/auth.css";
import "./styles/user.css";
import "./styles/admin-theme.css";
createRoot(document.getElementById("root")).render(
  <BrowserRouter><App /></BrowserRouter>
);