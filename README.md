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
