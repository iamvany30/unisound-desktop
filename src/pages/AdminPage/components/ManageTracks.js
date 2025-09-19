import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api';
import { useModal } from '../../../context/ModalContext';
import { useDebounce } from '../../../hooks/useDebounce';
import { LoaderCircle, Edit } from 'lucide-react';
import ManageTrackModal from './ManageTrackModal'; 

const styles = {
    card: { 
        backgroundColor: '#161b22', 
        border: '1px solid #30363d', 
        borderRadius: '12px', 
        padding: '24px', 
        marginBottom: '24px' 
    },
    cardTitle: { 
        marginTop: 0, 
        marginBottom: '8px', 
        fontSize: '1.5rem', 
        color: '#e6edf3' 
    },
    cardDescription: { 
        marginTop: 0, 
        marginBottom: '24px', 
        color: '#8b949e', 
        lineHeight: 1.5 
    },
    input: { 
        width: '100%', 
        padding: '10px', 
        backgroundColor: '#0d1117', 
        border: '1px solid #30363d', 
        borderRadius: '8px', 
        color: '#e6edf3', 
        fontSize: '14px' 
    },
    statusMessage: { 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '16px', 
        minHeight: '20vh', 
        fontSize: '1.2em', 
        color: '#8b949e' 
    },
    table: { 
        width: '100%', 
        borderCollapse: 'collapse' 
    },
    th: { 
        borderBottom: '1px solid #30363d', 
        padding: '12px', 
        textAlign: 'left', 
        color: '#8b949e', 
        textTransform: 'uppercase', 
        fontSize: '12px' 
    },
    td: { 
        borderBottom: '1px solid #30363d', 
        padding: '12px', 
        color: '#c9d1d9', 
        verticalAlign: 'middle' 
    },
    artwork: { 
        width: '40px', 
        height: '40px', 
        borderRadius: '4px', 
        objectFit: 'cover', 
        verticalAlign: 'middle', 
        backgroundColor: '#0d1117' 
    },
    tag: { 
        padding: '4px 8px', 
        borderRadius: '9999px', 
        fontSize: '12px', 
        fontWeight: '600', 
        display: 'inline-block' 
    },
    videoTag: { 
        backgroundColor: 'rgba(88, 166, 255, 0.2)', 
        color: '#58a6ff' 
    },
    button: { 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '8px', 
        padding: '10px 16px', 
        backgroundColor: '#21262d', 
        border: '1px solid #30363d', 
        borderRadius: '8px', 
        color: '#c9d1d9', 
        cursor: 'pointer', 
        fontSize: '14px', 
        fontWeight: '500', 
        transition: 'all 0.2s ease' 
    },
};

const ManageTracks = () => {
    const { t } = useTranslation('admin');
    const [searchQuery, setSearchQuery] = useState('');
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(false);
    const debouncedQuery = useDebounce(searchQuery, 500);
    const { showModal, hideModal } = useModal();


    const handleUpdateTrackList = (updatedTrack) => {
        setTracks(prevTracks => 
            prevTracks.map(t => t.uuid === updatedTrack.uuid ? { ...t, ...updatedTrack } : t)
        );
    };


    const handleDeleteTrackFromList = (deletedTrackUuid) => {
        setTracks(prevTracks => prevTracks.filter(t => t.uuid !== deletedTrackUuid));
    };

    const openManageTrackModal = (track) => {
        showModal({
            title: `Управление: ${track.title}`,
            body: <ManageTrackModal 
                      track={track} 
                      onClose={hideModal} 
                      onUpdateSuccess={handleUpdateTrackList}
                      onDeleteSuccess={handleDeleteTrackFromList}
                  />,
            size: 'medium' 
        });
    };
    
    useEffect(() => {
        if (debouncedQuery.length < 2) {
            setTracks([]);
            return;
        }

        const searchTracks = async () => {
            setLoading(true);
            try {
                const data = await api.search.global({ q: debouncedQuery, type: 'tracks', limit_tracks: 50 });
                setTracks(data.tracks || []);
            } catch (err) {
                console.error("Track search failed:", err);
            } finally {
                setLoading(false);
            }
        };

        searchTracks();
    }, [debouncedQuery]);

    return (
        <div style={styles.card}>
            <h2 style={styles.cardTitle}>{t('manageTracks')}</h2>
            <p style={styles.cardDescription}>Найдите трек, чтобы управлять его метаданными, файлами и другими параметрами.</p>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('tracks.searchPlaceholder')}
                style={{...styles.input, marginBottom: '24px'}}
                aria-label={t('tracks.searchPlaceholder')}
            />
            {loading && <div style={styles.statusMessage}><LoaderCircle className="animate-spin" /> Поиск треков...</div>}
            
            {!loading && tracks.length === 0 && debouncedQuery.length >= 2 && (
                <div style={styles.statusMessage}>Треки не найдены.</div>
            )}

            {tracks.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}></th>
                                <th style={styles.th}>Трек</th>
                                <th style={styles.th}>Исполнитель</th>
                                <th style={styles.th}>Статус</th>
                                <th style={styles.th}>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tracks.map(track => (
                                <tr key={track.uuid}>
                                    <td style={styles.td}>
                                        <img src={api.player.getArtworkUrl(track.uuid)} style={styles.artwork} alt={track.title} />
                                    </td>
                                    <td style={styles.td}>{track.title}</td>
                                    <td style={styles.td}>{track.artist}</td>
                                    <td style={styles.td}>
                                        {track.video_short_filename && <span style={{...styles.tag, ...styles.videoTag}}>Short</span>}
                                        {track.video_full_filename && <span style={{...styles.tag, ...styles.videoTag, marginLeft: '4px'}}>Full</span>}
                                    </td>
                                    <td style={styles.td}>
                                        <button style={styles.button} onClick={() => openManageTrackModal(track)}>
                                            <Edit size={16}/> {t('tracks.manage')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ManageTracks;