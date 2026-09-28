// ============================================================
// File: src/components/StatusCard.jsx
// ============================================================
import React from 'react';

const THEMES = {
  success: { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
  error:   { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
  info:    { bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' },
};

export const StatusCard = ({ status }) => {
  if (!status) return null;

  const theme = THEMES[status.type] || THEMES.info;

  return (
    <div
      role="alert"
      style={{
        marginTop: '24px',
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: theme.bg,
        color: theme.color,
        border: `1px solid ${theme.border}`,
        textAlign: 'center',
        fontWeight: 500,
        transition: 'opacity 0.3s ease',
      }}
    >
      {status.message}
    </div>
  );
};
