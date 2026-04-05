import { useState, useEffect, useCallback, createContext, useContext } from 'react';

import { CheckCircleIcon, XCircleIcon, InfoIcon, AlertTriangleIcon, XIcon } from './Icons';

// ── Toast Context ──────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  info: InfoIcon,
  warning: AlertTriangleIcon,
};

function ToastItem({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 250);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 250);
  };

  return (
    <div
      className={`toast toast-${toast.type}${exiting ? ' toast-exit' : ''}`}
      role="alert"
      aria-live="assertive"
    >
      <span className="toast-icon" aria-hidden="true">
        {ICONS[toast.type] ? (() => { const Icon = ICONS[toast.type]; return <Icon />; })() : <InfoIcon />}
      </span>
      <span className="toast-message">{toast.message}</span>
      <button
        className="toast-close"
        onClick={handleClose}
        aria-label="إغلاق الإشعار"
      >
        <XIcon className="icon-sm" />
      </button>
    </div>
  );
}

// ── Toast Provider ─────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container" aria-label="إشعارات">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
