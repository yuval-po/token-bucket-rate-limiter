import { AbstractLogger, LogConfig, LogLevel } from '../../core/logging';

function log(callerName: string, methodLevel: keyof AbstractLogger, message: string, logConfig?: LogConfig) {
	const level = logConfig?.logging?.level ?? -1;
	const logMethod = logConfig?.logging?.logger?.[methodLevel];

	let minLevel: LogLevel;

	switch (methodLevel) {
		case 'silly':
			minLevel = LogLevel.Silly;
			break;
		case 'debug':
			minLevel = LogLevel.Debug;
			break;
		case 'verbose':
			minLevel = LogLevel.Verbose;
			break;
		case 'info':
			minLevel = LogLevel.Info;
			break;
		case 'warn':
		default:
			minLevel = LogLevel.Warn;
			break;
		case 'error':
			minLevel = LogLevel.Error;
			break;
		case 'fatal':
			minLevel = LogLevel.Fatal;
			break;
	}

	if (level >= minLevel && logMethod) {
		logMethod(`[${callerName}] ${message}`);
	}
}

export function logSilly(callerName: string, message: string, logConfig?: LogConfig) {
	log(callerName, 'silly', message, logConfig);
}

export function logDebug(callerName: string, message: string, logConfig?: LogConfig) {
	log(callerName, 'debug', message, logConfig);
}

export function logVerbose(callerName: string, message: string, logConfig?: LogConfig) {
	log(callerName, 'verbose', message, logConfig);
}

export function logInfo(callerName: string, message: string, logConfig?: LogConfig) {
	log(callerName, 'info', message, logConfig);
}

export function logWarn(callerName: string, message: string, logConfig?: LogConfig) {
	log(callerName, 'warn', message, logConfig);
}

export function logError(callerName: string, message: string, logConfig?: LogConfig) {
	log(callerName, 'error', message, logConfig);
}

export function logFatal(callerName: string, message: string, logConfig?: LogConfig) {
	log(callerName, 'fatal', message, logConfig);
}

