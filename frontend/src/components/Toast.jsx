export default function Toast({ message, type }) {
  return (
    <div className={`toast ${type}`}>
      {type === 'error' ? '⚠ ' : '✓ '}{message}
    </div>
  );
}
