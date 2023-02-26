import { TokenBucket } from 'token-bucket-rate-limiter';
import { Duration } from 'unitsnet-js';

const config = {
	capacity: 100,
	automaticDrip: {
		enabled: true,
		interval: Duration.fromSeconds(5),
		tokens: 5
	}
};

const bucket = new TokenBucket(config);
