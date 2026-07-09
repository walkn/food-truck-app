import React, { useEffect, useRef } from 'react';

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  tone = 'danger',
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  return (
    <div className="confirm-panel" role="alertdialog" aria-labelledby="confirm-title">
      <div>
        <strong id="confirm-title">{title}</strong>
        <p>{message}</p>
      </div>
      <div className="confirm-panel__actions">
        <button ref={cancelRef} className="button button--quiet" onClick={onCancel}>
          Cancel
        </button>
        <button
          className={`button button--${tone}`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}

export default ConfirmDialog;
