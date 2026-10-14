package com.enudexa.service;

import com.enudexa.entity.Carrera;
import com.enudexa.entity.Universidad;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class NoniAiService {

    public String generarSintesisVocacional(
            String nickname, Carrera carrera, Universidad universidad, double compatibilidadPercent) {
        String player = nickname != null && !nickname.isBlank() ? nickname.trim() : "futuro talento";

        return String.format(
                Locale.ROOT,
                "¡Hola, %s! Qué gusto saludarte, yo soy Noni. Estuve analizando con mucho detalle tus respuestas "
                        + "en el simulador, y tienes un perfil súper interesante. Hemos encontrado un %d por ciento "
                        + "de compatibilidad directa con %s. Tienes justo las habilidades y el enfoque que se "
                        + "necesitan ahí. Pensando en tu desarrollo y ubicación, la opción que encontré para ti es "
                        + "%s. En tu pantalla te dejo el mapa interactivo para llegar, el salario promedio estimado "
                        + "y lo que puedes aprender en la carrera. ¡Atrévete a dar el siguiente paso, el futuro es tuyo!",
                player, (int) compatibilidadPercent, carrera.getNombre(), universidad.getNombre());
    }
}
