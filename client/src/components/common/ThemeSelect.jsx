import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Custom themed dropdown component matching the Advait Teleservices theme.
 * Replaces native OS selects with a styled, accessible custom dropdown.
 */
const ThemeSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select option',
  className = '',
  dropdownClassName = '',
  variant = 'light',
  direction = 'auto',
  id,
  name,
  disabled = false,
  ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [calculatedDirection, setCalculatedDirection] = useState('down');
  const containerRef = useRef(null);

  // Normalize options array into [{ value, label }]
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value !== undefined ? String(opt.value) : '',
        label: opt.label !== undefined ? String(opt.label) : String(opt.value || ''),
      };
    }
    return { value: String(opt), label: String(opt) };
  });

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  // Determine open direction based on viewport space if direction is 'auto'
  useEffect(() => {
    if (isOpen) {
      if (direction === 'up') {
        setCalculatedDirection('up');
      } else if (direction === 'down') {
        setCalculatedDirection('down');
      } else if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        // If less than 220px below and more space above, open upwards
        if (spaceBelow < 220 && rect.top > spaceBelow) {
          setCalculatedDirection('up');
        } else {
          setCalculatedDirection('down');
        }
      }
    }
  }, [isOpen, direction]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation & escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        setIsOpen(false);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        const currentIndex = normalizedOptions.findIndex((opt) => String(opt.value) === String(value));
        const nextIndex = currentIndex < normalizedOptions.length - 1 ? currentIndex + 1 : 0;
        handleSelect(normalizedOptions[nextIndex].value);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const currentIndex = normalizedOptions.findIndex((opt) => String(opt.value) === String(value));
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : normalizedOptions.length - 1;
        handleSelect(normalizedOptions[prevIndex].value);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, value, normalizedOptions]);

  const handleSelect = (optValue) => {
    setIsOpen(false);
    if (onChange) {
      // Create synthetic event for drop-in compatibility with (e) => setVal(e.target.value)
      const syntheticEvent = {
        target: {
          value: optValue,
          name: name || id || '',
          id: id || '',
        },
      };
      onChange(syntheticEvent);
    }
  };

  const isDark = variant === 'dark';

  return (
    <div ref={containerRef} className={`relative inline-block ${className || 'w-full'}`}>
      <button
        type="button"
        id={id}
        name={name}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || placeholder}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 text-left font-sans transition-all duration-150 cursor-pointer select-none outline-none ${
          isDark
            ? 'bg-black/40 hover:bg-black/60 border border-white/20 hover:border-brand-400/60 rounded-md px-3 py-2 text-xs font-medium text-white focus:border-brand-400 focus:ring-1 focus:ring-brand-400'
            : 'bg-white hover:bg-brand-50/40 border border-[#dce5ee] hover:border-[#385775] rounded-md px-3 py-2 text-xs font-semibold text-[#172536] focus:border-[#385775] focus:ring-2 focus:ring-[#385775]/15 shadow-xs'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
            isDark ? 'text-brand-200' : 'text-brand-700'
          } ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className={`absolute left-0 right-0 z-50 max-h-60 overflow-y-auto rounded-md font-sans scrollbar-thin ${
            calculatedDirection === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${
            isDark
              ? 'bg-[#172536] border border-brand-800 text-white shadow-2xl py-1 divide-y divide-white/5'
              : 'bg-white border border-[#dce5ee] text-gray-900 shadow-xl py-1 divide-y divide-gray-100'
          } ${dropdownClassName}`}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition-colors duration-100 ${
                  isDark
                    ? isSelected
                      ? 'bg-[#385775] text-white font-bold'
                      : 'text-brand-100 hover:bg-white/10 hover:text-white'
                    : isSelected
                    ? 'bg-[#eaf0f6] text-[#385775] font-bold'
                    : 'text-gray-700 hover:bg-[#f6f8fb] hover:text-[#172536]'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <Check
                    className={`w-3.5 h-3.5 shrink-0 ml-2 ${
                      isDark ? 'text-brand-400' : 'text-[#385775]'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ThemeSelect;
