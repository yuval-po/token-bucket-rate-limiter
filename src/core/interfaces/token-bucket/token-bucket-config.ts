import { Duration } from 'unitsnet-js';

interface AutoDripDisabled {
	/**
	 * A boolean indicating whether the bucket should periodically receive new tokens
	 *
	 * @type {false}
	 * @memberof AutoDripDisabled
	 */
	enabled: false;
}

interface AutoDripEnabled {
	/**
	 * A boolean indicating whether the bucket should periodically receive new tokens
	 *
	 * @type {true}
	 * @memberof AutoDripEnabled
	 */
	enabled: true;

	/**
	 * The regular interval at which tokens should be dripped into the bucket
	 *
	 * @type {Duration}
	 * @memberof AutoDripEnabled
	 */
	interval: Duration;

	/**
	 * The number of tokens to drip per interval
	 *
	 * @type {number}
	 * @memberof AutoDripEnabled
	 */
	tokens: number;
}

interface AutoRefundBehavior {
	/**
	 * A boolean indicating whether the bucket should enable auto-refunding of expired tickets
	 *
	 * This property is ignored if refunding is not enabled
	 *
	 * @type {boolean}
	 * @memberof AutoRefundBehavior
	 */
	enabled: boolean;
}

interface RefundBehavior {
	/**
	 * A boolean indicating whether the bucket allows refunding of tickets
	 *
	 * @type {boolean}
	 * @memberof RefundBehavior
	 */
	enabled: boolean;

	/**
	 * The duration for which token tickets are valid.
	 * Expired tickets cannot be refunded.
	 * If auto-refund is enabled, expired tickets are automatically 'reclaimed' by the bucket (i.e. the tokens are returned)
	 *
	 * @type {Duration}
	 * @memberof RefundBehavior
	 */
	refundTicketsExpiry: Duration;

	/**
	 * The bucket's auto-refund behavior.
	 * Automatic refunds are issued when token tickets expire before being manually refunded
	 *
	 * @type {AutoRefundBehavior}
	 * @memberof RefundBehavior
	 */
	autoRefund?: AutoRefundBehavior;
}

interface BucketBehavior {
	/**
	 * The bucket's 'refund' behavior
	 *
	 * @type {RefundBehavior}
	 * @memberof BucketBehavior
	 */
	refund: RefundBehavior;
}

/**
 * A Token Bucket configuration
 *
 * @export
 * @interface TokenBucketConfig
 */
export interface TokenBucketConfig {
	/**
	 * The bucket's display name
	 *
	 * @type {string}
	 * @memberof TokenBucketConfig
	 */
	bucketName?: string;

	/**
	 * The bucket's capacity, i.e., the maximum number of tokens the bucket can hold
	 *
	 * @type {number}
	 * @memberof TokenBucketConfig
	 */
	capacity: number;

	/**
	 * A boolean indicating whether the bucket should be empty upon construction.
	 * By default, buckets are constructed 'full', that is, they initially hold the designated {@link capacity}
	 *
	 * @type {boolean}
	 * @memberof TokenBucketConfig
	 */
	startEmpty?: boolean;

	/**
	 * Auto-drip configuration.
	 * Auto drip is the mechanism by which buckets are given tokens on a regular interval
	 *
	 * @type {(AutoDripDisabled | AutoDripEnabled)}
	 * @memberof TokenBucketConfig
	 */
	automaticDrip?: AutoDripDisabled | AutoDripEnabled;

	/**
	 * The bucket's behavior configuration
	 *
	 * @type {BucketBehavior}
	 * @memberof TokenBucketConfig
	 */
	behavior?: BucketBehavior;
}
