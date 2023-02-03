import { ITypedEvent } from 'weak-event';
import { ITokensTicket } from '../i-tokens-ticket';

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
	 * The number of tokens currently available in the bucket
	 */
	get tokens(): number;

	/**
	 * An event that is invoked whenever tokens 'drip' into the bucket
	 *
	 * This includes both automatic and manual drips
	 */
	get dripped(): ITypedEvent<ITokenBucket, number>;


	/**
	 * An event that is invoked whenever tokens are taken from the bucket
	 *
	 */
	get tokensTaken(): ITypedEvent<ITokenBucket, number>;

	get tokensRefunded(): ITypedEvent<ITokenBucket, number>;

	get isDisposed(): boolean;

	drip(count: number): void;

	take(count: number): ITokensTicket;

	refund(ticket: ITokensTicket): number;

	dispose(): void;
}
