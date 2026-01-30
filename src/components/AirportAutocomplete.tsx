'use client';

import { useState, useEffect, useRef } from 'react';

interface Airport {
  icao: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

interface AirportAutocompleteProps {
  value: Airport | null;
  onChange: (airport: Airport | null) => void;
  placeholder?: string;
}

export default function AirportAutocomplete({
  value,
  onChange,
  placeholder = 'Search for an airport...',
}: AirportAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Airport[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search airports when query changes
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/airports?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Error searching airports:', error);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (airport: Airport) => {
    onChange(airport);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
  };

  return (
    <div ref={wrapperRef} className="relative">
      {value ? (
        <div className="flex items-center gap-2 p-2 border rounded dark:bg-slate-800 dark:border-slate-600">
          <div className="flex-1">
            <span className="font-bold text-[#00a67c]">{value.icao}</span>
            <span className="mx-2">-</span>
            <span>{value.name}</span>
            <span className="text-gray-500 ml-2">({value.city}, {value.state})</span>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
            placeholder={placeholder}
            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
          />
          {loading && (
            <div className="absolute right-3 top-2.5 text-gray-400">...</div>
          )}
        </>
      )}

      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded shadow-lg max-h-60 overflow-auto">
          {results.map((airport) => (
            <li
              key={airport.icao}
              onClick={() => handleSelect(airport)}
              className="p-3 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer border-b last:border-b-0 dark:border-slate-600"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#00a67c] w-14">{airport.icao}</span>
                <span className="flex-1">{airport.name}</span>
              </div>
              <div className="text-sm text-gray-500 ml-16">
                {airport.city}, {airport.state}
              </div>
            </li>
          ))}
        </ul>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 p-3 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded shadow-lg text-gray-500">
          No airports found
        </div>
      )}
    </div>
  );
}
