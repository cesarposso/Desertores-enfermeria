import { Routes, Route, Navigate } from 'react-router-dom'
import { SidebarDesktop, TopbarMobile } from './components/Sidebar'
import Resumen from './pages/Resumen'
import AlumnosEnRiesgo from './pages/AlumnosEnRiesgo'
import Materias from './pages/Materias'
import Modelos from './pages/Modelos'
import Simulador from './pages/Simulador'

export default function App() {
  return (
    <div className="flex h-screen flex-col bg-white font-sans">
      {/* Barra superior delgada institucional Universidad de Pamplona (#AD3333 + filete dorado #EBB21C) */}
      <div
        className="h-1.5 w-full bg-unipamplona-rojo border-b border-unipamplona-dorado shrink-0"
        aria-hidden="true"
      />

      {/* Contenedor principal con sidebar y contenido */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Sidebar — visible en md+ */}
        <SidebarDesktop />

        {/* Layout de contenido principal */}
        <div className="flex flex-1 flex-col overflow-hidden bg-slate-50">
          {/* Barra superior con menú — visible solo en móvil */}
          <TopbarMobile />

          {/* Área de rutas */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <Routes>
              <Route path="/resumen" element={<Resumen />} />
              <Route path="/alumnos" element={<AlumnosEnRiesgo />} />
              <Route path="/materias" element={<Materias />} />
              <Route path="/modelos" element={<Modelos />} />
              <Route path="/simulador" element={<Simulador />} />
              {/* Redirección por defecto */}
              <Route path="*" element={<Navigate replace to="/resumen" />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  )
}
