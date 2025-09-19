import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { useArtwork } from '../hooks/useArtwork';
import {
    User, Music, Calendar, UploadCloud, Trash2, Shield, Gem,
    LoaderCircle, Clock, Mail, Crown, Star, Headphones, Play
} from 'lucide-react';

import './ProfilePage.css';

const ProfileDetailItem = ({ icon: Icon, label, value, type }) => {
    if (!value) return null;

    const getBadgeClass = () => {
        switch (type) {
            case 'admin': return 'status-badge admin';
            case 'premium': return 'status-badge premium';
            case 'free': return 'status-badge free';
            default: return '';
        }
    };

    return (
        <div className="profile-detail-item">
            <Icon size={18} className="detail-icon" />
            <span className="detail-label">{label}</span>
            <span className={`detail-value ${getBadgeClass()}`}>
                {type === 'admin' && <Shield size={14} />}
                {type === 'premium' && <Crown size={14} />}
                {type === 'free' && <Star size={14} />}
                {value}
            </span>
        </div>
    );
};


const HistoryArtwork = React.memo(({ track }) => {
    const { artworkSrc, isLoading, errorStatus } = useArtwork(track.uuid);
    const [imageError, setImageError] = useState(false);

    const handleImageError = () => setImageError(true);

    if (isLoading) {
        return <div className="artwork-fallback"><LoaderCircle size={24} className="animate-spin" /></div>;
    }

    if (errorStatus || !artworkSrc || imageError) {
        return <div className="artwork-fallback"><Music size={24} /></div>;
    }

    return <img src={artworkSrc} alt={`${track.title} by ${track.artist}`} onError={handleImageError} loading="lazy" />;
});
HistoryArtwork.displayName = 'HistoryArtwork';


const HistoryTrackItem = ({ track, index, t }) => {
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInMinutes < 1) return t('justNow');
        if (diffInMinutes < 60) return t('minutesAgo', { count: diffInMinutes });
        if (diffInHours < 24) return t('hoursAgo', { count: diffInHours });
        if (diffInDays === 1) return t('yesterday');
        return t('daysAgo', { count: diffInDays });
    };

    return (
        <div className="history-item" style={{ animationDelay: `${index * 0.05}s` }}>
            <div className="history-artwork">
                <HistoryArtwork track={track} />
            </div>
            <div className="history-info">
                <Link to={`/tracks/${track.uuid}`} className="track-title-link" title={track.title}>
                    {track.title}
                </Link>
                <Link to={`/artists/${encodeURIComponent(track.artist)}`} className="track-artist-link" title={track.artist}>
                    {track.artist}
                </Link>
            </div>
            <div className="history-time" title={new Date(track.listened_at).toLocaleString()}>
                <Clock size={12} />
                {formatTime(track.listened_at)}
            </div>
        </div>
    );
};


const LoadingSpinner = ({ t }) => (
    <div className="profile-status-message loading">
        <LoaderCircle size={48} className="animate-spin" />
        <span>{t('loading')}</span>
    </div>
);

const ErrorMessage = ({ message, onRetry, t }) => (
    <div className="profile-status-message error">
        <p>{t('error', { message })}</p>
        {onRetry && (
            <button onClick={onRetry} className="retry-button">
                {t('retry')}
            </button>
        )}
    </div>
);



const ProfilePage = () => {
    const { user } = useAuth();
    const { t, i18n } = useTranslation('profile');

    const [profile, setProfile] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [avatarDeleting, setAvatarDeleting] = useState(false);

    const fileInputRef = useRef(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const [profileData, historyData] = await Promise.all([
                api.user.getProfile(),
                api.user.getHistory()
            ]);
            
            setProfile(profileData);
            setHistory(historyData);
        } catch (err) {
            console.error('Profile fetch error:', err);
            setError(err.message || t('loadFailed'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const validateImageFile = (file) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; 
        
        if (!validTypes.includes(file.type)) {
            throw new Error(t('invalidImageType'));
        }
        if (file.size > maxSize) {
            throw new Error(t('imageTooLarge'));
        }
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            validateImageFile(file);
            setAvatarUploading(true);
            
            const result = await api.user.uploadProfilePicture(file);
            setProfile(prev => ({ ...prev, ...result.profile_data }));
        } catch (err) {
            console.error('Avatar upload error:', err);
            alert(err.message || t('avatarUpdateError'));
        } finally {
            setAvatarUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDeletePicture = async () => {
        if (!window.confirm(t('deleteAvatarConfirm'))) return;
        
        try {
            setAvatarDeleting(true);
            const result = await api.user.deleteProfilePicture();
            setProfile(prev => ({ ...prev, ...result.profile_data }));
        } catch (err) {
            console.error('Avatar delete error:', err);
            alert(err.message || t('avatarDeleteError'));
        } finally {
            setAvatarDeleting(false);
        }
    };

    const handleAvatarClick = () => {
        if (!avatarUploading && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    if (loading) {
        return <LoadingSpinner t={t} />;
    }
    if (error) {
        return <ErrorMessage message={error} onRetry={fetchData} t={t} />;
    }
    if (!profile) {
        return <ErrorMessage message={t('profileNotFound')} t={t} />;
    }

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' });
    const registrationDate = formatDate(profile.created_at);
    
    const getSubscriptionStatus = () => {
        if (!profile.subscription_expires_at) {
            return { text: t('subscriptionFree'), type: 'free' };
        }
        const expiry = new Date(profile.subscription_expires_at);
        if (expiry > new Date()) {
            return { text: t('subscriptionActive', { type: profile.subscription_type, date: formatDate(profile.subscription_expires_at) }), type: 'premium' };
        } else {
            return { text: t('subscriptionExpired'), type: 'free' };
        }
    };
    const subscriptionStatus = getSubscriptionStatus();

    return (
        <div className="profile-page-container">
            <aside className="profile-sidebar">
                <div className="profile-card">
                    <div className="profile-avatar-section">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/png,image/jpeg,image/webp" disabled={avatarUploading} />
                        <div className="avatar-wrapper" onClick={handleAvatarClick} title={t('changeAvatar')}>
                            {profile.profile_picture_url ? (
                                <img src={profile.profile_picture_url} alt={`${profile.username}'s avatar`} className="profile-avatar" />
                            ) : (
                                <User size={80} className="profile-avatar-placeholder" />
                            )}
                            <div className="avatar-overlay">
                                {avatarUploading ? (
                                    <LoaderCircle size={32} className="animate-spin" />
                                ) : (
                                    <UploadCloud size={32} />
                                )}
                            </div>
                        </div>
                        {profile.profile_picture_url && !avatarUploading && (
                            <button className="delete-avatar-btn" onClick={handleDeletePicture} disabled={avatarDeleting} aria-label={t('deleteAvatar')} title={t('deleteAvatar')}>
                                {avatarDeleting ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            </button>
                        )}
                    </div>

                    <h1 className="profile-username">{profile.username}</h1>
                    <div className="profile-email">
                        <Mail size={16} />
                        {profile.email || t('noEmail')}
                    </div>
                    
                    <div className="profile-details">
                        <ProfileDetailItem icon={Calendar} label={t('memberSince')} value={registrationDate} />
                        <ProfileDetailItem icon={Gem} label={t('subscription')} value={subscriptionStatus.text} type={subscriptionStatus.type} />
                        {profile.is_superuser && (
                            <ProfileDetailItem icon={Shield} label={t('status')} value={t('administrator')} type="admin" />
                        )}
                        <ProfileDetailItem icon={Headphones} label={t('tracksPlayed')} value={history.length.toLocaleString()} />
                    </div>
                </div>
            </aside>
            
            <main className="profile-main-content">
                <h2 className="section-title">
                    <Play size={28} />
                    {t('listeningHistory')}
                </h2>
                
                <div className="history-list">
                    {history.length > 0 ? (
                        history.map((item, index) => (
                            <HistoryTrackItem 
                                key={`${item.id}-${item.listened_at}`} 
                                track={item} 
                                index={index}
                                t={t}
                            />
                        ))
                    ) : (
                        <div className="no-history-message">
                            <Music size={48} />
                            <p>{t('noHistory')}</p>
                            <p>{t('noHistoryDescription')}</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;