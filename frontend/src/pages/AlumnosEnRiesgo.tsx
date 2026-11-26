import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  obtenerEstudiantesRiesgo,
  actualizarTutoria,
  nivelRiesgoClase,
  nivelRiesgoEtiqueta,
} from '../api/cliente'
import type { EstudianteRiesgo } from '../api/cliente'
import { useEstadoPanel } from '../context/EstadoPanelContext'
import CargandoSpinner from '../components/CargandoSpinner'
import ErrorCartel from '../components/ErrorCartel'
import AvisoEtico from '../components/AvisoEtico'
import MedidorVelocimetro from '../components/MedidorVelocimetro'
import {
  Search,
  Filter,
  X,
  Calendar,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Users,
  AlertTriangle,
} from 'lucide-react'

const FILAS_POR_PAGINA = 25

export default function AlumnosEnRiesgo() {
  const [searchParams, setSearchParams] = useSearchParams()
  const reducirMovimiento = useReducedMotion()
  const { actualizarPendientesDesdeLista } = useEstadoPanel()

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [todosEstudiantes, setTodosEstudiantes] = useState<EstudianteRiesgo[]>([])

  const [filtroAsignatura, setFiltroAsignatura] = useState<string>('')
  const [filtroNivel, setFiltroNivel] = useState<string>(
    () => searchParams.get('nivel') || '',
  )
  const [filtroTutoria, setFiltroTutoria] = useState<string>(
    () => searchParams.get('estado') || '',
  )

  const [paginaActual, setPaginaActual] = useState(1)

  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<EstudianteRiesgo | null>(
    null,
  )
  const [fechaTutoria, setFechaTutoria] = useState<string>('')
  const [guardandoTutoria, setGuardandoTutoria] = useState(false)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [errorTutoria, setErrorTutoria] = useState<string | null>(null)

  const botonActivadorRef = useRef<HTMLElement | null>(null)
  const drawerRef = useRef<HTMLDivElement | null>(null)
  const botonCerrarRef = useRef<HTMLButtonElement | null>(null)

  const cargarEstudiantes = async () => {
    try {
      setCargando(true)
      setError(null)
      const data = await obtenerEstudiantesRiesgo()
      const ordenados = [...data].sort((a, b) => b.probabilidad_riesgo - a.probabilidad_riesgo)
      setTodosEstudiantes(ordenados)
      actualizarPendientesDesdeLista(ordenados)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con el servidor'
      setError(msg)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    void cargarEstudiantes()
  }, [])

  useEffect(() => {
    const nivelParam = searchParams.get('nivel')
    const estadoParam = searchParams.get('estado')
    if (nivelParam !== null) setFiltroNivel(nivelParam)
    if (estadoParam !== null) setFiltroTutoria(estadoParam)
  }, [searchParams])

  useEffect(() => {
    const codigoParam = searchParams.get('estudiante')
    if (!codigoParam || todosEstudiantes.length === 0) return

    const encontrado = todosEstudiantes.find((e) => e.codigo_estudiante === codigoParam)
    if (encontrado) {
      botonActivadorRef.current = document.activeElement as HTMLElement
      setEstudianteSeleccionado(encontrado)
      setFechaTutoria(encontrado.fecha_tutoria || new Date().toISOString().split('T')[0])
      setMensajeExito(null)
      setErrorTutoria(null)
      setDrawerAbierto(true)
    }

    const siguientes = new URLSearchParams(searchParams)
    siguientes.delete('estudiante')
    setSearchParams(siguientes, { replace: true })
  }, [todosEstudiantes, searchParams, setSearchParams])

  const asignaturasDisponibles = useMemo(() => {
    const setAsig = new Set<string>()
    todosEstudiantes.forEach((e) => {
      if (e.asignatura) setAsig.add(e.asignatura)
    })
    return Array.from(setAsig).sort()
  }, [todosEstudiantes])

  const estudiantesFiltrados = useMemo(() => {
    return todosEstudiantes.filter((e) => {
      if (filtroAsignatura && e.asignatura !== filtroAsignatura) return false
      if (filtroNivel && e.nivel_riesgo !== filtroNivel) return false
      if (filtroTutoria && e.estado_tutoria !== filtroTutoria) return false
      return true
    })
  }, [todosEstudiantes, filtroAsignatura, filtroNivel, filtroTutoria])

  useEffect(() => {
    setPaginaActual(1)
  }, [filtroAsignatura, filtroNivel, filtroTutoria])

  const totalFiltrados = estudiantesFiltrados.length
  const totalPaginas = Math.ceil(totalFiltrados / FILAS_POR_PAGINA) || 1
  const indiceInicio = (paginaActual - 1) * FILAS_POR_PAGINA
  const indiceFin = Math.min(indiceInicio + FILAS_POR_PAGINA, totalFiltrados)
  const estudiantesPaginados = useMemo(() => {
    return estudiantesFiltrados.slice(indiceInicio, indiceFin)
  }, [estudiantesFiltrados, indiceInicio, indiceFin])

  const abrirDrawer = (estudiante: EstudianteRiesgo, e?: React.MouseEvent) => {
    if (e) {
      botonActivadorRef.current = e.currentTarget as HTMLElement
    } else {
      botonActivadorRef.current = document.activeElement as HTMLElement
    }
    setEstudianteSeleccionado(estudiante)
    setFechaTutoria(estudiante.fecha_tutoria || new Date().toISOString().split('T')[0])
    setMensajeExito(null)
    setErrorTutoria(null)
    setDrawerAbierto(true)
  }

  const cerrarDrawer = useCallback(() => {
    setDrawerAbierto(false)
    setMensajeExito(null)
    setErrorTutoria(null)
    setTimeout(() => {
      botonActivadorRef.current?.focus()
    }, 60)
  }, [])

  useEffect(() => {
    if (!drawerAbierto) return
    const elementoActual = drawerRef.current
    if (!elementoActual) return

    const focusTimer = setTimeout(() => {
      botonCerrarRef.current?.focus()
    }, 50)

    const manejarKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        cerrarDrawer()
        return
      }

      if (e.key === 'Tab') {
        const elementosFocalizables = elementoActual.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        const primero = elementosFocalizables[0]
        const ultimo = elementosFocalizables[elementosFocalizables.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === primero) {
            e.preventDefault()
            ultimo?.focus()
          }
        } else {
          if (document.activeElement === ultimo) {
            e.preventDefault()
            primero?.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', manejarKeyDown)
    return () => {
      clearTimeout(focusTimer)
      document.removeEventListener('keydown', manejarKeyDown)
    }
  }, [drawerAbierto, cerrarDrawer])

  const handleGuardarTutoria = async () => {
    if (!estudianteSeleccionado) return

    try {
      setGuardandoTutoria(true)
      setErrorTutoria(null)
      const actualizado = await actualizarTutoria(estudianteSeleccionado.codigo_estudiante, {
        estado: 'citado',
        fecha: fechaTutoria || undefined,
      })

      setTodosEstudiantes((prev) => {
        const siguiente = prev.map((item) =>
          item.codigo_estudiante === actualizado.codigo_estudiante ? actualizado : item,
        )
        actualizarPendientesDesdeLista(siguiente)
        return siguiente
      })
      setEstudianteSeleccionado(actualizado)
      setMensajeExito('Citación formativa agendada y registrada con éxito en los datos sintéticos.')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar la tutoría'
      setErrorTutoria(`No se pudo actualizar la citación: ${msg}`)
    } finally {
      setGuardandoTutoria(false)
    }
  }

  const hayFiltrosActivos = Boolean(filtroAsignatura || filtroNivel || filtroTutoria)

  const limpiarFiltros = () => {
    setFiltroAsignatura('')
    setFiltroNivel('')
    setFiltroTutoria('')
    if (searchParams.has('nivel') || searchParams.has('estado')) {
      const siguientes = new URLSearchParams(searchParams)
      siguientes.delete('nivel')
      siguientes.delete('estado')
      setSearchParams(siguientes, { replace: true })
    }
  }

  if (cargando) {
    return <CargandoSpinner mensaje="Cargando listado de estudiantes en alerta temprana..." />
  }

  if (error) {
    return (
      <div className="max-w-2xl">
        <ErrorCartel mensaje={error} onReintentar={cargarEstudiantes} />
      </div>
    )
  }

  const prioritariosPendientes = estudiantesFiltrados.filter(
    (e) => e.nivel_riesgo === 'alto' && e.estado_tutoria === 'pendiente',
  ).length

  const selectClase =
    'w-full rounded-2xl border border-black/10 bg-zinc-50/70 px-3.5 py-2 text-xs text-zinc-800 transition-colors focus:border-unipamplona-rojo focus:bg-white focus:outline-none focus:ring-2 focus:ring-unipamplona-dorado dark:border-white/10 dark:bg-[#27272A] dark:text-zinc-100 dark:focus:bg-[#27272A]'

  return (
    <div className="space-y-6">
      {/* Encabezado + chips métricos circulares */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-[#F4F4F5]">
            Alumnos en Riesgo
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-[#A1A1AA]">
            Monitoreo orientador priorizado para citación temprana a tutoría pedagógica ·
            Universidad de Pamplona.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-white text-zinc-700 shadow-2xs dark:border-white/10 dark:bg-[#18181B] dark:text-zinc-200">
              <Users className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="text-base font-semibold tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                {totalFiltrados}
              </p>
              <p className="text-xs text-zinc-600 dark:text-[#A1A1AA]">En vista actual</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#B44B27] text-white shadow-2xs">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="text-base font-semibold tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                {prioritariosPendientes}
              </p>
              <p className="text-xs text-zinc-600 dark:text-[#A1A1AA]">Prioritarios pendientes</p>
            </div>
          </div>
        </div>
      </div>

      <AvisoEtico />

      {/* Barra de Filtros */}
      <section className="bento-card space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-3.5 dark:border-white/10">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-[#F4F4F5]">
            <Filter className="h-4 w-4 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
            <span>Filtros de búsqueda</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-[#A1A1AA]">
            <span>
              Mostrando{' '}
              <strong className="tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                {totalFiltrados}
              </strong>{' '}
              de{' '}
              <strong className="tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                {todosEstudiantes.length}
              </strong>{' '}
              estudiantes
            </span>
            {prioritariosPendientes > 0 && (
              <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-amber-950 dark:border-orange-400/30 dark:bg-orange-500/15 dark:text-orange-200">
                {prioritariosPendientes} prioritarios pendientes
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label
              htmlFor="filtro-asignatura"
              className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
            >
              Asignatura ({asignaturasDisponibles.length})
            </label>
            <select
              id="filtro-asignatura"
              value={filtroAsignatura}
              onChange={(e) => setFiltroAsignatura(e.target.value)}
              className={selectClase}
            >
              <option value="">Todas las asignaturas</option>
              {asignaturasDisponibles.map((asig) => (
                <option key={asig} value={asig}>
                  {asig}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filtro-nivel"
              className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
            >
              Nivel de riesgo
            </label>
            <select
              id="filtro-nivel"
              value={filtroNivel}
              onChange={(e) => setFiltroNivel(e.target.value)}
              className={selectClase}
            >
              <option value="">Todos los niveles</option>
              <option value="alto">Acompañamiento prioritario</option>
              <option value="medio">Seguimiento preventivo</option>
              <option value="bajo">Situación estable</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="filtro-tutoria"
              className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
            >
              Estado de tutoría
            </label>
            <select
              id="filtro-tutoria"
              value={filtroTutoria}
              onChange={(e) => setFiltroTutoria(e.target.value)}
              className={selectClase}
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente de citación</option>
              <option value="citado">Citado a tutoría</option>
            </select>
          </div>
        </div>

        {hayFiltrosActivos && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={limpiarFiltros}
              className="pressable inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              <span>Limpiar filtros aplicados</span>
            </button>
          </div>
        )}
      </section>

      {/* Tabla Desktop / Tarjetas Móvil */}
      {estudiantesFiltrados.length === 0 ? (
        <div className="bento-card p-12 text-center text-zinc-600 dark:text-[#A1A1AA]">
          <Search className="mx-auto h-8 w-8 text-zinc-400" aria-hidden="true" />
          <h2 className="mt-3 text-base font-semibold text-zinc-900 dark:text-[#F4F4F5]">
            Sin resultados de estudiantes
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-zinc-600 dark:text-[#A1A1AA]">
            No se encontraron estudiantes que coincidan con los filtros seleccionados en los datos
            sintéticos.
          </p>
          <button
            type="button"
            onClick={limpiarFiltros}
            className="pressable mt-5 rounded-full bg-unipamplona-rojo px-5 py-2 text-xs font-medium text-white hover:bg-[#962929] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado"
          >
            Restablecer todos los filtros
          </button>
        </div>
      ) : (
        <div className="bento-card overflow-hidden">
          {/* VISTA DESKTOP / TABLET */}
          <div className="hidden md:block overflow-x-auto max-h-[640px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-black/5 bg-zinc-50/95 text-xs font-semibold uppercase tracking-wider text-zinc-600 backdrop-blur-xs dark:border-white/10 dark:bg-[#1E1E22]/95 dark:text-[#A1A1AA]">
                <tr>
                  <th scope="col" className="px-5 py-3.5">
                    Código anónimo
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Asignatura
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-center">
                    Probabilidad orientadora
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Factores que más pesan en esta estimación
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-center">
                    Estado tutoría
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                {estudiantesPaginados.map((est) => (
                  <tr
                    key={est.codigo_estudiante}
                    className="transition-colors duration-150 hover:bg-zinc-50/80 dark:hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-3.5 font-semibold text-zinc-900 dark:text-[#F4F4F5] tabular-nums whitespace-nowrap">
                      {est.codigo_estudiante}
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="font-medium text-zinc-900 dark:text-[#F4F4F5]">
                        {est.asignatura}
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-[#A1A1AA] tabular-nums">
                        Semestre {est.semestre}
                      </p>
                    </td>

                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tabular-nums border ${nivelRiesgoClase(
                          est.nivel_riesgo,
                        )}`}
                      >
                        {est.probabilidad_riesgo.toFixed(1)}% ·{' '}
                        {nivelRiesgoEtiqueta(est.nivel_riesgo)}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-zinc-600 dark:text-[#A1A1AA] max-w-xs">
                      {est.factor_principal}
                    </td>

                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      {est.estado_tutoria === 'citado' ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>
                            Citado {est.fecha_tutoria ? `(${est.fecha_tutoria})` : ''}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-black/5 bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-300">
                          Pendiente
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => abrirDrawer(est, e)}
                        className={`pressable rounded-full px-4 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado ${
                          est.estado_tutoria === 'citado'
                            ? 'border border-black/10 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:border-white/10 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15'
                            : 'bg-unipamplona-rojo text-white hover:bg-[#962929] shadow-2xs'
                        }`}
                      >
                        {est.estado_tutoria === 'citado' ? 'Ver ficha' : 'Citar a tutoría'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* VISTA MÓVIL (< md) */}
          <div className="block md:hidden divide-y divide-black/[0.05] dark:divide-white/[0.08]">
            {estudiantesPaginados.map((est) => (
              <div key={est.codigo_estudiante} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-base font-semibold text-zinc-900 dark:text-[#F4F4F5] tabular-nums">
                      {est.codigo_estudiante}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-600 dark:text-[#A1A1AA]">
                      {est.asignatura} ·{' '}
                      <span className="tabular-nums">Sem. {est.semestre}</span>
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums border ${nivelRiesgoClase(
                      est.nivel_riesgo,
                    )}`}
                  >
                    {est.probabilidad_riesgo.toFixed(1)}%
                  </span>
                </div>

                <div className="rounded-2xl bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-white/[0.04] dark:text-[#A1A1AA]">
                  <span className="mb-0.5 block font-medium text-zinc-800 dark:text-zinc-200">
                    Factores que más pesan en esta estimación:
                  </span>
                  {est.factor_principal}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    {est.estado_tutoria === 'citado' ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        <span>
                          Citado {est.fecha_tutoria ? `(${est.fecha_tutoria})` : ''}
                        </span>
                      </span>
                    ) : (
                      <span className="rounded-full border border-black/5 bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-300">
                        Pendiente
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => abrirDrawer(est, e)}
                    className={`pressable rounded-full px-4 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado ${
                      est.estado_tutoria === 'citado'
                        ? 'border border-black/10 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:border-white/10 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15'
                        : 'bg-unipamplona-rojo text-white hover:bg-[#962929] shadow-2xs'
                    }`}
                  >
                    {est.estado_tutoria === 'citado' ? 'Ver ficha' : 'Citar a tutoría'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Barra de Paginación */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-black/5 bg-zinc-50/70 px-5 py-3.5 text-xs text-zinc-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-[#A1A1AA]">
            <div>
              Mostrando{' '}
              <strong className="tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                {totalFiltrados > 0 ? indiceInicio + 1 : 0}
              </strong>{' '}
              a{' '}
              <strong className="tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                {indiceFin}
              </strong>{' '}
              de{' '}
              <strong className="tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                {totalFiltrados}
              </strong>{' '}
              estudiantes
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                aria-label="Página anterior"
                className="pressable inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-3.5 py-1.5 font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-[#27272A] dark:text-zinc-200 dark:hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Anterior</span>
              </button>

              <span className="px-2 font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
                Pág. {paginaActual} de {totalPaginas}
              </span>

              <button
                type="button"
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual >= totalPaginas}
                aria-label="Página siguiente"
                className="pressable inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-3.5 py-1.5 font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-[#27272A] dark:text-zinc-200 dark:hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado"
              >
                <span>Siguiente</span>
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      <AvisoEtico />

      {/* DRAWER LATERAL ACCESIBLE */}
      <AnimatePresence>
        {drawerAbierto && estudianteSeleccionado && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              onClick={cerrarDrawer}
              className="fixed inset-0 bg-zinc-950/50 backdrop-blur-xs"
              aria-hidden="true"
            />

            <motion.div
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="drawer-titulo"
              initial={reducirMovimiento ? { opacity: 0 } : { x: '100%' }}
              animate={reducirMovimiento ? { opacity: 1 } : { x: 0 }}
              exit={reducirMovimiento ? { opacity: 0 } : { x: '100%' }}
              transition={{
                duration: drawerAbierto ? 0.26 : 0.2,
                ease: [0.32, 0.72, 0, 1],
              }}
              className="relative z-10 flex h-dvh w-full flex-col overflow-y-auto bg-[#F4F4F5] shadow-2xl dark:bg-[#0E0E10] sm:max-w-md sm:rounded-l-[28px]"
            >
              {/* Cabecera del Drawer */}
              <div className="flex items-center justify-between border-b border-black/5 bg-white px-6 py-4 dark:border-white/10 dark:bg-[#18181B]">
                <div>
                  <h2
                    id="drawer-titulo"
                    className="text-lg font-semibold text-zinc-900 dark:text-[#F4F4F5] tabular-nums"
                  >
                    Estudiante {estudianteSeleccionado.codigo_estudiante}
                  </h2>
                  <p className="mt-0.5 text-xs text-zinc-600 dark:text-[#A1A1AA]">
                    {estudianteSeleccionado.asignatura} · Semestre{' '}
                    {estudianteSeleccionado.semestre}
                  </p>
                </div>

                <button
                  ref={botonCerrarRef}
                  type="button"
                  onClick={cerrarDrawer}
                  aria-label="Cerrar ficha del estudiante"
                  className="pressable rounded-full p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {/* Cuerpo del Drawer */}
              <div className="flex-1 space-y-4 p-5">
                <AvisoEtico compacto />

                <div className="bento-card p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Diagnóstico orientador
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${nivelRiesgoClase(
                        estudianteSeleccionado.nivel_riesgo,
                      )}`}
                    >
                      {nivelRiesgoEtiqueta(estudianteSeleccionado.nivel_riesgo)}
                    </span>
                  </div>

                  <MedidorVelocimetro
                    porcentaje={estudianteSeleccionado.probabilidad_riesgo}
                    nivel={estudianteSeleccionado.nivel_riesgo}
                    etiquetaSecundaria="probabilidad orientadora"
                    tamano="sm"
                    mostrarDecimales
                    ariaLabel={`Probabilidad orientadora de ${estudianteSeleccionado.codigo_estudiante}: ${estudianteSeleccionado.probabilidad_riesgo.toFixed(1)}%`}
                  />
                </div>

                <div className="bento-card p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp
                      className="h-4 w-4 text-zinc-700 dark:text-zinc-300"
                      aria-hidden="true"
                    />
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                      Factores que más pesan
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    {estudianteSeleccionado.factores_detalle &&
                    estudianteSeleccionado.factores_detalle.length > 0 ? (
                      estudianteSeleccionado.factores_detalle.slice(0, 4).map((f, idx) => (
                        <div
                          key={idx}
                          className="rounded-2xl bg-zinc-50/80 p-3 text-xs space-y-1.5 dark:bg-white/[0.04]"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium text-zinc-800 dark:text-zinc-200 leading-snug">
                              {f.descripcion}
                            </span>
                            <span className="text-xs font-semibold tabular-nums text-zinc-600 dark:text-[#A1A1AA] shrink-0">
                              {f.impacto_pct.toFixed(1)}% peso
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#D96B43]"
                              style={{
                                width: `${Math.min(100, Math.max(5, f.impacto_pct))}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-white/[0.04] dark:text-[#A1A1AA]">
                        {estudianteSeleccionado.factor_principal}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bento-card p-5 space-y-3">
                  <div className="flex items-center gap-2 border-b border-black/5 pb-2.5 dark:border-white/10">
                    <Calendar className="h-4 w-4 text-unipamplona-rojo" aria-hidden="true" />
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                      Acción de acompañamiento
                    </h3>
                  </div>

                  <div className="text-xs text-zinc-600 dark:text-[#A1A1AA]">
                    Estado actual:{' '}
                    <strong className="text-zinc-900 dark:text-[#F4F4F5] uppercase">
                      {estudianteSeleccionado.estado_tutoria}
                    </strong>
                    {estudianteSeleccionado.fecha_tutoria && (
                      <span className="block mt-1 text-emerald-800 dark:text-emerald-300 font-medium">
                        Fecha programada:{' '}
                        <strong className="tabular-nums">
                          {estudianteSeleccionado.fecha_tutoria}
                        </strong>
                      </span>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="fecha-tutoria-drawer"
                      className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
                    >
                      Fecha de la sesión (opcional)
                    </label>
                    <input
                      id="fecha-tutoria-drawer"
                      type="date"
                      value={fechaTutoria}
                      onChange={(e) => setFechaTutoria(e.target.value)}
                      className="w-full rounded-2xl border border-black/10 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-800 focus:border-unipamplona-rojo focus:bg-white focus:outline-none focus:ring-2 focus:ring-unipamplona-dorado dark:border-white/10 dark:bg-[#27272A] dark:text-zinc-100 dark:focus:bg-[#27272A]"
                    />
                  </div>

                  {mensajeExito && (
                    <div
                      role="status"
                      className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 flex items-start gap-2 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200"
                    >
                      <CheckCircle2
                        className="h-4 w-4 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{mensajeExito}</span>
                    </div>
                  )}

                  {errorTutoria && (
                    <div
                      role="alert"
                      className="rounded-2xl bg-amber-50 border border-amber-300 p-3 text-xs text-amber-950 flex items-start gap-2 dark:border-orange-400/30 dark:bg-orange-500/15 dark:text-orange-200"
                    >
                      <AlertCircle
                        className="h-4 w-4 text-amber-800 dark:text-orange-300 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{errorTutoria}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleGuardarTutoria}
                    disabled={guardandoTutoria}
                    className="pressable w-full rounded-full bg-unipamplona-rojo py-2.5 px-5 text-xs font-medium text-white shadow-xs hover:bg-[#962929] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado disabled:opacity-50"
                  >
                    {guardandoTutoria
                      ? 'Guardando citación...'
                      : estudianteSeleccionado.estado_tutoria === 'citado'
                      ? 'Reasignar / actualizar fecha'
                      : 'Marcar como citado a tutoría'}
                  </button>
                </div>
              </div>

              {/* Pie del Drawer */}
              <div className="border-t border-black/5 bg-white px-6 py-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))] flex justify-end dark:border-white/10 dark:bg-[#18181B]">
                <button
                  type="button"
                  onClick={cerrarDrawer}
                  className="pressable rounded-full border border-black/10 bg-zinc-100 px-4 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:border-white/10 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado"
                >
                  Cerrar ficha
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
