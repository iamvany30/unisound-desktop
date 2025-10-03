


export const equalizerBands = [
    { freq: 60, type: 'lowshelf', label: '60' },      
    { freq: 150, type: 'peaking', label: '150' },     
    { freq: 400, type: 'peaking', label: '400' },     
    { freq: 1000, type: 'peaking', label: '1k' },     
    { freq: 2400, type: 'peaking', label: '2.4k' },   
    { freq: 6000, type: 'peaking', label: '6k' },     
    { freq: 15000, type: 'highshelf', label: '15k' },  
];


export const equalizerPresets = {
    'Rock':       [4, 3, 1, -1, -2, 1, 3, 5, 4, 3],
    'Pop':        [3, 2, 1, 0, -1, 0, 2, 4, 3, 2],
    'Dance':      [5, 4, 2, 0, -2, -1, 1, 3, 4, 5],
    'Hip-Hop':    [6, 5, 2, -1, -2, 0, 1, 2, 3, 4],
    'Jazz':       [2, 1, 1, 0, -1, 0, 2, 3, 2, 1],
    'Classical':  [1, 1, 0, 0, -1, 0, 1, 2, 2, 3],
    'Metal':      [5, 4, 1, 0, 2, 3, 4, 3, 2, 4],
    'Acoustic':   [3, 2, 1, 0, 1, 2, 3, 2, 1, 1],
    'Vocal Boost':[ -1, -2, -1, 1, 3, 4, 3, 1, 0, -1],
    'Bass Boost': [7, 6, 4, 2, 0, -1, -2, -3, -4, -5],
    'Treble Boost':[-5, -4, -3, -2, -1, 0, 2, 4, 6, 7],
    'Spoken Word':[ -2, -3, -1, 2, 4, 3, 2, 0, -1, -2],
    'Flat':       [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
};