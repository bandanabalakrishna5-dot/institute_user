import React from 'react';
import CustomSelect from './CustomSelect';

function SectionSelect({ sections = [], value = '', onChange, disabled = false, placeholder = 'Select section' }) {
  return <CustomSelect options={sections.map((section) => ({ value: section.secid, label: section.secnm }))} value={value} onChange={onChange} disabled={disabled} placeholder={placeholder} ariaLabel="Section" />;
}

export default SectionSelect;
