import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { SelfDisposingTimer } from '../../src/core/self-disposing-timer/self-disposing-timer';
import { getLeakAndWaitForEvent, sleep } from '../utils';

chai.use(chaiAsPromised);

describe('SelfDisposingTimer - Sanity', () => {
	it('Does not throw when constructed with autostart disabled', () => {
		expect(() => new SelfDisposingTimer({}, () => { }, 10, false)).to.not.throw();
	});

	it('Does not throw when constructed with autostart enabled', () => {
		expect(() => new SelfDisposingTimer({}, () => { }, 10, true)).to.not.throw();
	});

	it('Starts and ticks as expected', async () => {
		let ticked: boolean = false;
		const timer = new SelfDisposingTimer({}, () => { ticked = true; }, 10, false);

		expect(timer.isRunning).to.be.false;
		expect(timer.isOrphaned).to.be.false;
		const startedPromise = new Promise<void>(async (resolve) => {
			timer.started.attach(() => resolve());
		});
		timer.start();
		expect(timer.isRunning).to.be.true;
		await expect(startedPromise).to.eventually.be.fulfilled;
		await sleep(11);
		expect(ticked).to.be.true;
	});

	it('Stops as expected', async () => {
		let ticked: boolean = false;
		const timer = new SelfDisposingTimer({}, () => { ticked = true; }, 10, true);
		await sleep(11);
		expect(ticked).to.be.true;
		const stoppedPromise = new Promise<void>(async (resolve) => {
			timer.stopped.attach(() => resolve());
		});
		timer.stop();
		await expect(stoppedPromise).to.eventually.be.fulfilled;
		ticked = false;
		await sleep(22);
		expect(ticked).to.be.false;
	});

	it('Correctly detects orphaned state', async () => {
		const orphanedPromise = getLeakAndWaitForEvent(1000, () => {
			const owner = Object.assign({});
			return new SelfDisposingTimer(owner, () => { }, 1, true);
		});

		await expect(orphanedPromise).to.eventually.be.fulfilled;
	}).slow(150);

	it("Correctly handles 'start' calls when already running", async () => {
		const timer = new SelfDisposingTimer({}, () => { }, 5, true);
		timer.start();

		const startedPromise = new Promise<boolean>(async (resolve) => {
			timer.started.attach(() => resolve(true));
			await sleep(20);
			resolve(false);
		});

		await expect(startedPromise).to.eventually.become(false);
		expect(timer.isRunning).to.be.true;
	});

	it("Correctly handles 'stop' calls when not running", async () => {
		const timer = new SelfDisposingTimer({}, () => { }, 5, true);
		timer.start();
		timer.stop();
		expect(timer.isRunning).to.be.false;

		const stoppedPromise = new Promise<boolean>(async (resolve) => {
			timer.stopped.attach(() => resolve(true));
			await sleep(20);
			resolve(false);
		});

		timer.stop();

		await expect(stoppedPromise).to.eventually.become(false);
		expect(timer.isRunning).to.be.false;
	});
});