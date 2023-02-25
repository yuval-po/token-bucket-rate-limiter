
import Express from 'express';
import { createRateLimitMiddleware, TokenBucket } from 'token-bucket-rate-limiter';

const bucket = new TokenBucket({ capacity: 100 });

function createServer() {
	const app = Express();

	// Three routes sharing the same bucket, i.e. resource pool
	app.get('/light-weight-operation', createRateLimitMiddleware({ bucket, routeCost: 1 }));
	app.get('/medium-weight-operation', createRateLimitMiddleware({ bucket, routeCost: 10 }));
	app.get('/heavy-weight-operation', createRateLimitMiddleware({ bucket, routeCost: 50 }));

	app.listen();
}
