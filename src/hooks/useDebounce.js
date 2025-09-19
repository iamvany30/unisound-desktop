import { useState, useEffect, useRef, useCallback } from 'react';


export const useDebounce = (value, delay, options = {}) => {
    const { leading = false, maxWait } = options;
    
    const [debouncedValue, setDebouncedValue] = useState(value);
    const timeoutRef = useRef(null);
    const maxWaitTimeoutRef = useRef(null);
    const lastCallTimeRef = useRef(0);
    const lastInvokeTimeRef = useRef(0);
    const leadingInvokedRef = useRef(false);

    
    const clearTimeouts = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (maxWaitTimeoutRef.current) {
            clearTimeout(maxWaitTimeoutRef.current);
            maxWaitTimeoutRef.current = null;
        }
    }, []);

    
    const flush = useCallback(() => {
        clearTimeouts();
        setDebouncedValue(value);
        lastInvokeTimeRef.current = Date.now();
        leadingInvokedRef.current = false;
    }, [value, clearTimeouts]);

    
    const cancel = useCallback(() => {
        clearTimeouts();
        leadingInvokedRef.current = false;
    }, [clearTimeouts]);

    useEffect(() => {
        const currentTime = Date.now();
        lastCallTimeRef.current = currentTime;

        
        if (leading && !leadingInvokedRef.current) {
            setDebouncedValue(value);
            leadingInvokedRef.current = true;
            lastInvokeTimeRef.current = currentTime;
            return;
        }

        const invokeFunc = () => {
            setDebouncedValue(value);
            lastInvokeTimeRef.current = Date.now();
            leadingInvokedRef.current = false;
        };

        const shouldInvokeOnMaxWait = () => {
            return maxWait && (currentTime - lastInvokeTimeRef.current >= maxWait);
        };

        clearTimeouts();

        
        if (shouldInvokeOnMaxWait()) {
            invokeFunc();
            return;
        }

        
        timeoutRef.current = setTimeout(invokeFunc, delay);

        
        if (maxWait) {
            const remainingMaxWait = maxWait - (currentTime - lastInvokeTimeRef.current);
            if (remainingMaxWait > 0) {
                maxWaitTimeoutRef.current = setTimeout(invokeFunc, Math.min(delay, remainingMaxWait));
            }
        }

        
        return clearTimeouts;
    }, [value, delay, leading, maxWait, clearTimeouts]);

    
    useEffect(() => {
        return () => {
            clearTimeouts();
        };
    }, [clearTimeouts]);

    return {
        debouncedValue,
        flush,
        cancel,
        isPending: timeoutRef.current !== null || maxWaitTimeoutRef.current !== null
    };
};


export const useSimpleDebounce = (value, delay) => {
    const { debouncedValue } = useDebounce(value, delay);
    return debouncedValue;
};


export const useDebouncedCallback = (func, delay, options = {}) => {
    const funcRef = useRef(func);
    const timeoutRef = useRef(null);

    
    useEffect(() => {
        funcRef.current = func;
    }, [func]);

    const debouncedCallback = useCallback((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            funcRef.current(...args);
        }, delay);
    }, [delay]);

    const cancel = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const flush = useCallback((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        return funcRef.current(...args);
    }, []);

    
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return Object.assign(debouncedCallback, { cancel, flush });
};