import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const GlassSelect = ({ options, value, onChange, placeholder = 'Select option', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value || String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-3.5 py-2.5 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] text-white rounded-xl focus:border-[#da4e24] text-xs outline-none transition-all flex justify-between items-center font-semibold cursor-pointer focus:ring-1 focus:ring-[#da4e24]/30"
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown className={`w-4 h-4 text-[#B8BCC8]/50 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-[#0d0d0d]/95 border border-white/[0.08] backdrop-blur-[25px] rounded-xl shadow-2xl z-50 p-1.5 max-h-60 overflow-y-auto text-xs space-y-1 animate-fadeIn">
          {options.length > 0 ? (
            options.map(opt => {
              const isSelected = opt.value === value || String(opt.value) === String(value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all font-semibold block truncate ${
                    isSelected 
                      ? 'bg-gradient-to-tr from-[#da4e24]/20 to-[#0098f3]/20 border border-[#da4e24]/30 text-white shadow-sm font-bold animate-pulse'
                      : 'hover:bg-white/5 text-[#B8BCC8] hover:text-white border border-transparent'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-center text-[#B8BCC8]/40 font-semibold">No options available</div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlassSelect;
