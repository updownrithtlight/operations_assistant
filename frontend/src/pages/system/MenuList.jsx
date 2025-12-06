// src/pages/system/MenuList.jsx
import React, { useEffect, useState } from 'react';
import { Table, Card } from 'antd';
import { getMenuList } from '../../api/menu';

export default function MenuList() {
  const [data, setData] = useState([]);

  useEffect(() => {
    getMenuList().then((res) => {
      // 按你的接口返回调整
      setData(res.data || res || []);
    });
  }, []);

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '菜单名称', dataIndex: 'name' },
    { title: '路径 (Path)', dataIndex: 'path' },
    { title: '前端组件', dataIndex: 'component' },
    { title: '图标', dataIndex: 'icon' },
  ];

  // ❌ 不要再外面套 <div style={{ flex:1, overflow:'auto'... }}>
  return (
    <Card title="菜单配置" style={{ width: '100%' }}>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        style={{ width: '100%' }}
      />
    </Card>
  );
}
