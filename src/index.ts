import { Maybe } from "./maybe";

const result = Maybe.gen(function* ($) {
	const lol = yield* $(Maybe.some(5));
	const lolol = yield* $(Maybe.some(234));
	const result = lol + lolol;
	if (result < 200) {
		return "yaaas" as const;
	}
	return "asdlkfjas" as const;
});

console.log("alskdjf");
console.log(result.value);
