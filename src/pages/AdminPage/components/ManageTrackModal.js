import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api';
import { useModal } from '../../../context/ModalContext';
import { LoaderCircle, UploadCloud, Trash2, Wand2, Save, AlertTriangle } from 'lucide-react';

const styles = {
    input: { width: '100%', padding: '10px', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '8px', color: '#e6edf3', fontSize: '14px' },
    artwork: { width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', backgroundColor: '#0d1117' },
    modalTabs: { display: 'flex', borderBottom: '1px solid #30363d', marginBottom: '24px', flexWrap: 'wrap' },
    modalTab: { padding: '12px 16px', border: 'none', background: 'none', color: '#8b949e', cursor: 'pointer', borderBottom: '2px solid transparent', fontSize: '14px', fontWeight: 500 },
    modalTabActive: { color: '#e6edf3', borderBottomColor: '#1f6feb' },
    modalSection: { marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #30363d' },
    modalSectionTitle: { margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 600, color: '#e6edf3' },
    button: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#21262d', border: '1px solid #30363d', borderRadius: '8px', color: '#c9d1d9', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s ease' },
    buttonPrimary: { backgroundColor: '#238636', color: '#ffffff', border: '1px solid #238636' },
    buttonDanger: { backgroundColor: 'transparent', color: '#f85149', border: '1px solid #f85149' },
    buttonDangerFilled: { backgroundColor: '#f85149', color: '#ffffff', border: '1px solid #f85149' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { color: '#8b949e', fontSize: '14px' },
    dangerZone: { marginTop: '24px', padding: '16px', border: '1px solid #f85149', borderRadius: '8px', backgroundColor: 'rgba(248, 81, 73, 0.1)' },
    dangerTitle: { margin: '0 0 8px 0', color: '#f85149', fontWeight: 600 },
    fileInputWrapper: { position: 'relative', display: 'flex', alignItems: 'center', width: '100%', height: '42px', border: '1px solid #30363d', borderRadius: '8px', backgroundColor: '#0d1117', overflow: 'hidden' },
    fileInputLabel: { padding: '0 16px', height: '100%', display: 'flex', alignItems: 'center', backgroundColor: '#21262d', borderRight: '1px solid #30363d', color: '#c9d1d9', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background-color 0.2s ease' },
    fileNameDisplay: { paddingLeft: '12px', color: '#8b949e', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    radioGroup: { display: 'flex', gap: '24px', marginTop: '16px' },
};

const ActionButton = ({ onClick, children, variant, ...props }) => (
    <button onClick={onClick} style={{...styles.button, ...(variant ? styles[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}`] : {})}} {...props}>
        {children}
    </button>
);

const ManageTrackModal = ({ track: initialTrack, onUpdateSuccess, onDeleteSuccess }) => {
    const { t } = useTranslation('admin');
    const { showAlertModal, showConfirmModal, hideModal } = useModal();
    const [track, setTrack] = useState(initialTrack);
    const [activeTab, setActiveTab] = useState('metadata');
    
    const [formData, setFormData] = useState({});
    const [syncOffset, setSyncOffset] = useState(0);
    const [lrcFile, setLrcFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [videoType, setVideoType] = useState('short');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [artworkFile, setArtworkFile] = useState(null);
    const [artworkKey, setArtworkKey] = useState(Date.now());

    useEffect(() => {
        setFormData({
            title: track.title || '', artist: track.artist || '', album: track.album || '',
            genre: track.genre || '', date: track.year || '', tracknumber: track.track_number || '',
            lyrics: track.lyrics || ''
        });
        setSyncOffset(track.video_audio_sync_offset_seconds || 0);
    }, [track]);

    const handleSuccess = (updatedTrackData) => {
        const newTrack = { ...track, ...updatedTrackData };
        setTrack(newTrack);
        onUpdateSuccess(newTrack);
        setArtworkKey(Date.now());
    };

    const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleMetadataSave = async () => {
        setIsSubmitting(true);
        try {
            const changedData = Object.keys(formData).reduce((acc, key) => {
                const initialValueMap = { date: 'year', tracknumber: 'track_number' };
                const trackKey = initialValueMap[key] || key;
                const initialValue = track[trackKey] || '';
                if (String(formData[key] || '') !== String(initialValue)) { acc[key] = formData[key]; }
                return acc;
            }, {});
            if (Object.keys(changedData).length === 0) {
                showAlertModal("Нет изменений для сохранения.", "Информация");
                return;
            }
            const result = await api.admin.updateTrackMetadata(track.uuid, changedData);
            handleSuccess(result);
            showAlertModal('Метаданные успешно обновлены!', 'Успех');
        } catch (err) { showAlertModal(err.message, 'Ошибка'); }
        finally { setIsSubmitting(false); }
    };

    const handleLrcUpload = async () => {
        if (!lrcFile) return;
        setIsSubmitting(true);
        try {
            await api.admin.uploadTrackLrc(track.uuid, lrcFile);
            handleSuccess({ has_lrc: true });
            showAlertModal('LRC файл успешно загружен.', 'Успех');
        } catch (err) { showAlertModal(err.message, 'Ошибка'); }
        finally { setIsSubmitting(false); setLrcFile(null); }
    };
    
    const handleLrcDelete = () => {
        showConfirmModal("Вы уверены, что хотите удалить LRC файл?", async () => {
            try {
                await api.admin.deleteTrackLrc(track.uuid);
                handleSuccess({ has_lrc: false });
                showAlertModal('LRC файл удален.', 'Успех');
            } catch (err) { showAlertModal(err.message, 'Ошибка'); }
        });
    };

    const handleSyncSave = async () => {
        setIsSubmitting(true);
        try {
            const result = await api.admin.setTrackSyncOffset(track.uuid, parseFloat(syncOffset));
            handleSuccess(result.track_metadata);
            showAlertModal('Смещение синхронизации сохранено.', 'Успех');
        } catch (err) { showAlertModal(err.message, 'Ошибка'); }
        finally { setIsSubmitting(false); }
    };

    const handleTrackDelete = () => {
        showConfirmModal(`Вы уверены, что хотите НАВСЕГДА удалить трек "${track.title}"?`, async () => {
            try {
                await api.admin.deleteTrack(track.uuid);
                showAlertModal('Трек успешно удален.', 'Успех');
                hideModal();
                onDeleteSuccess(track.uuid);
            } catch (err) { showAlertModal(err.message, 'Ошибка'); }
        });
    };
    
    const handleArtworkUpload = async () => {
        if (!artworkFile) return;
        setIsSubmitting(true);
        try {
            const result = await api.admin.uploadTrackArtwork(track.uuid, artworkFile);
            handleSuccess(result.track_metadata);
            showAlertModal('Обложка успешно обновлена!', 'Успех');
        } catch(err) { showAlertModal(err.message, 'Ошибка'); }
        finally { setIsSubmitting(false); setArtworkFile(null); }
    };

    const handleArtworkDelete = () => {
        showConfirmModal('Удалить встроенную обложку из файла трека?', async () => {
            try {
                const result = await api.admin.deleteTrackArtwork(track.uuid);
                handleSuccess(result.track_metadata);
                showAlertModal('Обложка удалена.', 'Успех');
            } catch(err) { showAlertModal(err.message, 'Ошибка'); }
        });
    };
    
    const handleVideoUpload = async () => {
        if (!videoFile) return;
        setIsSubmitting(true);
        try {
            const result = await api.admin.uploadTrackVideo(track.uuid, videoFile, videoType);
            handleSuccess(result.track_metadata);
            showAlertModal('Видео успешно загружено!', 'Успех');
        } catch (err) { showAlertModal(err.message, 'Ошибка'); } 
        finally { setIsSubmitting(false); setVideoFile(null); }
    };
    
    const handleVideoDelete = (type) => {
        showConfirmModal(`Вы уверены, что хотите удалить ${type} видео?`, async () => {
            try {
                const result = await api.admin.deleteTrackVideo(track.uuid, type);
                handleSuccess(result.track_metadata);
                showAlertModal('Видео удалено.', 'Успех');
            } catch (err) { showAlertModal(err.message, 'Ошибка'); }
        });
    };
    
    return (
        <div>
            <div style={styles.modalTabs}>
                <button style={{...styles.modalTab, ...(activeTab === 'metadata' ? styles.modalTabActive : {})}} onClick={() => setActiveTab('metadata')}>Метаданные</button>
                <button style={{...styles.modalTab, ...(activeTab === 'artwork' ? styles.modalTabActive : {})}} onClick={() => setActiveTab('artwork')}>Обложка</button>
                <button style={{...styles.modalTab, ...(activeTab === 'video' ? styles.modalTabActive : {})}} onClick={() => setActiveTab('video')}>Видео и Синхр.</button>
                <button style={{...styles.modalTab, ...(activeTab === 'lyrics' ? styles.modalTabActive : {})}} onClick={() => setActiveTab('lyrics')}>Текст (LRC)</button>
                <button style={{...styles.modalTab, ...(activeTab === 'actions' ? styles.modalTabActive : {})}} onClick={() => setActiveTab('actions')}>Действия</button>
            </div>
            
            {activeTab === 'metadata' && (
                <div>
                    <div style={styles.formGrid}>
                        {Object.keys(formData).map(key => (
                            key !== 'lyrics' &&
                            <div key={key} style={styles.formGroup}>
                                <label style={styles.label} htmlFor={key}>{t(`metadata.${key}`, key.charAt(0).toUpperCase() + key.slice(1))}</label>
                                <input type="text" id={key} name={key} value={formData[key]} onChange={handleInputChange} style={styles.input} />
                            </div>
                        ))}
                    </div>
                     <div style={{...styles.formGroup, marginTop: '16px'}}>
                        <label style={styles.label} htmlFor="lyrics">{t('metadata.lyrics', 'Lyrics (Unsynced)')}</label>
                        <textarea id="lyrics" name="lyrics" value={formData.lyrics} onChange={handleInputChange} style={{...styles.input, minHeight: '120px', fontFamily: 'monospace'}} />
                    </div>
                    <div style={{textAlign: 'right', marginTop: '24px'}}>
                        <ActionButton onClick={handleMetadataSave} disabled={isSubmitting} variant="primary"><Save size={16}/> Сохранить метаданные</ActionButton>
                    </div>
                </div>
            )}
            
            {activeTab === 'artwork' && (
                 <div>
                    <div style={{...styles.modalSection, display: 'flex', gap: '16px', alignItems: 'center'}}>
                        <img src={`${api.player.getArtworkUrl(track.uuid)}&t=${artworkKey}`} style={styles.artwork} alt="Current Artwork"/>
                        <div>
                            <h4 style={styles.modalSectionTitle}>Текущая обложка</h4>
                            <p style={{color: '#8b949e', margin: 0}}>{track.has_artwork ? 'Обложка встроена в файл.' : 'Встроенная обложка отсутствует.'}</p>
                        </div>
                    </div>
                    <div style={styles.modalSection}>
                        <h4 style={styles.modalSectionTitle}>Загрузить новую обложку</h4>
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setArtworkFile(e.target.files)} style={styles.input}/>
                        <ActionButton onClick={handleArtworkUpload} disabled={!artworkFile || isSubmitting} variant="primary" style={{marginTop: '12px'}}>
                            {isSubmitting ? <LoaderCircle className="animate-spin" /> : <UploadCloud size={16}/>} Загрузить
                        </ActionButton>
                    </div>
                    <div style={{...styles.modalSection, borderBottom: 'none'}}>
                         <h4 style={styles.modalSectionTitle}>Удалить обложку</h4>
                         <ActionButton onClick={handleArtworkDelete} disabled={!track.has_artwork || isSubmitting} variant="danger">
                            <Trash2 size={16}/> Удалить
                        </ActionButton>
                    </div>
                </div>
            )}

            {activeTab === 'video' && (
                <div>
                    <div style={{...styles.modalSection, borderBottom: 'none'}}>
                        <h4 style={styles.modalSectionTitle}>{t('videoModal.currentStatus')}</h4>
                        <p style={{color: '#c9d1d9', margin: '4px 0'}}>Short: {track.video_short_filename || 'Нет'}</p>
                        <p style={{color: '#c9d1d9', margin: '4px 0'}}>Full: {track.video_full_filename || 'Нет'}</p>
                    </div>
                    <div style={styles.modalSection}>
                        <h4 style={styles.modalSectionTitle}>Загрузить новое видео</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={styles.fileInputWrapper}>
                                <label htmlFor="video-upload" style={styles.fileInputLabel}>Выберите файл</label>
                                <span style={styles.fileNameDisplay}>{videoFile?.name || 'Файл не выбран'}</span>
                                <input type="file" id="video-upload" accept="video/mp4,video/webm" onChange={e => setVideoFile(e.target.files)} style={{ display: 'none' }} />
                            </div>
                            <div style={styles.radioGroup}>
                                <label className="radio-label"><input type="radio" name="videoType" value="short" checked={videoType === 'short'} onChange={e => setVideoType(e.target.value)} /><span className="radio-custom"></span>{t('videoModal.shortVideo')}</label>
                                <label className="radio-label"><input type="radio" name="videoType" value="full" checked={videoType === 'full'} onChange={e => setVideoType(e.target.value)} /><span className="radio-custom"></span>{t('videoModal.fullVideo')}</label>
                            </div>
                            <ActionButton onClick={handleVideoUpload} disabled={!videoFile || isSubmitting} variant="primary" style={{width:'100%'}}>
                                {isSubmitting ? <LoaderCircle className="animate-spin" /> : <UploadCloud size={16}/>} Загрузить
                            </ActionButton>
                        </div>
                    </div>
                    <div style={{...styles.modalSection, borderBottom: 'none'}}>
                        <h4 style={styles.modalSectionTitle}>Синхронизация Аудио/Видео</h4>
                        <div style={{...styles.formGroup, maxWidth: '300px'}}>
                            <label style={styles.label}>Смещение видео (в секундах)</label>
                            <input type="number" value={syncOffset} onChange={e => setSyncOffset(e.target.value)} step="0.1" style={styles.input} />
                        </div>
                         <ActionButton onClick={handleSyncSave} disabled={isSubmitting} style={{marginTop: '12px'}}><Save size={16}/> Сохранить смещение</ActionButton>
                    </div>
                </div>
            )}
            
            {activeTab === 'lyrics' && (
                 <div>
                    <div style={styles.modalSection}>
                        <h4 style={styles.modalSectionTitle}>Статус LRC</h4>
                        <p style={{color: '#c9d1d9'}}>Наличие синхронизированного текста (.lrc): <strong style={{color: track.has_lrc ? '#238636' : '#f85149'}}>{track.has_lrc ? 'Да' : 'Нет'}</strong></p>
                        {track.has_lrc && <ActionButton onClick={handleLrcDelete} variant="danger"><Trash2 size={16}/> Удалить .lrc файл</ActionButton>}
                    </div>
                    <div style={{...styles.modalSection, borderBottom: 'none'}}>
                        <h4 style={styles.modalSectionTitle}>Загрузить новый .lrc файл</h4>
                        <p style={{color: '#8b949e', fontSize: '14px', margin: '0 0 12px 0'}}>Файл должен иметь то же имя, что и аудиофайл, но с расширением .lrc.</p>
                        <input type="file" accept=".lrc" onChange={e => setLrcFile(e.target.files)} style={styles.input} />
                        <ActionButton onClick={handleLrcUpload} disabled={!lrcFile || isSubmitting} variant="primary" style={{marginTop: '12px'}}>
                            {isSubmitting ? <LoaderCircle className="animate-spin" /> : <UploadCloud size={16}/>} Загрузить
                        </ActionButton>
                    </div>
                </div>
            )}

             {activeTab === 'actions' && (
                <div>
                    {}
                    <div style={styles.dangerZone}>
                        <h4 style={styles.dangerTitle}><AlertTriangle size={18} style={{verticalAlign: 'middle', marginRight: '8px'}}/>Опасная зона</h4>
                        <p style={{color: '#8b949e', fontSize: '14px', margin: '0 0 12px 0'}}>Это действие нельзя будет отменить. Трек, его файл и вся связанная информация будут удалены навсегда.</p>
                        <ActionButton onClick={handleTrackDelete} variant="dangerFilled"><Trash2 size={16}/> Удалить трек полностью</ActionButton>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageTrackModal;