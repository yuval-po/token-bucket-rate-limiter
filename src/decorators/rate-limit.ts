import { ITokenBucket } from '../core/interfaces';

export interface RateLimiterOpts {
	bucket: ITokenBucket;
	cost: number;
}

export function RateLimit(opts: RateLimiterOpts) {
	return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
		const originalValue: Function = descriptor.value;

		// eslint-disable-next-line no-param-reassign
		descriptor.value = (...args: any[]) => {
			const ticket = opts.bucket.take(opts.cost);
			const result = originalValue.apply(target, args);

			if (result instanceof Promise) {
				result.then((res) => {
					ticket.refund();
					return res;
				});
			} else {
				ticket.refund();
			}

			return result;
		};
	};
}
