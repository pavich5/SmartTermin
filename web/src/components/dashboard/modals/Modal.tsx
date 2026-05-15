import React from 'react';
import { X } from 'lucide-react';
import { useMediaQuery } from '../../ui/use-mobile';

interface ModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ show, onClose, title, children }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-x-hidden"
      onClick={onClose}
      style={{
        maxWidth: isMobile ? '100vw' : '100vw',
        height: isMobile ? '100vh' : '100vh',
      }}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden ${
          isMobile ? 'max-w-full' : 'max-w-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl sm:text-2xl truncate pr-2">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X size={24} />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-x-hidden">{children}</div>
      </div>
    </div>
  );
};
