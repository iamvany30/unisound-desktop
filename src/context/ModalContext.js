import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';



console.log('%c ModalContext.js loaded at: ' + new Date().toLocaleTimeString(), 'background: #222; color: #bada55');

const ModalContext = createContext(null);

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) throw new Error('useModal must be used within a ModalProvider');
    return context;
};

const MODAL_SIZES = {
    SMALL: 'small',
    MEDIUM: 'medium',
    LARGE: 'large',
};

const Modal = ({ modalConfig, onClose }) => {
    const {
        title, body, footer, size = MODAL_SIZES.MEDIUM,
        preventClose = false, animationDuration = 200
    } = modalConfig;

    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const modalRef = useRef(null);

    
    const handleClose = useCallback(() => {
        if (preventClose) return;
        setIsAnimatingOut(true);
        setTimeout(() => {
            console.log(`[Modal Component] Animation finished for "${title}". Calling onClose.`);
            onClose();
        }, animationDuration);
    }, [onClose, preventClose, animationDuration, title]);

    
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        modalRef.current?.focus();

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [handleClose]);

    const handleOverlayClick = useCallback((e) => {
        if (e.target === e.currentTarget) handleClose();
    }, [handleClose]);

    return ReactDOM.createPortal(
        <div
            style={{ ...modalStyles.overlay, opacity: isAnimatingOut ? 0 : 1 }}
            onClick={handleOverlayClick}
        >
            <div
                ref={modalRef}
                style={{
                    ...modalStyles.modal,
                    ...modalStyles.sizes[size],
                    transform: isAnimatingOut ? 'scale(0.95) translateY(-20px)' : 'scale(1) translateY(0)',
                }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                tabIndex="-1"
            >
                <div style={modalStyles.modalContentWrapper}>
                    {!preventClose && (
                        <button style={modalStyles.closeButton} onClick={handleClose}><X size={20} /></button>
                    )}
                    {title && (
                        <div style={modalStyles.header}><h2 style={modalStyles.title}>{title}</h2></div>
                    )}
                    <div style={modalStyles.body}>{body}</div>
                </div>
                {footer && <div style={modalStyles.footer}>{footer}</div>}
            </div>
        </div>,
        document.getElementById('modal-root') || document.body
    );
};

export const ModalProvider = ({ children }) => {
    const { t } = useTranslation();
    const [modalStack, setModalStack] = useState([]);

    const activeModal = modalStack.length > 0 ? modalStack[modalStack.length - 1] : null;

    const showModal = useCallback((modalConfig) => {
        console.log('%c[ModalProvider] showModal called with:', 'color: #88B4D3; font-weight: bold;', modalConfig);
        const newModal = { id: Date.now(), ...modalConfig };
        setModalStack(stack => [...stack, newModal]);
    }, []);

    const hideModal = useCallback(() => {
        console.log('%c[ModalProvider] hideModal called.', 'color: #D38888; font-weight: bold;');
        setModalStack(stack => stack.slice(0, stack.length - 1));
    }, []);

    const showConfirmModal = useCallback((message, onConfirm, onCancel = null) => {
        const body = (
            <div><p style={{ color: '#e6edf3', margin: 0, lineHeight: '1.6' }}>{message}</p></div>
        );

        const footer = (
            <>
                <button style={buttonStyles.secondary} onClick={() => {
                    console.log('[ConfirmModal] "Cancel" button clicked.');
                    hideModal();
                    onCancel?.();
                }}>
                    {t('common.cancel')}
                </button>
                <button style={buttonStyles.primary} onClick={() => {
                    console.log('[ConfirmModal] "Confirm" button clicked.');
                    hideModal();
                    onConfirm();
                }}>
                    {t('common.confirm')}
                </button>
            </>
        );

        showModal({ title: t('common.confirmation'), body, footer, size: MODAL_SIZES.SMALL });
    }, [showModal, hideModal, t]);

    const showAlertModal = useCallback((message, title = 'Alert') => {
        const body = (<div><p style={{ color: '#e6edf3', margin: 0 }}>{message}</p></div>);
        const footer = (
            <button style={buttonStyles.primary} onClick={hideModal}>{t('common.ok')}</button>
        );
        showModal({ title, body, footer, size: MODAL_SIZES.SMALL });
    }, [showModal, hideModal, t]);

    const contextValue = { showModal, hideModal, showConfirmModal, showAlertModal, MODAL_SIZES };

    return (
        <ModalContext.Provider value={contextValue}>
            {children}
            {activeModal && (
                <Modal modalConfig={activeModal} onClose={hideModal} />
            )}
        </ModalContext.Provider>
    );
};


const modalStyles = {
    overlay: {
        position: 'fixed', inset: 0, backgroundColor: 'rgba(13, 17, 23, 0.8)',
        backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 10000, padding: '16px',
        transition: 'opacity 200ms ease-in-out'
    },
    modal: {
        position: 'relative', backgroundColor: '#161b22', borderRadius: '16px',
        border: '1px solid #30363d', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh',
        outline: 'none', overflow: 'hidden',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
    },
    sizes: {
        [MODAL_SIZES.SMALL]: { width: '90%', maxWidth: '400px' },
        [MODAL_SIZES.MEDIUM]: { width: '90%', maxWidth: '600px' },
        [MODAL_SIZES.LARGE]: { width: '90%', maxWidth: '900px' },
    },
    modalContentWrapper: {
        display: 'flex', flexDirection: 'column',
        flex: '1 1 auto', overflowY: 'auto',
    },
    closeButton: {
        position: 'absolute', top: '16px', right: '16px', background: 'none',
        border: 'none', color: '#8b949e', cursor: 'pointer', padding: '8px',
        borderRadius: '8px', display: 'flex', alignItems: 'center',
        justifyContent: 'center', transition: 'all 0.2s ease', zIndex: 10
    },
    header: {
        padding: '24px 24px 16px 24px', borderBottom: '1px solid #30363d',
        flexShrink: 0,
    },
    title: {
        margin: 0, fontSize: '1.5rem', fontWeight: '600',
        color: '#e6edf3', lineHeight: '1.3'
    },
    body: { padding: '24px', color: '#c9d1d9' },
    footer: {
        padding: '16px 24px', borderTop: '1px solid #30363d',
        display: 'flex', justifyContent: 'flex-end', gap: '12px',
        backgroundColor: '#0d1117', zIndex: 5, flexShrink: 0,
    }
};

const buttonStyles = {
    primary: {
        backgroundColor: '#238636', color: '#ffffff', border: 'none', borderRadius: '8px',
        padding: '8px 16px', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
        transition: 'background-color 0.2s ease'
    },
    secondary: {
        backgroundColor: 'transparent', color: '#e6edf3', border: '1px solid #30363d',
        borderRadius: '8px', padding: '8px 16px', fontSize: '14px',
        fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease'
    }
};

export { MODAL_SIZES };