import React, { useState, useRef, useEffect } from 'react';
import { useSpreadsheetStore } from '../store/smartSheetStorage';
import SheetHeader from './SheetHeader';
import SmartSheetGrid from './SmartSheetGrid';
import SheetToolbar from './SheetToolbar';
import ColumnCreationOverlay from './ColumnCreationOverlay';
import AutomationsPanel from './AutomationsPanel';
import ActionOverlay from './ActionOverlay';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

import Header from './Header';

export interface AutomatedColumn {
  columnId: string;
  columnName: string;
  sourceColumnIds: string[];
  prompt: string;
  toolType: string;
  runCount: number;
}

const SmartSheet: React.FC = () => {
  const { 
    columns, 
    data, 
    deleteRow,
    deleteColumn,
    generateWithLLM,
    copyRow,
    copyColumn,
    isProcessing: storeIsProcessing
  } = useSpreadsheetStore();
  
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isColumnOverlayOpen, setIsColumnOverlayOpen] = useState(false);
  const [isAutomationsOpen, setIsAutomationsOpen] = useState(false);
  const [automatedColumns, setAutomatedColumns] = useState<AutomatedColumn[]>([]);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [isCopyPopupOpen, setIsCopyPopupOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<AutomatedColumn | null>(null);
  const [processingColumnIds, setProcessingColumnIds] = useState<string[]>([]);
  
  const { darkMode, toggleDarkMode } = useTheme();
  
  const overlayRef = useRef<HTMLDivElement>(null);
  const automationsRef = useRef<HTMLDivElement>(null);
  const deletePopupRef = useRef<HTMLDivElement>(null);
  const copyPopupRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Close overlays when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        setIsColumnOverlayOpen(false);
      }
      
      if (automationsRef.current && !automationsRef.current.contains(event.target as Node)) {
        setIsAutomationsOpen(false);
      }
      
      if (deletePopupRef.current && !deletePopupRef.current.contains(event.target as Node)) {
        setIsDeletePopupOpen(false);
      }
      
      if (copyPopupRef.current && !copyPopupRef.current.contains(event.target as Node)) {
        setIsCopyPopupOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check if there's anything selected to enable action popup
  useEffect(() => {
    if (selectedRows.length > 0 || selectedColumns.length > 0) {
      setIsDeletePopupOpen(true);
      setIsCopyPopupOpen(true);
    } else {
      setIsDeletePopupOpen(false);
      setIsCopyPopupOpen(false);
    }
  }, [selectedRows, selectedColumns]);

  // Use this to pass to SmartSheetGrid to ensure it knows which columns to show spinners for
  useEffect(() => {
    if (storeIsProcessing && selectedAutomation) {
      const columnId = columns.find(col => col.name === selectedAutomation.columnName)?.id;
      if (columnId) {
        setProcessingColumnIds([columnId]);
      }
    } else if (!storeIsProcessing) {
      setProcessingColumnIds([]);
    }
  }, [storeIsProcessing, selectedAutomation, columns]);



  const handleOpenColumnOverlay = (automation: AutomatedColumn | null = null) => {
    setSelectedAutomation(automation);
    setIsColumnOverlayOpen(true);
  };

  const handleCloseColumnOverlay = () => {
    setSelectedAutomation(null);
    setIsColumnOverlayOpen(false);
  };

  const handleToggleAutomations = () => {
    setIsAutomationsOpen(!isAutomationsOpen);
  };

  const handleDarkModeToggle = () => {
    toggleDarkMode();
    
  };

  const handleRowSelect = (rowIndex: number, multiSelect: boolean = false) => {
    if (multiSelect) {
      setSelectedRows(prev => 
        prev.includes(rowIndex) 
          ? prev.filter(idx => idx !== rowIndex) 
          : [...prev, rowIndex]
      );
    } else {
      setSelectedRows(prev => 
        prev.length === 1 && prev[0] === rowIndex 
          ? [] 
          : [rowIndex]
      );
    }
  };

  const handleColumnSelect = (columnId: string, multiSelect: boolean = false) => {
    if (multiSelect) {
      setSelectedColumns(prev => 
        prev.includes(columnId) 
          ? prev.filter(id => id !== columnId) 
          : [...prev, columnId]
      );
    } else {
      setSelectedColumns(prev => 
        prev.length === 1 && prev[0] === columnId 
          ? [] 
          : [columnId]
      );
    }
  };

  const handleDeleteSelected = () => {
    const rowCount = selectedRows.length;
    const colCount = selectedColumns.length;
    
    [...selectedRows].sort((a, b) => b - a).forEach(rowIndex => {
      deleteRow(rowIndex);
    });
    
    
    selectedColumns.forEach(columnId => {
      deleteColumn(columnId);
    });
    
    // Show toast notification
    if (rowCount > 0 && colCount > 0) {
      toast.success(`Deleted ${rowCount} row(s) and ${colCount} column(s)`);
    } else if (rowCount > 0) {
      toast.success(`Deleted ${rowCount} row(s)`);
    } else if (colCount > 0) {
      toast.success(`Deleted ${colCount} column(s)`);
    }
    
    // Clear selections
    setSelectedRows([]);
    setSelectedColumns([]);
  };
  
  const handleCopySelected = () => {
    const rowCount = selectedRows.length;
    const colCount = selectedColumns.length;
    
    // Copy selected rows
    selectedRows.forEach(rowIndex => {
      copyRow(rowIndex);
    });
    
    // Copy selected columns
    selectedColumns.forEach(columnId => {
      copyColumn(columnId);
    });
    
    // Show toast notification
    if (rowCount > 0 && colCount > 0) {
      toast.success(`Copied ${rowCount} row(s) and ${colCount} column(s)`);
    } else if (rowCount > 0) {
      toast.success(`Copied ${rowCount} row(s)`);
    } else if (colCount > 0) {
      toast.success(`Copied ${colCount} column(s)`);
    }
    
    // Clear selections
    setSelectedRows([]);
    setSelectedColumns([]);
  };

  const trackAutomation = (columnId: string, columnName: string, sourceColumnIds: string[], prompt: string, toolType: string) => {
    
    setAutomatedColumns(prev => {
      // If we have an existing automation by name or id
      const existingByName = prev.findIndex(col => col.columnName === columnName);
      const existingById = prev.findIndex(col => col.columnId === columnId);
      const existingIndex = existingByName >= 0 ? existingByName : existingById;
      
      if (existingIndex >= 0) {
        // Update existing automation entry
        const updated = [...prev];
        updated[existingIndex] = {
          columnId, // Use the provided column ID 
          columnName,
          sourceColumnIds,
          prompt,
          toolType,
          runCount: updated[existingIndex].runCount + 1,
          
        };
        return updated;
      } else {
        // Add new automation entry
        return [...prev, {
          columnId,
          columnName,
          sourceColumnIds,
          prompt,
          toolType,
          runCount: 1,
          
        }];
      }
    });
  };

  const handleRerunAutomation = (automation: AutomatedColumn) => {
    // Store which automation we're re-running
    setSelectedAutomation(automation);
    
    // Find current column ID
    const currentColumn = columns.find(col => col.name === automation.columnName);
    const columnId = currentColumn?.id || automation.columnId;
    
    // Add this column to processing columns list
    setProcessingColumnIds([columnId]);
    
    // Re-run the automation
    generateWithLLM(
      automation.sourceColumnIds,
      automation.prompt,
      automation.columnName,
      automation.toolType
    );
    
    // Update the automation tracking
    setAutomatedColumns(prev => 
      prev.map(col => 
        (col.columnId === columnId || col.columnName === automation.columnName)
          ? { 
              ...col, 
              columnId, 
              runCount: col.runCount + 1, 
              lastRun: new Date() 
            }
          : col
      )
    );
    
    toast.success(`Rerunning automation for column: ${automation.columnName}`);
  
    setIsAutomationsOpen(false);
  };
  


  return (
    <div className="flex flex-col h-full w-full relative dark:bg-gray-900 dark:text-white ">
      <Header 
        sheetName={"Smart Sheet"}
        darkMode={darkMode}
        handleDarkModeToggle={handleDarkModeToggle}
      />
      
     
      {/* Toolbar */}
      <SheetToolbar 
        handleToggleAutomations={handleToggleAutomations}
        automatedColumns={automatedColumns}
      />
      
      {/* Column Creation Overlay - Centered */}
      {isColumnOverlayOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div 
            ref={overlayRef}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-[90%] max-w-md max-h-[90vh] overflow-y-auto"
          >
            <ColumnCreationOverlay 
              isOpen={isColumnOverlayOpen}
              onClose={handleCloseColumnOverlay}
              automationData={selectedAutomation}
              onColumnCreated={(columnId, columnName, sourceColumnIds, prompt, toolType) => {
                if (sourceColumnIds && prompt && toolType) {
                  trackAutomation(columnId, columnName, sourceColumnIds, prompt, toolType);
                }
              }}
            />
          </div>
        </div>
      )}
      
      {/* Automations Panel */}
      <AutomationsPanel 
        isOpen={isAutomationsOpen}
        automatedColumns={automatedColumns}
        handleOpenColumnOverlay={handleOpenColumnOverlay}
        handleRerunAutomation={handleRerunAutomation}
        overlayRef={automationsRef}
        onClose={() => setIsAutomationsOpen(false)}
      />
      
      {/* Delete and Copy Overlay */}
      <ActionOverlay
        isOpen={isDeletePopupOpen || isCopyPopupOpen}
        selectedRows={selectedRows}
        selectedColumns={selectedColumns}
        onDelete={handleDeleteSelected}
        onCopy={handleCopySelected}
        onClose={() => {
          setIsDeletePopupOpen(false);
          setIsCopyPopupOpen(false);
        }}
        overlayRef={deletePopupRef}
      />
      
      <div className="flex-grow overflow-hidden border border-gray-300 dark:border-gray-700 shadow-md" ref={gridRef}>
        <div className="h-full flex flex-col">
          <div className="overflow-auto h-full">
            <table className="w-full table-fixed border-collapse min-w-[800px] bg-white dark:bg-gray-800">
              <colgroup>
                <col className="w-10 min-w-10" />
                {columns.map(column => (
                  <col key={column.id} className="min-w-[120px]" />
                ))}
                <col className="w-10 min-w-10" />
              </colgroup>
              <thead className="sticky top-0 z-10">
                <SheetHeader 
                  columns={columns}
                  automatedColumns={automatedColumns}
                  selectedColumns={selectedColumns}
                  onColumnSelect={handleColumnSelect}
                  onAutomationClick={handleOpenColumnOverlay}
                  onOpenColumnOverlay={handleOpenColumnOverlay}
                />
              </thead>
              <tbody>
                <SmartSheetGrid 
                  data={data} 
                  columns={columns}
                  automatedColumns={automatedColumns} 
                  selectedRows={selectedRows}
                  selectedColumns={selectedColumns}
                  onRowSelect={handleRowSelect}
                  processingColumnIds={processingColumnIds}
                  isProcessing={storeIsProcessing}
                />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartSheet;
