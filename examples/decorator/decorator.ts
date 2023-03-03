import { TokenBucket, RateLimit } from 'token-bucket-rate-limiter';

const bucket = new TokenBucket({ capacity: 100 });

// A service class with all methods using the same bucket (i.e. resource pool)
export class Service {
	@RateLimit({ bucket, cost: 1 })
	public lightWeightOperation(): void {
		// Do something
	}

	@RateLimit({ bucket, cost: 10 })
	public mediumWeightOperation(): void {
		// Do something demanding
	}

	@RateLimit({ bucket, cost: 50 })
	public async heavyWeightOperation(): Promise<void> {
		// Do something very demanding
	}
}
