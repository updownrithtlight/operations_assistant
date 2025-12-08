// src/components/richtext/LinkModal.jsx
import React, { useEffect } from 'react';
import { Modal, Form, Input, Select } from 'antd';

const { Option } = Select;

/**
 * 插入 / 编辑链接的弹窗
 *
 * props:
 *  - open: boolean
 *  - initialValues: { url, text, title, target }
 *  - onCancel: () => void
 *  - onConfirm: (values) => void
 */
const LinkModal = ({ open, initialValues, onCancel, onConfirm }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        initialValues || {
          url: '',
          text: '',
          title: '',
          target: 'current',
        },
      );
    }
  }, [open, initialValues, form]);

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        onConfirm?.(values);
      })
      .catch(() => {});
  };

  return (
    <Modal
      title="Insert/Edit Link"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="Save"
      cancelText="Cancel"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="URL"
          name="url"
          // 不强制 required，留给上层决定“空 = 取消链接”
          rules={[
            {
              type: 'url',
              warningOnly: true,
              message: '建议输入合法的 URL，例如 https://example.com',
            },
          ]}
        >
          <Input placeholder="https://example.com" />
        </Form.Item>

        <Form.Item label="Text to display" name="text">
          <Input placeholder="显示的文字（留空则使用当前选中文本或 URL）" />
        </Form.Item>

        <Form.Item label="Title" name="title">
          <Input placeholder="鼠标悬停时的提示文本（可选）" />
        </Form.Item>

        <Form.Item label="Open link in..." name="target" initialValue="current">
          <Select>
            <Option value="current">Current window</Option>
            <Option value="new">New window</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default LinkModal;
