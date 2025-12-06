// src/pages/system/Profile.jsx
import React, { useMemo } from "react";
import { Card, Descriptions } from "antd";

export default function Profile() {
  const user = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("user_info");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  return (
    <Card title="个人信息">
      <Descriptions column={1}>
        <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
        <Descriptions.Item label="姓名">{user.user_fullname}</Descriptions.Item>
        <Descriptions.Item label="邮箱">{user.email}</Descriptions.Item>
        <Descriptions.Item label="用户ID">{user.id}</Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
