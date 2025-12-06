// src/api/file/apiFunctions.js
import request from '../utils/request';
import axios from 'axios';

/** 单文件上传：新增 */
export const uploadFile = async (
  fileType,
  file,
  onProgress,
  onComplete = () => {},
) => {
  try {
    // 1）准备上传
    const { data: prepare } = await request.post('/file/upload/prepare', {
      fileType,
      filename: file.name,
      size: file.size,
      contentType: file.type || 'application/octet-stream',
    });

    const { documentId, uploadUrl } = prepare;

    // 2）PUT MinIO
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      onUploadProgress: (e) => {
        if (!e.total) return;
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress?.(percent);
      },
    });

    // 3）confirm
    await request.post('/file/upload/confirm', {
      documentId,
    });

    onProgress?.(100);
    onComplete?.(documentId);
    return documentId;
  } catch (error) {
    console.error(`File upload failed: ${error?.message || error}`);
    throw new Error('File upload failed.');
  }
};

/** 多文件上传：新增 */

export const uploadFiles = async (
  fileType,
  files,
  onProgress,
  onComplete = () => {},
) => {
  try {
    const fileArray = Array.from(files || []);
    const total = fileArray.length;

    if (total === 0) {
      return [];
    }

    const ids = new Array(total);
    let finished = 0;

    for (let i = 0; i < total; i++) {
      const f = fileArray[i];
 
      await uploadFile(
        fileType,
        f,
        (singlePercent) => {
          const overall =
            ((finished + singlePercent / 100) / total) * 100;
          onProgress?.(Math.round(overall));
        },
        (id) => {
          ids[i] = id; // 保证顺序与 files 对齐
        },
      );

      finished += 1;
      onProgress?.(Math.round((finished / total) * 100));
    }

    onComplete?.(ids);
    return ids;
  } catch (error) {
    console.error(`File upload failed: ${error?.message || error}`);
    throw new Error('File upload failed.');
  }
};


/** 删除：DELETE /file/{id} */
export const deleteFile = async (documentId) => {
  try {
    await request.delete(`/file/${documentId}`);
  } catch (error) {
    console.error(`File deletion failed: ${error?.message || error}`);
    throw new Error('File deletion failed.');
  }
};

/** 下载：先拿 download-url，再跳转 */
export const downloadFile = async (documentId) => {
  try {
    const { data } = await request.get(`/file/${documentId}/download-url`);
    window.location.href = data.downloadUrl;
  } catch (error) {
    console.error(`File download failed: ${error?.message || error}`);
    throw new Error('File download failed.');
  }
};

/** 更新文件：走 update/prepare → PUT MinIO → upload/confirm */
export const updateFile = async (
  documentId,
  file,
  onProgress,
  onComplete = () => {},
) => {
  try {
    // 1）准备更新上传
    const { data: prepare } = await request.post('/file/update/prepare', {
      documentId,
      filename: file.name,
      size: file.size,
      contentType: file.type || 'application/octet-stream',
    });

    const { uploadUrl } = prepare;

    // 2）PUT MinIO 覆盖新文件
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      onUploadProgress: (e) => {
        if (!e.total) return;
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress?.(percent);
      },
    });

    // 3）确认更新完成（复用 /file/upload/confirm）
    await request.post('/file/upload/confirm', {
      documentId,
    });

    onProgress?.(100);
    onComplete?.();
    return 'File update completed.';
  } catch (error) {
    console.error(`File update failed: ${error?.message || error}`);
    throw new Error('File update failed.');
  }
};
