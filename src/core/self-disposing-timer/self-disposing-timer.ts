import { TypedEvent } from 'weak-event';
import { VoidEventHandler } from '../interfaces/common/event-handler-types';
import { HasOrphanedState } from '../interfaces/common/has-orphaned-state';

export type TimerVoidHandler<TOwner extends object> = VoidEventHandler<SelfDisposingTimer<TOwner>>;

export class SelfDisposingTimer<TOwner extends object> implements HasOrphanedState<SelfDisposingTimer<TOwner>> {

	//#region Members

	private _owner: WeakRef<TOwner>;

	private _callback: WeakRef<() => void>;

	private _intervalMs: number;

	private _timer?: NodeJS.Timer;

	private _isOrphaned: boolean = false;

	//#endregion Members

	//#region Event Members

	private readonly _orphaned = new TypedEvent<SelfDisposingTimer<TOwner>, void>();

	private readonly _started = new TypedEvent<SelfDisposingTimer<TOwner>, void>();

	private readonly _stopped = new TypedEvent<SelfDisposingTimer<TOwner>, void>();

	//#endregion Event Members

	//#region Events

	public get orphaned(): TimerVoidHandler<TOwner> {
		return this._orphaned;
	}

	public get started(): TimerVoidHandler<TOwner> {
		return this._started;
	}

	public get stopped(): TimerVoidHandler<TOwner> {
		return this._stopped;
	}

	//#endregion Events

	//#region Accessors

	public get isOrphaned(): boolean {
		return this._isOrphaned;
	}

	public get isRunning(): boolean {
		return !!this._timer;
	}

	//#endregion Accessors


	public constructor(owner: TOwner, callback: () => void, intervalMs: number, startImmediately: boolean) {
		this._owner = new WeakRef(owner);
		this._callback = new WeakRef(callback);
		this._intervalMs = intervalMs;

		if (startImmediately) {
			this.start();
		}
	}

	public start(): void {
		if (!this._timer) {
			this._timer = setInterval(() => this.tick(), this._intervalMs);
			this._started.invokeAsync(this, undefined, { swallowExceptions: true, parallelize: true });
		}
	}

	public stop(): void {
		if (this._timer) {
			clearInterval(this._timer);
			this._timer = undefined;
			this._stopped.invokeAsync(this, undefined, { swallowExceptions: true, parallelize: true });
		}
	}

	private tick(): void {
		const owner = this._owner.deref();
		const callback = this._callback.deref();
		if (owner && callback) {
			callback();
		} else {
			this._isOrphaned = true;
			clearInterval(this._timer);
			this._orphaned.invokeAsync(this, undefined, { swallowExceptions: true, parallelize: true });
		}
	}
}
