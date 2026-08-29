import React, { useState } from 'react';

const TagInput = ({ values = [], onChange, placeholder = 'Add and press Enter', className = '' }) => {
  const [input, setInput] = useState('');
  const add = (val) => {
    const v = String(val).trim();
    if (!v) return;
    const next = Array.from(new Set([...(values || []), v]));
    onChange(next);
    setInput('');
  };
  const remove = (idx) => {
    const next = (values || []).filter((_, i) => i !== idx);
    onChange(next);
  };
  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(input);
    }
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2 mb-2">
        {(values || []).map((v, i) => (
          <div key={i} className="flex items-center bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-sm">
            <span className="mr-2">{v}</span>
            <button onClick={() => remove(i)} className="text-gray-500 hover:text-red-600">×</button>
          </div>
        ))}
      </div>
      <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey} placeholder={placeholder} className="w-full border p-2 rounded" />
      <div className="text-xs text-gray-400 mt-1">Press Enter or comma to add</div>
    </div>
  );
};

export default TagInput;
