import pytest
from pydantic import ValidationError
from backend.schemas import (
    SimuladorInputRequest,
    SimuladorOutputResponse,
    ActualizarTutoriaRequest,
    EstudiantesRiesgoResponse,
    MateriaCargaItem,
    MetricasModelosResponse
)

def test_simulador_input_exact_variables_valid():
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
    assert valid.asignatura == "Farmacología Clínica"

def test_simulador_input_bounds_validation():
    # nota_primer_parcial > 5.0
    with pytest.raises(ValidationError):
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
        
    # asistencia_pct < 0
    with pytest.raises(ValidationError):
        SimuladorInputRequest(
            asignatura="Bioquímica Médica",
            nota_primer_parcial=3.0,
            promedio_acumulado_cortes=3.0,
            asistencia_pct=-5.0,
            repitente=0,
            semestre=2,
            carga_percibida=3.0,
            horas_estudio_semana=10.0,
            horas_sueno=7.0,
            apoyo_economico_familiar=1,
            trabajo_remunerado=0,
            intencion_seguir=1
        )

def test_actualizar_tutoria_schema():
    req = ActualizarTutoriaRequest(estado="citado", fecha="2026-11-30")
    assert req.estado == "citado"
    assert req.fecha == "2026-11-30"

    with pytest.raises(ValidationError):
        ActualizarTutoriaRequest(estado="expulsado") # Not allowed
