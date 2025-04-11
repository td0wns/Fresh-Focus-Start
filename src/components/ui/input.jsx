export default function Input({ value, onChange, onKeyDown, placeholder, spellCheck, className, disabled, inputRef }) {
  return (
    <input
      ref={inputRef}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      spellCheck={spellCheck}
      className={className}
      disabled={disabled}
    />
  );
}
