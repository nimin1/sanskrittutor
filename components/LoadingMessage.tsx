export function LoadingMessage({ message }: { message: string }) {
  return (
    <div className="thinking" aria-live="polite">
      <span className="thinking__pen" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
