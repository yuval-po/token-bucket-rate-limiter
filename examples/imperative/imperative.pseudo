import { TokenBucket } from 'token-bucket-rate-limiter';

const bucket = new TokenBucket({ capacity: 100 });

export function rateLimitedAction(): void {
	bucket.take(10);
	// Do something
}