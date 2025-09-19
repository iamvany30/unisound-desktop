
import { useCallback, useEffect } from 'react';


export const useKeyboardControls = (player) => {
    const handleKeyDown = useCallback((event) => {
        
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        
        if (event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) {
            return;
        }
        
        switch (event.code) {
            case 'Space': 
                event.preventDefault(); 
                player.togglePlay(); 
                break;
            case 'ArrowRight': 
                event.preventDefault(); 
                player.playNext(); 
                break;
            case 'ArrowLeft': 
                event.preventDefault(); 
                player.playPrev(); 
                break;
            default: 
                break;
        }
    }, [player]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
};