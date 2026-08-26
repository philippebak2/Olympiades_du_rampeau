import React from 'react';

interface PinScoreInputProps {
  value: number | null | undefined;
  onChange: (val: number) => void;
  maxPins?: number;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  placeholder?: string;
}

export const PinScoreInput: React.FC<PinScoreInputProps> = ({
  value,
  onChange,
  maxPins = 9,
  disabled = false,
  size = 'md',
  label,
  placeholder = '-',
}) => {
  const [localVal, setLocalVal] = React.useState<string>(
    value !== null && value !== undefined ? String(value) : ''
  );

  React.useEffect(() => {
    setLocalVal(value !== null && value !== undefined ? String(value) : '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim();
    if (raw === '') {
      setLocalVal('');
      onChange(0);
      return;
    }

    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      const clamped = Math.max(0, Math.min(maxPins, parsed));
      setLocalVal(String(clamped));
      onChange(clamped);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    // Allow direct single key stroke replacement (0-9)
    if (/^[0-9]$/.test(e.key)) {
      const num = parseInt(e.key, 10);
      if (num <= maxPins) {
        e.preventDefault();
        setLocalVal(String(num));
        onChange(num);
      }
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      setLocalVal('');
      onChange(0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const current = localVal === '' ? 0 : parseInt(localVal, 10) || 0;
      const next = Math.min(maxPins, current + 1);
      setLocalVal(String(next));
      onChange(next);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const current = localVal === '' ? 0 : parseInt(localVal, 10) || 0;
      const next = Math.max(0, current - 1);
      setLocalVal(String(next));
      onChange(next);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const sizeClasses = {
    sm: 'w-12 h-8 text-xs font-bold',
    md: 'w-14 h-9 text-sm font-bold',
    lg: 'w-16 h-11 text-base font-bold',
  };

  const isFilled = localVal !== '';

  return (
    <div className="inline-flex flex-col items-center">
      {label && <span className="text-[10px] text-gray-500 mb-1">{label}</span>}
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={localVal}
        placeholder={placeholder}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        title={`Entrez une valeur entre 0 et ${maxPins}`}
        className={`text-center rounded-lg border transition-all outline-none ${sizeClasses[size]} ${
          isFilled
            ? 'bg-gray-100 text-gray-900 border-gray-300 font-bold focus:bg-white focus:border-gray-900 focus:ring-2 focus:ring-gray-900/15'
            : 'bg-gray-50 text-gray-400 border-gray-200 placeholder-gray-400 focus:bg-white focus:border-gray-900 focus:ring-2 focus:ring-gray-900/15'
        } ${disabled ? 'opacity-40 cursor-not-allowed bg-gray-100' : 'cursor-text hover:border-gray-400'}`}
      />
    </div>
  );
};

