"use client";

import { useT } from "@/lib/useT";

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const T = useT();
  if (!open) return null;

  return (
    <div className="admin-modal-overlay" role="dialog" aria-modal="true" onClick={busy ? undefined : onCancel}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-body">
          <h3 className="admin-modal-title">{title}</h3>
          <p className="admin-modal-message">{message}</p>
        </div>
        <div className="admin-modal-actions">
          <button className="admin-action-btn" disabled={busy} onClick={onCancel}>
            {cancelLabel || T("إلغاء")}
          </button>
          <button
            className={`admin-action-btn ${danger ? "danger" : "primary"}`}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "..." : confirmLabel || T("تأكيد")}
          </button>
        </div>
      </div>
    </div>
  );
}
