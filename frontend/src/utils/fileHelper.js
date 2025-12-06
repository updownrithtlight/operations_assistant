// src/utils/fileHelper.js

// 判断是否是 OnlyOffice 支持的格式
export function isOnlyOfficeSupported(file) {
  const name = file?.original_name || '';
  const ext = name.split('.').pop().toLowerCase();

  const officeExts = [
    'docx', 'docm', 'dotx', 'dotm', 'doc',
    'xlsx', 'xlsm', 'xlsb', 'xls', 'xltx',
    'pptx', 'pptm', 'ppt', 'ppsx', 'pps'
  ];
  return officeExts.includes(ext);
}

// 格式化文件大小
export function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}
