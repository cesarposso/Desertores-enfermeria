import { useEffect, useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart2,
  Sliders,
  AlertTriangle,
  ShieldCheck,
  Moon,
  Sun,
  X,
} from 'lucide-react'
import { useEstadoPanel } from '../context/EstadoPanelContext'

const NAV_ITEMS = [
  { to: '/resumen', label: 'Resumen', shortLabel: 'Resumen', icon: LayoutDashboard },
  { to: '/alumnos', label: 'Alumnos en riesgo', shortLabel: 'Riesgo', icon: Users },
  { to: '/materias', label: 'Materias', shortLabel: 'Materias', icon: BookOpen },
  { to: '/modelos', label: 'Modelos', shortLabel: 'Modelos', icon: BarChart2 },
  { to: '/simulador', label: 'Simulador', shortLabel: 'Simular', icon: Sliders },
] as const

export function BarraSuperiorIslas() {
  const {
    pendientesPrioritarios,
    setModalEticoAbierto,
    tema,
    alternarTemaConAnimacion,
  } = useEstadoPanel()

  const esOscuro = tema === 'dark'

  return (
    <header className="sticky top-0 z-30 border-b border-black/[0.04] bg-[#F4F4F5]/90 backdrop-blur-md dark:border-white/[0.06] dark:bg-[#0E0E10]/90">
      <div className="flex w-full items-center justify-between gap-3 px-4 py-3 md:px-6 lg:px-8">
        {/* Zona izquierda: Logo institucional + título compacto */}
        <NavLink
          to="/resumen"
          className="pressable flex items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-black/5 bg-white p-1.5 shadow-xs dark:border-white/15">
            <img
              src="/logo-unipamplona.png"
              alt="Universidad de Pamplona"
              className="h-full w-auto object-contain"
            />
          </span>
          <span className="leading-tight">
            <span className="block font-heading text-sm font-semibold text-zinc-900 dark:text-zinc-100 sm:text-base">
              Alerta Temprana
            </span>
            <span className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Enfermería · UniPamplona
            </span>
          </span>
        </NavLink>

        {/* Zona central: Isla flotante horizontal con padding lateral simétrico */}
        <nav
          aria-label="Navegación principal"
          className="hidden md:flex items-center rounded-full border border-black/5 bg-white/95 px-2.5 py-1.5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#18181B]/95"
        >
          <LayoutGroup id="nav-islas-principal">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map(({ to, label }) => {
                const esAlumnos = to === '/alumnos'
                const mostrarBadge =
                  esAlumnos && pendientesPrioritarios !== null && pendientesPrioritarios > 0
                return (
                  <li key={to}>
                    <NavLink
                      to={to}
                      className={({ isActive }) =>
                        [
                          'pressable relative inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado lg:px-4 lg:text-[13px]',
                          isActive
                            ? 'text-white dark:text-[#18181B]'
                            : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100',
                        ].join(' ')
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.span
                              layoutId="nav-pill-activa"
                              transition={{ type: 'spring', duration: 0.32, bounce: 0.12 }}
                              className="absolute inset-0 rounded-full bg-[#18181B] shadow-xs dark:bg-white"
                              aria-hidden="true"
                            />
                          )}
                          <span className="relative z-10">{label}</span>
                          {mostrarBadge && (
                            <span
                              className={`relative z-10 inline-flex min-w-[22px] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums leading-none ${
                                isActive
                                  ? 'bg-[#B44B27] text-white'
                                  : 'bg-amber-100 text-amber-950 dark:bg-orange-500/20 dark:text-orange-200'
                              }`}
                            >
                              {pendientesPrioritarios}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </LayoutGroup>
        </nav>

        {/* Zona derecha: Indicador permanente de datos sintéticos (+ toggle tema en móvil) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setModalEticoAbierto(true)}
            aria-label="Ver detalles metodológicos sobre datos sintéticos y uso no punitivo"
            className="pressable inline-flex items-center gap-1.5 rounded-full border border-amber-300/80 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200 dark:hover:bg-amber-500/25"
          >
            <ShieldCheck
              className="h-3.5 w-3.5 shrink-0 text-amber-800 dark:text-amber-300"
              aria-hidden="true"
            />
            <span className="hidden sm:inline">Datos sintéticos · Orientador, no punitivo</span>
            <span className="sm:hidden">Datos sintéticos</span>
          </button>

          <button
            type="button"
            onClick={alternarTemaConAnimacion}
            title={esOscuro ? 'Activar modo claro' : 'Activar modo oscuro'}
            aria-label={esOscuro ? 'Activar modo claro' : 'Activar modo oscuro'}
            aria-pressed={esOscuro}
            className="pressable md:hidden flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-zinc-800 shadow-xs dark:border-white/10 dark:bg-[#27272A] dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado"
          >
            {esOscuro ? (
              <Sun className="h-4 w-4 text-amber-300" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

export function DockFlotanteDesktop() {
  const navigate = useNavigate()
  const location = useLocation()
  const reducirMovimiento = useReducedMotion()
  const { pendientesPrioritarios, setModalEticoAbierto, tema, alternarTemaConAnimacion } =
    useEstadoPanel()

  const esOscuro = tema === 'dark'
  const enSimulador = location.pathname === '/simulador'
  const enPrioritarios =
    location.pathname === '/alumnos' && location.search.includes('nivel=alto')

  return (
    <aside
      aria-label="Accesos rápidos"
      className="hidden md:flex fixed left-4 lg:left-5 top-1/2 z-40 -translate-y-1/2 flex-col items-center gap-2 rounded-full border border-white/10 bg-[#18181B] p-2 text-zinc-300 shadow-xl dark:bg-[#27272A]"
    >
      <button
        type="button"
        onClick={() => navigate('/simulador')}
        title="Ir al Simulador"
        aria-label="Ir al Simulador interactivo"
        className={`pressable hover-scale flex h-10 w-10 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado ${
          enSimulador
            ? 'bg-unipamplona-rojo text-white'
            : 'text-zinc-300 hover:bg-white/10 hover:text-white'
        }`}
      >
        <Sliders className="h-4 w-4" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => navigate('/alumnos?nivel=alto&estado=pendiente')}
        title="Filtrar prioritarios pendientes"
        aria-label="Filtrar estudiantes en acompañamiento prioritario pendientes"
        className={`pressable hover-scale relative flex h-10 w-10 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado ${
          enPrioritarios
            ? 'bg-[#B44B27] text-white'
            : 'text-zinc-300 hover:bg-white/10 hover:text-white'
        }`}
      >
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        {pendientesPrioritarios !== null && pendientesPrioritarios > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-[20px] items-center justify-center rounded-full bg-[#B44B27] px-1 text-[11px] font-bold tabular-nums leading-4 text-white ring-2 ring-[#18181B] dark:ring-[#27272A]">
            {pendientesPrioritarios}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => setModalEticoAbierto(true)}
        title="Ver aviso metodológico y ético"
        aria-label="Ver aviso metodológico y ético"
        className="pressable hover-scale flex h-10 w-10 items-center justify-center rounded-full text-amber-300 hover:bg-white/10 hover:text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado"
      >
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
      </button>

      <div className="my-0.5 h-px w-5 bg-white/10" aria-hidden="true" />

      {/* Botón circular Sol / Luna para alternar modo claro ↔ oscuro */}
      <button
        type="button"
        onClick={alternarTemaConAnimacion}
        title={esOscuro ? 'Activar modo claro' : 'Activar modo oscuro'}
        aria-label={esOscuro ? 'Activar modo claro' : 'Activar modo oscuro'}
        aria-pressed={esOscuro}
        className="pressable hover-scale flex h-10 w-10 items-center justify-center rounded-full text-zinc-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={tema}
            initial={reducirMovimiento ? { opacity: 0 } : { opacity: 0, rotate: -30, scale: 0.85 }}
            animate={reducirMovimiento ? { opacity: 1 } : { opacity: 1, rotate: 0, scale: 1 }}
            exit={reducirMovimiento ? { opacity: 0 } : { opacity: 0, rotate: 30, scale: 0.85 }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
            className="flex items-center justify-center"
          >
            {esOscuro ? (
              <Sun className="h-4 w-4 text-amber-300" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </motion.span>
        </AnimatePresence>
      </button>
    </aside>
  )
}

export function DockMovilInferior() {
  const { pendientesPrioritarios } = useEstadoPanel()

  return (
    <nav
      aria-label="Navegación móvil"
      className="md:hidden fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] z-40 rounded-full border border-white/10 bg-[#18181B]/95 p-1.5 shadow-2xl backdrop-blur-md dark:bg-[#27272A]/95"
    >
      <ul className="grid grid-cols-5 items-center gap-1">
        {NAV_ITEMS.map(({ to, shortLabel, icon: Icon }) => {
          const esAlumnos = to === '/alumnos'
          const mostrarBadge =
            esAlumnos && pendientesPrioritarios !== null && pendientesPrioritarios > 0
          return (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  [
                    'pressable relative flex flex-col items-center justify-center gap-0.5 rounded-full py-1.5 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado',
                    isActive
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-300 hover:text-white',
                  ].join(' ')
                }
              >
                <span className="relative">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {mostrarBadge && (
                    <span className="absolute -right-3 -top-1.5 flex min-w-[18px] items-center justify-center rounded-full bg-[#B44B27] px-1 text-[11px] font-bold tabular-nums leading-4 text-white">
                      {pendientesPrioritarios}
                    </span>
                  )}
                </span>
                <span>{shortLabel}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function ModalAvisoMetodologico() {
  const { modalEticoAbierto, setModalEticoAbierto } = useEstadoPanel()
  const reducirMovimiento = useReducedMotion()
  const botonCerrarRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!modalEticoAbierto) return
    const timer = setTimeout(() => botonCerrarRef.current?.focus(), 40)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setModalEticoAbierto(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [modalEticoAbierto, setModalEticoAbierto])

  return (
    <AnimatePresence>
      {modalEticoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setModalEticoAbierto(false)}
            className="fixed inset-0 bg-zinc-950/50 backdrop-blur-xs"
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-etico-titulo"
            initial={reducirMovimiento ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            animate={reducirMovimiento ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={reducirMovimiento ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="bento-card relative z-10 w-full max-w-lg p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="modal-etico-titulo"
                    className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
                  >
                    Marco Ético y Metodológico
                  </h2>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Semillero de Investigación · Enfermería UniPamplona
                  </p>
                </div>
              </div>

              <button
                ref={botonCerrarRef}
                type="button"
                onClick={() => setModalEticoAbierto(false)}
                aria-label="Cerrar aviso metodológico"
                className="pressable rounded-full p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
              <div className="rounded-2xl bg-amber-50 p-3.5 text-amber-950 dark:bg-amber-500/15 dark:text-amber-100">
                <p className="font-semibold">1. Datos sintéticos y códigos anonimizados</p>
                <p className="mt-1 text-pretty">
                  Los 150 registros de matrícula mostrados en esta fase son sintéticos y usan
                  identificadores anónimos (<span className="tabular-nums font-medium">ENF-001</span>...).
                  No exponen información personal ni académica real.
                </p>
              </div>

              <div className="rounded-2xl bg-zinc-50 p-3.5 dark:bg-white/[0.04]">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  2. Enfoque orientador, nunca punitivo
                </p>
                <p className="mt-1 text-pretty">
                  Las probabilidades calculadas por el modelo de Machine Learning y la Lógica Difusa
                  son señales tempranas para convocar a tutorías formativas de cuidado. Bajo ningún
                  criterio deben usarse para sancionar, calificar o excluir estudiantes.
                </p>
              </div>

              <div className="rounded-2xl bg-zinc-50 p-3.5 dark:bg-white/[0.04]">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  3. Umbral preventivo institucional (35%)
                </p>
                <p className="mt-1 text-pretty">
                  El rojo institucional (<span className="font-medium">#AD3333</span>) representa
                  exclusivamente la identidad de la Universidad de Pamplona. Los niveles de alerta
                  usan tonos suaves diferenciados para evitar lecturas alarmistas.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setModalEticoAbierto(false)}
                className="pressable rounded-full bg-zinc-900 px-5 py-2 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado"
              >
                Entendido
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
