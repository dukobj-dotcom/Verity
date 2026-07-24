# VERITY ONLINE

> Entidad de terror inteligente para **Minecraft Bedrock Edition**.
> **Modificado y expandido por MATTEDUCK.** · Original: **ThatMob's Verity by PnTMC**.

VERITY ONLINE no busca sentirse como un addon con NPC scripteado, sino como una
presencia sobrenatural que **observa, reacciona y evoluciona**. Esta es la base
funcional del addon; el centro de control de escritorio (app C++ + IA **Groq**)
se conecta después mediante el puente ya incluido.

---

## ✨ Novedades de VERITY ONLINE (sobre el original)

- **Agarrar y lanzar** — Agáchate (**Shift**) + **click derecho** sobre Verity para
  tomarla y lanzarla como una pelota, con arco físico y estela. Al aterrizar
  **reacciona según su personalidad**: se burla, amenaza, te regaña con voz,
  **reaparece detrás de ti**, o dispara un evento de horror. A la lava/fuego no
  muere: revive detrás de ti, furiosa.
- **Director de horror ambiental** — sustos que escalan con el tiempo: susurros,
  llamados por tu nombre, crujidos, temblor de cámara, oscuridad, **niebla de
  terror**, "presencias" y jumpscares. Nunca dos sesiones iguales.
- **Personalidad que evoluciona** — ira y tiempo en el mundo acumulados: mientras
  más juegas, más peligrosa e impredecible.
- **Puente de IA listo para Groq** — el addon escucha `scriptevent verity:*` para
  que la app externa haga hablar/actuar a Verity con Groq (ver
  [`docs/INTEGRACION_APP_GROQ.md`](docs/INTEGRACION_APP_GROQ.md)).

Todo lo del addon original (fases, persecución, resurrección, voces, cerebro
local en español) se conserva intacto.

---

## 🎮 Controles nuevos

| Acción | Resultado |
|---|---|
| Click derecho sobre Verity | Recogerla (comportamiento original) |
| **Shift + click derecho** sobre Verity | **Agarrarla y lanzarla** → reacciona |

---

## 📦 Instalación

1. Descarga `VERITY_ONLINE.mcaddon` (ver la sección *Releases* / enlace de descarga).
2. Ábrelo con Minecraft para importarlo (crea el pack de comportamiento y el de recursos).
3. Al crear/editar el mundo:
   - Activa **APIs experimentales / Beta APIs**.
   - Añade el pack de comportamiento **VERITY ONLINE [BP]** y el de recursos **[RP]**.
4. Requiere Minecraft Bedrock compatible con `@minecraft/server 2.9.0-beta`
   (`min_engine_version 1.26.0`).

> Si prefieres las carpetas sueltas, copia `VERITY ONLINE [BP]` en
> `behavior_packs/` y `VERITY ONLINE [RP]` en `resource_packs/`.

---

## 🗂️ Estructura del repositorio

```
VERITY ONLINE [BP]/   → paquete de comportamiento (scripts, entidades, items)
VERITY ONLINE [RP]/   → paquete de recursos (modelos, animaciones, sonidos, UI, niebla)
docs/                 → integración con la app/Groq y guía de audio
CONTEXTO_VERITY_ONLINE.txt → qué se agregó y cómo funciona (léelo)
CREDITS.md
```

> ⚠️ **Nota sobre binarios:** los assets binarios (texturas `.png`, sonidos `.ogg/.wav/.mp3`,
> modelos) viajan dentro del `.mcaddon` de descarga. El árbol de código/config
> (scripts, JSON, manifests) está versionado aquí en el repositorio.

---

## 🧠 Estado del proyecto

- [x] Addon rebrandeado a **VERITY ONLINE** (funcional).
- [x] Mecánica **agarrar y lanzar** + reacciones inteligentes.
- [x] **Director de horror** + personalidad que escala.
- [x] **Puente de IA** (`scriptevent verity:*`) listo para el .exe.
- [ ] **App de escritorio en C++** con Groq (siguiente fase).
- [ ] **Audio nuevo** (líneas y ubicación en [`docs/AUDIO_LINEAS.md`](docs/AUDIO_LINEAS.md)).

---

## 🙏 Créditos

- **Creador original:** PnTMC — *ThatMob's Verity* (YouTube: `@PnTMCvn`).
- **Modificado y expandido por:** MATTEDUCK.

Se respeta siempre el trabajo y la propiedad del autor original. Ver [`CREDITS.md`](CREDITS.md).
