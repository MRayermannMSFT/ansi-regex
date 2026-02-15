import test from 'ava';
import ansiEscapes from 'ansi-escapes';
import * as ansiCodes from './fixtures/ansi-codes.js';
import ansiRegex from './index.js';

const consumptionCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+1234567890-=[]{};\':"./>?,<\\|';

// Testing against codes found at: http://ascii-table.com/ansi-escape-sequences-vt-100.php
test('match ansi code in a string', t => {
	t.regex('foo\u001B[4mcake\u001B[0m', ansiRegex());
	t.regex('\u001B[4mcake\u001B[0m', ansiRegex());
	t.regex('foo\u001B[4mcake\u001B[0m', ansiRegex());
	t.regex('\u001B[0m\u001B[4m\u001B[42m\u001B[31mfoo\u001B[39m\u001B[49m\u001B[24mfoo\u001B[0m', ansiRegex());
	t.regex('foo\u001B[mfoo', ansiRegex());
});

test('match ansi code from ls command', t => {
	t.regex('\u001B[00;38;5;244m\u001B[m\u001B[00;38;5;33mfoo\u001B[0m', ansiRegex());
});

test('match reset;setfg;setbg;italics;strike;underline sequence in a string', t => {
	t.regex('\u001B[0;33;49;3;9;4mbar\u001B[0m', ansiRegex());
	t.is('foo\u001B[0;33;49;3;9;4mbar'.match(ansiRegex())[0], '\u001B[0;33;49;3;9;4m');
});

test('match clear tabs sequence in a string', t => {
	t.regex('foo\u001B[0gbar', ansiRegex());
	t.is('foo\u001B[0gbar'.match(ansiRegex())[0], '\u001B[0g');
});

test('match clear line from cursor right in a string', t => {
	t.regex('foo\u001B[Kbar', ansiRegex());
	t.is('foo\u001B[Kbar'.match(ansiRegex())[0], '\u001B[K');
});

test('match clear screen in a string', t => {
	t.regex('foo\u001B[2Jbar', ansiRegex());
	t.is('foo\u001B[2Jbar'.match(ansiRegex())[0], '\u001B[2J');
});

test('match only first', t => {
	t.is('foo\u001B[4mcake\u001B[0m'.match(ansiRegex({onlyFirst: true})).length, 1);
});

test('match terminal link', t => {
	for (const ST of ['\u0007', '\u001B\u005C', '\u009C']) {
		t.regex(`\u001B]8;k=v;https://example-a.com/?a_b=1&c=2#tit%20le${ST}click\u001B]8;;${ST}`, ansiRegex());
		t.regex(`\u001B]8;;mailto:no-replay@mail.com${ST}mail\u001B]8;;${ST}`, ansiRegex());
		t.deepEqual(`\u001B]8;k=v;https://example-a.com/?a_b=1&c=2#tit%20le${ST}click\u001B]8;;${ST}`.match(ansiRegex()), [
			`\u001B]8;k=v;https://example-a.com/?a_b=1&c=2#tit%20le${ST}`,
			`\u001B]8;;${ST}`,
		]);
		t.deepEqual(`\u001B]8;;mailto:no-reply@mail.com${ST}mail-me\u001B]8;;${ST}`.match(ansiRegex()), [
			`\u001B]8;;mailto:no-reply@mail.com${ST}`,
			`\u001B]8;;${ST}`,
		]);
	}
});

test('match terminal link with plus in URL', t => {
	for (const ST of ['\u0007', '\u001B\u005C', '\u009C']) {
		const seqOpen = `\u001B]8;;https://www.example.com/?q=hello+world${ST}`;
		const seqClose = `\u001B]8;;${ST}`;
		const value = `${seqOpen}hello${seqClose}`;
		t.deepEqual(value.match(ansiRegex()), [seqOpen, seqClose]);
		t.is(value.replace(ansiRegex(), ''), 'hello');
	}
});

test('match "change icon name and window title" in string', t => {
	t.is('\u001B]0;sg@tota:~/git/\u0007\u001B[01;32m[sg@tota\u001B[01;37m misc-tests\u001B[01;32m]$'.match(ansiRegex())[0], '\u001B]0;sg@tota:~/git/\u0007');
});

test('match colon-separated sequence arguments', t => {
	t.regex('\u001B[38:2:68:68:68:48:2:0:0:0m', ansiRegex());
	t.is('\u001B[38:2:68:68:68:48:2:0:0:0m'.match(ansiRegex())[0], '\u001B[38:2:68:68:68:48:2:0:0:0m');
});

test('match colon-separated underline variants', t => {
	for (const code of ['\u001B[4:0m', '\u001B[4:1m', '\u001B[4:2m', '\u001B[4:3m', '\u001B[4:4m', '\u001B[4:5m']) {
		t.regex(code, ansiRegex());
		t.is(code.match(ansiRegex())[0], code);
	}
});

test('match colon-separated indexed color (38:5)', t => {
	const code = '\u001B[38:5:123m';
	t.regex(code, ansiRegex());
	t.is(code.match(ansiRegex())[0], code);
});

test('match colon-separated indexed background color (48:5)', t => {
	const code = '\u001B[48:5:200m';
	t.regex(code, ansiRegex());
	t.is(code.match(ansiRegex())[0], code);
});

test('match colon-separated underline color palette index (58:5)', t => {
	const code = '\u001B[58:5:200m';
	t.regex(code, ansiRegex());
	t.is(code.match(ansiRegex())[0], code);
});

test('match colon-separated RGB colors (38:2::R:G:B and 48:2::R:G:B)', t => {
	for (const code of ['\u001B[38:2::12:34:56m', '\u001B[48:2::200:201:202m']) {
		t.regex(code, ansiRegex());
		t.is(code.match(ansiRegex())[0], code);
	}
});

test('match colon-separated underline color RGB (58:2::R:G:B)', t => {
	const code = '\u001B[58:2::255:0:0m';
	t.regex(code, ansiRegex());
	t.is(code.match(ansiRegex())[0], code);
});

test('match colon-separated RGBA foreground/background (38:6, 48:6)', t => {
	for (const code of ['\u001B[38:6::255:0:0:128m', '\u001B[48:6::0:0:0:64m']) {
		t.regex(code, ansiRegex());
		t.is(code.match(ansiRegex())[0], code);
	}
});

test('colon-separated sequences should not overconsume', t => {
	const samples = [
		'\u001B[4:5mX',
		'\u001B[38:5:123mX',
		'\u001B[58:2::255:0:0mX',
		'\u001B[38:2::12:34:56mX',
		'\u001B[48:2::200:201:202mX',
	];

	for (const inputString of samples) {
		const match = inputString.match(ansiRegex())[0];
		t.truthy(match);
		t.is(inputString.replace(ansiRegex(), ''), 'X');
	}
});

test('does not match bracketed text without ESC', t => {
	const samples = [
		'[38:2:68:68:68m',
		'[4:5m',
		'some [0m text',
		'plain [58:2::255:0:0m words',
	];
	for (const inputString of samples) {
		t.is(inputString.match(ansiRegex()), null);
	}
});

test('does not match incomplete CSI', t => {
	const inputString = '\u001B[';
	t.is(inputString.match(ansiRegex()), null);
});

test('does not match ESC followed by unsupported final', t => {
	const inputString = 'pre\u001B`post';
	t.is(inputString.match(ansiRegex()), null);
});

test('match ECH (Erase Character) ESC[nX', t => {
	t.is('hello\u001B[31Xworld'.replace(ansiRegex(), ''), 'helloworld');
	t.is('hello\u001B[5Xworld'.replace(ansiRegex(), ''), 'helloworld');
	t.is('hello\u001B[5Xworld'.match(ansiRegex())[0], '\u001B[5X');
});

test('match ICH (Insert Character) ESC[n@', t => {
	t.is('hello\u001B[3@world'.replace(ansiRegex(), ''), 'helloworld');
	t.is('hello\u001B[3@world'.match(ansiRegex())[0], '\u001B[3@');
});

test('match REP (Repeat) ESC[nb', t => {
	t.is('hello\u001B[2bworld'.replace(ansiRegex(), ''), 'helloworld');
	t.is('hello\u001B[2bworld'.match(ansiRegex())[0], '\u001B[2b');
});

test('match VPA (Vertical Position Absolute) ESC[nd', t => {
	t.is('hello\u001B[5dworld'.replace(ansiRegex(), ''), 'helloworld');
	t.is('hello\u001B[5dworld'.match(ansiRegex())[0], '\u001B[5d');
});

test('match VPR (Vertical Position Relative) ESC[ne', t => {
	t.is('hello\u001B[3eworld'.replace(ansiRegex(), ''), 'helloworld');
	t.is('hello\u001B[3eworld'.match(ansiRegex())[0], '\u001B[3e');
});

test('match SU (Scroll Up) ESC[nS and SD (Scroll Down) ESC[nT', t => {
	t.is('hello\u001B[3Sworld'.match(ansiRegex())[0], '\u001B[3S');
	t.is('hello\u001B[3Tworld'.match(ansiRegex())[0], '\u001B[3T');
	t.is('hello\u001B[3Sworld'.replace(ansiRegex(), ''), 'helloworld');
});

test('match CBT (Cursor Backward Tabulation) ESC[nZ', t => {
	t.is('hello\u001B[2Zworld'.match(ansiRegex())[0], '\u001B[2Z');
	t.is('hello\u001B[2Zworld'.replace(ansiRegex(), ''), 'helloworld');
});

test('match CHT (Cursor Horizontal Tabulation) ESC[nI', t => {
	t.is('hello\u001B[4Iworld'.match(ansiRegex())[0], '\u001B[4I');
	t.is('hello\u001B[4Iworld'.replace(ansiRegex(), ''), 'helloworld');
});

test('match all ECMA-48 CSI final bytes (0x40-0x7E)', t => {
	for (let code = 0x40; code <= 0x7E; code++) {
		const finalByte = String.fromCharCode(code);
		const seq = `\u001B[1${finalByte}`;
		const input = `hello${seq}world`;
		t.is(input.match(ansiRegex())[0], seq);
		t.is(input.replace(ansiRegex(), ''), 'helloworld');
	}
});

test('match CSI with intermediate bytes', t => {
	// DECSCUSR: ESC[ n SP q
	const decscusr = '\u001B[2 q';
	t.is(`hello${decscusr}world`.match(ansiRegex())[0], decscusr);
	t.is(`hello${decscusr}world`.replace(ansiRegex(), ''), 'helloworld');
});

test('match CSI with no parameters', t => {
	t.is('hello\u001B[Xworld'.match(ansiRegex())[0], '\u001B[X');
	t.is('hello\u001B[Xworld'.replace(ansiRegex(), ''), 'helloworld');
});

test('match CSI with DEC private mode prefix', t => {
	t.is('hello\u001B[?25hworld'.match(ansiRegex())[0], '\u001B[?25h');
	t.is('hello\u001B[?25hworld'.replace(ansiRegex(), ''), 'helloworld');
	t.is('hello\u001B[?25lworld'.match(ansiRegex())[0], '\u001B[?25l');
});

test('match multi-param CSI with all final bytes', t => {
	t.is('hello\u001B[1;2Xworld'.match(ansiRegex())[0], '\u001B[1;2X');
	t.is('hello\u001B[1;2Xworld'.replace(ansiRegex(), ''), 'helloworld');
});

// Testing against extended codes (excluding codes ending in 0-9)
for (const [codeSetKey, codeSetValue] of Object.entries(ansiCodes)) {
	for (const [code, codeInfo] of codeSetValue) {
		const shouldSkip = /\d$/.test(code);
		const skipText = shouldSkip ? '[SKIP] ' : '';
		const ecode = `\u001B${code}`;

		test(`${codeSetKey} - ${skipText}${code} → ${codeInfo[0]}`, t => {
			if (shouldSkip) {
				t.pass();
				return;
			}

			const string = `hel${ecode}lo`;
			t.regex(string, ansiRegex());
			t.is(string.match(ansiRegex())[0], ecode);
			t.is(string.replace(ansiRegex(), ''), 'hello');
		});

		test(`${codeSetKey} - ${skipText}${code} should not overconsume`, t => {
			if (shouldSkip) {
				t.pass();
				return;
			}

			for (const character of consumptionCharacters) {
				const string = ecode + character;
				t.regex(string, ansiRegex());
				t.is(string.match(ansiRegex())[0], ecode);
				t.is(string.replace(ansiRegex(), ''), character);
			}
		});
	}
}

const escapeCodeFunctionArguments = [1, 2];
const escapeCodeIgnoresList = new Set(['beep', 'image', 'iTerm']);
const escapeCodeResultMap = new Map([['link', escapeCodeFunctionArguments[0]]]);

for (const [key, escapeCode] of Object.entries(ansiEscapes)) {
	if (escapeCodeIgnoresList.has(key)) {
		continue;
	}

	const escapeCodeValue = typeof escapeCode === 'function'
		? escapeCode(...escapeCodeFunctionArguments)
		: escapeCode;

	test(`ansi-escapes ${key}`, t => {
		for (const character of consumptionCharacters) {
			const string = escapeCodeValue + character;
			const result = (escapeCodeResultMap.get(key) || '') + character;

			t.is(string.replace(ansiRegex(), ''), result);
		}
	});
}
