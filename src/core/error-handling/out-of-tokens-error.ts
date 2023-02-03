export interface OutOfTokensErrorMeta {
	availableCount: number;
	requestedCount: number;
	bucketName?: string;
}

export class OutOfTokensError extends Error implements OutOfTokensErrorMeta {

	public constructor(
		public readonly availableCount: number,
		public readonly requestedCount: number,
		public readonly bucketName?: string
	) {
		const messagePrefix = bucketName ? `Token Bucket '${bucketName}'` : 'The given token bucket';
		super(`${messagePrefix} does not have enough tokens to fulfil the request. `
			+ `Available: ${availableCount}, requested: ${requestedCount}`);
	}
}
