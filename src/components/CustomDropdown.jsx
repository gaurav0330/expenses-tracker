import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

/**
 * World-Class Custom FinTech Dropdown Component
 * Replaces native OS <select> with a sleek, fully styled dark-mode popover.
 * Features search filtering, icons, checkmarks, and click-outside dismissal.
 */
export default function CustomDropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  icon: Icon,
  className = '',
  menuClassName = '',
  searchable = false,
  disabled = false,
  renderOption,
  renderValue
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, searchable]);

  // Handle ESC key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return options.find(opt => {
      if (typeof opt === 'object' && opt !== null) {
        return opt.value === value;
      }
      return opt === value;
    });
  }, [options, value]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter(opt => {
      const label = typeof opt === 'object' && opt !== null ? (opt.label || opt.value || '') : String(opt);
      const subtext = typeof opt === 'object' && opt !== null ? (opt.subtext || '') : '';
      return label.toLowerCase().includes(q) || subtext.toLowerCase().includes(q);
    });
  }, [options, searchQuery]);

  const handleSelect = (val) => {
    if (onChange) {
      onChange(val);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const getOptionValue = (opt) => {
    return typeof opt === 'object' && opt !== null ? opt.value : opt;
  };

  const getOptionLabel = (opt) => {
    return typeof opt === 'object' && opt !== null ? (opt.label || opt.value) : opt;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2.5 bg-dark-950/80 hover:bg-dark-900 border border-white/[0.08] hover:border-white/[0.15] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-100 shadow-inner transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/80 ${
          isOpen ? 'ring-2 ring-emerald-500/40 border-emerald-500/80 bg-dark-900' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 truncate min-w-0">
          {Icon && <Icon className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-emerald-400" />}
          
          <span className="truncate">
            {renderValue 
              ? renderValue(selectedOption) 
              : selectedOption 
              ? getOptionLabel(selectedOption) 
              : placeholder}
          </span>
        </div>

        <ChevronDown 
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-400' : 'text-slate-400'
          }`} 
        />
      </button>

      {/* Floating Glass Popover Menu */}
      {isOpen && (
        <div 
          className={`absolute left-0 right-0 top-full mt-2 z-50 bg-dark-950/95 backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-2xl p-1.5 overflow-hidden animate-fadeIn ${menuClassName}`}
          role="listbox"
        >
          {/* Search Header if enabled or options > 7 */}
          {(searchable || options.length > 7) && (
            <div className="p-1 mb-1 border-b border-white/[0.06]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to filter..."
                  className="w-full bg-black/60 border border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Scrollable Option List */}
          <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const optVal = getOptionValue(opt);
                const optLabel = getOptionLabel(opt);
                const isSelected = optVal === value;
                const isSpecialAction = optVal === 'ADD_NEW';

                if (renderOption) {
                  return (
                    <div
                      key={optVal || idx}
                      onClick={() => handleSelect(optVal)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-500/15 text-emerald-300 font-bold' : 'hover:bg-white/[0.06] text-slate-200'
                      }`}
                    >
                      {renderOption(opt, isSelected)}
                    </div>
                  );
                }

                return (
                  <button
                    key={optVal || idx}
                    type="button"
                    onClick={() => handleSelect(optVal)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                      isSpecialAction
                        ? 'text-emerald-400 hover:bg-emerald-500/15 font-bold border-t border-white/[0.06] mt-1'
                        : isSelected
                        ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/25 shadow-sm'
                        : 'text-slate-200 hover:bg-white/[0.06] hover:text-white'
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      {opt.icon && <opt.icon className="w-3.5 h-3.5 shrink-0 text-slate-400" />}
                      <span className="truncate">{optLabel}</span>
                      {opt.subtext && (
                        <span className="text-[11px] font-normal text-slate-400 font-amount shrink-0">
                          {opt.subtext}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
