


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
    'Rock':       [4, 2, -2, -3, 0, 3, 5],
    'Pop':        [3, 1, 0, 1, 3, 2, 1],
    'Dance':      [5, 3, 0, -2, 0, 2, 4],
    'Jazz':       [2, 1, 1, 0, 2, 3, 2],
    'Acoustic':   [3, 2, 1, 0, 2, 4, 3],
    'Vocal Boost':[0, -1, -2, 2, 4, 3, 1],
    'Bass Boost': [6, 4, 2, 0, -1, -2, -3],
    'Treble Boost':[-3, -2, -1, 0, 2, 4, 6],
};