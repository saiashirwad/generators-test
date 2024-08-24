import { Either } from "effect";
import { Parser, char, many } from "./parser";

// const result = Maybe.gen(function* ($) {
// 	const lol = yield* $(Maybe.some(5));
// 	const lolol = yield* $(Maybe.some(234));
// 	const result = lol + lolol;
// 	if (result < 200) {
// 		return "yaaas" as const;
// 	}
// 	return "asdlkfjas" as const;
// });

const smolParser = Parser.gen(function* () {
	const hs = yield* many(char("h"));
	const ts = yield* many(char("t"));
	const v = yield* char("v");

	return { hs, ts, v };
});

const parseTexoport = Parser.gen(function* () {
	for (const i of "texoport") {
		yield* char(i);
	}
	return "texoport acquired" as const;
});

const bigParser = Parser.gen(function* () {
	const smol = yield* smolParser;
	const texStatus = yield* parseTexoport;

	return {
		smol,
		texStatus,
	};
});

const lol = bigParser.run("hhhtttvtexoport");
Either.match(lol, {
	onRight: console.log,
	onLeft: console.log,
});
