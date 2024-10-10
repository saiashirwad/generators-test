import { Parser } from "./parser";

export function string(str: string): Parser<string> {
	return new Parser((state) => {
		if (str === "" || state.input.startsWith(str)) {
			return Parser.succeed(str, state, str);
		}

		const errorMessage =
			`Expected ${str} at index ${state.pos.offset}, ` +
			`but found ${state.input.slice(
				state.pos.offset,
				state.pos.offset + 10,
			)}...`;

		return Parser.error(errorMessage, [str], state.pos);
	});
}

export function char(ch: string): Parser<string> {
	return new Parser((state) => {
		if (ch.length !== 1) {
			return Parser.error(
				"char parser expects a single character",
				[ch],
				state.pos,
			);
		}
		if (state.input[0] === ch) {
			return Parser.succeed(ch, state, ch);
		}

		const errorMessage =
			`Expected ${ch} at index ${state.pos.offset}, ` +
			`but found ${state.input.at(0)}...`;

		return Parser.error(errorMessage, [ch], state.pos);
	});
}

export const alphabet = new Parser((state) => {
	if (state.input.length === 0) {
		return Parser.error(
			"Unexpected end of input",
			[],
			state.pos,
		);
	}
	const first = state.input[0];
	if (/^[a-zA-Z]$/.test(first)) {
		return Parser.succeed(first, state, first);
	}
	return Parser.error(
		`Expected alphabetic character, but got '${first}'`,
		[],
		state.pos,
	);
});

export const digit = new Parser((state) => {
	if (state.input.length === 0) {
		return Parser.error(
			"Unexpected end of input",
			[],
			state.pos,
		);
	}
	const first = state.input[0];
	if (/^[0-9]$/.test(first)) {
		return Parser.succeed(first, state, first);
	}
	return Parser.error(
		`Expected digit, but got '${first}'`,
		[],
		state.pos,
	);
});

// export const sepBy = <S, T>(
// 	sepParser: Parser<S>,
// 	parser: Parser<T>,
// 	shouldTrimSpaces?: boolean,
// ): Parser<T[]> => {
// 	return new Parser((input) => {
// 		const acc: Array<T> = [];
// 		let rest = input;
// 		while (true) {
// 			const result = parser
// 				.zip(
// 					shouldTrimSpaces
// 						? trimSpaces(optional(sepParser))
// 						: optional(sepParser),
// 				)
// 				.run(rest);

// 			if (Either.isLeft(result)) {
// 				if (acc.length > 0) {
// 					return Either.right([acc, rest]);
// 				}
// 				return Either.right([acc, input]); // Return original input if no match
// 			}
// 			const [[t, s], newRest] = result.right;
// 			acc.push(t);
// 			if (s === undefined) {
// 				return Either.right([acc, newRest]);
// 			}
// 			rest = newRest;
// 		}
// 	});
// };

// // FIX: the result is. why is there an escaped " just in world and not hello  [ "hello", ",\"world\"" ],

// export const betweenChars = <T>(
// 	[start, end]: [string, string],
// 	parser: Parser<T>,
// ): Parser<T> =>
// 	new Parser((input) =>
// 		new Parser((input_) => {
// 			if (!input_.startsWith(start)) {
// 				return Either.left(
// 					`Not surrounded by ${start} ${end}`,
// 				);
// 			}
// 			if (input_.at(-1) !== end) {
// 				return Either.left(
// 					`Not surrounded by ${start} and ${end}`,
// 				);
// 			}
// 			return Either.right([undefined, input_.slice(1, -1)]);
// 		})
// 			.zip(parser)
// 			.map(([_, t]) => t)
// 			.run(input),
// 	);

// const many_ =
// 	<T>(count: number) =>
// 	(parser: Parser<T>): Parser<Array<T>> =>
// 		new Parser((input) => {
// 			const acc: T[] = [];
// 			let rest = input;
// 			while (true) {
// 				const result = parser.run(rest);
// 				if (Either.isLeft(result)) {
// 					if (acc.length >= count) {
// 						return Either.right([acc, rest]);
// 					} else {
// 						return Either.left(
// 							`Expected at least ${count} occurrences, but only found ${acc.length}`,
// 						);
// 					}
// 				}
// 				rest = getRest(result);
// 				acc.push(result.right[0]);
// 			}
// 		});

// const skipMany_ =
// 	<T>(count: number) =>
// 	(parser: Parser<T>): Parser<undefined> =>
// 		new Parser((input) => {
// 			let matchCount = 0;
// 			let rest = input;
// 			while (true) {
// 				const result = parser.run(rest);
// 				if (Either.isLeft(result)) {
// 					if (matchCount >= count) {
// 						return Either.right([undefined, rest]);
// 					} else {
// 						return Either.left(
// 							`Expected to skip at least ${count} occurrences, but only skipped ${matchCount}`,
// 						);
// 					}
// 				}
// 				matchCount++;
// 				rest = getRest(result);
// 			}
// 		});

// export const skipUntil = <T>(
// 	parser: Parser<T>,
// ): Parser<undefined> =>
// 	new Parser((input) => {
// 		let rest = input;
// 		while (true) {
// 			if (rest.length === 0) {
// 				return Either.left(
// 					"Reached end of input without finding a match",
// 				);
// 			}
// 			const result = parser.run(rest);
// 			if (Either.isRight(result)) {
// 				return Either.right([undefined, rest]);
// 			}
// 			rest = rest.slice(1);
// 		}
// 	});

// export const many = <T>(parser: Parser<T>) =>
// 	many_<T>(0)(parser);
// export const many1 = <T>(parser: Parser<T>) =>
// 	many_<T>(1)(parser);
// export const manyN = <T>(parser: Parser<T>, n: number) =>
// 	many_<T>(n)(parser);

// export const skipMany = <T>(parser: Parser<T>) =>
// 	skipMany_<T>(0)(parser);
// export const skipMany1 = <T>(parser: Parser<T>) =>
// 	skipMany_<T>(1)(parser);
// export const skipManyN = <T>(
// 	parser: Parser<T>,
// 	n: number,
// ) => skipMany_<T>(n)(parser);

// export const newLine = string("\n");

// export const skipSpaces = <T>(parser: Parser<T>) =>
// 	skipMany(string(" "))
// 		.zip(parser)
// 		.map(([_, t]) => t);

// export const trimSpaces = <T>(
// 	parser: Parser<T>,
// ): Parser<T> =>
// 	new Parser((input) => {
// 		const trimmed = input.trim();
// 		const result = parser.run(trimmed);
// 		if (Either.isLeft(result)) {
// 			return result;
// 		}
// 		const [value, rest] = result.right;
// 		return Either.right([
// 			value,
// 			input.slice(
// 				input.length - (trimmed.length - rest.length),
// 			),
// 		]);
// 	});

// export const choice = <T>(
// 	parsers: Array<Parser<T>>,
// ): Parser<T> =>
// 	new Parser((input) => {
// 		for (const parser of parsers) {
// 			const result = parser.run(input);
// 			if (Either.isRight(result)) {
// 				return result;
// 			}
// 		}
// 		return Either.left(
// 			`None of the ${parsers.length} choices could be satisfied`,
// 		);
// 	});

// export const optional = <T>(
// 	parser: Parser<T>,
// ): Parser<T | undefined> =>
// 	new Parser((input) => {
// 		const result = parser.run(input);
// 		if (Either.isLeft(result)) {
// 			return Either.right([undefined, input]);
// 		}
// 		return Either.right(result.right);
// 	});
