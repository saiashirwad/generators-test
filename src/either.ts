export class Either<R, L = never> {
	private constructor(
		private readonly _tag: "Left" | "Right",
		private readonly value: L | R,
	) {}

	static left<L, R>(value: L): Either<L, R> {
		return new Either<L, R>("Left", value);
	}

	static right<L, R>(value: R): Either<L, R> {
		return new Either<L, R>("Right", value);
	}

	isLeft(): this is Either<L, never> {
		return this._tag === "Left";
	}

	isRight(): this is Either<never, R> {
		return this._tag === "Right";
	}

	match<B, C = B>(params: {
		onLeft: (left: L) => B;
		onRight: (right: R) => C;
	}): B | C {
		return this.isLeft()
			? params.onLeft(this.value as L)
			: params.onRight(this.value as R);
	}
}
