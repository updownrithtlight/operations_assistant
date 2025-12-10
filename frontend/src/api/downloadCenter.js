// src/api/youtube.js
import request from '../utils/request';

/**
 * 创建 YouTube 下载任务
 * POST /youtube/tasks
 */
export const createYoutubeTask = (data) => {
  // 这里用默认超时就行了，任务很快创建完
  return request.post('/youtube/tasks', data);
};

/**
 * 获取任务状态
 * GET /youtube/tasks/:taskId
 */
export const getYoutubeTask = (taskId) => {
  return request.get(`/youtube/tasks/${taskId}`);
};

/**
 * 构造下载链接（用于 <a href> 或 Button href）
 * 实际请求路径是后端的 /youtube/download?id=xxx&type=video|audio
 * axios 的 baseURL 通常是 /api，这里直接拼 /api 前缀，避免跨域问题
 */
export const getDownloadUrl = (videoId, type = 'video') => {
  return `/api/youtube/download?id=${encodeURIComponent(videoId)}&type=${type}`;
};
