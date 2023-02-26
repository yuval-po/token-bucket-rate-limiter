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

Short poem by _ChatGPT_

</br>

> #### Important note:
> This library makes no attempt to support multithreaded scenarios.  
> The rate limiter implementation is ***not*** thread safe.


### Installation

* npm install token-bucket-rate-limiter
* yarn add token-bucket-rate-limiter
</br>
Please note that this package is __unbundled__

</br>

## Basic Usage

### Imperative
The simplest form of usage is the imperative way- create a bucket instance and use it directly.  

This approach is useful when you require custom behaviors not available on the built-in Decorator and Middleware implementations.

https://github.com/yuval-po/token-bucket-rate-limiter/blob/9cb1be79d539143251a2ec42f2a52034530c203e/examples/imperative/imperative.pseudo#L1-L8
	
</br>

### Decorator

The decorator approach is useful for when you'd like to enforce limits on class methods. Prime examples would be a Controller or Service class.

https://github.com/yuval-po/token-bucket-rate-limiter/blob/3242716ecb4f0f177b8853214d7fe588320e9266/examples/decorator/decorator.pseudo#L1-L20

</br>

### Middleware

_Express_ middleware-based limitation is also available. It is a rather flexible approach as it can be specific or general depending on its position in the middleware stack.

The middleware can also fulfil the role of a 'dumb' rate limiter by indiscriminantly routing all requests through it

https://github.com/yuval-po/token-bucket-rate-limiter/blob/ba727e4884e3cfb83294bfa84929df5229418342/examples/middleware/middleware.pseudo#L1-L16

</br>

## Configuration & Advanced Usage

The bucket's core is designed to be flexible enough to support most common use-cases.
Below are some example configurations that can be used to customize its behavior.

The library's external interfaces are documented

_Please note the following examples are not linted, small errors may be possible_


### Basic Configuration

The simplest configuration creates a bucket with a fixed capacity and no automatic drip:

https://github.com/yuval-po/token-bucket-rate-limiter/blob/a9c9e9ba69d2d874c05a70ccf977d9de134149c7/examples/configuration/basic.pseudo#L1-L3

### Auto-Drip Configuration

A common use case for token buckets is to periodically add (drip) tokens to the bucket at a fixed rate.  
This can be accomplished using the `automaticDrip` configuration property:


https://github.com/yuval-po/token-bucket-rate-limiter/blob/a9c9e9ba69d2d874c05a70ccf977d9de134149c7/examples/configuration/auto-drip.pseudo#L1-L13


In this example, the bucket will automatically add 5 tokens every 5 seconds.


## Refund Configuration

Token buckets can be configured to allow refunds of 'issued' tokens. This can be useful in situations where you'd like to 'return' the capacity to the server after an operation has concluded.

For example, you perform, on behalf of the user, a demanding database operation.

Say, for simplicity's sake, that the operation takes 100% of the server's capacity.  
While you don't want multiple such operations to run concurrently, you may want to immediately 'refund' this capacity as soon as the operation is over.

The `refund `configuration property can be used to enable refunds:

https://github.com/yuval-po/token-bucket-rate-limiter/blob/a9c9e9ba69d2d874c05a70ccf977d9de134149c7/examples/configuration/refund.pseudo#L1-L14

In this example, the bucket is configured to allow refunds with a refund window of 30 minutes.


## Auto-Refund Configuration

Token buckets can also be configured to automatically refund expired tokens. This can be useful in situations where the 'tail end' of operations is not fully visible, for lack of a better term.

Suppose you're protecting a proxy server. You know the request has a certain 'weight'. You route it to the target server and start polling for the operation's status.  
At some point, you may lose connection with the target server, at which point you have a choice to make;  
Do you consider this capacity 'lost' and allow the token bucket to refill slowly or do you choose a cutoff point at which you're reasonably certain the server, regardless of conditions, has either fulfilled or dropped the request?  

Auto-refund is the latter, where you may state that an operation that takes more than 2 minutes, for instance is 'lost at sea' and its capacity can be immediately returned to the bucket.

Another possible (though somewhat dubious) use for this mechanism is to safeguard against developer errors. If a developer makes a mistake and an operation that should refund itself (i.e. call `ITokenTicket.refund()`) does not do so, you can experience rapid capacity loss.

Auto-refund can mitigate this, to some degree by ensuring token tickets are eventually reclaimed.

are granted for a limited time period and it is important to ensure that unused tokens are returned to the bucket even if the user forgets to manually refund them. The autoRefund configuration property can be used to enable auto-refunds:

https://github.com/yuval-po/token-bucket-rate-limiter/blob/a9c9e9ba69d2d874c05a70ccf977d9de134149c7/examples/configuration/auto-refund.pseudo#L1-L17

In this example, the bucket is configured to allow refunds with a refund window of 30 minutes and auto-refunds of expired tokens enabled.

</br>

## Bucket Configuration Options Rundown

</br>

| Config Option | Type | Description |
| --- | --- | --- |
| `bucketName` | `string` | The bucket's display name |
| `capacity` | `number` | The bucket's capacity, i.e., the maximum number of tokens the bucket can hold |
| `startEmpty` | `boolean` | A boolean indicating whether the bucket should be empty upon construction.</br>By default, buckets are constructed 'full', that is, they initially hold the designated `capacity` |
| `automaticDrip.enabled` | `boolean` | A boolean indicating whether the bucket should periodically receive new tokens |
| `automaticDrip.interval` | `Duration` | The regular interval at which tokens should be dripped into the bucket |
| `automaticDrip.tokens` | `number` | The number of tokens to drip per interval |
| `behavior.refund.enabled` | `boolean` | A boolean indicating whether the bucket allows refunding of tickets |
| `behavior.refund.refundTicketsExpiry` | `Duration` | The duration for which token tickets are valid.</br>Expired tickets cannot be refunded.</br>If auto-refund is enabled, expired tickets are automatically 'reclaimed' by the bucket (i.e. the tokens are returned) |
| `behavior.refund.autoRefund.enabled` | `boolean` | A boolean indicating whether the bucket should enable auto-refunding of expired tickets.</br>This property is ignored if `behavior.refund.enabled`  is `false` |


## Other notes

For any bugs, questions, suggestions or comments, feel free to hit me on my mail (I may take a while to notice) at [yuval.pomer](mailto:yuval.pomer@protonmail.com?subject=[Token-bucket-Rate-Limiter%20Feedback]) or open an issue at my [GitHub](https://github.com/yuval-po/token-bucket-rate-limiter/issues)

Feedback, positive or otherwise is appreciated and welcome.

Credit where credit's due, some of this documentation was generated using OpenAI's ChatGPT which saves quite a bit of hassle.

</br>

## Changelog

Changelog may be found at the project's GitHub [here](https://github.com/yuval-po/weak-event/blob/main/CHANGELOG.md)
