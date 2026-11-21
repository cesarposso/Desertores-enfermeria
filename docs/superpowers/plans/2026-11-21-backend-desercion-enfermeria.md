# Backend de Alerta Temprana en Deserción (Enfermería) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el pipeline de Machine Learning y la API REST en FastAPI con SQLite para alimentar el panel de alerta temprana de deserción en Enfermería (Universidad de Pamplona), entrenando tres modelos (Regresión Logística, Árbol de Decisión y Random Forest) con validación cruzada estratificada sobre un dataset sintético de 150 matrículas utilizando las 11 variables exactas de la propuesta de investigación y descomposición de trayectorias para la interpretabilidad local.

**Architecture:** Módulo de generación de datos, entrenamiento y explicabilidad (`backend/train.py` y `backend/explainability.py`) que genera 150 registros sintéticos de estudiantes de enfermería, ejecuta validación cruzada estratificada sobre 3 modelos de scikit-learn y guarda el mejor modelo (`mejor_modelo.joblib`), métricas comparativas (`metricas_modelos.json`) y datos de carga (`carga_materias.json`) en `backend/data/`. Base de datos SQLite (`backend/data/database.sqlite`) para persistir estudiantes anonimizados, sus probabilidades y el estado de citación a tutoría (Pendiente / Citado). Servicio FastAPI (`backend/main.py`) que expone los endpoints de estudiantes en riesgo, carga por materia, métricas de modelos, simulación predictiva y actualización de tutoría.

**Tech Stack:** Python 3, FastAPI, Uvicorn, scikit-learn, pandas, numpy, joblib, SQLite3, Pydantic v2, Pytest, HTTPX.

**Spec:** [PRODUCT.md](file:///C:/Users/slend/OneDrive/Documentos/desertores%20enfermeria/Desertores-enfermeria/PRODUCT.md) y [.impeccable/surfaces/panel-alertas.md](file:///C:/Users/slend/OneDrive/Documentos/desertores%20enfermeria/Desertores-enfermeria/.impeccable/surfaces/panel-alertas.md).

## Global Constraints

- **Dataset sintético:** Exactamente 150 registros de matrícula con las 11 variables exactas de la propuesta (sin créditos ni estrato):
  1. `nota_primer_parcial`: float (0.0 a 5.0)
  2. `promedio_acumulado_cortes`: float (0.0 a 5.0)
  3. `asistencia_pct`: float (0.0 a 100.0)
  4. `repitente`: int (0: No, 1: Sí)
  5. `semestre`: int (1 a 10)
  6. `carga_percibida`: float / int (1.0 a 5.0)
  7. `horas_estudio_semana`: float (0.0 a 40.0)
  8. `horas_sueno`: float (3.0 a 12.0)
  9. `apoyo_economico_familiar`: int (0: No, 1: Sí)
  10. `trabajo_remunerado`: int (0: No, 1: Sí)
  11. `intencion_seguir`: int (0: No / Dudosa, 1: Firme / Sí)
- **Modelos a comparar:** Regresión Logística (`LogisticRegression`), Árbol de Decisión (`DecisionTreeClassifier`), Bosque Aleatorio (`RandomForestClassifier`).
- **Validación cruzada estratificada:** $k=5$ pliegues (`StratifiedKFold(n_splits=5, shuffle=True, random_state=42)`).
- **Métricas a reportar:** Accuracy, F1-Score, Precision, Recall y ROC-AUC (media y desviación estándar).
- **Cálculo de factores determinantes individuales (Interpretabilidad Local):**
  - **Si el mejor modelo es Bosque Aleatorio (Random Forest) o Árbol de Decisión:**
    Se utiliza **Descomposición de Trayectorias de Decisión (Tree Decision Path Attribution)**.
    Para cada estudiante $x$, el algoritmo inspecciona la ruta de nodos visitados en cada uno de los $T$ árboles del bosque mediante `decision_path(X)`.
    En cada nodo padre $p$ con división sobre la variable $j$, el salto hacia el nodo hijo $c$ genera una variación en la probabilidad de riesgo predicha:
    $$\Delta P_j = P(\text{nodo hijo } c) - P(\text{nodo padre } p)$$
    donde $P(n) = \frac{\text{conteo\_clase\_riesgo}(n)}{\text{total\_muestras}(n)}$.
    La contribución local neta de la variable $j$ para el estudiante $x$ es el promedio a lo largo de todos los árboles del bosque:
    $$\Phi_j(x) = \frac{1}{T} \sum_{t=1}^T \sum_{p \in \text{path}_t(x) \land \text{split}(p)=j} \left( P(\text{child}_t(p, x)) - P(p) \right)$$
    Cumple con la propiedad aditiva: $\sum_j \Phi_j(x) = P(\text{riesgo} \mid x) - P_{\text{base}}$.
    Los factores con valor $\Phi_j(x) > 0$ son los que empujan el riesgo hacia arriba. Se ordenan de mayor a menor contribución y se seleccionan los 3 o 4 factores con mayor impacto positivo, formateados con lenguaje empático de acompañamiento (ej. *"Nota de primer parcial (1.8): aporta +18.2% al riesgo"*, *"Baja asistencia (58%): aporta +14.5% al riesgo"*, *"Sin apoyo económico/familiar: aporta +9.1% al riesgo"*).
  - **Si el mejor modelo es Regresión Logística:**
    Se calcula la contribución marginal al logit: $\beta_j \cdot \frac{x_j - \bar{x}_j}{\sigma_j} \cdot P(1-P)$, seleccionando las variables con mayor aporte positivo al riesgo relativo frente a la cohorte.
- **Endpoints obligatorios:**
  - `GET /api/estudiantes/riesgo` (filtros opcionales por asignatura, nivel de riesgo y estado de tutoría).
  - `GET /api/materias/carga` (resumen de carga académica percibida por asignatura).
  - `GET /api/modelo/metricas` (métricas de validación cruzada estratificada de los 3 modelos).
  - `POST /api/predecir` (simulador individual de riesgo con factores locales calculados por descomposición).
  - `PATCH /api/estudiantes/{codigo}/tutoria` (actualización de estado Pendiente / Citado y fecha opcional en SQLite).
- **Anonimización estricta:** Estudiantes identificados por código (`ENF-001` a `ENF-150`), sin nombres reales.
- **Aviso ético:** La API debe incluir en sus respuestas metadata clara indicando que son datos sintéticos y de uso pedagógico-preventivo no punitivo.

## Review Focus

1. **Interpretabilidad aditiva en Random Forest:** Asegurar que la función `explicar_prediccion_rf` verifique que la suma de contribuciones locales coincida con la diferencia entre la probabilidad predicha y la probabilidad base de entrenamiento.
2. **Validación estricta de variables en `/api/predecir`:** Validar que ninguna nota exceda 5.0 ni sea inferior a 0.0, asistencia entre 0-100%, semestres 1 a 10 y binarias exclusivamente 0 o 1, retornando `422 Unprocessable Entity` en caso contrario.
3. **Persistencia concurrente de SQLite:** Manejar conexiones con `check_same_thread=False` y transacciones seguras para evitar bloqueos durante actualizaciones simultáneas desde el drawer lateral.
4. **Ordenamiento y filtros en `/api/estudiantes/riesgo`:** Retornar los estudiantes ordenados descendentemente por probabilidad orientadora, garantizando desempate por código de estudiante.
5. **Autorecuperación en primer arranque:** Si la base de datos o los artefactos `.joblib`/`.json` no existen en `backend/data/`, el servicio debe autogenerarlos invocando `backend/train.py` para asegurar disponibilidad inmediata.

---

### Task 1: Environment Setup & Project Structure

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/__init__.py`
- Create: `backend/data/.gitkeep`
- Test: `tests/test_env.py`

**Interfaces:**
- Consumes: Python 3
- Produces: Base directory layout and package requirements for FastAPI, scikit-learn, pandas, joblib, pytest.

- [ ] **Step 1: Write failing test verifying required dependencies import cleanly**

```python
# tests/test_env.py
def test_dependencies_importable():
    import fastapi
    import pydantic
    import sklearn
    import pandas
    import joblib
    import pytest
    assert fastapi.__version__ is not None
```

- [ ] **Step 2: Run test to verify it fails if dependencies are missing**

Run: `pytest tests/test_env.py -v`
Expected: FAIL if dependencies not installed.

- [ ] **Step 3: Create `backend/requirements.txt` and install dependencies**

Include:
```text
fastapi>=0.110.0
uvicorn>=0.28.0
scikit-learn>=1.4.0
pandas>=2.2.0
numpy>=1.26.0
joblib>=1.3.2
pydantic>=2.6.0
httpx>=0.27.0
pytest>=8.0.0
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_env.py -v`
Expected: PASS

- [ ] **Step 5: Commit task**

```bash
git add backend/ requirements.txt tests/test_env.py
git commit -m "chore: setup backend project structure and requirements"
```

---

### Task 2: Synthetic Dataset Generation, Training & Tree-Path Explainability (`backend/train.py` & `backend/explainability.py`)

**Files:**
- Create: `backend/explainability.py`
- Create: `backend/train.py`
- Test: `tests/test_train.py`
- Produces:
  - `backend/data/dataset_sintetico.csv` (150 registros con las 11 variables)
  - `backend/data/metricas_modelos.json` (CV estratificada de los 3 modelos)
  - `backend/data/mejor_modelo.joblib` (modelo óptimo serializado + scaler + feature names + baseline prob)
  - `backend/data/carga_materias.json` (carga percibida por asignatura)

**Interfaces:**
- Consumes: `pandas`, `numpy`, `scikit-learn`, `joblib`.
- Produces:
  - `generar_dataset_sintetico(n=150, seed=42) -> pd.DataFrame`
  - `calcular_explicabilidad_local(modelo, X_sample, feature_names, base_prob) -> list[dict]`
  - `entrenar_y_evaluar_modelos(df: pd.DataFrame, output_dir: str) -> dict`

- [ ] **Step 1: Write failing test for dataset with exact 11 variables and tree-path explainability**

```python
# tests/test_train.py
import os
import json
import joblib
import pandas as pd
from backend.train import generar_dataset_sintetico, entrenar_y_evaluar_modelos
from backend.explainability import calcular_explicabilidad_local

def test_generar_dataset_sintetico_variables_exactas():
    df = generar_dataset_sintetico(n=150, seed=42)
    assert len(df) == 150
    # Must have the 11 exact variables
    variables_esperadas = [
        "nota_primer_parcial", "promedio_acumulado_cortes", "asistencia_pct",
        "repitente", "semestre", "carga_percibida", "horas_estudio_semana",
        "horas_sueno", "apoyo_economico_familiar", "trabajo_remunerado",
        "intencion_seguir"
    ]
    for var in variables_esperadas:
        assert var in df.columns, f"Variable {var} no encontrada en dataset"
    
    # Must NOT have creditos or estrato
    assert "creditos" not in df.columns
    assert "carga_creditos" not in df.columns
    assert "estrato" not in df.columns
    assert "estrato_socioeconomico" not in df.columns

def test_tree_path_explainability(tmp_path):
    df = generar_dataset_sintetico(n=150, seed=42)
    res = entrenar_y_evaluar_modelos(df, output_dir=str(tmp_path))
    modelo_bundle = joblib.load(tmp_path / "mejor_modelo.joblib")
    
    # Explain first student
    sample = df.iloc[0:1]
    explicacion = calcular_explicabilidad_local(
        modelo_bundle["model"],
        sample[modelo_bundle["feature_names"]],
        modelo_bundle["feature_names"],
        modelo_bundle.get("base_prob", 0.5)
    )
    assert isinstance(explicacion, list)
    assert len(explicacion) >= 3
    assert "factor" in explicacion[0]
    assert "impacto_pct" in explicacion[0]
    assert "descripcion" in explicacion[0]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_train.py -v`
Expected: FAIL

- [ ] **Step 3: Implement `backend/explainability.py` and `backend/train.py`**

- In `backend/explainability.py`:
  - Implement Tree-Path Attribution using `decision_path` on each estimator of `RandomForestClassifier` and `DecisionTreeClassifier`.
  - Calculate $\Delta P$ from parent node to child node for each split on variable $j$.
  - Average over trees and return sorted positive risk drivers with pedagogical copy.
  - Implement fallback for `LogisticRegression` via marginal standardized logit contributions.
- In `backend/train.py`:
  - Synthetic data generator: 150 records, asignaturas de enfermería (*Anatomía Humana*, *Farmacología Clínica*, *Bioquímica Médica*, *Cuidado Básico de Enfermería*, *Fisiología Humana*, *Microbiología*).
  - 11 exact variables with coherent correlation to risk of attrition.
  - Stratified 5-Fold CV on `LogisticRegression`, `DecisionTreeClassifier`, `RandomForestClassifier`.
  - Save `mejor_modelo.joblib`, `metricas_modelos.json`, `dataset_sintetico.csv`, `carga_materias.json`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_train.py -v`
Expected: PASS

- [ ] **Step 5: Run `python backend/train.py` to compile real assets in `backend/data/`**

Run: `python backend/train.py`
Verify presence and integrity of generated files in `backend/data/`.

- [ ] **Step 6: Commit task**

```bash
git add backend/train.py backend/explainability.py tests/test_train.py backend/data/
git commit -m "feat: implement synthetic dataset generation, training pipeline and tree-path explainability"
```

---

### Task 3: SQLite Database & Student Repository (`backend/db.py`)

**Files:**
- Create: `backend/db.py`
- Test: `tests/test_db.py`

**Interfaces:**
- Consumes: `sqlite3`, `backend/data/dataset_sintetico.csv`, `backend/data/mejor_modelo.joblib`.
- Produces:
  - `init_db(db_path: str, dataset_path: str, model_bundle_path: str) -> None`
  - `get_estudiantes_riesgo(db_path: str, asignatura: str = None, nivel_riesgo: str = None, estado_tutoria: str = None) -> list[dict]`
  - `actualizar_tutoria(db_path: str, codigo: str, estado: str, fecha: str = None) -> dict | None`

- [ ] **Step 1: Write failing test for SQLite schema and seed**

```python
# tests/test_db.py
import json
from backend.db import init_db, get_estudiantes_riesgo, actualizar_tutoria

def test_sqlite_db_lifecycle(tmp_path):
    db_path = str(tmp_path / "test.sqlite")
    records = [{
        "codigo_estudiante": "ENF-001",
        "asignatura": "Farmacología Clínica",
        "semestre": 3,
        "probabilidad_riesgo": 82.4,
        "nivel_riesgo": "alto",
        "factor_principal": "Nota primer parcial baja (1.9)",
        "factores_detalle": json.dumps([
            {"factor": "nota_primer_parcial", "impacto_pct": 18.2, "descripcion": "Nota primer parcial baja (1.9)"},
            {"factor": "asistencia_pct", "impacto_pct": 14.1, "descripcion": "Baja asistencia a clases (62%)"},
            {"factor": "apoyo_economico_familiar", "impacto_pct": 9.5, "descripcion": "Sin apoyo económico/familiar"}
        ]),
        "estado_tutoria": "pendiente",
        "fecha_tutoria": None
    }]
    init_db(db_path=db_path, seed_records=records)
    
    rows = get_estudiantes_riesgo(db_path)
    assert len(rows) == 1
    assert rows[0]["codigo_estudiante"] == "ENF-001"
    
    # Update tutoria
    updated = actualizar_tutoria(db_path, "ENF-001", "citado", "2026-11-28")
    assert updated["estado_tutoria"] == "citado"
    assert updated["fecha_tutoria"] == "2026-11-28"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_db.py -v`
Expected: FAIL

- [ ] **Step 3: Implement `backend/db.py`**

- Schema for `estudiantes_riesgo`:
  - `codigo_estudiante TEXT PRIMARY KEY`
  - `asignatura TEXT NOT NULL`
  - `semestre INTEGER NOT NULL`
  - `probabilidad_riesgo REAL NOT NULL`
  - `nivel_riesgo TEXT NOT NULL`
  - `factor_principal TEXT NOT NULL`
  - `factores_detalle TEXT NOT NULL`
  - `estado_tutoria TEXT NOT NULL DEFAULT 'pendiente'`
  - `fecha_tutoria TEXT`
  - `actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- Order queries by `probabilidad_riesgo DESC, codigo_estudiante ASC`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_db.py -v`
Expected: PASS

- [ ] **Step 5: Commit task**

```bash
git add backend/db.py tests/test_db.py
git commit -m "feat: implement SQLite schema and student repository"
```

---

### Task 4: Pydantic Domain Schemas (`backend/schemas.py`)

**Files:**
- Create: `backend/schemas.py`
- Test: `tests/test_schemas.py`

**Interfaces:**
- Produces Pydantic v2 schemas:
  - `SimuladorInputRequest` (with exact 11 variables)
  - `SimuladorOutputResponse`
  - `EstudianteRiesgoResponse`
  - `ActualizarTutoriaRequest`
  - `MateriaCargaResponse`
  - `MetricasModelosResponse`

- [ ] **Step 1: Write failing test validating the 11 variables and range bounds**

```python
# tests/test_schemas.py
import pytest
from pydantic import ValidationError
from backend.schemas import SimuladorInputRequest

def test_simulador_input_exact_variables():
    valid = SimuladorInputRequest(
        asignatura="Farmacología Clínica",
        nota_primer_parcial=2.4,
        promedio_acumulado_cortes=2.8,
        asistencia_pct=75.0,
        repitente=0,
        semestre=4,
        carga_percibida=4.2,
        horas_estudio_semana=8.0,
        horas_sueno=6.0,
        apoyo_economico_familiar=1,
        trabajo_remunerado=0,
        intencion_seguir=1
    )
    assert valid.nota_primer_parcial == 2.4

def test_simulador_input_invalid_values():
    with pytest.raises(ValidationError):
        # nota_primer_parcial > 5.0
        SimuladorInputRequest(
            asignatura="Bioquímica Médica",
            nota_primer_parcial=5.5,
            promedio_acumulado_cortes=3.0,
            asistencia_pct=80.0,
            repitente=0,
            semestre=2,
            carga_percibida=3.0,
            horas_estudio_semana=10.0,
            horas_sueno=7.0,
            apoyo_economico_familiar=1,
            trabajo_remunerado=0,
            intencion_seguir=1
        )
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_schemas.py -v`
Expected: FAIL

- [ ] **Step 3: Implement domain schemas in `backend/schemas.py`**

- Enforce field bounds:
  - `nota_primer_parcial`: `ge=0.0, le=5.0`
  - `promedio_acumulado_cortes`: `ge=0.0, le=5.0`
  - `asistencia_pct`: `ge=0.0, le=100.0`
  - `repitente`: `ge=0, le=1`
  - `semestre`: `ge=1, le=10`
  - `carga_percibida`: `ge=1.0, le=5.0`
  - `horas_estudio_semana`: `ge=0.0, le=60.0`
  - `horas_sueno`: `ge=0.0, le=24.0`
  - `apoyo_economico_familiar`: `ge=0, le=1`
  - `trabajo_remunerado`: `ge=0, le=1`
  - `intencion_seguir`: `ge=0, le=1`

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_schemas.py -v`
Expected: PASS

- [ ] **Step 5: Commit task**

```bash
git add backend/schemas.py tests/test_schemas.py
git commit -m "feat: implement Pydantic validation schemas with exact 11 proposal variables"
```

---

### Task 5: FastAPI Application & Endpoints (`backend/main.py`)

**Files:**
- Create: `backend/main.py`
- Test: `tests/test_api.py`

**Interfaces:**
- Consumes: `backend.db`, `backend.schemas`, `backend.explainability`, `joblib`, `backend/data/`
- Produces: FastAPI app with 5 core endpoints.

- [ ] **Step 1: Write failing test verifying API endpoints with TestClient**

```python
# tests/test_api.py
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_get_estudiantes_riesgo_schema():
    resp = client.get("/api/estudiantes/riesgo")
    assert resp.status_code == 200
    data = resp.json()
    assert data["datos_sinteticos"] is True
    assert "estudiantes" in data
    assert len(data["estudiantes"]) > 0
    # Must be sorted desc
    probs = [e["probabilidad_riesgo"] for e in data["estudiantes"]]
    assert probs == sorted(probs, reverse=True)

def test_post_predecir_simulator_tree_path():
    payload = {
        "asignatura": "Farmacología Clínica",
        "nota_primer_parcial": 2.1,
        "promedio_acumulado_cortes": 2.5,
        "asistencia_pct": 60.0,
        "repitente": 1,
        "semestre": 3,
        "carga_percibida": 4.5,
        "horas_estudio_semana": 5.0,
        "horas_sueno": 5.0,
        "apoyo_economico_familiar": 0,
        "trabajo_remunerado": 1,
        "intencion_seguir": 0
    }
    resp = client.post("/api/predecir", json=payload)
    assert resp.status_code == 200
    res = resp.json()
    assert "probabilidad_riesgo" in res
    assert "nivel_riesgo" in res
    assert "factores_criticos" in res
    assert len(res["factores_criticos"]) >= 3

def test_patch_estudiante_tutoria():
    resp = client.patch(
        "/api/estudiantes/ENF-001/tutoria",
        json={"estado": "citado", "fecha": "2026-11-29"}
    )
    assert resp.status_code == 200
    assert resp.json()["estado_tutoria"] == "citado"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_api.py -v`
Expected: FAIL

- [ ] **Step 3: Implement `backend/main.py`**

- On startup (lifespan): check if database exists; if not, seed with 150 students using `backend/train.py` artifacts.
- CORS middleware enabled.
- `GET /api/estudiantes/riesgo`: Filter by `asignatura`, `nivel_riesgo`, `estado_tutoria`. Return sorted list.
- `PATCH /api/estudiantes/{codigo}/tutoria`: Update status & date in SQLite.
- `GET /api/materias/carga`: Return perceived subject load summary from `carga_materias.json`.
- `GET /api/modelo/metricas`: Return stratified CV metrics for the 3 models.
- `POST /api/predecir`: Receive the 11 variables, compute risk probability with `mejor_modelo.joblib`, compute tree-path local explainability, and return factors.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_api.py -v`
Expected: PASS

- [ ] **Step 5: Commit task**

```bash
git add backend/main.py tests/test_api.py
git commit -m "feat: implement FastAPI endpoints with tree-path explainability and tutoria updates"
```

---

### Task 6: Full Verification & Integration Test Suite

**Files:**
- Modify: `tests/test_api.py`
- Modify: `README.md`

- [ ] **Step 1: Run complete test suite**

Run: `pytest tests/ -v`
Expected: All tests PASS.

- [ ] **Step 2: Update `README.md` with backend setup, train commands, and API documentation**

- [ ] **Step 3: Final commit**

```bash
git add README.md tests/
git commit -m "docs: document backend execution and verify all integration tests"
```
