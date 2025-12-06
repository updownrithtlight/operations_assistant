// src/pages/system/Settings.jsx
import React from "react";
import { Card, Form, Switch } from "antd";

export default function Settings() {
  return (
    <Card title="系统设置">
      <Form labelCol={{ span: 4 }} wrapperCol={{ span: 8 }}>
        <Form.Item label="暗色主题" name="darkTheme" valuePropName="checked">
          <Switch
            onChange={(checked) =>
              localStorage.setItem("prefers_dark_theme", checked ? "1" : "0")
            }
          />
        </Form.Item>
        {/* 后面可以继续加更多设置项 */}
      </Form>
    </Card>
  );
}
