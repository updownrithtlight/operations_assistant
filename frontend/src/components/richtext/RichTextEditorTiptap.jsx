// src/components/RichTextEditorTiptap.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Space,
  Popover,
  Select,
  Upload,
  Dropdown,
  Divider,
  message,
  Modal,
  ColorPicker,
} from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  LinkOutlined,
  CodeOutlined,
  TableOutlined,
  PictureOutlined,
  FontColorsOutlined,
  StrikethroughOutlined,
  DownOutlined,
} from '@ant-design/icons';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';

import TableSizePicker from './TableSizePicker';
import ColorPalette from './ColorPalette';
import MenuBar from './MenuBar';

import { uploadFile } from '../../api/minioUpload';
import request from '../../utils/request';

const DEFAULT_IMAGE_FILE_TYPE = 'RICH_TEXT_IMAGE';

const RichTextEditorTiptap = ({
  value,
  onChange,
  readOnly = false,
  height = 400,
  imageFileType = DEFAULT_IMAGE_FILE_TYPE,
}) => {
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          history: true,
        }),
        Underline,
        Link.configure({
          openOnClick: false,
        }),
        Image,
        TextStyle,
        Color,
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
      ],
      content: value || '<p></p>',
      editable: !readOnly,
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        onChange?.(html);
      },
    },
    [readOnly],
  );

  // 工具栏内部状态：表格尺寸选择、颜色选择
  const [tablePickerOpen, setTablePickerOpen] = useState(false);
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);
  const [colorModalOpen, setColorModalOpen] = useState(false);
  const [tempColor, setTempColor] = useState('#000000');

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value != null && value !== current) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  if (!editor) return null;

  // 当前标题类型
  const headingValue = useMemo(() => {
    if (editor.isActive('heading', { level: 1 })) return 'h1';
    if (editor.isActive('heading', { level: 2 })) return 'h2';
    if (editor.isActive('heading', { level: 3 })) return 'h3';
    if (editor.isActive('heading', { level: 4 })) return 'h4';
    if (editor.isActive('heading', { level: 5 })) return 'h5';
    if (editor.isActive('heading', { level: 6 })) return 'h6';

    return 'p';
  }, [editor]);

  const setHeading = (val) => {
    const chain = editor.chain().focus();
    if (val === 'p') {
      chain.setParagraph().run();
    } else {
      const level = Number(val.slice(1));
      chain.toggleHeading({ level }).run();
    }
  };

  // 链接
  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('输入链接地址', previousUrl || 'https://');

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  // 颜色
  const currentTextColor = editor.getAttributes('textStyle').color || null;

  const handleColorSelect = (color) => {
    const chain = editor.chain().focus();
    if (color === 'auto') {
      chain.unsetColor().run();
    } else {
      chain.setColor(color).run();
    }
    setColorPopoverOpen(false);
  };

  const handleOpenMoreColors = () => {
    const init = currentTextColor || '#000000';
    setTempColor(init);
    setColorPopoverOpen(false);
    setColorModalOpen(true);
  };

  const handleColorModalOk = () => {
    const chain = editor.chain().focus();
    chain.setColor(tempColor).run();
    setColorModalOpen(false);
  };

  // 图片上传
  const handleImageFile = async (file) => {
    const hide = message.loading('图片上传中...', 0);
    try {
      const documentId = await uploadFile(imageFileType, file, () => {});
      const { data } = await request.get(
        `/file/${documentId}/download-url`,
        { params: { mode: 'inline' } },
      );
      const url = data.downloadUrl;
      editor.chain().focus().setImage({ src: url }).run();
    } catch (e) {
      console.error(e);
      message.error('图片上传失败');
    } finally {
      hide();
    }
  };

  // 表格操作菜单
  const tableMenuItems = [
    { key: 'add-row-below', label: '在下方插入一行' },
    { key: 'add-row-above', label: '在上方插入一行' },
    { key: 'add-col-right', label: '在右侧插入一列' },
    { key: 'add-col-left', label: '在左侧插入一列' },
    { type: 'divider' },
    { key: 'delete-row', label: '删除当前行' },
    { key: 'delete-col', label: '删除当前列' },
    { key: 'delete-table', label: '删除整张表' },
    { type: 'divider' },
    { key: 'merge-cells', label: '合并单元格' },
    { key: 'split-cell', label: '拆分单元格' },
  ];

  const handleTableMenuClick = ({ key }) => {
    const chain = editor.chain().focus();
    switch (key) {
      case 'add-row-below':
        chain.addRowAfter().run();
        break;
      case 'add-row-above':
        chain.addRowBefore().run();
        break;
      case 'add-col-right':
        chain.addColumnAfter().run();
        break;
      case 'add-col-left':
        chain.addColumnBefore().run();
        break;
      case 'delete-row':
        chain.deleteRow().run();
        break;
      case 'delete-col':
        chain.deleteColumn().run();
        break;
      case 'delete-table':
        chain.deleteTable().run();
        break;
      case 'merge-cells':
        chain.mergeCells().run();
        break;
      case 'split-cell':
        chain.splitCell().run();
        break;
      default:
        break;
    }
  };

  const canUndo = editor.can().undo();
  const canRedo = editor.can().redo();

  return (
    <>
      <div
        className="rt-tiptap-wrapper"
        style={{
          border: '1px solid #e5e5e5',
          borderRadius: 4,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 工具栏 */}
        {!readOnly && (
          <div
            style={{
              borderBottom: '1px solid #f0f0f0',
              padding: 8,
              background: '#fafafa',
            }}
          >
            {/* 顶部菜单栏：File / Edit 拆出去 */}
            <MenuBar editor={editor} />

            {/* 主工具条 */}
            <Space wrap size={[4, 4]}>
              {/* 撤销 / 重做（和 Edit 菜单对应） */}
              <Button
                size="small"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!canUndo}
              >
                撤销
              </Button>
              <Button
                size="small"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!canRedo}
              >
                重做
              </Button>

              <Divider type="vertical" />

              {/* 标题下拉 */}
              <Select
                size="small"
                style={{ width: 110 }}
                value={headingValue}
                onChange={setHeading}
                options={[
                  { label: '正文', value: 'p' },
                  { label: '标题 1', value: 'h1' },
                  { label: '标题 2', value: 'h2' },
                  { label: '标题 3', value: 'h3' },
                  { label: '标题 4', value: 'h4' },
                  { label: '标题 5', value: 'h5' },
                  { label: '标题 6', value: 'h6' },
                ]}
              />

              <Divider type="vertical" />

              {/* 文本样式 */}
              <Button
                size="small"
                type={editor.isActive('bold') ? 'primary' : 'default'}
                icon={<BoldOutlined />}
                onClick={() => editor.chain().focus().toggleBold().run()}
              />
              <Button
                size="small"
                type={editor.isActive('italic') ? 'primary' : 'default'}
                icon={<ItalicOutlined />}
                onClick={() => editor.chain().focus().toggleItalic().run()}
              />
              <Button
                size="small"
                type={editor.isActive('underline') ? 'primary' : 'default'}
                icon={<UnderlineOutlined />}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
              />
              <Button
                size="small"
                type={editor.isActive('strike') ? 'primary' : 'default'}
                icon={<StrikethroughOutlined />}
                onClick={() => editor.chain().focus().toggleStrike().run()}
              />
              <Button
                size="small"
                type={editor.isActive('code') ? 'primary' : 'default'}
                icon={<CodeOutlined />}
                onClick={() => editor.chain().focus().toggleCode().run()}
              />

              {/* 字体颜色 */}
              <Popover
                trigger="click"
                open={colorPopoverOpen}
                onOpenChange={setColorPopoverOpen}
                content={
                  <ColorPalette
                    value={currentTextColor}
                    onSelect={handleColorSelect}
                    onMore={handleOpenMoreColors}
                  />
                }
              >
                <Button size="small" icon={<FontColorsOutlined />} />
              </Popover>

              <Divider type="vertical" />

              {/* 对齐 */}
              <Button
                size="small"
                type={
                  editor.isActive({ textAlign: 'left' }) ? 'primary' : 'default'
                }
                icon={<AlignLeftOutlined />}
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
              />
              <Button
                size="small"
                type={
                  editor.isActive({ textAlign: 'center' })
                    ? 'primary'
                    : 'default'
                }
                icon={<AlignCenterOutlined />}
                onClick={() =>
                  editor.chain().focus().setTextAlign('center').run()
                }
              />
              <Button
                size="small"
                type={
                  editor.isActive({ textAlign: 'right' })
                    ? 'primary'
                    : 'default'
                }
                icon={<AlignRightOutlined />}
                onClick={() =>
                  editor.chain().focus().setTextAlign('right').run()
                }
              />

              <Divider type="vertical" />

              {/* 列表 */}
              <Button
                size="small"
                type={editor.isActive('bulletList') ? 'primary' : 'default'}
                icon={<UnorderedListOutlined />}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
              />
              <Button
                size="small"
                type={editor.isActive('orderedList') ? 'primary' : 'default'}
                icon={<OrderedListOutlined />}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
              />

              <Divider type="vertical" />

              {/* 引用 / 分割线 */}
              <Button
                size="small"
                type={editor.isActive('blockquote') ? 'primary' : 'default'}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
              >
                引用
              </Button>
              <Button
                size="small"
                onClick={() =>
                  editor.chain().focus().setHorizontalRule().run()
                }
              >
                分割线
              </Button>

              <Divider type="vertical" />

              {/* 图片上传 */}
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={(file) => {
                  handleImageFile(file);
                  return false;
                }}
              >
                <Button size="small" icon={<PictureOutlined />}>
                  图片
                </Button>
              </Upload>

              {/* 表格：插入 + 操作 */}
              <Popover
                trigger="click"
                open={tablePickerOpen}
                onOpenChange={setTablePickerOpen}
                content={
                  <TableSizePicker
                    onSelect={(rows, cols) => {
                      editor
                        .chain()
                        .focus()
                        .insertTable({ rows, cols, withHeaderRow: true })
                        .run();
                      setTablePickerOpen(false);
                    }}
                  />
                }
              >
                <Button
                  size="small"
                  icon={<TableOutlined />}
                  onClick={() => setTablePickerOpen(true)}
                >
                  插入表格
                </Button>
              </Popover>

              <Dropdown
                menu={{ items: tableMenuItems, onClick: handleTableMenuClick }}
                disabled={!editor.isActive('table')}
              >
                <Button size="small">
                  表格操作 <DownOutlined />
                </Button>
              </Dropdown>
            </Space>
          </div>
        )}

        {/* 编辑区域 */}
        <div
          style={{
            padding: 12,
            minHeight: height,
            maxHeight: height,
            overflowY: 'auto',
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* 调色板 Modal */}
      <Modal
        title="选择颜色"
        open={colorModalOpen}
        onCancel={() => setColorModalOpen(false)}
        onOk={handleColorModalOk}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <ColorPicker
            value={tempColor}
            onChange={(value) => setTempColor(value.toHexString())}
            showText
          />
          <div style={{ fontSize: 12 }}>
            <div>当前颜色：{tempColor}</div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default RichTextEditorTiptap;
