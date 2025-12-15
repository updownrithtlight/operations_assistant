import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  message,
  Typography,
} from 'antd';
import { callAlibabaApi } from '../../api/alibaba';

const { TextArea } = Input;
const { Title, Text } = Typography;

const HTTP_METHODS = ['GET', 'POST'];

export default function AlibabaApiPlayground() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const handleSubmit = async (values) => {
    let paramsObj = {};
    if (values.paramsJson && values.paramsJson.trim()) {
      try {
        paramsObj = JSON.parse(values.paramsJson);
      } catch (e) {
        message.error('参数 JSON 解析失败：' + e.message);
        return;
      }
    }

    const payload = {
      api_name: values.apiName,
      http_method: values.httpMethod,
      seller_id: values.sellerId || undefined,
      access_token: values.accessToken || undefined,
      params: paramsObj,
    };

    setLoading(true);
    try {
      const res = await callAlibabaApi(payload);
      // 你的 request 一般直接返回 data，这里直接展示
      setResponse(res);
    } catch (err) {
      console.error(err);
      message.error('调用失败，请检查控制台日志');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={4} style={{ marginBottom: 16 }}>
          Alibaba OpenAPI 调试台
        </Title>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            httpMethod: 'POST',
          }}
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="API 名称"
                name="apiName"
                rules={[
                  { required: true, message: '请输入 API 名称，如：alibaba.icbu.photobank.list' },
                ]}
              >
                <Input placeholder="例如：alibaba.icbu.photobank.list" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="HTTP Method" name="httpMethod">
                <Select>
                  {HTTP_METHODS.map((m) => (
                    <Select.Option key={m} value={m}>
                      {m}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Seller ID（可选，如果不填就用 access_token）"
                name="sellerId"
              >
                <Input placeholder="2210xxxxxx（你自己的 seller_id）" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Access Token（可选，调试用，一般可以留空）"
                name="accessToken"
              >
                <Input.Password placeholder="不填则使用 seller_id 自动获取 token" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={
              <span>
                参数 JSON（请求 body，对象格式）
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  类似 Postman 的 raw JSON
                </Text>
              </span>
            }
            name="paramsJson"
          >
            <TextArea
              rows={8}
              placeholder={`示例：查询图片银行列表\n{\n  "location_type": "ALL_GROUP",\n  "page_size": 12,\n  "current_page": 1\n}`}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              发送请求
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card
        title="返回结果"
        size="small"
        style={{ marginTop: 16 }}
        bodyStyle={{ padding: 12 }}
      >
        <pre
          style={{
            maxHeight: 400,
            overflow: 'auto',
            background: '#111',
            color: '#0f0',
            padding: 12,
            borderRadius: 4,
            fontSize: 12,
          }}
        >
          {response ? JSON.stringify(response, null, 2) : '尚未请求'}
        </pre>
      </Card>
    </div>
  );
}
