// src/api/kb.js
import request from '../utils/request';

/**
 * 获取知识库目录树（默认用于左侧 Tree，defaultExpandAll）
 */
export const fetchKbFolderTree = async () => {
  const response = await request.get('/kb/folders/tree');
  // 后端已用 ResponseTemplate 包装，这里按你的习惯取 data
  return response;   // { code, message, data }
};

/**
 * 获取某个目录下的文件列表
 * @param {number} folderId 目录 ID
 */
export const fetchKbFilesByFolder = async (folderId) => {
  const response = await request.get('/kb/files', {
    params: { folder_id: folderId },
  });
  return response;
};

/**
 * 搜索文件（文件名 + 标签）
 * @param {Object} params
 * @param {string} [params.q] 文件名关键字
 * @param {string[]} [params.tags] 标签名列表
 */
export const searchKbFiles = async ({ q, tags } = {}) => {
  const response = await request.get('/kb/search', {
    params: {
      q: q || undefined,
      tags: tags && tags.length ? tags.join(',') : undefined,
    },
  });
  return response;
};

/**
 * 获取所有标签（用于前端 Select 多选）
 */
export const fetchKbTags = async () => {
  const response = await request.get('/kb/tags');
  return response;
};

/**
 * 上传知识库文件（带目录 + 标签）
 * @param {FormData} formData
 *   需要包含字段：
 *    - folder_id: 目录ID
 *    - name: 文件名
 *    - file: 文件（二进制）
 *    - tags: 逗号分隔的标签字符串，例如 "施工,招标"
 */
export const uploadKbFile = async (formData) => {
  const response = await request.post('/kb/files/upload', formData);
  return response;
};

/**
 * 更新某个文件的标签
 * @param {number} fileId 文件ID
 * @param {string[]} tags 标签名数组
 */
export const updateKbFileTags = async (fileId, tags) => {
  const response = await request.post(`/kb/files/${fileId}/tags`, {
    tags: tags || [],
  });
  return response;
};


/**
 * 新建知识库目录
 * @param {Object} payload
 * @param {string} payload.name  目录名称
 * @param {number|null} [payload.parent_id] 父目录ID，根目录传 null 或不传
 * @param {number} [payload.sort_order] 排序值
 */
export const createKbFolder = async (payload) => {
  const response = await request.post('/kb/folders', payload);
  return response; // { code, message, data }
};


/**
 * 删除知识库文件
 * @param {number} fileId 文件ID
 * 后端建议：DELETE /kb/files/{fileId}
 */
export const deleteKbFile = async (fileId) => {
  const response = await request.delete(`/kb/files/${fileId}`);
  return response; // { code, message, data }
};

/**
 * 下载知识库文件
 * 一般有两种用法：
 *  1）前端直接 window.open(`/kb/files/${id}/download`)
 *  2）走 axios 拿 blob，自行生成下载链接
 *
 * 这里实现第 2 种，你在页面里这样用：
 *   const res = await downloadKbFile(id);
 *   const blob = res;
 *   // 然后自己生成 a 标签下载
 */
export const downloadKbFile = async (fileId) => {
  const response = await request.get(`/kb/files/${fileId}/download`, {
    responseType: 'blob',
  });
  return response; // axios 原始 response，包含 data(Blob)、headers 等
};


// api/kb.js
export const deleteKbFolder = async (folderId) => {
  // 假设有删除目录的API接口
  return await request.delete(`/kb/folders/${folderId}`);
};


export const renameKbFolder = async (folderId, newName) => {

const response = await request.post(`/kb/folders/${folderId}/rename`, { folderId, newName });
 return response; // { code, message, data }

};


// 获取 OnlyOffice 在线编辑 URL
export const getKbOnlyOfficeUrl = (fileId) =>
  request.get(`/kb/files/${fileId}/onlyoffice-url`);

