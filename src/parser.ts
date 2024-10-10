import { Either } from "effect";
import { type Prettify } from "./utils";

export type SourcePosition = {
	line: number;
	column: number;
	offset: number;
};

export type ParserState<T = unknown> = {
	input: string;
	pos: SourcePosition;
	state: T;
};

export type ParserError = {
	message: string;
	expected: string[];
	pos: SourcePosition;
};

export type ParserResult<T, S = unknown> = Either.Either<
	[T, ParserState<S>],
	ParserError
>;

export function initialState<State = unknown>(
	input: string,
	state: State,
): ParserState {
	return {
		input,
		pos: { line: 1, column: 1, offset: 0 },
		state,
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
	return { line, column, offset };
}

export function updateState<State>(
	oldState: ParserState<State>,
	newState: ParserState<State>,
): ParserState<State> {
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

export class Parser<Result, State = unknown> {
	constructor(
		public run: (
			state: ParserState<State>,
		) => ParserResult<Result, State>,
	) {}

	map<B>(f: (a: Result) => B): Parser<B, State> {
		return new Parser<B, State>((state) => {
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
			state: ParserState<State>,
		) => [B, ParserState<State>],
	): Parser<B, State> {
		return new Parser<B, State>((state) => {
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

	flatMap<B>(
		f: (a: Result) => Parser<B, State>,
	): Parser<B, State> {
		return new Parser<B, State>((state) => {
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

	zip<B>(
		parserB: Parser<B, State>,
	): Parser<readonly [Result, B], State> {
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
		other:
			| Parser<B, State>
			| ((a: Result) => Parser<B, State>),
	): Parser<Prettify<Result & { [k in K]: B }>, State> {
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
								} as Prettify<Result & { [k in K]: B }>,
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
		Parser<Result, State>,
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
