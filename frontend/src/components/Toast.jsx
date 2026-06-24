import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getStyle = () => {
    switch (type) {
      case 'error':
        return {
          bg: 'var(--danger-glow)',
          border: 'rgba(220, 38, 38, 0.3)',
          color: 'var(--danger)',
          icon: <XCircle size={18} />,
          barColor: 'var(--danger)',
        };
      case 'info':
        return {
          bg: 'var(--primary-glow)',
          border: 'var(--border-glow)',
          color: 'var(--primary)',
          icon: <Info size={18} />,
          barColor: 'var(--primary)',
        };
      case 'success':
      default:
        return {
          bg: 'var(--success-glow)',
          border: 'rgba(5, 150, 105, 0.3)',
          color: 'var(--success)',
          icon: <CheckCircle size={18} />,
          barColor: 'var(--success)',
        };
    }
  };

  const s = getStyle();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'var(--bg-card)',
        border: `1.5px solid ${s.border}`,
        borderLeft: `4px solid ${s.barColor}`,
        borderRadius: 'var(--radius-md)',
        padding: '14px 18px',
        color: 'var(--text-primary)',
        boxShadow: 'var(--shadow-lg)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        zIndex: 9999,
        fontFamily: 'var(--font-primary)',
        fontWeight: '500',
        fontSize: '0.9rem',
        maxWidth: '380px',
        animation: 'slideInDown 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        minWidth: '260px',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', color: s.color, flexShrink: 0 }}>
        {s.icon}
      </span>
      <span style={{ flex: 1, color: 'var(--text-primary)', lineHeight: 1.4 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: '2px',
          borderRadius: '4px',
          transition: 'var(--transition)',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = s.color; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        <X size={15} />
      </button>
    </div>
  );
};

export default Toast;
