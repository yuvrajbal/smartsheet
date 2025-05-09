import React, { useState } from 'react';
import type { Row, Column } from '../store/smartSheetStorage';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useSpreadsheetStore } from '../store/smartSheetStorage';
import type { AutomatedColumn } from './Sheet';
import { ClipLoader } from 'react-spinners';

interface SmartSheetGridProps {
  data: Row[];
  columns: Column[];
  automatedColumns?: AutomatedColumn[];
  selectedRows: number[];
  selectedColumns: string[];
  onRowSelect: (rowIndex: number, multiSelect?: boolean) => void;
  // onOpenColumnOverlay: () => void;
  // setCurrentCell?: React.Dispatch<React.SetStateAction<{value: string}>>;
  processingColumnIds?: string[];
  isProcessing?: boolean;
}

const SmartSheetGrid: React.FC<SmartSheetGridProps> = ({
  data,
  columns,
  automatedColumns = [],
  selectedRows,
  selectedColumns,
  onRowSelect,
  // onOpenColumnOverlay,
  // setCurrentCell,
  processingColumnIds = [],
  isProcessing = false
}) => {
  const { updateCell, addRow } = useSpreadsheetStore();
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnId: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleCellClick = (rowIndex: number, columnId: string, currentValue: string) => {
    setEditingCell({ rowIndex, columnId });
    setEditValue(currentValue);
    
  
  };

  const handleCellBlur = () => {
    if (editingCell) {
      updateCell(editingCell.rowIndex, editingCell.columnId, editValue);
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const handleAddRow = () => {
    addRow();
  };
  
  const isColumnAutomated = (columnId: string): boolean => {
    return automatedColumns.some(col => col.columnId === columnId);
  };
  
  
 

  return (
    <>
      {data.map((row, rowIndex) => (
        <tr 
          key={row.id} 
          className={` 
            ${selectedRows.includes(rowIndex) 
              ? 'bg-blue-50 dark:bg-blue-900/30 text-black dark:text-white' : 'bg-white dark:bg-gray-800 text-black dark:text-white'
            }
          `}
        >
          {/* Row number cell */}
          <td
            className="w-12 p-1 border-r-2 border-r-gray-400 dark:border-r-gray-500 border-b 
                      border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 sticky left-0 
                      cursor-pointer select-none text-center shadow-sm font-medium"
            onClick={(e) => onRowSelect(rowIndex, e.ctrlKey || e.metaKey)}
          >
            {rowIndex + 1}
          </td>

          {/* Data cells */}
          {columns.map((column) => {
            const cell = row.cells[column.id] || { value: '' };
            const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.columnId === column.id;
            const isSelectedCell = selectedRows.includes(rowIndex) && selectedColumns.includes(column.id);
            const isAutomated = isColumnAutomated(column.id);
            const isProcessingThisColumn = isProcessing && processingColumnIds.includes(column.id);

            return (
              <td
                key={column.id}
                className={`px-2 py-1 border-r border-b min-w-[120px]
                  border-gray-300 dark:border-gray-600 ${
                  isSelectedCell ? 'bg-blue-100 dark:bg-blue-800/50' : 
                  selectedColumns.includes(column.id) ? 'bg-blue-50 dark:bg-blue-900/30' : 
                  isAutomated ? 'bg-purple-50/50 dark:bg-purple-900/30' : ''
                }`}
                onClick={() => handleCellClick(rowIndex, column.id, cell.value)}
              >
                {isEditing ? (
                  <input
                    className="w-full h-full outline-none px-1 bg-inherit dark:text-white"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleCellBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                ) : isProcessingThisColumn ? (
                  <div className="flex items-center justify-center h-full py-1">
                    <ClipLoader size={15} color="#3B82F6" />
                  </div>
                ) : (
                  <div className="truncate w-full">
                    {cell.value}
                  </div>
                )}
              </td>
            );
          })}

          {/* Empty cell at the end of each row */}
          <td className="border-r border-b border-gray-300 dark:border-gray-600 w-10 min-w-10" />
        </tr>
      ))}

      {/* Add row button at the bottom */}
      <tr 
        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={handleAddRow}
      >
        <td className="w-12 border-r-2 border-r-gray-400 dark:border-r-gray-500 border-b 
                      border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 dark:hover:bg-gray-700 
                      sticky left-0 py-1 text-center shadow-sm">
          <PlusIcon className="h-5 w-5 mx-auto" />
        </td>
        
        {/* Empty cells for the rest of the row */}
        {columns.map((column) => (
          <td
            key={column.id}
            className="border-r border-b border-gray-300 dark:border-gray-600 min-w-[120px]"
          />
        ))}
        
        <td className="border-r border-b border-gray-300 dark:border-gray-600 w-10 min-w-10" />
      </tr>
    </>
  );
};

export default SmartSheetGrid;
