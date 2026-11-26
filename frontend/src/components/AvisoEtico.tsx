import { ShieldCheck } from 'lucide-react'

interface Props {
  compacto?: boolean
}

/** Aviso ético permanente — siempre visible en el panel, páginas y ficha del estudiante. */
export default function AvisoEtico({ compacto = false }: Props) {
  return (
    <div
      role="note"
      aria-label="Aviso ético sobre uso de datos sintéticos"
      className={`flex items-start gap-2.5 rounded-2xl border border-amber-300/60 bg-amber-50/90 text-amber-950 dark:border-amber-400/25 dark:bg-amber-500/15 dark:text-amber-100 ${
        compacto ? 'px-3.5 py-2.5' : 'px-4 py-3'
      }`}
    >
      <ShieldCheck
        className="mt-0.5 h-4 w-4 shrink-0 text-amber-800 dark:text-amber-300"
        aria-hidden="true"
      />
      <p className="text-xs leading-relaxed text-pretty">
        <span className="font-semibold">Datos sintéticos · Uso orientador.</span> El resultado es
        una probabilidad formativa para acompañar al estudiante, nunca para sancionar ni excluir.
      </p>
    </div>
  )
}
