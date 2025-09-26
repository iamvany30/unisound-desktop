import React from 'react';
import { useElectronWindow } from '../../hooks/useElectronWindow';
import './DraggableTopBar.css';

const DraggableTopBar = () => {
    const { isElectron } = useElectronWindow();

    if (!isElectron) {
        return null;
    }

    return <div className="draggable-top-bar" />;
};

export default React.memo(DraggableTopBar);