// Types-only import
// eslint-disable-next-line import/no-extraneous-dependencies
import { Request, Response, NextFunction, RequestHandler } from 'express';
import './express-augmentation';

import { OutOfTokensError } from '../../core/error-handling/out-of-tokens-error';
import { ITokenBucket, ITokensTicket } from '../../core/interfaces';

export type MiddlewareContext = { req: Request, res: Response, next: NextFunction };

export interface RateLimitOptions {
	bucket: ITokenBucket;
	routeCost: number;
	onOutOfTokensError?: (err: OutOfTokensError, middlewareContext: MiddlewareContext) => unknown;
}

export function createRateLimitMiddleware(opts: RateLimitOptions): RequestHandler {
	return (req: Request, res: Response, next: NextFunction) => {
		try {
			(req as unknown as { rateLimiterTicket: ITokensTicket }).rateLimiterTicket = opts.bucket.take(opts.routeCost);
			next();
		} catch (err) {
			if (err instanceof OutOfTokensError) {
				opts.onOutOfTokensError?.(err, { req, res, next });
			}
			next(err);
		}
	};
}
