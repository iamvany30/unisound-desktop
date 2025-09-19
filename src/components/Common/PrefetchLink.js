import React from 'react';
import { Link } from 'react-router-dom';
import { prefetchComponent } from '../../utils/prefetch';

const PrefetchLink = React.forwardRef(({ 
    to, 
    prefetch, 
    prefetchData, 
    onMouseEnter, 
    children, 
    ...props 
}, ref) => {

    const handleMouseEnter = (e) => {
        
        if (onMouseEnter) {
            onMouseEnter(e);
        }
        
        
        if (prefetch) {
            prefetchComponent(prefetch);
        }
        
        
        if (prefetchData) {
            prefetchData();
        }
    };

    return (
        <Link to={to} onMouseEnter={handleMouseEnter} ref={ref} {...props}>
            {children}
        </Link>
    );
});

PrefetchLink.displayName = 'PrefetchLink';

export default PrefetchLink;