class GenMaybe<K, A> {
	constructor(readonly op: K) {}

	*[Symbol.iterator](): Generator<GenMaybe<K, A>, K, any> {
		return yield this;
	}
}

const adapter = (_: any) => {
	return new GenMaybe(_);
};

class Maybe<T> {
	constructor(private value: T | null) {}

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

	gen<Yielded extends GenMaybe<any, any>, Returned>(
		f: (i: {
			<A>(_: Maybe<A>): GenMaybe<Maybe<A>, A>;
		}) => Generator<Yielded, Returned, any>,
	): Maybe<Returned> {
		const iterator = f(adapter);
		const state = iterator.next();

		function run(
			state:
				| IteratorYieldResult<Yielded>
				| IteratorReturnResult<Returned>,
		) {
			if (state.done) {
				return Maybe.some(state.value);
			}
			const val = state.value["op"];
			if (val instanceof Maybe && val.value == null) {
				return Maybe.none<Returned>();
			}
			const next = iterator.next(val.value);

			return run(next);
		}

		return run(state);
	}
}

const something = Maybe.some(5);
const result = something.gen(function* ($) {
	const lol = yield* $(Maybe.some(5));
	const lolol = yield* $(Maybe.some(6));
	const result = lol + lolol;
	return result;
});

console.log(result);
