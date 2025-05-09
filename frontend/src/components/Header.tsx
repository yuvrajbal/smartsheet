import React from 'react';
import { SunIcon, MoonIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  sheetName: string;
  darkMode: boolean;
  handleDarkModeToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({
  sheetName,
  darkMode,
  handleDarkModeToggle
}) => {
  return (
    <div className="  p-2 flex justify-between items-center  mb-3 relative text-gray-900 dark:text-gray-50 ">
      <div className="flex items-center  gap-2  ">
        <DocumentArrowDownIcon className="h-6 w-6 "/>
        <h1 className="text-xl font-bold ">{sheetName}</h1>
      </div>
        <button 
          onClick={handleDarkModeToggle} 
          className="p-2 rounded-full dark:hover:bg-gray-700 hover:bg-gray-100  "
        aria-label="Toggle dark mode"
      >
        {darkMode ? 
          <SunIcon className="h-5 w-5 text-yellow-300" /> : 
          <MoonIcon className="h-5 w-5 text-gray-900 " />
        }
      </button>
    </div>
  );
};

export default Header; 