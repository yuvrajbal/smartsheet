import React from 'react';
import { BoltIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { Column } from '../store/smartSheetStorage';
import type { AutomatedColumn } from './Sheet';

interface SheetHeaderProps {
  columns: Column[];
  automatedColumns?: AutomatedColumn[];
  selectedColumns: string[];
  onColumnSelect: (columnId: string, multiSelect?: boolean) => void;
  onAutomationClick?: (automation: AutomatedColumn) => void;
  onOpenColumnOverlay?: () => void;
}

const SheetHeader: React.FC<SheetHeaderProps> = ({ 
  columns, 
  automatedColumns = [],
  selectedColumns, 
  onColumnSelect,
  onAutomationClick,
  onOpenColumnOverlay,

}) => {
  

  const isColumnAutomated = (columnId: string): boolean => {
    const column = columns.find(col => col.id === columnId);
    const columnName = column?.name;
    
    return automatedColumns.some(
      col => col.columnId === columnId || (columnName && col.columnName === columnName)
    );
  };

  
  const getAutomationForColumn = (columnId: string): AutomatedColumn | undefined => {
    const column = columns.find(col => col.id === columnId);
    const columnName = column?.name;
    
    return automatedColumns.find(
      col => col.columnId === columnId || (columnName && col.columnName === columnName)
    );
  };
  
  return (
    <tr className="dark:bg-gray-600 bg-white sticky top-0 z-10 border-b-2 border-gray-400 dark:border-gray-500">
      {/* Row number header cell */}
      <th className="w-12 p-1 border-r-2 border-r-gray-400 dark:border-r-gray-500 border-b border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 sticky left-0 z-20 text-center shadow-sm">
        #
      </th>
      
      {/* Column headers */}
      {columns.map((column) => {
        const isAutomated = isColumnAutomated(column.id);
        const automation = isAutomated ? getAutomationForColumn(column.id) : undefined;
        
        return (
          <th
            key={column.id}
            onClick={(e) => {
              onColumnSelect(column.id, e.ctrlKey || e.metaKey);
              
            }}
            className={`px-2 py-1 border-r border-b font-medium min-w-[120px]
              border-gray-300 dark:border-gray-600 cursor-pointer select-none transition-colors shadow-sm
              ${selectedColumns.includes(column.id) ? 'bg-blue-100 dark:bg-blue-800' : 
                isAutomated ? 'bg-purple-50 dark:bg-purple-900 hover:bg-purple-100 dark:hover:bg-purple-800' : 
                'hover:bg-gray-100 dark:hover:bg-gray-600'}`}
          >
            <div className="flex items-center justify-between">
              <div className="truncate">
                {column.name}
              </div>
              {isAutomated && (
                <button 
                  className="ml-1 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onAutomationClick && automation) {
                      onAutomationClick(automation);
                    }
                  }}
                >
                  <BoltIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </th>
        );
      })}
      
      {/* Add column placeholder - takes remaining space */}
      <th 
        className="border-r border-b border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer text-center w-10 min-w-10"
        onClick={() => onOpenColumnOverlay?.()}
      >
        <div className="flex items-center justify-center h-full">
          <PlusIcon className="h-5 w-5" />

        </div>
      </th>
    </tr>
  );
};

export default SheetHeader;
