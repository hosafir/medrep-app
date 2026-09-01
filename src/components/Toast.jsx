import { useState } from "react";
import { ToastContext } from "../lib/toastContext.js";

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const show = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {toasts.map(t => (
          <div key={t.id} className={`fum-insight ${t.type === 'ok' ? 'good' : t.type === 'err' ? 'warn' : 'info'}`} style={{ animation: 'slideIn .3s ease', boxShadow: '0 4px 12px rgba(0,0,0,.3)', margin:0 }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
