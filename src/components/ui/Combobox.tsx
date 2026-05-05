import React, { useState, useRef, useEffect } from 'react';
import { Input } from './Input';
import { cn } from '../../lib/utils';
import { ChevronDown, Plus } from 'lucide-react';

interface ComboboxProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  onAddNew?: (val: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export function Combobox({ options, value, onChange, onAddNew, placeholder, className, label }: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // If they click away and the value changed but wasn't selected from list,
        // we might want to sync searchTerm back to value
        setSearchTerm(value);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, value]);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exactMatch = options.some(opt => opt.toLowerCase() === searchTerm.toLowerCase());

  return (
    <div ref={wrapperRef} className="relative w-full">
      {label && <label className="text-xs font-bold text-slate-400 uppercase ml-1 block mb-1">{label}</label>}
      <div className="relative">
        <Input 
          className={cn("pr-8 h-10", className)}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            // Optional: immediately update parent if we want "type-to-change"
            // But usually better to wait for selection or "Add"
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchTerm && !exactMatch && onAddNew) {
              onAddNew(searchTerm);
              setIsOpen(false);
            }
          }}
          placeholder={placeholder}
        />
        <div 
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer p-1 hover:text-slate-600"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      
      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-auto animate-in fade-in slide-in-from-top-1 border-t-0 py-1">
          {searchTerm && !exactMatch && onAddNew && (
            <div 
              className="px-3 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors border-b border-slate-50 flex items-center gap-2"
              onMouseDown={(e) => {
                e.preventDefault();
                onAddNew(searchTerm);
                setIsOpen(false);
              }}
            >
              <Plus className="w-3 h-3" /> Add "{searchTerm}"
            </div>
          )}

          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, i) => (
              <div 
                key={i}
                className={cn(
                  "px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors",
                  opt === value && "bg-blue-50 text-blue-700 font-bold"
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(opt);
                  setIsOpen(false);
                }}
              >
                {opt}
              </div>
            ))
          ) : !onAddNew && (
            <div className="px-3 py-2 text-sm text-slate-400 italic">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
