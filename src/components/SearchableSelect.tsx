import { useEffect, useMemo, useState } from 'react';

interface SearchableSelectProps {
  id: string;
  label: string;
  options: string[];
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
  const [query, setQuery] = useState(selectedValue || '');
  const [open, setOpen] = useState(false);

  const [debouncedQuery, setDebouncedQuery] = useState(selectedValue || '');

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 120);
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
          const next = e.target.value;
          setQuery(next);
          if (selectedValue && next !== selectedValue) {
            onSelect(null);
          }
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => {
            setOpen(false);
            const exact = options.find((option) => option.toLowerCase() === query.toLowerCase().trim());
            if (exact) {
              setQuery(exact);
              onSelect(exact);
            }
          }, 120);
        }}
        className="currency-input searchable-input"
        placeholder={placeholder}
      />

      {open && filtered.length > 0 && (
        <div className="searchable-select-menu">
          {filtered.map((option) => (
            <button
              key={option}
              type="button"
              className={`searchable-option ${selectedValue === option ? 'searchable-option-active' : ''}`}
              onClick={() => {
                setQuery(option);
                onSelect(option);
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
