
export const processTrackData = (track) => {
    if (!track) {
        return null;
    }

    let primaryArtist = { id: null, name: 'Unknown Artist' };
    let primaryArtistName = 'Unknown Artist';
    let formattedArtists = 'Unknown Artist';

    if (Array.isArray(track.artists) && track.artists.length > 0) {
        primaryArtist = track.artists[0];
        primaryArtistName = track.artists[0].name;
        formattedArtists = track.artists.map(a => a.name).join(', ');
    }
    else if (typeof track.artist === 'string' && track.artist) {
        primaryArtist = { id: null, name: track.artist };
        primaryArtistName = track.artist;
        formattedArtists = track.artist;
    }

    return {
        ...track,
        primaryArtist,
        primaryArtistName,
        formattedArtists,
    };
};