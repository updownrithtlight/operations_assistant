// src/pages/kb/KnowledgeBasePage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Tree,
  Input,
  Tag,
  Select,
  Space,
  Button,
  Modal,
  Upload,
  message,
  Form,
  TreeSelect,
  Spin,
  Empty,
  List,
  Dropdown,
  Popconfirm,
  Progress
} from 'antd';
import {
  UploadOutlined,
  FolderOpenOutlined,
  FileOutlined,
  SearchOutlined,
  TagsOutlined,
  FolderAddOutlined,
} from '@ant-design/icons';

import {
  fetchKbFolderTree,
  fetchKbFilesByFolder,
  searchKbFiles,
  fetchKbTags,
  uploadKbFile,
  updateKbFileTags,
  createKbFolder,
  deleteKbFile,
  deleteKbFolder,
  renameKbFolder,
   
} from '../../api/kb';
import {
  uploadFile,
  uploadFiles,
  deleteFile,
  downloadFile,
   previewFile,   // ⭐ 新增
} from '../../api/minioUpload';


const { Search } = Input;

/** 递归获取树的所有 key，用于“展开全部” */
const getAllTreeKeys = (nodes = []) => {
  const keys = [];
  const loop = (arr) => {
    arr.forEach((n) => {
      if (n.key !== undefined && n.key !== null) {
        keys.push(String(n.key));
      }
      if (Array.isArray(n.children) && n.children.length > 0) {
        loop(n.children);
      }
    });
  };
  loop(nodes);
  return keys;
};

/** 在树里根据 id 查找节点 */
const findNodeById = (nodes, id) => {
  for (const n of nodes || []) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findNodeById(n.children, id);
      if (found) return found;
    }
  }
  return null;
};

// ⭐ 帮助函数：时间 & 文件类型显示

const getFileTypeText = (item) => {
  if (!item || item.is_folder) return '';
  if (item.file_type) return item.file_type;
  if (item.name && item.name.includes('.')) {
    return item.name.split('.').pop();
  }
  return '';
};
// ⭐ 浏览器直接预览的扩展名（图片 + pdf）
const BROWSER_PREVIEW_EXTS = [
  'pdf',
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg',
];

const isBrowserPreviewable = (item) => {
  if (!item || item.is_folder) return false;
  const name = item.name || '';
  const idx = name.lastIndexOf('.');
  if (idx === -1) return false;
  const ext = name.slice(idx + 1).toLowerCase();
  return BROWSER_PREVIEW_EXTS.includes(ext);
};

// ⭐ OnlyOffice 支持在线编辑的扩展名（前后端要保持一致）
const ONLYOFFICE_EDITABLE_EXTS = [
  'doc', 'docx',
  'xls', 'xlsx',
  'ppt', 'pptx',
  'odt', 'ods', 'odp',
  'rtf', 'txt'
];

const isOnlyOfficeEditable = (item) => {
  if (!item || item.is_folder) return false;
  const name = item.name || '';
  const idx = name.lastIndexOf('.');
  if (idx === -1) return false;
  const ext = name.slice(idx + 1).toLowerCase();
  return ONLYOFFICE_EDITABLE_EXTS.includes(ext);
};


const KnowledgeBasePage = () => {
  const [treeData, setTreeData] = useState([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedTreeKeys, setSelectedTreeKeys] = useState([]);
  const [treeExpandedKeys, setTreeExpandedKeys] = useState([]);
  const [allExpanded, setAllExpanded] = useState(true);
  const navigate = useNavigate(); 
  const [fileList, setFileList] = useState([]);
  const [fileLoading, setFileLoading] = useState(false);

  const [tagOptions, setTagOptions] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [searchTags, setSearchTags] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadForm] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [uploadFileObj, setUploadFileObj] = useState(null);

  const [editTagsModalVisible, setEditTagsModalVisible] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [editingTags, setEditingTags] = useState([]);

  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [folderForm] = Form.useForm();
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [renameFolderModalVisible, setRenameFolderModalVisible] = useState(false);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [renamingFolder, setRenamingFolder] = useState(false);
  const [deleteFolderId, setDeleteFolderId] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false); // 你如果不用单独弹窗可以后面删


  // ⭐ 批量上传
  const [multiUploadModalVisible, setMultiUploadModalVisible] = useState(false);
  const [multiUploadForm] = Form.useForm();
  const [multiUploading, setMultiUploading] = useState(false);
  const [multiUploadFiles, setMultiUploadFiles] = useState([]);

  // ⭐ 排序：name / updated_at / file_type
  const [sortField, setSortField] = useState('name');   // 'name' | 'updated_at' | 'file_type'
  const [sortOrder, setSortOrder] = useState('asc');    // 'asc' | 'desc'
  // 单文件上传进度
  const [uploadProgress, setUploadProgress] = useState(0);

  // 批量上传进度
  const [multiUploadProgress, setMultiUploadProgress] = useState(0);


  useEffect(() => {
    loadFolderTree();
    loadTags();
  }, []);

  useEffect(() => {
    if (!isSearching && selectedFolderId) {
      loadFilesByFolder(selectedFolderId);
    }
  }, [selectedFolderId, isSearching]);

  /** TreeSelect 需要的格式 */
  const convertTreeToTreeSelect = (nodes) => {
    if (!nodes) return [];
    return nodes.map((n) => ({
      title: n.title,
      value: n.id,
      key: n.key,
      children: convertTreeToTreeSelect(n.children || []),
    }));
  };

  /** 目录树：加载 */
  const loadFolderTree = async () => {
    try {
      setTreeLoading(true);
      const res = await fetchKbFolderTree();
      console.log('获取个der'+res)
      const ok = res && (res.success === true || res.code === 0);
      if (!ok) {
        throw new Error(res.message || '获取目录树失败');
      }

      const raw = res.data || [];

      const withIcon = (nodes) =>
        (nodes || []).map((n) => ({
          ...n,
          icon: <FolderOpenOutlined />,
          children: withIcon(n.children || []),
        }));

      const data = withIcon(raw);
      setTreeData(data);

      if (!selectedFolderId && data.length > 0) {
        const firstId = data[0].id;
        setSelectedFolderId(firstId);
        setSelectedTreeKeys([String(firstId)]);
      }

      const allKeys = getAllTreeKeys(data);
      setTreeExpandedKeys(allKeys);
      setAllExpanded(true);
    } catch (err) {
      console.error(err);
      message.error(err.message || '加载目录树失败');
      setTreeData([]);
      setTreeExpandedKeys([]);
    } finally {
      setTreeLoading(false);
    }
  };

  /** 删除目录 */
  const doDeleteFolder = async (folderId) => {
    if (!folderId) {
      message.error('没有目录 ID，无法删除');
      return;
    }
    try {
      const res = await deleteKbFolder(folderId);
      const ok = res && res.data && res.data.success === true;
      if (!ok) {
        throw new Error(res.message || '删除目录失败');
      }
      message.success('目录删除成功');
      await loadFolderTree();
    } catch (e) {
      console.error(e);
      message.error(e.message || '删除目录失败');
    }
  };

  const handleTreeSelect = (selectedKeys) => {
    const key = selectedKeys[0];
    setSelectedTreeKeys(selectedKeys);
    if (!key) return;
    setIsSearching(false);
    setSelectedFolderId(Number(key));
  };

  const handleTreeExpand = (expandedKeys) => {
    setTreeExpandedKeys(expandedKeys);
    const allKeys = getAllTreeKeys(treeData);
    setAllExpanded(expandedKeys.length === allKeys.length);
  };

  const toggleExpandAll = () => {
    if (allExpanded) {
      setTreeExpandedKeys([]);
      setAllExpanded(false);
    } else {
      const allKeys = getAllTreeKeys(treeData);
      setTreeExpandedKeys(allKeys);
      setAllExpanded(true);
    }
  };

  /** 新建目录弹窗 */
  const openFolderModal = (parentId = null) => {
    folderForm.setFieldsValue({
      name: '',
      parent_id: parentId ?? selectedFolderId ?? null,
      sort_order: 0,
    });
    setFolderModalVisible(true);
  };

  const handleFolderCancel = () => {
    setFolderModalVisible(false);
    folderForm.resetFields();
  };

  const handleFolderOk = async () => {
    try {
      const values = await folderForm.validateFields();
      const payload = {
        name: values.name,
        parent_id: values.parent_id || null,
        sort_order: values.sort_order || 0,
      };

      setCreatingFolder(true);
      const res = await createKbFolder(payload);
      const ok = res && (res.success === true || res.code === 0);
      if (!ok) {
        throw new Error(res.message || '创建目录失败');
      }

      message.success('目录创建成功');
      setFolderModalVisible(false);
      folderForm.resetFields();

      const newNode = res.data;
      await loadFolderTree();
      if (newNode && newNode.id) {
        setSelectedFolderId(newNode.id);
        setSelectedTreeKeys([String(newNode.id)]);
      }
    } catch (err) {
      if (err && err.errorFields) return;
      console.error(err);
      message.error(err.message || '创建目录失败');
    } finally {
      setCreatingFolder(false);
    }
  };

  /** 下载文件 */
  const handleDownload = async (record) => {
    if (!record || !record.document_id) {
      message.error('没有文件关联的 document_id，无法下载');
      return;
    }
    try {
      await downloadFile(record.document_id);
    } catch (e) {
      console.error(e);
      message.error(e.message || '下载失败');
    }
  };

    /** OnlyOffice 在线编辑 */
  const handleOpenOnlineEdit = (record) => {
  if (!record || !record.document_id) {
    message.error('没有关联的 document_id，无法在线编辑');
    return;
  }
  if (!isOnlyOfficeEditable(record)) {
    message.warning('该文件类型暂不支持在线编辑');
    return;
  }

  // 用 React Router 跳转到编辑页
  navigate(`/kb/editor?fileId=${record.document_id}&mode=edit`);
};

/** 图片 / PDF 浏览器新开标签页预览 */
const handleOpenInBrowser = async (record) => {
  if (!record || !record.document_id) {
    message.error('没有关联的 document_id，无法预览');
    return;
  }
  try {
    const url = await  previewFile(record.document_id);
    if (!url) {
      message.error('未获取到预览地址');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch (e) {
    console.error(e);
    message.error(e.message || '打开预览失败');
  }
};





  /** 标签 */
  const loadTags = async () => {
    try {
      setTagsLoading(true);
      const res = await fetchKbTags();
      const ok = res && (res.success === true || res.code === 0);
      if (!ok) {
        throw new Error(res.message || '获取标签失败');
      }
      const data = res.data;
      const list = Array.isArray(data) ? data : [];
      setTagOptions(list);
    } catch (err) {
      console.error(err);
      message.error(err.message || '加载标签失败');
      setTagOptions([]);
    } finally {
      setTagsLoading(false);
    }
  };

  /** 文件列表 */
  const loadFilesByFolder = async (folderId) => {
    if (!folderId) {
      setFileList([]);
      return;
    }
    try {
      setFileLoading(true);
      const res = await fetchKbFilesByFolder(folderId);
      const ok = res && (res.success === true || res.code === 0);
      if (!ok) {
        throw new Error(res.message || '获取文件列表失败');
      }

      const data = res.data;
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data && Array.isArray(data.items)) {
        list = data.items;
      } else {
        list = [];
      }

      list = list.map((f) => ({
        ...f,
        is_folder: false,
        type: 'file',
      }));

      setFileList(list);
    } catch (err) {
      console.error(err);
      message.error(err.message || '加载文件列表失败');
      setFileList([]);
    } finally {
      setFileLoading(false);
    }
  };

  /** 搜索 */
  const handleSearch = async () => {
    const q = searchText.trim();
    const tags = searchTags;

    if (!q && (!tags || tags.length === 0)) {
      setIsSearching(false);
      if (selectedFolderId) {
        loadFilesByFolder(selectedFolderId);
      } else {
        setFileList([]);
      }
      return;
    }

    try {
      setIsSearching(true);
      setFileLoading(true);
      const res = await searchKbFiles({ q, tags });
      const ok = res && (res.success === true || res.code === 0);
      if (!ok) {
        throw new Error(res.message || '搜索失败');
      }

      const data = res.data;
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data && Array.isArray(data.items)) {
        list = data.items;
      } else {
        list = [];
      }

      list = list.map((f) => ({
        ...f,
        is_folder: false,
        type: 'file',
      }));

      setFileList(list);
    } catch (err) {
      console.error(err);
      message.error(err.message || '搜索失败');
      setFileList([]);
    } finally {
      setFileLoading(false);
    }
  };

  const resetSearch = () => {
    setSearchText('');
    setSearchTags([]);
    setIsSearching(false);
    if (selectedFolderId) {
      loadFilesByFolder(selectedFolderId);
    } else {
      setFileList([]);
    }
  };

  /** 单文件上传 */
  const openUploadModal = (folderId = null) => {
    uploadForm.setFieldsValue({
      folder_id: folderId ?? selectedFolderId ?? null,
      name: '',
      tags: [],
    });
    setUploadFileObj(null);
    setUploadProgress(0); 
    setUploadModalVisible(true);
  };

  const handleUploadCancel = () => {
    setUploadModalVisible(false);
    uploadForm.resetFields();
    setUploadFileObj(null);
    setUploadProgress(0);  
  };

    const handleUploadOk = async () => {
    try {
      const values = await uploadForm.validateFields();
      if (!uploadFileObj) {
        message.warning('请先选择文件');
        return;
      }

      // 1）先上传到 MinIO
      setUploading(true);
      setUploadProgress(0);

      // fileType 你可以自定义一个，如 'OTHER'，与后端枚举保持一致
      const fileType = 'OTHER';

      const documentId = await uploadFile(
        fileType,
        uploadFileObj,
        (percent) => {
          setUploadProgress(percent);
        },
      );

      // 2）再登记到知识库（仅元数据 + 关联 documentId）
      const payload = {
        folder_id: values.folder_id,
        name: values.name || uploadFileObj.name,
        tags: values.tags || [],
        document_id: documentId,
      };

      const res = await uploadKbFile(payload);
      const ok = res && (res.success === true || res.code === 0);
      if (!ok) {
        throw new Error(res.message || '上传失败');
      }

      message.success('上传成功');
      setUploadModalVisible(false);
      uploadForm.resetFields();
      setUploadFileObj(null);
      setUploadProgress(0);

      if (!isSearching && selectedFolderId) {
        loadFilesByFolder(selectedFolderId);
      } else if (isSearching) {
        handleSearch();
      }
    } catch (err) {
      if (err && err.errorFields) return;
      console.error(err);
      message.error(err.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };


  /** ⭐ 批量上传 */
  const openMultiUploadModal = (folderId = null) => {
    multiUploadForm.setFieldsValue({
      folder_id: folderId ?? selectedFolderId ?? null,
      tags: [],
    });
    setMultiUploadFiles([]);
    setMultiUploadProgress(0);   // ⭐
    setMultiUploadModalVisible(true);
  };

  const handleMultiUploadCancel = () => {
    setMultiUploadModalVisible(false);
    multiUploadForm.resetFields();
    setMultiUploadFiles([]);
    setMultiUploadProgress(0);   // ⭐
  };

  const handleMultiUploadOk = async () => {
    try {
      const values = await multiUploadForm.validateFields();
      if (!multiUploadFiles || multiUploadFiles.length === 0) {
        message.warning('请先选择至少一个文件');
        return;
      }

      setMultiUploading(true);
      setMultiUploadProgress(0);

      // 原始 File 对象数组
      const realFiles = multiUploadFiles.map(
        (f) => f.originFileObj || f,
      );

      const fileType = 'OTHER';

      // 1）批量上传到 MinIO，拿到 documentId 数组
      const documentIds = await uploadFiles(
        fileType,
        realFiles,
        (percent) => {
          setMultiUploadProgress(percent);
        },
      );

      // 2）逐个登记到知识库
      const tags = values.tags || [];
      const folderId = values.folder_id;

      for (let i = 0; i < realFiles.length; i += 1) {
        const file = realFiles[i];
        const documentId = documentIds[i];

        const payload = {
          folder_id: folderId,
          name: file.name,
          tags,
          document_id: documentId,
        };

        const res = await uploadKbFile(payload);
        const ok = res && (res.success === true || res.code === 0);
        if (!ok) {
          throw new Error(res.message || `文件 ${file.name} 登记失败`);
        }
      }

      message.success(`成功上传并登记 ${realFiles.length} 个文件`);
      setMultiUploadModalVisible(false);
      multiUploadForm.resetFields();
      setMultiUploadFiles([]);
      setMultiUploadProgress(0);

      if (!isSearching && selectedFolderId) {
        loadFilesByFolder(selectedFolderId);
      } else if (isSearching) {
        handleSearch();
      }
    } catch (err) {
      if (err && err.errorFields) return;
      console.error(err);
      message.error(err.message || '批量上传失败');
    } finally {
      setMultiUploading(false);
    }
  };


  /** 编辑标签 */
  const openEditTagsModal = (fileRecord) => {
    setEditingFile(fileRecord);
    setEditingTags(fileRecord.tags || []);
    setEditTagsModalVisible(true);
  };

  const handleEditTagsCancel = () => {
    setEditTagsModalVisible(false);
    setEditingFile(null);
    setEditingTags([]);
  };

  const handleEditTagsOk = async () => {
    if (!editingFile) return;
    try {
      const fileId = editingFile.id;
      const tags = editingTags || [];
      const res = await updateKbFileTags(fileId, tags);
      const ok = res && (res.success === true || res.code === 0);
      if (!ok) {
        throw new Error(res.message || '更新标签失败');
      }

      message.success('标签已更新');
      setEditTagsModalVisible(false);

      setFileList((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                tags,
              }
            : f,
        ),
      );
    } catch (err) {
      console.error(err);
      message.error(err.message || '更新标签失败');
    }
  };

  /** 删除文件 */
    const doDeleteFile = async (record) => {
    if (!record || !record.id) {
      message.error('没有文件 ID，无法删除');
      return;
    }
    try {
      // 1）先删除 MinIO 中的文件（如果有关联）
      if (record.document_id) {
        try {
          await deleteFile(record.document_id);
        } catch (e) {
          // 物理删除失败可以只记日志，不拦住后面逻辑
          console.warn('删除物理文件失败：', e);
        }
      }

      // 2）再删除知识库中的元数据记录
      const res = await deleteKbFile(record.id);
      const ok = res && (res.success === true || res.code === 0);
      if (!ok) {
        throw new Error(res.message || '删除失败');
      }
      message.success('删除成功');
      setFileList((prev) => prev.filter((f) => f.id !== record.id));
    } catch (e) {
      console.error(e);
      message.error(e.message || '删除失败');
    }
  };


  const openRenameFolderModal = (folderId) => {
    const folderNode = findNodeById(treeData, folderId);
    if (folderNode) {
      setEditingFolderId(folderId);
      setEditingFolderName(folderNode.title);
      setRenameFolderModalVisible(true);
    }
  };

  const handleRenameFolderCancel = () => {
    setRenameFolderModalVisible(false);
    setEditingFolderName('');
    setEditingFolderId(null);
  };

  const handleRenameFolderOk = async () => {
    try {
      if (!editingFolderName.trim()) {
        message.error('请输入文件夹名称');
        return;
      }

      setRenamingFolder(true);
      const res = await renameKbFolder(editingFolderId, editingFolderName);
      const ok = res && (res.success === true || res.code === 0);
      if (!ok) {
        throw new Error(res.message || '重命名失败');
      }

      message.success('文件夹重命名成功');
      setRenameFolderModalVisible(false);
      loadFolderTree();
    } catch (err) {
      console.error(err);
      message.error(err.message || '重命名失败');
    } finally {
      setRenamingFolder(false);
    }
  };

  /** 打开 / 定位 目录 */
  const locateToFolder = (folderId) => {
    if (!folderId) return;
    setIsSearching(false);
    setSelectedFolderId(folderId);
    setSelectedTreeKeys([String(folderId)]);
    loadFilesByFolder(folderId);
  };

  /** 双击文件/目录 */
/** 双击文件/目录 */
const handleItemClick = (item) => {
  if (item.is_folder) {
    // 文件夹 → 打开该目录
    locateToFolder(item.kbId || item.id);
    return;
  }

  // 1）可在线编辑的 Office → OnlyOffice
  if (isOnlyOfficeEditable(item)) {
    handleOpenOnlineEdit(item);
    return;
  }

  // 2）图片 & PDF → 浏览器预览
  if (isBrowserPreviewable(item)) {
    handleOpenInBrowser(item);
    return;
  }

  // 3）其他类型 → 按原逻辑下载
  handleDownload(item);
};


  /** 当前目录下的“文件夹列表” */
  const childFolders = (() => {
    if (!selectedFolderId) return [];
    const node = findNodeById(treeData, selectedFolderId);
    if (!node || !Array.isArray(node.children)) return [];
    return node.children.map((n) => ({
      id: `folder-${n.id}`,
      kbId: n.id,
      name: n.title,
      is_folder: true,
      type: 'folder',
    }));
  })();

  /** 原始列表：文件夹 + 文件 */
  const explorerItems = [...childFolders, ...(fileList || [])];

  /** ⭐ 排序后的列表 */
    /** ⭐ 排序后的列表：文件夹始终在前，文件按字段排序 */
  const sortedExplorerItems = React.useMemo(() => {
    const items = [...explorerItems];

    const getUpdatedTime = (item) => {
      if (!item.updated_at) return 0;
      const t = new Date(item.updated_at).getTime();
      return Number.isNaN(t) ? 0 : t;
    };

    const getFileType = (item) => {
      if (item.is_folder) return '';
      if (item.file_type) return item.file_type;
      if (item.name && item.name.includes('.')) {
        return item.name.split('.').pop();
      }
      return '';
    };

    items.sort((a, b) => {
      // 1）目录永远在文件前面
      if (a.is_folder && !b.is_folder) return -1;
      if (!a.is_folder && b.is_folder) return 1;

      // 2）两个都是目录 → 始终按名称，方便看结构
      if (a.is_folder && b.is_folder) {
        return (a.name || '').localeCompare(b.name || '');
      }

      // 3）两个都是文件 → 按 sortField 排
      let res = 0;
      if (sortField === 'name') {
        res = (a.name || '').localeCompare(b.name || '');
      } else if (sortField === 'updated_at') {
        res = getUpdatedTime(a) - getUpdatedTime(b);
      } else if (sortField === 'file_type') {
        res = getFileType(a).localeCompare(getFileType(b));
      }

      return sortOrder === 'asc' ? res : -res;
    });

    return items;
  }, [explorerItems, sortField, sortOrder]);


  /** 右键菜单：目录 */
  const folderMenuItems = [
    { key: 'open', label: '打开' },
    { key: 'new-folder', label: '在此新建文件夹' },
    { key: 'upload', label: '上传文件到此目录' },
    { key: 'multi-upload', label: '批量上传到此目录' },
    { key: 'delete', label: '删除目录' },
    { key: 'rename', label: '重命名目录' },
  ];

  const handleFolderMenuClick = (key, item) => {
    const folderId = item.kbId || item.id;
    if (key === 'open') {
      locateToFolder(folderId);
    } else if (key === 'new-folder') {
      openFolderModal(folderId);
    } else if (key === 'upload') {
      openUploadModal(folderId);
    } else if (key === 'multi-upload') {
      openMultiUploadModal(folderId);
    } else if (key === 'delete') {
      setDeleteFolderId(folderId);
      setDeleteModalVisible(true);
      doDeleteFolder(folderId);
    } else if (key === 'rename') {
      openRenameFolderModal(folderId);
    }
  };

  /** Tree 节点右键菜单 */
  const handleTreeFolderMenuClick = (key, node) => {
    const folderItem = {
      id: node.id,
      kbId: node.id,
      name: node.title,
    };
    handleFolderMenuClick(key, folderItem);
  };

  const renderTreeTitle = (node) => {
    return (
      <Dropdown
        trigger={['contextMenu']}
        menu={{
          items: folderMenuItems,
          onClick: ({ key }) => handleTreeFolderMenuClick(key, node),
        }}
      >
        <span style={{ userSelect: 'none' }}>{node.title}</span>
      </Dropdown>
    );
  };

  /** 右键菜单：文件 */
  const fileMenuItems = [
    { key: 'download', label: '下载' },
    { key: 'tags', label: '编辑标签' },
  ];

  const handleFileMenuClick = (key, item) => {
    if (key === 'download') {
      handleDownload(item);
    } else if (key === 'tags') {
      openEditTagsModal(item);
    }
  };

  const uploadFileList = uploadFileObj
    ? [
        {
          uid: '-1',
          name: uploadFileObj.name,
          status: 'done',
        },
      ]
    : [];

  const multiUploadFileList = multiUploadFiles;

  // ================== 布局 ==================
  return (
    <div
      style={{
        height: '100%',
        background: '#f5f5f5',
        display: 'flex',
      }}
    >
      {/* 左侧目录树区域 */}
      <div
        style={{
          width: 260,
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          padding: 12,
        }}
      >
        <div
          style={{
            marginBottom: 8,
            fontWeight: 500,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>
            <FolderOpenOutlined style={{ marginRight: 8 }} />
            知识库目录
          </span>
          <Button size="small" type="link" onClick={toggleExpandAll}>
            {allExpanded ? '收起全部' : '展开全部'}
          </Button>
        </div>

        <Spin spinning={treeLoading}>
          {treeData && treeData.length > 0 ? (
            <Tree
              treeData={treeData}
              showIcon
              onSelect={handleTreeSelect}
              selectedKeys={selectedTreeKeys}
              expandedKeys={treeExpandedKeys}
              onExpand={handleTreeExpand}
              titleRender={renderTreeTitle}
              style={{ maxHeight: 'calc(100vh - 220px)', overflow: 'auto' }}
            />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无目录，请先新建目录"
              style={{ marginTop: 40 }}
            />
          )}
        </Spin>
      </div>

      {/* 右侧：类似 Windows 列表视图 */}
      <div style={{ flex: 1, padding: 16 }}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Search
            placeholder="按文件名搜索"
            allowClear
            prefix={<SearchOutlined />}
            onSearch={handleSearch}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 260 }}
          />
          <Select
            mode="tags"
            allowClear
            placeholder="按标签筛选"
            style={{ minWidth: 260 }}
            value={searchTags}
            loading={tagsLoading}
            onChange={setSearchTags}
            tokenSeparators={[',', ' ']}
            options={(Array.isArray(tagOptions) ? tagOptions : []).map((t) => ({
              label: t.name,
              value: t.name,
            }))}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button icon={<FolderAddOutlined />} onClick={() => openFolderModal()}>
            新建目录
          </Button>
          <Button
            icon={<UploadOutlined />}
            type="primary"
            onClick={() => openUploadModal()}
            disabled={!selectedFolderId}
          >
            上传文件
          </Button>
          {/* ⭐ 批量上传按钮 */}
          <Button
            icon={<UploadOutlined />}
            onClick={() => openMultiUploadModal()}
            disabled={!selectedFolderId}
          >
            批量上传
          </Button>

          {/* ⭐ 排序控制 */}
          <Space size={8} align="center">
            <span style={{ color: '#666' }}>排序：</span>
            <Select
              size="small"
              value={sortField}
              style={{ width: 120 }}
              onChange={setSortField}
              options={[
                { label: '文件名', value: 'name' },
                { label: '修改时间', value: 'updated_at' },
                { label: '文件类型', value: 'file_type' },
              ]}
            />
            <Select
              size="small"
              value={sortOrder}
              style={{ width: 90 }}
              onChange={setSortOrder}
              options={[
                { label: '升序', value: 'asc' },
                { label: '降序', value: 'desc' },
              ]}
            />
          </Space>

          {isSearching ? (
            <Button onClick={resetSearch}>返回目录浏览</Button>
          ) : (
            <span style={{ color: '#999' }}>当前：按目录浏览</span>
          )}
        </Space>

        <Spin spinning={fileLoading}>
          {sortedExplorerItems.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="当前目录下暂无文件或子目录"
              style={{ marginTop: 40 }}
            />
          ) : (
            <List
              bordered
              style={{ background: '#fff' }}
              dataSource={sortedExplorerItems} // ⭐ 使用排序后的列表
              renderItem={(item) => {
                const isFolder = item.is_folder;

                const menuConfig = isFolder
                  ? {
                      items: folderMenuItems,
                      onClick: ({ key }) => handleFolderMenuClick(key, item),
                    }
                  : {
                      items: fileMenuItems,
                      onClick: ({ key }) => handleFileMenuClick(key, item),
                    };

                return (
                  <Dropdown trigger={['contextMenu']} menu={menuConfig}>
                    <List.Item
                      style={{
                        cursor: 'default',
                        paddingLeft: 16,
                        paddingRight: 16,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      onDoubleClick={() => handleItemClick(item)}
                    >
                      {/* 左：图标 + 名称 */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          flex: 2,
                          minWidth: 200,
                        }}
                      >
                        {isFolder ? (
                          <FolderOpenOutlined
                            style={{ marginRight: 8, color: '#faad14' }}
                          />
                        ) : (
                          <FileOutlined
                            style={{ marginRight: 8, color: '#1890ff' }}
                          />
                        )}
                        <span
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleItemClick(item)}
                        >
                          {item.name}
                        </span>
                      </div>

                      {/* 中间：目录路径 */}
                      {!isFolder && (
                        <div
                          style={{
                            flex: 2,
                            minWidth: 200,
                            color: '#999',
                            paddingRight: 16,
                          }}
                        >
                          {item.folder_path || ''}
                        </div>
                      )}

                      {/* ⭐ 修改时间 */}
                      {!isFolder && (
                        <div
                          style={{
                            flex: 1.5,
                            minWidth: 160,
                            color: '#999',
                            paddingRight: 16,
                          }}
                        >
                          {item.updated_at}
                        </div>
                      )}

                      {/* ⭐ 文件类型 */}
                      {!isFolder && (
                        <div
                          style={{
                            flex: 1,
                            minWidth: 100,
                            paddingRight: 16,
                          }}
                        >
                          {getFileTypeText(item) || '-'}
                        </div>
                      )}

                      {/* 标签 */}
                      {!isFolder && (
                        <div
                          style={{
                            flex: 2,
                            minWidth: 200,
                          }}
                        >
                          {item.tags && item.tags.length > 0 ? (
                            item.tags.map((t) => (
                              <Tag key={t} icon={<TagsOutlined />}>
                                {t}
                              </Tag>
                            ))
                          ) : (
                            <span style={{ color: '#ccc' }}>无标签</span>
                          )}
                        </div>
                      )}

                      {/* 操作按钮 */}
                      {!isFolder && (
  <Space style={{ flexShrink: 0 }}>
    {isOnlyOfficeEditable(item) && (
      <Button
        size="small"
        type="primary"
        ghost
        onClick={() => handleOpenOnlineEdit(item)}
      >
        在线编辑
      </Button>
    )}

    {isBrowserPreviewable(item) && (
      <Button
        size="small"
        onClick={() => handleOpenInBrowser(item)}
      >
        预览
      </Button>
    )}

    <Button
      size="small"
      onClick={() => handleDownload(item)}
    >
      下载
    </Button>

    <Button
      size="small"
      icon={<TagsOutlined />}
      onClick={() => openEditTagsModal(item)}
    >
      标签
    </Button>

    <Popconfirm
      title="确认删除该文件？"
      okText="删除"
      cancelText="取消"
      onConfirm={() => doDeleteFile(item)}
    >
      <Button size="small" danger>
        删除
      </Button>
    </Popconfirm>
  </Space>
)}

                    </List.Item>
                  </Dropdown>
                );
              }}
            />
          )}
        </Spin>
      </div>

      {/* 单文件上传弹窗 */}
      <Modal
        title="上传文件到知识库"
        open={uploadModalVisible}
        onOk={handleUploadOk}
        onCancel={handleUploadCancel}
        confirmLoading={uploading}
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={uploadForm}
          initialValues={{
            folder_id: selectedFolderId || null,
            tags: [],
          }}
        >
          <Form.Item
            label="所属目录"
            name="folder_id"
            rules={[{ required: true, message: '请选择目录' }]}
          >
            <TreeSelect
              placeholder="请选择存放目录"
              treeData={convertTreeToTreeSelect(treeData)}
              treeDefaultExpandAll
              allowClear
            />
          </Form.Item>

          <Form.Item label="文件名" name="name">
            <Input placeholder="不填则使用上传文件名" />
          </Form.Item>

          <Form.Item label="标签" name="tags">
            <Select
              mode="tags"
              allowClear
              placeholder="选择或输入标签"
              tokenSeparators={[',', ' ']}
              options={(Array.isArray(tagOptions) ? tagOptions : []).map((t) => ({
                label: t.name,
                value: t.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="选择文件"
            required
            validateStatus={!uploadFileObj ? 'error' : ''}
            help={!uploadFileObj ? '请上传一个文件' : ''}
          >
            <Upload
              beforeUpload={(file) => {
                setUploadFileObj(file);
                return false;
              }}
              maxCount={1}
              fileList={uploadFileList}
              onRemove={() => {
                setUploadFileObj(null);
              }}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
            
            {uploading && (
              <div style={{ marginTop: 8 }}>
                <Progress percent={uploadProgress} size="small" />
              </div>
            )}
          </Form.Item>
        </Form>
      </Modal>

      {/* ⭐ 批量上传弹窗 */}
          {/* ⭐ 批量上传文件弹窗 */}
      <Modal
        title="批量上传文件到知识库"
        open={multiUploadModalVisible}
        onOk={handleMultiUploadOk}
        onCancel={handleMultiUploadCancel}
        confirmLoading={multiUploading}
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={multiUploadForm}
          initialValues={{
            folder_id: selectedFolderId || null,
            tags: [],
          }}
        >
          <Form.Item
            label="所属目录"
            name="folder_id"
            rules={[{ required: true, message: '请选择目录' }]}
          >
            <TreeSelect
              placeholder="请选择存放目录"
              treeData={convertTreeToTreeSelect(treeData)}
              treeDefaultExpandAll
              allowClear
            />
          </Form.Item>

          <Form.Item label="标签" name="tags">
            <Select
              mode="tags"
              allowClear
              placeholder="为所有文件统一设置标签（可选）"
              tokenSeparators={[',', ' ']}
              options={(Array.isArray(tagOptions) ? tagOptions : []).map((t) => ({
                label: t.name,
                value: t.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="选择多个文件"
            required
            validateStatus={!multiUploadFiles.length ? 'error' : ''}
            help={!multiUploadFiles.length ? '请至少选择一个文件' : ''}
          >
            <Upload
              multiple
              beforeUpload={(file) => {
                // file -> 原始 File 对象，带 uid
                setMultiUploadFiles((prev) => [...prev, file]);
                return false; // 阻止自动上传
              }}
              fileList={multiUploadFiles}
              onRemove={(file) => {
                setMultiUploadFiles((prev) =>
                  prev.filter((f) => f.uid !== file.uid),
                );
              }}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
            
            {multiUploading && (
              <div style={{ marginTop: 8 }}>
                <Progress percent={multiUploadProgress} size="small" />
              </div>
            )}
          </Form.Item>
        </Form>
      </Modal>


      {/* 编辑标签弹窗 */}
      <Modal
        title={editingFile ? `编辑标签：${editingFile.name}` : '编辑标签'}
        open={editTagsModalVisible}
        onOk={handleEditTagsOk}
        onCancel={handleEditTagsCancel}
        destroyOnClose
      >
        <Select
          mode="tags"
          allowClear
          style={{ width: '100%' }}
          placeholder="选择或输入标签"
          value={editingTags}
          onChange={setEditingTags}
          tokenSeparators={[',', ' ']}
          options={(Array.isArray(tagOptions) ? tagOptions : []).map((t) => ({
            label: t.name,
            value: t.name,
          }))}
        />
      </Modal>

      {/* 重命名目录弹窗 */}
      <Modal
        title={`重命名目录：${editingFolderName}`}
        open={renameFolderModalVisible}
        onOk={handleRenameFolderOk}
        onCancel={handleRenameFolderCancel}
        confirmLoading={renamingFolder}
        destroyOnClose
      >
        <Input
          value={editingFolderName}
          onChange={(e) => setEditingFolderName(e.target.value)}
          placeholder="输入新的目录名称"
        />
      </Modal>

      {/* 新建目录弹窗 */}
      <Modal
        title="新建目录"
        open={folderModalVisible}
        onOk={handleFolderOk}
        onCancel={handleFolderCancel}
        confirmLoading={creatingFolder}
        destroyOnClose
      >
        <Form layout="vertical" form={folderForm}>
          <Form.Item
            label="目录名称"
            name="name"
            rules={[{ required: true, message: '请输入目录名称' }]}
          >
            <Input placeholder="例如：施工方案 / 合同文件" />
          </Form.Item>

          <Form.Item label="父目录" name="parent_id">
            <TreeSelect
              allowClear
              placeholder="不选则为根目录"
              treeData={convertTreeToTreeSelect(treeData)}
              treeDefaultExpandAll
            />
          </Form.Item>

          <Form.Item label="排序值" name="sort_order">
            <Input type="number" placeholder="可选，默认 0" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default KnowledgeBasePage;
