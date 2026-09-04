import axios from "axios";

export const TOKEN_KEY = "ecorecycle.token";
export const USER_KEY = "ecorecycle.user";

// Falls back to the deployed API so an unconfigured build still works.
const baseURL =
  import.meta.env.VITE_API_URL || "https://ecorecycle-ll8y.onrender.com/api";

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A rejected token means the stored session is dead — drop it and let the
    // auth provider react, rather than leaving the UI in a fake signed-in state.
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new Event("ecorecycle:unauthorized"));
    }
    return Promise.reject(error);
  }
);

/** Pulls the most useful message out of an axios error. */
export const getErrorMessage = (error, fallback = "Something went wrong") => {
  if (error?.code === "ECONNABORTED") {
    return "The server took too long to respond. Please try again.";
  }
  if (error?.code === "ERR_NETWORK") {
    return "Could not reach the server. Check your connection and try again.";
  }
  return error?.response?.data?.message || error?.message || fallback;
};

/** Field-level validation errors returned by the API, if any. */
export const getFieldErrors = (error) => error?.response?.data?.errors || null;

export default api;
