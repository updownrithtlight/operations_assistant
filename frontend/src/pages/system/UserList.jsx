import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Tag, Space, Modal, message } from 'antd';
import { getUserList, deleteUser } from '../../api/user';

export default function UserList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const users = await getUserList();
      setData(users);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除?',
      onOk: async () => {
        await deleteUser(id);
        message.success('删除成功');
        fetchData();
      }
    });
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '用户名', dataIndex: 'username' },
    { title: '全名', dataIndex: 'user_fullname' },
    { title: '邮箱', dataIndex: 'email' },
    { 
      title: '状态', 
      dataIndex: 'status',
      render: (status) => <Tag color={status === 'active' ? 'green' : 'red'}>{status}</Tag> 
    },
    {
      title: '操作',
      render: (_, record) => (
        <Space>
          <Button type="link">编辑</Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    
    <Card title="用户列表" extra={<Button type="primary">新建用户</Button>}>
      <Table 
        rowKey="id" 
        columns={columns} 
        dataSource={data} 
        loading={loading}
      />
    </Card>
  );
}