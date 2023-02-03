import { randomFillSync } from 'crypto';
import { ITokenBucket, ITokensTicket } from './interfaces';

export class TokensTicket implements ITokensTicket {

	//#region Members

	private readonly _source: WeakRef<ITokenBucket>;

	public readonly sourceBucketName?: string;

	private _issueTime: Date;

	private _key: string;

	private _wasRefunded: boolean = false;

	//#endregion Members

	//#region Accessors

	public get isExpired(): boolean {
		return !!this.expiryTime && new Date() > this.expiryTime;
	}

	public get isOrphaned(): boolean {
		return !this._source.deref();
	}

	public get wasRefunded(): boolean {
		return this._wasRefunded;
	}

	public get issueTime(): Date {
		return new Date(this._issueTime);
	}

	public get key(): string {
		return this._key;
	}

	//#endregion Accessors

	//#region Constructors

	public constructor(
		source: ITokenBucket,
		public readonly count: number,
		public readonly expiryTime?: Date
	) {
		// Source is weakly referenced to avoid having tickets keep the bucket 'alive'.
		// Quite an edge case but worth noting.
		this._source = new WeakRef(source);

		// Name is copied by-value so this doesn't hold a reference to the source
		this.sourceBucketName = source.name;

		this._issueTime = new Date();

		// Using nanoid for a smaller memory footprint and better performance
		this._key = this.createKey();
	}

	//#endregion Constructors

	//#region Public Methods

	public refund(): void {
		if (this._wasRefunded) {
			return;
		}

		// Try to invoke refund on the owner bucket
		this._source.deref()?.refund?.(this);

		// We don't much care if a refund has actually been issued;
		// Multiple refunds are no-op regardless, this is more for tracking/visibility
		this._wasRefunded = true;
	}

	public clone(): ITokensTicket {
		const source = this._source.deref();
		if (!source) {
			throw new ReferenceError(`TokensTicket '${this.key}' is orphaned and cannot be cloned`);
		}
		const clone = new TokensTicket(source, this.count, this.expiryTime);

		/* eslint-disable no-underscore-dangle */
		clone._key = this.key;

		// Notice we pass the value of the 'getter' here- we don't want the clones to share date instances
		clone._issueTime = this.issueTime;
		/* eslint-enable no-underscore-dangle */

		return clone;

	}

	//#endregion Public Methods

	//#region Private Methods

	private createKey(): string {
		// Using an 8 byte ID. Should provide sufficient collision avoidance while lessening memory footprint
		const buf = Buffer.alloc(8);
		return randomFillSync(buf).toString('base64');
	}

	//#endregion Private Methods
}
