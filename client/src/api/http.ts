import axios from "axios";

export const http = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL as string) ?? "http://localhost:3001",
  withCredentials: true // send cookies; CORS must allow credentials + exact origin
});

// If you standardize on bearer tokens instead of cookies, uncomment:
/*
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
*/
