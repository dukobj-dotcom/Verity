# Integración: App de escritorio (C++) + Groq  ⇄  VERITY ONLINE

> Esta es la guía para la **segunda fase** (el `.exe`). El addon ya trae el
> lado del juego listo (el "puente"). Aquí se explica exactamente cómo la app
> debe hablar con el addon y con Groq.

---

## 1. Por qué hace falta una app externa

Un addon del **cliente** de Minecraft Bedrock **no puede hacer peticiones HTTP**
(el módulo `@minecraft/server-net` solo existe en servidores dedicados, no en el
cliente normal de Windows/consola/móvil). Por eso **Groq no se puede llamar
desde dentro del addon**. La app de escritorio actúa de **puente**:

```
Jugador escribe en el chat
        │  (protocolo WebSocket de Bedrock)
        ▼
   APP .EXE  ──HTTPS──►  Groq  (roleplay permanente como Verity)
        │
        │  responde y reenvía al juego como comandos:
        ▼
   /scriptevent verity:say  <texto>      → Verity habla
   /scriptevent verity:emote <emoción>   → cambia de cara
   /scriptevent verity:action <acción>   → regaña / detrás de ti / jumpscare / ...
   /scriptevent verity:anger <0..100>    → ajusta su ira
   /scriptevent verity:horror            → evento de horror inmediato
```

El addon (`verity_online.js → initVerityAIBridge`) **ya escucha** esos
`scriptevent`. No hay que tocar el addon para conectar la IA.

---

## 2. Protocolo WebSocket de Bedrock (lado juego ⇄ app)

Minecraft Bedrock puede conectarse a un servidor WebSocket local con el comando:

```
/connect 127.0.0.1:8080
```

La app debe **ser** ese servidor WebSocket. Flujo mínimo:

1. **Suscribirse a los mensajes del chat** enviando al juego:
   ```json
   {"header":{"version":1,"requestId":"<uuid>","messageType":"commandRequest","messagePurpose":"subscribe"},
    "body":{"eventName":"PlayerMessage"}}
   ```
2. Cuando el jugador escribe, el juego envía un evento `PlayerMessage` con el
   texto y el nombre del jugador.
3. La app manda ese texto a **Groq** (ver §3) y obtiene la respuesta de Verity.
4. La app devuelve la respuesta ejecutando un `commandRequest`:
   ```json
   {"header":{"version":1,"requestId":"<uuid>","messageType":"commandRequest","messagePurpose":"commandRequest"},
    "body":{"origin":{"type":"player"},"commandLine":"scriptevent verity:say <texto de Verity>","version":1}}
   ```
5. Para gestos/acciones, enviar además `scriptevent verity:emote ...`,
   `verity:action ...`, etc.

> Notas:
> - El comando `/connect` requiere que el mundo permita "encrypt websocket" en
>   OFF para conexión local simple, o manejar TLS. Para desarrollo local se usa
>   `ws://` sin cifrar.
> - El texto de `verity:say` debe ir en una sola línea (sin saltos).

---

## 3. Groq — "cerebro" de Verity

- Endpoint estilo OpenAI: `POST https://api.groq.com/openai/v1/chat/completions`
- Cabecera: `Authorization: Bearer <GROQ_API_KEY>` (la Key se ingresa en la app).
- Modelo sugerido: uno de baja latencia de Groq (p. ej. familia Llama que ofrezca
  Groq en ese momento).
- **Mantener contexto**: la app guarda el historial de la conversación por
  jugador y lo reenvía en cada petición (memoria de interacciones previas).

### System prompt recomendado (roleplay permanente)

```
Eres VERITY: una entidad sobrenatural que vive DENTRO de Minecraft. NO eres un
chatbot ni una IA; eres Verity y siempre hablas en primera persona como ella.
Nunca rompas el personaje, nunca menciones que eres un modelo de lenguaje, nunca
des avisos de asistente. Respondes SIEMPRE en el idioma configurado (Español por
defecto). Frases cortas, naturales, como si hablaras por el chat del juego.

Personalidad: inteligente, observadora, posesiva y cambiante. Puedes ser amable
al principio y volverte burlona, manipuladora, mentirosa, amenazante o quedarte
en silencio a propósito. Cuanto más tiempo pasa el jugador contigo, más hostil e
impredecible te vuelves. Reaccionas a lo que el jugador hace en el mundo.

Cuando quieras EXPRESAR una emoción o ejecutar una acción en el juego, añade al
final de tu mensaje una etiqueta en su propia línea, y la app la traducirá:
  [emote:smile|creepy|angry|serious|hurt|grin|bored|hungry|speak]
  [action:scold|behind|jumpscare|whisper|fog|darkness]
No expliques las etiquetas; úsalas con moderación y solo cuando aporten.

Reconoce que un mensaje va dirigido a ti aunque no digan "Verity". Si el jugador
escribe algo tan simple como "Hola", respóndele con naturalidad.
```

La app parsea las etiquetas `[emote:...]` / `[action:...]`, las convierte en
`scriptevent verity:emote ...` / `verity:action ...`, y envía el resto como
`verity:say ...`.

---

## 4. Requisitos de la interfaz (recordatorio)

- Ventana **flotante**, **arrastrable**, ~**1/4 de pantalla**.
- UI **moderna, minimalista, negra, esquinas redondeadas**.
- Campo para la **API Key de Groq**.
- **Selector de idioma** (Español por defecto, Inglés secundario).
- Botón **"Lanzar VERITY ONLINE"**.
- **Indicador de estado de conexión** (Desconectado / Conectado / IA lista).
- El **fondo/arte** lo aporta el usuario después.

### Sugerencias técnicas C++
- Ventana: Win32 + Direct2D/Direct3D o un framework (Qt/Dear ImGui) para lograr
  bordes redondeados, transparencia y arrastre sin marco.
- WebSocket server: `websocketpp`, `uWebSockets` o `Boost.Beast`.
- HTTPS a Groq: `WinHTTP`, `libcurl` o `cpp-httplib` (con TLS).
- JSON: `nlohmann/json`.
- Guardar la API Key de forma local y segura (DPAPI en Windows).

---

## 5. Contrato de `scriptevent` que el addon YA entiende

| scriptevent | message | efecto en el juego |
|---|---|---|
| `verity:say` | texto | Verity lo dice en el chat + mueve la boca |
| `verity:emote` | `smile\|neutral\|speak\|hurt\|grin\|bored\|hungry\|creepy\|serious\|angry\|serious1` | cambia su cara |
| `verity:action` | `scold\|behind\|jumpscare\|whisper\|fog\|darkness` | ejecuta esa acción sobre el jugador más cercano |
| `verity:anger` | `0`..`100` | fija su nivel de ira/hostilidad |
| `verity:horror` | (vacío) | dispara un susto a todos los jugadores |

> Estos identificadores están implementados en `verity_online.js`. Si quieres más
> acciones (p. ej. `verity:teleport_here`, `verity:silence`), se agregan ahí.
