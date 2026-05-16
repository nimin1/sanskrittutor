import { IconWarning } from "@/components/Icons";

export function ErrorMessage({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="alert alert--danger" role="alert">
      <IconWarning size={18} />
      <span>{message}</span>
    </div>
  );
}
