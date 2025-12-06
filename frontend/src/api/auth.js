// src/api/auth.js
import request from "../utils/request";

export function login(data) {
  // { username, password }
  return request.post("/auth/login", data);
}

export function fetchCurrentUser() {
  return request.get("/auth/me");
}

export function logout() {
  return request.post("/auth/logout");
}
