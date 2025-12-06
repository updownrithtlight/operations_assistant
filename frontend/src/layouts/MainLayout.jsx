// src/layouts/MainLayout.jsx
import React, { useState, useMemo } from "react";
import { Layout, Menu, Dropdown, Avatar, Breadcrumb, theme, Switch } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import { iconMap } from "../utils/mapping";
import HeaderUserMenu from "../components/HeaderUserMenu";
const { Header, Sider, Content } = Layout;

export default function MainLayout({ menuTree = [] }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // ⭐ 从 sessionStorage 读取当前登录用户
  const currentUser = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("user_info");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  const displayName = currentUser.user_fullname || currentUser.username || "未登录";

  // ⭐ 用户下拉菜单
  const userMenu = (
    <Menu
      items={[
        {
          key: "profile",
          icon: <UserOutlined />,
          label: "个人信息",
          onClick: () => navigate("/system/profile"),
        },
        {
          key: "settings",
          icon: <SettingOutlined />,
          label: "设置",
          onClick: () => navigate("/system/settings"),
        },
        {
          type: "divider",
        },
        {
          key: "logout",
          icon: <LogoutOutlined />,
          label: "退出登录",
          onClick: () => {
            sessionStorage.removeItem("access_token");
            sessionStorage.removeItem("user_info");
            navigate("/login");
          },
        },
      ]}
    />
  );

  // ⭐ 左侧菜单数据
  const formatMenuItems = (data = []) =>
    data.map((item) => ({
      key: item.path,
      icon: iconMap[item.icon] || null,
      label: item.name,
      children:
        item.children && item.children.length > 0
          ? formatMenuItems(item.children)
          : undefined,
    }));

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* 左侧菜单 */}
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div
          style={{
            height: 32,
            margin: 16,
            background: "rgba(255,255,255,0.2)",
            color: "#fff",
            textAlign: "center",
            lineHeight: "32px",
            fontWeight: 600,
          }}
        >
          copilot
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={formatMenuItems(menuTree)}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      {/* 右侧 */}
      <Layout
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          width: "100%",
        }}
      >
        {/* 顶部 Header */}
        <Header
          style={{
            background: colorBgContainer,
            padding: "0 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* 左侧可以放面包屑 / 当前模块标题等 */}
          <div style={{ fontSize: 16, fontWeight: 500 }}>内部管理系统</div>

          {/* 右侧：主题切换 + 用户信息 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            {/* 简单的主题切换按钮（后面可以配合 ConfigProvider 真正切换） */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <BulbOutlined />
              <span style={{ fontSize: 13 }}>暗色</span>
              <Switch
                size="small"
                onChange={(checked) => {
                  // 这里只做标记，你可以后面用 ConfigProvider 来真正切换主题
                  localStorage.setItem("prefers_dark_theme", checked ? "1" : "0");
                }}
              />
            </div>

  <HeaderUserMenu />
          </div>
        </Header>

        {/* 内容区 */}
        <Content
          style={{
            margin: 10,
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Breadcrumb
            items={[{ title: "首页" }]}
            style={{ marginBottom: 10 }}
          />

          <div
            style={{
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              padding: 24,
              flex: 1,
              overflow: "auto",
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
