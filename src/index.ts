import { integer } from "./lexer";

// const parser = Parser.gen(function* () {
// 	const a = yield* char("a");
// 	const b = yield* char("b");
// 	return [a, b] as const;
// });

// const result1 = parser.run("ba");

// if (Either.isLeft(result1)) {
// 	console.log(result1.left);
// } else {
// 	console.log(result1.right);
// }

const parser = integer;

const result = parser.run("-a123");

console.log(result);
