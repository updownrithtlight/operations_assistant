// src/components/TableSizePicker.jsx
import React, { useState } from 'react';

const MAX_ROWS = 10;
const MAX_COLS = 10;

/**
 * 表格尺寸选择器（类似 Word 的小方格）
 * props:
 *  - onSelect: (rows: number, cols: number) => void
 */
const TableSizePicker = ({ onSelect }) => {
  const [hoverRow, setHoverRow] = useState(0);
  const [hoverCol, setHoverCol] = useState(0);

  const rows = Array.from({ length: MAX_ROWS }, (_, i) => i);
  const cols = Array.from({ length: MAX_COLS }, (_, i) => i);

  const handleCellEnter = (r, c) => {
    setHoverRow(r);
    setHoverCol(c);
  };

  const handleClick = () => {
    const rowsCount = hoverRow + 1;
    const colsCount = hoverCol + 1;
    onSelect?.(rowsCount, colsCount);
  };

  return (
    <div style={{ padding: 8 }}>
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
        onClick={handleClick}
      >
        {rows.map((r) =>
          cols.map((c) => {
            const active = r <= hoverRow && c <= hoverCol;
            return (
              <div
                key={`${r}-${c}`}
                onMouseEnter={() => handleCellEnter(r, c)}
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
