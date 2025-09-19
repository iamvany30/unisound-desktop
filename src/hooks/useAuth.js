
import React from 'react';
import { AuthContext } from '../context/AuthContext';

const { useContext } = React;

export const useAuth = () => {
    return useContext(AuthContext);
};