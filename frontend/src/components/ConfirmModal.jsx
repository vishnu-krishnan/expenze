import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', confirmColor = 'danger' }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        color: 'var(--text-secondary)'
                    }}
                >
                    <X size={20} />
                </button>

                <h3>
                    <AlertTriangle size={24} color={confirmColor === 'danger' ? 'var(--error)' : 'var(--primary)'} />
                    {title}
                </h3>

                <p className="modal-description">{message}</p>

                <div className="modal-actions">
                    <button onClick={onClose} className="secondary">
                        Cancel
                    </button>
                    <button onClick={() => { onConfirm(); onClose(); }} className={confirmColor}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
