import React from 'react';
import type { AutomatedColumn } from './Sheet';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from './Button';

interface AutomationsPanelProps {
  isOpen: boolean;
  automatedColumns: AutomatedColumn[];
  handleOpenColumnOverlay: (automation: AutomatedColumn) => void;
  handleRerunAutomation: (automation: AutomatedColumn) => void;
  overlayRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
}

const AutomationsPanel: React.FC<AutomationsPanelProps> = ({
  isOpen,
  automatedColumns,
  handleOpenColumnOverlay,
  handleRerunAutomation,
  overlayRef,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleEdit = (automation: AutomatedColumn) => {
    // Close this panel first
    onClose();
    // Then open the column overlay with the automation data
    setTimeout(() => {
      handleOpenColumnOverlay(automation);
    }, 50); // Small delay to ensure proper visual transition
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div 
        ref={overlayRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-[90%] max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium dark:text-white">Automation History</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {automatedColumns.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No automations have been run yet.</p>
        ) : (
          <div className="space-y-3">
            {automatedColumns.map((automation) => (
              <div key={automation.columnId} className="p-2 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-700">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium dark:text-white">{automation.columnName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {`${automation.toolType === 'llm' ? 'LLM' : 'Web Search'} · Run ${automation.runCount} times`}
                    </p>
                    {/* <p className="text-xs text-gray-500 dark:text-gray-400">
                      Last run: {automation.lastRun.toLocaleString()}
                    </p> */}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => handleEdit(automation)}
                      text="Edit"
                      className="bg-gray-500 text-white hover:bg-gray-600 py-0.5 text-sm"
                      showTextOnMobile={true}
                    />
                    <Button
                      onClick={() => handleRerunAutomation(automation)}
                      text="Re-run"
                      variant="primary"
                      className="py-0.5 text-sm"
                      showTextOnMobile={true}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomationsPanel; 