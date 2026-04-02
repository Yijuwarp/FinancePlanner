import { useState } from 'react';
import { formatINR } from '../utils/formatINR';

interface InputPanelProps {
  balance: number;
  salary: number;
  expenses: number;
  years: number;
  inflation: number;
  salaryGrowth: number;
  returns: number;
  onBalanceChange: (v: number) => void;
  onSalaryChange: (v: number) => void;
  onExpensesChange: (v: number) => void;
  onYearsChange: (v: number) => void;
  onInflationChange: (v: number) => void;
  onSalaryGrowthChange: (v: number) => void;
  onReturnsChange: (v: number) => void;
}

function CurrencyInput({
  label,
  value,
  onChange,
  icon,
  id,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  icon: string;
  id: string;
}) {
  const [focused, setFocused] = useState(false);
  const [rawValue, setRawValue] = useState(value.toString());

  const handleFocus = () => {
    setFocused(true);
    setRawValue(value.toString());
  };

  const handleBlur = () => {
    setFocused(false);
    const parsed = parseFloat(rawValue);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRawValue(e.target.value);
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  return (
    <div className="input-field-group">
      <label htmlFor={id} className="input-label">
        <span className="input-icon">{icon}</span>
        {label}
      </label>
      <div className="input-wrapper">
        <span className="input-prefix">₹</span>
        <input
          id={id}
          type={focused ? 'number' : 'text'}
          value={focused ? rawValue : formatINR(value).replace('₹', '')}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="currency-input"
        />
      </div>
    </div>
  );
}

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  id,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
  id: string;
}) {
  return (
    <div className="input-field-group">
      <label htmlFor={id} className="input-label">
        {label}
        <span className="input-value-badge">
          {value}{unit}
        </span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="slider-input"
      />
      <div className="slider-range">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

export default function InputPanel(props: InputPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="input-panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <span className="panel-title-icon">💰</span>
          Your Finances
        </h2>
        <p className="panel-subtitle">Enter your basic financial details</p>
      </div>

      <div className="input-fields">
        <CurrencyInput
          id="balance-input"
          label="Current Savings"
          icon="🏦"
          value={props.balance}
          onChange={props.onBalanceChange}
        />
        <CurrencyInput
          id="salary-input"
          label="Monthly Salary"
          icon="💼"
          value={props.salary}
          onChange={props.onSalaryChange}
        />
        <CurrencyInput
          id="expenses-input"
          label="Monthly Expenses"
          icon="🛒"
          value={props.expenses}
          onChange={props.onExpensesChange}
        />
        <SliderInput
          id="years-input"
          label="Time Horizon"
          value={props.years}
          onChange={props.onYearsChange}
          min={1}
          max={30}
          step={1}
          unit=" yrs"
        />
      </div>

      <button
        className="advanced-toggle"
        onClick={() => setShowAdvanced(!showAdvanced)}
        id="advanced-toggle-btn"
      >
        <span className="advanced-toggle-icon" style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none' }}>
          ▼
        </span>
        Advanced Settings
      </button>

      {showAdvanced && (
        <div className="advanced-settings">
          <SliderInput
            id="inflation-input"
            label="📈 Inflation Rate"
            value={props.inflation}
            onChange={props.onInflationChange}
            min={0}
            max={15}
            step={0.5}
            unit="%"
          />
          <SliderInput
            id="salary-growth-input"
            label="📊 Salary Growth"
            value={props.salaryGrowth}
            onChange={props.onSalaryGrowthChange}
            min={0}
            max={25}
            step={0.5}
            unit="%"
          />
          <SliderInput
            id="returns-input"
            label="💹 Investment Returns"
            value={props.returns}
            onChange={props.onReturnsChange}
            min={0}
            max={20}
            step={0.5}
            unit="%"
          />
        </div>
      )}
    </div>
  );
}
