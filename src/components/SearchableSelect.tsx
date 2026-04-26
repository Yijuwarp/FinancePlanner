import { useEffect, useMemo, useState } from 'react';

export interface SearchableOption {
  value: string;
  label: string;
  keywords?: string[];
}

interface SearchableSelectProps {
  id: string;
  label: string;
  options: SearchableOption[];
  selectedValue: string | null;
  placeholder: string;
  onSelect: (value: string | null) => void;
}

export default function SearchableSelect({
  id,
  label,
  options,
  selectedValue,
  placeholder,
  onSelect,
}: SearchableSelectProps) {
  const selectedOption = useMemo(
    () => options.find((option) => option.value === selectedValue) || null,
    [options, selectedValue],
  );
  const [query, setQuery] = useState(selectedOption?.label || '');
  const [open, setOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(selectedOption?.label || '');

  useEffect(() => {
    setQuery(selectedOption?.label || '');
    setDebouncedQuery(selectedOption?.label || '');
  }, [selectedOption]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 120);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim();
    if (!q) return options.slice(0, 12);

    const scored = options
      .map((option) => {
        const text = option.label.toLowerCase();
        const keywordText = (option.keywords || []).join(' ').toLowerCase();
        if (text === q) return { option, score: 0 };
        if (text.startsWith(q)) return { option, score: 1 };
        if (text.includes(q)) return { option, score: 2 };
        if (keywordText.includes(q)) return { option, score: 3 };
        return { option, score: 999 };
      })
      .filter((entry) => entry.score < 999)
      .sort((a, b) => a.score - b.score || a.option.label.localeCompare(b.option.label));

    return scored.map((entry) => entry.option).slice(0, 12);
  }, [options, debouncedQuery]);
  const visibleOptions = filtered.length > 0 ? filtered : options.filter((option) => option.label === 'Other').slice(0, 1);

  return (
    <div className="searchable-select">
      <label htmlFor={id} className="input-label">{label}</label>
      <input
        id={id}
        value={query}
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);
          if (selectedOption && next !== selectedOption.label) {
            onSelect(null);
          }
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => {
            setOpen(false);
            const exact = options.find((option) => option.label.toLowerCase() === query.toLowerCase().trim());
            if (exact) {
              setQuery(exact.label);
              onSelect(exact.value);
            }
          }, 120);
        }}
        className="currency-input searchable-input"
        placeholder={placeholder}
      />

      {open && visibleOptions.length > 0 && (
        <div className="searchable-select-menu">
          {visibleOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`searchable-option ${selectedValue === option.value ? 'searchable-option-active' : ''}`}
              onClick={() => {
                setQuery(option.label);
                onSelect(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
