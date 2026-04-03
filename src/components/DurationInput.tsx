import { useState, useEffect } from 'react';

/** Possible units for duration input. */
export type DurationUnit = 'months' | 'years';

interface DurationInputProps {
  id: string;
  label: string;
  value: number; // Internally always stored in months
  onChange: (v: number) => void;
  unit?: DurationUnit;
  onUnitChange?: (u: DurationUnit) => void;
  icon?: string;
  className?: string;
}

/**
 * A specialized input for handling durations with a month/year toggle.
 * Converts between months and years while maintaining the internal value in months.
 */
export default function DurationInput({
  id,
  label,
  value,
  onChange,
  unit: controlledUnit,
  onUnitChange,
  icon,
  className = '',
}: DurationInputProps) {
  const [internalUnit, setInternalUnit] = useState<DurationUnit>(() => 
    value >= 12 && value % 12 === 0 ? 'years' : 'months'
  );
  
  const unit = controlledUnit || internalUnit;
  const setUnit = onUnitChange || setInternalUnit;

  const [displayValue, setDisplayValue] = useState<string>(
    unit === 'years' ? (value / 12).toString() : value.toString()
  );

  // Sync internal display value when external month-count changes (e.g., from template)
  useEffect(() => {
    const newVal = unit === 'years' ? (value / 12).toString() : value.toString();
    if (parseFloat(displayValue) !== parseFloat(newVal)) {
      setDisplayValue(newVal);
    }
  }, [value, unit, displayValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayValue(raw);
    const num = parseFloat(raw);
    if (!isNaN(num)) {
      onChange(unit === 'years' ? Math.round(num * 12) : Math.round(num));
    }
  };

  const toggleUnit = (newUnit: DurationUnit) => {
    if (newUnit === unit) return;
    setUnit(newUnit);
    
    // Smoothly convert the currently displayed value for better UX
    const num = parseFloat(displayValue);
    if (!isNaN(num)) {
      const converted = newUnit === 'years' ? (num / 12).toFixed(1) : (num * 12).toString();
      setDisplayValue(converted);
    }
  };

  return (
    <div className={`input-field-group ${className}`}>
      <label htmlFor={id} className="input-label">
        {icon && <span className="input-icon">{icon}</span>}
        {label}
      </label>
      <div className="duration-input-container">
        <div className="input-wrapper duration-main-wrapper">
          <input
            id={id}
            type="number"
            value={displayValue}
            onChange={handleChange}
            step={unit === 'years' ? 0.1 : 1}
            min={0}
            className="currency-input" // shares styles with currency input
            placeholder="0"
          />
        </div>
        <div className="unit-toggle">
          <button
            type="button"
            className={`unit-btn ${unit === 'months' ? 'active' : ''}`}
            onClick={() => toggleUnit('months')}
          >
            Mo
          </button>
          <button
            type="button"
            className={`unit-btn ${unit === 'years' ? 'active' : ''}`}
            onClick={() => toggleUnit('years')}
          >
            Yrs
          </button>
        </div>
      </div>
    </div>
  );
}
