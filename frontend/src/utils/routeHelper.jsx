// src/utils/routeHelper.js
import React from "react";
import { Route } from "react-router-dom";
import { componentMap, iconMap } from "./mapping";

/**
 * 把后端返回的菜单树转换成 React Router 的 <Route> 列表
 * @param {Array} tree  后端 /api/menus/tree 返回的树
 */
export function generateRoutes(tree = []) {
  const routes = [];

  const walk = (nodes) => {
    (nodes || []).forEach((node) => {
      const { path, component, children, id } = node || {};

      // 布局节点 / 纯目录节点不生成路由，只递归 children
      const Comp = componentMap[component];
      if (Comp) {
        // 子路由：把 '/dashboard' => 'dashboard'
        const routePath = path ? path.replace(/^\//, "") : String(id);

        routes.push(
          <Route
            key={path || id}
            path={routePath}
            element={
              <React.Suspense fallback={<div style={{ padding: 24 }}>页面加载中...</div>}>
                <Comp />
              </React.Suspense>
            }
          />
        );
      }

      if (children && children.length) {
        walk(children);
      }
    });
  };

  walk(tree);
  return routes;
}

/**
 * 把菜单树转换成 antd Menu.items
 * @param {Array} tree
 */
export function buildMenuItems(tree = []) {
  const loop = (nodes) =>
    (nodes || []).map((node) => {
      const { id, name, path, icon, children } = node;
      return {
        key: path || String(id),
        label: name,
        icon: icon && iconMap[icon],
        children: children && children.length ? loop(children) : undefined,
      };
    });

  return loop(tree);
}
