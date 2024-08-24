export class Maybe<T> {
	public value: T | null;

	constructor(value: T | null) {
		this.value = value;
	}

	static some<T>(value: T): Maybe<T> {
		return new Maybe(value);
	}

	static none<T>(): Maybe<T> {
		return new Maybe<T>(null);
	}

	map<U>(fn: (value: T) => U): Maybe<U> {
		if (this.value === null) {
			return Maybe.none<U>();
		}
		return Maybe.some(fn(this.value));
	}

	bind<U>(fn: (value: T) => Maybe<U>): Maybe<U> {
		if (this.value === null) {
			return Maybe.none<U>();
		}
		return fn(this.value);
	}

	*[Symbol.iterator](): Generator<Maybe<T>, T, any> {
		return yield this;
	}

	static gen<Yielded, Returned>(
		f: ($: {
			<A>(_: Maybe<A>): Maybe<A>;
		}) => Generator<Yielded, Returned, any>,
	): Maybe<Returned> {
		const iterator = f((_: any) => new Maybe(_));
		const state = iterator.next();

		function run(
			state:
				| IteratorYieldResult<Yielded>
				| IteratorReturnResult<Returned>,
		) {
			if (state.done) {
				return Maybe.some(state.value);
			}
			// @ts-expect-error this is fine :)
			const val = state.value["value"];
			if (val instanceof Maybe && val.value == null) {
				return Maybe.none<Returned>();
			}
			const next = iterator.next(val.value);

			return run(next);
		}

		return run(state);
	}
}
