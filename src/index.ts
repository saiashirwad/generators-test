type Nullish<T> = null | undefined | T;

function* a() {
	yield 5;
}

function* b() {
	const result = yield* a();
}

class Nullable<T> {
	constructor(private value: Nullish<T>) {}

	static of<U>(value: U | Nullish<U>): Nullable<U> {
		return new Nullable(value);
	}

	map<U>(mapper: (value: T) => U): Nullable<Nullish<U>> {
		if (this.value == null) return Nullable.of(null);
		return Nullable.of(mapper(this.value));
	}

	flatMap<U>(
		mapper: (value: T) => Nullable<U>,
	): Nullable<Nullish<U>> {
		return this.value != null
			? mapper(this.value)
			: Nullable.of(null);
	}

	get(): T | undefined {
		return this.value != null ? this.value : undefined;
	}

	match<U>(cases: {
		null: () => U;
		undefined: () => U;
		value: (value: NonNullable<T>) => U;
	}): U {
		if (this.value === null) {
			return cases.null();
		}
		if (this.value === undefined) {
			return cases.undefined();
		}
		return cases.value(this.value);
	}

	static zip<T, U>(
		a: Nullable<T>,
		b: Nullable<U>,
	): Nullable<Nullish<[T, U]>> {
		return a.flatMap((aValue) =>
			b.map((bValue) => [aValue, bValue] as [T, U]),
		);
	}

	*[Symbol.iterator](): Iterator<T | undefined | null> {
		if (this.value == null) {
			return {
				next: () => ({ done: true, value: undefined }),
			};
		}
		return {
			next: () => ({ done: false, value: this.value }),
		};
	}

	static gen<T>(
		f: (_: Nullable<T>) => Generator<Nullable<any>, T, any>,
	): Nullable<T> {
		function run(
			gen: Generator<Nullable<any>, T, any>,
		): Nullable<T | undefined> {
			const iterator = f(adapter as any);
			const state = iterator.next();

			function run() {}
			// const { value, done } = gen.next();
			// if (done) return Nullable.of(value);
			// return value.flatMap((val) => run(gen));
		}
		return run(f()) as Nullable<T>;
	}
}

function adapter(_: any) {
	return new Nullable(_);
}

// function* $<
// 	T,
// 	U,
// 	Return extends U extends Nullable<any> ? any : never,
// >(
// 	nullable: Nullable<T>,
// 	f?: (value: T) => U,
// ): Generator<Nullable<T>, Return, T> {
// 	if (f == null) {
// 		yield nullable as any;
// 	}
// 	// @ts-expect-error this is fine
// 	return f(yield nullable as any);
// }

// const example = Nullable.gen(function* () {
// 	const c = yield* $(Nullable.of(5));
// 	const d = yield* $(Nullable.of(undefined));
// 	const result = c + d;
// 	return result;
// });
