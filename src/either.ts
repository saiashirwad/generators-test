// has mistakes
type EitherValue<L, R> =
	| {
			tag: "left";
			error: L;
	  }
	| {
			tag: "right";
			value: R;
	  };

export class Either<L, R> {
	constructor(public value: EitherValue<L, R>) {}

	static left<L, R>(error: L): Either<L, R> {
		return new Either<L, R>({ tag: "left", error });
	}

	static right<L, R>(value: R): Either<L, R> {
		return new Either<L, R>({ tag: "right", value });
	}

	map<U>(f: (value: R) => U): Either<L, U> {
		if (this.value.tag === "left") {
			return Either.left(this.value.error);
		}
		return Either.right(f(this.value.value));
	}

	flatMap<U>(f: (value: R) => Either<L, U>): Either<L, U> {
		if (this.value.tag === "left") {
			return Either.left(this.value.error);
		}
		return f(this.value.value);
	}

	*[Symbol.iterator](): Generator<Either<L, R>, R, any> {
		return yield this;
	}

	static gen<Yielded, Returned>(
		f: (
			$: <L, R>(_: Either<L, R>) => Either<L, R>,
		) => Generator<Yielded, Returned, any>,
	): Either<Yielded, Returned> {
		const iterator = f((_: any) => new Either(_));
		const state = iterator.next();

		function run(
			state:
				| IteratorYieldResult<Yielded>
				| IteratorReturnResult<Returned>,
		): Either<Yielded, Returned> {
			if (state.done) {
				return Either.right(state.value);
			}

			const value = state.value;
			if (value instanceof Either) {
				return value.flatMap((result) =>
					run(iterator.next(result)),
				);
			}
			throw new Error("Expected an Either");
		}

		return run(state);
	}
}
