import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, LoaderCircle, X } from 'lucide-react';
import api from '../../services/api';
import SearchResultsDropdown from './SearchResultsDropdown';
import './SearchComponent.css';


const useClickOutside = (ref, handler) => {
    useEffect(() => {
        const listener = (event) => {
            if (!ref.current || ref.current.contains(event.target)) {
                return;
            }
            handler(event);
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
};


const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};


const searchCache = new Map();

const SearchComponent = () => {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [error, setError] = useState(null);
    
    const searchRef = useRef(null);
    const abortControllerRef = useRef(null);
    const debouncedQuery = useDebounce(query, 350);

    useClickOutside(searchRef, () => setIsFocused(false));

    useEffect(() => {
        if (debouncedQuery.length < 2) {
            setResults(null);
            setError(null);
            return;
        }

        if (searchCache.has(debouncedQuery)) {
            setResults(searchCache.get(debouncedQuery));
            return;
        }

        const performSearch = async () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            setIsLoading(true);
            setError(null);
            try {
                const data = await api.search.global({ q: debouncedQuery, limit: 5 });
                setResults(data);
                searchCache.set(debouncedQuery, data);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setError('Не удалось выполнить поиск.');
                    console.error("Search error:", err);
                }
            } finally {
                setIsLoading(false);
            }
        };

        performSearch();
    }, [debouncedQuery]);

    const handleClear = useCallback(() => {
        setQuery('');
        setResults(null);
        setError(null);
    }, []);

    const showDropdown = isFocused && (query.length > 0);

    return (
        <div className="search-container" ref={searchRef}>
            <div className={`search-bar ${isFocused ? 'focused' : ''}`}>
                <Search size={20} className="search-icon-left" />
                <input
                    type="text"
                    className="search-input"
                    placeholder={t('header.searchPlaceholder')}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                />
                <div className="search-icon-right">
                    {isLoading && <LoaderCircle size={18} className="animate-spin" />}
                    {query && !isLoading && (
                        <button onClick={handleClear} className="clear-search-btn" aria-label="Очистить поиск">
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>
            {showDropdown && (
                <SearchResultsDropdown 
                    results={results} 
                    isLoading={isLoading}
                    error={error}
                    onClose={() => setIsFocused(false)} 
                />
            )}
        </div>
    );
};

export default SearchComponent;