import { ITypedEvent } from 'weak-event';

export type VoidEventHandler<TEventSource extends object> = ITypedEvent<TEventSource, void>;
