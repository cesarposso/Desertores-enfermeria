/** Aviso ético permanente — siempre visible en el pie del sidebar y en la barra superior. */
export default function AvisoEtico() {
  return (
    <div className="rounded border border-amber-200 bg-amber-50 p-2">
      <p className="text-xs leading-snug text-amber-800">
        <span className="font-semibold">Datos sintéticos.</span> El resultado es una probabilidad
        orientadora, nunca para sancionar ni excluir estudiantes.
      </p>
    </div>
  )
}
