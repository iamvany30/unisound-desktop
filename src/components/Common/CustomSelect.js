import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import './CustomSelect.css';

export const CustomSelect = ({
    options,
    value,
    onChange,
    placeholder = "Выберите...",
    isSearchable = false,
    isClearable = false,
    isDisabled = false,
    noOptionsMessage = () => "Нет совпадений",
    formatOptionLabel,
    formatSelectedValue
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const selectRef = useRef(null);
    const searchInputRef = useRef(null);

    const flatOptions = useMemo(() => options.flatMap(group => group.options), [options]);

    const filteredOptions = useMemo(() => {
        if (!isSearchable || !searchTerm) {
            return options;
        }
        return options.map(group => ({
            ...group,
            options: group.options.filter(opt =>
                opt.label.toLowerCase().includes(searchTerm.toLowerCase())
            )
        })).filter(group => group.options.length > 0);
    }, [options, searchTerm, isSearchable]);

    const flatFilteredOptions = useMemo(() => filteredOptions.flatMap(group => group.options), [filteredOptions]);

    const selectedOption = useMemo(() => flatOptions.find(opt => opt.value === value), [flatOptions, value]);

    const toggleOpen = useCallback(() => {
        if (isDisabled) return;
        setIsOpen(prev => {
            if (!prev) setHighlightedIndex(value ? flatFilteredOptions.findIndex(o => o.value === value) : 0);
            return !prev;
        });
    }, [isDisabled, value, flatFilteredOptions]);

    const handleSelect = useCallback((newValue) => {
        onChange(newValue);
        setIsOpen(false);
        setSearchTerm('');
    }, [onChange]);

    const handleClear = useCallback((e) => {
        e.stopPropagation();
        onChange(null);
    }, [onChange]);

    useEffect(() => {
        if (isOpen && isSearchable) {
            searchInputRef.current?.focus();
        }
    }, [isOpen, isSearchable]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isDisabled) return;

            switch (e.key) {
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    if (isOpen) {
                        if (highlightedIndex >= 0) {
                            handleSelect(flatFilteredOptions[highlightedIndex].value);
                        }
                    } else {
                        toggleOpen();
                    }
                    break;
                case 'Escape':
                    setIsOpen(false);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    setHighlightedIndex(prev => Math.min(prev + 1, flatFilteredOptions.length - 1));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setHighlightedIndex(prev => Math.max(prev - 1, 0));
                    break;
                case 'Home':
                     e.preventDefault();
                     setHighlightedIndex(0);
                     break;
                case 'End':
                     e.preventDefault();
                     setHighlightedIndex(flatFilteredOptions.length - 1);
                     break;
            }
        };

        const container = selectRef.current;
        container?.addEventListener('keydown', handleKeyDown);
        return () => container?.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, highlightedIndex, flatFilteredOptions, handleSelect, toggleOpen, isDisabled]);
    
    useEffect(() => {
        if (isOpen && highlightedIndex >= 0) {
            const optionElement = document.getElementById(`option-${highlightedIndex}`);
            optionElement?.scrollIntoView({ block: 'nearest' });
        }
    }, [isOpen, highlightedIndex]);


    const renderValue = () => {
        if (selectedOption) {
            return formatSelectedValue ? formatSelectedValue(selectedOption) : selectedOption.label;
        }
        return placeholder;
    };

    return (
        <div
            className={`customSelectContainer ${isDisabled ? 'disabled' : ''}`}
            ref={selectRef}
            aria-disabled={isDisabled}
        >
            <div
                className="customSelectValue"
                onClick={toggleOpen}
                tabIndex={isDisabled ? -1 : 0}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-controls="custom-select-options"
            >
                <span className={`selectedValue ${!selectedOption ? 'placeholder' : ''}`}>
                    {renderValue()}
                </span>
                <div className="customSelectIndicators">
                    {isClearable && value && (
                        <button className="clearButton" onClick={handleClear} aria-label="Очистить">
                            <X size={16} />
                        </button>
                    )}
                    <ChevronDown size={18} className={`customSelectChevron ${isOpen ? 'open' : ''}`} />
                </div>
            </div>

            {isOpen && (
                <div className="customSelectOptionsWrapper">
                    {isSearchable && (
                        <div className="searchContainer">
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="searchInput"
                                placeholder="Поиск..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}
                    <ul
                        id="custom-select-options"
                        className="customSelectOptions"
                        role="listbox"
                        aria-activedescendant={highlightedIndex >= 0 ? `option-${highlightedIndex}` : undefined}
                    >
                        {flatFilteredOptions.length > 0 ? (
                            filteredOptions.map((group, groupIndex) => (
                                <React.Fragment key={group.label || groupIndex}>
                                    {group.label && <li className="optionGroupLabel">{group.label}</li>}
                                    {group.options.map(option => {
                                        const optionIndex = flatFilteredOptions.indexOf(option);
                                        return (
                                            <li
                                                key={option.value}
                                                id={`option-${optionIndex}`}
                                                role="option"
                                                aria-selected={option.value === value}
                                                className={`optionItem ${optionIndex === highlightedIndex ? 'highlighted' : ''} ${option.value === value ? 'selected' : ''} ${option.disabled ? 'disabled' : ''}`}
                                                onClick={() => !option.disabled && handleSelect(option.value)}
                                                onMouseMove={() => setHighlightedIndex(optionIndex)}
                                            >
                                                {formatOptionLabel ? formatOptionLabel(option) : option.label}
                                                {option.value === value && <Check size={16} />}
                                            </li>
                                        );
                                    })}
                                </React.Fragment>
                            ))
                        ) : (
                            <li className="optionItem disabled">{noOptionsMessage()}</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};