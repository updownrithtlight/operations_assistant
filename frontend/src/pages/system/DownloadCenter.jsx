// src/pages/system/DownloadCenter.jsx
import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Descriptions,
  message,
  Progress,
  Space,
  Table,
  Tag,
  Select,
} from "antd";
import { DownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import { createYoutubeTask, getYoutubeTask, getDownloadUrl } from "../../api/downloadCenter";

const { Title, Text } = Typography;
const { Option } = Select;

const STORAGE_KEY = "youtube_tasks";

function loadTasksFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch (e) {
    console.error("loadTasksFromStorage error:", e);
    return [];
  }
}

function saveTasksToStorage(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error("saveTasksToStorage error:", e);
  }
}

export default function DownloadCenter() {
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);
  const [result, setResult] = useState(null);

  // 当前正在轮询的任务定时器
  const [timer, setTimer] = useState(null);

  // 所有历史任务（本地持久化）
  const [historyTasks, setHistoryTasks] = useState([]);

  useEffect(() => {
    // 初始化时从 localStorage 读历史任务
    const saved = loadTasksFromStorage();
    setHistoryTasks(saved);
  }, []);

  useEffect(() => {
    // 组件卸载时清理轮询
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [timer]);

  // 把某个任务更新到 history + localStorage
  const updateHistoryTask = (id, patch) => {
    setHistoryTasks((prev) => {
      const idx = prev.findIndex((t) => t.taskId === id);
      let next;
      if (idx === -1) {
        // 不应该出现，但兜底
        next = [...prev, { taskId: id, ...patch }];
      } else {
        next = [...prev];
        next[idx] = { ...next[idx], ...patch };
      }
      saveTasksToStorage(next);
      return next;
    });
  };

  const addHistoryTask = ({ taskId, url, quality }) => {
    const newTask = {
      taskId,
      url,
      quality,
      videoId: null, // video_id 单独存
      status: "pending",
      progress: 0,
      title: "",
      filepath: "",
      audio_path: "",
      filesize: null,
      duration: null,
      createdAt: new Date().toISOString(),
    };
    setHistoryTasks((prev) => {
      const next = [newTask, ...prev]; // 新任务放最上面
      saveTasksToStorage(next);
      return next;
    });
  };

  const onFinish = async (values) => {
    const { url, quality } = values;
    if (!url) return;

    try {
      setLoading(true);
      setResult(null);
      setTaskStatus(null);
      setTaskId(null);

      const resp = await createYoutubeTask({ url, quality });
      if (!resp.success) {
        message.error("创建下载任务失败：" + (resp.error || "未知错误"));
        return;
      }

      const id = resp.task_id;
      setTaskId(id);
      setTaskStatus({ status: "pending", progress: 0 });
      message.success("任务已创建，开始下载…");

      // 记录到历史任务
      addHistoryTask({ taskId: id, url, quality });

      // 开始轮询当前这个任务的状态
      const t = setInterval(async () => {
        try {
          const data = await getYoutubeTask(id);

          // 后端约定：success=false 且 status=error 表示任务失败
          if (!data.success && data.status === "error") {
            clearInterval(t);
            setTimer(null);
            setTaskStatus({ status: "error", progress: 0 });
            updateHistoryTask(id, {
              status: "error",
              progress: 0,
              error: data.error,
            });
            message.error("下载失败：" + (data.error || "未知错误"));
            return;
          }

          if (data.status === "pending" || data.status === "running") {
            const prog = data.progress ?? 0;
            setTaskStatus({
              status: data.status,
              progress: prog,
            });
            updateHistoryTask(id, {
              status: data.status,
              progress: prog,
            });
          } else if (data.status === "finished") {
            clearInterval(t);
            setTimer(null);
            setTaskStatus({
              status: "finished",
              progress: 100,
            });
            setResult(data);
            updateHistoryTask(id, {
              status: "finished",
              progress: 100,
              title: data.title,
              filepath: data.filepath,
              audio_path: data.audio_path,
              filesize: data.filesize,
              duration: data.duration,
              videoId: data.video_id, // 关键：把后端返回的 video_id 存下来
              duration: data.duration,
              thumbnail: data.thumbnail,
              audio_size: data.audio_size,
            });
            message.success("下载完成：" + (data.title || "")); 
          }
        } catch (e) {
          clearInterval(t);
          setTimer(null);
          setTaskStatus({ status: "error", progress: 0 });
          updateHistoryTask(id, {
            status: "error",
            progress: 0,
            error: e.message,
          });
          message.error("查询任务异常：" + e.message);
        }
      }, 3000); // 每 3 秒查一次

      setTimer(t);
    } catch (e) {
      console.error(e);
      message.error("创建任务异常：" + e.message);
    } finally {
      setLoading(false);
    }
  };

  // 单独刷新历史任务某一条的状态（比如页面刷新后用）
  const handleRefreshTask = async (record) => {
    const id = record.taskId;
    try {
      const data = await getYoutubeTask(id);

      if (!data.success && data.status === "error") {
        updateHistoryTask(id, {
          status: "error",
          progress: 0,
          error: data.error,
        });
        message.error("下载失败：" + (data.error || "未知错误"));
        return;
      }

      if (data.status === "pending" || data.status === "running") {
        updateHistoryTask(id, {
          status: data.status,
          progress: data.progress ?? 0,
        });
      } else if (data.status === "finished") {
        updateHistoryTask(id, {
          status: "finished",
          progress: 100,
          title: data.title,
          filepath: data.filepath,
          audio_path: data.audio_path,
          filesize: data.filesize,
          duration: data.duration,
          videoId: data.video_id,
        });
        message.success("任务已完成：" + (data.title || "")); 
      }
    } catch (e) {
      message.error("查询任务异常：" + e.message);
    }
  };

  // 当前任务的视频 id（优先用 result 里的）
  const currentVideoId =
    result?.video_id ||
    historyTasks.find((t) => t.taskId === taskId)?.videoId ||
    null;

  // 当前任务的下载地址：只用 video_id
  const videoDownloadUrl = currentVideoId
    ? getDownloadUrl(currentVideoId, "video")
    : null;

  const audioDownloadUrl =
    currentVideoId && result?.audio_path
      ? getDownloadUrl(currentVideoId, "audio")
      : null;

  // 历史任务列表的列定义
  const columns = [
    {
      title: "任务ID",
      dataIndex: "taskId",
      width: 220,
      render: (v) => <Text code>{v}</Text>,
    },
    {
      title: "Video ID",
      dataIndex: "videoId",
      width: 160,
      render: (v) =>
        v ? <Text code>{v}</Text> : <Text type="secondary">-</Text>,
    },
    {
      title: "来源链接",
      dataIndex: "url",
      ellipsis: true,
    },
    {
      title: "清晰度",
      dataIndex: "quality",
      width: 80,
    },
        {
      title: "封面",
      dataIndex: "thumbnail",
      width: 120,
      render: (thumb, record) => {
        if (!thumb) {
          return <Text type="secondary">-</Text>;
        }
        return (
          <a href={thumb} target="_blank" rel="noreferrer">
            <img
              src={thumb}
              alt={record.title || "thumbnail"}
              style={{
                width: 80,
                height: 45,
                objectFit: "cover",
                borderRadius: 4,
              }}
            />
          </a>
        );
      },
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (status) => {
        let color = "default";
        if (status === "finished") color = "green";
        else if (status === "running") color = "blue";
        else if (status === "pending") color = "orange";
        else if (status === "error") color = "red";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "进度",
      dataIndex: "progress",
      width: 100,
      render: (p) => (p != null ? `${p}%` : "-"),
    },
    {
      title: "操作",
      key: "action",
      width: 280,
      render: (_, record) => {
        const finished = record.status === "finished";
        const hasVideoId = !!record.videoId;

        const vidUrl =
          finished && hasVideoId ? getDownloadUrl(record.videoId, "video") : null;

        const audUrl =
          finished && hasVideoId && record.audio_path
            ? getDownloadUrl(record.videoId, "audio")
            : null;

        return (
          <Space>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => handleRefreshTask(record)}
            >
              刷新状态
            </Button>
            <Button
              size="small"
              type="primary"
              href={vidUrl || undefined}
              target="_blank"
              disabled={!vidUrl}
            >
              下载视频
            </Button>
            <Button
              size="small"
              href={audUrl || undefined}
              target="_blank"
              disabled={!audUrl}
            >
              下载音频
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="large">
      <Card>
        <Title level={4} style={{ marginBottom: 24 }}>
          YouTube 视频下载（异步任务）
        </Title>

        <Form
          layout="inline"
          onFinish={onFinish}
          initialValues={{ quality: "720p" }}
        >
          <Form.Item
            name="url"
            label="视频链接"
            style={{ flex: 1 }}
            rules={[{ required: true, message: "请输入 YouTube 视频链接" }]}
          >
            <Input
              placeholder="https://www.youtube.com/watch?v=xxxx"
              allowClear
            />
          </Form.Item>

          <Form.Item name="quality" label="清晰度">
            <Select style={{ width: 120 }}>
              <Option value="360p">360p</Option>
              <Option value="480p">480p</Option>
              <Option value="720p">720p</Option>
              <Option value="1080p">1080p</Option>
              <Option value="2160p">4K</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<DownloadOutlined />}
              loading={loading}
            >
              开始下载
            </Button>
          </Form.Item>
        </Form>

        {taskStatus && (
          <Card size="small" style={{ marginTop: 24 }} title="当前任务状态">
            <p>
              当前任务 ID：<Text code>{taskId}</Text>
            </p>
            <p>
              当前 Video ID： <Text code>{currentVideoId || "-"}</Text>
            </p>
            <p>状态：{taskStatus.status}</p>
            <Progress percent={taskStatus.progress} />
            {result && (
              <Space style={{ marginTop: 16 }}>
                <Button
                  type="primary"
                  href={videoDownloadUrl || undefined}
                  target="_blank"
                  disabled={!videoDownloadUrl}
                >
                  下载视频
                </Button>
                {result.audio_path && (
                  <Button
                    href={audioDownloadUrl || undefined}
                    target="_blank"
                    disabled={!audioDownloadUrl}
                  >
                    下载音频
                  </Button>
                )}
              </Space>
            )}
          </Card>
        )}

        {result && (
          <Card size="small" style={{ marginTop: 24 }} title="本次下载结果">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Video ID">
                {result.video_id}
              </Descriptions.Item>
              <Descriptions.Item label="标题">
                {result.title}
              </Descriptions.Item>
              <Descriptions.Item label="视频文件路径（后端本地）">
                <Text code>{result.filepath}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="音频文件路径（后端本地）">
                <Text code>{result.audio_path || "-"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="时长（秒）">
                {result.duration ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="文件大小（字节）">
                {result.filesize ?? "-"}
              </Descriptions.Item>
              {result.thumbnail && (
                <Descriptions.Item label="封面">
                  <img
                    src={result.thumbnail}
                    alt="thumbnail"
                    style={{ maxWidth: 220, borderRadius: 4 }}
                  />
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        )}
      </Card>

      <Card title="下载任务历史">
        <Table
          rowKey="taskId"
          columns={columns}
          dataSource={historyTasks}
          size="small"
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </Space>
  );
}
