import { expect } from 'chai';
import { OutOfTokensError } from '../../src';

describe('OutOfTokensError - Sanity', () => {
	it('Does not throw when constructed without a bucket name', () => {
		expect(() => new OutOfTokensError(0, 10)).to.not.throw();
	});

	it('Does not throw when constructed with a bucket name', () => {
		expect(() => new OutOfTokensError(0, 10, 'Bucket Name')).to.not.throw();
	});

	it('All public properties are valid', () => {
		const availableCount = 1;
		const requestedCount = 15;
		const bucketName = 'TEST';

		const err = new OutOfTokensError(availableCount, requestedCount, bucketName);
		expect(err.availableCount).to.equal(availableCount);
		expect(err.requestedCount).to.equal(requestedCount);
		expect(err.bucketName).to.equal(bucketName);
	});
});