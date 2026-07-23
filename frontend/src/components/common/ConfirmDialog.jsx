import { FiAlertTriangle } from 'react-icons/fi';
import Modal from './Modal';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <FiAlertTriangle className="text-red-600 dark:text-red-400" size={24} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title || 'Confirm Delete'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {message || 'Are you sure you want to delete this item? This action cannot be undone.'}
        </p>
        <div className="flex justify-center gap-3">
          <button onClick={onClose} className="btn-secondary px-6">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-danger px-6">
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
