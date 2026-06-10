import React, { createContext, useContext, useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, HelpCircle } from 'lucide-react';

const DialogContext = createContext(null);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState({
    isOpen: false,
    type: 'info', // 'info' | 'success' | 'error' | 'warning' | 'confirm'
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    resolver: null,
  });

  const showAlert = (title, message = '', type = 'info', confirmText = 'OK') => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        type,
        title,
        message,
        confirmText,
        cancelText: '',
        resolver: resolve,
      });
    });
  };

  const showConfirm = (title, message = '', confirmText = 'Confirm', cancelText = 'Cancel', type = 'confirm') => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        type,
        title,
        message,
        confirmText,
        cancelText,
        resolver: resolve,
      });
    });
  };

  const showSuccess = (title, message = '') => showAlert(title, message, 'success');
  const showError = (title, message = '') => showAlert(title, message, 'error');
  const showWarning = (title, message = '') => showAlert(title, message, 'warning');

  const handleConfirm = () => {
    if (dialog.resolver) dialog.resolver(true);
    setDialog((d) => ({ ...d, isOpen: false }));
  };

  const handleCancel = () => {
    if (dialog.resolver) dialog.resolver(false);
    setDialog((d) => ({ ...d, isOpen: false }));
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, showSuccess, showError, showWarning }}>
      {children}
      {dialog.isOpen && (
        <DialogPortal 
          dialog={dialog} 
          onConfirm={handleConfirm} 
          onCancel={handleCancel} 
        />
      )}
    </DialogContext.Provider>
  );
}

function DialogPortal({ dialog, onConfirm, onCancel }) {
  const { type, title, message, confirmText, cancelText } = dialog;

  // Render a gorgeous glassmorphism dialog matching Huntlo design system
  let icon = <Info size={22} />;
  let color = 'var(--accent-blue)';
  let bgGlow = 'rgba(59, 130, 246, 0.1)';
  let confirmBg = 'linear-gradient(180deg, #4f8cf6 0%, #2563eb 100%)';
  let confirmBorder = '1px solid #1d4ed8';

  if (type === 'success') {
    icon = <CheckCircle2 size={22} />;
    color = 'var(--success)';
    bgGlow = 'rgba(34, 197, 94, 0.1)';
    confirmBg = 'linear-gradient(180deg, #10b981 0%, #059669 100%)';
    confirmBorder = '1px solid #047857';
  } else if (type === 'error') {
    icon = <XCircle size={22} />;
    color = 'var(--danger)';
    bgGlow = 'rgba(239, 68, 68, 0.1)';
    confirmBg = 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)';
    confirmBorder = '1px solid #b91c1c';
  } else if (type === 'warning') {
    icon = <AlertTriangle size={22} />;
    color = 'var(--warning)';
    bgGlow = 'rgba(245, 158, 11, 0.1)';
    confirmBg = 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)';
    confirmBorder = '1px solid #b45309';
  } else if (type === 'confirm') {
    icon = <HelpCircle size={22} />;
    color = 'var(--accent-blue)';
    bgGlow = 'rgba(59, 130, 246, 0.1)';
    confirmBg = 'linear-gradient(180deg, #4f8cf6 0%, #2563eb 100%)';
    confirmBorder = '1px solid #1d4ed8';
  }

  // Handle ESC key to cancel/confirm
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (cancelText) {
          onCancel();
        } else {
          onConfirm();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cancelText, onCancel, onConfirm]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 5, 8, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      animation: 'dialog-fade-in 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <style>{`
        @keyframes dialog-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes dialog-scale-in {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .dialog-card {
          background: var(--bg-elevated);
          border: 1px solid var(--bg-border);
          border-radius: 16px;
          padding: 24px;
          width: 90%;
          max-width: 400px;
          box-shadow: var(--shadow-xl);
          animation: dialog-scale-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .dialog-btn-confirm {
          background: ${confirmBg};
          border: ${confirmBorder};
          color: #fff;
          font-weight: 500;
          font-family: var(--font-sans);
          font-size: var(--text-base);
          padding: 7px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.15);
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .dialog-btn-confirm:hover {
          opacity: 0.95;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .dialog-btn-confirm:active {
          transform: translateY(0);
        }
        .dialog-btn-cancel {
          background: transparent;
          border: 1px solid var(--bg-border);
          color: var(--text-secondary);
          font-weight: 500;
          font-family: var(--font-sans);
          font-size: var(--text-base);
          padding: 7px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .dialog-btn-cancel:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
          border-color: var(--text-tertiary);
        }
      `}</style>
      
      <div className="dialog-card">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: bgGlow,
            color: color,
            border: `1px solid ${bgGlow.replace('0.1', '0.2')}`,
            flexShrink: 0
          }}>
            {icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>{title}</h3>
            {message && (
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {message}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
          {cancelText && (
            <button className="dialog-btn-cancel" onClick={onCancel}>
              {cancelText}
            </button>
          )}
          <button className="dialog-btn-confirm" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
