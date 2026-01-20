import React from 'react';

export const NestedReactPage: React.FC = () => {
  return (
    <div style={{
      display: 'block',
      padding: '1rem',
      background: '#fce4ec',
      borderRadius: '8px',
      marginTop: '1rem',
    }}>
      <h3 style={{
        margin: '0 0 1rem 0',
        color: '#c2185b',
      }}>
        ⚛️ Nested Content{' '}
        <span style={{
          display: 'inline-block',
          background: '#c2185b',
          color: 'white',
          padding: '0.25rem 0.75rem',
          borderRadius: '12px',
          fontSize: '0.85rem',
          fontWeight: 'bold',
          marginLeft: '0.5rem',
        }}>
          React
        </span>
      </h3>
      <p style={{ margin: '0.5rem 0', color: '#555' }}>
        This is a real React component rendered inside a nested outlet!
      </p>
      <p style={{ margin: '0.5rem 0', color: '#555' }}>
        Parent layout + React child content working correctly. ✅
      </p>
      <p style={{ margin: '0.5rem 0', color: '#555' }}>
        <strong>Framework:</strong> React (Functional Component)
      </p>
    </div>
  );
};
