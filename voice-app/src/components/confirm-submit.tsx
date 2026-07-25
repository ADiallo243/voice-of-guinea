"use client";

export function ConfirmSubmit({
  action,
  children,
  message,
  className,
  field,
}: {
  action: (formData: FormData) => void | Promise<void>;
  children: React.ReactNode;
  message: string;
  className?: string;
  field?: { name: string; value: string };
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {field && <input type="hidden" name={field.name} value={field.value} />}
      <button type="submit" className={className}>{children}</button>
    </form>
  );
}
