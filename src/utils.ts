import { Either } from "effect";

export function reverseString(str: string): string {
	return [...str].reverse().join("");
}

export const getRest = <T>(
	parserOutput: Either.Either<[T, string], string>,
): string => {
	return Either.match(parserOutput, {
		onLeft: () => "",
		onRight: ([_, rest]) => rest,
	});
};

export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};
