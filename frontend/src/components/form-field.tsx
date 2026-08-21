interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FormField({ label, error, id, ...inputProps }: FormFieldProps) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <input
        {...inputProps}
        id={id}
        onWheel={(event) => {
          inputProps.onWheel?.(event);
          if (inputProps.type === 'number' && !event.defaultPrevented) {
            event.currentTarget.blur();
          }
        }}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-60 ${
          inputProps.type === 'number'
            ? '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
            : ''
        }`}
      />
      {error && (
        <span id={`${id}-error`} className="mt-2 block text-sm text-rose-600">
          {error}
        </span>
      )}
    </label>
  );
}
