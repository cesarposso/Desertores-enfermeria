import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react'
import { EstadoPanelProvider } from './context/EstadoPanelContext'
import {
  BarraSuperiorIslas,
  DockFlotanteDesktop,
  DockMovilInferior,
  ModalAvisoMetodologico,
} from './components/NavegacionIslas'
import Resumen from './pages/Resumen'
import AlumnosEnRiesgo from './pages/AlumnosEnRiesgo'
import Materias from './pages/Materias'
import Modelos from './pages/Modelos'
import Simulador from './pages/Simulador'

export default function App() {
  const location = useLocation()
  const reducirMovimiento = useReducedMotion()

  return (
    <MotionConfig reducedMotion="user">
      <EstadoPanelProvider>
        <div className="flex min-h-dvh flex-col bg-[#F4F4F5] font-sans text-unipamplona-texto dark:bg-[#0E0E10] dark:text-zinc-100">
          {/* Filete superior institucional Universidad de Pamplona (#AD3333 + #EBB21C) */}
          <div
            className="h-1 w-full bg-unipamplona-rojo border-b border-unipamplona-dorado shrink-0"
            aria-hidden="true"
          />

          {/* Barra superior de islas a ancho completo */}
          <BarraSuperiorIslas />

          {/* Dock flotante oscuro vertical (escritorio md+) */}
          <DockFlotanteDesktop />

          {/* Contenido principal a ancho completo con margen izquierdo reservado para el dock */}
          <main className="w-full flex-1 px-4 pt-5 pb-28 md:pl-[88px] md:pr-6 lg:pl-[96px] lg:pr-8 md:pb-12">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={
                  reducirMovimiento ? { opacity: 0, scale: 1 } : { opacity: 0, scale: 0.96 }
                }
                animate={{ opacity: 1, scale: 1 }}
                exit={
                  reducirMovimiento ? { opacity: 0, scale: 1 } : { opacity: 0, scale: 0.96 }
                }
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <Routes location={location}>
                  <Route path="/resumen" element={<Resumen />} />
                  <Route path="/alumnos" element={<AlumnosEnRiesgo />} />
                  <Route path="/materias" element={<Materias />} />
                  <Route path="/modelos" element={<Modelos />} />
                  <Route path="/simulador" element={<Simulador />} />
                  <Route path="*" element={<Navigate replace to="/resumen" />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Dock inferior flotante en móvil (< md) */}
          <DockMovilInferior />

          {/* Diálogo de contexto metodológico y ético */}
          <ModalAvisoMetodologico />
        </div>
      </EstadoPanelProvider>
    </MotionConfig>
  )
}
