export enum LogLevel {
	Silly = 0,
	Debug = 1,
	Verbose = 2,
	Info = 3,
	Warn = 4,
	Error = 5,
	Fatal = 6,
}

export type BasicLogMethod = (message?: any, ...optionalParams: any[]) => void;

export interface AbstractLogger {
	silly?: BasicLogMethod;
	debug?: BasicLogMethod;
	verbose?: BasicLogMethod;
	info?: BasicLogMethod;
	warn?: BasicLogMethod;
	error?: BasicLogMethod;
	fatal?: BasicLogMethod;
}

export interface LogConfig {
	logging?: {
		level?: LogLevel;
		logger?: AbstractLogger;
	}
}
