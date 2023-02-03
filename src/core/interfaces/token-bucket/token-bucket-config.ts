import { Duration } from 'unitsnet-js';

interface AutoDripDisabled {
	enabled: false;
}

interface AutoDripEnabled {
	enabled: true;
	interval: Duration;
	tokens: number;
}

export interface TokenBucketConfig {
	bucketName?: string;

	maxTokens: number;

	startEmpty?: boolean;

	automaticDrip?: AutoDripDisabled | AutoDripEnabled;

	behavior?: {
		refund: {
			enabled: boolean;
			refundTicketsExpiry: Duration;

			autoRefund?: {
				enabled: boolean;
			}
		}
	}
}
