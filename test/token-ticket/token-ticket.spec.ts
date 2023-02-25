import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Duration } from 'unitsnet-js';
import { GC, sleep } from '../utils';

import { TokenBucket, ITokensTicket } from '../../src';

chai.use(chaiAsPromised);

describe('TokenTicket - Sanity', () => {

	it('Issued tickets contain correct information - Refunding disabled', () => {
		const bucketName = 'Ticket Validity Check';
		const bucket = new TokenBucket({ bucketName, capacity: 10 });

		const approxIssueTimeStart = Date.now();
		const ticket = bucket.take(4);
		const approxIssueTimeEnd = Date.now();

		expect(ticket.count).to.equal(4);
		expect(ticket.expiryTime?.getTime()).to.be.undefined;
		expect(ticket.isExpired).to.be.false;
		expect(ticket.issueTime.getTime()).is.greaterThanOrEqual(approxIssueTimeStart).and.lessThanOrEqual(approxIssueTimeEnd);
		expect(ticket.key).to.not.be.undefined;
		expect(ticket.sourceBucketName).to.equal(bucketName);
		expect(ticket.wasRefunded).to.be.false;

		bucket.dispose();
	});

	it('Issued tickets contain correct information - Refunding Enabled', () => {
		const bucketName = 'Ticket Validity Check';

		const bucket = new TokenBucket({
			bucketName,
			capacity: 10,
			behavior: {
				refund: {
					enabled: true,
					refundTicketsExpiry: Duration.FromMinutes(1)
				}
			}
		});

		const approxIssueTimeStart = Date.now();
		const ticket = bucket.take(4);
		const approxIssueTimeEnd = Date.now();

		expect(ticket.count).to.equal(4);
		expect(ticket.expiryTime?.getTime()).to.be.greaterThanOrEqual(approxIssueTimeStart).and.lessThanOrEqual(approxIssueTimeEnd + Duration.FromMinutes(1).Milliseconds);
		expect(ticket.isExpired).to.be.false;
		expect(ticket.issueTime?.getTime()).to.be.greaterThanOrEqual(approxIssueTimeStart).and.lessThanOrEqual(approxIssueTimeEnd);
		expect(ticket.key).to.not.be.undefined;
		expect(ticket.sourceBucketName).to.equal(bucketName);
		expect(ticket.wasRefunded).to.be.false;

		bucket.dispose();
	});

	it('Expired tokens are correctly marked as such', async () => {
		const bucket = new TokenBucket({
			capacity: 10,
			behavior: {
				refund: {
					enabled: true,
					refundTicketsExpiry: Duration.FromMilliseconds(15)
				}
			}
		});

		const ticket = bucket.take(4);
		expect(ticket.isExpired).to.be.false;
		await sleep(17);
		expect(ticket.isExpired).to.be.true;
		bucket.dispose();
	}).slow(150);

	it('Correctly detects orphaned state', async () => {
		function getTicketWithLeakingParent(): ITokensTicket {
			const bucket = new TokenBucket({
				capacity: 10,
				behavior: {
					refund: {
						enabled: true,
						refundTicketsExpiry: Duration.FromMilliseconds(15)
					}
				}
			});

			return bucket.take(5);
		}

		const ticket = getTicketWithLeakingParent();

		const orphanedPromise = new Promise<boolean>(async (resolve) => {
			let timeout = 1000;
			let orphaned = false;
			while (timeout > 0) {
				if (ticket.isOrphaned) {
					orphaned = true;
					break;
				}
				await sleep(5);
				await GC.trigger();
				timeout -= 5;
			}
			resolve(orphaned);
		});

		expect(orphanedPromise).to.eventually.be.become(true);
		await orphanedPromise; // Probably not needed but just in case.

	}).slow(1000);

	it('Throws an error when cloned after being orphaned', async () => {
		function getTicketWithLeakingParent(): ITokensTicket {
			const bucket = new TokenBucket({
				capacity: 10,
				behavior: {
					refund: {
						enabled: true,
						refundTicketsExpiry: Duration.FromMilliseconds(15)
					}
				}
			});

			return bucket.take(5);
		}

		const ticket = getTicketWithLeakingParent();

		const orphanedPromise = new Promise<boolean>(async (resolve) => {
			let timeout = 1000;
			let orphaned = false;
			while (timeout > 0) {
				if (ticket.isOrphaned) {
					orphaned = true;
					break;
				}
				await sleep(5);
				await GC.trigger();
				timeout -= 5;
			}
			resolve(orphaned);
		});

		expect(orphanedPromise).to.eventually.be.become(true);
		await orphanedPromise; // Probably not needed but just in case.

		expect(() => ticket.clone()).to.throw(ReferenceError, /TokensTicket '.+' is orphaned and cannot be cloned/i);

	});
});

describe('TokenTicket - Refunding', () => {
	it("Refunding twice does nothing and does not raise 'refunded' event", async () => {
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

		expect(bucket.tokens).to.equal(10);
		const ticket = bucket.take(5);
		
		expect(bucket.tokens).to.equal(5);
		ticket.refund();
		

		expect(bucket.tokens).to.equal(10);
		expect(ticket.wasRefunded).to.be.true;
		bucket.take(1);

		expect(bucket.tokens).to.equal(9);
		ticket.refund();
		expect(bucket.tokens).to.equal(9);
		expect(ticket.wasRefunded).to.be.true;
	});

	it("Does not throw and correctly updates state if 'refund' is called but ticket is orphaned", async () => {
		function getTicketWithLeakingParent(): ITokensTicket {
			const bucket = new TokenBucket({
				capacity: 10,
				behavior: {
					refund: {
						enabled: true,
						refundTicketsExpiry: Duration.FromMinutes(1)
					}
				}
			});

			return bucket.take(5);
		}

		const ticket = getTicketWithLeakingParent();

		const orphanedPromise = new Promise<boolean>(async (resolve) => {
			let timeout = 1000;
			let orphaned = false;
			while (timeout > 0) {
				if (ticket.isOrphaned) {
					orphaned = true;
					break;
				}
				await sleep(5);
				await GC.trigger();
				timeout -= 5;
			}
			resolve(orphaned);
		});

		expect(orphanedPromise).to.eventually.be.become(true);
		await orphanedPromise; // Probably not needed but just in case.
		expect(ticket.wasRefunded).to.be.false;
		ticket.refund();
		expect(ticket.wasRefunded).to.be.true;
	}).slow(1000);
});