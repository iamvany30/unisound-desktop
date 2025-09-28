import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

import AuthLayout from '../components/Auth/AuthLayout';
import AuthForm from '../components/Auth/AuthForm';

const RegisterPage = () => {
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { token } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation('auth');

    if (token) {
        return <Navigate to="/" replace />;
    }

    const handleRegister = async (formData) => {
        setError(null);
        setSuccessMessage(null);
        setIsSubmitting(true);
        
        try {
            await api.auth.register(formData.username, formData.password, formData.email);
            setSuccessMessage(t('registerSuccess'));
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            setError(err.message || t('registerFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <AuthLayout>
            <AuthForm
                formType="register"
                onSubmit={handleRegister}
                error={error}
                successMessage={successMessage}
                isSubmitting={isSubmitting}
            />
        </AuthLayout>
    );
};

export default RegisterPage;