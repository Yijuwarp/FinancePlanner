import { useMemo, useState } from 'react';

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

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return options.slice(0, 12);
    return options.filter(option => option.toLowerCase().includes(q)).slice(0, 12);
  }, [options, query]);

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
