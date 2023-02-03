/**
 * Represents a Tokens Ticket as obtained from a Tokens Bucket
 *
 * @description Tickets can be thought of as IOUs, specifying the the details of the 'transaction' such
 * as the number of tokens taken, the bucket of origin and the ticket's expiration (when applicable)
 *
 * If the bucket that issued that ticket has been configured to support refunding, the ticket can also be 'refunded',
 * During refunding, tokens are returned the the owning bucket (never exceeding the bucket's maximum)
 */
export interface ITokensTicket {
	/**
	 * The name of the bucket that issues the ticket
	 * @default undefined
	 */
	readonly sourceBucketName?: string;


	/**
	 * The number of tokens issued
	 *
	 * @type {number}
	 * @memberof ITokensTicket
	 */
	readonly count: number;

	/**
	 * The Date at which the ticket expires.
	 *
	 * Expired tickets are not eligible for refunding regardless of the state of the owner bucket
	 *
	 * @type {Date}
	 * @memberof ITokensTicket
	 */
	readonly expiryTime?: Date;

	get key(): string;

	get issueTime(): Date;

	get isExpired(): boolean;

	get wasRefunded(): boolean;

	get isOrphaned(): boolean;

	refund(): void;

	clone(): ITokensTicket;
}
