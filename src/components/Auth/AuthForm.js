import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, LoaderCircle, Check, X } from 'lucide-react';

const PasswordStrengthIndicator = ({ password }) => {
    const getStrength = (pass) => {
        if (!pass) return { score: 0 };
        const checks = {
            length: pass.length >= 8,
            lowercase: /[a-z]/.test(pass),
            uppercase: /[A-Z]/.test(pass),
            numbers: /\d/.test(pass),
            symbols: /[^A-Za-z0-9]/.test(pass)
        };
        const score = Object.values(checks).filter(Boolean).length;
        const levels = [
            { label: '', color: '' }, { label: 'Очень слабый', color: '#ff4757' },
            { label: 'Слабый', color: '#ff7675' }, { label: 'Средний', color: '#fdcb6e' },
            { label: 'Сильный', color: '#00b894' }, { label: 'Отличный', color: '#2ed573' }
        ];
        return { ...levels[score], score, checks };
    };

    if (!password) return null;
    const { score, label, color, checks } = getStrength(password);
    return (
        <div className="password-strength-indicator">
            <div className="strength-bar"><div className="strength-progress" style={{ width: `${(score / 5) * 100}%`, backgroundColor: color }}/></div>
            <div className="strength-info">
                <span className="strength-label" style={{ color }}>{label}</span>
                <div className="strength-checks">
                    {Object.entries(checks).map(([key, passed]) => (
                        <span key={key} className={`check ${passed ? 'passed' : ''}`}>{passed ? <Check size={12}/> : <X size={12}/>}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

const FormInput = ({ type, value, onChange, placeholder, icon: Icon, validation, isPasswordVisible, onPasswordVisibilityToggle, ...props }) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasBeenTouched, setHasBeenTouched] = useState(false);
    const isValid = validation ? validation(value) : true;
    const showValidation = hasBeenTouched && !isFocused && value;

    return (
        <div className="input-container">
            <Icon className="input-icon" size={20} />
            <input type={type} className={`form-input ${showValidation ? (isValid ? 'valid' : 'invalid') : ''}`} value={value} onChange={onChange} onFocus={() => setIsFocused(true)} onBlur={() => { setIsFocused(false); setHasBeenTouched(true); }} placeholder={placeholder} {...props} />
            {onPasswordVisibilityToggle && <button type="button" className="password-toggle" onClick={onPasswordVisibilityToggle}>{isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}</button>}
            {showValidation && <div className="validation-icon">{isValid ? <CheckCircle size={16} className="valid-icon"/> : <AlertCircle size={16} className="invalid-icon"/>}</div>}
        </div>
    );
};

const AuthForm = ({ formType, onSubmit, error, successMessage, isSubmitting, children }) => {
    const [formData, setFormData] = useState({ username: '', password: '', email: '' });
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const { t } = useTranslation('auth');
    const isRegister = formType === 'register';

    const validators = {
        username: (v) => v.length >= 3 && /^[a-zA-Z0-9_]+$/.test(v),
        email: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        password: (v) => v.length >= 8
    };

    const handleInputChange = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSubmitting || !validators.username(formData.username) || !validators.password(formData.password) || (isRegister && !validators.email(formData.email))) return;
        onSubmit(formData);
    };

    const FeedbackMessage = ({ message, type }) => (
        <div className={`feedback-message ${type}`} role={type === 'error' ? 'alert' : 'status'}>
            {type === 'error' ? <AlertCircle size={18}/> : <CheckCircle size={18}/>}
            <span>{message}</span>
        </div>
    );

    return (
        <div className="auth-form">
            <div className="auth-form-header">
                <h2>{isRegister ? t('join') : t('loginTo')}</h2>
                <p className="auth-subtitle">{isRegister ? t('createAccountSubtitle') : t('loginSubtitle')}</p>
            </div>
            {error && <FeedbackMessage message={error} type="error" />}
            {successMessage && <FeedbackMessage message={successMessage} type="success" />}
            <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                    <FormInput type="text" value={formData.username} onChange={handleInputChange('username')} placeholder={t('username')} required disabled={isSubmitting} icon={User} validation={validators.username} autoComplete="username" />
                </div>
                {isRegister && <div className="form-group"><FormInput type="email" value={formData.email} onChange={handleInputChange('email')} placeholder={t('emailOptional')} disabled={isSubmitting} icon={Mail} validation={validators.email} autoComplete="email" /></div>}
                <div className="form-group">
                    <FormInput type={isPasswordVisible ? "text" : "password"} value={formData.password} onChange={handleInputChange('password')} placeholder={t('password')} required disabled={isSubmitting} icon={Lock} validation={validators.password} isPasswordVisible={isPasswordVisible} onPasswordVisibilityToggle={() => setIsPasswordVisible(!isPasswordVisible)} autoComplete={isRegister ? "new-password" : "current-password"} />
                    {isRegister && <PasswordStrengthIndicator password={formData.password} />}
                </div>
                <button type="submit" className="auth-button" disabled={isSubmitting}>
                    {isSubmitting ? <LoaderCircle size={20} className="animate-spin" /> : (isRegister ? t('createAccount') : t('login'))}
                </button>
                {children}
                <div className="auth-footer">
                    <p>{isRegister ? t('haveAccount') : t('noAccount')} <Link to={isRegister ? '/login' : '/register'} className="auth-link">{isRegister ? t('login') : t('register')}</Link></p>
                </div>
            </form>
        </div>
    );
};

export default AuthForm;