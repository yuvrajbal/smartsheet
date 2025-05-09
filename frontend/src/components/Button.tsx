import React from 'react';

interface ButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  text: string;
  className?: string;
  showTextOnMobile?: boolean;
  badge?: number;
  variant?: 'primary' | 'secondary' | 'default';
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  icon,
  text,
  className = '',
  showTextOnMobile = false,
  badge,
  variant = 'default',
  disabled = false
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700';
      case 'secondary':
        return 'bg-yellow-400 text-gray-900 hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-600';
      default:
        return 'dark:hover:bg-gray-800 hover:bg-gray-100 dark:text-white text-black';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 font-semibold rounded flex items-center gap-1 ${getVariantClasses()} ${className}`}
      disabled={disabled}
    >
      {icon}
      <span className={showTextOnMobile ? '' : 'hidden sm:inline'}>
        {text}
      </span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-1 bg-white text-blue-600 dark:text-blue-400 rounded-full text-xs px-1.5">
          {badge}
        </span>
      )}
    </button>
  );
};

export default Button; 