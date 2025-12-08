import React, { useState } from 'react';
import { Button, Card } from 'antd';
import RichTextEditorTiptap from '../../components/richtext/RichTextEditorTiptap';

const TiptapDemoPage = () => {
  const [content, setContent] = useState('<p>这里是 Tiptap 富文本编辑器初始内容</p>');

  const handleSave = () => {
    console.log('要保存的 HTML：', content);
    // TODO: 调后端 API 保存
  };

  return (
    <div style={{ padding: 24 }}>
      <Card title="Tiptap 富文本编辑器示例">
        <RichTextEditorTiptap value={content} onChange={setContent} height={400} />
        <Button type="primary" onClick={handleSave} style={{ marginTop: 16 }}>
          保存
        </Button>
      </Card>
    </div>
  );
};

export default TiptapDemoPage;
