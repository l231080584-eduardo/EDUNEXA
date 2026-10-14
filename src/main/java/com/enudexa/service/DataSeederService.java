package com.enudexa.service;

import com.enudexa.entity.CampoLaboral;
import com.enudexa.entity.Carrera;
import com.enudexa.entity.PerfilEgreso;
import com.enudexa.entity.Universidad;
import com.enudexa.repository.CarreraRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class DataSeederService implements CommandLineRunner {

    private final CarreraRepository carreraRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (carreraRepository.count() > 0) {
            return;
        }

        log.info("Iniciando inyección de Catálogo Maestro de 15 Carreras de Alta Profundidad...");
        List<Carrera> catalogo = new ArrayList<>();

        catalogo.add(crearCarrera("Ingeniería en Sistemas Computacionales", "Tecnología y Software", 9, 0.95, 0.90, 0.80, 0.85,
                "Arquitectura de software distribuido, ciberseguridad, cloud y modelado de IA.",
                "Desarrollo de software bajo metodologías ágiles (Scrum, DevOps) y análisis de Big Data.",
                "Java, Python, Redes Cisco, AWS/Azure, Microservicios con Spring Boot y React.",
                "Pensamiento lógico abstracto, resolución de problemas complejos.",
                "Ingeniero Full-Stack", "Tecnología, Banca", 38000.0, "Muy Alto"));

        catalogo.add(crearCarrera("Ingeniería Mecatrónica", "Automatización", 9, 0.85, 0.95, 0.75, 0.80,
                "Diseño de productos y procesos industriales automatizados inteligentes.",
                "Simulación de celdas de manufactura flexible y robótica industrial.",
                "PLC (Siemens, Allen Bradley), CAD/CAM, Microcontroladores.",
                "Creatividad física, atención al detalle técnico.",
                "Ingeniero de Automatización", "Industria Automotriz", 32000.0, "Alto"));

        catalogo.add(crearCarrera("Médico Cirujano", "Salud", 12, 0.95, 0.80, 0.95, 0.60,
                "Diagnóstico, tratamiento y rehabilitación de patologías.",
                "Aplicación del método clínico y epidemiológico.",
                "Anatomía, Farmacología, Soporte Vital (BLS/ACLS).",
                "Altísima empatía, ética profesional, control de estrés.",
                "Médico General", "Sector Salud", 28000.0, "Muy Alto"));

        catalogo.add(crearCarrera("Licenciatura en Derecho", "Ciencias Sociales", 10, 0.80, 0.75, 0.85, 0.90,
                "Resolución de conflictos legales y defensa de derechos.",
                "Dogmática jurídica, argumentación legal, amparos.",
                "Derecho Constitucional, Penal, Corporativo y Laboral.",
                "Oratoria, razonamiento deductivo, negociación.",
                "Abogado Litigante", "Despachos, Gobierno", 25000.0, "Alto"));

        catalogo.add(crearCarrera("Ingeniería Industrial", "Gestión", 9, 0.75, 0.85, 0.80, 0.90,
                "Optimización de sistemas integrados de producción y logística.",
                "Gestión de cadenas de suministro y Lean Manufacturing.",
                "Six Sigma, SAP ERP, Investigación de Operaciones.",
                "Liderazgo, visión sistémica, toma de decisiones.",
                "Gerente de Operaciones", "Manufactura, Logística", 30000.0, "Muy Alto"));

        catalogo.add(crearCarrera("Licenciatura en Psicología", "Salud Mental", 8, 0.85, 0.60, 0.90, 0.80,
                "Estudio del comportamiento humano y salud mental.",
                "Evaluación clínica e intervención organizacional.",
                "Pruebas Psicométricas, Terapia Cognitiva.",
                "Escucha activa, objetividad, inteligencia emocional.",
                "Psicólogo / RRHH", "Clínicas, Corporativos", 22000.0, "Medio-Alto"));

        catalogo.add(crearCarrera("Arquitectura", "Diseño", 10, 0.90, 0.80, 0.70, 0.85,
                "Proyectar y construir espacios habitables sustentables.",
                "Proyectos arquitectónicos y cálculo de instalaciones.",
                "AutoCAD, Revit (BIM), V-Ray, Cálculo Estructural.",
                "Creatividad volumétrica, sensibilidad estética.",
                "Arquitecto Proyectista", "Constructoras", 26000.0, "Alto"));

        catalogo.add(crearCarrera("Contaduría y Finanzas", "Negocios", 8, 0.70, 0.85, 0.80, 0.95,
                "Gestión, control y análisis de capital organizacional.",
                "Estados financieros, auditorías y proyectos de inversión.",
                "Contabilidad de Costos, NIF, Auditoría, SAP FI.",
                "Rigor ético, análisis numérico, concentración.",
                "Auditor / Analista Financiero", "Consultoras, Bancos", 29000.0, "Muy Alto"));

        catalogo.add(crearCarrera("Ingeniería en Biotecnología", "Ciencias Exactas", 9, 0.90, 0.95, 0.70, 0.65,
                "Sistemas biológicos para crear o modificar procesos.",
                "Fermentación industrial y manipulación genética.",
                "Biología Molecular, Termodinámica, Microbiología.",
                "Meticulosidad, investigación profunda.",
                "Investigador R&D", "Farmacéutica, Alimentos", 34000.0, "Medio-Alto"));

        catalogo.add(crearCarrera("Ingeniería Civil", "Infraestructura", 9, 0.80, 0.95, 0.75, 0.85,
                "Construcción y mantenimiento de infraestructura civil.",
                "Cálculo estructural, geotecnia y dirección de obras.",
                "Mecánica de Materiales, Hidráulica, SAP2000.",
                "Liderazgo en campo, gestión de presupuestos.",
                "Residente de Obra", "Constructoras", 33000.0, "Alto"));

        catalogo.add(crearCarrera("Licenciatura en Enfermería", "Salud", 8, 0.90, 0.70, 0.95, 0.75,
                "Cuidado integral especializado clínico.",
                "Manejo de soporte vital y administración farmacológica.",
                "Anatomía, Farmacología, Epidemiología.",
                "Alta resistencia emocional, reacción en emergencias.",
                "Enfermero Especialista", "Hospitales", 20000.0, "Muy Alto"));

        catalogo.add(crearCarrera("Relaciones Internacionales", "Ciencias Políticas", 8, 0.85, 0.65, 0.85, 0.85,
                "Dinámica geopolítica y económica transnacional.",
                "Diplomacia y negociación de tratados (T-MEC).",
                "Geopolítica, Derecho Internacional, Idiomas.",
                "Pensamiento crítico global, protocolo.",
                "Analista Geopolítico", "Embajadas, Corporativos", 25000.0, "Medio"));

        catalogo.add(crearCarrera("Diseño y Comunicación Visual", "Medios Creativos", 8, 0.95, 0.50, 0.80, 0.80,
                "Proyección de mensajes visuales efectivos.",
                "Branding corporativo y diseño de UI/UX.",
                "Adobe Suite, Figma, Teoría del Color.",
                "Altísima creatividad, adaptabilidad a tendencias.",
                "Diseñador UI/UX", "Agencias, Startups", 24000.0, "Alto"));

        catalogo.add(crearCarrera("Licenciatura en Gastronomía", "Servicios", 8, 0.90, 0.60, 0.85, 0.70,
                "Técnicas culinarias y gestión de alimentos.",
                "Alta cocina, enología y administración de restaurantes.",
                "Química de Alimentos, Enología, Distintivo H.",
                "Trabajo bajo presión, higiene impecable.",
                "Chef Ejecutivo", "Hotelería, Restaurantes", 22000.0, "Alto"));

        catalogo.add(crearCarrera("Licenciatura en Pedagogía", "Educación", 8, 0.80, 0.60, 0.95, 0.85,
                "Diseño y evaluación de procesos de enseñanza.",
                "Diseño curricular e integración de tecnologías EdTech.",
                "Didáctica, Psicología Educativa, LMS (Canvas/Moodle).",
                "Vocación docente, empatía profunda.",
                "Diseñador Instruccional", "Instituciones Educativas", 18000.0, "Medio"));

        carreraRepository.saveAll(catalogo);
        log.info("¡Catálogo Maestro inyectado exitosamente!");
    }

    private Carrera crearCarrera(
            String nombre, String area, int semestres,
            double intereses, double materias, double estiloVida, double geolocalizacion,
            String descripcion, String resumen, String conocimientos, String habilidades,
            String puesto, String sector, double salario, String empleabilidad) {
        Carrera carrera = Carrera.builder()
                .nombre(nombre)
                .area(area)
                .duracionSemestres(semestres)
                .descripcion(descripcion)
                .pesoIntereses(intereses)
                .pesoMaterias(materias)
                .pesoEstiloVida(estiloVida)
                .pesoGeolocalizacion(geolocalizacion)
                .build();
        carrera.setPerfilEgreso(PerfilEgreso.builder()
                .resumenCompetencias(resumen)
                .conocimientosTecnicos(conocimientos)
                .habilidadesBlandas(habilidades)
                .carrera(carrera)
                .build());
        carrera.setCampoLaboral(List.of(CampoLaboral.builder()
                .puestoTrabajo(puesto)
                .sectorEmpresarial(sector)
                .salarioPromedioEstimado(salario)
                .nivelEmpleabilidad(empleabilidad)
                .carrera(carrera)
                .build()));
        return carrera;
    }
}
