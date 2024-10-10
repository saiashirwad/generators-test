import { Either } from "effect";
// import { Either } from "./either";
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

	map<B>(
		f: (a: ParserState<State>) => {
			value: B;
			state: ParserState<State>;
		},
	): Parser<B, State> {
		return new Parser<B, State>((state) => {
			return Either.match(this.run(state), {
				onRight: (a) => {
					const [, state] = a;
					const result = f(state);
					return Either.right([
						result.value,
						updateState(state, result.state),
					] as const);
				},
				onLeft: Either.left,
			});
		});
	}

	flatMap<B>(f: (a: Result) => Parser<B>): Parser<B> {
		return new Parser((input) => {
			return Either.match(this.run(input), {
				onRight: ([a, rest]) => f(a).run(rest),
				onLeft: (e) => Either.left(e),
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
		other: Parser<B> | ((a: Result) => Parser<B>),
	): Parser<Prettify<Result & { [k in K]: B }>> {
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
