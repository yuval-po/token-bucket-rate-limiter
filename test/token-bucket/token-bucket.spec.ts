import { sleep } from '../utils';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Duration } from 'unitsnet-js';

import { TokenBucket, OutOfTokensError, TokenBucketConfig } from '../../src';
import { setOrphanCheckInterval, clearActiveCaches } from '../../src/core/token-bucket';

chai.use(chaiAsPromised);


describe('TokenBucket - Static Configuration and Components', () => {
	it("Does not throw when calling 'setOrphanCheckInterval'", () => {
		expect(() => setOrphanCheckInterval(Duration.FromMilliseconds(5))).to.not.throw();
	});

	it('Does not throw when a bucket is disposed but cache entry cannot be found', () => {
		expect(() => {
			const config: TokenBucketConfig = {
				capacity: 100,
				behavior: {
					refund: {
						enabled: true,
						refundTicketsExpiry: Duration.FromMinutes(5),
					}
				}
			};
			const bucket = new TokenBucket(config);
			clearActiveCaches();
			bucket.dispose();
		}).to.not.throw();
	})
});

describe('TokenBucket - Construction', () => {
	it('Throw a TypeError when created with an empty configuration', () => {
		expect(() => new TokenBucket(undefined as any).dispose()).to.throw(TypeError);
		expect(() => new TokenBucket(null as any).dispose()).to.throw(TypeError);
	});

	it('Does not throw when created with the most minimal configuration', () => {
		const config: TokenBucketConfig = { capacity: 100 };
		expect(() => new TokenBucket(config).dispose()).to.not.throw();
	});

	it('Does not throw when created with a standard configuration', () => {
		const config: TokenBucketConfig = {
			bucketName: "Bucket for test 'Does not throw when created with a standard configuration'",
			capacity: 100,
			behavior: {
				refund: {
					enabled: true,
					refundTicketsExpiry: Duration.FromMinutes(5),
				}
			},
			automaticDrip: {
				enabled: true,
				interval: Duration.FromSeconds(1),
				tokens: 1,
			}
		}

		expect(() => new TokenBucket(config).dispose()).to.not.throw();
	});

	it('Does not throw when created with a full configuration', () => {
		const config: TokenBucketConfig = {
			bucketName: "Bucket for test 'Does not throw when created with a full configuration'",
			capacity: 100,
			behavior: {
				refund: {
					enabled: true,
					refundTicketsExpiry: Duration.FromMinutes(5),
					autoRefund: {
						enabled: true,
					}
				}
			},
			automaticDrip: {
				enabled: true,
				interval: Duration.FromSeconds(1),
				tokens: 1,
			}
		}

		expect(() => new TokenBucket(config).dispose()).to.not.throw();
	});

});

describe('TokenBucket - Destruction', () => {
	it("Calling 'dispose' does not throw", () => {
		const bucket = new TokenBucket({ capacity: 100 });
		expect(() => bucket.dispose()).to.not.throw();
	});

	it("Calling 'dispose' updates the 'isDisposed' property", () => {
		const bucket = new TokenBucket({ capacity: 100 });
		expect(bucket.isDisposed).to.be.false;
		bucket.dispose();
		expect(bucket.isDisposed).to.be.true;
	});

	it("Does not throw when calling 'dispose' more than once", () => {
		const bucket = new TokenBucket({ capacity: 100 });
		bucket.dispose();
		expect(() => bucket.dispose()).to.not.throw();
	});
});

describe('TokenBucket - Accessors', () => {
	it("Properly handles 'name' property access", () => {
		let bucket = new TokenBucket({ capacity: 100 });

		expect(bucket.capacity).to.equal(100);

		expect(bucket.name).to.be.undefined;
		bucket.dispose();

		bucket = new TokenBucket({ capacity: 100, bucketName: 'TEST_NAME' });
		expect(bucket.name).to.equal('TEST_NAME');
		bucket.dispose();
	});

	it("Properly handles 'isRefundEnabled' property access", () => {
		let bucket = new TokenBucket({ capacity: 100 });
		expect(bucket.isRefundEnabled).to.be.false;
		bucket.dispose();

		bucket = new TokenBucket({
			capacity: 100,
			behavior: {
				refund: {
					enabled: true,
					refundTicketsExpiry: Duration.FromMinutes(1)
				}
			}
		});

		expect(bucket.isRefundEnabled).to.be.true;
		bucket.dispose();
	});

	it("Properly handles 'isAutoRefundEnabled' property access - Auto Refund section defined", () => {
		let bucket = new TokenBucket({ capacity: 100 });
		expect(bucket.isAutoRefundEnabled).to.be.false;
		bucket.dispose();

		bucket = new TokenBucket({
			capacity: 100,
			behavior: {
				refund: {
					enabled: true,
					refundTicketsExpiry: Duration.FromMinutes(1),
					autoRefund: {
						enabled: true
					}
				}
			}
		});

		expect(bucket.isAutoRefundEnabled).to.be.true;
		bucket.dispose();
	});

	it("Properly handles 'isAutoRefundEnabled' property access - Auto Refund section undefined", () => {
		let bucket = new TokenBucket({ capacity: 100 });
		expect(bucket.isAutoRefundEnabled).to.be.false;
		bucket.dispose();

		bucket = new TokenBucket({
			capacity: 100,
			behavior: {
				refund: {
					enabled: true,
					refundTicketsExpiry: Duration.FromMinutes(1),
				}
			}
		});

		expect(bucket.isAutoRefundEnabled).to.be.false;
		bucket.dispose();
	});
});


describe('TokenBucket - Taking Tokens', () => {
	it('Does not throw when tokens are taken when available', () => {
		const bucket = new TokenBucket({ capacity: 100 })
		expect(() => bucket.take(1)).to.not.throw();

		bucket.dispose();
	});

	it('Does not throw when all available tokens are taken', () => {
		const bucket = new TokenBucket({ capacity: 100 })
		expect(() => bucket.take(100)).to.not.throw();

		bucket.dispose();
	});

	it("Throws a 'RangeError' when attempting to a non-positive-number of tokens", () => {
		const bucket = new TokenBucket({ capacity: 100 })
		expect(() => bucket.take(0)).to.throw(RangeError);
		expect(() => bucket.take(-1)).to.throw(RangeError);
		expect(() => bucket.take('str' as any)).to.throw(RangeError);
		expect(() => bucket.take(undefined as any)).to.throw(RangeError);
		expect(() => bucket.take(null as any)).to.throw(RangeError);
		bucket.dispose();
	});


	it("Throws an 'OutOfTokensError' when attempting to take tokens when none are available", () => {
		const bucket = new TokenBucket({ capacity: 0 })
		expect(() => bucket.take(1)).to.throw(OutOfTokensError);

		bucket.dispose();
	});

	it("Throws an 'OutOfTokensError' when attempting to take more tokens than are available", () => {
		const bucket = new TokenBucket({ capacity: 100 })
		expect(() => bucket.take(101)).to.throw(OutOfTokensError);

		bucket.dispose();
	});

	it("Thrown 'OutOfTokensError' errors are correct", () => {
		const bucket = new TokenBucket({ capacity: 100 })
		expect(() => bucket.take(101)).to.throw(
			OutOfTokensError,
			/.*does not have enough tokens to fulfil the request. Available: 100, requested: 101$/
		);

		bucket.dispose();
	});

	it('Bucket updates correctly when tokens are taken', () => {
		const bucket = new TokenBucket({ capacity: 10 });
		bucket.take(4);
		expect(bucket.tokens).to.equal(6);

		bucket.dispose();
	});
});


describe('TokenBucket - Refunding Tokens', () => {
	it('Does not throw when tokens are refunded - Refunding Disabled', () => {
		const bucket = new TokenBucket({ capacity: 10 });

		const ticket = bucket.take(4);
		expect(() => bucket.refund(ticket)).to.not.throw();
		bucket.dispose();
	});

	it('Bucket does not refund tokens - Refunding Disabled', () => {
		const bucket = new TokenBucket({ capacity: 10 });

		const ticket = bucket.take(5);
		bucket.refund(ticket);
		expect(bucket.tokens).to.equal(5);
		bucket.dispose();
	});

	it('Does not throw when tokens are refunded - Refunding Enabled', () => {
		const bucket = new TokenBucket({
			capacity: 10,
			behavior: {
				refund: {
					enabled: true,
					refundTicketsExpiry: Duration.FromMinutes(10)
				}
			}
		});

		const ticket = bucket.take(4);
		expect(() => bucket.refund(ticket)).to.not.throw();
		bucket.dispose();
	});

	it('Tokens are refunded when a valid ticket is refunded - Refunding Enabled', () => {
		const bucket = new TokenBucket({
			capacity: 10,
			behavior: {
				refund: {
					enabled: true,
					refundTicketsExpiry: Duration.FromMinutes(10)
				}
			}
		});

		const ticket = bucket.take(5);
		bucket.refund(ticket);
		expect(bucket.tokens).to.equal(10);
		bucket.dispose();
	});

	it('Tokens are not refunded when an expired ticket is refunded - Refunding Enabled', async () => {
		const bucket = new TokenBucket({
			capacity: 10,
			behavior: {
				refund: {
					enabled: true,
					refundTicketsExpiry: Duration.FromMilliseconds(1)
				}
			}
		});

		const ticket = bucket.take(5);
		await sleep(3);
		bucket.refund(ticket);
		expect(bucket.tokens).to.equal(5, 'Refund issued after expiration');
		bucket.dispose();
	});

	it('Tokens are refunded when tickets expire and auto-refund is enabled', async () => {
		const capacity = 10;
		const bucket = new TokenBucket({
			capacity,
			automaticDrip: {
				enabled: false,
			},
			behavior: {
				refund: {
					enabled: true,
					refundTicketsExpiry: Duration.FromMilliseconds(1),
					autoRefund: {
						enabled: true,
					}
				}
			}
		});
		const autoRefundPromise = new Promise<number>((resolve) => {
			bucket.tokensRefunded.attach((sender, e) => {
				resolve(e);
			});
		});

		const tokensToTake = 3;
		bucket.take(tokensToTake);

		await expect(autoRefundPromise).to.eventually.become(tokensToTake);
		expect(bucket.tokens).to.equal(capacity)
	}).slow(1500);

	it('Refunded tickets are not refunded again upon expire when auto-refund is enabled', async () => {
		const bucket = new TokenBucket({
			capacity: 100,
			startEmpty: true,
			automaticDrip: {
				enabled: false,
			},
			behavior: {
				refund: {
					enabled: true,
					refundTicketsExpiry: Duration.FromMilliseconds(2),
					autoRefund: {
						enabled: true,
					}
				}
			}
		});
		bucket.drip(10);
		const ticket = bucket.take(5);
		bucket.refund(ticket);
		await sleep(20);
		expect(bucket.tokens).to.equal(10)
	});

});

describe('TokenBucket - Dripping', () => {
	it("Throws an error if 'drip' is called with an argument other than a positive integer", () => {
		const bucket = new TokenBucket({ capacity: 100 });
		expect(() => bucket.drip(0)).to.throw(RangeError);
		expect(() => bucket.drip(-1)).to.throw(RangeError);
		expect(() => bucket.drip(undefined as any)).to.throw(RangeError);
		expect(() => bucket.drip({} as any)).to.throw(RangeError);
		expect(() => bucket.drip('str' as any)).to.throw(RangeError);
	});

	it("Does not increment tokens beyond what's specified by 'capacity'", () => {
		const capacity = 100;
		const bucket = new TokenBucket({ capacity });
		expect(bucket.tokens).to.equal(capacity);
		try {
			bucket.drip(10)
		} finally { }

		expect(bucket.tokens).to.equal(capacity);

	});
});

describe('TokenBucket - Events', () => {
	it("Properly raises event 'dripped' when autoDrip is enabled", () => {
		const tokensToDrip = 1;

		const bucket = new TokenBucket({
			capacity: 10000,
			startEmpty: true,
			automaticDrip: {
				enabled: true,
				interval: Duration.FromMilliseconds(1),
				tokens: tokensToDrip,
			}
		});

	
		const drippedPromise = new Promise<number>((resolve) => {
			bucket.dripped.attach((sender, e) => resolve(e));
		});

		expect(drippedPromise).to.eventually.become(tokensToDrip);
	});

	it("Properly raises event 'dripped' when autoDrip is disabled and drip is manually called", () => {
		const tokensToDrip = 1;

		const bucket = new TokenBucket({ capacity: 10000, startEmpty: true });

		const drippedPromise = new Promise<number>((resolve) => {
			bucket.dripped.attach((sender, e) => resolve(e));
		});

		bucket.drip(tokensToDrip);
		expect(drippedPromise).to.eventually.become(tokensToDrip);
	});

	it("Properly raises event 'tokensTaken'", () => {
		const bucket = new TokenBucket({
			capacity: 10000,
			automaticDrip: {
				enabled: true,
				interval: Duration.FromMilliseconds(1),
				tokens: 1
			}
		});

		const tokensToTake = 15;
	
		const tokensTakenPromise = new Promise<number>((resolve) => {
			bucket.tokensTaken.attach((sender, e) => resolve(e));
		});

		bucket.take(15);

		expect(tokensTakenPromise).to.eventually.become(tokensToTake);
	});

	it("Properly raises event 'tokensRefunded'", () => {
		const bucket = new TokenBucket({
			capacity: 10000,
			automaticDrip: {
				enabled: true,
				interval: Duration.FromMilliseconds(1),
				tokens: 1
			}
		});

		const tokensToTake = 15;

		const tokensRefundedPromise = new Promise<number>((resolve) => {
			bucket.tokensRefunded.attach((sender, e) => resolve(e));
		});

		const ticket = bucket.take(tokensToTake);
		bucket.refund(ticket);

		expect(tokensRefundedPromise).to.eventually.become(tokensToTake);
	});
	
});
