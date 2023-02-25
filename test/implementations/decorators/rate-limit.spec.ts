import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { OutOfTokensError } from '../../../src';

chai.use(chaiAsPromised);

import { RateLimitTest, resetBuckets } from './decorator-test-classes';

describe("Decorator 'RateLimit' - Sanity", () => {
	it('Can be applied and hoisted on to class methods', () => {
		expect(() => new RateLimitTest()).to.not.throw();
	});
});


describe("Decorator 'RateLimit' - Synchronous methods", () => {
	beforeEach(() => { resetBuckets(); });

	it('Does not throw or affect results when bucket has enough tokens for synchronous operation', () => {
		const tester = new RateLimitTest();
		expect(() => tester.syncNonRefundableActionCost10()).to.not.throw();
		expect(tester.syncNonRefundableActionCost10()).to.equal(true);
	});


	it("Throw an 'OutOfTokensError' when bucket does not have enough tokens for synchronous operation", () => {
		const tester = new RateLimitTest();
		tester.syncNonRefundableActionCost10();
		tester.syncNonRefundableActionCost10();
		expect(() => tester.syncNonRefundableActionCost10()).to.throw(OutOfTokensError);
	});

	it("'OutOfTokensError' can be caught with try-catch", async () => {
		const tester = new RateLimitTest();
		tester.syncNonRefundableActionCost10();
		tester.syncNonRefundableActionCost10();
		try {
			tester.syncNonRefundableActionCost10();
		} catch (err) {
			expect(err).to.be.an.instanceOf(OutOfTokensError);
		}
	});
});


describe("Decorator 'RateLimit' - Asynchronous methods", () => {
	beforeEach(() => { resetBuckets(); });

	it('Does not throw or affect results when bucket has enough tokens', async () => {
		const tester = new RateLimitTest();
		expect(async () => await tester.asyncNonRefundableActionCost10()).to.not.throw();
		expect(await tester.asyncNonRefundableActionCost10()).to.equal(true);
	});


	it("Throw an 'OutOfTokensError' when bucket does not have enough tokens", async () => {
		const tester = new RateLimitTest();
		await tester.asyncNonRefundableActionCost10();
		await tester.asyncNonRefundableActionCost10();
		expect(() => tester.asyncNonRefundableActionCost10()).to.throw(OutOfTokensError);
	});

	it("'OutOfTokensError' can be caught with try-catch", async () => {
		const tester = new RateLimitTest();
		await tester.asyncNonRefundableActionCost10();
		await tester.asyncNonRefundableActionCost10();
		try {
			await tester.asyncNonRefundableActionCost10();
		} catch (err) {
			expect(err).to.be.an.instanceOf(OutOfTokensError);
		}
	});

	it("Properly refunds tokens when operation concludes and bucket refunding is enabled", async () => {
		const tester = new RateLimitTest();
		await tester.asyncRefundableActionCost10();
		await tester.asyncRefundableActionCost10();
		expect(async () => {
			await tester.asyncRefundableActionCost10();
			await tester.asyncRefundableActionCost10();
			await tester.asyncRefundableActionCost10();
			await tester.asyncRefundableActionCost10();
		}).to.not.throw(OutOfTokensError);
	});
});
