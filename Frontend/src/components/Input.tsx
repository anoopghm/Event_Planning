interface InputProps {
  id: string;
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function Input({
  id,
  name,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
}: InputProps) {
  return (
    <div className="mb-5">
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-neutral-800"
      >
        {label}
      </label>

      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full rounded-[10px] border border-neutral-300 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
      />
    </div>
  );
}

export default Input;