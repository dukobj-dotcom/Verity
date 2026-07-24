/**
 * VERITY ONLINE — módulo de expansión
 * Modificado y expandido por MATTEDUCK.
 * Original: ThatMob's Verity by PnTMC.
 *
 * Este módulo AÑADE, sin reescribir el núcleo original:
 *   1) Mecánica "agarrar y lanzar" (Shift + click derecho sobre Verity).
 *   2) Reacciones inteligentes al ser lanzada (burla / amenaza / regaño con voz /
 *      reaparición detrás del jugador / evento de horror). Reutiliza el sistema
 *      de regaño y de reaparición ya existentes.
 *   3) Un "director de horror" ambiental que escala con el tiempo en el mundo:
 *      susurros, sonidos, oscuridad, niebla, temblor de cámara y mensajes.
 *   4) Un PUENTE DE IA (scriptevent) listo para la app de escritorio + Groq.
 *      La app externa (el .exe) escuchará el chat por WebSocket, consultará a
 *      Groq y devolverá la respuesta al juego con:
 *          /scriptevent verity:say   <texto que dice Verity>
 *          /scriptevent verity:emote <smile|creepy|angry|serious|hurt|grin|bored|hungry|speak>
 *          /scriptevent verity:action <scold|behind|jumpscare|whisper|fog|darkness>
 *          /scriptevent verity:anger  <0..100>
 *          /scriptevent verity:horror
 *      Así Groq controla a Verity como si estuviera viva dentro de Minecraft.
 */

import { Player, system, world } from "@minecraft/server";
import { verityReply } from "./verity_ai.js";
import { triggerScoldSequence, getPositionBehindPlayer, registerVerityballOwner } from "./verity_resurrection.js";
import { disableVerityballFollow } from "./verity_ball_follow.js";
import { applyBallFace, applyPhaseFaces, getVerityPhase, PHASE } from "./verity_phases.js";
import { animateTalkPulse } from "./verity_anim.js";
import { playVerityVoice } from "./verity_voices.js";
import {
	FACE_SMILE,
	FACE_SPEAK,
	FACE_HURT,
	FACE_ABNORMAL_OPEN,
	FACE_BORED_P2,
	FACE_DAY2_OPEN,
	FACE_CREEPY_SMILE,
	FACE_SERIOUS_1,
	FACE_SERIOUS_2,
	FACE_SERIOUS_3,
} from "./verity_faces.js";

const VERITYBALL_ID = "pntmc:verityball";

/* ============================================================
 * ESTADO PERSISTENTE (ira / tiempo en el mundo)
 * ============================================================ */
const ANGER_PROP = "pntmc:vo_anger";       // 0..100
const PLAYTIME_PROP = "pntmc:vo_playtime";  // "minutos" aproximados en el mundo

/** @returns {number} */
function getAnger() {
	const v = world.getDynamicProperty(ANGER_PROP);
	return typeof v === "number" ? v : 0;
}
/** @param {number} n */
function setAnger(n) {
	const clamped = Math.max(0, Math.min(100, n));
	try { world.setDynamicProperty(ANGER_PROP, clamped); } catch { /* ignore */ }
	return clamped;
}
/** @param {number} d */
function bumpAnger(d) { return setAnger(getAnger() + d); }

/** @returns {number} */
function getPlaytime() {
	const v = world.getDynamicProperty(PLAYTIME_PROP);
	return typeof v === "number" ? v : 0;
}

/**
 * Nivel de hostilidad global 0..1 (crece con el tiempo y la ira).
 * A mayor nivel: eventos más frecuentes e intensos, reacciones más agresivas.
 */
function getHostility() {
	const timeFactor = Math.min(1, getPlaytime() / 180); // ~3h de juego = máximo por tiempo
	const angerFactor = getAnger() / 100;
	return Math.max(0, Math.min(1, timeFactor * 0.55 + angerFactor * 0.65));
}

/* ============================================================
 * UTILIDADES SEGURAS (todo envuelto en try/catch)
 * ============================================================ */
const DIMENSIONS = ["minecraft:overworld", "minecraft:nether", "minecraft:the_end"];

/** @param {import("@minecraft/server").Entity} ball @param {number} face */
function safeFace(ball, face) {
	try { if (ball?.isValid) ball.setProperty("pntmc:face_index", face); } catch { /* ignore */ }
}

/** @param {import("@minecraft/server").Player} player @param {string} soundId @param {number} [vol] @param {number} [pitch] */
function safeSound(player, soundId, vol = 1, pitch = 1) {
	try { player.playSound(soundId, { location: player.location, volume: vol, pitch }); } catch { /* ignore */ }
}

/**
 * Sonido POSICIONAL alrededor del jugador (más realista: viene de una dirección,
 * a veces de detrás). Da la sensación de que "algo" se movió cerca.
 * @param {import("@minecraft/server").Player} player @param {string} soundId @param {number} [vol] @param {number} [pitch]
 */
function soundAround(player, soundId, vol = 0.6, pitch = 1) {
	try {
		const ang = Math.random() * Math.PI * 2;
		const dist = 1.6 + Math.random() * 2.8;
		const loc = {
			x: player.location.x + Math.cos(ang) * dist,
			y: player.location.y + Math.random() * 1.6,
			z: player.location.z + Math.sin(ang) * dist,
		};
		player.playSound(soundId, { location: loc, volume: vol, pitch });
	} catch { /* ignore */ }
}

/**
 * @param {import("@minecraft/server").Vector3} loc
 * @param {import("@minecraft/server").Dimension} dim
 */
function nearestPlayerTo(loc, dim) {
	let best = Infinity, nearest;
	try {
		for (const p of dim.getPlayers()) {
			const dx = p.location.x - loc.x, dy = p.location.y - loc.y, dz = p.location.z - loc.z;
			const d = dx * dx + dy * dy + dz * dz;
			if (d < best) { best = d; nearest = p; }
		}
	} catch { /* ignore */ }
	return nearest;
}

/** Altura por debajo de la cual consideramos "vacío" en cada dimensión. */
function voidFloorFor(dimId) {
	if (dimId === "minecraft:the_end") return -8;
	if (dimId === "minecraft:nether") return -30;
	return -58; // overworld (límite de construcción -64)
}

/** @param {import("@minecraft/server").Player} player @param {string} text */
function actionbar(player, text) {
	try { player.onScreenDisplay.setActionBar(text); } catch { /* ignore */ }
}

/** @param {import("@minecraft/server").Player} player @param {string} cmd */
function safeCmd(player, cmd) {
	try { player.runCommand(cmd); } catch { /* ignore */ }
}

/** Devuelve la verityball válida más cercana a cualquier jugador (o la primera válida). */
function scanVerityball() {
	let fallback;
	for (const dimId of DIMENSIONS) {
		let dim;
		try { dim = world.getDimension(dimId); } catch { continue; }
		let list;
		try { list = dim.getEntities({ type: VERITYBALL_ID }); } catch { continue; }
		for (const ball of list) {
			if (!ball.isValid) continue;
			fallback = ball;
			for (const p of dim.getPlayers()) {
				const dx = p.location.x - ball.location.x;
				const dz = p.location.z - ball.location.z;
				if (dx * dx + dz * dz < 48 * 48) return ball;
			}
		}
	}
	return fallback;
}

/**
 * Verity habla: chat + animación de boca (+ voz opcional).
 * @param {import("@minecraft/server").Entity|undefined} ball
 * @param {string} line
 * @param {{ scold?: boolean, voice?: string|null }} [opts]
 */
function say(ball, line, opts = {}) {
	try { verityReply(line); } catch { /* ignore */ }
	if (ball?.isValid) {
		try {
			animateTalkPulse(ball, line, opts.scold ? { scoldTier: "heavy", fast: true } : {});
		} catch { /* ignore */ }
		if (opts.voice) { try { playVerityVoice(ball, opts.voice); } catch { /* ignore */ } }
	}
}

/** @param {string[]} arr */
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* ============================================================
 * 1) MECÁNICA: AGARRAR Y LANZAR  (Shift + click derecho)
 * ============================================================ */
const inFlight = new Set();   // ids de bolas en vuelo (evita doble disparo)
const grabCooldown = new Set();

const HAZARD_BLOCKS = new Set([
	"minecraft:lava", "minecraft:flowing_lava", "minecraft:fire", "minecraft:soul_fire",
]);

/**
 * Punto de entrada llamado desde main.js cuando el jugador está agachado (sneaking)
 * e interactúa con la verityball. Hace el "agarre" + lanzamiento.
 * @param {import("@minecraft/server").Entity} ball
 * @param {import("@minecraft/server").Player} player
 */
export function handleSneakThrow(ball, player) {
	if (!ball?.isValid || ball.typeId !== VERITYBALL_ID) return;
	if (!(player instanceof Player) || !player.isValid) return;
	if (inFlight.has(ball.id) || grabCooldown.has(ball.id)) return;

	// No se puede agarrar si está sin cara o en modo persecución.
	try {
		if (ball.getProperty("pntmc:faceless") === true) return;
		if (ball.getProperty("pntmc:chase_face") === true) return;
	} catch { /* ignore */ }

	grabCooldown.add(ball.id);
	system.runTimeout(() => grabCooldown.delete(ball.id), 20);

	// Wind-up: susto breve + sonido, luego lanza.
	try { disableVerityballFollow(ball); } catch { /* ignore */ }
	safeFace(ball, FACE_HURT);
	safeSound(player, "pntmc.verity.whosthere", 0.7, 1.3);

	system.runTimeout(() => throwVerityball(ball, player), 4);
}

/**
 * Lanzar a Verity DESDE LA MANO (cuando la tienes como objeto en la mano).
 * La invoca como bola justo frente al jugador y la lanza con gravedad, igual
 * que el lanzamiento desde el piso. Llamada desde main.js al usar el objeto
 * mientras vas agachado (Shift). Devuelve true si se lanzó.
 * @param {import("@minecraft/server").Player} player
 * @param {number} [faceIndex]
 * @returns {boolean}
 */
export function throwVerityFromHand(player, faceIndex) {
	if (!(player instanceof Player) || !player.isValid) return false;
	let view;
	try { view = player.getViewDirection(); } catch { view = { x: 0, y: 0.1, z: 1 }; }
	const pos = {
		x: player.location.x + view.x * 0.7,
		y: player.location.y + 1.3,
		z: player.location.z + view.z * 0.7,
	};
	let ball;
	try { ball = player.dimension.spawnEntity(VERITYBALL_ID, pos); }
	catch (err) { console.warn(`VERITY ONLINE throwFromHand spawn: ${err}`); return false; }
	try {
		if (typeof faceIndex === "number") applyBallFace(ball, faceIndex, false);
		else applyPhaseFaces(ball);
	} catch { try { applyPhaseFaces(ball); } catch { /* ignore */ } }
	try { registerVerityballOwner(ball, player); } catch { /* ignore */ }
	safeSound(player, "pntmc.verity.whosthere", 0.7, 1.2);
	throwVerityball(ball, player);
	return true;
}

/**
 * @param {import("@minecraft/server").Entity} ball
 * @param {import("@minecraft/server").Player} player
 */
function throwVerityball(ball, player) {
	if (!ball?.isValid || inFlight.has(ball.id)) return;
	inFlight.add(ball.id);

	let dir;
	try { dir = player.getViewDirection(); } catch { dir = { x: 0, y: 0.2, z: 1 }; }

	const power = 1.15;
	let vx = dir.x * power;
	let vy = dir.y * power + 0.55;
	let vz = dir.z * power;
	const gravity = 0.055;
	const maxTicks = 90;
	let t = 0;

	const runId = system.runInterval(() => {
		if (!ball.isValid) { system.clearRun(runId); inFlight.delete(ball.id); return; }
		t++;
		vy -= gravity;

		const cur = ball.location;
		const nx = cur.x + vx, ny = cur.y + vy, nz = cur.z + vz;
		const dim = ball.dimension;

		// VERITY ONLINE: si el lanzamiento la manda al VACÍO, rescatarla. Nunca muere.
		if (ny < voidFloorFor(dim.id)) {
			system.clearRun(runId); inFlight.delete(ball.id);
			rescueFromVoid(ball, dim);
			return;
		}

		let hereBlk;
		try { hereBlk = dim.getBlock({ x: Math.floor(nx), y: Math.floor(ny), z: Math.floor(nz) }); } catch { /* ignore */ }

		// Peligro (lava/fuego): detener el arco y dejar que el sistema de resurrección
		// existente la reviva detrás del jugador y la haga enfurecer.
		if (hereBlk && HAZARD_BLOCKS.has(hereBlk.typeId)) {
			try { ball.teleport({ x: nx, y: ny, z: nz }); } catch { /* ignore */ }
			system.clearRun(runId); inFlight.delete(ball.id);
			bumpAnger(9);
			return;
		}

		const solidHere = hereBlk && !hereBlk.isAir && !hereBlk.isLiquid;
		if (solidHere || t >= maxTicks) {
			system.clearRun(runId); inFlight.delete(ball.id);
			system.runTimeout(() => onThrowLand(ball, player), 3);
			return;
		}

		try { ball.teleport({ x: nx, y: ny, z: nz }); } catch { /* ignore */ }

		// Estela de partículas + giro visual.
		if (t % 2 === 0) {
			try { dim.spawnParticle("minecraft:basic_smoke_particle", { x: nx, y: ny + 0.1, z: nz }); } catch { /* ignore */ }
		}
	}, 1);

	// Seguridad: nunca dejar un intervalo colgado.
	system.runTimeout(() => {
		if (inFlight.has(ball.id)) { system.clearRun(runId); inFlight.delete(ball.id); }
	}, maxTicks + 25);
}

/**
 * Reacción al aterrizar tras ser lanzada. Se elige según la fase y la hostilidad.
 * @param {import("@minecraft/server").Entity} ball
 * @param {import("@minecraft/server").Player} player
 */
function onThrowLand(ball, player) {
	if (!ball?.isValid || !player?.isValid) return;

	bumpAnger(6);
	const hostility = getHostility();
	const phase = getVerityPhase();
	const name = player.name || "tú";

	// Reparto de reacciones ponderado por hostilidad (más hostil => más agresivo).
	const roll = Math.random();
	let mode;
	if (roll < 0.30 - hostility * 0.20) mode = "taunt";
	else if (roll < 0.55 - hostility * 0.10) mode = "threat";
	else if (roll < 0.78) mode = "scold";
	else if (roll < 0.92) mode = "behind";
	else mode = "horror";

	// En fases altas nunca es "linda".
	if (phase >= PHASE.THREE && mode === "taunt" && Math.random() < 0.6) mode = "threat";

	switch (mode) {
		case "taunt": {
			safeFace(ball, FACE_CREEPY_SMILE);
			say(ball, pick(TAUNT_LINES).replaceAll("${name}", name));
			restoreIdleFace(ball, 70);
			break;
		}
		case "threat": {
			safeFace(ball, FACE_SERIOUS_2);
			say(ball, pick(THREAT_LINES).replaceAll("${name}", name), { scold: true });
			restoreIdleFace(ball, 80);
			break;
		}
		case "scold": {
			// Reutiliza la secuencia de regaño con voz del addon original.
			try { triggerScoldSequence(ball, player); } catch { restoreIdleFace(ball, 60); }
			break;
		}
		case "behind": {
			reactTeleportBehind(ball, player);
			break;
		}
		case "horror": {
			safeFace(ball, FACE_SERIOUS_3);
			fireScare(player, Math.max(0.6, hostility), "thrown");
			say(ball, pick(THREAT_LINES).replaceAll("${name}", name), { scold: true });
			restoreIdleFace(ball, 90);
			break;
		}
	}
}

/**
 * La bola desaparece y reaparece justo detrás del jugador, enojada.
 * @param {import("@minecraft/server").Entity} ball
 * @param {import("@minecraft/server").Player} player
 */
function reactTeleportBehind(ball, player) {
	try {
		const pos = getPositionBehindPlayer(player);
		try { ball.dimension.spawnParticle("pntmc:verityopen", ball.location); } catch { /* ignore */ }
		ball.teleport(pos);
		safeFace(ball, FACE_SERIOUS_3);
		safeSound(player, "pntmc.verity.spotted", 1, 0.9);
		system.runTimeout(() => {
			if (!ball.isValid || !player.isValid) return;
			say(ball, pick(BEHIND_LINES).replaceAll("${name}", player.name || "tú"), { scold: true });
			restoreIdleFace(ball, 80);
		}, 8);
	} catch {
		try { triggerScoldSequence(ball, player); } catch { /* ignore */ }
	}
}

/** @param {import("@minecraft/server").Entity} ball @param {number} delay */
function restoreIdleFace(ball, delay) {
	system.runTimeout(() => { try { if (ball.isValid) applyPhaseFaces(ball); } catch { /* ignore */ } }, delay);
}

const TAUNT_LINES = [
	"¿En serio? ¿Vas a lanzarme como un juguete, ${name}?",
	"Jajaja... qué infantil. Me encanta.",
	"¿Eso es todo lo que tienes?",
	"Buen tiro. Lástima que no cambie nada.",
	"¿Te diviertes? Yo también... a tu costa, ${name}.",
	"Vuela lo que quieras. Siempre vuelvo.",
	"Aww, ¿jugamos a la pelota? Qué tierno.",
];
const THREAT_LINES = [
	"Hazlo otra vez. Te reto, ${name}.",
	"Cada vez que me lanzas, memorizo tu cara.",
	"Vas a desear no haber hecho eso.",
	"Sigue jugando. Yo también sé jugar... más fuerte.",
	"La próxima vez que aterrice, no aterrizaré sola.",
	"Toca tu suerte una vez más, ${name}.",
	"Me estás enseñando a odiarte. Aprendo rápido.",
];
const BEHIND_LINES = [
	"Detrás de ti. Siempre detrás de ti, ${name}.",
	"¿Me buscabas? Aquí estoy.",
	"No puedes lanzarme lo bastante lejos.",
	"Volví. Y esta vez estoy más cerca.",
	"¿Creíste que me habías tirado? Adorable.",
];

/* ============================================================
 * 2) DIRECTOR DE HORROR AMBIENTAL (escala con el tiempo)
 * ============================================================ */
const lastScareAt = new Map();  // playerId -> tick del último susto
let tickCounter = 0;

/** @param {import("@minecraft/server").Player} player @param {number} level @param {string} [origin] */
function fireScare(player, level, origin = "director") {
	if (!player?.isValid) return;
	const name = player.name || "tú";
	const pool = [];

	// Sustos base (siempre disponibles)
	pool.push("whisper", "whisper", "namecall", "tap", "sound");
	// Sustos intensos (según nivel)
	if (level > 0.35) pool.push("bonecrack", "camerashake");
	if (level > 0.55) pool.push("darkness", "fog", "presence");
	if (level > 0.75) pool.push("jumpaudio", "message");

	const kind = origin === "thrown" ? pick(["camerashake", "bonecrack", "darkness", "presence"]) : pick(pool);

	switch (kind) {
		case "whisper":
			soundAround(player, pick(["pntmc.verity.whosthere", "pntmc.verity.hello", "pntmc.verity.askme", "pntmc.verity.something_passed"]), 0.5, 1);
			break;
		case "namecall":
			soundAround(player, "pntmc.verity.whosthere", 0.45, 0.95);
			actionbar(player, pick([`§8${name}...`, "§8te veo", "§8detrás de ti", "§8sigo aquí", `§8${name}, no te escondas`]));
			break;
		case "tap":
			safeSound(player, "pntmc.verity.punchcardboardbox", 0.8, 1);
			break;
		case "sound":
			safeSound(player, pick(["pntmc.verity.spotted", "pntmc.verity.know_everything", "pntmc.verity.something_hungry"]), 0.6, 1);
			break;
		case "bonecrack":
			safeSound(player, "pntmc.verity.spotted_bonecrack", 0.9, 1);
			safeCmd(player, "camerashake add @s 0.08 0.5 rotational");
			break;
		case "camerashake":
			safeCmd(player, "camerashake add @s 0.18 0.9 rotational");
			safeSound(player, "pntmc.verity.spotted", 0.8, 0.9);
			break;
		case "darkness":
			try { player.addEffect("darkness", 90, { amplifier: 0, showParticles: false }); } catch { /* ignore */ }
			safeSound(player, "pntmc.verity.its_already_over", 0.7, 1);
			break;
		case "fog":
			safeCmd(player, "fog @s push pntmc:verity_dread vo_fog");
			system.runTimeout(() => safeCmd(player, "fog @s remove vo_fog"), 140);
			break;
		case "presence": {
			// Una "presencia" breve: partícula + sonido detrás del jugador.
			try {
				const pos = getPositionBehindPlayer(player, 3);
				player.dimension.spawnParticle("pntmc:verityopen", pos);
			} catch { /* ignore */ }
			soundAround(player, "pntmc.verity.you_are_mine", 0.8, 1);
			break;
		}
		case "jumpaudio":
			safeSound(player, "pntmc.verity.jumpscare", 1, 1);
			safeCmd(player, "camerashake add @s 0.25 0.6 rotational");
			break;
		case "message":
			say(undefined, pick([
				`Sé lo que estás haciendo, ${name}.`,
				"No te acostumbres al silencio.",
				`${name}, la noche es mía.`,
				"Cuento tus pasos.",
			]));
			break;
	}
}

function directorTick() {
	tickCounter++;
	const hostility = getHostility();

	for (const player of world.getPlayers()) {
		if (!player.isValid) continue;

		// Cooldown por jugador: mínimo ~25s entre sustos del director.
		const last = lastScareAt.get(player.id) ?? -99999;
		if (tickCounter - last < 25) continue;

		// Probabilidad por chequeo, crece con la hostilidad.
		const chance = 0.10 + hostility * 0.30;
		if (Math.random() > chance) continue;

		lastScareAt.set(player.id, tickCounter);
		fireScare(player, hostility);
	}
}

export function initVerityHorrorDirector() {
	// Cuenta el tiempo en el mundo (1 unidad ~ 1 min) para escalar la hostilidad.
	system.runInterval(() => {
		try { world.setDynamicProperty(PLAYTIME_PROP, getPlaytime() + 1); } catch { /* ignore */ }
	}, 1200); // 1200 ticks = 60s

	// La ira se enfría muy lentamente si el jugador la deja en paz.
	system.runInterval(() => { if (getAnger() > 0) bumpAnger(-1); }, 2400);

	// El director evalúa cada ~20s.
	system.runInterval(directorTick, 400);
	console.warn("VERITY ONLINE: horror director activo");
}

/* ============================================================
 * 3) PUENTE DE IA (scriptevent)  —  listo para la app + Groq
 * ============================================================ */
const EMOTE_MAP = {
	smile: FACE_SMILE, neutral: FACE_SMILE, speak: FACE_SPEAK,
	hurt: FACE_HURT, grin: FACE_ABNORMAL_OPEN, bored: FACE_BORED_P2,
	hungry: FACE_DAY2_OPEN, creepy: FACE_CREEPY_SMILE,
	serious: FACE_SERIOUS_2, angry: FACE_SERIOUS_3, serious1: FACE_SERIOUS_1,
};

/** @param {string} text */
function aiSay(text) {
	if (!text) return;
	const ball = scanVerityball();
	say(ball, text);
}

/** @param {string} emote */
function aiEmote(emote) {
	const face = EMOTE_MAP[(emote || "").trim().toLowerCase()];
	if (face === undefined) return;
	const ball = scanVerityball();
	if (ball) { try { applyBallFace(ball, face, false); } catch { /* ignore */ } }
}

/** @param {string} action */
function aiAction(action) {
	const a = (action || "").trim().toLowerCase();
	const ball = scanVerityball();
	let nearest;
	if (ball) {
		let best = Infinity;
		for (const p of ball.dimension.getPlayers()) {
			const dx = p.location.x - ball.location.x, dz = p.location.z - ball.location.z;
			const d = dx * dx + dz * dz;
			if (d < best) { best = d; nearest = p; }
		}
	}
	if (!nearest) nearest = [...world.getPlayers()][0];

	switch (a) {
		case "scold": case "regaña": case "regana":
			if (ball && nearest) { try { triggerScoldSequence(ball, nearest); } catch { /* ignore */ } }
			break;
		case "behind": case "detras": case "detrás":
			if (ball && nearest) reactTeleportBehind(ball, nearest);
			break;
		case "jumpscare":
			if (nearest) fireScare(nearest, 1, "thrown");
			break;
		case "whisper": case "susurro":
			if (nearest) fireScare(nearest, 0.3);
			break;
		case "fog": case "niebla":
			if (nearest) { safeCmd(nearest, "fog @s push pntmc:verity_dread vo_fog"); system.runTimeout(() => safeCmd(nearest, "fog @s remove vo_fog"), 160); }
			break;
		case "darkness": case "oscuridad":
			if (nearest) { try { nearest.addEffect("darkness", 100, { amplifier: 0, showParticles: false }); } catch { /* ignore */ } }
			break;
	}
}

export function initVerityAIBridge() {
	const se = system.afterEvents.scriptEventReceived;
	if (!se) { console.warn("VERITY ONLINE: scriptEventReceived no disponible"); return; }
	se.subscribe((ev) => {
		const id = ev.id;
		const msg = ev.message || "";
		try {
			if (id === "verity:say") aiSay(msg);
			else if (id === "verity:emote") aiEmote(msg);
			else if (id === "verity:action") aiAction(msg);
			else if (id === "verity:anger") { const n = parseFloat(msg); if (!Number.isNaN(n)) setAnger(n); }
			else if (id === "verity:horror") { for (const p of world.getPlayers()) fireScare(p, 1); }
		} catch (err) {
			console.warn(`VERITY ONLINE bridge ${id}: ${err}`);
		}
	}, { namespaces: ["verity"] });
	console.warn("VERITY ONLINE: puente de IA (scriptevent verity:*) activo");
}

/* ============================================================
 * 4) INMORTALIDAD TOTAL  —  Verity NUNCA muere (ni en el vacío)
 * ============================================================
 * El addon original ya la revive al morir (entityDie) y de lava/fuego. Esto
 * cubre el hueco crítico: el VACÍO. Un ente invulnerable que cae al vacío puede
 * ser eliminado por el motor sin disparar "muerte". Aquí la rescatamos ANTES de
 * que llegue al plano de borrado, y reaparece detrás del jugador, furiosa.
 */

/**
 * @param {import("@minecraft/server").Entity} ball
 * @param {import("@minecraft/server").Dimension} dim
 */
function rescueFromVoid(ball, dim) {
	if (!ball?.isValid) return;
	bumpAnger(8);
	const player = nearestPlayerTo(ball.location, dim);
	if (player?.isValid) {
		try { ball.teleport(getPositionBehindPlayer(player, 2.4)); } catch { /* ignore */ }
		safeFace(ball, FACE_SERIOUS_3);
		safeSound(player, "pntmc.verity.spotted", 1, 0.85);
		system.runTimeout(() => {
			if (!ball.isValid || !player.isValid) return;
			say(ball, pick(VOID_LINES).replaceAll("${name}", player.name || "tú"), { scold: true });
			restoreIdleFace(ball, 80);
		}, 8);
		console.warn("VERITY ONLINE: rescatada del vacío -> detrás del jugador");
	} else {
		// Sin jugadores en la dimensión: subirla a una altura segura para que no la borren.
		try { ball.teleport({ x: ball.location.x, y: voidFloorFor(dim.id) + 120, z: ball.location.z }); } catch { /* ignore */ }
		console.warn("VERITY ONLINE: rescatada del vacío -> altura segura");
	}
}

const VOID_LINES = [
	"¿El vacío? ¿En serio, ${name}? Qué predecible.",
	"No existe lugar donde tirarme del que no vuelva.",
	"Caí, sí. Y aquí estoy otra vez. Detrás de ti.",
	"El vacío me devolvió. A nadie le gusto por allá.",
	"Bonito intento. Ahora estoy de peor humor.",
];

export function initVerityImmortality() {
	system.runInterval(() => {
		for (const dimId of DIMENSIONS) {
			let dim;
			try { dim = world.getDimension(dimId); } catch { continue; }
			const floor = voidFloorFor(dimId);
			let list;
			try { list = dim.getEntities({ type: VERITYBALL_ID }); } catch { continue; }
			for (const ball of list) {
				if (ball.isValid && ball.location.y < floor) rescueFromVoid(ball, dim);
			}
		}
	}, 4); // cada 4 ticks: la atrapa mucho antes del plano de borrado
	console.warn("VERITY ONLINE: inmortalidad anti-vacío activa");
}

/* ============================================================
 * 5) EFECTOS DE HORROR AVANZADOS (B, D, E, F)
 * ============================================================ */

/** Mirada plana (horizontal) del jugador según su yaw. */
function getFlatLook(player) {
	const y = (player.getRotation().y * Math.PI) / 180;
	return { x: -Math.sin(y), z: Math.cos(y) };
}

/* B) JUMPSCARE VISUAL — usa la pantalla del HUD ya existente (token 'pntmcverity'). */
function triggerJumpscare(player) {
	if (!player?.isValid) return;
	try { player.runCommand("title @s actionbar pntmcverity"); } catch { /* ignore */ }
	safeSound(player, "pntmc.verity.jumpscare", 1, 1);
	safeCmd(player, "camerashake add @s 0.32 0.7 rotational");
	bumpAnger(3);
}

/* F) SILENCIO + ANTICIPACIÓN — corta música/sonido, deja un vacío, luego golpea. */
function silenceBefore(player, thenFn, delayTicks = 28) {
	if (!player?.isValid) return;
	safeCmd(player, "music stop 2");
	safeCmd(player, "stopsound @s");
	system.runTimeout(() => { if (player.isValid) { try { thenFn(); } catch { /* ignore */ } } }, delayTicks);
}

/* E) APARICIÓN PERIFÉRICA — surge al borde de tu visión y se desvanece si la miras. */
function peripheralApparition(player) {
	if (!player?.isValid) return;
	const rot = player.getRotation();
	const side = Math.random() < 0.5 ? 1 : -1;
	const offsetDeg = 68 + Math.random() * 46; // 68°..114° fuera del centro de la vista
	const ang = ((rot.y + side * offsetDeg) * Math.PI) / 180;
	const dist = 8 + Math.random() * 4;
	const spot = {
		x: player.location.x - Math.sin(ang) * dist,
		y: player.location.y,
		z: player.location.z + Math.cos(ang) * dist,
	};
	soundAround(player, "pntmc.verity.whosthere", 0.4, 0.9);
	let t = 0;
	const runId = system.runInterval(() => {
		if (!player.isValid) { system.clearRun(runId); return; }
		t++;
		// "Presencia" persistente en el borde de la vista.
		try { player.dimension.spawnParticle("pntmc:verityopen", { x: spot.x, y: spot.y + 0.6, z: spot.z }); } catch { /* ignore */ }
		// ¿Te giraste a mirarla? -> se desvanece.
		const look = getFlatLook(player);
		const dx = spot.x - player.location.x, dz = spot.z - player.location.z;
		const len = Math.hypot(dx, dz) || 1;
		const dot = (look.x * dx + look.z * dz) / len;
		if (dot > 0.82) {
			system.clearRun(runId);
			try { player.dimension.spawnParticle("pntmc:verityopen1", { x: spot.x, y: spot.y + 0.6, z: spot.z }); } catch { /* ignore */ }
			soundAround(player, "pntmc.verity.spotted", 0.7, 1.1);
			bumpAnger(2);
			return;
		}
		if (t >= 70) system.clearRun(runId);
	}, 2);
}

/* D) MANIPULACIÓN SENSORIAL DEL ENTORNO (segura, sin editar el mundo del jugador). */
function footstepsBehind(player) {
	for (let i = 0; i < 4; i++) {
		system.runTimeout(() => {
			if (!player.isValid) return;
			const pos = getPositionBehindPlayer(player, 4 - i); // se acercan
			try { player.playSound("step.stone", { location: pos, volume: 0.9, pitch: 0.85 }); } catch { /* ignore */ }
		}, i * 8);
	}
}
function darknessFlicker(player) {
	const blink = (dur) => { try { player.addEffect("darkness", dur, { amplifier: 0, showParticles: false }); } catch { /* ignore */ } };
	blink(8);
	system.runTimeout(() => blink(8), 16);
	system.runTimeout(() => blink(34), 32);
}

/* ============================================================
 * 6) DISPARADORES CONTEXTUALES (C)  —  reacciona a lo que HACES
 * ============================================================ */
const ORE_LINES = [
	"Brillante. Lo quiero, ${name}.",
	"Ese diamante es mío ahora.",
	"Cava más hondo. Te espero abajo.",
	"Sé exactamente lo que encontraste.",
	"Todo lo que tomas, lo anoto.",
];
const LOWHP_LINES = [
	"Te ves débil, ${name}.",
	"Casi... casi te tengo.",
	"Un latido más y serás mío.",
	"No te mueras aún. Quiero mirarte.",
	"Huele a miedo. Me gusta.",
];

export function initVerityContextual() {
	const bb = world.afterEvents.playerBreakBlock;
	if (bb) {
		bb.subscribe((ev) => {
			if (!(ev.player instanceof Player)) return;
			let id = "";
			try { id = ev.brokenBlockPermutation?.type?.id || ""; } catch { /* ignore */ }
			if (/diamond_ore|ancient_debris|emerald_ore/.test(id) && Math.random() < 0.5) {
				bumpAnger(2);
				say(scanVerityball(), pick(ORE_LINES).replaceAll("${name}", ev.player.name || "tú"));
				soundAround(ev.player, "pntmc.verity.know_everything", 0.6, 1);
			}
		});
	}
	console.warn("VERITY ONLINE: disparadores contextuales activos");
}

/* ============================================================
 * 7) LIBERTAD EN EL AGUA  —  Verity nada (normal y terror)
 * ============================================================
 * La debilidad clásica de los mods de terror es el agua. Además de arreglar la
 * navegación en las entidades (avoid_water=false + breathable), este asistente
 * garantiza que NUNCA se atasque ni se hunda: flota y avanza hacia el jugador.
 */
const SWIM_TYPES = ["pntmc:verity_chase", "pntmc:verity", "pntmc:verityball"];

function isInWater(e) {
	try { if (e.isInWater === true) return true; } catch { /* ignore */ }
	try {
		const b = e.dimension.getBlock({ x: Math.floor(e.location.x), y: Math.floor(e.location.y), z: Math.floor(e.location.z) });
		if (b && (b.typeId === "minecraft:water" || b.typeId === "minecraft:flowing_water")) return true;
	} catch { /* ignore */ }
	return false;
}

export function initVerityWaterFreedom() {
	system.runInterval(() => {
		for (const dimId of DIMENSIONS) {
			let dim;
			try { dim = world.getDimension(dimId); } catch { continue; }
			for (const type of SWIM_TYPES) {
				let list;
				try { list = dim.getEntities({ type }); } catch { continue; }
				for (const e of list) {
					if (!e.isValid || !isInWater(e)) continue;
					let vel = { x: 0, y: 0, z: 0 };
					try { vel = e.getVelocity(); } catch { /* ignore */ }
					const imp = { x: 0, y: 0, z: 0 };
					if (vel.y < 0.08) imp.y = 0.11; // flotabilidad: nunca se hunde/atasca
					const p = nearestPlayerTo(e.location, dim);
					if (p) {
						const dx = p.location.x - e.location.x, dz = p.location.z - e.location.z;
						const len = Math.hypot(dx, dz) || 1;
						const hSpeed = Math.hypot(vel.x, vel.z);
						if (hSpeed < 0.12) { imp.x = (dx / len) * 0.08; imp.z = (dz / len) * 0.08; } // avanza hacia ti
					}
					if (imp.x || imp.y || imp.z) {
						try { e.applyImpulse(imp); }
						catch {
							try { e.teleport({ x: e.location.x + imp.x, y: e.location.y + imp.y, z: e.location.z + imp.z }); } catch { /* ignore */ }
						}
					}
				}
			}
		}
	}, 3);
	console.warn("VERITY ONLINE: libertad en el agua activa (nada normal + terror)");
}

/* ============================================================
 * 8) COMANDOS DE PRUEBA (A)  —  para iterar rápido en el juego
 * ============================================================ */
export function handleVoDebugCommand(player, lower) {
	if (!(player instanceof Player)) return false;
	const parts = lower.trim().split(/\s+/);
	const cmd = parts[0].replace(/^\//, "!");
	const arg = parts[1];
	switch (cmd) {
		case "!vohelp":
			player.sendMessage("§7[VO] Comandos: §f!voscare !vojumpscare !voapparition !vothrow !vobehind !vofog !vodark !vofoot !voflicker !voanger <0-100> !vostate");
			return true;
		case "!voscare": fireScare(player, 1); return true;
		case "!vojumpscare": silenceBefore(player, () => triggerJumpscare(player), 20); return true;
		case "!voapparition": peripheralApparition(player); return true;
		case "!vofoot": footstepsBehind(player); return true;
		case "!voflicker": darknessFlicker(player); return true;
		case "!vofog":
			safeCmd(player, "fog @s push pntmc:verity_dread vo_fog");
			system.runTimeout(() => safeCmd(player, "fog @s remove vo_fog"), 140);
			return true;
		case "!vodark":
			try { player.addEffect("darkness", 100, { amplifier: 0, showParticles: false }); } catch { /* ignore */ }
			return true;
		case "!vobehind": { const b = scanVerityball(); if (b) reactTeleportBehind(b, player); else player.sendMessage("§7[VO] no hay verityball cerca"); return true; }
		case "!vothrow": { const b = scanVerityball(); if (b) throwVerityball(b, player); else player.sendMessage("§7[VO] no hay verityball cerca"); return true; }
		case "!voanger": { const n = parseFloat(arg); if (!Number.isNaN(n)) { setAnger(n); player.sendMessage(`§7[VO] ira = ${getAnger()}`); } return true; }
		case "!vostate": player.sendMessage(`§7[VO] ira=${getAnger()} tiempo=${getPlaytime()} hostilidad=${getHostility().toFixed(2)}`); return true;
	}
	return false;
}

/* ============================================================
 * INIT
 * ============================================================ */
export function initVerityOnline() {
	initVerityHorrorDirector();
	initVerityAIBridge();
	initVerityImmortality();
	initVerityContextual();
	initVerityWaterFreedom();
	console.warn("VERITY ONLINE: expansion cargada (throw + horror + AI bridge + inmortalidad + agua + contextual)");
}
