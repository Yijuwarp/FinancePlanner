import { useState, useEffect } from 'react';
import { parseINR, formatINR } from '../utils/formatINR';

interface CurrencyInputProps {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  icon?: string;
  className?: string;
}

export default function CurrencyInput({
  id,
  label,
  value,
  onChange,
  icon,
  className = '',
}: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState('');

  // Initial and external value sync
  useEffect(() => {
    if (!focused) {
      // When blurred, show the beautiful shorthand (e.g., 3L, 80K)
      setDisplayValue(formatINR(value).replace('₹', ''));
    }
  }, [value, focused]);

  const handleFocus = () => {
    setFocused(true);
    // When focused, show commas for clarity (e.g., 3,00,000)
    setDisplayValue(value === 0 ? '' : value.toLocaleString('en-IN'));
  };

  const handleBlur = () => {
    setFocused(false);
    const parsed = parseINR(displayValue);
    if (parsed !== null) {
      onChange(parsed);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    
    // If input is purely numbers (no L, K, etc.), add commas for clarity
    const digitsOnly = raw.replace(/,/g, '');
    if (/^\d+$/.test(digitsOnly)) {
      const num = parseInt(digitsOnly, 10);
      raw = num.toLocaleString('en-IN');
    }

    setDisplayValue(raw);
    
    // Attempt real-time parse for immediate chart feedback
    const parsed = parseINR(raw);
    if (parsed !== null) {
      onChange(parsed);
    }
  };

  return (
    <div className={`input-field-group ${className}`}>
      <label htmlFor={id} className="input-label">
        {icon && <span className="input-icon">{icon}</span>}
        {label}
      </label>
      <div className={`input-wrapper ${focused ? 'input-wrapper-focused' : ''}`}>
        <span className="input-prefix">₹</span>
        <input
          id={id}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="0"
          className="currency-input"
          autoComplete="off"
        />
      </div>
    </div>
  );
}
