// src/pages/auth/Login.jsx
import React, { useState } from "react";
import { Button, Card, Form, Input, message } from "antd";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/auth";

const layoutStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f0f2f5",
};

const cardStyle = {
  width: 360,
};

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      const resp = await login(values);
      // resp: { access_token, user }
      const accessToken = resp.data.access_token;
      if (!accessToken) {
        throw new Error("登录接口未返回 access_token");
      }
      sessionStorage.setItem("access_token", accessToken);
      if (resp.user) {
        sessionStorage.setItem("user_info", JSON.stringify(resp.user));
      }
      message.success("登录成功");
      navigate("/dashboard", { replace: true });
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.error ||
        e?.message ||
        "登录失败，请检查用户名/密码";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={layoutStyle}>
      <Card title="系统登录" style={cardStyle}>
        <Form layout="vertical" onFinish={handleFinish}>
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input autoComplete="username" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default LoginPage;
