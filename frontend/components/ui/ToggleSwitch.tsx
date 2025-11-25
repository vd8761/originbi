import React from 'react';

interface ToggleSwitchProps {
  isOn: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  isOn,
  onToggle,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={!disabled ? onToggle : undefined}
      disabled={disabled}
      role="switch"
      aria-checked={isOn}
      className={`relative inline-flex items-center h-6 w-14 shrink-0 rounded-full transition-colors duration-300 focus:outline-none ${
        isOn
          ? 'bg-brand-green'
          : 'bg-brand-light-tertiary dark:bg-brand-dark-tertiary'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className="sr-only">Toggle</span>

      {/* Text inside the toggle */}
      <span
        aria-hidden="true"
        className="absolute left-0 flex w-full items-center justify-between px-[10px] text-[10px] font-semibold"
      >
        <span className={isOn ? 'text-white' : 'text-transparent'}>ON</span>
        <span
          className={
            !isOn
              ? 'text-brand-text-light-secondary dark:text-brand-text-secondary'
              : 'text-transparent'
          }
        >
          OFF
        </span>
      </span>

      {/* Sliding thumb */}
      <span
        className={`inline-block h-3 w-3 rounded-full bg-white shadow-md ring-0 transform transition-transform duration-300 ease-in-out ${
          isOn ? 'translate-x-9' : 'translate-x-1'
        }`}
      />
    </button>
  );
};

export default ToggleSwitch;
