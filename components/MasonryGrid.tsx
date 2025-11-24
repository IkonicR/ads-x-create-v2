
import React, { useMemo } from 'react';

interface MasonryGridProps {
  children: React.ReactNode[];
  columns?: number;
  gap?: number;
}

const MasonryGrid: React.FC<MasonryGridProps> = React.memo(({ children, columns = 3, gap = 16 }) => {
  
  const columnWrapper = useMemo(() => {
    const cols: React.ReactNode[][] = Array.from({ length: columns }, () => []);
    
    React.Children.forEach(children, (child, i) => {
      const columnIndex = i % columns;
      cols[columnIndex].push(child);
    });
    
    return cols;
  }, [children, columns]);

  return (
    <div className="flex w-full" style={{ gap: `${gap}px` }}>
      {columnWrapper.map((colChildren, colIndex) => (
        <div key={colIndex} className="flex flex-col flex-1" style={{ gap: `${gap}px` }}>
          {colChildren}
        </div>
      ))}
    </div>
  );
});

export default MasonryGrid;
