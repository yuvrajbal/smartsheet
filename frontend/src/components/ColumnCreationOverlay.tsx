import React, { useState, useEffect } from 'react';
import { useSpreadsheetStore } from '../store/smartSheetStorage';
import type { AutomatedColumn } from './Sheet';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ClipLoader } from 'react-spinners';
import Button from './Button';

interface ColumnCreationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  automationData?: AutomatedColumn | null;
  onColumnCreated?: (
    columnId: string, 
    columnName: string, 
    sourceColumnIds: string[], 
    prompt: string, 
    toolType: string
  ) => void;
}

const ColumnCreationOverlay: React.FC<ColumnCreationOverlayProps> = ({ 
  isOpen, 
  onClose,
  automationData,
  onColumnCreated
}) => {
  const { columns, addColumn, generateWithLLM, isProcessing } = useSpreadsheetStore();
  
  const [columnName, setColumnName] = useState('');
  const [isLLMColumn, setIsLLMColumn] = useState(false);
  const [toolType, setToolType] = useState<'llm' | 'websearch'>('llm');
  const [prompt, setPrompt] = useState('');
  const [selectedSourceColumns, setSelectedSourceColumns] = useState<string[]>([]);
  const [newColumnId, setNewColumnId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Reset form when modal is opened
    if (isOpen) {
      if (automationData) {
        // We're editing an existing automation
        setColumnName(automationData.columnName);
        setIsLLMColumn(true);
        setToolType(automationData.toolType as 'llm' | 'websearch');
        setPrompt(automationData.prompt);
        setSelectedSourceColumns(automationData.sourceColumnIds);
        setNewColumnId(automationData.columnId);
        setIsEditing(true);
      } else {
        // New column
        setColumnName('');
        setIsLLMColumn(false);
        setToolType('llm');
        setPrompt('');
        setSelectedSourceColumns([]);
        setNewColumnId(null);
        setIsEditing(false);
      }
    }
  }, [isOpen, automationData]);

  // Close overlay when processing is complete
  useEffect(() => {
    if (!isProcessing && isOpen && newColumnId) {
      if (onColumnCreated && isLLMColumn) {
        onColumnCreated(
          newColumnId, 
          columnName, 
          selectedSourceColumns, 
          prompt, 
          toolType
        );
      }
      onClose();
    }
  }, [isProcessing]);

  const handleSourceColumnToggle = (columnId: string) => {
    setSelectedSourceColumns(prev => 
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!columnName.trim()) return;
    
    if (isEditing && automationData) {
      // Re-run the automation with possibly updated parameters
      if (selectedSourceColumns.length === 0 || !prompt.trim()) {
        return; // Require source columns and prompt for LLM generation
      }

      // Generate values with LLM, find the latest column ID if name has changed
      const columnId = columns.find(col => col.name === columnName)?.id || automationData.columnId;
      setNewColumnId(columnId);
      
      // Generate values with LLM
      await generateWithLLM(
        selectedSourceColumns,
        prompt,
        columnName,
        toolType
      );
      return;
    }
    
    // Generate a unique ID for the new column (simplified version)
    const uniqueId = Math.random().toString(36).substring(2, 10);
    setNewColumnId(uniqueId);
    
    if (isLLMColumn) {
      if (selectedSourceColumns.length === 0 || !prompt.trim()) {
        return; // Require source columns and prompt for LLM generation
      }
      
      // Create column first, then generate values
      addColumn(columnName);
      
      // Generate values with LLM
      await generateWithLLM(
        selectedSourceColumns,
        prompt,
        columnName,
        toolType
      );
    } else {
      // Just add a normal column
      addColumn(columnName);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold dark:text-white">
          {isEditing ? 'Edit Automated Column' : 'Create New Column'}
        </h2>
        <button 
          onClick={onClose} 
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          disabled={isProcessing}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      
      {isProcessing && (
        <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-md flex items-center">
          <ClipLoader size={16} color="#3B82F6" className="mr-2" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {isEditing 
              ? `Updating data for ${columnName} column...` 
              : `Generating data for ${columnName} column...`}
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Column Name
          </label>
          <input
            type="text"
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        {!isEditing && (
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isLLMColumn}
                onChange={(e) => setIsLLMColumn(e.target.checked)}
                className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium dark:text-gray-300">Generate values with AI</span>
            </label>
          </div>
        )}
        
        {(isLLMColumn || isEditing) && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Generation Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="toolType"
                    checked={toolType === 'llm'}
                    onChange={() => setToolType('llm')}
                    className="mr-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="dark:text-gray-300">LLM</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="toolType"
                    checked={toolType === 'websearch'}
                    onChange={() => setToolType('websearch')}
                    className="mr-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="dark:text-gray-300">Web Search</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Source Columns
              </label>
              <div className="max-h-28 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2">
                {columns.map(column => (
                  <label key={column.id} className="flex items-center py-1">
                    <input
                      type="checkbox"
                      checked={selectedSourceColumns.includes(column.id)}
                      onChange={() => handleSourceColumnToggle(column.id)}
                      className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="dark:text-gray-300">{column.name}</span>
                  </label>
                ))}
              </div>
              {selectedSourceColumns.length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  Please select at least one source column
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter instructions for generating column values..."
                required={isLLMColumn}
              />
            </div>
          </>
        )}
        
        <div className="flex justify-end space-x-2 pt-2">
          <Button
            onClick={onClose}
            text="Cancel"
            className="text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            disabled={isProcessing}
            showTextOnMobile={true}
          />
          <button
            type="submit"
            className={`px-3 py-1.5 text-sm rounded-md font-semibold flex items-center gap-1 
            ${isProcessing
              ? 'bg-blue-400 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            disabled={
              isProcessing || 
              !columnName.trim() || 
              (isLLMColumn && (selectedSourceColumns.length === 0 || !prompt.trim()))
            }
          >
            {isProcessing 
              ? 'Adding to sheet...' 
              : isEditing 
                ? 'Update Column' 
                : isLLMColumn 
                  ? 'Generate Column' 
                  : 'Create Column'
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default ColumnCreationOverlay;
