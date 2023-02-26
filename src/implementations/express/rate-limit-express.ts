import { Request, Response, NextFunction, RequestHandler } from 'express';
import './express-augmentation';

import { OutOfTokensError } from '../../core/error-handling/out-of-tokens-error';
import { ITokenBucket } from '../../core/interfaces';

/**
 * A context object, exposes the rate-limiter middleware function's state
 */
export type MiddlewareContext = { req: Request, res: Response, next: NextFunction };

export interface RateLimitOptions {
	/**
 	* The token bucket used to rate limit requests
 	*/
	bucket: ITokenBucket;

	/**
 	* The number of tokens required to process a request
 	*/
	routeCost: number;

	/**
 	* A callback function to be called when the token bucket is empty.
 	* This function can be used to handle the case where the rate limit has been exceeded
 	*/
	onOutOfTokensError?: (err: OutOfTokensError, middlewareContext: MiddlewareContext) => unknown;
}

/**
 * Creates a rate limit middleware that can be used to rate limit requests by using a token-bucket mechanism
 *
 * @description When a request successfully passes through this middleware, it is injected with the 'rateLimiterTicket' property
 * to allow lower level code to, for example signal that the operation has concluded and the
 * tokens may be refunded (depending on bucket configuration)
 *
 * @param opts - The rate limit options
 * @returns A middleware function that can be used by Express to rate limit requests
 */
export function createRateLimitMiddleware(opts: RateLimitOptions): RequestHandler {
	return (req: Request, res: Response, next: NextFunction) => {
		try {
			req.rateLimiterTicket = opts.bucket.take(opts.routeCost);
			next();
		} catch (err) {
			if (err instanceof OutOfTokensError) {
				opts.onOutOfTokensError?.(err, { req, res, next });
			}
			next(err);
		}
	};
}
