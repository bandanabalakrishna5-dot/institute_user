import React, { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';

function CustomSelect({ options = [], value = '', onChange, disabled = false, placeholder = 'Select', allowEmpty = true, ariaLabel = 'Select option', className = '' }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => String(option.value) === String(value));
  const choose = (nextValue) => {
    onChange?.(String(nextValue ?? ''));
    setOpen(false);
  };

  return (
    <div className={`hw-mobile-select ${open ? 'is-open' : ''} ${className}`.trim()} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <button type="button" className="hw-mobile-select-trigger" onClick={() => setOpen((current) => !current)} disabled={disabled} aria-haspopup="listbox" aria-expanded={open}>
        <span>{selected?.label || placeholder}</span><FaChevronDown />
      </button>
      {open && <div className="hw-mobile-select-menu" role="listbox" aria-label={ariaLabel}>
        <button type="button" role="option" disabled={!allowEmpty} aria-selected={!value} className={!value ? 'selected' : ''} onClick={() => choose('')}>{placeholder}</button>
        {options.map((option) => <button type="button" role="option" aria-selected={String(option.value) === String(value)} className={String(option.value) === String(value) ? 'selected' : ''} key={option.key ?? option.value} onClick={() => choose(option.value)}>{option.label}</button>)}
      </div>}
    </div>
  );
}

export default CustomSelect;
