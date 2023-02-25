import { ITypedEvent } from 'weak-event';
import { ITokensTicket } from '../tokens-ticket/i-tokens-ticket';

/**
 * Represents a token bucket implementation
 *
 * @export
 * @interface ITokenBucket
 */
export interface ITokenBucket {

	/**
	 * The bucket's display name
	 */
	get name(): string | undefined;

	/**
	 * The bucket's capacity, i.e., the maximum number of tokens it can hold
	 */
	get capacity(): number;

	/**
	 * The number of tokens currently available in the bucket
	 */
	get tokens(): number;

	/**
	 * An event raised whenever tokens 'drip' into the bucket
	 *
	 * This includes both automatic and manual drips
	 */
	get dripped(): ITypedEvent<ITokenBucket, number>;

	/**
	 * An event raised after tokens are taken from the bucket
	 *
	 */
	get tokensTaken(): ITypedEvent<ITokenBucket, number>;

	/**
	 * An event raised after tokens were returned to the bucket
	 */
	get tokensRefunded(): ITypedEvent<ITokenBucket, number>;

	/**
	 * Gets a boolean indicating whether the bucket instance has been disposed.
	 *
	 * ***Calling any instance method after 'dispose' will result in undefined behavior***
	 *
	 * @description Buckets hold internal timers and potentially hard references to tickets.
	 * As such, improper use could cause memory leaks by preventing GC from collecting these objects.
	 * Calling 'dispose' disowns the objects so they can be collected by GC at its own discretion.
	 *
	 * Note that even without a call to 'dispose', the bucket internally uses weakly referenced timers to avoid
	 * the most common issues. It's still a good idea to call 'dispose' though.
	 */
	get isDisposed(): boolean;

	/**
	 * Adds the given number of tokens to the bucket.
	 *
	 * This method ***cannot*** cause the number of tokens to exceed the bucket's configured maximum
	 *
	 * @param count The number of tokens to add
	 */
	drip(count: number): void;

	take(count: number): ITokensTicket;

	refund(ticket: ITokensTicket): number;

	dispose(): void;
}
