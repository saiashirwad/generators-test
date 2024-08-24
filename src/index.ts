import { Maybe } from "./maybe";

const result = Maybe.gen(function* ($) {
	const lol = yield* $(Maybe.some(5));
	const lolol = yield* $(Maybe.some(234));
	const result = lol + lolol;
	return result;
});

console.log("hi");
console.log(result.value);
