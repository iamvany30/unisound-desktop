import React, { useRef, useCallback, useMemo } from 'react';
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
    const [imageError, setImageError] = React.useState(false);
    if (isLoading) return <div className="artwork-fallback"><LoaderCircle size={24} className="animate-spin" /></div>;
    if (errorStatus || !artworkSrc || imageError) return <div className="artwork-fallback"><Music size={24} /></div>;
    return <img src={artworkSrc} alt={`${track.title}`} onError={() => setImageError(true)} loading="lazy" />;
});
HistoryArtwork.displayName = 'HistoryArtwork';

const HistoryTrackItem = ({ track, index, t }) => {
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        if (diffInMinutes < 1) return t('justNow');
        if (diffInMinutes < 60) return t('minutesAgo', { count: diffInMinutes });
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return t('hoursAgo', { count: diffInHours });
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays === 1) return t('yesterday');
        return t('daysAgo', { count: diffInDays });
    };

    return (
        <div className="history-item" style={{ animationDelay: `${index * 0.05}s` }}>
            <div className="history-artwork"><HistoryArtwork track={track} /></div>
            <div className="history-info">
                <Link to={`/tracks/${track.uuid}`} className="track-title-link" title={track.title}>{track.title}</Link>
                <Link to={`/artists/${encodeURIComponent(track.artist)}`} className="track-artist-link" title={track.artist}>{track.artist}</Link>
            </div>
            <div className="history-time" title={new Date(track.listened_at).toLocaleString()}><Clock size={12} />{formatTime(track.listened_at)}</div>
        </div>
    );
};

const StatusMessage = ({ status, message, onRetry, t }) => (
    <div className={`profile-status-message ${status === 'error' ? 'error' : ''}`}>
        {status === 'loading' && <LoaderCircle size={48} className="animate-spin" />}
        <p>{message}</p>
        {onRetry && <button onClick={onRetry} className="retry-button">{t('retry')}</button>}
    </div>
);

const HistoryItemSkeleton = () => (
    <div className="history-item-skeleton">
        <div className="skeleton-block"></div>
        <div>
            <div className="skeleton-block skeleton-line" style={{ width: '60%', marginBottom: 'var(--spacing-md)' }}></div>
            <div className="skeleton-block skeleton-line" style={{ width: '40%' }}></div>
        </div>
    </div>
);

const ProfileSkeleton = () => (
    <div className="profile-page-container">
        <aside className="profile-sidebar">
            <div className="profile-card">
                <div className="skeleton-block skeleton-avatar"></div>
                <div className="skeleton-block skeleton-line" style={{ width: '70%', height: '2.5rem', margin: 'var(--spacing-lg) auto' }}></div>
                <div className="skeleton-block skeleton-line" style={{ width: '50%', margin: '0 auto var(--spacing-xl)' }}></div>
                <div style={{ paddingTop: 'var(--spacing-xl)', borderTop: '1px solid var(--color-border)' }}>
                    {[...Array(4)].map((_, i) => <div key={i} className="skeleton-block skeleton-line" style={{ width: `${90 - i * 5}%`, margin: 'var(--spacing-md) auto' }}></div>)}
                </div>
            </div>
        </aside>
        <main className="profile-main-content">
             <div className="skeleton-block skeleton-line" style={{ width: '40%', height: '2rem', marginBottom: 'var(--spacing-xl)' }}></div>
             <div className="history-list">{[...Array(5)].map((_, i) => <HistoryItemSkeleton key={i} />)}</div>
        </main>
    </div>
);

const ProfileSidebar = ({ profile, historyCount, onProfileUpdate, t, i18n }) => {
    const fileInputRef = useRef(null);
    const [avatarAction, setAvatarAction] = React.useState({ state: 'idle', error: null }); 

    const formatDate = useCallback((dateString) => new Date(dateString).toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' }), [i18n.language]);

    const subscriptionStatus = useMemo(() => {
        if (!profile.subscription_expires_at) return { text: t('subscriptionFree'), type: 'free' };
        const expiry = new Date(profile.subscription_expires_at);
        if (expiry > new Date()) return { text: t('subscriptionActive', { type: profile.subscription_type, date: formatDate(profile.subscription_expires_at) }), type: 'premium' };
        return { text: t('subscriptionExpired'), type: 'free' };
    }, [profile, t, formatDate]);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            if (file.size > 5 * 1024 * 1024) throw new Error(t('imageTooLarge'));
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error(t('invalidImageType'));

            setAvatarAction({ state: 'uploading', error: null });
            const result = await api.user.uploadProfilePicture(file);
            onProfileUpdate(result.profile_data);
        } catch (err) {
            setAvatarAction({ state: 'idle', error: err.message || t('avatarUpdateError') });
        } finally {
            setAvatarAction({ state: 'idle', error: null });
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeletePicture = async () => {
        if (!window.confirm(t('deleteAvatarConfirm'))) return;
        setAvatarAction({ state: 'deleting', error: null });
        try {
            const result = await api.user.deleteProfilePicture();
            onProfileUpdate(result.profile_data);
        } catch (err) {
            setAvatarAction({ state: 'idle', error: err.message || t('avatarDeleteError') });
        } finally {
            setAvatarAction({ state: 'idle', error: null });
        }
    };

    return (
        <aside className="profile-sidebar">
            <div className="profile-card">
                <div className="profile-avatar-section">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/png,image/jpeg,image/webp" disabled={avatarAction.state !== 'idle'} />
                    <div className="avatar-wrapper" onClick={() => fileInputRef.current?.click()} onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()} role="button" tabIndex="0" title={t('changeAvatar')}>
                        {profile.profile_picture_url ? <img src={profile.profile_picture_url} alt={t('avatarAlt', { username: profile.username })} className="profile-avatar" /> : <User size={80} className="profile-avatar-placeholder" />}
                        <div className="avatar-overlay">
                            {avatarAction.state === 'uploading' ? <LoaderCircle size={32} className="animate-spin" /> : <UploadCloud size={32} />}
                        </div>
                    </div>
                    {profile.profile_picture_url && avatarAction.state === 'idle' && (
                        <button className="delete-avatar-btn" onClick={handleDeletePicture} aria-label={t('deleteAvatar')} title={t('deleteAvatar')}>
                            <Trash2 size={16} />
                        </button>
                    )}
                    {avatarAction.state === 'deleting' && <LoaderCircle size={16} className="delete-avatar-btn animate-spin" />}
                    <div className="avatar-action-feedback">{avatarAction.error}</div>
                </div>

                <h1 className="profile-username">{profile.username}</h1>
                <div className="profile-email"><Mail size={16} />{profile.email || t('noEmail')}</div>
                
                <div className="profile-details">
                    <ProfileDetailItem icon={Calendar} label={t('memberSince')} value={formatDate(profile.created_at)} />
                    <ProfileDetailItem icon={Gem} label={t('subscription')} value={subscriptionStatus.text} type={subscriptionStatus.type} />
                    {profile.is_superuser && <ProfileDetailItem icon={Shield} label={t('status')} value={t('administrator')} type="admin" />}
                    <ProfileDetailItem icon={Headphones} label={t('tracksPlayed')} value={historyCount.toLocaleString()} />
                </div>
            </div>
        </aside>
    );
};

const ProfileContent = ({ history, t }) => (
    <main className="profile-main-content">
        <h2 className="section-title"><Play size={28} />{t('listeningHistory')}</h2>
        <div className="history-list">
            {history.length > 0 ? (
                history.map((item, index) => <HistoryTrackItem key={`${item.id}-${item.listened_at}`} track={item} index={index} t={t} />)
            ) : (
                <div className="no-history-message">
                    <Music size={48} /><p>{t('noHistory')}</p><p>{t('noHistoryDescription')}</p>
                </div>
            )}
        </div>
    </main>
);

const ProfilePage = () => {
    const { t, i18n } = useTranslation('profile');
    const { user, history, loading, updateUser } = useAuth();


    if (loading) {
        return <ProfileSkeleton />;
    }

    if (!user) {
        return <StatusMessage status="error" message={t('profileNotFound')} t={t} />;
    }

    return (
        <div className="profile-page-container">
             <ProfileSidebar
                profile={user}
                historyCount={history.length}
                onProfileUpdate={updateUser}
                t={t}
                i18n={i18n}
             />
             <ProfileContent history={history} t={t} />
        </div>
    );
};

export default ProfilePage;