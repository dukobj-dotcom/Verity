import { MOOD, getMood } from "./verity_mood.js";

const LINES = {
	[MOOD.FRIENDLY]: [
		"Me gusta cuando me hablas. ¿Qué hacemos ahora?",
		"Estoy contigo, no tienes que ir solo.",
		"Qué bonito verte por aquí. Cuéntame algo.",
		"Te estaba esperando. Podemos explorar juntos.",
		"Si necesitas una idea, yo tengo muchas para nosotros.",
	],
	[MOOD.NEUTRAL]: [
		"Te escucho. ¿Qué tienes en mente?",
		"Sigo aquí. Intenta no perderme de vista.",
		"Podemos hablar, si de verdad quieres.",
		"El mundo está tranquilo por ahora.",
		"Dime algo interesante.",
	],
	[MOOD.ANNOYED]: [
		"Hablas como si no hubieras hecho nada.",
		"Te escucho, pero no olvidé cómo me trataste.",
		"No confundas mi silencio con perdón.",
		"¿Ahora sí quieres conversar? Qué conveniente.",
		"Ten cuidado con lo que me pides.",
	],
	[MOOD.HOSTILE]: [
		"No finjas que somos amigos.",
		"Cada palabra tuya me da otra razón para quedarme.",
		"Habla. Quiero oír cómo intentas arreglarlo.",
		"No puedes deshacer lo que me enseñaste.",
		"Sigo aquí. Eso debería preocuparte.",
	],
};

export function getSmalltalkReply(playerId) {
	const lines = LINES[getMood(playerId)];
	return lines[Math.floor(Math.random() * lines.length)];
}

export function getSmalltalkVoice(playerId) {
	const suffix = getMood(playerId) === MOOD.FRIENDLY ? "friendly" : getMood(playerId) === MOOD.NEUTRAL ? "neutral" : getMood(playerId) === MOOD.ANNOYED ? "annoyed" : "hostile";
	return `pntmc.verity.vo_mood_${suffix}_1`;
}
