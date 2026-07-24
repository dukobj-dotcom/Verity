# VERITY ONLINE

## v3.1.0 — personalidad relacional

Verity inicia amable (afinidad 85/100) con cada jugador. Hablarle la recupera;
insultarla, golpearla, lanzarla o mandarla a lava/vacío la vuelve neutral,
molesta u hostil. El director de horror casi no actúa mientras está amable.
Cuando la app manda `scriptevent verity:online` cada pocos segundos, Groq tiene
prioridad sobre el diálogo; al faltar 10 segundos de latido vuelve el diálogo
local. `verity:offline` lo desactiva de inmediato.

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
| **Shift + usar** el objeto de Verity (en la mano) | **Lanzarla con gravedad** desde la mano |

> Bedrock no permite detectar el *click izquierdo al aire* por script, por eso el
> lanzamiento desde la mano usa **Shift + click derecho (usar objeto)**, que es fiable.

### 🧪 Comandos de prueba (chat)

`!vohelp` · `!voscare` · `!vojumpscare` · `!voapparition` · `!vothrow` · `!vobehind` · `!vofog` · `!vodark` · `!vofoot` · `!voflicker` · `!voanger <0-100>` · `!vostate`

### 🌊 Sin debilidades

Verity **no muere** por nada (vacío, `/kill`, caída…), **no se despawnea** (se queda contigo), y **nada en el agua** en forma normal y en modo terror.

---

## ⬇️ Descarga del addon funcional

**`.mcaddon` listo para instalar:**
https://pub.hyperagent.com/api/published/pbf01KY8XN3WX_T2ZCGZ4917PAZJN3/VERITY_ONLINE.mcaddon

> Contiene TODO (código + texturas + sonidos + modelos). El repositorio versiona
> el código y la configuración; los binarios y el modelo grande del monstruo
> viajan dentro del `.mcaddon`.

## 📦 Instalación

1. Descarga `VERITY_ONLINE.mcaddon` desde el enlace de arriba.
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
