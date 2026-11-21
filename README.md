# Desertores-enfermeria: Panel de Alerta Temprana

> **Proyecto de Semillero de Investigación** — Programa de Enfermería, Universidad de Pamplona.  
> Herramienta pedagógica y preventiva de alerta temprana para identificar a tiempo estudiantes de enfermería en riesgo de abandono y acompañarlos mediante tutorías formativas oportunas.

---

## 📌 Contexto y Propósito

El panel está diseñado para uso de docentes y tutores de Enfermería. Su objetivo es:
1. **Detección preventiva oportuna:** Identificar qué estudiantes presentan una probabilidad orientadora alta de deserción (a nivel de asignatura o programa) para citarlos a tutoría preventiva a tiempo.
2. **Diagnóstico de sobrecarga:** Analizar qué asignaturas del plan de estudios generan mayor carga académica percibida.
3. **Transparencia algorítmica:** Comparar el desempeño de tres modelos de Machine Learning (Regresión Logística, Árbol de Decisión y Bosque Aleatorio) evaluados con validación cruzada estratificada.
4. **Simulador interactivo individual:** Proyectar la probabilidad orientadora de riesgo ajustando variables y desglosando los factores críticos determinantes.

> ⚠️ **Aviso de datos sintéticos y marco ético:**  
> Todos los datos de esta entrega son **sintéticos** y se utilizan exclusivamente con fines de validación metodológica y académica. El resultado es una **probabilidad orientadora de apoyo docente**, jamás para sancionar, calificar negativamente ni excluir estudiantes.

---

## 🔬 Variables de la Propuesta (11 Variables)

| Variable | Tipo | Rango / Valores | Descripción |
| :--- | :---: | :---: | :--- |
| `nota_primer_parcial` | Float | 0.0 - 5.0 | Calificación del primer examen parcial |
| `promedio_acumulado_cortes` | Float | 0.0 - 5.0 | Promedio acumulado de evaluaciones |
| `asistencia_pct` | Float | 0.0% - 100.0% | Porcentaje de asistencia presencial a clases |
| `repitente` | Binario | 0: No, 1: Sí | Condición de repitencia en la asignatura |
| `semestre` | Entero | 1 - 10 | Semestre actual de formación |
| `carga_percibida` | Float | 1.0 - 5.0 | Nivel de sobrecarga académica percibida |
| `horas_estudio_semana` | Float | 0.0 - 60.0 | Horas semanales dedicadas a estudio autónomo |
| `horas_sueno` | Float | 0.0 - 24.0 | Horas promedio diarias de descanso nocturno |
| `apoyo_economico_familiar` | Binario | 0: No, 1: Sí | Disponibilidad de red de apoyo económico y familiar |
| `trabajo_remunerado` | Binario | 0: No, 1: Sí | Actividad laboral remunerada paralela a la carrera |
| `intencion_seguir` | Binario | 0: No / Dudosa, 1: Firme | Motivación e intención de permanencia en enfermería |

---

## 🧪 Metodología de Generación de Datos Sintéticos y Calibración

Para evitar un problema artificialmente trivial (clasificadores con 100% F1 sin casos intermedios), el generador en `backend/train.py` modela la complejidad real del entorno universitario:

1. **Tres perfiles socioacadémicos latentes:**
   - **Estable (~42%):** Factores protectores predominantes (promedio acumulado y parcial $\ge 3.5$, asistencia $\ge 85\%$, soporte familiar, intención firme).
   - **Ambiguo / Seguimiento preventivo (~36%):** Casos limítrofes con señales mixtas (promedios entre $2.8$ y $3.5$, asistencia entre $65\%$ y $80\%$, sobrecarga moderada, coexistencia de estudio y trabajo). Permiten poblar la franja intermedia de prevención docente.
   - **Vulnerable (~22%):** Múltiples factores de alerta concurrentes (bajo rendimiento temprano, repitencia, inasistencia acumulada, falta de soporte socioeconómico).

2. **Interacciones no lineales y factores compuestos:**
   El riesgo de abandono no responde a una suma lineal aislada. Se modelan interacciones críticas pedagógicas:
   - *Repitencia agravada por rendimiento inicial bajo:* Impacto multiplicativo cuando el estudiante repite y su primer parcial no supera 3.0.
   - *Sobrecarga académica con actividad laboral:* Mayor presión cuando la carga percibida es $\ge 4.0$ y el estudiante tiene trabajo remunerado.
   - *Vulnerabilidad socio-vocacional:* Asociación crítica entre ausencia de red de apoyo familiar e indecisión vocacional.
   - *Fatiga acumulada:* Interacción entre sobrecarga extrema y privación de descanso nocturno ($< 6$ horas).

3. **Solapamiento estocástico:**
   Se incorpora una perturbación normal $\epsilon \sim \mathcal{N}(0, 0.75)$ que representa factores humanos no medibles en el sistema (situaciones imprevistas, salud mental, resiliencia individual). La deserción se muestrea estocásticamente $y \sim \text{Bernoulli}(\sigma(z))$, lo que genera solapamiento natural entre clases y evita probabilidades polarizadas exclusivamente en 0% o 100%.

4. **Calibración de umbrales en 3 niveles no alarmistas:**
   - **Acompañamiento prioritario (`alto`, $\ge 60.0\%$):** 82 estudiantes (54.7%). Requiere citación prioritaria a tutoría académica o consejería.
   - **Seguimiento preventivo (`medio`, $35.0\% \le p < 60.0\%$):** 17 estudiantes (11.3%). Población clave en riesgo emergente para talleres de refuerzo y monitoreo formativo.
   - **Situación estable (`bajo`, $< 35.0\%$):** 51 estudiantes (34.0%). Monitoreo docente estándar sin alertas inmediatas.

---

## 🧠 Modelos de Machine Learning y Explicabilidad

Se comparan 3 modelos entrenados con **validación cruzada estratificada ($k=5$)**:
- **Regresión Logística (`LogisticRegression`)**
- **Árbol de Decisión (`DecisionTreeClassifier`)**
- **Bosque Aleatorio (`RandomForestClassifier`)** *(Mejor modelo seleccionado)*

### Cálculo de Factores que más pesan (Interpretabilidad Local)
Para el **Bosque Aleatorio (Random Forest)**, se implementó el método de **Descomposición de Trayectorias de Decisión (Tree Decision Path Attribution)**:
1. Para cada estudiante $x$, el algoritmo inspecciona la ruta de nodos visitados en cada árbol del bosque (`decision_path`).
2. En cada nodo padre $p$ con división sobre la variable $j$, se calcula la variación en la probabilidad predicha de riesgo:
   $$\Delta P_j = P(\text{hijo}) - P(\text{padre})$$
3. La contribución local neta $\Phi_j(x)$ es el promedio a lo largo de todos los árboles del bosque.
4. Cumple la propiedad aditiva: $\sum_j \Phi_j(x) = P(\text{riesgo} \mid x) - P_{\text{base}}$.
5. Se seleccionan los 3 o 4 factores con mayor aporte positivo al riesgo y se traducen en lenguaje empático de acompañamiento docente (ej. *"Nota de primer parcial baja (1.8 / 5.0): +18.2% de riesgo"*).

---

## 🚀 Arquitectura y Endpoints de la API (FastAPI)

El backend expone 5 endpoints principales:

- `GET /api/estudiantes/riesgo`: Retorna los 150 estudiantes priorizados de mayor a menor probabilidad orientadora, con filtros opcionales por `asignatura`, `nivel_riesgo` (`alto`, `medio`, `bajo`) y `estado_tutoria` (`pendiente`, `citado`).
- `PATCH /api/estudiantes/{codigo}/tutoria`: Actualiza el estado (`pendiente` o `citado`) y fecha de citación a tutoría en SQLite desde el drawer lateral del panel.
- `GET /api/materias/carga`: Retorna la sobrecarga académica promedio y tasas de riesgo por asignatura de enfermería.
- `GET /api/modelo/metricas`: Retorna la comparación de métricas ($k=5$ CV) de los 3 modelos.
- `POST /api/predecir`: Simulador individual interactivo que recibe las 11 variables y retorna la probabilidad estimada con el desglose de factores críticos.

---

## 💻 Instrucciones de Instalación y Ejecución

### 1. Requisitos
- Python 3.10+ (probado en Python 3.14).

### 2. Instalar dependencias
```bash
pip install -r backend/requirements.txt
```

### 3. Generar dataset sintético y entrenar modelos
```bash
python backend/train.py
```
*Genera los artefactos en `backend/data/`: `dataset_sintetico.csv`, `metricas_modelos.json`, `mejor_modelo.joblib`, `carga_materias.json` y la base de datos `database.sqlite`.*

### 4. Iniciar el servidor API
```bash
uvicorn backend.main:app --reload --port 8000
```
La documentación interactiva Swagger estará disponible en:
`http://localhost:8000/docs`

### 5. Ejecutar la suite de pruebas automatizadas
```bash
python -m pytest tests/ -v
```
*(13 pruebas unitarias e integrales cubriendo dependencias, generación de datos, modelos, base de datos SQLite, esquemas Pydantic y endpoints FastAPI).*

---

## 🖥️ Frontend

### Requisitos

- **Node.js** ≥ 20.19 (`node --version`)
- **pnpm** ≥ 9 (`pnpm --version`)

### Iniciar el panel web

```bash
# 1. Iniciar el backend primero (en una terminal aparte)
uvicorn backend.main:app --reload --port 8000

# 2. Iniciar el servidor de desarrollo del frontend
cd frontend
pnpm install      # solo la primera vez
pnpm run dev
```

Abre **http://localhost:5173** en el navegador.

### Estructura del frontend

```
frontend/src/
├── api/cliente.ts        # Tipos TS + funciones fetch a los 5 endpoints
├── components/
│   ├── Sidebar.tsx       # Sidebar (md+) + TopbarMobile (< md)
│   ├── AvisoEtico.tsx    # Aviso de datos sintéticos — siempre visible
│   ├── CargandoSpinner.tsx
│   └── ErrorCartel.tsx
└── pages/                # 5 secciones: Resumen, Alumnos, Materias, Modelos, Simulador
```

### Colores de riesgo (sin rojos)

| Nivel | Color | Clase |
|---|---|---|
| Alto | Ámbar (#b45309) | `text-riesgo-alto bg-amber-50` |
| Medio | Pizarra (#475569) | `text-riesgo-medio bg-slate-100` |
| Bajo | Esmeralda (#059669) | `text-riesgo-bajo bg-emerald-50` |

> ⚠️ Los datos son sintéticos. El resultado es una probabilidad orientadora, nunca para sancionar ni excluir estudiantes.
