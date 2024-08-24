export class Gen<K, A> {
	constructor(readonly op: K) {}

	*[Symbol.iterator](): Generator<Gen<K, A>, A, any> {
		return yield this;
	}
}

function adapter(_: any) {
	return new Gen(_);
}

function gen<G extends Gen<any, any>, H>(
	f: (iter: any) => Generator<G, H, any>,
) {
	const iterator = f(adapter as any);
	function run(
		state: IteratorYieldResult<G> | IteratorReturnResult<H>,
	) {}
}

const program = gen(function* ($) {});
