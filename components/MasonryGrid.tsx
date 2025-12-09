import React, { useMemo } from 'react';
import { useWindowSize } from '../hooks/useWindowSize';

interface MasonryGridProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  getItemAspectRatio: (item: T) => number;
  columns?: number;
  gap?: number;
  className?: string;
}

const MasonryGrid = <T,>({
  items,
  renderItem,
  getItemAspectRatio,
  columns: defaultColumns = 3,
  gap = 16,
  className = ''
}: MasonryGridProps<T>) => {
  const { width } = useWindowSize();

  // Dynamic Column Logic
  const columns = useMemo(() => {
    if (width < 640) return 1; // Mobile
    if (width < 1024) return 2; // Tablet
    return defaultColumns; // Desktop (default)
  }, [width, defaultColumns]);

  const columnWrapper = useMemo(() => {
    const cols: T[][] = Array.from({ length: columns }, () => []);
    const colHeights = new Array(columns).fill(0);

    items.forEach((item) => {
      // Find the shortest column
      let minHeight = colHeights[0];
      let minColIndex = 0;

      for (let i = 1; i < columns; i++) {
        if (colHeights[i] < minHeight) {
          minHeight = colHeights[i];
          minColIndex = i;
        }
      }

      // Add item to that column
      cols[minColIndex].push(item);

      // Update column height
      // Height = Width / AspectRatio
      // We assume column width is constant (1 unit), so height added is 1 / aspectRatio
      const ratio = getItemAspectRatio(item) || 1;
      colHeights[minColIndex] += (1 / ratio);
    });

    return cols;
  }, [items, columns, getItemAspectRatio]);

  return (
    <div className={`flex w-full ${className}`} style={{ gap: `${gap}px` }}>
      {columnWrapper.map((colItems, colIndex) => (
        <div key={colIndex} className="flex flex-col flex-1" style={{ gap: `${gap}px` }}>
          {colItems.map((item, itemIndex) => (
            <React.Fragment key={itemIndex}>
              {renderItem(item)}
            </React.Fragment>
          ))}
        </div>
      ))}
    </div>
  );
};

export default MasonryGrid;
