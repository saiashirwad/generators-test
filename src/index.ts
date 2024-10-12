import { integer2 } from "./lexer";

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

const parser = integer2;

const result = parser.run("-1");

console.log(result);
