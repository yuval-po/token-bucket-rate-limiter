import { TokenBucket } from 'token-bucket-rate-limiter';
import { Duration } from 'unitsnet-js';

const config = {
	capacity: 100,
	behavior: {
		refund: {
			enabled: true,
			refundTicketsExpiry: Duration.fromMinutes(30),
			autoRefund: {
				enabled: true
			}
		}
	}
};

const bucket = new TokenBucket(config);
