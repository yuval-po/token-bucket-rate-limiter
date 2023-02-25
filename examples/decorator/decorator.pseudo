import { TokenBucket, RateLimit } from 'token-bucket-rate-limiter';

const syncNonRefundingBucket = new TokenBucket({ capacity: 100 });

export class Service {
	@RateLimit({ bucket: syncNonRefundingBucket, cost: 1 })
	public lightWeightOperation(): void {
		// Do something
	}

	@RateLimit({ bucket: syncRefundingBucket, cost: 10 })
	public mediumWeightOperation(): void {
		// Do something demanding
	}

	@RateLimit({ bucket: syncNonRefundingBucket, cost: 50 })
	public async heavyWeightOperation(): Promise<void> {
		// Do something very demanding
	}
}
