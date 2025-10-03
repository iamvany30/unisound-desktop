
import React from 'react';

const e = React.createElement;

const TrackList = ({ tracks, onTrackSelect }) => {
    if (!tracks || tracks.length === 0) {
        return e('p', null, 'Треков не найдено.');
    }

    const trackItems = tracks.map(track => {
        const artworkSrc = track.has_artwork ? getArtworkUrl(track.uuid) : 'default_artwork_path.png';

        return e('li', {
            className: 'track-item',
            key: track.uuid,
            onClick: () => onTrackSelect(track)
        },
            e('img', { className: 'track-item-artwork', src: artworkSrc, alt: 'Artwork' }),
            e('div', { className: 'track-item-info' },
                e('h4', null, track.title),
                e('p', null, track.artist)
            )
        );
    });

    return e('ul', { className: 'track-list' }, ...trackItems);
};

export default TrackList;