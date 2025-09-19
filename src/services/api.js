
import { API_BASE_URL } from '../config';


class ApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}


const fetchApi = async (url, options = {}) => {
    const token = localStorage.getItem('unisound_token');
    const isFormData = options.body instanceof FormData;
    const fullUrl = `${API_BASE_URL}${url}`;
    
    console.groupCollapsed(`[API REQUEST] ${options.method || 'GET'} ${url}`);
    console.log('Full URL:', fullUrl);
    console.log('Options:', options);
    if (token) {
        console.log('Authorization: Bearer ***');
    } else {
        console.log('Authorization: No token');
    }
    console.groupEnd();

    const headers = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(fullUrl, {
        ...options,
        headers,
    });

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('unisound_token');
            window.location.assign('/login');
            return new Promise(() => {});
        }

        const errorData = await response.json().catch(() => ({
            message: `Request failed with status ${response.status}. Invalid JSON response from server.`
        }));
        
        console.group(`[API ERROR] ${options.method || 'GET'} ${url} - Status: ${response.status}`);
        console.error('URL:', fullUrl);
        console.error('Raw Error Response Body:', errorData);
        console.groupEnd();

        let errorMessage = 'An unknown API error occurred.';
        if (errorData?.detail) {
            if (typeof errorData.detail === 'string') {
                errorMessage = errorData.detail;
            } else if (Array.isArray(errorData.detail)) {
                errorMessage = errorData.detail.map(err => `${(err.loc || []).join('.')}: ${err.msg}`).join('; ');
            } else if (typeof errorData.detail === 'object') {
                errorMessage = Object.entries(errorData.detail).map(([key, value]) => `${key}: ${value}`).join('; ');
            } else {
                errorMessage = JSON.stringify(errorData.detail);
            }
        } else if (errorData?.message) {
            errorMessage = errorData.message;
        } else if (errorData?.description) {
            errorMessage = errorData.description;
        }

        throw new ApiError(errorMessage, response.status, errorData);
    }

    if (response.status === 204) {
        return null;
    }

    const responseData = await response.json();
    
    console.groupCollapsed(`[API SUCCESS] ${options.method || 'GET'} ${url} - Status: ${response.status}`);
    console.log('URL:', fullUrl);
    console.log('Raw Response Body:', responseData);
    console.groupEnd();

    return responseData;
};


const api = {
    system: {
        getStatus: () => fetchApi('/status'),
        healthCheck: () => fetchApi('/health'),
    },
    auth: {
        login: (username, password) => fetchApi('/auth/login', {
            method: 'POST', body: JSON.stringify({ username, password })
        }),
        register: (username, password, email) => fetchApi('/auth/register', {
            method: 'POST', body: JSON.stringify({ username, password, email })
        }),
        telegramWidgetLogin: (tgAuthData) => fetchApi('/auth/telegram/widget_login', {
            method: 'POST', body: JSON.stringify(tgAuthData)
        }),
    },
    user: {
        getProfile: () => fetchApi('/users/me'),
        getHistory: (limit = 50) => fetchApi(`/users/me/history?limit=${limit}`),
        prefetchProfileAndHistory: () => {
            console.log('[Prefetch] Data requested: Profile & History');
            api.user.getProfile().catch(() => {});
            api.user.getHistory().catch(() => {});
        },
        getPublicProfileByUsername: (username) => fetchApi(`/users/${username}`),
        getPublicProfileById: (userId) => fetchApi(`/users/id/${userId}`),
        changeUsername: (newUsername) => fetchApi('/users/me/change-username', {
            method: 'POST', body: JSON.stringify({ new_username: newUsername })
        }),
        uploadProfilePicture: (file) => {
            const formData = new FormData();
            formData.append('profile_pic', file);
            return fetchApi('/users/me/profile-picture', { method: 'POST', body: formData });
        },
        deleteProfilePicture: () => fetchApi('/users/me/profile-picture', { method: 'DELETE' }),
        savePushSubscription: (subscription) => fetchApi('/users/me/push-subscription', {
            method: 'POST', body: JSON.stringify(subscription)
        }),
        deletePushSubscription: (subscriptionEndpoint) => fetchApi('/users/me/push-subscription', {
            method: 'DELETE', body: JSON.stringify({ endpoint: subscriptionEndpoint })
        }),
    },
    tracks: {
        getAll: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return fetchApi(query ? `/tracks/details?${query}` : '/tracks/details');
        },
        getDetails: (trackUuid) => fetchApi(`/tracks/metadata/id/${trackUuid}`),
        getRandomTrack: () => fetchApi('/tracks/random/track'),
        getLyrics: (trackUuid) => fetchApi(`/tracks/${trackUuid}/lyrics`),
        like: (trackUuid) => fetchApi(`/tracks/${trackUuid}/like`, { method: 'POST' }),
        dislike: (trackUuid) => fetchApi(`/tracks/${trackUuid}/dislike`, { method: 'POST' }),
        removeInteraction: (trackUuid) => fetchApi(`/tracks/${trackUuid}/interaction`, { method: 'DELETE' }),
        getInteractionStatus: (trackUuid) => fetchApi(`/tracks/${trackUuid}/interaction`),
    },
    albums: {
        getAll: (limit = 100, offset = 0) => fetchApi(`/albums/?limit=${limit}&offset=${offset}`),
        getDetails: (albumId) => fetchApi(`/albums/${albumId}`),
    },
    playlists: {
        getMyPlaylists: () => fetchApi('/playlists/'),
        getUserPlaylists: (username) => fetchApi(`/playlists/user/${username}`),
        getPlaylistDetails: (playlistId) => fetchApi(`/playlists/${playlistId}`),
        create: (name, description, isPublic = true) => fetchApi('/playlists/', {
            method: 'POST', body: JSON.stringify({ name, description, is_public: isPublic })
        }),
        update: (playlistId, data) => fetchApi(`/playlists/${playlistId}`, {
            method: 'PUT', body: JSON.stringify(data)
        }),
        togglePublic: (playlistId) => fetchApi(`/playlists/${playlistId}/toggle-public`, { method: 'POST' }),
        delete: (playlistId) => fetchApi(`/playlists/${playlistId}`, { method: 'DELETE' }),
        addTrack: (playlistId, trackUuid) => fetchApi(`/playlists/${playlistId}/tracks`, {
            method: 'POST', body: JSON.stringify({ track_uuid: trackUuid })
        }),
        removeTrack: (playlistId, itemId) => fetchApi(`/playlists/${playlistId}/tracks/${itemId}`, { method: 'DELETE' }),
        saveWaveMix: (tempMixId, name) => fetchApi(`/playlists/save-wave-mix/${tempMixId}`, {
            method: 'POST', body: JSON.stringify({ name })
        }),
        dismissWaveMix: (tempMixId) => fetchApi(`/playlists/dismiss-wave-mix/${tempMixId}`, { method: 'POST' }),
    },
    wave: {
        getNextTrack: () => fetchApi('/wave/next/track'),
        submitFeedback: (payload) => fetchApi('/wave/feedback', {
            method: 'POST', body: JSON.stringify(payload)
        }),
    },
    
    search: {
        global: (params) => {
            const searchParams = { ...params };
            Object.keys(searchParams).forEach(key => {
                if (searchParams[key] === null || searchParams[key] === undefined || searchParams[key] === '') {
                    delete searchParams[key];
                }
            });
            const query = new URLSearchParams(searchParams).toString();
            return fetchApi(`/search/?${query}`);
        }
    },

    artists: {
        getDetails: (artistName) => {
            const encodedArtist = encodeURIComponent(artistName);
            return fetchApi(`/artists/${encodedArtist}`);
        },
    },
    
    highlights: {
        getHome: () => fetchApi('/highlights/home'),
    },
    spotify: {
        searchTracks: (query, limit = 20) => fetchApi(`/spotify/search?q=${encodeURIComponent(query)}&limit=${limit}`),
        getArtistInfo: (artistQuery) => fetchApi(`/spotify/artists/${encodeURIComponent(artistQuery)}`),
        importEntity: (spotifyUrl) => fetchApi('/spotify/import', {
            method: 'POST', body: JSON.stringify({ spotify_query_or_url: spotifyUrl })
        }),
    },
    player: {
        getArtworkUrl: (trackUuid) => {
            if (!trackUuid) return null;
            const token = localStorage.getItem('unisound_token');
            return `${API_BASE_URL}/media/artwork/${trackUuid}?token=${token}`;
        },
        getStreamUrl: (filename) => {
            if (!filename) return null;
            const token = localStorage.getItem('unisound_token');
            const encodedFilename = encodeURI(filename);
            return `${API_BASE_URL}/media/stream/${encodedFilename}?token=${token}`;
        },
        getVideoUrl: (filename) => {
            if (!filename) return null;
            const token = localStorage.getItem('unisound_token');
            const encodedFilename = encodeURI(filename);
            return `${API_BASE_URL}/media/video/${encodedFilename}?token=${token}`;
        },
    },
    karaoke: {
        getLrc: (trackUuid) => fetchApi(`/karaoke/lyrics/${trackUuid}`),
    },
    admin: {
        getAllUsers: (limit = 100, offset = 0) => fetchApi(`/admin/users/?limit=${limit}&offset=${offset}`),
        getUserDetails: (userId) => fetchApi(`/admin/users/${userId}/`),
        updateUser: (userId, data) => fetchApi(`/admin/users/${userId}/`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        deleteUser: (userId) => fetchApi(`/admin/users/${userId}/`, {
            method: 'DELETE'
        }),
        adminUploadUserProfilePicture: (userId, file) => {
            const formData = new FormData();
            formData.append('profile_pic_file', file);
            return fetchApi(`/admin/users/${userId}/profile-picture/`, {
                method: 'POST',
                body: formData
            });
        },
        adminDeleteUserProfilePicture: (userId) => fetchApi(`/admin/users/${userId}/profile-picture/`, {
            method: 'DELETE'
        }),
        updateTrackMetadata: (trackUuid, data) => fetchApi(`/admin/tracks/${trackUuid}/metadata/`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        deleteTrack: (trackUuid) => fetchApi(`/admin/tracks/${trackUuid}/delete`, {
            method: 'DELETE'
        }),
        uploadTrackArtwork: (trackUuid, file) => {
            const formData = new FormData();
            formData.append('artwork_file', file);
            return fetchApi(`/admin/tracks/${trackUuid}/artwork/`, {
                method: 'POST',
                body: formData
            });
        },
        deleteTrackArtwork: (trackUuid) => fetchApi(`/admin/tracks/${trackUuid}/artwork/`, {
            method: 'DELETE'
        }),
        uploadTrackLrc: (trackUuid, file) => {
            const formData = new FormData();
            formData.append('lrc_file', file);
            return fetchApi(`/admin/tracks/${trackUuid}/lrc`, {
                method: 'POST',
                body: formData
            });
        },
        deleteTrackLrc: (trackUuid) => fetchApi(`/admin/tracks/${trackUuid}/lrc`, {
            method: 'DELETE'
        }),
        uploadTrackVideo: (trackUuid, file, videoType) => {
            const formData = new FormData();
            formData.append('video_file', file);
            formData.append('type', videoType);
            return fetchApi(`/admin/tracks/${trackUuid}/video`, {
                method: 'POST',
                body: formData
            });
        },
        deleteTrackVideo: (trackUuid, videoType) => fetchApi(`/admin/tracks/${trackUuid}/video?type=${videoType}`, {
            method: 'DELETE'
        }),
        setTrackSyncOffset: (trackUuid, offsetSeconds) => fetchApi(`/admin/tracks/${trackUuid}/sync`, {
            method: 'POST',
            body: JSON.stringify({
                offset_seconds: offsetSeconds
            })
        }),
        getLibraryStatus: () => fetchApi('/admin/system/library-status/'),
        rescanLibrary: () => fetchApi('/admin/system/rescan-library/', {
            method: 'POST'
        }),
        getEnhancerStatus: () => fetchApi('/admin/system/metadata-enhancer/status'),
        runFullEnhancerScan: () => fetchApi('/admin/system/metadata-enhancer/run-full-scan', {
            method: 'POST'
        }),
        runSingleTrackEnhancer: (trackUuid) => fetchApi(`/admin/system/metadata-enhancer/enhance-track/${trackUuid}`, {
            method: 'POST'
        }),
        getWaveConfig: () => fetchApi('/admin/system/wave-config/'),
        updateWaveConfig: (configData) => fetchApi('/admin/system/wave-config/', {
            method: 'PUT',
            body: JSON.stringify(configData)
        }),
    }
};

export default api;