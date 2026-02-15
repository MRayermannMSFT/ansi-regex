export default function ansiRegex({onlyFirst = false} = {}) {
	// Valid string terminator sequences are BEL, ESC\, and 0x9c
	const ST = '(?:\\u0007|\\u001B\\u005C|\\u009C)';

	// OSC sequences only: ESC ] ... ST (non-greedy until the first ST)
	const osc = `(?:\\u001B\\][\\s\\S]*?${ST})`;

	// CSI and related: ESC/C1, optional params (supports ; and :), optional intermediate bytes (0x20-0x2F), then final byte (0x40-0x7E)
	const csi = '[\\u001B\\u009B][[\\]()#;?]*(?:[\\d;:]*(?:[\\u0020-\\u002F]*[\\u0040-\\u007E]))';

	// ESC followed by a private-use final byte (0x3C-0x3E: < = >), e.g. DECKPAM, DECKPNM, DECANM
	const escFp = '\\u001B[<=>]';

	const pattern = `${osc}|${csi}|${escFp}`;

	return new RegExp(pattern, onlyFirst ? undefined : 'g');
}
