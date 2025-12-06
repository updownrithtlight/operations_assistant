// src/utils/request.js
import axios from "axios";

export const baseURL = "/api"; // 由 Vite 代理到 Flask

// 用于普通业务请求的实例
const instance = axios.create({
  baseURL,
  timeout: 15000,
  // dev 环境通过 Vite 代理，同域即可，是否 withCredentials 无所谓
  withCredentials: true, // 为了 refresh-token 请求能带 Cookie
});

// 请求拦截：自动加 Access Token
instance.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("access_token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 标记避免死循环
let isRefreshing = false;
let pendingRequests = [];

// 响应拦截：遇到 401 时尝试刷新 Access Token
instance.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config || {};

    const status = error?.response?.status;

    // 不是 401，直接抛出
    if (status !== 401) {
      return Promise.reject(error);
    }

    // 登录接口本身 401，就不再刷新，直接抛
    if (originalRequest.url && originalRequest.url.includes("/auth/login")) {
      return Promise.reject(error);
    }

    // 防止无限重试
    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    // 如果已经在刷新中，把请求挂起，等刷新完成后再重发
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push({ resolve, reject, originalRequest });
      });
    }

    isRefreshing = true;

    try {
      // 用原生 axios 调 refresh-token，避免再次进入这个拦截器
      const refreshResponse = await axios.post(
        `${baseURL}/auth/refresh-token`,
        {},
        { withCredentials: true }
      );

      const accessToken = refreshResponse.data.access_token;
      if (!accessToken) {
        throw new Error("no access_token in refresh response");
      }

      // 保存新的 access_token
      sessionStorage.setItem("access_token", accessToken);

      // 把挂起的请求重新发一遍
      pendingRequests.forEach(({ resolve, originalRequest }) => {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        resolve(instance(originalRequest));
      });
      pendingRequests = [];

      // 当前这个请求也重新发
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return instance(originalRequest);
    } catch (e) {
      // 刷新失败：清 token，跳转登录
      sessionStorage.removeItem("access_token");
      pendingRequests.forEach(({ reject }) => reject(e));
      pendingRequests = [];

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);

export default instance;
