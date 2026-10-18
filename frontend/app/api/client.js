import axios from "axios";

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
});

client.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

client.interceptors.response.use(
  (response) => {
    if (typeof window !== "undefined") {
      const token = response.data?.token;

      if (token) {
        localStorage.setItem("token", token);
      }
    }

    return response;
  },
  (error) => {
    if (
      typeof window !== "undefined" &&
      error.response?.status === 401 &&
      localStorage.getItem("token")
    ) {
      localStorage.removeItem("token");
      window.location.assign("/login");
    }

    return Promise.reject(error);
  }
);

export default client;
