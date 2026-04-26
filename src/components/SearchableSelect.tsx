import { useEffect, useMemo, useState } from 'react';

interface SearchableSelectProps {
  id: string;
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export default function SearchableSelect({ id, label, options, value, onChange }: SearchableSelectProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);

  const [debouncedQuery, setDebouncedQuery] = useState(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 150);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim();
    if (!q) return options.slice(0, 12);

    const scored = options
      .filter((option) => q.length >= 2 || option.toLowerCase().startsWith(q))
      .map((option) => {
        const lower = option.toLowerCase();
        if (lower.startsWith(q)) return { option, score: 0 };
        const index = lower.indexOf(q);
        if (index >= 0) return { option, score: index + 1 };
        const compactMatch = q.split('').every((ch) => lower.includes(ch));
        return { option, score: compactMatch ? 50 : 999 };
      })
      .filter((entry) => entry.score < 999)
      .sort((a, b) => a.score - b.score);

    return scored.map((entry) => entry.option).slice(0, 12);
  }, [options, debouncedQuery]);

  return (
    <div className="searchable-select">
      <label htmlFor={id} className="input-label">{label}</label>
      <input
        id={id}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
        className="currency-input"
        placeholder="Type to search"
      />

      {open && filtered.length > 0 && (
        <div className="searchable-select-menu">
          {filtered.map((option) => (
            <button
              key={option}
              type="button"
              className={`searchable-option ${value === option ? 'searchable-option-active' : ''}`}
              onClick={() => {
                setQuery(option);
                onChange(option);
                setOpen(false);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
