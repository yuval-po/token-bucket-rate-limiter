import Express, { RequestHandler, ErrorRequestHandler } from 'express';
import { Server } from 'http';
import supertest from 'supertest';

type ExpressHandler = RequestHandler | ErrorRequestHandler;

export const DEFAULT_DUMMY_RESULT = { valid: true };

export class ExpressFixture {

	private readonly _GET_DUMMY_ROUTE = '/dummy';

	public app: Express.Express;
	public server?: Server;

	public constructor(beforeMiddleWares?: ExpressHandler[], afterMiddleWares?: ExpressHandler[]) {
		this.app = Express();

		if (beforeMiddleWares?.length) {
			this.app.use(beforeMiddleWares);
		}

		this.app.get(this._GET_DUMMY_ROUTE, (_req, res) => {
			res.status(200);
			res.json(DEFAULT_DUMMY_RESULT);
		});

		if (afterMiddleWares?.length) {
			this.app.use(afterMiddleWares);
		}
	}

	public async listen(): Promise<void> {
		return new Promise<void>((resolve) => {
			this.server = this.app.listen(() => resolve());
		});
	}

	public async callGetDummy(): Promise<supertest.Response> {
		return await supertest(this.app).get(this._GET_DUMMY_ROUTE);
	}

	public stop(): void {
		this.server?.listening && this.server.close();
	}
}