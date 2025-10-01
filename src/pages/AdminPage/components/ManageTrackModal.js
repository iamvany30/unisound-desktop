import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api';
import { useModal } from '../../../context/ModalContext';
import { 
    LoaderCircle, UploadCloud, Trash2, Wand2, Save, AlertTriangle, 
    FileText, Video, ImageIcon, Settings, CheckCircle, XCircle 
} from 'lucide-react';

const styles = {
    input: { width: '100%', padding: '10px', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '8px', color: '#e6edf3', fontSize: '14px', transition: 'border-color 0.2s ease, box-shadow 0.2s ease' },
    inputFocus: { borderColor: '#1f6feb', boxShadow: '0 0 0 3px rgba(31, 111, 235, 0.3)' },
    artwork: { width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', backgroundColor: '#0d1117' },
    modalTabs: { display: 'flex', borderBottom: '1px solid #30363d', marginBottom: '24px', flexWrap: 'wrap' },
    modalTab: { padding: '12px 16px', border: 'none', background: 'none', color: '#8b949e', cursor: 'pointer', borderBottom: '2px solid transparent', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' },
    modalTabActive: { color: '#e6edf3', borderBottomColor: '#1f6feb' },
    modalSection: { marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #30363d' },
    modalSectionTitle: { margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 600, color: '#e6edf3' },
    button: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#21262d', border: '1px solid #30363d', borderRadius: '8px', color: '#c9d1d9', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s ease', minWidth: '120px', minHeight: '42px' },
    buttonPrimary: { backgroundColor: '#238636', color: '#ffffff', border: '1px solid #238636' },
    buttonDanger: { backgroundColor: 'transparent', color: '#f85149', border: '1px solid rgba(248, 81, 73, 0.5)' },
    buttonDangerFilled: { backgroundColor: '#da3633', color: '#ffffff', border: '1px solid #da3633' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { color: '#8b949e', fontSize: '14px' },
    dangerZone: { marginTop: '24px', padding: '16px', border: '1px solid #f85149', borderRadius: '8px', backgroundColor: 'rgba(248, 81, 73, 0.1)' },
    dangerTitle: { margin: '0 0 8px 0', color: '#f85149', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' },
    fileInputWrapper: { position: 'relative', display: 'flex', alignItems: 'center', width: '100%', height: '42px', border: '1px solid #30363d', borderRadius: '8px', backgroundColor: '#0d1117', overflow: 'hidden' },
    fileInputLabel: { padding: '0 16px', height: '100%', display: 'flex', alignItems: 'center', backgroundColor: '#21262d', borderRight: '1px solid #30363d', color: '#c9d1d9', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background-color 0.2s ease' },
    fileNameDisplay: { paddingLeft: '12px', color: '#8b949e', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    radioGroup: { display: 'flex', gap: '24px', marginTop: '16px' },
    statusText: { color: '#8b949e', margin: 0, fontSize: '14px' },
    statusTextSuccess: { color: '#3fb950' },
    statusTextError: { color: '#f85149' },
};


const TabButton = ({ id, activeTab, setActiveTab, icon: Icon, label }) => (
    <button 
        style={{...styles.modalTab, ...(activeTab === id ? styles.modalTabActive : {})}} 
        onClick={() => setActiveTab(id)}
    >
        <Icon size={16} />
        <span>{label}</span>
    </button>
);

const FormGroup = ({ label, name, value, onChange, type = 'text', ...props }) => (
    <div style={styles.formGroup}>
        <label style={styles.label} htmlFor={name}>{label}</label>
        {type === 'textarea' ? (
            <textarea id={name} name={name} value={value} onChange={onChange} style={{...styles.input, minHeight: '120px', fontFamily: 'monospace'}} {...props} />
        ) : (
            <input type={type} id={name} name={name} value={value} onChange={onChange} style={styles.input} {...props} />
        )}
    </div>
);

const FileInput = ({ id, accept, file, setFile, label = "Выберите файл" }) => (
    <div style={styles.fileInputWrapper}>
        <label htmlFor={id} style={styles.fileInputLabel}>{label}</label>
        <span style={styles.fileNameDisplay}>{file?.name || 'Файл не выбран'}</span>
        <input 
            type="file" 
            id={id}
            accept={accept} 
            onChange={e => setFile(e.target.files[0])} 
            style={{ display: 'none' }} 
        />
    </div>
);

const ActionButton = ({ onClick, children, variant, loading, success, ...props }) => {
    let content = children;
    if (loading) content = <><LoaderCircle size={16} className="animate-spin" /> Загрузка...</>;
    if (success) content = <><CheckCircle size={16} /> Успешно</>;

    return (
        <button 
            onClick={onClick} 
            style={{...styles.button, ...(variant ? styles[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}`] : {})}} 
            {...props}
        >
            {content}
        </button>
    );
};

const ActionSection = ({ title, children, noBorder = false }) => (
    <div style={{...styles.modalSection, ...(noBorder && { borderBottom: 'none' })}}>
        <h4 style={styles.modalSectionTitle}>{title}</h4>
        {children}
    </div>
);



const ManageTrackModal = ({ track: initialTrack, onUpdateSuccess, onDeleteSuccess }) => {
    const { t } = useTranslation('admin');
    const { showAlertModal, showConfirmModal, hideModal } = useModal();
    
    const [track, setTrack] = useState(initialTrack);
    const [activeTab, setActiveTab] = useState('metadata');
    
    const [formData, setFormData] = useState({});
    const [artworkFile, setArtworkFile] = useState(null);
    const [artworkPreview, setArtworkPreview] = useState(null);
    const [lrcFile, setLrcFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [videoType, setVideoType] = useState('short');
    
    const [actionStates, setActionStates] = useState({
        saveMeta: 'idle', enhance: 'idle',
        uploadArt: 'idle', deleteArt: 'idle',
        uploadLrc: 'idle', deleteLrc: 'idle',
        uploadVideo: 'idle', saveSync: 'idle',
        deleteTrack: 'idle'
    });
    const successTimeoutRef = useRef({});

    useEffect(() => {
        setFormData({
            title: track.title || '', artist: track.artist || '', album: track.album || '',
            genre: track.genre || '', date: track.year || '', tracknumber: track.track_number || '',
            lyrics: track.lyrics || '', video_audio_sync_offset_seconds: track.video_audio_sync_offset_seconds || 0
        });
    }, [track]);

    useEffect(() => {
        if (!artworkFile) {
            setArtworkPreview(null);
            return;
        }
        const objectUrl = URL.createObjectURL(artworkFile);
        setArtworkPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [artworkFile]);

    const handleApiCall = useCallback(async (actionKey, apiCall, successMessage) => {
        if (successTimeoutRef.current[actionKey]) clearTimeout(successTimeoutRef.current[actionKey]);
        setActionStates(prev => ({ ...prev, [actionKey]: 'loading' }));
        try {
            const result = await apiCall();
            const updatedTrackData = result?.track_metadata || result;
            const newTrack = { ...track, ...updatedTrackData };
            setTrack(newTrack);
            onUpdateSuccess(newTrack);

            setActionStates(prev => ({ ...prev, [actionKey]: 'success' }));
            successTimeoutRef.current[actionKey] = setTimeout(() => {
                setActionStates(prev => ({ ...prev, [actionKey]: 'idle' }));
            }, 2000);

            if (actionKey.startsWith('upload')) {
                if (actionKey.includes('Art')) setArtworkFile(null);
                if (actionKey.includes('Lrc')) setLrcFile(null);
                if (actionKey.includes('Video')) setVideoFile(null);
            }
            
            return result;
        } catch (err) {
            setActionStates(prev => ({ ...prev, [actionKey]: 'error' }));
            showAlertModal(err.message, 'Ошибка');
            setTimeout(() => setActionStates(prev => ({ ...prev, [actionKey]: 'idle' })), 500);
            throw err;
        }
    }, [track, onUpdateSuccess, showAlertModal]);

    const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleMetadataSave = () => handleApiCall('saveMeta', () => api.admin.updateTrackMetadata(track.uuid, formData), 'Метаданные обновлены!');
    const handleEnhance = () => handleApiCall('enhance', () => api.admin.runSingleTrackEnhancer(track.uuid), 'Анализ запущен!');
    const handleArtworkUpload = () => handleApiCall('uploadArt', () => api.admin.uploadTrackArtwork(track.uuid, artworkFile), 'Обложка загружена!');
    const handleArtworkDelete = () => showConfirmModal('Удалить встроенную обложку?', () => handleApiCall('deleteArt', () => api.admin.deleteTrackArtwork(track.uuid), 'Обложка удалена!'));
    const handleLrcUpload = () => handleApiCall('uploadLrc', () => api.admin.uploadTrackLrc(track.uuid, lrcFile), 'LRC файл загружен!');
    const handleLrcDelete = () => showConfirmModal('Удалить LRC файл?', () => handleApiCall('deleteLrc', () => api.admin.deleteTrackLrc(track.uuid), 'LRC файл удален!'));
    const handleVideoUpload = () => handleApiCall('uploadVideo', () => api.admin.uploadTrackVideo(track.uuid, videoFile, videoType), 'Видео загружено!');
    const handleVideoDelete = (type) => showConfirmModal(`Удалить ${type} видео?`, () => handleApiCall(`deleteVideo${type}`, () => api.admin.deleteTrackVideo(track.uuid, type), 'Видео удалено!'));
    const handleSyncSave = () => handleApiCall('saveSync', () => api.admin.setTrackSyncOffset(track.uuid, parseFloat(formData.video_audio_sync_offset_seconds)), 'Смещение сохранено!');
    
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

    const tabs = [
        { id: 'metadata', label: 'Метаданные', icon: FileText },
        { id: 'artwork', label: 'Обложка', icon: ImageIcon },
        { id: 'video', label: 'Видео и Синхр.', icon: Video },
        { id: 'actions', label: 'Действия', icon: Settings }
    ];

    return (
        <div>
            <div style={styles.modalTabs}>
                {tabs.map(tab => (
                    <TabButton key={tab.id} {...tab} activeTab={activeTab} setActiveTab={setActiveTab} />
                ))}
            </div>
            
            {activeTab === 'metadata' && (
                <div>
                    <div style={styles.formGrid}>
                        <FormGroup label="Название" name="title" value={formData.title} onChange={handleInputChange} />
                        <FormGroup label="Исполнитель" name="artist" value={formData.artist} onChange={handleInputChange} />
                        <FormGroup label="Альбом" name="album" value={formData.album} onChange={handleInputChange} />
                        <FormGroup label="Жанр" name="genre" value={formData.genre} onChange={handleInputChange} />
                        <FormGroup label="Год" name="date" value={formData.date} onChange={handleInputChange} type="number" />
                        <FormGroup label="Номер трека" name="tracknumber" value={formData.tracknumber} onChange={handleInputChange} type="number" />
                    </div>
                    <FormGroup label="Текст (без синхронизации)" name="lyrics" value={formData.lyrics} onChange={handleInputChange} type="textarea" />
                    <div style={{textAlign: 'right', marginTop: '24px'}}>
                        <ActionButton onClick={handleMetadataSave} loading={actionStates.saveMeta === 'loading'} success={actionStates.saveMeta === 'success'} disabled={actionStates.saveMeta === 'loading'} variant="primary">
                            <Save size={16}/> Сохранить
                        </ActionButton>
                    </div>
                </div>
            )}
            
            {activeTab === 'artwork' && (
                 <div>
                    <ActionSection title="Текущая обложка">
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center'}}>
                            <img src={artworkPreview || `${api.player.getArtworkUrl(track.uuid)}?t=${Date.now()}`} style={styles.artwork} alt="Artwork"/>
                            <div>
                                <p style={styles.statusText}>{track.has_artwork ? 'Обложка встроена в файл.' : 'Встроенная обложка отсутствует.'}</p>
                                {track.has_artwork && (
                                    <ActionButton onClick={handleArtworkDelete} loading={actionStates.deleteArt === 'loading'} success={actionStates.deleteArt === 'success'} variant="danger" style={{marginTop: '8px'}}>
                                        <Trash2 size={16}/> Удалить
                                    </ActionButton>
                                )}
                            </div>
                        </div>
                    </ActionSection>
                    <ActionSection title="Загрузить новую обложку" noBorder>
                        <FileInput id="artwork-upload" accept="image/jpeg,image/png,image/webp" file={artworkFile} setFile={setArtworkFile} />
                        <ActionButton onClick={handleArtworkUpload} disabled={!artworkFile || actionStates.uploadArt === 'loading'} loading={actionStates.uploadArt === 'loading'} success={actionStates.uploadArt === 'success'} variant="primary" style={{marginTop: '12px'}}>
                            <UploadCloud size={16}/> Загрузить
                        </ActionButton>
                    </ActionSection>
                </div>
            )}

            {activeTab === 'video' && (
                <div>
                    <ActionSection title="Статус видеофайлов">
                        <p style={{...styles.statusText, margin: '4px 0'}}>Short: <strong style={{color: track.video_short_filename ? '#c9d1d9' : '#8b949e'}}>{track.video_short_filename || 'Нет'}</strong></p>
                        {track.video_short_filename && <ActionButton variant="danger" onClick={() => handleVideoDelete('short')}><Trash2 size={16}/> Удалить</ActionButton>}
                        <p style={{...styles.statusText, margin: '16px 0 4px'}}>Full: <strong style={{color: track.video_full_filename ? '#c9d1d9' : '#8b949e'}}>{track.video_full_filename || 'Нет'}</strong></p>
                        {track.video_full_filename && <ActionButton variant="danger" onClick={() => handleVideoDelete('full')}><Trash2 size={16}/> Удалить</ActionButton>}
                    </ActionSection>
                    <ActionSection title="Загрузить новое видео">
                        <FileInput id="video-upload" accept="video/mp4,video/webm" file={videoFile} setFile={setVideoFile} />
                        <div style={styles.radioGroup}>
                            <label className="radio-label"><input type="radio" name="videoType" value="short" checked={videoType === 'short'} onChange={e => setVideoType(e.target.value)} /><span className="radio-custom"></span>{t('videoModal.shortVideo')}</label>
                            <label className="radio-label"><input type="radio" name="videoType" value="full" checked={videoType === 'full'} onChange={e => setVideoType(e.target.value)} /><span className="radio-custom"></span>{t('videoModal.fullVideo')}</label>
                        </div>
                        <ActionButton onClick={handleVideoUpload} disabled={!videoFile || actionStates.uploadVideo === 'loading'} loading={actionStates.uploadVideo === 'loading'} success={actionStates.uploadVideo === 'success'} variant="primary" style={{marginTop: '12px', width: '100%'}}>
                            <UploadCloud size={16}/> Загрузить
                        </ActionButton>
                    </ActionSection>
                    <ActionSection title="Синхронизация Аудио/Видео" noBorder>
                        <FormGroup label="Смещение видео (в секундах)" name="video_audio_sync_offset_seconds" value={formData.video_audio_sync_offset_seconds} onChange={handleInputChange} type="number" step="0.01" />
                        <ActionButton onClick={handleSyncSave} loading={actionStates.saveSync === 'loading'} success={actionStates.saveSync === 'success'} style={{marginTop: '12px'}}><Save size={16}/> Сохранить смещение</ActionButton>
                    </ActionSection>
                </div>
            )}

            {activeTab === 'actions' && (
                <div>
                    <ActionSection title="Анализатор метаданных">
                        <p style={styles.statusText}>Запустить принудительный поиск и загрузку расширенных метаданных для этого трека (обложка, текст, информация об исполнителе).</p>
                        <ActionButton onClick={handleEnhance} loading={actionStates.enhance === 'loading'} success={actionStates.enhance === 'success'} variant="primary" style={{marginTop: '12px'}}>
                            <Wand2 size={16}/> Запустить анализ
                        </ActionButton>
                    </ActionSection>
                     <ActionSection title="Синхронизированный текст (LRC)">
                        <p style={styles.statusText}>Наличие файла .lrc: <strong style={track.has_lrc ? styles.statusTextSuccess : styles.statusTextError}>{track.has_lrc ? 'Да' : 'Нет'}</strong></p>
                        {track.has_lrc && <ActionButton onClick={handleLrcDelete} variant="danger" loading={actionStates.deleteLrc === 'loading'} success={actionStates.deleteLrc === 'success'}><Trash2 size={16}/> Удалить .lrc</ActionButton>}
                        <div style={{marginTop: '16px'}}>
                             <FileInput id="lrc-upload" accept=".lrc" file={lrcFile} setFile={setLrcFile} />
                             <ActionButton onClick={handleLrcUpload} disabled={!lrcFile || actionStates.uploadLrc === 'loading'} loading={actionStates.uploadLrc === 'loading'} success={actionStates.uploadLrc === 'success'} variant="primary" style={{marginTop: '12px'}}>
                                <UploadCloud size={16}/> Загрузить .lrc
                            </ActionButton>
                        </div>
                    </ActionSection>
                    <div style={styles.dangerZone}>
                        <h4 style={styles.dangerTitle}><AlertTriangle size={18}/>Опасная зона</h4>
                        <p style={{...styles.statusText, color: '#8b949e', margin: '0 0 12px 0'}}>Это действие необратимо. Трек, его аудиофайл и вся связанная информация будут удалены навсегда.</p>
                        <ActionButton onClick={handleTrackDelete} variant="dangerFilled"><Trash2 size={16}/> Удалить трек</ActionButton>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageTrackModal;