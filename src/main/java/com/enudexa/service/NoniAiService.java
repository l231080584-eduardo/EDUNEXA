package com.enudexa.service;

import com.enudexa.entity.Carrera;
import com.enudexa.entity.CampoLaboral;
import com.enudexa.entity.PerfilEgreso;
import com.enudexa.entity.Universidad;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
public class NoniAiService {

    public String generarSintesisVocacional(
            String nickname, Carrera carrera, Universidad universidad, double compatibilidadPercent) {
        String player = nickname != null && !nickname.isBlank() ? nickname.trim() : "futuro talento";
        int percent = (int) compatibilidadPercent;
        String carreraNombre = carrera.getNombre();
        String uniNombre = universidad.getNombre();

        // Gather optional profile info
        PerfilEgreso perfil = getPerfilEgreso(carrera);
        String competencias = perfil != null ? perfil.getResumenCompetencias() : null;
        List<CampoLaboral> campos = carrera.getCampoLaboral();
        String puesto = null;
        String sector = null;
        if (campos != null && !campos.isEmpty()) {
            CampoLaboral primerCampo = campos.get(0);
            puesto = primerCampo.getPuestoTrabajo();
            sector = primerCampo.getSectorEmpresarial();
        }

        // Choose variant based on compatibility
        if (percent >= 90) {
            return buildHighVariant(player, percent, carreraNombre, uniNombre, competencias, puesto, sector);
        } else if (percent >= 80) {
            return buildMediumVariant(player, percent, carreraNombre, uniNombre, competencias, puesto, sector);
        } else {
            return buildBaseVariant(player, percent, carreraNombre, uniNombre, competencias, puesto, sector);
        }
    }

    private PerfilEgreso getPerfilEgreso(Carrera carrera) {
        if (carrera == null) return null;
        return carrera.getPerfilEgreso();
    }

    private String buildHighVariant(String player, int percent, String carrera, String universidad,
                                     String competencias, String puesto, String sector) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format(Locale.ROOT, "¡Hola, %s! Tus resultados son excelentes: %d por ciento de compatibilidad con %s.", player, percent, carrera));
        sb.append(" Tienes un perfil muy definido y las habilidades que esta carrera busca.");
        sb.append(String.format(Locale.ROOT, " La opción ideal para ti es %s.", universidad));
        if (competencias != null && !competencias.isBlank()) {
            sb.append(String.format(Locale.ROOT, " Al terminar, sabrás %s.", competencias));
        }
        if (puesto != null && !puesto.isBlank() && sector != null && !sector.isBlank()) {
            sb.append(String.format(Locale.ROOT, " Podrás trabajar como %s en el sector %s.", puesto, sector));
        }
        sb.append(" ¡Confía en tu perfil y da el siguiente paso!");
        return sb.toString();
    }

    private String buildMediumVariant(String player, int percent, String carrera, String universidad,
                                       String competencias, String puesto, String sector) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format(Locale.ROOT, "¡Hola, %s! Tienes un %d por ciento de compatibilidad con %s, lo cual es un muy buen punto de partida.", player, percent, carrera));
        sb.append(" Tu perfil muestra intereses claros que puedes desarrollar aún más.");
        sb.append(String.format(Locale.ROOT, " Te recomiendo explorar %s para conocer más sobre esta ruta.", universidad));
        if (competencias != null && !competencias.isBlank()) {
            sb.append(String.format(Locale.ROOT, " Con esta formación podrás %s.", competencias));
        }
        if (puesto != null && !puesto.isBlank() && sector != null && !sector.isBlank()) {
            sb.append(String.format(Locale.ROOT, " Un camino laboral sería %s en %s.", puesto, sector));
        }
        sb.append(" ¡Sigue explorando, hay muchas puertas abiertas para ti!");
        return sb.toString();
    }

    private String buildBaseVariant(String player, int percent, String carrera, String universidad,
                                     String competencias, String puesto, String sector) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format(Locale.ROOT, "¡Hola, %s! Tu compatibilidad con %s es de %d por ciento.", player, carrera, percent));
        sb.append(" Aunque el porcentaje no es el más alto, tus intereses y habilidades tienen mucho potencial.");
        sb.append(String.format(Locale.ROOT, " %s es una opción que vale la pena conocer.", universidad));
        if (competencias != null && !competencias.isBlank()) {
            sb.append(String.format(Locale.ROOT, " Esta carrera te daría la capacidad de %s.", competencias));
        }
        if (puesto != null && !puesto.isBlank() && sector != null && !sector.isBlank()) {
            sb.append(String.format(Locale.ROOT, " Podrías llegar a ser %s en el sector %s.", puesto, sector));
        }
        sb.append(" ¡No te limites a un solo camino: sigue jugando y descubre más opciones!");
        return sb.toString();
    }
}
