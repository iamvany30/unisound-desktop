import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TELEGRAM_BOT_NAME } from '../config';
import AuthLayout from '../components/Auth/AuthLayout';
import AuthForm from '../components/Auth/AuthForm';
import TelegramLoginButton from '../components/Auth/TelegramLoginButton';

const LoginPage = () => {
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, token } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation('auth');

    if (token) {
        return <Navigate to="/" replace />;
    }

    const handleLogin = async ({ username, password }) => {
        setError(null);
        setIsSubmitting(true);
        try {
            await login(username, password);
            navigate('/');
        } catch (err) {
            setError(err.message || t('loginFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <AuthLayout>
            <AuthForm
                formType="login"
                onSubmit={handleLogin}
                error={error}
                disabled={isSubmitting}
            >
                <div className="auth-divider"><span>ИЛИ</span></div>
                <TelegramLoginButton botName={TELEGRAM_BOT_NAME} />
            </AuthForm>
        </AuthLayout>
    );
};

export default LoginPage;