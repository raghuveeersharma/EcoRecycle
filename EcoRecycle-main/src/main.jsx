import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import LoginStateProvider from "./Context/LoginState.jsx";

createRoot(document.getElementById("root")).render(
  <LoginStateProvider>
    <App />
  </LoginStateProvider>
);
