
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AlertCircle } from 'lucide-react';

const TelegramLoginButton = ({ botName }) => {
    const { loginWithTelegram } = useAuth();
    const navigate = useNavigate();
    const buttonContainerRef = useRef(null);
    const [error, setError] = useState(null);

    
    const onTelegramAuth = useCallback(async (user) => {
        setError(null);
        try {
            await loginWithTelegram(user);
            navigate('/'); 
        } catch (err) {
            console.error('Telegram auth error on backend:', err);
            setError(err.message || 'Ошибка входа через Telegram.');
        }
    }, [loginWithTelegram, navigate]);

    useEffect(() => {
        
        window.onTelegramAuth = onTelegramAuth;

        const container = buttonContainerRef.current;
        if (!container) return;

        
        const script = document.createElement('script');
        script.src = "https://telegram.org/js/telegram-widget.js?22";
        script.setAttribute('data-telegram-login', botName);
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-onauth', 'onTelegramAuth(user)');
        script.setAttribute('data-request-access', 'write');
        script.async = true;

        
        container.appendChild(script);

        
        return () => {
            if (container.contains(script)) {
                container.removeChild(script);
            }
            delete window.onTelegramAuth;
        };
    }, [botName, onTelegramAuth]); 

    return (
        <div>
            <div ref={buttonContainerRef} />
            
            {error && (
                <div className="feedback-message error" style={{ marginTop: '16px' }}>
                    <AlertCircle size={18} aria-hidden="true" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
};

export default TelegramLoginButton;