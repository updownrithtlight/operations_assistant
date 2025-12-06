import request from '../utils/request';

/** 获取编辑器配置 */
export async function getOnlyOfficeConfig({ fileId, mode = "edit" }) {
  const resp = await request.get("/onlyoffice/config", {
    params: { fileId, mode },
  });
  return resp.data;
}

/** 动态加载 api.js */
// src/utils/onlyoffice.js
export function loadOnlyOfficeScript() {
  // 必须使用 import.meta.env 读取 Vite 环境变量
  const base = import.meta.env.VITE_DOCSERVER_BASE;
  if (!base) {
    return Promise.reject(new Error("VITE_DOCSERVER_BASE 未配置"));
  }

  const src = `${base}/web-apps/apps/api/documents/api.js`;

  // 已经加载过 DocsAPI 时不重复加载
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
// export async function createExcelEditor(container, { fileId, mode }) {
//   const cfg = await getOnlyOfficeConfig({ fileId, mode });

//   // eslint-disable-next-line no-undef
//   const editor = new DocsAPI.DocEditor(container.id, cfg);
//   return { editor, config: cfg };
// }

// src/api/onlyoffice.js

// ... (getOnlyOfficeConfig 和 loadOnlyOfficeScript 保持不变) ...

/** * 修改后：直接接收 cfg 对象，不再重复请求后端
 */
export function createExcelEditor(container, cfg) {
  // 确保 DocsAPI 已加载
  if (!window.DocsAPI) {
    throw new Error("DocsAPI 未加载，请先调用 loadOnlyOfficeScript");
  }

  // 使用传入的 container.id 和 cfg 初始化
  // eslint-disable-next-line no-undef
  const editor = new DocsAPI.DocEditor(container.id, cfg);
  
  return { editor };
}