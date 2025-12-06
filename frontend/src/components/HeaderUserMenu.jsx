// 一个独立的小组件，也可以直接写在 Header 里
import React from "react";
import { Dropdown, Avatar, Space } from "antd";
import { UserOutlined, SettingOutlined, LogoutOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const HeaderUserMenu = () => {
  const navigate = useNavigate();
  const username = sessionStorage.getItem("username") || "Admin";

  const items = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "个人中心",
      onClick: () => navigate("/system/profile"),
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "系统设置",
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
        sessionStorage.removeItem("username");
        navigate("/login", { replace: true });
      },
    },
  ];

  return (
    <Dropdown
      menu={{ items }}
      trigger={["click", "hover"]}
      placement="bottomRight"
    >
      {/* ⭐⭐ 注意：这里只能有 “一个” 子元素 ⭐⭐ */}
      <span
        style={{
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Avatar size="small" style={{ backgroundColor: "#1677ff" }}>
          {username[0].toUpperCase()}
        </Avatar>
        <span>{username}</span>
      </span>
    </Dropdown>
  );
};

export default HeaderUserMenu;
