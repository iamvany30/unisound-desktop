import React from 'react';
import './GlobalDragZone.css';

const GlobalDragZone = ({ isElectron }) => {
    if (!isElectron) {
        return null;
    }

    return <div className="global-drag-area" />;
};

export default React.memo(GlobalDragZone);