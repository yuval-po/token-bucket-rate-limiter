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
	 *
	 * @default undefined
	 * @type {string}
	 * @memberof ITokensTicket
	 */
	readonly sourceBucketName?: string;


	/**
	 * The number of tokens issued
	 *
	 * @default undefined
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

	/**
	 * Gets the unique key that identifies this ticket
	 *
	 * @type {string}
	 * @memberof ITokensTicket
	 */
	get key(): string;

	/**
	 * Gets the Date at which this ticket was issued
	 *
	 * @type {Date}
	 * @memberof ITokensTicket
	 */
	get issueTime(): Date;

	/**
	 * Gets a boolean indicating whether this ticket has expired
	 *
	 * @type {boolean}
	 * @memberof ITokensTicket
	 */
	get isExpired(): boolean;

	/**
	 * Gets a boolean indicating whether this ticket has been refunded
	 *
	 * @type {boolean}
	 * @memberof ITokensTicket
	 */
	get wasRefunded(): boolean;

	/**
	 * Gets a boolean indicating whether this ticket is orphaned.
	 *
	 * @description A ticket is orphaned if it has no living owning bucket.
	 * Orphaning occurs when a bucket goes out of scope
	 *
	 * @type {boolean}
	 * @memberof ITokensTicket
	 */
	get isOrphaned(): boolean;

	/**
	 * Refunds this ticket and returns the tokens to the owning bucket
	 *
	 * @memberof ITokensTicket
	 */
	refund(): void;

	/**
	 * Creates a new ticket with the same properties as this one
	 *
	 * @returns {ITokensTicket}
	 * @memberof ITokensTicket
	 */
	clone(): ITokensTicket;
}
