import { TokenBucket } from '../../src/core/token-bucket';
import { Duration } from 'unitsnet-js';
import { RateLimit } from '../../src/decorators/rate-limit';

const syncNonRefundingBucket = new TokenBucket({ capacity: 20 });

const syncRefundingBucket = new TokenBucket({
	capacity: 20,
	behavior: {
		refund: {
			enabled: true,
			refundTicketsExpiry: Duration.FromMinutes(1),
		}
	}
});

export function resetBuckets(): void {
	syncNonRefundingBucket.drip(10000);
	syncRefundingBucket.drip(10000);
}

export class RateLimitTest {
	@RateLimit({ bucket: syncNonRefundingBucket, cost: 10 })
	public syncNonRefundableActionCost10(): boolean {
		return true;
	}

	@RateLimit({ bucket: syncRefundingBucket, cost: 10 })
	public syncRefundableActionCost10(): boolean {
		return true;
	}

	@RateLimit({ bucket: syncNonRefundingBucket, cost: 10 })
	public async asyncNonRefundableActionCost10(): Promise<boolean> {
		return true;
	}

	@RateLimit({ bucket: syncRefundingBucket, cost: 10 })
	public async asyncRefundableActionCost10(): Promise<boolean> {
		return true;
	}
}
