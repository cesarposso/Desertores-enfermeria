import { AlertCircle } from 'lucide-react'

interface Props {
  mensaje: string
  onReintentar?: () => void
}

export default function ErrorCartel({ mensaje, onReintentar }: Props) {
  return (
    <div className="flex flex-col items-start gap-3 rounded border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-700">
        <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
        <p className="text-sm font-medium">No se pudo cargar la información</p>
      </div>
      <p className="text-xs text-slate-500">{mensaje}</p>
      {onReintentar && (
        <button
          onClick={onReintentar}
          className="rounded bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-300"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}
