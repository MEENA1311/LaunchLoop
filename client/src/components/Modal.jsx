import React, { useEffect } from 'react';

export default function Modal({ title, eyebrow = 'WORKFLOW', close, children, maxWidth = 580 }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close]);

  return (
    <div className="modal-back" onClick={e => e.target === e.currentTarget && close()}>
      <div className="modal-pro" style={{ maxWidth: `${maxWidth}px` }}>
        <div className="modal-head">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h3>{title}</h3>
          </div>
          <button className="modal-close-btn" type="button" onClick={close} title="Close">×</button>
        </div>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
}
