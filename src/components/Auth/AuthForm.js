
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
    Music, User, Mail, Lock, Eye, EyeOff, 
    AlertCircle, CheckCircle, LoaderCircle, 
    Check, X, Shield
} from 'lucide-react';


const PasswordStrengthIndicator = ({ password, isVisible }) => {
    const getStrength = (pass) => {
        if (!pass) return { score: 0, label: '', color: '' };
        
        let score = 0;
        const checks = {
            length: pass.length >= 8,
            lowercase: /[a-z]/.test(pass),
            uppercase: /[A-Z]/.test(pass),
            numbers: /\d/.test(pass),
            symbols: /[^A-Za-z0-9]/.test(pass)
        };
        
        score = Object.values(checks).filter(Boolean).length;
        
        const levels = [
            { score: 0, label: '', color: '' },
            { score: 1, label: 'Очень слабый', color: '#ff4757' },
            { score: 2, label: 'Слабый', color: '#ff7675' },
            { score: 3, label: 'Средний', color: '#fdcb6e' },
            { score: 4, label: 'Сильный', color: '#6c5ce7' },
            { score: 5, label: 'Очень сильный', color: '#00b894' }
        ];
        
        return { ...levels[score], checks };
    };

    if (!isVisible || !password) return null;

    const strength = getStrength(password);
    const progress = (strength.score / 5) * 100;

    return (
        <div className="password-strength-indicator">
            <div className="strength-bar">
                <div 
                    className="strength-progress" 
                    style={{ 
                        width: `${progress}%`, 
                        backgroundColor: strength.color,
                        transition: 'all 0.3s ease'
                    }}
                />
            </div>
            {strength.label && (
                <div className="strength-info">
                    <span className="strength-label" style={{ color: strength.color }}>
                        {strength.label}
                    </span>
                    <div className="strength-checks">
                        {Object.entries(strength.checks).map(([key, passed]) => (
                            <span key={key} className={`check ${passed ? 'passed' : ''}`}>
                                {passed ? <Check size={12} /> : <X size={12} />}
                                {key === 'length' && '8+ символов'}
                                {key === 'lowercase' && 'a-z'}
                                {key === 'uppercase' && 'A-Z'}
                                {key === 'numbers' && '0-9'}
                                {key === 'symbols' && '!@#$'}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


const FormInput = ({ 
    type, 
    value, 
    onChange, 
    placeholder, 
    required, 
    disabled, 
    icon: Icon,
    validation,
    showPasswordToggle,
    onPasswordVisibilityToggle,
    isPasswordVisible,
    ...props 
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasBeenFocused, setHasBeenFocused] = useState(false);
    
    const isValid = validation ? validation(value) : true;
    const showValidation = hasBeenFocused && value && !isFocused;

    return (
        <div className="form-group">
            <div className="input-container">
                <Icon className="input-icon" size={20} aria-hidden="true" />
                <input
                    type={type}
                    className={`form-input ${showValidation ? (isValid ? 'valid' : 'invalid') : ''}`}
                    value={value}
                    onChange={onChange}
                    onFocus={() => {
                        setIsFocused(true);
                        setHasBeenFocused(true);
                    }}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    {...props}
                />
                {showPasswordToggle && (
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={onPasswordVisibilityToggle}
                        aria-label={isPasswordVisible ? 'Скрыть пароль' : 'Показать пароль'}
                    >
                        {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
                {showValidation && (
                    <div className="validation-icon">
                        {isValid ? 
                            <CheckCircle size={16} className="valid-icon" /> : 
                            <AlertCircle size={16} className="invalid-icon" />
                        }
                    </div>
                )}
            </div>
        </div>
    );
};


const LoadingSpinner = ({ text = "Загрузка..." }) => (
    <div className="loading-spinner">
        <LoaderCircle size={20} className="animate-spin" />
        <span>{text}</span>
    </div>
);


const AuthForm = ({ 
    formType, 
    onSubmit, 
    error, 
    successMessage, 
    disabled, 
    children,
    showPasswordStrength = true,
    showValidation = true 
}) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: ''
    });
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const formRef = useRef(null);
    
    const { t } = useTranslation('auth');
    const isRegister = formType === 'register';

    
    const validators = {
        username: (value) => value.length >= 3 && /^[a-zA-Z0-9_]+$/.test(value),
        email: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        password: (value) => value.length >= 6
    };

    
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (disabled || isSubmitting) return;

        
        if (showValidation) {
            const isUsernameValid = validators.username(formData.username);
            const isEmailValid = validators.email(formData.email);
            const isPasswordValid = validators.password(formData.password);

            if (!isUsernameValid || !isEmailValid || !isPasswordValid) {
                
                return;
            }
        }

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
        } finally {
            setIsSubmitting(false);
        }
    };

    
    useEffect(() => {
        if (formRef.current) {
            const firstInput = formRef.current.querySelector('input');
            if (firstInput) {
                firstInput.focus();
            }
        }
    }, []);

    const title = isRegister ? t('join') : t('loginTo');
    const buttonText = isRegister ? t('createAccount') : t('login');
    const linkText = isRegister ? t('haveAccount') : t('noAccount');
    const linkTo = isRegister ? '/login' : '/register';
    const linkActionText = isRegister ? t('login') : t('register');

    
    const FeedbackMessage = () => {
        if (error) {
            return (
                <div className="feedback-message error" role="alert">
                    <AlertCircle size={18} aria-hidden="true" />
                    <div>
                        <strong>Ошибка</strong>
                        <p>{error}</p>
                    </div>
                </div>
            );
        }
        if (successMessage) {
            return (
                <div className="feedback-message success" role="status">
                    <CheckCircle size={18} aria-hidden="true" />
                    <div>
                        <strong>Успешно</strong>
                        <p>{successMessage}</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div 
            className="auth-form glass-panel glass-panel--regular glass-panel--p-xl glass-panel--rounded-xl" 
            data-glow="true" 
            data-accent="blue"
        >
            <div className="glass-content">
                <div className="auth-form-header">
                    <h2>{title}</h2>
                    <p className="auth-subtitle">
                        {isRegister ? 
                            'Создайте аккаунт для доступа ко всем функциям' : 
                            'Войдите в свой аккаунт для продолжения'
                        }
                    </p>
                </div>

                <FeedbackMessage />
                
                <form ref={formRef} onSubmit={handleSubmit} noValidate>
                    <FormInput
                        type="text"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        placeholder={t('username')}
                        required
                        disabled={disabled || isSubmitting}
                        icon={User}
                        validation={showValidation ? validators.username : null}
                        aria-label={t('username')}
                        autoComplete="username"
                    />

                    {isRegister && (
                        <FormInput
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder={t('emailOptional')}
                            disabled={disabled || isSubmitting}
                            icon={Mail}
                            validation={showValidation ? validators.email : null}
                            aria-label={t('emailOptional')}
                            autoComplete="email"
                        />
                    )}

                    <div>
                        <FormInput
                            type={isPasswordVisible ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            placeholder={t('password')}
                            required
                            disabled={disabled || isSubmitting}
                            icon={Lock}
                            validation={showValidation ? validators.password : null}
                            showPasswordToggle
                            onPasswordVisibilityToggle={() => setIsPasswordVisible(!isPasswordVisible)}
                            isPasswordVisible={isPasswordVisible}
                            aria-label={t('password')}
                            autoComplete={isRegister ? "new-password" : "current-password"}
                        />
                        
                        {isRegister && showPasswordStrength && (
                            <PasswordStrengthIndicator 
                                password={formData.password} 
                                isVisible={formData.password.length > 0}
                            />
                        )}
                    </div>
                    
                    <button 
                        type="submit" 
                        className="auth-button" 
                        disabled={disabled || isSubmitting}
                        aria-describedby={error ? 'error-message' : undefined}
                    >
                        {isSubmitting ? (
                            <LoadingSpinner text={isRegister ? "Создание аккаунта..." : "Вход..."} />
                        ) : (
                            <>
                                <Shield size={18} />
                                {buttonText}
                            </>
                        )}
                    </button>

                    {children}
                    
                    <div className="auth-footer">
                        <p className="auth-link-container">
                            {linkText}{' '}
                            <Link to={linkTo} className="auth-link">
                                {linkActionText}
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AuthForm;