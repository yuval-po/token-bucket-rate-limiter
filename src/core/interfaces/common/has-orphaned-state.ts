import { VoidEventHandler } from './event-handler-types';

export interface HasOrphanedState<TEventSource extends object> {
	isOrphaned: boolean;
	orphaned: VoidEventHandler<TEventSource>;
}
