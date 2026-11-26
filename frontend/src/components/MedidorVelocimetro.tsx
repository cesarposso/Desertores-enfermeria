import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { COLORES_TEMA, type NivelRiesgo } from '../api/cliente'

export const TOTAL_SEGMENTOS_DEFECTO = 54
export const ARCO_GRADOS_DEFECTO = 250

export interface SegmentoVelocimetro {
  indice: number
  anguloDeg: number
  activo: boolean
}

export interface GeometriaVelocimetro {
  porcentajeSeguro: number
  segmentosActivos: number
  segmentos: SegmentoVelocimetro[]
}

export function obtenerColorNivelVelocimetro(nivel: NivelRiesgo): string {
  switch (nivel) {
    case 'bajo':
      return COLORES_TEMA.riesgo.estableVelocimetro
    case 'medio':
      return COLORES_TEMA.riesgo.preventivoVelocimetro
    case 'alto':
    default:
      return COLORES_TEMA.riesgo.prioritarioVelocimetro
  }
}

export function calcularGeometriaVelocimetro(
  porcentaje: number,
  totalSegmentos: number = TOTAL_SEGMENTOS_DEFECTO,
  arcoGrados: number = ARCO_GRADOS_DEFECTO,
): GeometriaVelocimetro {
  const porcentajeSeguro = Number.isFinite(porcentaje)
    ? Math.min(100, Math.max(0, porcentaje))
    : 0
  const segmentosActivos = Math.round((porcentajeSeguro / 100) * totalSegmentos)
  const inicioDeg = -arcoGrados / 2
  const pasoDeg = totalSegmentos > 1 ? arcoGrados / (totalSegmentos - 1) : 0

  const segmentos: SegmentoVelocimetro[] = Array.from({ length: totalSegmentos }, (_, indice) => ({
    indice,
    anguloDeg: inicioDeg + indice * pasoDeg,
    activo: indice < segmentosActivos,
  }))

  return {
    porcentajeSeguro,
    segmentosActivos,
    segmentos,
  }
}

interface MedidorVelocimetroProps {
  porcentaje: number
  nivel: NivelRiesgo
  etiquetaSecundaria?: string
  tamano?: 'sm' | 'md' | 'lg'
  ariaLabel?: string
  mostrarDecimales?: boolean
}

const TAMANO_CONFIG = {
  sm: { contenedor: 'max-w-[208px]', valor: 'text-2xl', sub: 'text-xs max-w-[116px]', pt: 'pt-5' },
  md: { contenedor: 'max-w-[232px]', valor: 'text-4xl', sub: 'text-xs max-w-[140px]', pt: 'pt-4' },
  lg: { contenedor: 'max-w-[264px]', valor: 'text-[44px]', sub: 'text-xs max-w-[148px]', pt: 'pt-4' },
} as const

export default function MedidorVelocimetro({
  porcentaje,
  nivel,
  etiquetaSecundaria = 'de 100%',
  tamano = 'lg',
  ariaLabel,
  mostrarDecimales = false,
}: MedidorVelocimetroProps) {
  const reducirMovimiento = useReducedMotion()
  const tituloId = useId()
  const porcentajeObjetivo = Number.isFinite(porcentaje)
    ? Math.min(100, Math.max(0, porcentaje))
    : 0

  const [valorAnimado, setValorAnimado] = useState<number>(
    reducirMovimiento ? porcentajeObjetivo : 0,
  )
  const valorAnteriorRef = useRef<number>(reducirMovimiento ? porcentajeObjetivo : 0)

  useEffect(() => {
    if (reducirMovimiento) {
      valorAnteriorRef.current = porcentajeObjetivo
      setValorAnimado(porcentajeObjetivo)
      return
    }

    const desde = valorAnteriorRef.current
    const hasta = porcentajeObjetivo
    if (Math.abs(hasta - desde) < 0.05) {
      valorAnteriorRef.current = hasta
      setValorAnimado(hasta)
      return
    }

    const duracionMs = 700
    const inicio = performance.now()
    let rafId = 0

    const tick = (ahora: number) => {
      const progreso = Math.min(1, (ahora - inicio) / duracionMs)
      // Curva ease-out exponencial suave sincronizada para segmentos y contador
      const easing = 1 - Math.pow(1 - progreso, 3.2)
      const actual = desde + (hasta - desde) * easing
      valorAnteriorRef.current = actual
      setValorAnimado(actual)

      if (progreso < 1) {
        rafId = requestAnimationFrame(tick)
      } else {
        valorAnteriorRef.current = hasta
        setValorAnimado(hasta)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [porcentajeObjetivo, reducirMovimiento])

  const geometria = useMemo(
    () => calcularGeometriaVelocimetro(valorAnimado),
    [valorAnimado],
  )
  const colorActivo = obtenerColorNivelVelocimetro(nivel)
  const cfg = TAMANO_CONFIG[tamano]

  const textoValor = mostrarDecimales
    ? `${valorAnimado.toFixed(1)}%`
    : `${Math.round(valorAnimado)}%`

  const descripcionAccesible =
    ariaLabel ||
    `Indicador radial en ${porcentajeObjetivo.toFixed(1)}%: ${etiquetaSecundaria}`

  return (
    <div className={`relative mx-auto w-full ${cfg.contenedor} select-none`}>
      <svg
        viewBox="0 0 240 206"
        role="img"
        aria-labelledby={tituloId}
        className="w-full h-auto overflow-visible"
      >
        <title id={tituloId}>{descripcionAccesible}</title>
        <g>
          {geometria.segmentos.map((seg) => (
            <rect
              key={seg.indice}
              x={117.75}
              y={14}
              width={4.5}
              height={21}
              rx={2.25}
              fill={seg.activo ? colorActivo : 'var(--gauge-inactive)'}
              transform={`rotate(${seg.anguloDeg.toFixed(2)} 120 120)`}
            />
          ))}
        </g>
      </svg>

      <div className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-center ${cfg.pt} text-center`}>
        <span
          className={`font-semibold leading-none tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums ${cfg.valor}`}
        >
          {textoValor}
        </span>
        {etiquetaSecundaria && (
          <span className={`mt-1.5 leading-tight text-zinc-600 dark:text-zinc-400 ${cfg.sub}`}>
            {etiquetaSecundaria}
          </span>
        )}
      </div>
    </div>
  )
}
