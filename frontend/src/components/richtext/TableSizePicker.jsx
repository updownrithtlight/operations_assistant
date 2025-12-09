// src/components/TableSizePicker.jsx
import React, { useState, useEffect, useCallback } from 'react';

const MAX_ROWS = 10;
const MAX_COLS = 10;

/**
 * 表格尺寸选择器（类似 Word / TinyMCE）
 * - 鼠标移入：预览高亮
 * - 按住左键拖动：实时改变选择
 * - 松开左键：触发 onSelect(rows, cols)
 */
const TableSizePicker = ({ onSelect }) => {
  const [hoverRow, setHoverRow] = useState(0);
  const [hoverCol, setHoverCol] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const rows = Array.from({ length: MAX_ROWS }, (_, i) => i);
  const cols = Array.from({ length: MAX_COLS }, (_, i) => i);

  const updateHover = (r, c) => {
    setHoverRow(r);
    setHoverCol(c);
  };

  const handleMouseDown = (r, c, e) => {
    e.preventDefault(); // 防止文本选中
    setIsDragging(true);
    updateHover(r, c);
  };

  const handleCellEnter = (r, c) => {
    // 悬停时也要更新（这样即使先 move 后按住，也有预览效果）
    updateHover(r, c);
  };

  const finishSelect = useCallback(() => {
    if (!isDragging) return;
    const rowsCount = hoverRow + 1;
    const colsCount = hoverCol + 1;
    onSelect?.(rowsCount, colsCount);
    setIsDragging(false);
  }, [isDragging, hoverRow, hoverCol, onSelect]);

  // 监听全局 mouseup，保证在网格外松开也能结束选择
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseUp = (e) => {
      // 只处理左键
      if (e.button !== 0) return;
      finishSelect();
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, finishSelect]);

  return (
    <div style={{ padding: 8, userSelect: 'none' }}>
      <div style={{ marginBottom: 6, fontSize: 12 }}>
        {hoverRow + 1} 行 × {hoverCol + 1} 列
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${MAX_COLS}, 16px)`,
          gridTemplateRows: `repeat(${MAX_ROWS}, 16px)`,
          gap: 2,
          cursor: 'pointer',
        }}
      >
        {rows.map((r) =>
          cols.map((c) => {
            const active = r <= hoverRow && c <= hoverCol;
            return (
              <div
                key={`${r}-${c}`}
                onMouseEnter={() => handleCellEnter(r, c)}
                onMouseDown={(e) => handleMouseDown(r, c, e)}
                style={{
                  width: 16,
                  height: 16,
                  border: '1px solid #d9d9d9',
                  backgroundColor: active ? '#ffd591' : '#ffffff',
                }}
              />
            );
          }),
        )}
      </div>
    </div>
  );
};

export default TableSizePicker;
