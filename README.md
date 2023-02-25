# token-bucket-rate-limiter

A Token-Bucket Rate Limiter library for Node.js

[![token-bucket-rate-limiter](https://github.com/yuval-po/token-bucket-rate-limiter/actions/workflows/token-bucket-rate-limiter.yml/badge.svg)](https://github.com/yuval-po/token-bucket-rate-limiter/actions/workflows/token-bucket-rate-limiter.yml) [![Package Version](https://img.shields.io/npm/v/token-bucket-rate-limiter)](https://img.shields.io/npm/v/token-bucket-rate-limiter)</br>
[![Node Version](https://img.shields.io/node/v/token-bucket-rate-limiter)](https://img.shields.io/node/v/token-bucket-rate-limiter)
[![Coverage Status](https://coveralls.io/repos/github/yuval-po/token-bucket-rate-limiter/badge.svg?branch=main)](https://coveralls.io/github/yuval-po/token-bucket-rate-limiter?branch=main)
[![License](https://img.shields.io/npm/l/token-bucket-rate-limiter?style=plastic)](https://img.shields.io/npm/l/token-bucket-rate-limiter?style=plastic)


This library is a Token-Bucket-based rate-limiter, suitable for use in both route and code levels.
It's designed to be lightweight, modern, concise, easy to use and flexible.

Bucket based limiters are useful in managing load in resource constrained scenarios whilst providing pseudo _QOS_ capabilities.


> Every server must decide,</br>
> To throttle or let traffic ride.</br>
> Without a rate limiter's aid,</br>
> It may crash under the load's weight.</br>
> But with a limiter set just right,</br>
> Requests come in at a steady height.</br>
> Remember, it's key from the start,</br>
> Lest your server falls apart!</br>

Short poem by _ChatGTP_

</br>

> #### Important note:
> This library makes no attempt to support multithreaded scenarios


### Installation

* npm install token-bucket-rate-limiter
* yarn add token-bucket-rate-limiter

Please note that this package is __unbundled__


</br>

## Usage

### Imperative
	The simplest form of usage is the imperative way:
	

### Decorator

### Middleware


## Other notes

For any bugs, questions, suggestions or comments, feel free to hit me on my mail (I may take a while to notice) at [yuval.pomer](mailto:yuval.pomer@protonmail.com?subject=[Token-bucket-Rate-Limiter%20Feedback]) or open an issue at my [GitHub](https://github.com/yuval-po/token-bucket-rate-limiter/issues)

Feedback, positive or otherwise is appreciated and welcome.


## Usage

### Imperative

### Decorator

### Middleware

The below example is a simplified but rather typical use-case where an event listener object goes
out of scope.

Under normal circumstances, the Garbage Collector would not reclaim the object as it's still
referenced by the the event source's listener's dictionary.

Using `WeakEvent`, however, GC can collect the object, at which point a finalizer will be invoked and the dead reference cleaned from the event source's map.
This ensures memory is eventually reclaimed and can, over time, make a significant difference.


```typescript
import { TypedEvent, ITypedEvent } from 'weak-event';

class DummyEventSource {

	private _someEvent = new WeakEvent<DummyEventSource, boolean>();

	public get someEvent(): ITypedEvent<DummyEventSource, boolean> {
		return this._someEvent;
	}

	private async raiseEventAsynchronously(): Promise<void> {
		this._someEvent.invokeAsync(this, true);
	}
}

class DummyEventConsumer {

	public constructor(eventSource: DummyEventSource) {

		// Valid usage. Handler signature matches event.
		eventSource.someEvent.attach(this.onEvent);
	}

	private onEvent(sender: DummyEventSource, e: boolean): void {
		console.log(`Event payload: ${e}`);
	}
}

class LeakyClass {

	private _eventSource = new DummyEventSource();

	public createConsumer(): void {
		const consumer = new DummyEventConsumer(this._eventSource);
		/* Do something with consumer
		 ...
		 ...
		 ...
		 Forget to 'dispose'. Consumer goes out of scope. Memory is leaked
		*/
	}
}

```

</br>

### Typed Event

The most basic type of event. Uses strong references and behaves like other events do

```typescript
import { TypedEvent, ITypedEvent } from 'weak-event';

class DummyEventSource {

	public get someProperty(): string {
		return "I'm an event source";
	}

	private _someEvent = new TypedEvent<DummyEventSource, string>();

	public get someEvent(): ITypedEvent<DummyEventSource, string> {
		return this._someEvent;
	}

	private raiseEventSynchronously(): void {
		this._someEvent.invoke(this, 'Some value');

		// We get here after all events have been synchronously invoked
		console.log('Done!');
	}

	private async raiseEventAsynchronously(): Promise<void> {
		this._someEvent.invokeAsync(this, 'Some value');

		// We get here as soon as the 'invokeAsync' method yields.
		// Events are invoked asynchronously.
		console.log('Done!');
	}
}

class DummyEventConsumer {

	private _eventSource: DummyEventSource;

	public constructor(eventSource: DummyEventSource) {

		this._eventSource = eventSource;

		// Valid usage. Handler signature matches event.
		eventSource.someEvent.attach(this.onEvent);
	}

	private onEvent(sender: DummyEventSource, e: string): void {
		console.log(`Caller property: ${sender.someProperty}, Event payload: ${e}`);
	}

	public dispose(): void {
		// Detach the event handler
		this._eventSource.someEvent.detach(this.onEvent);
	}
}


```
<br />

## Changelog

Changelog may be found at the project's GitHub [here](https://github.com/yuval-po/weak-event/blob/main/CHANGELOG.md)
