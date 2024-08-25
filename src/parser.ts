import { Either } from "effect";
import { type Prettify, getRest } from "./utils";

export type ParserResult<T> = Either.Either<
	[T, string],
	string
>;

export class Parser<A> {
	constructor(
		public run: (input: string) => ParserResult<A>,
	) {}

	map<B>(f: (a: A) => B): Parser<B> {
		return new Parser((input) =>
			Either.match(this.run(input), {
				onRight: ([a, rest]) => Either.right([f(a), rest]),
				onLeft: (e) => Either.left(e),
			}),
		);
	}

	flatMap<B>(f: (a: A) => Parser<B>): Parser<B> {
		return new Parser((input) => {
			const result = this.run(input);
			return Either.match(result, {
				onRight: ([a, rest]) => f(a).run(rest),
				onLeft: (e) => Either.left(e),
			});
		});
	}

	zipRight<B>(parserB: Parser<B>): Parser<B> {
		return new Parser((input) =>
			Either.match(this.run(input), {
				onRight: ([a, rest]) => parserB.run(rest),
				onLeft: (e) => Either.left(e),
			}),
		);
	}

	zipLeft<B>(parserB: Parser<B>): Parser<A> {
		return new Parser((input) =>
			Either.match(this.run(input), {
				onRight: ([a, rest]) =>
					Either.match(parserB.run(rest), {
						onLeft: () => Either.right([a, rest]),
						onRight: () => Either.right([a, rest]),
					}),
				onLeft: (e) => Either.left(e),
			}),
		);
	}

	static pure = <A>(a: A): Parser<A> => {
		return new Parser((input) => Either.right([a, input]));
	};

	static Do = () => {
		return Parser.pure({});
	};

	zip<B>(parserB: Parser<B>): Parser<readonly [A, B]> {
		return new Parser((input) =>
			Either.match(this.run(input), {
				onRight: ([a, rest]) =>
					Either.match(parserB.run(rest), {
						onLeft: (e) => Either.left(e),
						onRight: ([b, rest]) =>
							Either.right([[a, b], rest]),
					}),
				onLeft: (e) => Either.left(e),
			}),
		);
	}

	bind<K extends string, B>(
		k: K,
		other: Parser<B> | ((a: A) => Parser<B>),
	): Parser<Prettify<A & { [k in K]: B }>> {
		return this.flatMap((a) => {
			const parser =
				other instanceof Parser ? other : other(a);
			return parser.flatMap((b) =>
				Parser.pure(
					Object.assign({}, a, {
						[k.toString()]: b,
					}) as any,
				),
			);
		});
	}

	*[Symbol.iterator](): Generator<Parser<A>, A, any> {
		return yield this;
	}

	static gen<Yielded, Returned>(
		f: ($: {
			<A>(_: Parser<A>): Parser<A>;
		}) => Generator<Yielded, Returned, any>,
	): Parser<Returned> {
		const iterator = f((_: any) => new Parser(_));

		function run(
			state:
				| IteratorYieldResult<Yielded>
				| IteratorReturnResult<Returned>,
		): Parser<Returned> {
			if (state.done) {
				if (state.value instanceof Parser) {
					return state.value as Parser<Returned>;
				}
				return Parser.pure(state.value as Returned);
			}

			const value = state.value;
			if (value instanceof Parser) {
				return value.flatMap((result) => {
					return run(iterator.next(result));
				});
			} else {
				throw new Error("Expected a Parser");
			}
		}

		return run(iterator.next());
	}
}

export const string = (str: string): Parser<string> =>
	new Parser((input) => {
		if (input.startsWith(str)) {
			return Either.right([str, input.slice(str.length)]);
		}
		return Either.left(`${str} not matched!`);
	});

export const string_ = <const T extends string>(
	str: T,
): Parser<T> =>
	new Parser((input) => {
		if (input.startsWith(str)) {
			return Either.right([
				str as T,
				input.slice(str.length),
			]);
		}
		return Either.left(`${str} not matched!`);
	});

export const char = string;

export const alphabet: Parser<string> = new Parser(
	(input) => {
		const [first, ...rest] = input;
		if (/^[a-zA-Z]$/.test(first)) {
			return Either.right([first, rest.join("")]);
		}
		return Either.left("Not alphabet");
	},
);

export const log: Parser<undefined> = new Parser(
	(input) => {
		return Either.right([undefined, input]);
	},
);

export const digit = new Parser((input) => {
	const [first, ...rest] = input;
	if (/^[0-9]$/.test(first)) {
		return Either.right([first, rest.join("")]);
	}
	return Either.left("not a number");
});

export const sepBy = <S, T>(
	sepParser: Parser<S>,
	parser: Parser<T>,
	shouldTrimSpaces?: boolean,
): Parser<T[]> => {
	return new Parser((input) => {
		const acc: Array<T> = [];
		let rest = input;
		while (true) {
			const result = parser
				.zip(
					shouldTrimSpaces
						? trimSpaces(optional(sepParser))
						: optional(sepParser),
				)
				.run(rest);

			if (Either.isLeft(result)) {
				if (acc.length > 0) {
					return Either.right([acc, rest]);
				}
				return Either.right([acc, input]); // Return original input if no match
			}
			const [[t, s], newRest] = result.right;
			acc.push(t);
			if (s === undefined) {
				return Either.right([acc, newRest]);
			}
			rest = newRest;
		}
	});
};

export const betweenChars = <T>(
	[start, end]: [string, string],
	parser: Parser<T>,
): Parser<T> =>
	new Parser((input) =>
		new Parser((input_) => {
			if (!input_.startsWith(start)) {
				return Either.left(
					`Not surrounded by ${start} ${end}`,
				);
			}
			if (input_.at(-1) !== end) {
				return Either.left(
					`Not surrounded by ${start} and ${end}`,
				);
			}
			return Either.right([undefined, input_.slice(1, -1)]);
		})
			.zip(parser)
			.map(([_, t]) => t)
			.run(input),
	);

const many_ =
	<T>(count: number) =>
	(parser: Parser<T>): Parser<Array<T>> =>
		new Parser((input) => {
			const acc: T[] = [];
			let rest = input;
			while (true) {
				const result = parser.run(rest);
				if (Either.isLeft(result)) {
					if (acc.length >= count) {
						return Either.right([acc, rest]);
					} else {
						return Either.left(
							`Expected at least ${count} occurrences, but only found ${acc.length}`,
						);
					}
				} else {
					const resValue = result.right[0];
				}
				rest = getRest(result);
				acc.push(result.right[0]);
			}
		});

const skipMany_ =
	<T>(count: number) =>
	(parser: Parser<T>): Parser<undefined> =>
		new Parser((input) => {
			let matchCount = 0;
			let rest = input;
			while (true) {
				const result = parser.run(rest);
				if (Either.isLeft(result)) {
					if (matchCount >= count) {
						return Either.right([undefined, rest]);
					} else {
						return Either.left(
							`Expected to skip at least ${count} occurrences, but only skipped ${matchCount}`,
						);
					}
				}
				matchCount++;
				rest = getRest(result);
			}
		});

export const skipUntil = <T>(
	parser: Parser<T>,
): Parser<undefined> =>
	many(choice([parser.map(() => undefined), char("")])).map(
		() => undefined,
	);

export const many = <T>(parser: Parser<T>) =>
	many_<T>(0)(parser);
export const many1 = <T>(parser: Parser<T>) =>
	many_<T>(1)(parser);
export const manyN = <T>(parser: Parser<T>, n: number) =>
	many_<T>(n)(parser);

export const skipMany = <T>(parser: Parser<T>) =>
	skipMany_<T>(0)(parser);
export const skipMany1 = <T>(parser: Parser<T>) =>
	skipMany_<T>(1)(parser);
export const skipManyN = <T>(
	parser: Parser<T>,
	n: number,
) => skipMany_<T>(n)(parser);

export const newLine = string("\n");

export const skipSpaces = skipMany(char(" "));

export const trimSpaces = <T>(
	parser: Parser<T>,
): Parser<T> =>
	new Parser((input) => {
		const trimmed = input.trim();
		const result = parser.run(trimmed);
		if (Either.isLeft(result)) {
			return result;
		}
		const [value, rest] = result.right;
		return Either.right([
			value,
			input.slice(
				input.length - (trimmed.length - rest.length),
			),
		]);
	});

export const choice = <T>(
	parsers: Array<Parser<T>>,
): Parser<T> =>
	new Parser((input) => {
		for (const parser of parsers) {
			const result = parser.run(input);
			if (Either.isRight(result)) {
				return result;
			}
		}
		return Either.left(
			`None of the ${parsers.length} choices could be satisfied`,
		);
	});

export const optional = <T>(
	parser: Parser<T>,
): Parser<T | undefined> =>
	new Parser((input) => {
		const result = parser.run(input);
		if (Either.isLeft(result)) {
			return Either.right([undefined, input]);
		}
		return Either.right(result.right);
	});

export const word = many1(alphabet).map((x) => x.join(""));

export const number = many(digit)
	.map((x) => x.join(""))
	.map(Number);

export const void_ = new Parser((x) =>
	Either.right([{ let: false }, x]),
);
