export default function Button({ children, onClick, className, style, ...props }) {
  return (
    <button
      onClick={onClick}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
}
