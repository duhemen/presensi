import React from 'react';

export const StatusCard = ({ status }) => {
  if (!status) return null;

  const isSuccess = status.type === 'success';

  return (
    <div style={{
      marginTop: '24px',
      padding: '16px',
      borderRadius: '8px',
      backgroundColor: isSuccess ? '#dcfce7' : '#fee2e2',
      color: isSuccess ? '#15803d' : '#991b1b',
      border: `1px solid ${isSuccess ? '#bbf7d0' : '#fecaca'}`,
      textAlign: 'center',
      fontWeight: '500'
    }}>
      {status.message}
    </div>
  );
};
