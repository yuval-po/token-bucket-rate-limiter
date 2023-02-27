import { inspect } from 'util';

process.on('unhandledRejection', (reason, promise) => {
	console.error(`[GlobalTestHandlers.onUnhandledRejection] Caught a rejection due to ${reason} ${inspect(promise)}. Re-throwing`);
	throw promise;
});
