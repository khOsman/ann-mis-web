import { auth } from "../firebase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

async function request(path, { method = "GET", body, authenticated = false } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (authenticated) {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("You must be signed in to perform this action.");
    }

    headers.Authorization = `Bearer ${await user.getIdToken()}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

export const apiClient = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body }),
};
