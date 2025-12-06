
import request from '../utils/request';

/** 获取编辑器配置 */
export async function getOnlyOfficeConfig({ fileId, mode = "edit" }) {
  const resp = await request.get("/onlyoffice_local/config", {
    params: { fileId, mode },
  });
  return resp.data;
}

/** 动态加载 api.js */
// src/utils/onlyoffice.js
export function loadOnlyOfficeScript() {

 const base = 'http://192.168.31.145:8080';
  

  const src = `${base}/web-apps/apps/api/documents/api.js`;


  if (window.DocsAPI) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("加载 api.js 失败：" + src));
    document.body.appendChild(s);
  });
}


/** 使用后端签名后的 cfg 创建编辑器 */
export async function createExcelEditor(container, { fileId, mode }) {
  const cfg = await getOnlyOfficeConfig({ fileId, mode });

  // eslint-disable-next-line no-undef
  const editor = new DocsAPI.DocEditor(container.id, cfg);
  return { editor, config: cfg };
}

/** 列出文件 */

/** 删除 */
export async function deleteFile(fileId) {
  await request.delete(`/onlyoffice_local/files/${fileId}`);
}

/** 下载 */
export function downloadFile(fileId) {
  window.open(`/api/onlyoffice_local/files/${fileId}`, "_blank");
}

/** 强制保存 CommandService */
export async function forceSave(key) {
  const resp = await request.post("/onlyoffice_local/force-save", { key });
  return resp.data;
}

/** 查询 DocumentServer 在线状态 */
export async function getOnlineStatus(key) {
  const resp = await request.post("/onlyoffice_local/status", { key });
  return resp.data.data;
}
/**
 * 获取文件列表（支持按名称搜索）
 * @param {string} [query] - 搜索关键字，可选
 * @returns {Promise<Array>} 文件数组
 */
export async function listFiles(query) {
  const url = query
    ? `/onlyoffice_local/list?q=${encodeURIComponent(query)}`
    : "/onlyoffice_local/list";
  const resp = await request.get(url);
  console.log('yyyy',resp)
  if (resp.data.error) throw new Error(resp.data.message);
  return resp.data; // [{id,name,size,mtime,key}, ...]
}

/**
 * 上传文件（自动保存原始文件名）
 * @param {File} file - 文件对象
 * @returns {Promise<{fileId:string,name:string}>}
 */
export async function uploadFile(file) {
  const fd = new FormData();
  fd.append("file", file);

  const resp = await request.post("/onlyoffice_local/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  if (resp.data.error) throw new Error(resp.data.message);
  return resp.data.data; // {fileId, name}
}

/**
 * 新建 Excel 文件（支持自定义名称）
 * @param {string} [name] - 自定义文件名（可选）
 * @returns {Promise<string>} 返回新文件的 fileId
 */
export async function createNewFile(name) {
  const resp = await request.post("/onlyoffice_local/new", { name });
  if (resp.data.error) throw new Error(resp.data.message);
  return resp.data.data.fileId;
}
