import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const remove = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((msg, dur) => show(msg, 'success', dur), [show]);
  const error = useCallback((msg, dur) => show(msg, 'error', dur || 4500), [show]);
  const info = useCallback((msg, dur) => show(msg, 'info', dur), [show]);

  return (
    <ToastContext.Provider value={{ show, success, error, info }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type} slide-in`}>
            <span className="toast-icon">
              {t.type === 'success' && '✓'}
              {t.type === 'error' && '✕'}
              {t.type === 'info' && '✦'}
            </span>
            <div className="toast-body">{t.message}</div>
            <button className="toast-close" onClick={() => remove(t.id)}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful fallback if used outside provider
    return {
      success: msg => console.log('[Toast SUCCESS]', msg),
      error: msg => console.error('[Toast ERROR]', msg),
      info: msg => console.log('[Toast INFO]', msg)
    };
  }
  return ctx;
}
