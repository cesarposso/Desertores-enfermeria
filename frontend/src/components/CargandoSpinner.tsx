interface Props {
  mensaje?: string
}

export default function CargandoSpinner({ mensaje }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-slate-500">
      <svg
        className="h-8 w-8 animate-spin text-slate-400"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      {mensaje && <p className="text-sm">{mensaje}</p>}
    </div>
  )
}
