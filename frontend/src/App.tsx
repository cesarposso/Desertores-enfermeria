import { Routes, Route, Navigate } from 'react-router-dom'
import { SidebarDesktop, TopbarMobile } from './components/Sidebar'
import Resumen from './pages/Resumen'
import AlumnosEnRiesgo from './pages/AlumnosEnRiesgo'
import Materias from './pages/Materias'
import Modelos from './pages/Modelos'
import Simulador from './pages/Simulador'

export default function App() {
  return (
    <div className="flex h-screen flex-col bg-slate-50 font-sans md:flex-row">
      {/* Sidebar — visible solo en md+ */}
      <SidebarDesktop />

      {/* Layout de contenido — ocupa el resto */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Barra superior con menú — visible solo en móvil */}
        <TopbarMobile />

        {/* Área de contenido principal */}
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/resumen" element={<Resumen />} />
            <Route path="/alumnos" element={<AlumnosEnRiesgo />} />
            <Route path="/materias" element={<Materias />} />
            <Route path="/modelos" element={<Modelos />} />
            <Route path="/simulador" element={<Simulador />} />
            {/* Redirige cualquier ruta desconocida */}
            <Route path="*" element={<Navigate replace to="/resumen" />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
