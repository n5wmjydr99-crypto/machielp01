# Servicios TTS en la nube con voces en español gratis y uso comercial (estado a noviembre de 2026)

> Nota de método: desde esta sesión WebFetch no pudo abrir azure.microsoft.com, aws.amazon.com, elevenlabs.io, learn.microsoft.com ni docs.cloud.google.com (bloqueados por la red de la sesión), y la página de precios de Google Cloud TTS se renderiza vacía (JavaScript). Por eso, los datos de páginas oficiales provienen de extractos del buscador sobre esas mismas URL (marcados como "oficial, vía buscador"). El resto son fuentes secundarias (agregadores, reseñas, foros), marcadas como "secundaria". Conviene revisar las cifras en vivo antes de decidir.

## 1. Niveles gratuitos y sus límites (caracteres/mes, tarjeta, caducidad)

### Takeaway
Solo Google ofrece hoy un cupo gratuito permanente, mensual y amplio con voces en español de alta calidad. Hay dos vías: Cloud Text-to-Speech, con Chirp 3 HD a 1 M de caracteres al mes gratis (exige tener la facturación habilitada), y la API de Gemini, con Gemini 3.8 Flash TTS sin coste en el nivel gratuito (límites no publicados; según terceros, sin tarjeta). Azure F0 regala 0,5 M de caracteres al mes, pero no sirve para uso comercial (ver §2). El nivel gratuito de 12 meses de Polly solo existe para cuentas abiertas antes del 15 de julio de 2025. El resto son créditos puntuales o planes gratis no comerciales.

### Cited Findings

**Google Cloud Text-to-Speech**
- Tabla oficial actual: Chirp 3: HD tiene de 0 a 1 M de caracteres gratis al mes y después cuesta US$0,00003 por carácter (US$30 por 1 M). Neural2 tiene 1 M gratis y después US$16 por 1 M. WaveNet y Standard tienen 4 M gratis cada uno y después US$4 por 1 M — [Google Cloud TTS pricing (oficial, vía buscador)](https://cloud.google.com/text-to-speech/pricing)
- Los límites gratuitos se calculan por cuenta de facturación y por mes, hay que habilitar la facturación para usar la API y no se cobra nada mientras no se supere la cuota gratuita — [Google Cloud TTS pricing (oficial, vía buscador)](https://cloud.google.com/text-to-speech/pricing)
- Conflicto: la landing antigua de Google aún dice "first 1 million characters for WaveNet … first 4 million for Standard", mientras que la tabla actual da 4 M a WaveNet. Lo que vale es la tabla de precios, que es más reciente — [Landing de Cloud TTS (oficial, desactualizada)](https://cloud.google.com/text-to-speech); [tabla de precios](https://cloud.google.com/text-to-speech/pricing)
- Las voces Studio cuestan unos US$160 por 1 M de caracteres (secundaria) — [Speechactors](https://speechactors.com/article/google-cloud-pricing-and-plans); [Developers Digest](https://www.developersdigest.tech/models/speech/google-cloud)

**Gemini API / Google AI Studio (TTS generativo)**
- Gemini 3.8 Flash TTS: en el nivel gratuito, entrada y salida figuran como "Free of charge". En el nivel de pago cuesta US$0,50 por 1 M de tokens de texto de entrada y US$9,00 por 1 M de tokens de audio de salida hasta el 31 de diciembre de 2026. Desde el 1 de enero de 2027 sube a US$1,00 y US$18,00 — [Gemini API pricing (oficial, vía buscador)](https://ai.google.dev/gemini-api/docs/pricing)
- Gemini 3.1 Flash TTS Preview y Gemini 2.5 Flash Preview TTS también figuraban gratis en el nivel gratuito (de pago: US$1/US$20 y US$0,50/US$10 por 1 M de tokens de entrada/salida). El modo Batch no tiene nivel gratuito — [Gemini API pricing (oficial, vía buscador)](https://ai.google.dev/gemini-api/docs/pricing)
- Google no publica límites fijos por modelo para el nivel gratuito. La página de límites define el nivel "Free" como un proyecto activo o una prueba gratuita — [Rate limits (oficial)](https://ai.google.dev/gemini-api/docs/rate-limits)
- Un post del foro oficial (no es documentación) dice que el nivel gratuito incluye gemini-3.8-flash-tts y gemini-3.8-flash-lite-tts — [Google AI Developers Forum, hilo 188631](https://discuss.ai.google.dev/t/is-google-ai-studio-speech-generation-permitted-for-nonprofit-video-production/188631)
- Señal de volatilidad: un hilo de hace unos 11 meses se queja de que los modelos TTS dejaron de estar gratis en AI Studio. Ahí se dice que 2.5 Pro Preview TTS no tiene nivel gratuito y que el uso gratis de 2.5 Flash Preview TTS tenía topes diarios — [Google AI Developers Forum, hilo 112719](https://discuss.ai.google.dev/t/why-are-the-tts-models-no-longer-available-for-free-on-google-ai-studio/112719)
- Según reseñas de terceros, se usa gratis en AI Studio solo con una cuenta de Google (secundaria) — [AIToolAnalysis](https://aitoolanalysis.com/google-ai-studio-text-to-speech-review/); [ProjeDefteri](https://projedefteri.com/en/blog/is-gemini-3-8-tts-free/)
- Una vez activada una cuenta de Cloud Billing, todo el uso de la API de Gemini y de AI Studio cuenta como servicio de pago a efectos del uso de datos, aunque esté dentro de la cuota gratuita — [Gemini API Additional Terms (oficial)](https://ai.google.dev/gemini-api/terms)

**Microsoft Azure AI Speech**
- Nivel F0: 0,5 M de caracteres al mes de TTS neural gratis, renovables cada mes. Después, unos US$15 por 1 M de caracteres en voces neurales (secundaria) — [TextToLab](https://texttolab.com/blog/azure-text-to-speech-pricing); [Lullula](https://lullula.io/blog/azure-speech-free-tier); [freetier.wiki](https://freetier.wiki/services/azure-ai-speech/)
- F0 no cubre voces HD, Custom Neural Voice ni Personal Voice. Sus cuotas no se pueden ampliar, el ritmo es de unas 20 solicitudes por minuto y solo se permite un recurso F0 por suscripción (secundaria) — [freetier.wiki](https://freetier.wiki/services/azure-ai-speech/); [Lullula](https://lullula.io/blog/azure-speech-free-tier)
- La cuenta gratuita de Azure exige teléfono, tarjeta de crédito o débito (no prepago) y una cuenta Microsoft o GitHub. Incluye verificación de identidad por tarjeta, no acepta tarjetas virtuales ni prepago y hace una retención temporal que se libera en 3–5 días. Hay una cuenta gratuita por cliente — [Microsoft Support: problemas de registro (oficial)](https://support.microsoft.com/en-us/help/4042959); [FAQ de la cuenta gratuita de Azure (espejo "sandbox" de Microsoft)](https://acom-sandbox.azure.net/en-us/free/free-account-faq/)

**Amazon Polly**
- Nivel gratuito clásico: 5 M de caracteres al mes en Standard, 1 M en Neural, 500 K en Long-Form y 100 K en Generative, durante 12 meses. Una fuente dice que el cupo Standard es permanente (secundaria) — [TextToLab](https://texttolab.com/blog/is-amazon-polly-free); [OpenAPIPricing](https://openapipricing.com/blog/tts/amazon-polly)
- Precios de pago: Neural US$16 por 1 M y Generative US$30 por 1 M (secundaria) — [OpenAPIPricing](https://openapipricing.com/blog/tts/amazon-polly)
- Desde el 15 de julio de 2025, AWS sustituyó las ofertas de 12 meses para cuentas nuevas por un "Free Plan" de créditos: US$100 al registrarse y hasta US$100 más por completar actividades (máximo US$200). La mayoría de fuentes dice que dura unos 6 meses; una dice 12. Las cuentas anteriores conservan los beneficios antiguos (secundaria) — [FreeTier.co](https://freetier.co/articles/aws-free-tier-changes-july-15-2025); [AWS First Steps](https://awsi.click/en/articles/aws-free-tier-comparison/); [AWS Builder Center](https://builder.aws.com/content/2zmBcwokU8Y0C1zacGmXsRDpXP6/aws-free-tier-unlock-dollar200-in-free-credits-for-new-users)

**ElevenLabs**
- El plan gratis no incluye licencia comercial: los Términos limitan a los usuarios gratuitos a usos no comerciales. Además exige atribución, con "elevenlabs.io" o "11.ai" en el título — [ElevenLabs Help Center (oficial)](https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform); [ElevenLabs Terms of Service (oficial)](https://elevenlabs.io/terms-of-use)
- La licencia comercial empieza en el plan Starter: US$6 al mes según la página actual citada por terceros; artículos más antiguos dicen US$5 (secundaria) — [BIGVU](https://bigvu.tv/blog/elevenlabs-pricing-2026-plans-credits-commercial-rights-api-costs/)

**Otros servicios**
- Cartesia: el plan gratis da 20.000 créditos al mes y es explícitamente no comercial. Pro cuesta unos US$4–5 al mes y añade licencia comercial (secundaria) — [TextToLab](https://texttolab.com/blog/cartesia-pricing); [Smallest.ai](https://smallest.ai/blog/cartesia-ai-review-2026-features-pricing-and-comparison)
- Fish Audio: la página de precios muestra "commercial use" en el plan gratis, pero sus Términos limitarían a quien no paga a uso interno, personal y no comercial. Plus cuesta desde US$5,50 al mes (promoción anual), con precio de lista de US$20 al mes (secundaria) — [Smallest.ai](https://smallest.ai/blog/fish-audio-pricing-plans-api-billing-commercial-use-in-2026); [SaaS CRM Review](https://saascrmreview.com/fish-audio-review/)
- Fish Audio Drama 3: según una fuente, tiene licencia comercial gratuita para empresas con menos de US$500.000 de ingresos, con un plazo ligado al 12 de noviembre. Solo aplica a ese modelo (secundaria) — [MindStudio](https://www.mindstudio.ai/blog/fish-audio-drama-3-pricing)
- Deepgram: US$200 de crédito inicial sin tarjeta. Las fuentes no coinciden en la caducidad: una dice que los créditos promocionales vencen al año y otra no da fecha (secundaria) — [Gladia](https://gladia.io/blog/deepgram-pricing); [TextToLab](https://texttolab.com/blog/deepgram-pricing)
- TTSMaker: plan gratis de 20.000 caracteres por semana (algunas voces sin límite) y un máximo de 3.000 caracteres por conversión. Otras fuentes citan 500 o 1.000 — [TTSMaker (oficial)](https://ttsmaker.com/); [TTSMaker Pro pricing (oficial)](https://pro.ttsmaker.com/pricing)
- Murf: el plan gratis excluye el uso comercial y bloquea las descargas. Speechify: el plan gratis es para escucha personal; el uso comercial, las voces premium y las descargas requieren pago (secundaria) — [RealAITest](https://www.realaitest.com/guides/free-text-to-speech-youtube.html); [AITextSpeak](https://www.aitextspeak.com/blog/ai-text-to-speech-commercial-use)
- PlayHT/PlayAI: Meta lo adquirió en julio de 2025. La API se apagó el 26 de julio de 2025, no aceptó registros nuevos desde agosto y el servicio terminó el 31 de diciembre de 2025, con borrado de cuentas, proyectos y clones de voz (secundaria) — [TextToLab](https://texttolab.com/blog/play-ht-shutdown-alternatives); [Murf blog](https://murf.ai/blog/play-ai-transition-guide)
- Una fuente afirma además que LMNT y Hume TTS cerraron. No lo pude verificar — [Stork.ai](https://www.stork.ai/blog/playht-alternatives-2026.md)

**Resumen comparativo (cada celda está respaldada por las fuentes de arriba)**

| Servicio | Gratis | ¿Tarjeta? | ¿Uso comercial con lo gratis? | Español latino |
|---|---|---|---|---|
| Google Cloud TTS (Chirp 3 HD) | 1 M car./mes permanente (Neural2 1 M; WaveNet/Standard 4 M) | Facturación habilitada (medio de pago) | No encontré restricción por nivel (secundaria; ver §2) | es-US (30 voces) |
| Gemini API (3.8 Flash TTS) | Gratis en el nivel free; límites no publicados | No, solo cuenta de Google (secundaria) | Google no reclama la propiedad, pero no hay cláusula explícita; usa los datos del nivel gratis | es-419 en Preview (Cloud); biblioteca de más de 2.000 voces |
| Azure Speech F0 | 0,5 M car./mes | Sí (tarjeta + teléfono) | **No**: el derecho comercial es solo para el nivel de pago | es-MX, es-AR y otras (unas 75 voces en español) |
| Amazon Polly | 12 meses solo para cuentas anteriores al 15/07/2025; cuentas nuevas: US$100–200 en créditos por unos 6 meses | No verificado | El FAQ permite reutilizar; los términos completos no se verificaron | es-MX, es-US |
| ElevenLabs Free | Créditos mensuales | No verificado | **No**, y exige atribución | Sí |
| Cartesia Free | 20 K créditos/mes | No verificado | **No** | No verificado |
| Fish Audio Free | No verificado | No verificado | Ambiguo (la página de precios y los Términos se contradicen) | No verificado |
| Deepgram (Aura-2) | US$200 de crédito único | No (secundaria) | No verificado | es-MX, es-CO, es-AR, es-419 |
| TTSMaker | 20 K car./semana | No verificado | Sí, según TTSMaker | No verificado |
| Murf / Speechify Free | No verificado | No verificado | **No** | No verificado |
| edge-tts (no oficial) | Sin cuota oficial | No | **No** (ver §3) | Mismas voces que Azure (inferencia) |
| PlayHT | Cerrado (31/12/2025) | — | — | — |

### Inferences
- Un short de 30–60 s en español tiene unos 450–1.000 caracteres (≈150 palabras por minuto × ≈6 caracteres por palabra, espacios incluidos). El millón de caracteres gratis de Chirp 3 HD alcanza para unos 1.000 shorts al mes, y los 0,5 M de Azure F0 para unos 500. Para dos personajes en shorts, la cuota no es el cuello de botella; la licencia sí.
- "Facturación habilitada" en Google Cloud implica registrar un medio de pago (normalmente una tarjeta) aunque no haya cobro. No lo confirmé en una página oficial (ver Gaps).
- Azure de pago (S0) cuesta unos US$15 por 1 M, es decir, unos US$0,015 por short de 1.000 caracteres. Es casi gratis y tiene derechos comerciales explícitos. Es la alternativa "de céntimos" si se quieren las voces mexicanas o argentinas de Microsoft.
- Para una cuenta AWS nueva, Polly no es una solución de US$0 a largo plazo: los créditos caducan en unos 6 meses.
- Gemini TTS en el nivel gratuito es la única opción de alta calidad, sin tarjeta según terceros y sin caducidad. A cambio, los límites no se publican y la política cambió varias veces en un año.

### Gaps
- No pude abrir las páginas oficiales de precios de Azure, AWS ni ElevenLabs, ni leer directamente la tabla de Google. Las cifras de F0 y de Polly vienen de agregadores.
- Cupo gratuito de las voces Studio de Google: los agregadores no coinciden (1 M frente a 100 K) y no lo verifiqué en la tabla oficial.
- No pude confirmar si Polly conserva algún cupo gratis propio dentro del nuevo Free Plan de AWS, ni si AWS exige tarjeta.
- No verifiqué en esta sesión los créditos exactos del plan gratis de ElevenLabs ni el requisito de tarjeta de ElevenLabs, Cartesia, Fish Audio y TTSMaker.
- No investigué OpenAI TTS, Narakeet, Inworld, MiniMax, Resemble, Hume ni LMNT, así que no hay datos verificados sobre sus niveles gratuitos.
- Gemini no publica los límites diarios (RPD) del nivel gratuito para TTS.
- No verifiqué el crédito de prueba de US$300 de Google Cloud para clientes nuevos.

## 2. Términos de uso comercial (monetización en YouTube/Instagram/TikTok, atribución, personajes, redistribución)

### Takeaway
Con Azure F0 (gratis) no se adquieren derechos comerciales: los Product Terms de Microsoft reservan el uso comercial del audio de voces neuronales prediseñadas a los clientes del nivel de pago. Los planes gratis de ElevenLabs, Cartesia, Murf y Speechify tampoco permiten uso comercial, y el de Fish Audio es ambiguo. Google Cloud TTS y Polly no distinguen entre gratis y pago (según fuentes secundarias rigen sus términos normales). Gemini declara que no reclama la propiedad del contenido generado, pero no tiene una cláusula explícita de "uso comercial" para TTS gratis. TTSMaker afirma conceder uso comercial gratis. No encontré prohibiciones de usar voces prediseñadas para personajes ficticios.

### Cited Findings

**Azure**
- Cláusula "TTS Service output use rights" de los Product Terms, citada textualmente: "For Customers of the paid tier TTS Service only, Customer may use the audio output of prebuilt neural voices generated using the TTS Service, including for commercial purposes." — [Microsoft Q&A 6045956 (cita de los Product Terms)](https://learn.microsoft.com/en-us/answers/questions/6045956/can-i-use-azure-tts-prebuilt-neural-voices-free-f0)
- Los hilos recientes (2025–2026) interpretan F0 como una asignación de precios para evaluación y pruebas que no lleva esos derechos de uso del audio. Recomiendan generar el audio final con un recurso de pago (S0 o pago por uso). La guía publicada de Microsoft respalda el uso comercial y la redistribución del audio de voces prediseñadas generado en nivel de pago — [Microsoft Q&A 6067434](https://learn.microsoft.com/en-us/answers/questions/6067434/commercial-use-of-azure-text-to-speech-audio-in-a); [Microsoft Q&A 6045956](https://learn.microsoft.com/en-us/answers/questions/6045956/can-i-use-azure-tts-prebuilt-neural-voices-free-f0)
- Moderadores de Microsoft (2023–2024): "Yes, you can use the audio output from TTS for commercial purposes, provided you are using a valid standard (paid) pricing tier, such as the Pay-as-you-go tier. If you are currently using a free account or credit, you should upgrade to the Pay-as-you-go tier." No hay licencias ni regalías adicionales, siempre que se respete el código de conducta de TTS — [Microsoft Q&A 1374135](https://learn.microsoft.com/en-us/answers/questions/1374135/using-azure-text-to-speech-service-for-commercial); [Microsoft Q&A 1060225](https://learn.microsoft.com/en-us/answers/questions/1060225/microsoft-azure-text-to-speech-commercial-use-for)
- Opinión discrepante: un MVP sostuvo en marzo de 2026 que Microsoft no restringe el uso comercial según el nivel. La mayoría de respuestas posteriores no está de acuerdo. Varias respuestas de estos hilos están marcadas como generadas por IA, así que no son oficiales — [Microsoft Q&A 5805156](https://learn.microsoft.com/en-us/answers/questions/5805156/please-clarify-the-conflicting-information-regardi); [Microsoft Q&A 5792674](https://learn.microsoft.com/en-us/answers/questions/5792674/can-the-audio-generated-by-azure-speech-studios-fr)
- El crédito de Azure for Students está restringido a educación, docencia e investigación no comercial, así que no cubre videos monetizados — [Microsoft Q&A 6048475](https://learn.microsoft.com/en-us/answers/questions/6048475/commercial-use-of-azure-for-students-100-credit-fo)
- Una web de terceros afirma que Azure permite uso comercial en el nivel gratis, en contra de lo que dice Microsoft. No es fiable en este punto — [FreeTTS.org](https://freetts.org/tts-licensing-commercial-use-matrix)

**Google Cloud TTS**
- Según fuentes secundarias, Google Cloud y Amazon Polly facturan igual el uso gratis y el de pago, de modo que el uso comercial queda cubierto por sus términos normales — [RealAITest](https://www.realaitest.com/guides/free-text-to-speech-youtube.html); [AITextSpeak](https://www.aitextspeak.com/blog/ai-text-to-speech-commercial-use)

**Gemini API (AI Studio)**
- Los Términos Adicionales dicen que Google "won't claim ownership" del contenido original generado, aunque puede generar contenido igual o parecido para otros. El usuario responde de su uso y de cumplir la ley aplicable, que puede exigir atribución — [Gemini API Additional Terms (oficial)](https://ai.google.dev/gemini-api/terms)
- En los servicios no pagados (AI Studio y la cuota gratuita), Google usa los textos enviados y las respuestas para mejorar sus productos, y revisores humanos pueden leerlos tras desvincularlos de la cuenta: "Do not submit sensitive, confidential, or personal information to the Unpaid Services." — [Gemini API Additional Terms (oficial)](https://ai.google.dev/gemini-api/terms)
- La pregunta exacta de este proyecto (audio TTS gratis de AI Studio en YouTube/Facebook monetizado) está abierta en el foro oficial sin una respuesta autorizada de Google — [Forum 200408](https://discuss.ai.google.dev/t/commercial-use-of-gemini-tts-audio-generated-using-free-google-ai-studio-for-youtube-and-facebook-monetization/200408); [Forum 196204](https://discuss.ai.google.dev/t/can-i-use-free-tier-gemini-tts-audio-in-monetized-youtube-videos/196204)
- Reseñas de terceros: no hay ninguna cláusula que restrinja el uso comercial del audio del nivel gratuito (secundaria) — [ProjeDefteri](https://projedefteri.com/en/blog/is-gemini-3-8-tts-free/); [AIToolAnalysis](https://aitoolanalysis.com/google-ai-studio-text-to-speech-review/)
- Usuarios del foro citan la sección 5(e) de los Google APIs Terms, que restringe modificar, vender o distribuir contenido devuelto por las APIs salvo autorización del titular o de la ley, como motivo de duda (hilos sobre Lyria, sin respuesta oficial) — [Forum 197753](https://discuss.ai.google.dev/t/clarification-required-commercial-saas-application-using-lyria-api-generated-music-distribution-rights/197753); [Forum 189157](https://discuss.ai.google.dev/t/commercial-use-and-youtube-publishing-rights-for-lyria-3-5-music-generated-via-paid-gemini-api/189157)
- Replicar una voz real con Gemini 3.8 requiere el consentimiento hablado de su dueño — [The New Stack](https://thenewstack.io/gemini-tts-voice-replication-api/); [The Next Web](https://thenextweb.com/news/gemini-tts-3-8-flash-voice-design-cloning)

**Amazon Polly**
- El FAQ oficial dice que el audio generado puede guardarse en caché y reproducirse sin coste adicional. No menciona YouTube — [AWS Polly FAQ (oficial, vía buscador)](https://aws.amazon.com/polly/faqs/)
- Según terceros, el audio puede usarse en videos monetizados, aunque admiten no haber revisado la licencia completa (secundaria) — [AgentGid](https://agentgid.com/assets/amazon-polly/); [FromTextToSpeech](https://www.fromtexttospeech.com/text-to-speech-services/amazon-polly-review/)
- La AI Service Card dice que Polly no almacena las entradas ni las salidas de TTS y recomienda que el cliente aplique su propia moderación — [AWS AI Service Card (oficial)](https://docs.aws.amazon.com/ai/responsible-ai/amazon-polly/overview.html)

**ElevenLabs, Cartesia, Murf, Speechify, Fish Audio y TTSMaker**
- ElevenLabs: el plan gratis no permite uso comercial y exige atribución. Todos los planes de pago incluyen licencia comercial, salvo los servicios Beta — [Help Center (oficial)](https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform); [Terms (oficial)](https://elevenlabs.io/terms-of-use)
- Pasarse a un plan de pago después no licencia de forma retroactiva lo generado con el plan gratis (secundaria) — [DEV Community](https://dev.to/jadenvo259/can-you-use-elevenlabs-free-for-youtube-the-license-rules-every-voiceover-pipeline-should-encode-61p); [AIApp.plus](https://aiapp.plus/reviews/elevenlabs-commercial-use/)
- TTSMaker dice que se pueden "download the audio files for commercial use (it's completely free)" y su FAQ asigna al usuario el "100% voice copyright". Una reseña añade que no exige atribución. TTSMaker se reserva el derecho de ajustar sus políticas en el futuro — [TTSMaker (oficial)](https://ttsmaker.com/); [Aumiqx review](https://aumiqx.com/learn/ttsmaker-free-text-to-speech-review-2026/)
- Cartesia, Murf y Speechify no son comerciales en el plan gratis, y Fish Audio es ambiguo (fuentes en §1).

**Plataformas**
- Que el proveedor autorice el uso comercial no garantiza que YouTube monetice el video — [T2Speech](https://www.t2speech.ai/blog/free-tts-monetized-youtube)

### Inferences
- La ruta a US$0 con base legal más limpia es el nivel gratuito de Google Cloud TTS (Chirp 3 HD): el mismo contrato cubre el uso gratis y el de pago, y no hallé restricción por nivel. Le sigue Gemini TTS en el nivel gratuito, con riesgo moderado: Google no reclama la propiedad, pero no hay una concesión explícita, los datos se usan para entrenar y las reglas cambian a menudo.
- Azure solo es legítimo para videos monetizados con un recurso de pago, aunque el coste sea de céntimos.
- TTSMaker concede uso comercial gratis por escrito, pero es un operador pequeño, no conozco el origen de sus voces y puede cambiar su política. Si se usa, conviene guardar capturas fechadas de sus términos.
- Con voces prediseñadas de ningún proveedor encontré prohibiciones de crear personajes ficticios. Las restricciones que sí aparecen se refieren a clonar voces de personas reales sin consentimiento y a usos engañosos.

### Gaps
- No leí el texto de los Service Specific Terms de Google Cloud para TTS, ni los AWS Service Terms de Polly, ni los Product Terms de Azure directamente (solo su cita en Microsoft Q&A).
- No revisé los términos de uso de los créditos de Deepgram.
- No investigué el origen de las voces de TTSMaker, es decir, si su licencia de las voces respalda la concesión comercial que da.
- No investigué los requisitos de divulgación o etiquetado de contenido sintético (etiquetas de YouTube/TikTok, código de conducta de Azure TTS).
- Una fuente de terceros afirma que todo el audio de Gemini TTS lleva marca de agua SynthID. No lo verifiqué en documentación de Google.

## 3. Rutas no oficiales: edge-tts (voces "Leer en voz alta" de Microsoft Edge)

### Takeaway
No es una opción legítima para contenido monetizado. El autor de edge-tts dice que la librería es para uso personal, Microsoft no publica ningún permiso comercial para el audio de "Read Aloud" y un moderador de Microsoft advierte que usarlo comercialmente sin una suscripción de Azure podría violar sus términos. Además es técnicamente frágil: el token Sec-MS-GEC se rota, aparecen errores 403 y hay limitación por IP.

### Cited Findings
- El autor de edge-tts afirma: "This library is meant for personal use." En la misma discusión, un comentarista sostiene que el uso comercial sin una suscripción válida de Azure viola los términos de Microsoft — [rany2/edge-tts Discussion #261](https://github.com/rany2/edge-tts/discussions/261)
- Un moderador voluntario de Microsoft Q&A dice que Microsoft no publica documentación que conceda derechos de redistribución comercial del audio generado con Read Aloud o edge-tts, y que la vía oficial es Azure AI Speech de pago — [Microsoft Q&A 6007729](https://learn.microsoft.com/en-us/answers/questions/6007729/commercial-use-of-microsoft-edge-text-to-speech-vi)
- Un moderador de Microsoft dice que el uso comercial sin una suscripción válida de Azure "could be a violation of our terms of service", aunque aclara que no puede dar asesoría legal — [Microsoft Q&A 2088770](https://learn.microsoft.com/en-us/answers/questions/2088770/are-opensource-edge-tts-free-for-commercial-use)
- El sitio edge-tts.com, que no está claramente vinculado ni al proyecto ni a Microsoft, afirma que el audio es del usuario para uso comercial, pero también que las voces están sujetas a "their respective terms" — [edge-tts.com Terms](https://edge-tts.com/terms/)
- El repositorio tiene issues cerrados titulados "Commercial Purpose" (#237, agosto de 2024) y "Are you sure it's free?" (#259, septiembre de 2024) — [Issue #237](https://github.com/rany2/edge-tts/issues/237); [Issue #259](https://github.com/rany2/edge-tts/issues/259)
- Microsoft rota la constante SEC_MS_GEC_VERSION con cada versión de Edge, y una constante desactualizada devuelve HTTP 403 — [msedge-tts AGENTS.md](https://docs.rs/crate/msedge-tts/latest/source/AGENTS.md)
- Hay errores 403 reportados sin resolución, y foros que atribuyen fallos a limitación o bloqueo por IP — [edge-tts Issue #458](https://github.com/rany2/edge-tts/issues/458); [pyvideotrans](https://pyvideotrans.com/en/_posts/edgetts-proxy)

### Inferences
- Las voces de edge-tts son las mismas del catálogo neural de Azure (por ejemplo es-MX-JorgeNeural; inferencia basada en los nombres de voz y en la discusión #261). Si el creador ya usa voces de Edge para Nico o Kori, la forma de mantener exactamente esa voz de forma legítima es generarla con Azure S0, a unos céntimos por short.

### Gaps
- No hay ninguna declaración legal formal de Microsoft, solo respuestas de moderadores en Q&A. No pude leer el texto del Microsoft Services Agreement ni los términos de Edge en esta sesión.

## 4. Voces en español más naturales y cuáles encajan con Nico (joven latinoamericano) y Kori (robot tierno con voz base natural)

### Takeaway
El catálogo con más acentos latinoamericanos es el de Azure (es-MX, es-AR, es-CO, es-US…), pero solo es comercial pagando. Google Chirp 3 HD solo ofrece es-US y es-ES, con 30 voces cada uno; es-US es la opción "latina neutra" gratis. Polly tiene es-MX (Mia, Andrés) y es-US (Lupe, Pedro). Deepgram Aura-2 tiene voces mexicanas, colombianas, argentina y latinoamericanas. Gemini 3.8 Flash TTS permite diseñar una voz por descripción y guardarla como ID reutilizable, lo que es ideal para Kori. ElevenLabs lidera los rankings de calidad, pero su plan gratis no es comercial.

### Cited Findings

**Google Cloud TTS**
- Chirp 3: HD ofrece es-ES y es-US con los mismos 30 nombres de hablante (de Achernar a Zubenelgenubi; por ejemplo Achird, Charon, Kore, Puck), cada uno etiquetado por género. El formato de nombre es es-US-Chirp3-HD-<Nombre> — [Supported voices (oficial, vía buscador)](https://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types); [Chirp 3: HD (oficial, vía buscador)](https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd)
- Otras familias: Chirp-HD (generación anterior) tiene es-ES D/F/O y es-US D/F/O. Neural2 tiene es-US A/B/C y es-ES A/E/F/G/H. Studio tiene es-US Studio-B (masculina) y es-ES Studio-C (femenina) y Studio-F (masculina) — [Supported voices](https://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types)
- Chirp 3 HD no admite entrada SSML, ni parámetros de velocidad y tono, ni codificación A-Law. Está disponible en los endpoints global, eu y us — [Chirp 3: HD docs](https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd)

**Gemini TTS**
- Ofrece 30 voces prediseñadas y una Extended Voice Library de más de 2.000 voces filtrables por idioma, acento y género. Los ejemplos del filtro de acento son "American" y "British"; no encontré un valor específico para Latinoamérica — [Speech generation docs (oficial, vía buscador)](https://ai.google.dev/gemini-api/docs/speech-generation)
- Permite varios hablantes: cada turno lleva el nombre del hablante y un estilo en lenguaje natural (por ejemplo "cheerful and friendly"), y los hablantes se asignan a voces con multi_speaker_voice_config — [Speech generation docs](https://ai.google.dev/gemini-api/docs/speech-generation)
- Gemini 3.8 Flash TTS cubre 132 idiomas según la documentación de Cloud y 130 según la de la API de Gemini; la variante Flash-Lite, 103 y 101 — [Gemini TTS overview (Cloud)](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/text-to-speech/overview); [Gemini 3.8 Flash TTS](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash-tts)
- La documentación de Cloud lista "Spanish (Latin America, es-419)" en Preview para Gemini-TTS — [Cloud TTS: Gemini-TTS](https://docs.cloud.google.com/text-to-speech/docs/gemini-tts)
- Voice Design: se describe una voz en lenguaje llano y se guarda como ID de voz reutilizable en el proyecto (POST /v1beta/voices con type="prompted"). La función se lanzó en septiembre de 2026 — [AI Studio developer guide](https://aistudio.google.com/learn/gemini-3-8-flash-tts-developer-guide); [MarkTechPost](https://www.marktechpost.com/2026/09/23/google-releases-gemini-3-8-flash-tts-and-flash-lite-tts-with-prompt-based-voice-design/)

**Azure (solo comercial en nivel de pago)**
- es-MX: la página actual lista DaliaNeural (femenina) y las multilingües DaliaMultilingualNeural y JorgeMultilingualNeural. También lista las voces Neural HD Ximena y Tristan (DragonHDLatestNeural); el extracto no deja claro su locale — [Azure language support (oficial, vía buscador)](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support)
- La copia de la región China lista es-MX-JorgeNeural (masculina) con estilos chat, cheerful, excited, sad y whispering, además de es-AR TomasNeural (masculina) y ElenaNeural (femenina) — [docs.azure.cn language support (oficial)](https://docs.azure.cn/en-us/ai-services/speech-service/language-support); [Azure language support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support)
- Azure tiene unas 75 voces en español — [json2video](https://json2video.com/ai-voices/azure/languages/spanish/)

**Amazon Polly**
- es-MX: Mia (femenina; Standard, Neural y Generative) y Andrés (masculino; Neural y Generative).
- es-US: Lupe (femenina; Standard, Neural y Generative, además del estilo Newscaster), Pedro (masculino; Neural y Generative), y Penélope (femenina) y Miguel (masculino), solo Standard. Carlos aparece como tercera voz Generative de es-US.
- es-ES: Lucía y Sergio (Neural y Generative).
- Fuentes de los tres puntos anteriores — [Neural voices (oficial)](https://docs.aws.amazon.com/polly/latest/dg/neural-voices.html); [Generative voices (oficial)](https://docs.aws.amazon.com/polly/latest/dg/generative-voices.html); [Polly features (oficial)](https://aws.amazon.com/polly/features/)

**Deepgram Aura-2**
- El español se lanzó en junio de 2025 con 10 voces — [Deepgram changelog (oficial)](https://developers.deepgram.com/changelog/2025/6/25)
- El catálogo actual tiene unas 17–20 voces:
  - Mexicanas: Estrella, Sirio, Javier, Luciano, Olivia y Valerio.
  - Colombianas: Celeste y Gloria.
  - Argentina: Antonia.
  - Latinoamericanas (es-419): Aquila y Selena.
  - Peninsulares: Nestor, Carina, Alvaro, Diana, Agustina y Silvia.
  - Con cambio de código español–inglés: Aquila, Carina, Diana, Javier y Selena (por ejemplo, el modelo aura-2-javier-es).
  - Fuente — [Deepgram: Voices and languages (oficial)](https://developers.deepgram.com/docs/tts-models)

**Calidad percibida (fuentes secundarias)**
- Una comparativa en español sitúa primero a ElevenLabs (4,8/5), con Azure TTS y Google WaveNet cerca — [SpeechGeneration.ai](https://speechgeneration.ai/es/mejores-herramientas-text-to-speech)
- Un ranking de noviembre de 2026 da a ElevenLabs Eleven v4 la mejor calidad por votos ciegos en Artificial Analysis Speech Arena — [Haass](https://haass.io/blog/best-tts-api-2026)
- Las comparativas en español describen a Azure como el proveedor con más variantes regionales del español (más de 15) y a Google con poca variedad de dialectos latinoamericanos. No hallé ninguna comparación detallada voz por voz en acentos latinos — [AINarrator](https://ainarrator.stackseekers.com/es/blog/tts-engines-widest-language-support-2026); [SpeechGeneration.ai](https://speechgeneration.ai/es/mejores-herramientas-text-to-speech)

### Inferences
- **Nico (joven latinoamericano):**
  - Opción gratis legal: una voz masculina es-US-Chirp3-HD-<Nombre>, eligiéndola por la etiqueta de género del catálogo y escuchando muestras.
  - Alternativas: Polly es-MX Andrés o es-US Pedro (Generative), si la cuenta es anterior a julio de 2025; Deepgram aura-2-javier-es (mexicano), con créditos; Azure es-MX Jorge o JorgeMultilingual, o es-AR Tomas, solo pagando S0.
  - Con Gemini se puede diseñar "un joven latinoamericano de unos 20 años, cálido y enérgico" y guardar su ID.
- **Kori (robot tierno con voz base natural):**
  - Partir de una voz brillante o juvenil: una voz femenina o suave de es-US Chirp 3 HD, Polly Mia o Azure Dalia.
  - Dar el toque robótico en postproducción (subir el tono 2–4 semitonos y añadir un chorus, ring-mod o bitcrush leve). Chirp 3 HD no admite parámetros de tono, así que esto tiene que hacerse en el editor.
  - Con Gemini Voice Design se puede describir "un robot pequeño y adorable, voz aguda y amable, apenas metálica" y guardar el ID.
- Usar el mismo proveedor para los dos personajes simplifica el flujo de trabajo. El modo de varios hablantes de Gemini puede generar un diálogo Nico–Kori en una sola llamada.

### Gaps
- No encontré pruebas ciegas independientes centradas en voces de español latino.
- No re-verifiqué en esta sesión el género de cada voz Chirp 3 HD ni los descriptores de estilo de Gemini (por ejemplo, Puck "Upbeat", Leda "Youthful", Fenrir "Excitable"). Los recuerdo de la documentación de Gemini pero no los confirmé.
- No confirmé por búsqueda las voces de Azure es-CO (Gonzalo, Salome) ni es-US (Alonso, Paloma).
- Que la biblioteca extendida de Gemini tenga acentos mexicanos o argentinos solo lo afirman terceros.
- No verifiqué el género de cada voz de Deepgram.
- Tampoco verifiqué si Chirp 3 HD añadió después control de ritmo o pausas, cosa que podrían recoger las release notes.

## 5. Consistencia: ¿el personaje sonará siempre igual?

### Takeaway
Las voces prediseñadas con un ID fijo (Google Chirp 3 HD y Neural2, Polly, Azure) son las más predecibles. Las voces generativas basadas en LLM (Gemini TTS, ElevenLabs v3/v4) varían la prosodia de una generación a otra, y sus modelos se retiran: Google apagó tres modelos TTS "preview" de Gemini el 17 de noviembre de 2026. Los nombres "DragonHDLatest" de Azure y las discrepancias entre sus documentos muestran que los catálogos cambian. Archivar el audio maestro y usar IDs de voz persistentes es clave.

### Cited Findings
- Retiro del 17 de noviembre de 2026 de gemini-2.5-flash-preview-tts, gemini-2.5-pro-preview-tts y gemini-3.1-flash-tts-preview, con gemini-3.8-flash-tts y gemini-3.8-flash-lite-tts como reemplazos. Cloud Text-to-Speech no lista fecha de retiro para sus modelos Gemini TTS (secundaria) — [Developers Digest](https://www.developersdigest.tech/blog/gemini-live-tts-retirement-november-2026); [Layer3Labs](https://www.layer3labs.io/guides/gemini-model-deprecations)
- La página del modelo Gemini 3.8 Flash TTS afirma que mantiene la identidad de la voz, el timbre, el volumen y el tono acústico de la sala en diálogos largos "without voice drift" — [Gemini 3.8 Flash TTS (oficial, vía buscador)](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash-tts)
- Los usuarios reportan resultados mixtos: un texto largo dividido en partes puede volver con voces ligeramente distintas, aunque otros lo encuentran más estable que 3.1 — [Recaply](https://recaply.co/tools/gemini-3-8-flash-tts)
- Las voces diseñadas o replicadas devuelven un ID de voz persistente. Un proyecto puede guardar 200 voces propias, y las voces clonadas se conservan un año — [AI Studio developer guide](https://aistudio.google.com/learn/gemini-3-8-flash-tts-developer-guide); [Recaply](https://recaply.co/tools/gemini-3-8-flash-tts); [The Next Web](https://thenextweb.com/news/gemini-tts-3-8-flash-voice-design-cloning)
- Discrepancia en Azure: la página actual lista JorgeMultilingualNeural, mientras que la copia de la región China lista la voz estándar JorgeNeural. Las voces HD se llaman "DragonHDLatestNeural" — [Azure language support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support); [docs.azure.cn](https://docs.azure.cn/en-us/ai-services/speech-service/language-support)
- Los nombres de Chirp 3 HD son fijos, con el formato es-US-Chirp3-HD-<Nombre> — [Chirp 3: HD docs](https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd)
- Genesys, una plataforma de terceros, deja de soportar de forma nativa voces de Google y Azure entre agosto de 2026 y marzo de 2027. No es un retiro por parte de Google ni de Microsoft — [Genesys](https://help.genesys.cloud/announcements/genesys-cloud/deprecation-genesys-enhanced-tts-microsoft-azure-and-google-voices/)
- Riesgo de proveedor: el cierre de PlayHT borró cuentas, clones de voz y claves de API (secundaria) — [TextToLab](https://texttolab.com/blog/play-ht-shutdown-alternatives)

### Inferences
- Un sufijo "Latest" sugiere que el modelo subyacente puede actualizarse y que el timbre podría cambiar con el tiempo. Para un personaje fijo conviene una voz con nombre estable y no "latest".
- Buenas prácticas:
  - Fijar el nombre exacto de la voz y todos sus parámetros.
  - Guardar una "biblia de voz" con textos de muestra y ajustes.
  - Archivar todos los WAV generados.
  - Evitar los modelos "preview".
  - En Gemini, usar IDs de voz guardados y evaluar la deriva generando el mismo texto varias veces.
- Los modelos open-source locales tienen los pesos congelados y ofrecen la máxima consistencia a largo plazo (ver §6).

### Gaps
- No verifiqué las políticas oficiales de retiro de voces de Google Cloud TTS, Azure ni Polly.
- No investigué el historial de cambios de modelos y voces de ElevenLabs.

## 6. Comparación breve con modelos open-source ejecutados en local

### Takeaway
Los modelos locales cuestan US$0 por uso, no tienen cuotas ni licencias que dependan del nivel y congelan los pesos, así que la consistencia es perfecta. Las licencias varían: Kokoro, Chatterbox, Qwen3-TTS (Apache 2.0, con español) y NVIDIA Magpie TTS Multilingual (permite uso comercial, con español) se pueden usar comercialmente. XTTS-v2 (CPML), la variante abierta de Fish Speech (CC-BY-NC-SA) y F5-TTS (reportado como no comercial) no. No encontré ninguna comparación de calidad en español entre modelos locales y voces en la nube.

### Cited Findings
- Según resúmenes de 2026 (no verifiqué la atribución exacta modelo por modelo):
  - Kokoro: Apache 2.0.
  - Chatterbox: MIT/Apache, con clonación multilingüe.
  - Qwen3-TTS: Alibaba lo publicó el 22 de enero de 2026 en tamaños 0,6B y 1,7B, con licencia Apache 2.0 y 10 idiomas, incluido el español.
  - NVIDIA Magpie TTS Multilingual: 357M parámetros, NVIDIA Open Model License (permite uso comercial); la versión de julio de 2026 cubre 12 idiomas, incluido el español.
  - Fuentes — [Pinggy](https://pinggy.io/blog/best_open_source_self_hosted_text_to_speech_models/); [MicDrop](https://micdrop.dev/blog/top-open-source-text-to-speech-models); [D-Central](https://d-central.tech/local-voice-ai-models/); [OpenVoxAI](https://openvoxai.com/blog/best-free-local-tts-models-2026)
- XTTS-v2 usa la Coqui Public Model License, que es no comercial. Como Coqui cerró, no hay a quién comprarle una licencia comercial — [PromptQuorum](https://www.promptquorum.com/power-local-llm/local-tts-voice-cloning-piper-coqui-xtts)
- La variante abierta de Fish Speech es CC-BY-NC-SA-4.0 (no comercial) y F5-TTS figura como no comercial. La licencia de Piper aparece de forma inconsistente (GPL-3.0 desde 2025 frente a MIT en el repositorio archivado) — [MicDrop](https://micdrop.dev/blog/top-open-source-text-to-speech-models); [Pinggy](https://pinggy.io/blog/best_open_source_self_hosted_text_to_speech_models/); [D-Central](https://d-central.tech/local-voice-ai-models/)

### Inferences
- Para la calidad lista para usar en español latino, una voz en la nube como Chirp 3 HD probablemente supera a los modelos locales pequeños sin ajuste. Lo local gana en consistencia, en control (clonar o diseñar una voz propia para Kori) y en certeza de licencia cuando es Apache o MIT.
- Un esquema híbrido es razonable: nube gratis (Google) para Nico y modelo local comercial para Kori, o al revés. Así se reduce la dependencia de un único proveedor.

### Gaps
- No hay pruebas de MOS ni pruebas ciegas en español entre modelos locales y nube.
- No confirmé que Kokoro tenga voces en español en estas fuentes.
- El análisis a fondo de los modelos locales corresponde a otra línea de investigación.
