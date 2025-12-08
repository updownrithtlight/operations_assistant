// src/components/ColorPalette.jsx
import React from 'react';

// 颜色分组
const COLOR_GROUPS = {
  theme: [
    '#000000',
    '#262626',
    '#595959',
    '#8c8c8c',
    '#bfbfbf',
    '#d9d9d9',
    '#f0f0f0',
    '#ffffff',
  ],
  standard: [
    '#ff4d4f',
    '#fa8c16',
    '#fadb14',
    '#52c41a',
    '#13c2c2',
    '#1890ff',
    '#2f54eb',
    '#722ed1',
  ],
};

/**
 * 颜色面板（类似 Word 简单色块）
 * props:
 *  - value: 当前选中的颜色（string | null）
 *  - onSelect: (color: string | 'auto') => void
 *  - onMore: () => void   // 点击“更多颜色…”
 */
const ColorPalette = ({ value, onSelect, onMore }) => {
  return (
    <div style={{ padding: 8, maxWidth: 260 }}>
      {/* 自动 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 6,
          cursor: 'pointer',
        }}
        onClick={() => onSelect('auto')}
      >
        <div
          style={{
            width: 18,
            height: 18,
            border: '1px solid #d9d9d9',
            marginRight: 6,
            background:
              'linear-gradient(45deg, #fff 0, #fff 45%, #f5222d 45%, #f5222d 55%, #fff 55%, #fff 100%)',
          }}
        />
        <span style={{ fontSize: 12 }}>自动（默认颜色）</span>
      </div>

      {/* 主题颜色 */}
      <div style={{ fontSize: 12, margin: '4px 0' }}>主题颜色</div>
      <div style={{ display: 'flex', marginBottom: 6 }}>
        {COLOR_GROUPS.theme.map((c) => (
          <div
            key={c}
            onClick={() => onSelect(c)}
            style={{
              width: 18,
              height: 18,
              marginRight: 4,
              border:
                value === c ? '2px solid #1677ff' : '1px solid #d9d9d9',
              backgroundColor: c,
              cursor: 'pointer',
            }}
          />
        ))}
      </div>

      {/* 标准颜色 */}
      <div style={{ fontSize: 12, margin: '4px 0' }}>标准颜色</div>
      <div style={{ display: 'flex', marginBottom: 4 }}>
        {COLOR_GROUPS.standard.map((c) => (
          <div
            key={c}
            onClick={() => onSelect(c)}
            style={{
              width: 18,
              height: 18,
              marginRight: 4,
              border:
                value === c ? '2px solid #1677ff' : '1px solid #d9d9d9',
              backgroundColor: c,
              cursor: 'pointer',
            }}
          />
        ))}
      </div>

      {/* 更多颜色 */}
      <div
        style={{
          marginTop: 6,
          fontSize: 12,
          color: '#1677ff',
          cursor: 'pointer',
          textAlign: 'center',
        }}
        onClick={onMore}
      >
        更多颜色…
      </div>
    </div>
  );
};

export default ColorPalette;
