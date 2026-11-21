import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import {
  obtenerEstudiantesRiesgo,
  actualizarTutoria,
  nivelRiesgoClase,
  nivelRiesgoEtiqueta,
} from '../api/cliente'
import type { EstudianteRiesgo } from '../api/cliente'
import CargandoSpinner from '../components/CargandoSpinner'
import ErrorCartel from '../components/ErrorCartel'
import AvisoEtico from '../components/AvisoEtico'
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
} from 'lucide-react'

const FILAS_POR_PAGINA = 25

export default function AlumnosEnRiesgo() {
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [todosEstudiantes, setTodosEstudiantes] = useState<EstudianteRiesgo[]>([])

  // Filtros
  const [filtroAsignatura, setFiltroAsignatura] = useState<string>('')
  const [filtroNivel, setFiltroNivel] = useState<string>('')
  const [filtroTutoria, setFiltroTutoria] = useState<string>('')

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)

  // Drawer de Tutoría
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<EstudianteRiesgo | null>(null)
  const [fechaTutoria, setFechaTutoria] = useState<string>('')
  const [guardandoTutoria, setGuardandoTutoria] = useState(false)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)

  // Referencias de accesibilidad para focus trap y retorno de foco
  const botonActivadorRef = useRef<HTMLElement | null>(null)
  const drawerRef = useRef<HTMLDivElement | null>(null)
  const botonCerrarRef = useRef<HTMLButtonElement | null>(null)

  const cargarEstudiantes = async () => {
    try {
      setCargando(true)
      setError(null)
      const data = await obtenerEstudiantesRiesgo()
      // Orden por defecto: mayor a menor probabilidad de riesgo
      const ordenados = [...data].sort((a, b) => b.probabilidad_riesgo - a.probabilidad_riesgo)
      setTodosEstudiantes(ordenados)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con el servidor'
      setError(msg)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarEstudiantes()
  }, [])

  // Lista de asignaturas extraída dinámicamente de los datos sintéticos de la API
  const asignaturasDisponibles = useMemo(() => {
    const setAsig = new Set<string>()
    todosEstudiantes.forEach((e) => {
      if (e.asignatura) setAsig.add(e.asignatura)
    })
    return Array.from(setAsig).sort()
  }, [todosEstudiantes])

  // Filtrado de estudiantes
  const estudiantesFiltrados = useMemo(() => {
    return todosEstudiantes.filter((e) => {
      if (filtroAsignatura && e.asignatura !== filtroAsignatura) return false
      if (filtroNivel && e.nivel_riesgo !== filtroNivel) return false
      if (filtroTutoria && e.estado_tutoria !== filtroTutoria) return false
      return true
    })
  }, [todosEstudiantes, filtroAsignatura, filtroNivel, filtroTutoria])

  // Reset de página al cambiar cualquier filtro
  useEffect(() => {
    setPaginaActual(1)
  }, [filtroAsignatura, filtroNivel, filtroTutoria])

  // Cálculo de paginación
  const totalFiltrados = estudiantesFiltrados.length
  const totalPaginas = Math.ceil(totalFiltrados / FILAS_POR_PAGINA) || 1
  const indiceInicio = (paginaActual - 1) * FILAS_POR_PAGINA
  const indiceFin = Math.min(indiceInicio + FILAS_POR_PAGINA, totalFiltrados)
  const estudiantesPaginados = useMemo(() => {
    return estudiantesFiltrados.slice(indiceInicio, indiceFin)
  }, [estudiantesFiltrados, indiceInicio, indiceFin])

  // Abrir Drawer con Foco
  const abrirDrawer = (estudiante: EstudianteRiesgo, e?: React.MouseEvent) => {
    if (e) {
      botonActivadorRef.current = e.currentTarget as HTMLElement
    } else {
      botonActivadorRef.current = document.activeElement as HTMLElement
    }
    setEstudianteSeleccionado(estudiante)
    setFechaTutoria(estudiante.fecha_tutoria || new Date().toISOString().split('T')[0])
    setMensajeExito(null)
    setDrawerAbierto(true)
  }

  // Cerrar Drawer y devolver foco
  const cerrarDrawer = useCallback(() => {
    setDrawerAbierto(false)
    setEstudianteSeleccionado(null)
    setMensajeExito(null)
    setTimeout(() => {
      botonActivadorRef.current?.focus()
    }, 50)
  }, [])

  // Trampa de foco (Focus Trap) y tecla Escape
  useEffect(() => {
    if (!drawerAbierto) return

    const elementoActual = drawerRef.current
    if (!elementoActual) return

    setTimeout(() => {
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
      document.removeEventListener('keydown', manejarKeyDown)
    }
  }, [drawerAbierto, cerrarDrawer])

  // Guardar citación a tutoría vía PATCH
  const handleGuardarTutoria = async () => {
    if (!estudianteSeleccionado) return

    try {
      setGuardandoTutoria(true)
      const actualizado = await actualizarTutoria(estudianteSeleccionado.codigo_estudiante, {
        estado: 'citado',
        fecha: fechaTutoria || undefined,
      })

      // Actualizar estado reactivo sin recargar la página
      setTodosEstudiantes((prev) =>
        prev.map((item) =>
          item.codigo_estudiante === actualizado.codigo_estudiante ? actualizado : item,
        ),
      )
      setEstudianteSeleccionado(actualizado)
      setMensajeExito('Citación formativa agendada y registrada con éxito en los datos sintéticos.')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar la tutoría'
      alert(`No se pudo actualizar: ${msg}`)
    } finally {
      setGuardandoTutoria(false)
    }
  }

  const hayFiltrosActivos = Boolean(filtroAsignatura || filtroNivel || filtroTutoria)

  const limpiarFiltros = () => {
    setFiltroAsignatura('')
    setFiltroNivel('')
    setFiltroTutoria('')
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

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Alumnos en Riesgo</h1>
        <p className="text-sm text-slate-600 mt-1">
          Monitoreo orientador de estudiantes priorizados para citación temprana a tutoría pedagógica · Universidad de Pamplona.
        </p>
      </div>

      {/* Aviso de datos sintéticos SUPERIOR */}
      <AvisoEtico />

      {/* Barra de Filtros */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
            <Filter className="h-4 w-4 text-slate-500" />
            <span>Filtros de Búsqueda</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>
              Mostrando <strong className="tabular-nums text-slate-800">{totalFiltrados}</strong> de{' '}
              <strong className="tabular-nums text-slate-800">{todosEstudiantes.length}</strong> estudiantes
            </span>
            {prioritariosPendientes > 0 && (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 border border-amber-300">
                {prioritariosPendientes} prioritarios pendientes
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Filtro Asignatura */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Asignatura ({asignaturasDisponibles.length})
            </label>
            <select
              value={filtroAsignatura}
              onChange={(e) => setFiltroAsignatura(e.target.value)}
              className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-unipamplona-rojo focus:outline-none focus:ring-1 focus:ring-unipamplona-rojo"
            >
              <option value="">Todas las asignaturas</option>
              {asignaturasDisponibles.map((asig) => (
                <option key={asig} value={asig}>
                  {asig}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Nivel de Riesgo */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nivel de Riesgo</label>
            <select
              value={filtroNivel}
              onChange={(e) => setFiltroNivel(e.target.value)}
              className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-unipamplona-rojo focus:outline-none focus:ring-1 focus:ring-unipamplona-rojo"
            >
              <option value="">Todos los niveles</option>
              <option value="alto">Acompañamiento prioritario</option>
              <option value="medio">Seguimiento preventivo</option>
              <option value="bajo">Situación estable</option>
            </select>
          </div>

          {/* Filtro Estado de Tutoría */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Estado de Tutoría</label>
            <select
              value={filtroTutoria}
              onChange={(e) => setFiltroTutoria(e.target.value)}
              className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-unipamplona-rojo focus:outline-none focus:ring-1 focus:ring-unipamplona-rojo"
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
              onClick={limpiarFiltros}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
            >
              <RotateCcw className="h-3 w-3" />
              Limpiar filtros aplicados
            </button>
          </div>
        )}
      </div>

      {/* Contenido Principal: Tabla en Desktop y Tarjetas en Móvil */}
      {estudiantesFiltrados.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          <Search className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="mt-3 text-base font-semibold text-slate-700">
            Sin resultados de estudiantes
          </h2>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            No se encontraron estudiantes que coincidan con los filtros seleccionados en los datos
            sintéticos.
          </p>
          <button
            onClick={limpiarFiltros}
            className="mt-4 rounded bg-unipamplona-rojo px-4 py-1.5 text-xs font-medium text-white transition hover:bg-unipamplona-rojo-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado"
          >
            Restablecer todos los filtros
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
          {/* VISTA DESKTOP / TABLET (Tabla con cabecera fija) */}
          <div className="hidden md:block overflow-x-auto max-h-[640px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-xs font-semibold text-slate-600 uppercase tracking-wider shadow-2xs">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Código Anónimo
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Asignatura
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    Probabilidad Orientadora
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Factores que más pesan en esta estimación
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    Estado Tutoría
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {estudiantesPaginados.map((est) => (
                  <tr key={est.codigo_estudiante} className="hover:bg-slate-50/80 transition">
                    {/* Código Anónimo */}
                    <td className="px-4 py-3 font-semibold text-slate-800 tabular-nums whitespace-nowrap">
                      {est.codigo_estudiante}
                    </td>

                    {/* Asignatura y Semestre */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{est.asignatura}</p>
                      <p className="text-xs text-slate-500 tabular-nums">Semestre {est.semestre}</p>
                    </td>

                    {/* Probabilidad Orientadora (%) */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums border ${nivelRiesgoClase(
                          est.nivel_riesgo,
                        )}`}
                      >
                        {est.probabilidad_riesgo.toFixed(1)}% · {nivelRiesgoEtiqueta(est.nivel_riesgo)}
                      </span>
                    </td>

                    {/* Factor Principal */}
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-xs">
                      {est.factor_principal}
                    </td>

                    {/* Estado Tutoría */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {est.estado_tutoria === 'citado' ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Citado {est.fecha_tutoria ? `(${est.fecha_tutoria})` : ''}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
                          Pendiente
                        </span>
                      )}
                    </td>

                    {/* Botón Acción con estilo institucional */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => abrirDrawer(est, e)}
                        className={`rounded px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado ${
                          est.estado_tutoria === 'citado'
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                            : 'bg-unipamplona-rojo text-white hover:bg-unipamplona-rojo-dark shadow-2xs'
                        }`}
                      >
                        {est.estado_tutoria === 'citado' ? 'Ver Ficha' : 'Citar a tutoría'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* VISTA MÓVIL (< md: Tarjetas individuales) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {estudiantesPaginados.map((est) => (
              <div key={est.codigo_estudiante} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Estudiante
                    </span>
                    <p className="text-base font-semibold text-slate-800 tabular-nums">
                      {est.codigo_estudiante}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {est.asignatura} · <span className="tabular-nums">Sem. {est.semestre}</span>
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

                <div className="rounded bg-slate-50 p-2 text-xs text-slate-600">
                  <span className="font-medium text-slate-700 block mb-0.5">
                    Factores que más pesan en esta estimación:
                  </span>
                  {est.factor_principal}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    {est.estado_tutoria === 'citado' ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Citado {est.fecha_tutoria ? `(${est.fecha_tutoria})` : ''}</span>
                      </span>
                    ) : (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
                        Pendiente
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => abrirDrawer(est, e)}
                    className="rounded bg-unipamplona-rojo px-3 py-1.5 text-xs font-medium text-white transition hover:bg-unipamplona-rojo-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado shadow-2xs"
                  >
                    {est.estado_tutoria === 'citado' ? 'Ver Ficha' : 'Citar a tutoría'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Barra de Paginación (25 filas) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <div>
              Mostrando <strong className="tabular-nums text-slate-800">{totalFiltrados > 0 ? indiceInicio + 1 : 0}</strong> a{' '}
              <strong className="tabular-nums text-slate-800">{indiceFin}</strong> de{' '}
              <strong className="tabular-nums text-slate-800">{totalFiltrados}</strong> estudiantes
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                aria-label="Página anterior"
                className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Anterior</span>
              </button>

              <span className="tabular-nums font-medium text-slate-700 px-1">
                Pág. {paginaActual} de {totalPaginas}
              </span>

              <button
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual >= totalPaginas}
                aria-label="Página siguiente"
                className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Siguiente</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aviso de datos sintéticos INFERIOR */}
      <AvisoEtico />

      {/* DRAWER LATERAL ACCESIBLE (role="dialog", aria-modal="true", Focus Trap) */}
      {drawerAbierto && estudianteSeleccionado && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            onClick={cerrarDrawer}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Contenedor del Drawer: Pantalla completa en móvil, max-w-md en desktop */}
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-titulo"
            className="relative z-10 flex h-full w-full sm:max-w-md flex-col bg-white shadow-2xl overflow-y-auto"
          >
            {/* Cabecera del Drawer */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-unipamplona-superficie px-5 py-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Ficha de Acompañamiento Formativo
                </span>
                <h2 id="drawer-titulo" className="text-lg font-semibold text-slate-800 tabular-nums">
                  Estudiante {estudianteSeleccionado.codigo_estudiante}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {estudianteSeleccionado.asignatura} · Semestre {estudianteSeleccionado.semestre}
                </p>
              </div>

              <button
                ref={botonCerrarRef}
                onClick={cerrarDrawer}
                aria-label="Cerrar ficha del estudiante"
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cuerpo del Drawer */}
            <div className="flex-1 p-5 space-y-5">
              {/* Aviso de datos sintéticos DENTRO del drawer */}
              <AvisoEtico />

              {/* Probabilidad Orientadora */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Probabilidad Orientadora
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${nivelRiesgoClase(
                      estudianteSeleccionado.nivel_riesgo,
                    )}`}
                  >
                    {nivelRiesgoEtiqueta(estudianteSeleccionado.nivel_riesgo)}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tabular-nums text-slate-900">
                    {estudianteSeleccionado.probabilidad_riesgo.toFixed(1)}%
                  </span>
                  <span className="text-xs text-slate-500">de probabilidad estimada</span>
                </div>

                {/* Barra de progreso visual con colores suaves de alerta */}
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full ${
                      estudianteSeleccionado.nivel_riesgo === 'alto'
                        ? 'bg-amber-600'
                        : estudianteSeleccionado.nivel_riesgo === 'medio'
                        ? 'bg-slate-600'
                        : 'bg-emerald-600'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, estudianteSeleccionado.probabilidad_riesgo),
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Factores que más pesan en esta estimación (Explicabilidad Local) */}
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <TrendingUp className="h-4 w-4 text-slate-700" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Factores que más pesan en esta estimación
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {estudianteSeleccionado.factores_detalle &&
                  estudianteSeleccionado.factores_detalle.length > 0 ? (
                    estudianteSeleccionado.factores_detalle.slice(0, 4).map((f, idx) => (
                      <div
                        key={idx}
                        className="rounded border border-slate-200 bg-white p-3 text-xs space-y-1.5 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium text-slate-800 leading-snug">
                            {f.descripcion}
                          </span>
                          <span className="text-[11px] font-semibold tabular-nums text-slate-600 shrink-0">
                            {f.impacto_pct.toFixed(1)}% peso
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-amber-600 rounded-full"
                            style={{ width: `${Math.min(100, Math.max(5, f.impacto_pct))}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                      {estudianteSeleccionado.factor_principal}
                    </div>
                  )}
                </div>
              </div>

              {/* Sección de Citación a Tutoría */}
              <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Calendar className="h-4 w-4 text-unipamplona-rojo" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Acción de Acompañamiento
                  </h3>
                </div>

                <div className="text-xs text-slate-600">
                  Estado actual:{' '}
                  <strong className="text-slate-800 uppercase">
                    {estudianteSeleccionado.estado_tutoria}
                  </strong>
                  {estudianteSeleccionado.fecha_tutoria && (
                    <span className="block mt-0.5 text-emerald-800 font-medium">
                      Fecha programada:{' '}
                      <strong className="tabular-nums">{estudianteSeleccionado.fecha_tutoria}</strong>
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Fecha de la Sesión (Opcional)
                  </label>
                  <input
                    type="date"
                    value={fechaTutoria}
                    onChange={(e) => setFechaTutoria(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-unipamplona-rojo focus:outline-none focus:ring-1 focus:ring-unipamplona-rojo"
                  />
                </div>

                {mensajeExito && (
                  <div className="rounded bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-900 flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>{mensajeExito}</span>
                  </div>
                )}

                <button
                  onClick={handleGuardarTutoria}
                  disabled={guardandoTutoria}
                  className="w-full rounded bg-unipamplona-rojo py-2 px-4 text-xs font-medium text-white transition hover:bg-unipamplona-rojo-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado disabled:opacity-50 shadow-2xs"
                >
                  {guardandoTutoria
                    ? 'Guardando citación...'
                    : estudianteSeleccionado.estado_tutoria === 'citado'
                    ? 'Reasignar / Actualizar Fecha'
                    : 'Marcar como citado a tutoría'}
                </button>
              </div>
            </div>

            {/* Pie del Drawer */}
            <div className="border-t border-slate-200 bg-unipamplona-superficie px-5 py-3 flex justify-end">
              <button
                onClick={cerrarDrawer}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
