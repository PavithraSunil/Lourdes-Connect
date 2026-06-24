import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getStyle = () => {
    switch (type) {
      case 'error':
        return {
          bg: 'rgba(239, 68, 68, 0.1)',
          border: 'rgba(239, 68, 68, 0.25)',
          color: '#ef4444',
          icon: <XCircle size={18} />,
        };
      case 'info':
        return {
          bg: 'rgba(99, 102, 241, 0.1)',
          border: 'rgba(99, 102, 241, 0.25)',
          color: '#6366f1',
          icon: <Info size={18} />,
        };
      case 'success':
      default:
        return {
          bg: 'rgba(16, 185, 129, 0.1)',
          border: 'rgba(16, 185, 129, 0.25)',
          color: '#10b981',
          icon: <CheckCircle size={18} />,
        };
    }
  };

  const style = getStyle();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: '8px',
        padding: '12px 16px',
        color: style.color,
        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        fontFamily: 'var(--font-accent)',
        fontWeight: '500',
        fontSize: '0.9rem',
        animation: 'fadeIn 0.25s ease-out forwards',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center' }}>{style.icon}</span>
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: '2px',
          opacity: 0.7,
          marginLeft: '4px',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.7)}
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default Toast;
