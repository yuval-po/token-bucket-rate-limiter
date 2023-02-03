export namespace GC {

	/**
	 * Triggers a GC cycle for the given generation.
	 *
	 * This is a long running method and may take upwards of 20ms to complete
	 *
	 * @param generation The item generation to trigger collection for
	 */
	export async function trigger(generation: string = 'all'): Promise<void> {
		// Use V8 native API to (sort-of) force GC to collect all handlers.
		// This is, from the code's perspective, non-deterministic and may take a good few seconds
		await eval(`%CollectGarbage('${generation}')`);
	}
}