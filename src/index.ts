import { char } from "./combinators";
import { Parser } from "./parser";

const parser = Parser.Do()
	.bind("a", char("a"))
	.bind("b", char("b"))
	.map((x) => [x.a, x.b]);

const parser2 = Parser.gen(function* () {
	const a = yield* char("a");
	const b = yield* char("b");
	return [a, b];
});

const result1 = parser.run("ab");
const result2 = parser2.run("ab");

console.log(result1, result2);
