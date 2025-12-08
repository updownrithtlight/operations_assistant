// src/utils/mapping.js
import React from "react";
import {
  DashboardOutlined,
  UserOutlined,
  FileOutlined,
  SettingOutlined,
  LaptopOutlined,
} from "@ant-design/icons";

// -------- 懒加载页面组件 --------
// 注意：这些路径要和真实文件路径、以及数据库 menu 表里的 component 一一对应
const Dashboard = React.lazy(() => import("../pages/dashboard/Dashboard"));
const UserList = React.lazy(() => import("../pages/system/UserList"));
const MenuList = React.lazy(() => import("../pages/system/MenuList"));
const FileList = React.lazy(() => import("../pages/file/FileList"));
const TiptapDemoPage = React.lazy(() => import("../pages/demo/TiptapDemoPage"));


// 1. 图标映射：数据库里的 icon 字段用这些字符串
export const iconMap = {
  DashboardOutlined: <DashboardOutlined />,
  UserOutlined: <UserOutlined />,
  FileOutlined: <FileOutlined />,
  SettingOutlined: <SettingOutlined />,
  LaptopOutlined: <LaptopOutlined />,
};

// 2. 组件映射：数据库 menu.component 对应这些 key
export const componentMap = {
  "pages/Dashboard": Dashboard,
  "pages/system/UserList": UserList,
  "pages/system/MenuList": MenuList,
  "pages/file/FileList": FileList,
  "pages/demo/TiptapDemoPage": TiptapDemoPage,
  Layout: null, // 纯分组节点
};

// 3. 小工具：安全取图标 & 组件（可选）
export function getIcon(iconName) {
  return iconName && iconMap[iconName] ? iconMap[iconName] : null;
}

export function getComponent(componentName) {
  return componentName && componentMap[componentName]
    ? componentMap[componentName]
    : null;
}
