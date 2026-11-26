import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { flushSync } from 'react-dom'
import { obtenerEstudiantesRiesgo, type EstudianteRiesgo } from '../api/cliente'

export type TemaAplicacion = 'light' | 'dark'
export const CLAVE_TEMA_STORAGE = 'alerta-enfermeria-tema'

export interface EstadoPanelContextValue {
  pendientesPrioritarios: number | null
  modalEticoAbierto: boolean
  setModalEticoAbierto: (abierto: boolean) => void
  actualizarPendientesDesdeLista: (estudiantes: EstudianteRiesgo[]) => void
  refrescarShell: () => Promise<void>
  tema: TemaAplicacion
  alternarTemaConAnimacion: (evento: MouseEvent<HTMLButtonElement>) => void
}

interface ViewTransitionLike {
  ready: Promise<void>
}

type DocumentConViewTransition = Document & {
  startViewTransition?: (callback: () => void) => ViewTransitionLike
}

export function calcularRadioExpansionTema(
  x: number,
  y: number,
  ancho: number,
  alto: number,
): number {
  return Math.hypot(Math.max(x, ancho - x), Math.max(y, alto - y))
}

function leerTemaInicial(): TemaAplicacion {
  if (typeof window === 'undefined') return 'light'
  try {
    return window.localStorage.getItem(CLAVE_TEMA_STORAGE) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function aplicarTemaAlDocumento(tema: TemaAplicacion) {
  if (typeof document === 'undefined') return
  const esOscuro = tema === 'dark'
  document.documentElement.classList.toggle('dark', esOscuro)
  const metaTheme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (metaTheme) {
    metaTheme.content = esOscuro ? '#0E0E10' : '#F4F4F5'
  }
}

const EstadoPanelContext = createContext<EstadoPanelContextValue | null>(null)

export function EstadoPanelProvider({ children }: { children: ReactNode }) {
  const [pendientesPrioritarios, setPendientesPrioritarios] = useState<number | null>(null)
  const [modalEticoAbierto, setModalEticoAbierto] = useState(false)
  const [tema, setTema] = useState<TemaAplicacion>(leerTemaInicial)

  useEffect(() => {
    aplicarTemaAlDocumento(tema)
    try {
      window.localStorage.setItem(CLAVE_TEMA_STORAGE, tema)
    } catch {
      // Ignorar si almacenamiento local no está disponible
    }
  }, [tema])

  const alternarTemaConAnimacion = useCallback(
    (evento: MouseEvent<HTMLButtonElement>) => {
      const siguienteTema: TemaAplicacion = tema === 'dark' ? 'light' : 'dark'
      const rect = evento.currentTarget.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2
      const radioMax = calcularRadioExpansionTema(x, y, window.innerWidth, window.innerHeight)

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const doc = document as DocumentConViewTransition

      if (reduceMotion || typeof doc.startViewTransition !== 'function') {
        setTema(siguienteTema)
        return
      }

      const transicion = doc.startViewTransition(() => {
        aplicarTemaAlDocumento(siguienteTema)
        flushSync(() => {
          setTema(siguienteTema)
        })
      })

      transicion.ready
        .then(() => {
          document.documentElement.animate(
            {
              clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radioMax}px at ${x}px ${y}px)`],
            },
            {
              duration: 480,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
              pseudoElement: '::view-transition-new(root)',
            },
          )
        })
        .catch(() => {
          // Si se interrumpe por otro clic rápido, el estado final ya quedó aplicado
        })
    },
    [tema],
  )

  const actualizarPendientesDesdeLista = useCallback((estudiantes: EstudianteRiesgo[]) => {
    const conteo = estudiantes.filter(
      (e) => e.nivel_riesgo === 'alto' && e.estado_tutoria === 'pendiente',
    ).length
    setPendientesPrioritarios(conteo)
  }, [])

  const refrescarShell = useCallback(async () => {
    try {
      const estudiantes = await obtenerEstudiantesRiesgo()
      actualizarPendientesDesdeLista(estudiantes)
    } catch {
      // Las vistas manejan y muestran el estado de error si el servidor no responde
    }
  }, [actualizarPendientesDesdeLista])

  useEffect(() => {
    void refrescarShell()
  }, [refrescarShell])

  return (
    <EstadoPanelContext.Provider
      value={{
        pendientesPrioritarios,
        modalEticoAbierto,
        setModalEticoAbierto,
        actualizarPendientesDesdeLista,
        refrescarShell,
        tema,
        alternarTemaConAnimacion,
      }}
    >
      {children}
    </EstadoPanelContext.Provider>
  )
}

export function useEstadoPanel(): EstadoPanelContextValue {
  const ctx = useContext(EstadoPanelContext)
  if (!ctx) {
    throw new Error('useEstadoPanel debe utilizarse dentro de EstadoPanelProvider')
  }
  return ctx
}
