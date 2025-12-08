// src/components/richtext/MenuBar.jsx
import React, { useState } from 'react';
import {
  Button,
  Dropdown,
  Modal,
  Space,
  Input,
  message,
  Select,
} from 'antd';
import {
  FileOutlined,
  EyeOutlined,
  PrinterOutlined,
  UndoOutlined,
  RedoOutlined,
  ScissorOutlined,
  CopyOutlined,
  SnippetsOutlined,
  SearchOutlined,
  PictureOutlined,
  LinkOutlined,
  TableOutlined,
  MinusOutlined,
  ClockCircleOutlined,
  // Format 菜单相关图标
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  CodeOutlined,
//   SuperscriptOutlined,
//   SubscriptOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  FontColorsOutlined,
  ClearOutlined,
} from '@ant-design/icons';

import TableSizePicker from './TableSizePicker';

/**
 * 顶部菜单栏：File / Edit / Insert / Format
 *
 * props:
 *  - editor: Tiptap editor 实例
 *  - onImageUpload?: (file: File) => Promise<void> | void   // 图片上传逻辑（MinIO）
 */
const MenuBar = ({ editor, onImageUpload }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  // Insert -> Link
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkTarget, setLinkTarget] = useState('_self');

  // Insert -> Table
  const [tableModalOpen, setTableModalOpen] = useState(false);

  if (!editor) return null;

  // =========================================================
  // File
  // =========================================================
  const fileMenuItems = [
    {
      key: 'file:new',
      label: (
        <span>
          <FileOutlined style={{ marginRight: 6 }} />
          New document
        </span>
      ),
    },
    {
      key: 'file:preview',
      label: (
        <span>
          <EyeOutlined style={{ marginRight: 6 }} />
          Preview
        </span>
      ),
    },
    {
      key: 'file:print',
      label: (
        <span>
          <PrinterOutlined style={{ marginRight: 6 }} />
          Print…{' '}
          <span style={{ marginLeft: 4, color: '#999' }}>Ctrl+P</span>
        </span>
      ),
    },
  ];

  const handleFileMenuClick = ({ key }) => {
    const chain = editor.chain().focus();

    switch (key) {
      case 'file:new':
        chain.clearContent().run();
        break;
      case 'file:preview':
        setPreviewOpen(true);
        break;
      case 'file:print': {
        const html = editor.getHTML();
        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(
          `<html><head><title>Print</title></head><body>${html}</body></html>`,
        );
        win.document.close();
        win.focus();
        win.print();
        break;
      }
      default:
        break;
    }
  };

  // =========================================================
  // Edit
  // =========================================================
  const canUndo = editor.can().chain().focus().undo().run();
  const canRedo = editor.can().chain().focus().redo().run();

  const editMenuItems = [
    {
      key: 'edit:undo',
      label: (
        <span>
          <UndoOutlined style={{ marginRight: 6 }} />
          Undo
          <span style={{ float: 'right', color: '#999', marginLeft: 24 }}>
            Ctrl+Z
          </span>
        </span>
      ),
      disabled: !canUndo,
    },
    {
      key: 'edit:redo',
      label: (
        <span>
          <RedoOutlined style={{ marginRight: 6 }} />
          Redo
          <span style={{ float: 'right', color: '#999', marginLeft: 24 }}>
            Ctrl+Y
          </span>
        </span>
      ),
      disabled: !canRedo,
    },
    { type: 'divider', key: 'e1' },
    {
      key: 'edit:cut',
      label: (
        <span>
          <ScissorOutlined style={{ marginRight: 6 }} />
          Cut
          <span style={{ float: 'right', color: '#999', marginLeft: 24 }}>
            Ctrl+X
          </span>
        </span>
      ),
    },
    {
      key: 'edit:copy',
      label: (
        <span>
          <CopyOutlined style={{ marginRight: 6 }} />
          Copy
          <span style={{ float: 'right', color: '#999', marginLeft: 24 }}>
            Ctrl+C
          </span>
        </span>
      ),
    },
    {
      key: 'edit:paste',
      label: (
        <span>
          <SnippetsOutlined style={{ marginRight: 6 }} />
          Paste
          <span style={{ float: 'right', color: '#999', marginLeft: 24 }}>
            Ctrl+V
          </span>
        </span>
      ),
    },
    {
      key: 'edit:pastePlain',
      label: (
        <span>
          <SnippetsOutlined style={{ marginRight: 6 }} />
          Paste as text
        </span>
      ),
    },
    { type: 'divider', key: 'e2' },
    {
      key: 'edit:selectAll',
      label: (
        <span>
          Select all
          <span style={{ float: 'right', color: '#999', marginLeft: 24 }}>
            Ctrl+A
          </span>
        </span>
      ),
    },
    { type: 'divider', key: 'e3' },
    {
      key: 'edit:findReplace',
      label: (
        <span>
          <SearchOutlined style={{ marginRight: 6 }} />
          Find and replace…
          <span style={{ float: 'right', color: '#999', marginLeft: 24 }}>
            Ctrl+F
          </span>
        </span>
      ),
    },
  ];

  const handleEditMenuClick = async ({ key }) => {
    const chain = editor.chain().focus();

    switch (key) {
      case 'edit:undo':
        chain.undo().run();
        break;
      case 'edit:redo':
        chain.redo().run();
        break;
      case 'edit:cut':
        document.execCommand('cut');
        break;
      case 'edit:copy':
        document.execCommand('copy');
        break;
      case 'edit:paste':
        document.execCommand('paste');
        break;
      case 'edit:pastePlain': {
        try {
          const text = await navigator.clipboard.readText();
          editor.chain().focus().insertContent(text).run();
        } catch {
          message.warning('无法访问剪贴板，请使用 Ctrl+V 粘贴');
        }
        break;
      }
      case 'edit:selectAll':
        chain.selectAll().run();
        break;
      case 'edit:findReplace':
        setFindReplaceOpen(true);
        break;
      default:
        break;
    }
  };

  // =========================================================
  // Insert
  // =========================================================

  // 图片选择 -> 交给外部上传逻辑
  const triggerImageSelect = () => {
    if (!onImageUpload) {
      message.warning('尚未提供图片上传处理函数');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (file) onImageUpload(file);
    };
    input.click();
  };

  // 打开链接弹窗
  const openLinkDialog = () => {
    const attrs = editor.getAttributes('link') || {};
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');

    setLinkUrl(attrs.href || '');
    setLinkTitle(attrs.title || '');
    setLinkTarget(attrs.target || '_self');
    setLinkText(selectedText || attrs.href || '');
    setLinkModalOpen(true);
  };

  const handleLinkOk = () => {
    if (!linkUrl) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setLinkModalOpen(false);
      return;
    }

    const attrs = {
      href: linkUrl,
      title: linkTitle || undefined,
      target: linkTarget,
    };

    const { empty } = editor.state.selection;
    const chain = editor.chain().focus();

    if (!empty) {
      chain.extendMarkRange('link').setLink(attrs).run();
    } else {
      const text = linkText || linkUrl;
      chain
        .insertContent({
          type: 'text',
          text,
          marks: [{ type: 'link', attrs }],
        })
        .run();
    }

    setLinkModalOpen(false);
  };

  const formatDateTime = (mode) => {
    const now = new Date();
    switch (mode) {
      case 'time':
        return now.toLocaleTimeString('zh-CN', { hour12: false });
      case 'date':
        return now.toISOString().slice(0, 10);
      case 'datetime':
        return `${now.toISOString().slice(0, 10)} ${now
          .toTimeString()
          .slice(0, 8)}`;
      case 'us-date':
        return now.toLocaleDateString('en-US');
      default:
        return now.toString();
    }
  };

  const insertMenuItems = [
    {
      key: 'insert:image',
      label: (
        <span>
          <PictureOutlined style={{ marginRight: 6 }} />
          Image…
        </span>
      ),
    },
    {
      key: 'insert:link',
      label: (
        <span>
          <LinkOutlined style={{ marginRight: 6 }} />
          Link…
          <span style={{ float: 'right', color: '#999', marginLeft: 24 }}>
            Ctrl+K
          </span>
        </span>
      ),
    },
    {
      key: 'insert:media',
      label: (
        <span>
          <SnippetsOutlined style={{ marginRight: 6 }} />
          Media…
        </span>
      ),
      disabled: true,
    },
    {
      key: 'insert:table',
      label: (
        <span>
          <TableOutlined style={{ marginRight: 6 }} />
          Table…
        </span>
      ),
    },
    { type: 'divider', key: 'i1' },
    {
      key: 'insert:hr',
      label: (
        <span>
          <MinusOutlined style={{ marginRight: 6 }} />
          Horizontal line
        </span>
      ),
    },
    { type: 'divider', key: 'i2' },
    {
      key: 'insert:datetime',
      label: (
        <span>
          <ClockCircleOutlined style={{ marginRight: 6 }} />
          Date/time
        </span>
      ),
      children: [
        { key: 'insert:dt:time', label: '16:47:09' },
        { key: 'insert:dt:date', label: '2025-12-08' },
        { key: 'insert:dt:datetime', label: '2025-12-08 16:47:09' },
        { key: 'insert:dt:us-date', label: '12/08/2025' },
      ],
    },
  ];

  const handleInsertMenuClick = ({ key }) => {
    const chain = editor.chain().focus();

    if (key.startsWith('insert:dt:')) {
      const mode = key.split(':')[2];
      const text = formatDateTime(mode);
      chain.insertContent(text).run();
      return;
    }

    switch (key) {
      case 'insert:image':
        triggerImageSelect();
        break;
      case 'insert:link':
        openLinkDialog();
        break;
      case 'insert:table':
        setTableModalOpen(true);
        break;
      case 'insert:hr':
        chain.setHorizontalRule().run();
        break;
      default:
        break;
    }
  };

  // =========================================================
  // Format
  // =========================================================

  const formatMenuItems = [
    // 顶部：Bold / Italic / Underline / Strike / Sup/Sub / Code
    {
      key: 'fmt:bold',
      label: (
        <span>
          <BoldOutlined style={{ marginRight: 6 }} />
          Bold
          <span style={{ float: 'right', color: '#999', marginLeft: 24 }}>
            Ctrl+B
          </span>
        </span>
      ),
    },
    {
      key: 'fmt:italic',
      label: (
        <span>
          <ItalicOutlined style={{ marginRight: 6 }} />
          Italic
          <span style={{ float: 'right', color: '#999', marginLeft: 24 }}>
            Ctrl+I
          </span>
        </span>
      ),
    },
    {
      key: 'fmt:underline',
      label: (
        <span>
          <UnderlineOutlined style={{ marginRight: 6 }} />
          Underline
          <span style={{ float: 'right', color: '#999', marginLeft: 24 }}>
            Ctrl+U
          </span>
        </span>
      ),
    },
    {
      key: 'fmt:strike',
      label: (
        <span>
          <StrikethroughOutlined style={{ marginRight: 6 }} />
          Strikethrough
        </span>
      ),
    },
    {
      key: 'fmt:sup',
      label: (
        <span>
          {/* <SuperscriptOutlined style={{ marginRight: 6 }} /> */}
          Superscript
        </span>
      ),
    },
    {
      key: 'fmt:sub',
      label: (
        <span>
          {/* <SubscriptOutlined style={{ marginRight: 6 }} /> */}
          Subscript
        </span>
      ),
    },
    {
      key: 'fmt:code',
      label: (
        <span>
          <CodeOutlined style={{ marginRight: 6 }} />
          Code
        </span>
      ),
    },

    { type: 'divider', key: 'f1' },

    // Formats 子菜单：段落 / 标题
    {
      key: 'fmt:formats',
      label: 'Formats',
      children: [
        { key: 'fmt:format:p', label: 'Paragraph' },
        { key: 'fmt:format:h1', label: 'Heading 1' },
        { key: 'fmt:format:h2', label: 'Heading 2' },
        { key: 'fmt:format:h3', label: 'Heading 3' },
      ],
    },

    // Align 子菜单
    {
      key: 'fmt:align',
      label: 'Align',
      children: [
        {
          key: 'fmt:align:left',
          label: (
            <span>
              <AlignLeftOutlined style={{ marginRight: 6 }} />
              Left
            </span>
          ),
        },
        {
          key: 'fmt:align:center',
          label: (
            <span>
              <AlignCenterOutlined style={{ marginRight: 6 }} />
              Center
            </span>
          ),
        },
        {
          key: 'fmt:align:right',
          label: (
            <span>
              <AlignRightOutlined style={{ marginRight: 6 }} />
              Right
            </span>
          ),
        },
      ],
    },

    // Text color 子菜单：简单预设
    {
      key: 'fmt:textColor',
      label: (
        <span>
          <FontColorsOutlined style={{ marginRight: 6 }} />
          Text color
        </span>
      ),
      children: [
        {
          key: 'fmt:color:auto',
          label: (
            <span>
              <ClearOutlined style={{ marginRight: 6 }} />
              Default color
            </span>
          ),
        },
        { key: 'fmt:color:red', label: 'Red' },
        { key: 'fmt:color:blue', label: 'Blue' },
        { key: 'fmt:color:green', label: 'Green' },
      ],
    },
  ];

  const handleFormatMenuClick = ({ key }) => {
    const chain = editor.chain().focus();

    // Text color
    if (key.startsWith('fmt:color:')) {
      const colorKey = key.split(':')[2];
      if (colorKey === 'auto') {
        chain.unsetColor().run();
      } else {
        const map = {
          red: '#ff4d4f',
          blue: '#1890ff',
          green: '#52c41a',
        };
        chain.setColor(map[colorKey] || '#000000').run();
      }
      return;
    }

    // Formats -> 段落 / 标题
    if (key.startsWith('fmt:format:')) {
      const type = key.split(':')[2];
      if (type === 'p') {
        chain.setParagraph().run();
      } else {
        const level = Number(type.slice(1));
        chain.toggleHeading({ level }).run();
      }
      return;
    }

    // Align
    if (key.startsWith('fmt:align:')) {
      const pos = key.split(':')[2]; // left / center / right
      chain.setTextAlign(pos).run();
      return;
    }

    switch (key) {
      case 'fmt:bold':
        chain.toggleBold().run();
        break;
      case 'fmt:italic':
        chain.toggleItalic().run();
        break;
      case 'fmt:underline':
        chain.toggleUnderline().run();
        break;
      case 'fmt:strike':
        chain.toggleStrike().run();
        break;
      case 'fmt:code':
        chain.toggleCode().run();
        break;
      case 'fmt:sup':
        chain.toggleSuperscript
          ? chain.toggleSuperscript().run()
          : chain.setSuperscript && chain.setSuperscript().run();
        break;
      case 'fmt:sub':
        chain.toggleSubscript
          ? chain.toggleSubscript().run()
          : chain.setSubscript && chain.setSubscript().run();
        break;
      default:
        break;
    }
  };

  // =========================================================
  // Find & replace（简单全部替换）
  // =========================================================
  const handleReplaceAll = () => {
    if (!findText) return;
    const html = editor.getHTML();
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const reg = new RegExp(escaped, 'g');
    const newHtml = html.replace(reg, replaceText);
    editor.commands.setContent(newHtml, false);
    setFindReplaceOpen(false);
  };

  // =========================================================
  // 渲染
  // =========================================================
  return (
    <>
      {/* 顶部菜单栏 */}
      <div style={{ marginBottom: 4 }}>
        <Space size={8}>
          <Dropdown
            trigger={['click']}
            menu={{ items: fileMenuItems, onClick: handleFileMenuClick }}
          >
            <Button type="text" size="small">
              File
            </Button>
          </Dropdown>

          <Dropdown
            trigger={['click']}
            menu={{ items: editMenuItems, onClick: handleEditMenuClick }}
          >
            <Button type="text" size="small">
              Edit
            </Button>
          </Dropdown>

          <Dropdown
            trigger={['click']}
            menu={{ items: insertMenuItems, onClick: handleInsertMenuClick }}
          >
            <Button type="text" size="small">
              Insert
            </Button>
          </Dropdown>

          <Dropdown
            trigger={['click']}
            menu={{ items: formatMenuItems, onClick: handleFormatMenuClick }}
          >
            <Button type="text" size="small">
              Format
            </Button>
          </Dropdown>

          {/* 之后可以继续加 Tools / Table / Help */}
        </Space>
      </div>

      {/* File -> Preview */}
      <Modal
        title="预览"
        open={previewOpen}
        width={800}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
        <div
          style={{
            padding: 12,
            border: '1px solid #f0f0f0',
            maxHeight: '60vh',
            overflow: 'auto',
          }}
          dangerouslySetInnerHTML={{
            __html: editor ? editor.getHTML() : '',
          }}
        />
      </Modal>

      {/* Edit -> Find and replace */}
      <Modal
        title="Find and replace"
        open={findReplaceOpen}
        onCancel={() => setFindReplaceOpen(false)}
        onOk={handleReplaceAll}
        okText="Replace all"
        cancelText="Cancel"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ marginBottom: 4 }}>Find</div>
            <Input
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              placeholder="输入要查找的内容"
            />
          </div>
          <div>
            <div style={{ marginBottom: 4 }}>Replace with</div>
            <Input
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="替换成..."
            />
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>
            当前为简单“全部替换”，区分大小写；后面可以再做逐个高亮那种高级版。
          </div>
        </div>
      </Modal>

      {/* Insert -> Link dialog */}
      <Modal
        title="Insert/Edit Link"
        open={linkModalOpen}
        onCancel={() => setLinkModalOpen(false)}
        onOk={handleLinkOk}
        okText="Save"
        cancelText="Cancel"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ marginBottom: 4 }}>URL</div>
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <div>
            <div style={{ marginBottom: 4 }}>Text to display</div>
            <Input
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="显示文本（无选区时有效）"
            />
          </div>
          <div>
            <div style={{ marginBottom: 4 }}>Title</div>
            <Input
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              placeholder="可选：悬停提示"
            />
          </div>
          <div>
            <div style={{ marginBottom: 4 }}>Open link in…</div>
            <Select
              style={{ width: '100%' }}
              value={linkTarget}
              onChange={setLinkTarget}
              options={[
                { label: 'Current window', value: '_self' },
                { label: 'New window', value: '_blank' },
              ]}
            />
          </div>
        </div>
      </Modal>

      {/* Insert -> Table */}
      <Modal
        title="Insert table"
        open={tableModalOpen}
        footer={null}
        onCancel={() => setTableModalOpen(false)}
      >
        <TableSizePicker
          onSelect={(rows, cols) => {
            editor
              .chain()
              .focus()
              .insertTable({ rows, cols, withHeaderRow: true })
              .run();
            setTableModalOpen(false);
          }}
        />
      </Modal>
    </>
  );
};

export default MenuBar;
