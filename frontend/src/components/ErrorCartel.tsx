import { AlertCircle, RotateCcw } from 'lucide-react'

interface Props {
  mensaje: string
  onReintentar?: () => void
}

export default function ErrorCartel({ mensaje, onReintentar }: Props) {
  return (
    <div role="alert" className="bento-card flex flex-col items-start gap-3.5 p-6">
      <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold">No se pudo cargar la información</p>
      </div>
      <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{mensaje}</p>
      {onReintentar && (
        <button
          type="button"
          onClick={onReintentar}
          className="pressable inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Reintentar</span>
        </button>
      )}
    </div>
  )
}
