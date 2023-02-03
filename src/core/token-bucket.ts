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

	public get dripped(): ITypedEvent<ITokenBucket, number> {
		return this._dripped;
	}

	public get tokensTaken(): ITypedEvent<ITokenBucket, number> {
		return this._tokensTaken;
	}

	public get tokensRefunded(): ITypedEvent<ITokenBucket, number> {
		return this._tokensRefunded;
	}

	//#endregion Events

	//#region Accessors

	public get name(): string | undefined {
		return this._config.bucketName;
	}

	public get tokens(): number {
		return this._tokens;
	}

	public get isRefundEnabled(): boolean {
		return this._config.behavior?.refund?.enabled === true;
	}

	public get isAutoRefundEnabled(): boolean {
		return this._config.behavior?.refund?.enabled === true && this._config.behavior.refund.autoRefund?.enabled === true;
	}

	public get isDisposed(): boolean {
		return this._isDisposed;
	}

	//#endregion Accessors

	//#region Constructors

	public constructor(config: TokenBucketConfig) {
		if (!config) {
			throw new TypeError("Null or undefined 'config' parameter passed to TokenBucket constructor");
		}

		this._config = config;
		this._tokens = config.startEmpty ? 0 : config.maxTokens;

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

	public drip(count: number): void {
		if ((typeof count !== 'number' && typeof count !== 'bigint') || !(count > 0)) {
			throw new RangeError(`'count' must bet a number greater than zero (received ${count})`);
		}

		this.incrementTokenCount(count);
		this._dripped.invokeAsync(this, count, { swallowExceptions: true });
	}

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

	public refund(ticket: ITokensTicket): number {
		// Notice we're relying on NodeCache's 'deleteOnExpire' on expire property here;
		// If the item is expired, we expect the cache to not return it during the 'get' call
		const refundTicket = this._takenTokens?.take<ITokensTicket>(ticket.key);
		if (!refundTicket) {
			return 0;
		}

		this.incrementTokenCount(refundTicket.count);

		this._tokensRefunded.invokeAsync(this, refundTicket.count, { swallowExceptions: true });

		return refundTicket.count;
	}

	public dispose(): void {
		if (this._isDisposed) {
			return;
		}

		this._autoDropTimer?.stop?.();

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
		this._tokens = Math.min(this._tokens + toAdd, this._config.maxTokens);
	}

	private decrementTokenCount(toRemove: number): void {
		this._tokens = Math.max(0, this._tokens - toRemove);
	}

	//#endregion Private Methods
}
