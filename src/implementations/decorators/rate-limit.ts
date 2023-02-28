import { ITokenBucket } from '../../core/interfaces';

/**
 * Options for configuration of the {@link RateLimit} decorator
 *
 * @export
 * @interface RateLimiterOpts
 */
export interface RateLimiterOpts {
	/**
	 * The token bucket the rate limiter should use
	 *
	 * @type {ITokenBucket}
	 * @memberof RateLimiterOpts
	 */
	bucket: ITokenBucket;

	/**
	 * The cost of the operation being rate-limited
	 *
	 * @type {number}
	 * @memberof RateLimiterOpts
	 */
	cost: number;
}

/**
 * A decorator function that applies rate limiting using a token bucket to the decorated method
 *
 * @export
 * @param {RateLimiterOpts} opts Rate limiter configuration options
 * @return {*}
 */
export function RateLimit(opts: RateLimiterOpts): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void {
	return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
		const originalValue: Function = descriptor.value;

		// Wrap the original method with rate-limiting logic.
		// eslint-disable-next-line no-param-reassign
		descriptor.value = (...args: any[]) => {
			const ticket = opts.bucket.take(opts.cost);
			const result = originalValue.apply(target, args);

			if (result instanceof Promise) {
				// If the result is a Promise, add a refund handler to the Promise chain
				result.then((res) => {
					ticket.refund();
					return res;
				});
			} else {
				// If the result is not a Promise, refund the ticket immediately
				ticket.refund();
			}

			return result;
		};
	};
}
