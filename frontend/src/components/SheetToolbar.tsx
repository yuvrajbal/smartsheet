import React from 'react';
import { BoltIcon } from '@heroicons/react/24/outline';
import type { AutomatedColumn } from './Sheet';
import Button from './Button';

interface SheetMenuProps {
  handleToggleAutomations: () => void;
  automatedColumns: AutomatedColumn[];
}

const SheetMenu: React.FC<SheetMenuProps> = ({
  handleToggleAutomations,
  automatedColumns,

}) => {
  return (
    <div className=" p-4">
        <Button
          onClick={handleToggleAutomations}
          icon={<BoltIcon className="h-4 w-4" />}
          text="Automations"
          variant="primary"
          badge={automatedColumns.length}
        />
       
    </div>
  );
};

export default SheetMenu;
