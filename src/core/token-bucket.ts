import NodeCache from 'node-cache';
import { ITypedEvent, TypedEvent } from 'weak-event';
import { OutOfTokensError } from './error-handling/out-of-tokens-error';
import { ITokensTicket, ITokenBucket, TokenBucketConfig } from './interfaces';
import { SelfDisposingTimer } from './self-disposing-timer/self-disposing-timer';
import { TokensTicket } from './tokens-ticket';

export class TokenBucket implements ITokenBucket {

	//#region Members

	private _config: TokenBucketConfig;

	private _tokens: number;

	private _takenTokens?: NodeCache;

	private _autoDropTimer?: SelfDisposingTimer<TokenBucket>;

	private _isDisposed: boolean = false;

	//#endregion Members

	//#region Event Members

	private readonly _dripped = new TypedEvent<ITokenBucket, number>();

	private readonly _tokensTaken = new TypedEvent<ITokenBucket, number>();

	private readonly _tokensRefunded = new TypedEvent<ITokenBucket, number>();

	//#endregion Event Members

	//#region Events

	/**
	 * An event raised whenever tokens 'drip' into the bucket
	 * This includes both automatic and manual drips
	 *
	 * @readonly
	 * @type {ITypedEvent<ITokenBucket, number>}
	 * @memberof TokenBucket
	 */
	public get dripped(): ITypedEvent<ITokenBucket, number> {
		return this._dripped;
	}

	/**
	 * An event raised after tokens are taken from the bucket
	 *
	 * @readonly
	 * @type {ITypedEvent<ITokenBucket, number>}
	 * @memberof TokenBucket
	 */
	public get tokensTaken(): ITypedEvent<ITokenBucket, number> {
		return this._tokensTaken;
	}

	/**
	 * An event raised after tokens were returned to the bucket
	 * This includes both automatic and manual refunds
	 *
	 * @readonly
	 * @type {ITypedEvent<ITokenBucket, number>}
	 * @memberof TokenBucket
	 */
	public get tokensRefunded(): ITypedEvent<ITokenBucket, number> {
		return this._tokensRefunded;
	}

	//#endregion Events

	//#region Accessors

	/**
	 * The bucket's display name
	 *
	 * @readonly
	 * @type {(string | undefined)}
	 * @memberof TokenBucket
	 */
	public get name(): string | undefined {
		return this._config.bucketName;
	}

	/**
	 * The bucket's capacity, i.e., the maximum number of tokens it can hold
	 *
	 * @readonly
	 * @type {number}
	 * @memberof TokenBucket
	 */
	public get capacity(): number {
		return this._config.capacity;
	}

	/**
	 * The number of tokens currently available in the bucket
	 *
	 * @readonly
	 * @type {number}
	 * @memberof TokenBucket
	 */
	public get tokens(): number {
		return this._tokens;
	}

	/**
	 * Gets a boolean indicating when tickets can be refunded by the bucket.
	 * If disabled, token taken from the bucket cannot be returned by any means
	 *
	 * @readonly
	 * @type {boolean}
	 * @memberof TokenBucket
	 */
	public get isRefundEnabled(): boolean {
		return this._config.behavior?.refund?.enabled === true;
	}

	/**
	 * Gets a boolean indicating whether the bucket is set to auto-refund expired tickets
	 * If set to false, tokens taken by expired tickets are 'lost'.
	 *
	 * For auto-refunding to be enabled, {@link isRefundEnabled} must be true
	 *
	 * @readonly
	 * @type {boolean}
	 * @memberof TokenBucket
	 */
	public get isAutoRefundEnabled(): boolean {
		return this._config.behavior?.refund?.enabled === true && this._config.behavior.refund.autoRefund?.enabled === true;
	}

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
	 *
	 * @readonly
	 * @type {boolean}
	 * @memberof TokenBucket
	 */
	public get isDisposed(): boolean {
		return this._isDisposed;
	}

	//#endregion Accessors

	//#region Constructors

	/**
	 * Constructs an instance of TokenBucket.
	 *
	 * The bucket's configuration is generally immutable.
	 * Consumers are encouraged to {@link dispose} instances that are no longer needed
	 *
	 * @param {TokenBucketConfig} config
	 * @memberof TokenBucket
	 */
	public constructor(config: TokenBucketConfig) {
		if (!config) {
			throw new TypeError("Null or undefined 'config' parameter passed to TokenBucket constructor");
		}

		this._config = config;
		this._tokens = config.startEmpty ? 0 : config.capacity;

		this.configureRefundCache();

		if (this._config.automaticDrip?.enabled) {
			const { tokens, interval } = this._config.automaticDrip;
			this._autoDropTimer = new SelfDisposingTimer<TokenBucket>(
				this,
				() => { this.drip(tokens); },
				interval.Milliseconds,
				true
			);
		}
	}

	//#endregion Constructors

	//#region Public Methods

	/**
	 * Adds the given number of tokens to the bucket.
	 *
	 * This method ***cannot*** cause the number of tokens to exceed the bucket's configured maximum
	 *
	 * @param {number} count The number of tokens to add
	 * @memberof TokenBucket
	 */
	public drip(count: number): void {
		if ((typeof count !== 'number' && typeof count !== 'bigint') || !(count > 0)) {
			throw new RangeError(`'count' must bet a number greater than zero (received ${count})`);
		}

		this.incrementTokenCount(count);
		this._dripped.invokeAsync(this, count, { swallowExceptions: true });
	}

	/**
	 * Takes the specified number of tokens from the bucket
	 *
	 * If the bucket does not have enough tokens, an {@link OutOfTokensError} will be thrown
	 *
	 * @param {number} count The number of tokens to take
	 * @return {*} An {@link ITokensTicket} for the issued tokens.
	 * Depending on bucket configuration, the ticket may be refunded and the tokens returned to the bucket
	 * @memberof TokenBucket
	 */
	public take(count: number): ITokensTicket {
		if ((typeof count !== 'number' && typeof count !== 'bigint') || count <= 0) {
			throw new RangeError(`'count' must bet a number greater than zero (received ${count})`);
		}

		if (this._tokens - count < 0) {
			throw new OutOfTokensError(this._tokens, count, this._config.bucketName);
		}

		let expiryTime: Date | undefined;
		const expiryDuration = this._config.behavior?.refund.refundTicketsExpiry;
		if (expiryDuration) {
			expiryTime = new Date(Date.now() + expiryDuration.Milliseconds);
		}

		const ticket = new TokensTicket(this, count, expiryTime);

		this._takenTokens?.set(ticket.key, ticket);
		this.decrementTokenCount(count);

		this._tokensTaken.invokeAsync(this, count, { swallowExceptions: true });

		// A bit of extra security, since this library is likely to be used in this orientation.
		// We don't want outside influence over our internal state here (like corruption of expiration dates or token counts).
		// Costs more in terms of memory but might help mitigate certain issues.
		return ticket.clone();
	}

	/**
	 * Refunds the given ticket to 'return' its tokens to the bucket
	 *
	 * @description This method is 'loose'. Invalid refunds are no-op and will not raise any errors.
	 * To elaborate, the method does nothing in the following cases:
	 *
	 * * Bucket refunding is disabled (i.e. {@link isRefundEnabled} is 'false')
	 * * The ticket is expired
	 * * The bucket is already at max tokens (i.e. {@link tokens} === {@link capacity})
	 *
	 *
	 * @param {ITokensTicket} ticket
	 * @return {*}  {number}
	 * @memberof TokenBucket
	 */
	public refund(ticket: ITokensTicket): number {
		// Notice we're relying on NodeCache's existence to discern whether we should allow refunds
		// as well as rely on its 'deleteOnExpire' property here to ensure expired items are not refunded-
		// node-cache internally checks item expiration on 'get' operations
		const refundTicket = this._takenTokens?.take<ITokensTicket>(ticket.key);
		if (!refundTicket) {
			return 0;
		}

		this.incrementTokenCount(refundTicket.count);

		this._tokensRefunded.invokeAsync(this, refundTicket.count, { swallowExceptions: true });

		return refundTicket.count;
	}

	/**
	 * Disposes of any potentially 'leaky' resources the bucket may hold
	 *
	 * Subsequent disposals are no-ops
	 *
	 * ***Important note:*** Dispose should only be called at the end of the bucket's life.
	 * Usage of disposed buckets may result in undefined behavior
	 *
	 * @return {*}  {void}
	 * @memberof TokenBucket
	 */
	public dispose(): void {
		if (this._isDisposed) {
			return;
		}

		this._autoDropTimer?.stop?.();
		this._takenTokens?.close?.();

		this._isDisposed = true;
	}

	//#endregion Public Methods

	//#region Private Methods

	private configureRefundCache(): void {
		if (!this._config.behavior?.refund?.enabled) {
			return;
		}

		// Use a minimum of 1 second check period; The bucket may potentially contain a lot of items and we don't necessarily want
		// cleanup to run too often as it's an O(n) process
		const checkperiod = Math.min(this._config.behavior.refund.refundTicketsExpiry.Seconds / 4, 1);

		this._takenTokens = new NodeCache({
			checkperiod,
			stdTTL: this._config.behavior.refund.refundTicketsExpiry.Seconds,
			deleteOnExpire: true,
			useClones: false
		});

		if (this._config.behavior.refund.autoRefund?.enabled) {
			this._takenTokens.on('expired', (_key: string, ticket: ITokensTicket) => {
				this.incrementTokenCount(ticket.count);
				this._tokensRefunded.invokeAsync(this, ticket.count);
			});
		}
	}

	//#region Utility Methods

	private incrementTokenCount(toAdd: number): void {
		this._tokens = Math.min(this._tokens + toAdd, this._config.capacity);
	}

	private decrementTokenCount(toRemove: number): void {
		this._tokens = Math.max(0, this._tokens - toRemove);
	}

	//#endregion Private Methods
}
