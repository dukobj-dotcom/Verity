# Guía de AUDIO — VERITY ONLINE

> Tú generas los audios y los colocas manualmente. Aquí tienes **qué dice cada
> uno, en qué modo/tono, dónde va el archivo, y el JSON exacto para registrarlo.**

---

## ⚠️ Formato importante

Minecraft Bedrock **no reproduce MP4** (eso es video). Para sonidos usa
**`.ogg`** (recomendado) o `.wav`. Exporta tus audios como **`.ogg`**.

- Carpeta de archivos: `VERITY ONLINE [RP]/sounds/pntmcverity/`
- Registro de sonidos: `VERITY ONLINE [RP]/sounds/sound_definitions.json`

> Las mecánicas nuevas **ya funcionan** reutilizando sonidos existentes. Estos
> audios son **opcionales**: le dan voz propia a las reacciones nuevas. Cuando
> agregues los que quieras, avísame y **conecto cada `id` en el código** para que
> suenen en el momento exacto (hoy las líneas nuevas salen como texto en el chat).

---

## 1) Cómo registrar un sonido (ejemplo)

Coloca `mi_audio.ogg` en `sounds/pntmcverity/` y añade en `sound_definitions.json`:

```json
"pntmc.verity.vo_taunt_1": {
  "category": "neutral",
  "sounds": [{ "name": "sounds/pntmcverity/vo_taunt_1", "volume": 1.0, "stream": true }]
}
```
(El `name` va **sin** la extensión `.ogg`.)

---

## 2) Líneas sugeridas para grabar

Idioma: **Español** (voz de Verity). Todas las rutas son dentro de
`VERITY ONLINE [RP]/sounds/pntmcverity/`.

### 🟣 Al ser LANZADA — Burla (modo: burlón, divertido, condescendiente)
| ID de sonido | Archivo | Línea | Modo |
|---|---|---|---|
| `pntmc.verity.vo_taunt_1` | `vo_taunt_1.ogg` | "¿En serio? ¿Vas a lanzarme como un juguete?" | burlona, entre risas |
| `pntmc.verity.vo_taunt_2` | `vo_taunt_2.ogg` | "Jajaja… qué infantil. Me encanta." | risita cruel |
| `pntmc.verity.vo_taunt_3` | `vo_taunt_3.ogg` | "¿Eso es todo lo que tienes?" | provocadora |

### 🔴 Al ser LANZADA — Amenaza (modo: seria, grave, contenida)
| ID de sonido | Archivo | Línea | Modo |
|---|---|---|---|
| `pntmc.verity.vo_threat_1` | `vo_threat_1.ogg` | "Hazlo otra vez. Te reto." | fría, retadora |
| `pntmc.verity.vo_threat_2` | `vo_threat_2.ogg` | "Vas a desear no haber hecho eso." | grave, lenta |
| `pntmc.verity.vo_threat_3` | `vo_threat_3.ogg` | "La próxima vez que aterrice, no aterrizaré sola." | susurro amenazante |

### 👁️ Reaparece DETRÁS de ti (modo: cercana, íntima, inquietante)
| ID de sonido | Archivo | Línea | Modo |
|---|---|---|---|
| `pntmc.verity.vo_behind_1` | `vo_behind_1.ogg` | "Detrás de ti. Siempre detrás de ti." | susurro al oído |
| `pntmc.verity.vo_behind_2` | `vo_behind_2.ogg` | "¿Me buscabas? Aquí estoy." | dulce y perturbadora |
| `pntmc.verity.vo_behind_3` | `vo_behind_3.ogg` | "¿Creíste que me habías tirado? Adorable." | condescendiente |

### 🌫️ Director de horror — Susurros ambientales (modo: susurro lejano, casi inaudible)
| ID de sonido | Archivo | Línea | Modo |
|---|---|---|---|
| `pntmc.verity.vo_whisper_1` | `vo_whisper_1.ogg` | "Te veo…" | susurro, eco |
| `pntmc.verity.vo_whisper_2` | `vo_whisper_2.ogg` | "No estás solo." | susurro frío |
| `pntmc.verity.vo_whisper_3` | `vo_whisper_3.ogg` | "Cuento tus pasos." | monótona, inquietante |
| `pntmc.verity.vo_whisper_4` | `vo_whisper_4.ogg` | "La noche es mía." | grave, posesiva |

### 💀 Momentos intensos (modo: fuerte, agresivo / jumpscare)
| ID de sonido | Archivo | Línea | Modo |
|---|---|---|---|
| `pntmc.verity.vo_rage_1` | `vo_rage_1.ogg` | "¡No vuelvas a tocarme!" | grito de rabia |
| `pntmc.verity.vo_rage_2` | `vo_rage_2.ogg` | "¡MÍO! ¡Todo esto es MÍO!" | distorsionada, intensa |

---

## 3) Bloque JSON listo para pegar

Cuando tengas los `.ogg`, pega esto **dentro** del objeto `sound_definitions`
de `sound_definitions.json` (ajusta cuáles incluyes):

```json
"pntmc.verity.vo_taunt_1":  { "category": "neutral", "sounds": [{ "name": "sounds/pntmcverity/vo_taunt_1",  "volume": 1.0, "stream": true }] },
"pntmc.verity.vo_taunt_2":  { "category": "neutral", "sounds": [{ "name": "sounds/pntmcverity/vo_taunt_2",  "volume": 1.0, "stream": true }] },
"pntmc.verity.vo_taunt_3":  { "category": "neutral", "sounds": [{ "name": "sounds/pntmcverity/vo_taunt_3",  "volume": 1.0, "stream": true }] },
"pntmc.verity.vo_threat_1": { "category": "neutral", "sounds": [{ "name": "sounds/pntmcverity/vo_threat_1", "volume": 1.0, "stream": true }] },
"pntmc.verity.vo_threat_2": { "category": "neutral", "sounds": [{ "name": "sounds/pntmcverity/vo_threat_2", "volume": 1.0, "stream": true }] },
"pntmc.verity.vo_threat_3": { "category": "neutral", "sounds": [{ "name": "sounds/pntmcverity/vo_threat_3", "volume": 1.0, "stream": true }] },
"pntmc.verity.vo_behind_1": { "category": "neutral", "sounds": [{ "name": "sounds/pntmcverity/vo_behind_1", "volume": 1.0, "stream": true }] },
"pntmc.verity.vo_behind_2": { "category": "neutral", "sounds": [{ "name": "sounds/pntmcverity/vo_behind_2", "volume": 1.0, "stream": true }] },
"pntmc.verity.vo_behind_3": { "category": "neutral", "sounds": [{ "name": "sounds/pntmcverity/vo_behind_3", "volume": 1.0, "stream": true }] },
"pntmc.verity.vo_whisper_1":{ "category": "ambient", "sounds": [{ "name": "sounds/pntmcverity/vo_whisper_1","volume": 0.6, "stream": true }] },
"pntmc.verity.vo_whisper_2":{ "category": "ambient", "sounds": [{ "name": "sounds/pntmcverity/vo_whisper_2","volume": 0.6, "stream": true }] },
"pntmc.verity.vo_whisper_3":{ "category": "ambient", "sounds": [{ "name": "sounds/pntmcverity/vo_whisper_3","volume": 0.6, "stream": true }] },
"pntmc.verity.vo_whisper_4":{ "category": "ambient", "sounds": [{ "name": "sounds/pntmcverity/vo_whisper_4","volume": 0.6, "stream": true }] },
"pntmc.verity.vo_rage_1":   { "category": "neutral", "sounds": [{ "name": "sounds/pntmcverity/vo_rage_1",   "volume": 1.0, "stream": true }] },
"pntmc.verity.vo_rage_2":   { "category": "neutral", "sounds": [{ "name": "sounds/pntmcverity/vo_rage_2",   "volume": 1.0, "stream": true }] }
```

Cuando los tengas puestos, dime **cuáles** grabaste y **conecto cada uno** en
`verity_online.js` para que suenen exactamente en su reacción.

---

## v3.1.0 — personalidad relacional

Los IDs siguientes ya están registrados. Coloca cada `.ogg` exactamente en
`VERITY ONLINE [RP]/sounds/pntmcverity/`; si aún no existe, Minecraft lo omite
sin romper el addon.

| ID | Archivo | Línea y tono |
|---|---|---|
| `pntmc.verity.vo_hurt_1` | `vo_hurt_1.ogg` | “No tenías que hacer eso... pero confío en que me recogerás.” — dolida, cariñosa |
| `pntmc.verity.vo_mood_friendly_1` | `vo_mood_friendly_1.ogg` | “Me gusta cuando me hablas.” — cálida |
| `pntmc.verity.vo_mood_neutral_1` | `vo_mood_neutral_1.ogg` | “Te escucho. ¿Qué tienes en mente?” — serena |
| `pntmc.verity.vo_mood_annoyed_1` | `vo_mood_annoyed_1.ogg` | “No olvidé cómo me trataste.” — contenida |
| `pntmc.verity.vo_mood_hostile_1` | `vo_mood_hostile_1.ogg` | “No finjas que somos amigos.” — fría y amenazante |
