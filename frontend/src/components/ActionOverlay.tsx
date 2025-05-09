import React, { useEffect, useState } from 'react';
import { TrashIcon, DocumentDuplicateIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from './Button';
import '../styles/ActionOverlay.css';

interface ActionOverlayProps {
  isOpen: boolean;
  selectedRows: number[];
  selectedColumns: string[];
  onDelete: () => void;
  onCopy: () => void;
  onClose: () => void;
  overlayRef: React.RefObject<HTMLDivElement | null>;
}

const ActionOverlay: React.FC<ActionOverlayProps> = ({
  isOpen,
  selectedRows,
  selectedColumns,
  onDelete,
  onCopy,
  onClose,
  overlayRef
}) => {
  const [animationClass, setAnimationClass] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      setAnimationClass('overlay-enter');
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  if (selectedRows.length === 0 && selectedColumns.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
      <div 
        ref={overlayRef}
        className={`bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 max-w-md ${animationClass} pointer-events-auto`}
        style={{
          transition: 'all 0.2s ease-out',
          opacity: animationClass ? 1 : 0,
          transform: animationClass ? 'translateY(0)' : 'translateY(20px)'
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium dark:text-white">Selected Items</h3>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-1 mb-4 dark:text-gray-300">
          {selectedRows.length > 0 && (
            <p>{`${selectedRows.length} row${selectedRows.length > 1 ? 's' : ''} selected`}</p>
          )}
          {selectedColumns.length > 0 && (
            <p>{`${selectedColumns.length} column${selectedColumns.length > 1 ? 's' : ''} selected`}</p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={onCopy}
            icon={<DocumentDuplicateIcon className="h-4 w-4" />}
            text="Copy"
            variant="primary"
            showTextOnMobile={true}
          />
          <Button
            onClick={onDelete}
            icon={<TrashIcon className="h-4 w-4" />}
            text="Delete"
            className="bg-red-500 text-white hover:bg-red-600 dark:hover:bg-red-600"
            showTextOnMobile={true}
          />
        </div>
      </div>
    </div>
  );
};

export default ActionOverlay; 