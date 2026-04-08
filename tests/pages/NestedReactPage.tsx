import React from 'react';

export const NestedReactPage: React.FC = () => {
  return (
    <div style={{
      background: '#fdf2f8',
      border: '1px solid #f9a8d4',
      borderRadius: '10px',
      padding: '1.5rem',
    }}>
      <span style={{
        display: 'inline-block',
        background: '#ec4899',
        color: 'white',
        padding: '0.2rem 0.8rem',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 700,
        marginBottom: '0.75rem',
      }}>
        React
      </span>
      <h3 style={{ margin: '0 0 0.5rem', color: '#be185d' }}>Nested React Component</h3>
      <p style={{ margin: '0.4rem 0', color: '#9d174d', fontSize: '0.9rem' }}>
        2-level 중첩 라우트의 React 자식 컴포넌트입니다.
      </p>
      <p style={{ margin: '0.4rem 0', color: '#9d174d', fontSize: '0.9rem' }}>
        Lit 레이아웃(<code style={{ background: '#fce7f3', padding: '1px 4px', borderRadius: 3 }}>&lt;nested-layout&gt;</code>) 안의 <code style={{ background: '#fce7f3', padding: '1px 4px', borderRadius: 3 }}>&lt;u-outlet&gt;</code>에 렌더링됩니다.
      </p>
      <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#6b7280' }}>
        Current path: <code style={{ background: '#fce7f3', padding: '1px 4px', borderRadius: 3 }}>/nested/react</code>
      </div>
    </div>
  );
};
