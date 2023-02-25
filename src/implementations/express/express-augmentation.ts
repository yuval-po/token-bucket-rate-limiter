import { ITokensTicket } from '../../core/interfaces';

declare module 'express' {
	interface Request {
		rateLimiterTicket?: ITokensTicket;
	}
}
