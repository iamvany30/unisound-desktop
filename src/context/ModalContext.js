import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';


const MODAL_SIZES = {
    SMALL: 'small',
    MEDIUM: 'medium',
    LARGE: 'large',
};



const theme = {
    colors: {
        background: 'var(--color-background)',
        
        glassBackground: 'var(--color-glass-background)',
        interactive: 'var(--color-background-interactive)',
        border: 'var(--color-border)',
        textPrimary: 'var(--color-text-primary)',
        textSecondary: 'var(--color-text-secondary)',
        textMuted: 'var(--color-text-muted)',
        textOnAccent: 'var(--color-text-on-accent)',
        accentPrimary: 'var(--color-accent-primary)',
        accentPrimaryHover: 'var(--color-accent-primary-hover)',
    },
    fonts: {
        sans: 'var(--font-family-sans)',
        size: { base: 'var(--font-size-base)', '2xl': 'var(--font-size-2xl)' },
        weight: { medium: 'var(--font-weight-medium)', semibold: 'var(--font-weight-semibold)' },
    },
    spacing: { sm: 'var(--spacing-sm)', md: 'var(--spacing-md)', lg: 'var(--spacing-lg)' },
    borderRadius: { md: 'var(--border-radius-md)', lg: 'var(--border-radius-lg)' },
    zIndex: { modal: 'var(--z-index-modal)' },
    shadows: { large: 'var(--shadow-large)' },
    transitions: { fast: 'var(--transition-fast)', medium: 'var(--transition-medium)' },
    glass: { backdropFilter: 'var(--backdrop-filter-glass)' },
};


const modalStyles = {
    overlay: {
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(13, 17, 23, 0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: theme.zIndex.modal, padding: theme.spacing.md,
        transition: `opacity ${theme.transitions.fast} ease-in-out`,
    },
    modal: {
        position: 'relative',
        backgroundColor: theme.colors.glassBackground, 
        backdropFilter: theme.glass.backdropFilter,
        borderRadius: theme.borderRadius.lg,
        border: `1px solid ${theme.colors.border}`,
        boxShadow: theme.shadows.large,
        display: 'flex', flexDirection: 'column',
        maxHeight: '90vh', outline: 'none', overflow: 'hidden',
        transition: `all ${theme.transitions.medium}`,
        fontFamily: theme.fonts.sans,
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
        position: 'absolute', top: theme.spacing.md, right: theme.spacing.md,
        background: 'none', border: 'none', color: theme.colors.textMuted,
        cursor: 'pointer', padding: theme.spacing.sm, borderRadius: theme.borderRadius.md,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: `all ${theme.transitions.fast}`, zIndex: 10,
    },
    header: {
        padding: `${theme.spacing.lg} ${theme.spacing.lg} ${theme.spacing.md}`,
        borderBottom: `1px solid ${theme.colors.border}`, flexShrink: 0,
    },
    title: {
        margin: 0, fontSize: theme.fonts.size['2xl'],
        fontWeight: theme.fonts.weight.semibold, color: theme.colors.textPrimary,
        lineHeight: 1.3,
    },
    body: {
        padding: theme.spacing.lg, color: theme.colors.textSecondary,
        lineHeight: 1.6,
    },
    footer: {
        padding: `${theme.spacing.md} ${theme.spacing.lg}`,
        borderTop: `1px solid ${theme.colors.border}`,
        
        backgroundColor: theme.colors.interactive,
        display: 'flex', justifyContent: 'flex-end',
        gap: theme.spacing.md, zIndex: 5, flexShrink: 0,
    },
};

const buttonStyles = {
    base: {
        fontFamily: theme.fonts.sans, borderRadius: theme.borderRadius.md,
        padding: `${theme.spacing.sm} ${theme.spacing.md}`, fontSize: theme.fonts.size.base,
        fontWeight: theme.fonts.weight.medium, cursor: 'pointer',
        transition: `all ${theme.transitions.fast}`, border: '1px solid transparent',
    },
    primary: {
        backgroundColor: theme.colors.accentPrimary,
        color: theme.colors.textOnAccent,
        borderColor: theme.colors.accentPrimary,
    },
    secondary: {
        backgroundColor: theme.colors.interactive,
        color: theme.colors.textPrimary,
        borderColor: theme.colors.border,
    },
};



const ModalContext = createContext(null);
export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) throw new Error('useModal must be used within a ModalProvider');
    return context;
};

const Modal = ({ modalConfig, onClose }) => {
    const { title, body, footer, size = MODAL_SIZES.MEDIUM, preventClose = false, animationDuration = 200 } = modalConfig;
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const modalRef = useRef(null);
    const handleClose = useCallback(() => {
        if (preventClose) return;
        setIsAnimatingOut(true);
        setTimeout(onClose, animationDuration);
    }, [onClose, preventClose, animationDuration]);
    useEffect(() => {
        const handleKeyDown = (event) => { if (event.key === 'Escape') handleClose(); };
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
        <div style={{ ...modalStyles.overlay, opacity: isAnimatingOut ? 0 : 1 }} onClick={handleOverlayClick}>
            <div
                ref={modalRef}
                style={{
                    ...modalStyles.modal, ...modalStyles.sizes[size],
                    transform: isAnimatingOut ? 'scale(0.95) translateY(-20px)' : 'scale(1) translateY(0)',
                }}
                onClick={(e) => e.stopPropagation()}
                role="dialog" aria-modal="true" tabIndex="-1"
            >
                <div style={modalStyles.modalContentWrapper}>
                    {!preventClose && (<button style={modalStyles.closeButton} onClick={handleClose} aria-label="Close modal"><X size={20} /></button>)}
                    {title && <div style={modalStyles.header}><h2 style={modalStyles.title}>{title}</h2></div>}
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
        setModalStack(stack => [...stack, { id: Date.now(), ...modalConfig }]);
    }, []);
    const hideModal = useCallback(() => {
        setModalStack(stack => stack.slice(0, stack.length - 1));
    }, []);
    const showConfirmModal = useCallback((message, onConfirm, onCancel = null) => {
        const body = <div><p style={{ margin: 0 }}>{message}</p></div>;
        const footer = (
            <>
                <button style={{ ...buttonStyles.base, ...buttonStyles.secondary }} onClick={() => { hideModal(); onCancel?.(); }}>{t('common.cancel')}</button>
                <button style={{ ...buttonStyles.base, ...buttonStyles.primary }} onClick={() => { hideModal(); onConfirm(); }}>{t('common.confirm')}</button>
            </>
        );
        showModal({ title: t('common.confirmation'), body, footer, size: MODAL_SIZES.SMALL });
    }, [showModal, hideModal, t]);
    const showAlertModal = useCallback((message, title = 'Alert') => {
        const body = <div><p style={{ margin: 0 }}>{message}</p></div>;
        const footer = <button style={{ ...buttonStyles.base, ...buttonStyles.primary }} onClick={hideModal}>{t('common.ok')}</button>;
        showModal({ title, body, footer, size: MODAL_SIZES.SMALL });
    }, [showModal, hideModal, t]);
    const contextValue = { showModal, hideModal, showConfirmModal, showAlertModal, MODAL_SIZES };
    return (
        <ModalContext.Provider value={contextValue}>
            {children}
            {activeModal && <Modal modalConfig={activeModal} onClose={hideModal} />}
        </ModalContext.Provider>
    );
};

export { MODAL_SIZES };