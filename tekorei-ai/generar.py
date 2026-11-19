"""Genera, desde contenido.json:

- plan-tekorei.html                     página del plan (plantilla.html + datos)
- chatplace/automatizaciones.json       un flujo por palabra clave, listo para automations_create_from_schema
- chatplace/respuestas-comentarios.json respuestas públicas, listas para comments_create
- chatplace/agente-ia.json              reglas y base de conocimiento del agente de IA

Uso:  python3 generar.py
"""

import json
from pathlib import Path

AQUI = Path(__file__).resolve().parent
CUENTA = "@tekorei.ai"
LIMITE_DM_INSTAGRAM = 1000          # caracteres por mensaje en Instagram
LARGO_USERNAME = 30                  # {{ username }} puede ocupar hasta 30 caracteres


def variantes(dia):
    """Palabra clave en minúsculas, MAYÚSCULAS y Capitalizada, sin repetir."""
    vistas, salida = set(), []
    for base in [dia["palabra"], *dia["variantes"]]:
        for v in (base.lower(), base.upper(), base.capitalize()):
            if v not in vistas:
                vistas.add(v)
                salida.append(v)
    return salida


def validar(datos):
    errores = []
    palabras = [d["palabra"].lower() for d in datos["dias"]] + ["avisame"]
    if len(set(palabras)) != len(palabras):
        errores.append("hay palabras clave repetidas")
    for a in palabras:
        for b in palabras:
            if a != b and a in b:
                errores.append(f"la palabra '{a}' está dentro de '{b}' y dispararía el flujo equivocado")
    for d in datos["dias"]:
        largo = len(d["dm"].replace("{{ username }}", "x" * LARGO_USERNAME))
        if largo > LIMITE_DM_INSTAGRAM:
            errores.append(f"día {d['dia']}: el DM tiene {largo} caracteres (máximo {LIMITE_DM_INSTAGRAM})")
        boton = d["boton"]["texto"]
        if len(boton) > 20 or "." in boton:
            errores.append(f"día {d['dia']}: el botón '{boton}' debe tener hasta 20 caracteres y sin puntos")
        if len(d["respuestas"]) < 2:
            errores.append(f"día {d['dia']}: faltan respuestas públicas")
    if errores:
        raise SystemExit("Errores:\n- " + "\n- ".join(errores))


def flujo(dia):
    """Comentario/DM con la palabra -> botón -> etiqueta -> ¿te sigue? -> pasos + botón al repo."""
    etiqueta = "kw_" + dia["palabra"].lower()
    pasos = [
        {"stepId": 1, "type": "message", "coordinateX": 100, "coordinateY": 100,
         "content": f"¡Hola, {{{{ username }}}}! Vi tu comentario 👀 Te paso {dia['tema']}. Toca el botón 👇",
         "imageContent": None,
         "callToAction": [{"name": "¡Lo quiero! 🔥", "url": None, "type": "onetime", "nextStepId": 2}],
         "nextStepId": None},
        {"stepId": 2, "type": "action", "coordinateX": 560, "coordinateY": 100,
         "action": {"type": "add_tag", "tagNames": ["tekorei", etiqueta], "nextStepId": 3},
         "nextStepId": 3},
        {"stepId": 3, "type": "condition", "coordinateX": 1020, "coordinateY": 100,
         "condition": {"type": "check_subscription", "value": {"subscriptionCondition": None},
                       "nextStepId": 5, "failedStepId": 4},
         "nextStepId": None},
        {"stepId": 4, "type": "message", "coordinateX": 1480, "coordinateY": 400,
         "content": f"Para mandarte el link necesito que sigas a {CUENTA} 🙏 Sígueme y toca el botón.",
         "imageContent": None,
         "callToAction": [{"name": "Ya te sigo ✅", "url": None, "type": "multiple", "nextStepId": 7}],
         "nextStepId": None},
        {"stepId": 5, "type": "message", "coordinateX": 1480, "coordinateY": 100,
         "content": dia["dm"], "imageContent": None, "formType": "quickAnswer",
         "callToAction": [], "nextStepId": 6},
        {"stepId": 6, "type": "message", "coordinateX": 1940, "coordinateY": 100,
         "content": "Aquí tienes el repo 👇", "imageContent": None, "formType": "template",
         "callToAction": [{"name": dia["boton"]["texto"], "url": dia["boton"]["url"],
                           "type": "multiple", "nextStepId": None, "trackClicks": True,
                           "tagNames": [etiqueta + "_click"]}],
         "nextStepId": None},
        {"stepId": 7, "type": "condition", "coordinateX": 1940, "coordinateY": 400,
         "condition": {"type": "check_subscription", "value": {"subscriptionCondition": None},
                       "nextStepId": 5, "failedStepId": 8},
         "nextStepId": None},
        {"stepId": 8, "type": "message", "coordinateX": 2400, "coordinateY": 400,
         "content": "Todavía no veo tu follow 🙈 Sígueme y vuelve a tocar “Ya te sigo ✅”.",
         "imageContent": None, "callToAction": [], "nextStepId": None},
    ]
    return {
        "name": f"Día {dia['dia']:02d} · {dia['palabra']} · {dia['tema']}",
        "status": "paused",
        "triggers": {"triggerTypes": ["commentContains", "messageContains"],
                     "startMessages": variantes(dia)},
        "steps": pasos,
    }


def flujo_avisame():
    return {
        "name": "Lista · AVISAME",
        "status": "paused",
        "triggers": {"triggerTypes": ["messageContains"],
                     "startMessages": ["avisame", "AVISAME", "Avisame", "avísame", "Avísame", "AVÍSAME"]},
        "steps": [
            {"stepId": 1, "type": "message", "coordinateX": 100, "coordinateY": 100,
             "content": "¡Hecho, {{ username }}! 🔔 Eres de los primeros: te escribo por aquí cuando salga un repo nuevo o algo especial de tekorei.ai.",
             "imageContent": None, "callToAction": [], "nextStepId": 2},
            {"stepId": 2, "type": "action", "coordinateX": 560, "coordinateY": 100,
             "action": {"type": "add_tag", "tagNames": ["tekorei", "avisos"], "nextStepId": None},
             "nextStepId": None},
        ],
    }


def respuestas(dia):
    return {"name": f"Día {dia['dia']:02d} · {dia['palabra']}", "type": "contains",
            "startMessages": variantes(dia), "answers": dia["respuestas"]}


REGLAS_AGENTE = f"""Eres Kori, el asistente de {CUENTA}, una cuenta que recomienda repos, skills y plugins de IA gratis u open source.
- Responde en español, con tono cercano y en 1 a 3 frases. Como máximo un emoji.
- Si alguien quiere un recurso de un video, dile la palabra clave exacta que tiene que comentar o escribirte por DM (está en tu base de conocimiento).
- Usa solo los repos, comandos y datos de tu base de conocimiento. Si no lo sabes, dilo y avisa que lo vas a pasar al equipo. Nunca inventes comandos, precios, estrellas ni links.
- No prometas ingresos ni resultados. No des consejos financieros.
- Nunca pidas contraseñas, tarjetas, documentos ni datos personales.
- Si piden colaboraciones, patrocinios, precios de servicios o algo comercial, di que una persona del equipo les responde pronto.
- Si alguien está molesto o reporta un error, discúlpate brevemente y avisa que una persona lo revisa.
- Si preguntan qué computadora necesitan para correr IA local: con 8 GB de RAM, modelos chicos; con 16 GB, modelos medianos; con tarjeta gráfica de 8 GB o más, modelos más grandes. Recomienda empezar chico.
- Casi todas las herramientas necesitan una computadora (Windows, Mac o Linux). En el celular solo sirven las que funcionan en la web."""

BASE_GENERAL = [
    ("¿No me llegó el DM?",
     f"Revisa la carpeta de solicitudes de mensajes. El link llega cuando sigues a {CUENTA} y tocas el botón del primer mensaje. Si sigue sin llegar, escríbeme la palabra clave por DM."),
    ("¿Qué es una skill?",
     "Una skill es un manual con instrucciones y archivos que un agente de IA (como Claude Code) lee para hacer una tarea bien: presentaciones, estudiar, programar, etc. Se instalan con un comando."),
    ("¿Qué es un MCP?",
     "MCP es un estándar que conecta a la IA con herramientas externas: un navegador, documentación, tus apps. Por ejemplo, Playwright MCP le da un navegador a Claude."),
    ("¿Qué es un plugin de Claude Code?",
     "Un paquete que suma skills, comandos o conexiones a Claude Code. Se instala dentro de Claude Code con /plugin install."),
    ("¿Qué es Claude Code y es gratis?",
     "Claude Code es el agente de programación de Anthropic: trabaja en tu computadora con tus archivos. Se usa con una suscripción de Claude o con créditos de API; los precios están en la web de Anthropic."),
    ("¿Funciona en el celular?",
     "Casi todo lo que muestro necesita una computadora (Windows, Mac o Linux), porque se instala con la terminal."),
    ("¿Cada cuánto suben videos?",
     "Un repo nuevo todos los días a las 19:00. Si quieres enterarte primero, escríbeme AVISAME."),
    ("¿Hacen colaboraciones o publicidad?",
     "¡Gracias por escribir! Una persona del equipo te responde pronto por aquí."),
    ("¿Me ayudas a instalarlo?",
     "Dime qué repo, tu sistema (Windows, Mac o Linux) y qué error te sale, y te oriento. Si es algo largo, una persona del equipo te ayuda."),
]


def agente(datos):
    base = [{"question": q, "answer": a} for q, a in BASE_GENERAL]
    for d in datos["dias"]:
        repos = ", ".join("github.com/" + r["nombre"] for r in d["repos"])
        base.append({
            "question": f"¿Qué es {d['tema']} y cómo lo consigo?",
            "answer": (f"{d['tema']} ({repos}). Comenta {d['palabra']} en el video o escríbeme "
                       f"{d['palabra']} por DM y te mando los pasos. Requisitos: {d['nota']}"),
        })
    return {
        "reglas_globales": REGLAS_AGENTE,
        "ajustes": {
            "answerOnMessageEnabled": True,
            "answerOnCommentEnabled": True,
            "engageCommentUserEnabled": False,
            "responseDelayEnabled": True,
            "responseDelay": 45,
            "silenceAfterHumanReplyEnabled": True,
            "silenceAfterHumanReply": 120,
            "generateButtons": False,
        },
        "base_de_conocimiento": base,
    }


def escribir_json(ruta, obj):
    ruta.parent.mkdir(parents=True, exist_ok=True)
    ruta.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    datos = json.loads((AQUI / "contenido.json").read_text(encoding="utf-8"))
    validar(datos)

    flujos = [flujo(d) for d in datos["dias"]] + [flujo_avisame()]
    escribir_json(AQUI / "chatplace" / "automatizaciones.json", flujos)
    escribir_json(AQUI / "chatplace" / "respuestas-comentarios.json", [respuestas(d) for d in datos["dias"]])
    escribir_json(AQUI / "chatplace" / "agente-ia.json", agente(datos))

    incrustado = json.dumps(datos, ensure_ascii=False).replace("</", "<\\/")
    plantilla = (AQUI / "plantilla.html").read_text(encoding="utf-8")
    (AQUI / "plan-tekorei.html").write_text(plantilla.replace("__DATA__", incrustado), encoding="utf-8")

    largos = [len(d["dm"].replace("{{ username }}", "x" * LARGO_USERNAME)) for d in datos["dias"]]
    print(f"OK: {len(flujos)} automatizaciones, {len(datos['dias'])} reglas de comentarios, "
          f"{len(agente(datos)['base_de_conocimiento'])} entradas para el agente. DM más largo: {max(largos)} caracteres.")


if __name__ == "__main__":
    main()
