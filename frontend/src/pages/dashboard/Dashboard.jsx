import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';

export default function Dashboard() {
  return (
    <div>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic title="活跃用户" value={112893} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="文件总数" value={93} suffix="/ 100" />
          </Card>
        </Col>
      </Row>
      <div style={{ marginTop: 20 }}>
        <h3>欢迎使用企业级管理系统</h3>
      </div>
    </div>
  );
}