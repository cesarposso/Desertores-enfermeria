interface Props {
  mensaje?: string
}

export default function CargandoSpinner({ mensaje }: Props) {
  return (
    <div className="bento-card flex flex-col items-center justify-center gap-3 px-6 py-14 text-zinc-500 dark:text-zinc-400">
      <svg
        className="h-7 w-7 animate-spin text-unipamplona-rojo [animation-duration:600ms]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3.5"
        />
        <path
          className="opacity-85"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      {mensaje && (
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{mensaje}</p>
      )}
    </div>
  )
}
