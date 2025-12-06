// src/router/index.jsx
import React, { useEffect, useState, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Spin, Result, Button } from "antd";

import MainLayout from "../layouts/MainLayout";
import { getMenuTree } from "../api/menu";
import { generateRoutes } from "../utils/routeHelper";
import LoginPage from "../pages/auth/Login";

// 懒加载两个「个人信息 / 系统设置」页面（先按这个路径建两个空页面文件）
const ProfilePage = React.lazy(() => import("../pages/system/Profile"));
const SettingsPage = React.lazy(() => import("../pages/system/Settings"));
const EditorPage = React.lazy(() => import("../pages/file/EditorPage"));
const LocalEditorPage = React.lazy(() => import("../pages/onlyoffice/LocalEditorPage."));
/**
 * 简单登录守卫：判断 sessionStorage 里有没有 access_token
 */
function RequireAuth({ children }) {
  const token = sessionStorage.getItem("access_token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export const AppRouter = () => {
  const [menuTree, setMenuTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMenuTree()
      .then((data) => {
        setMenuTree(data || []);
      })
      .catch((err) => {
        console.error("加载菜单失败:", err);
        setError("无法连接到后台服务，请确保 Flask 已启动。");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" tip="系统初始化中..." />
      </div>
    );
  }

  if (error) {
    return (
      <Result
        status="500"
        title="连接失败"
        subTitle={error}
        extra={
          <Button type="primary" onClick={() => window.location.reload()}>
            重试
          </Button>
        }
      />
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* 登录页：不走主布局 */}
        <Route path="/login" element={<LoginPage />} />

        {/* 需要登录的区域：主布局 + 所有业务路由 */}
        <Route
          path="/"
          element={
            <RequireAuth>
              {/* 在这里包一层 Suspense，内部所有懒加载页面都能用这个 Spin 作为兜底 */}
              <Suspense
                fallback={
                  <div
                    style={{
                      display: "flex",
                      height: "100vh",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Spin size="large" tip="页面加载中..." />
                  </div>
                }
              >
                <MainLayout menuTree={menuTree} />
              </Suspense>
            </RequireAuth>
          }
        >
          {/* 默认跳转到 /dashboard（也可以改成 menuTree[0].path） */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* 根据菜单动态生成的业务路由（必须都是 <Route /> 元素） */}
          {generateRoutes(menuTree)}

          {/* 顶部头像下拉菜单跳转的两个页面：相对路径，最终 URL 是 /system/profile /system/settings */}
          <Route path="system/profile" element={<ProfilePage />} />
          <Route path="system/settings" element={<SettingsPage />} />
          <Route path="/kb/editor" element={<EditorPage />} />
          <Route path="/onlyoffice_local/editor" element={<LocalEditorPage />} />

          {/* 兜底 404 */}
          <Route
            path="*"
            element={
              <Result
                status="404"
                title="404"
                subTitle="页面未找到"
                extra={
                  <Button
                    type="primary"
                    onClick={() => (window.location.href = "/")}
                  >
                    返回首页
                  </Button>
                }
              />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
