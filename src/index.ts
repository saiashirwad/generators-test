import { as } from "effect/Option";
import {
	char,
	choice,
	many,
	string_,
	number,
	Parser,
	skipSpaces,
	string,
	word,
	digit,
	void_,
} from "./parser";
import { Either } from "effect";

type LetExpression = {
	name: string;
	value: number;
};

const parseLet = string_("let");
const parseConst = string_("const");

const parseBoth_ = choice([parseLet, parseConst]).flatMap(
	(x) => {
		if (x === "let") {
			return parseLet
				.zipRight(parseConst)
				.map(() => ({ let: true }));
		}
		return void_;
	},
);

const parseBoth = Parser.gen(function* () {
	const letOrConst = yield* choice([parseLet, parseConst]);
	if (letOrConst === "let") {
		yield* skipSpaces;
		yield* parseConst;

		return { let: true };
	}

	return { let: false };
});

// const parseBothDo = Parser.Do()
// 	.bind("letOrConst", () => choice([parseLet, parseConst]))
// 	.bind("what", () => string("what"));

const result = parseBoth_.run("let   const");
console.log(result);
