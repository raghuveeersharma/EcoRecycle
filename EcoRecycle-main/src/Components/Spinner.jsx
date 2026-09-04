const Spinner = ({ label }) => (
  <div className="flex flex-col items-center gap-3 text-[#1D4C6C]" role="status">
    <span
      className="size-8 rounded-full border-4 border-gray-300 border-t-[#1D4C6C] animate-spin"
      aria-hidden="true"
    />
    {label && <p className="text-sm">{label}</p>}
    <span className="sr-only">{label || "Loading"}</span>
  </div>
);

export default Spinner;
