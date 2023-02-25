import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chaiSubset from 'chai-subset';

import { MiddlewareContext, createRateLimitMiddleware } from '../../../src/implementations/express/rate-limit-express';
import { Duration } from 'unitsnet-js';
import { DEFAULT_DUMMY_RESULT, ExpressFixture } from '../../fixtures/express/express-server';
import { NextFunction, Request, Response } from 'express';
import { TokenBucket, TokensTicket, ITokensTicket, OutOfTokensError } from '../../../src';

chai.use(chaiAsPromised);
chai.use(chaiSubset);

describe('Rate-Limit Express Middleware - Sanity', () => {
	let fixture: ExpressFixture;
	afterEach(() => { fixture?.stop(); });


	it('Can is created and can be attached to an Express application', async () => {
		const bucket = new TokenBucket({
			capacity: 10,
			automaticDrip: {
				enabled: false,
			},
			behavior: {
				refund: {
					enabled: true,
					refundTicketsExpiry: Duration.FromMinutes(1)
				}
			}
		});

		expect(() => { fixture = new ExpressFixture([createRateLimitMiddleware({ bucket, routeCost: 1 })]) }).to.not.throw();
	});

	it('Does not cause errors to be thrown', async () => {
		const bucket = new TokenBucket({
			capacity: 10,
			automaticDrip: {
				enabled: false,
			},
			behavior: {
				refund: {
					enabled: true,
					refundTicketsExpiry: Duration.FromMinutes(1)
				}
			}
		});

		fixture = new ExpressFixture([createRateLimitMiddleware({ bucket, routeCost: 1 })]);
		await fixture.listen();
		const request = fixture.callGetDummy();
		await expect(request).to.eventually.be.fulfilled;
		const response = await request;
		expect(response?.body).to.deep.eq(DEFAULT_DUMMY_RESULT);
	});

	it("Correctly passes 'OutOfTokens' errors", async () => {
		const bucket = new TokenBucket({
			capacity: 1,
			automaticDrip: {
				enabled: false,
			},
			behavior: {
				refund: {
					enabled: true,
					refundTicketsExpiry: Duration.FromMinutes(1)
				}
			}
		});

		const errorCaughtPromise = new Promise<void>(async (resolve, reject) => {
			function errorMiddleware(error: any, _req: Request, _res: Response, _next: NextFunction) {
				if (error) {
					resolve();
				} else {
					reject()
				}
			}

			fixture = new ExpressFixture([createRateLimitMiddleware({ bucket, routeCost: 10 }), errorMiddleware]);
			await fixture.listen();
			fixture.callGetDummy();
		});

		await expect(errorCaughtPromise).to.eventually.be.fulfilled;
	});

	it("Correctly calls the 'onOutOfTokensError' handler", async () => {
		const bucket = new TokenBucket({
			capacity: 1,
			bucketName: 'onOutOfTokensError Handler Test',
			automaticDrip: {
				enabled: false,
			},
			behavior: {
				refund: {
					enabled: true,
					refundTicketsExpiry: Duration.FromMinutes(1)
				}
			}
		});

		const outOfTokensEvent = new Promise<OutOfTokensError>(async (resolve) => {
			function onOutOfTokensError(err: OutOfTokensError, context: MiddlewareContext) {
				resolve(err);
			}

			// Just to suppress errors
			function errorSuppressor(error: any, _req: Request, _res: Response, _next: NextFunction) { }

			fixture = new ExpressFixture([createRateLimitMiddleware({ bucket, routeCost: 10, onOutOfTokensError }), errorSuppressor]);
			await fixture.listen();
			fixture.callGetDummy();
		});

		await expect(outOfTokensEvent).to.eventually.be.fulfilled;
		const errorObject = await outOfTokensEvent;

		expect(errorObject).to.containSubset({
			availableCount: 1,
			requestedCount: 10,
			bucketName: 'onOutOfTokensError Handler Test'
		});
	});

	it("Correctly calls next() when a non-OutOfTokensError occurs", async () => {
		const bucket = new TokenBucket({
			capacity: 100,
			automaticDrip: {
				enabled: false,
			},
			behavior: {
				refund: {
					enabled: true,
					refundTicketsExpiry: Duration.FromMinutes(1)
				}
			}
		});

		// Force the rate-limiter middleware to throw an unexpected error
		(bucket as any).take = undefined;

		const errorCaughtPromise = new Promise<void>(async (resolve, reject) => {
			function errorMiddleware(error: any, _req: Request, _res: Response, _next: NextFunction) {
				if (error instanceof TypeError) {
					resolve();
				} else {
					reject()
				}
			}

			fixture = new ExpressFixture([createRateLimitMiddleware({ bucket, routeCost: 10 }), errorMiddleware]);
			await fixture.listen();
			fixture.callGetDummy();
		});

		await expect(errorCaughtPromise).to.eventually.be.fulfilled;
	});

	it("Does not raises the onOutOfTokensError event when a non-OutOfTokensError occurs", async () => {
		const bucket = new TokenBucket({
			capacity: 100,
			automaticDrip: {
				enabled: false,
			},
			behavior: {
				refund: {
					enabled: true,
					refundTicketsExpiry: Duration.FromMinutes(1)
				}
			}
		});

		// Force the rate-limiter middleware to throw an unexpected error
		(bucket as any).take = undefined;

		function errorSuppressor(_error: any, _req: Request, _res: Response, _next: NextFunction) { }

		const noOutOfTokensErrorPromise = new Promise<void>(async (resolve, reject) => {

			function onOutOfTokensError() {
				reject();
			}

			fixture = new ExpressFixture([createRateLimitMiddleware({ bucket, onOutOfTokensError, routeCost: 10 }), errorSuppressor]);
			await fixture.listen();
			fixture.callGetDummy();
			// A bit of a hack; Wait 20ms for a possible rejection via the onOutOfTokensError callback; If it wasn't called, consider the test a success
			setTimeout(() => resolve(), 20);
		});

		await expect(noOutOfTokensErrorPromise).to.eventually.be.fulfilled;
	});

	it("Correctly injects token tickets into Express requests", async () => {
		const bucket = new TokenBucket({
			bucketName: 'Injection test',
			capacity: 100,
			automaticDrip: {
				enabled: false,
			},
			behavior: {
				refund: {
					enabled: true,
					refundTicketsExpiry: Duration.FromMinutes(1)
				}
			}
		});

		const afterRateLimiterPromise = new Promise<ITokensTicket | undefined>(async (resolve) => {

			function afterRateLimiter(req: Request) {
				resolve(req.rateLimiterTicket);
			}

			fixture = new ExpressFixture([createRateLimitMiddleware({ bucket, routeCost: 1 }), afterRateLimiter]);
			await fixture.listen();
			fixture.callGetDummy();
		});

		await expect(afterRateLimiterPromise).to.eventually.be.fulfilled;
		const ticket = await afterRateLimiterPromise;
		expect(ticket).to.be.instanceOf(TokensTicket);

		// A small extra check, just to make sure the correct ticket is returned. Not strictly necessary
		expect(ticket).to.containSubset({
			sourceBucketName: 'Injection test',
			count: 1,
		});
	});
});
