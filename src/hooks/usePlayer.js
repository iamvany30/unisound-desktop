
import React from 'react';
import { PlayerContext } from '../context/PlayerContext';

const { useContext } = React;

export const usePlayer = () => {
    return useContext(PlayerContext);
};