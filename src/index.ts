import { Either } from "effect";
import {
	betweenChars,
	char,
	choice,
	many,
} from "./combinators";

const sParser = char("sasdf");
const result = sParser.run("sserf");

console.log(result);

// import {
// 	betweenChars,
// 	char,
// 	choice,
// 	many,
// 	sepBy,
// } from "./combinators";
// import { Parser } from "./parser";

const stringParser = betweenChars(
	['"', '"'],
	many(
		choice([
			char("\\")
				.zip(char('"'))
				.map(() => '"'),
			new Parser((input) => {
				const char = input[0];
				if (char && char !== '"' && char !== "\\") {
					return Either.right([char, input.slice(1)]);
				}
				return Either.left("Invalid character in string");
			}),
		]),
	).map((chars) => chars.join("")),
);

// const stringParser2 = Parser.gen(function* ($) {
// 	yield* char('"');
// 	const chars = yield* many(
// 		choice([
// 			Parser.gen(function* ($) {
// 				yield* char("\\");
// 				yield* char('"');
// 				return '"';
// 			}),
// 			new Parser((input) => {
// 				const char = input[0];
// 				if (char && char !== '"' && char !== "\\") {
// 					return Either.right([char, input.slice(1)]);
// 				}
// 				return Either.left("Invalid character in string");
// 			}),
// 		]),
// 	);
// 	yield* char('"');
// 	return chars.join("");
// });

// const result = sepBy(char(","), stringParser2, true).run(
// 	'"hi there","what"',
// );

// console.log(result);

// // Usage example:
// // const result = arrayParser.run('["hello", "world", "parser"]');
// // console.log(Either.isRight(result) ? result.right[0] : "Parse error");

// // const lol = many(choice([char("a"), char("b"), char("c")]));
// // const rip = lol.run("abc");

// // const smolParser = Parser.gen(function* () {
// // 	const hs = yield* many(char("h"));
// // 	const ts = yield* many(char("t"));
// // 	const v = yield* char("v");

// // 	return { hs, ts, v };
// // });

// // const parseTexoport = Parser.gen(function* () {
// // 	for (const i of "texoport") {
// // 		yield* char(i);
// // 	}
// // 	return "texoport acquired" as const;
// // });

// // const bigParser = Parser.gen(function* () {
// // 	const smol = yield* smolParser;
// // 	const texStatus = yield* parseTexoport;

// // 	return {
// // 		smol,
// // 		texStatus,
// // 	};
// // });
