import { sleep } from './sleep';
import { GC } from './gc';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { HasOrphanedState } from '../../src/core/interfaces/common/has-orphaned-state';

chai.use(chaiAsPromised);


export function waitForConditionWithGc(child: { isOrphaned: boolean }, timeoutMs: number) {
	return new Promise<boolean>(async (resolve) => {
		let orphaned = false;
		while (timeoutMs > 0) {
			if (child.isOrphaned) {
				orphaned = true;
				break;
			}
			await sleep(5);
			await GC.trigger();
			timeoutMs -= 5;
		}
		resolve(orphaned);
	});
}

export async function waitForCondition(timeoutMs: number, conditionCheck: () => boolean): Promise<void> {
	while (timeoutMs > 0 && !conditionCheck()) {
		await sleep(5);
		await GC.trigger();
		timeoutMs -= 5;
	}

	expect(conditionCheck()).to.equal(true);
}

export function getLeakAndWaitForEvent<T extends HasOrphanedState<T>>(timeoutMs: number, leakGetter: () => T): Promise<void> {
	return new Promise<void>(async (resolve, reject) => {
		const child = leakGetter();
		let orphaned = false;
		child.orphaned.attach((sender) => {
			expect(sender.isOrphaned).to.be.true;
			orphaned = true;
		});

		while (timeoutMs > 0 && !orphaned) {
			await sleep(3);
			await GC.trigger();
			timeoutMs -= 3;
		}

		if (orphaned) {
			resolve();
		} else {
			reject();
		}
	});
}