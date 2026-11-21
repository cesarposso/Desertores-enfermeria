export type EscalaVisualizacion = 'sobre5' | 'aporte'

const EPSILON = 1e-9

/**
 * Formatea un número decimal con coma institucional (es-CO).
 * 
 * Regla de precisión para nota 3,0:
 * Si el valor está estrictamente por debajo de 3,0 pero el redondeo a 2 decimales
 * daría '3,00' (por ejemplo 2,996), se formatea a 3 decimales para evitar
 * confusión y no presentar falsamente que se alcanzó la nota aprobatoria.
 */
export function formatearNumero(valor: number, cuidarBorde3 = false): string {
  if (isNaN(valor)) return '—'

  if (cuidarBorde3 && valor < 3.0 - EPSILON && Math.round(valor * 100) / 100 >= 3.0) {
    return valor.toFixed(3).replace('.', ',')
  }

  return valor.toFixed(2).replace('.', ',')
}

/**
 * Formatea el valor máximo según su escala.
 * Si es 5.0, muestra '5,0' (o '5,000' si el valor usó 3 decimales por borde de 3,0).
 */
export function formatearMaximo(maximo: number, usoTresDecimales = false): string {
  if (maximo === 5.0) {
    return usoTresDecimales ? '5,000' : '5,0'
  }
  return maximo.toFixed(2).replace('.', ',')
}

/**
 * Formatea una cifra con su valor y su tope máximo en el formato 'X,XX de Y,YY'.
 * 
 * Ejemplo:
 * - '0,62 de 1,75'
 * - '1,77 de 5,0'
 * - '2,996 de 5,000' (en caso de borde de redondeo)
 */
export function formatearConMaximo(
  valor: number | null,
  maximo: number,
  cuidarBorde3 = false,
): string {
  if (valor === null || isNaN(valor)) {
    return `— de ${formatearMaximo(maximo)}`
  }

  const usoTresDecimales =
    cuidarBorde3 && valor < 3.0 - EPSILON && Math.round(valor * 100) / 100 >= 3.0
  const valStr = formatearNumero(valor, cuidarBorde3)
  const maxStr = formatearMaximo(maximo, usoTresDecimales)

  return `${valStr} de ${maxStr}`
}
