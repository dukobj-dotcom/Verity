import { system, world } from "@minecraft/server";

export const MOOD = Object.freeze({ FRIENDLY: "amable", NEUTRAL: "neutral", ANNOYED: "molesta", HOSTILE: "hostil" });
const STARTING_AFFINITY = 85;
const affinity = new Map();
const lastTalkTick = new Map();
const lastMoodTick = new Map();

function clamp(value) { return Math.max(0, Math.min(100, Math.round(value))); }
export function getAffinity(playerId) { return affinity.get(playerId) ?? STARTING_AFFINITY; }
export function changeAffinity(playerId, delta) {
	const next = clamp(getAffinity(playerId) + delta);
	affinity.set(playerId, next);
	return next;
}
export function getMood(playerId) {
	const value = getAffinity(playerId);
	if (value >= 70) return MOOD.FRIENDLY;
	if (value >= 45) return MOOD.NEUTRAL;
	if (value >= 20) return MOOD.ANNOYED;
	return MOOD.HOSTILE;
}
export function noteVerityTalk(playerId) {
	lastTalkTick.set(playerId, system.currentTick);
	return changeAffinity(playerId, 1);
}
export function noteVerityMistreatment(playerId, kind) {
	const penalties = { throw: -5, hit: -8, lava: -18, void: -20, insult: -9 };
	return changeAffinity(playerId, penalties[kind] ?? -4);
}
export function getMoodHorrorMultiplier(playerId) {
	switch (getMood(playerId)) {
		case MOOD.FRIENDLY: return 0.08;
		case MOOD.NEUTRAL: return 0.35;
		case MOOD.ANNOYED: return 0.72;
		default: return 1;
	}
}

/** Ignorarla mucho tiempo erosiona el vínculo; la calma lo recupera despacio. */
export function initVerityMood() {
	system.runInterval(() => {
		const now = system.currentTick;
		for (const player of world.getPlayers()) {
			if (!player.isValid) continue;
			const last = lastMoodTick.get(player.id) ?? now;
			if (now - last < 1200) continue;
			lastMoodTick.set(player.id, now);
			const lastTalk = lastTalkTick.get(player.id) ?? now;
			changeAffinity(player.id, now - lastTalk >= 6000 ? -2 : 1);
		}
	}, 1200);
}
