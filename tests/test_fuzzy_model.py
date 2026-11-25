import math
import numpy as np
import pandas as pd
import pytest

from backend.fuzzy_model import (
    REGLAS_DIFUSAS,
    UNIVERSO_RIESGO,
    defuzzificar_centroide,
    evaluar_estudiante_difuso,
    predecir_dataset_difuso,
    trapmf,
    trimf,
)


def _perfil_base(**overrides):
    datos = {
        "nota_primer_parcial": 3.5,
        "promedio_acumulado_cortes": 3.6,
        "asistencia_pct": 85.0,
        "repitente": 0,
        "semestre": 3,
        "carga_percibida": 3.0,
        "horas_estudio_semana": 14.0,
        "horas_sueno": 7.0,
        "apoyo_economico_familiar": 1,
        "trabajo_remunerado": 0,
        "intencion_seguir": 1,
    }
    datos.update(overrides)
    return datos


def test_funciones_pertenencia_bordes_y_rango():
    # trimf escalar: soporte [2, 5, 8]
    assert trimf(1.0, 2.0, 5.0, 8.0) == 0.0
    assert trimf(2.0, 2.0, 5.0, 8.0) == 0.0
    assert trimf(5.0, 2.0, 5.0, 8.0) == 1.0
    assert trimf(8.0, 2.0, 5.0, 8.0) == 0.0
    assert trimf(9.0, 2.0, 5.0, 8.0) == 0.0
    assert math.isclose(float(trimf(3.5, 2.0, 5.0, 8.0)), 0.5)

    # trimf con vértice degenerado (a == b)
    assert trimf(0.0, 0.0, 0.0, 1.0) == 1.0
    assert trimf(1.0, 0.0, 1.0, 1.0) == 1.0

    # trapmf con array NumPy y hombros planos
    xs = np.array([-1.0, 0.0, 2.0, 4.0, 6.0, 10.0])
    vals = trapmf(xs, 0.0, 0.0, 2.0, 4.0)
    assert isinstance(vals, np.ndarray)
    assert np.all((vals >= 0.0) & (vals <= 1.0))
    assert not np.any(np.isnan(vals))
    assert vals[1] == 1.0 and vals[2] == 1.0 and vals[3] == 0.0 and vals[4] == 0.0


def test_defuzzificar_centroide_fallback_cero():
    universo = np.linspace(0.0, 1.0, 201)
    agregado_cero = np.zeros_like(universo)
    res = defuzzificar_centroide(universo, agregado_cero)
    assert res == 0.5
    assert not math.isnan(res)


def test_perfil_extremo_alto_riesgo():
    perfil = _perfil_base(
        nota_primer_parcial=1.5,
        promedio_acumulado_cortes=1.8,
        asistencia_pct=50.0,
        repitente=1,
        semestre=2,
        carga_percibida=4.9,
        horas_estudio_semana=3.0,
        horas_sueno=4.5,
        apoyo_economico_familiar=0,
        trabajo_remunerado=1,
        intencion_seguir=0,
    )
    res = evaluar_estudiante_difuso(perfil)
    assert 0.60 <= res["indice_riesgo"] <= 1.0
    assert res["probabilidad_difusa"] >= 60.0
    assert res["nivel_riesgo"] == "alto"

    reglas = res["reglas_activas"]
    assert len(reglas) >= 1
    assert any(r["consecuente"] == "alto" for r in reglas)
    activaciones = [r["activacion"] for r in reglas]
    assert all(0.0 < a <= 1.0 for a in activaciones)
    assert activaciones == sorted(activaciones, reverse=True)
    assert "R7" not in [r["id"] for r in reglas]


def test_r7_no_diluye_r2_cuando_concurren_trabajo_o_rendimiento_bajo():
    # Caso A: asistencia baja + trabajo remunerado=1 + rendimiento bueno
    res_a = evaluar_estudiante_difuso(
        _perfil_base(asistencia_pct=60.0, trabajo_remunerado=1, promedio_acumulado_cortes=3.6, nota_primer_parcial=3.6)
    )
    ids_a = {r["id"]: r["activacion"] for r in res_a["reglas_activas"]}
    assert ids_a.get("R2", 0.0) > 0.0
    assert "R7" not in ids_a

    # Caso B: asistencia baja + trabajo remunerado=0 + rendimiento bajo
    res_b = evaluar_estudiante_difuso(
        _perfil_base(asistencia_pct=60.0, trabajo_remunerado=0, promedio_acumulado_cortes=2.0, nota_primer_parcial=2.0)
    )
    ids_b = {r["id"]: r["activacion"] for r in res_b["reglas_activas"]}
    assert ids_b.get("R2", 0.0) > 0.0
    assert "R7" not in ids_b

    # Caso C: asistencia baja aislada (sin trabajo y sin rendimiento bajo)
    res_c = evaluar_estudiante_difuso(
        _perfil_base(asistencia_pct=60.0, trabajo_remunerado=0, promedio_acumulado_cortes=3.6, nota_primer_parcial=3.6)
    )
    ids_c = {r["id"]: r["activacion"] for r in res_c["reglas_activas"]}
    assert ids_c.get("R7", 0.0) > 0.0
    r7 = next(r for r in res_c["reglas_activas"] if r["id"] == "R7")
    assert r7["consecuente"] == "medio"


def test_perfil_extremo_bajo_riesgo():
    perfil = _perfil_base(
        nota_primer_parcial=4.5,
        promedio_acumulado_cortes=4.6,
        asistencia_pct=96.0,
        repitente=0,
        semestre=3,
        carga_percibida=2.0,
        horas_estudio_semana=20.0,
        horas_sueno=8.0,
        apoyo_economico_familiar=1,
        trabajo_remunerado=0,
        intencion_seguir=1,
    )
    res = evaluar_estudiante_difuso(perfil)
    assert 0.0 <= res["indice_riesgo"] < 0.35
    assert res["probabilidad_difusa"] < 35.0
    assert res["nivel_riesgo"] == "bajo"
    assert any(r["consecuente"] == "bajo" for r in res["reglas_activas"])


def test_perfil_intermedio_seguimiento_preventivo():
    perfil = _perfil_base(
        nota_primer_parcial=3.1,
        promedio_acumulado_cortes=3.2,
        asistencia_pct=79.0,
        repitente=0,
        semestre=2,
        carga_percibida=4.0,
        horas_estudio_semana=10.0,
        horas_sueno=6.2,
        apoyo_economico_familiar=0,
        trabajo_remunerado=0,
        intencion_seguir=1,
    )
    res = evaluar_estudiante_difuso(perfil)
    assert 35.0 <= res["probabilidad_difusa"] < 60.0
    assert res["nivel_riesgo"] == "medio"


def test_dataset_sintetico_rango_consistencia_y_orden():
    df = pd.read_csv("backend/data/dataset_sintetico.csv")
    y_prob, y_pred = predecir_dataset_difuso(df, umbral=0.5)
    assert len(y_prob) == len(df)
    assert len(y_pred) == len(df)
    assert not np.any(np.isnan(y_prob))
    assert np.all((y_prob >= 0.0) & (y_prob <= 1.0))
    assert set(np.unique(y_pred)).issubset({0, 1})

    for _, row in df.iterrows():
        res = evaluar_estudiante_difuso(row.to_dict())
        idx = res["indice_riesgo"]
        prob = res["probabilidad_difusa"]
        assert 0.0 <= idx <= 1.0
        assert 0.0 <= prob <= 100.0
        assert not math.isnan(idx) and not math.isnan(prob)

        if prob >= 60.0:
            assert res["nivel_riesgo"] == "alto"
        elif prob >= 35.0:
            assert res["nivel_riesgo"] == "medio"
        else:
            assert res["nivel_riesgo"] == "bajo"

        acts = [r["activacion"] for r in res["reglas_activas"]]
        assert all(0.0 < a <= 1.0 for a in acts)
        assert acts == sorted(acts, reverse=True)


def test_reglas_base_cantidad_y_tono_no_punitivo():
    assert 8 <= len(REGLAS_DIFUSAS) <= 10
    assert len(REGLAS_DIFUSAS) == 9
    prohibidos = ("expuls", "sancion", "castig", "culpa", "fracas")
    for regla in REGLAS_DIFUSAS:
        texto = regla["descripcion"].lower()
        for palabra in prohibidos:
            assert palabra not in texto, f"Palabra punitiva '{palabra}' en {regla['id']}"


def test_extremos_absolutos_de_dominio():
    cotas = [
        _perfil_base(
            nota_primer_parcial=0.0,
            promedio_acumulado_cortes=0.0,
            asistencia_pct=0.0,
            repitente=1,
            carga_percibida=5.0,
            horas_estudio_semana=0.0,
            horas_sueno=0.0,
            apoyo_economico_familiar=0,
            trabajo_remunerado=1,
            intencion_seguir=0,
        ),
        _perfil_base(
            nota_primer_parcial=5.0,
            promedio_acumulado_cortes=5.0,
            asistencia_pct=100.0,
            repitente=0,
            carga_percibida=1.0,
            horas_estudio_semana=60.0,
            horas_sueno=24.0,
            apoyo_economico_familiar=1,
            trabajo_remunerado=0,
            intencion_seguir=1,
        ),
    ]
    for perfil in cotas:
        res = evaluar_estudiante_difuso(perfil)
        assert 0.0 <= res["indice_riesgo"] <= 1.0
        assert 0.0 <= res["probabilidad_difusa"] <= 100.0
        assert not math.isnan(res["indice_riesgo"])
