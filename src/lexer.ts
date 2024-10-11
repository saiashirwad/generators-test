import {
	char,
	choice,
	digit,
	many1,
	optional,
} from "./combinators";
import { Parser } from "./parser";

export function skipWhitespace(): Parser<undefined> {
	return Parser.gen(function* () {
		while (true) {
			const result = yield* optional(char(" "));
			if (!result) {
				return undefined;
			}
		}
	});
}

export const integer: Parser<number> = Parser.gen(
	function* () {
		const sign = yield* optional(char("-"));
		const digits = yield* many1(
			digit.error("I wanted a digit, lmao"),
		).error("No digits found");
		const numStr = (sign ?? "") + digits.join("");
		return parseInt(numStr, 10);
	},
);

export const float: Parser<number> = Parser.gen(
	function* () {
		const sign = yield* optional(char("-"));
		const intPart = yield* many1(digit);
		const fractionalPart = yield* optional(
			Parser.gen(function* () {
				yield* char(".");
				return yield* many1(digit);
			}),
		);
		const exponentPart = yield* optional(
			Parser.gen(function* () {
				yield* char("e");
				const expSign = yield* optional(
					choice(char("+"), char("-")),
				);
				const expDigits = yield* many1(digit);
				return (expSign ?? "") + expDigits.join("");
			}),
		);

		const numStr =
			(sign ?? "") +
			intPart.join("") +
			(fractionalPart
				? "." + fractionalPart.join("")
				: "") +
			(exponentPart ? "e" + exponentPart : "");

		return parseFloat(numStr);
	},
);
