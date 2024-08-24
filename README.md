# Bad parsers, don't use (except for fun)

```typescript
const smolParser = Parser.gen(function* () {
	const hs = yield* many(char("h"));
	const ts = yield* many(char("t"));
	const v = yield* char("v");

	return { hs, ts, v };
});

const parseTexoport = Parser.gen(function* () {
	for (const i of "texoport") {
		yield* char(i);
	}
	return "texoport acquired" as const;
});

const bigParser = Parser.gen(function* () {
	const smol = yield* smolParser;
	const texStatus = yield* parseTexoport;

	return {
		smol,
		texStatus,
	};
});

const lol = bigParser.run("hhhtttvtexoport");
Either.match(lol, {
	onRight: console.log,
	onLeft: console.log,
});

```
