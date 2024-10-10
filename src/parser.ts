import { Either } from "effect";
import { type Prettify } from "./utils";

export type SourcePosition = {
	line: number;
	column: number;
	offset: number;
};

export type ParserState = {
	input: string;
	pos: SourcePosition;
};

export class ParserError {
	constructor(
		public message: string,
		public expected: string[],
		public pos: SourcePosition,
	) {}
}

// export function error(
// 	message: string,
// 	expected: string[],
// 	pos: SourcePosition,
// ) {
// 	return Either.left(
// 		new ParserError(message, expected, pos),
// 	);
// }

// export function succeed<T>(
// 	value: T,
// 	state: ParserState,
// 	consumed: string,
// ): ParserResult<T> {
// 	return Either.right([
// 		value,
// 		consumeString(state, consumed),
// 	]);
// }

export type ParserResult<T> = Either.Either<
	[T, ParserState],
	ParserError
>;

export class Parser<Result> {
	constructor(
		public run: (
			state: ParserState,
		) => ParserResult<Result>,
	) {}

	static succeed<T>(
		value: T,
		state: ParserState,
		consumed: string,
	): ParserResult<T> {
		return Either.right([
			value,
			consumeString(state, consumed),
		]);
	}

	static error(
		message: string,
		expected: string[],
		pos: SourcePosition,
	) {
		return Either.left(
			new ParserError(message, expected, pos),
		);
	}

	map<B>(f: (a: Result) => B): Parser<B> {
		return new Parser<B>((state) => {
			return Either.match(this.run(state), {
				onRight: ([value, newState]) =>
					Either.right([f(value), newState] as const),
				onLeft: Either.left,
			});
		});
	}

	transform<B>(
		f: (
			value: Result,
			state: ParserState,
		) => [B, ParserState],
	): Parser<B> {
		return new Parser<B>((state) => {
			return Either.match(this.run(state), {
				onRight: ([value, newState]) => {
					const [newValue, transformedState] = f(
						value,
						newState,
					);
					return Either.right([
						newValue,
						updateState(newState, transformedState),
					] as const);
				},
				onLeft: Either.left,
			});
		});
	}

	flatMap<B>(f: (a: Result) => Parser<B>): Parser<B> {
		return new Parser<B>((state) => {
			return Either.match(this.run(state), {
				onRight: ([value, newState]) => {
					const nextParser = f(value);
					return nextParser.run(newState);
				},
				onLeft: Either.left,
			});
		});
	}

	static pure = <A>(a: A): Parser<A> => {
		return new Parser((input) => Either.right([a, input]));
	};

	static Do = () => {
		return Parser.pure({});
	};

	zip<B>(parserB: Parser<B>): Parser<readonly [Result, B]> {
		return new Parser((state) =>
			Either.match(this.run(state), {
				onRight: ([a, restA]) =>
					Either.match(parserB.run(restA), {
						onRight: ([b, restB]) =>
							Either.right([[a, b] as const, restB]),
						onLeft: Either.left,
					}),
				onLeft: Either.left,
			}),
		);
	}

	bind<K extends string, B>(
		k: K,
		other: Parser<B> | ((a: Result) => Parser<B>),
	): Parser<
		Prettify<
			Result & {
				[k in K]: B;
			}
		>
	> {
		return new Parser((state) => {
			return Either.match(this.run(state), {
				onRight: ([value, newState]) => {
					const nextParser =
						other instanceof Parser ? other : other(value);
					return Either.match(nextParser.run(newState), {
						onRight: ([b, finalState]) =>
							Either.right([
								{
									...(value as object),
									[k]: b,
								} as Prettify<
									Result & {
										[k in K]: B;
									}
								>,
								finalState,
							] as const),
						onLeft: Either.left,
					});
				},
				onLeft: Either.left,
			});
		});
	}

	*[Symbol.iterator](): Generator<
		Parser<Result>,
		Result,
		any
	> {
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
				return value.flatMap((result) =>
					run(iterator.next(result)),
				);
			} else {
				throw new Error("Expected a Parser");
			}
		}
		return run(iterator.next());
	}
}

export function initialState(input: string): ParserState {
	return {
		input,
		pos: {
			line: 1,
			column: 1,
			offset: 0,
		},
	};
}

export function updatePosition(
	pos: SourcePosition,
	consumed: string,
): SourcePosition {
	let { line, column, offset } = pos;
	for (const char of consumed) {
		if (char === "\n") {
			line++;
			column = 1;
		} else {
			column++;
		}
		offset++;
	}

	return {
		line,
		column,
		offset,
	};
}

export function updateState(
	oldState: ParserState,
	newState: ParserState,
): ParserState {
	const consumed = oldState.input.slice(
		0,
		oldState.input.length - newState.input.length,
	);
	return {
		...oldState,
		input: oldState.input.slice(consumed.length),
		pos: updatePosition(oldState.pos, consumed),
	};
}

export function consumeString(
	state: ParserState,
	consumed: string,
): ParserState {
	const newPos = updatePosition(state.pos, consumed);

	return {
		input: state.input.slice(consumed.length),
		pos: newPos,
	};
}
