/**
 * @typedef {Object} MaterialDescriptor
 * @property {String} fillColor
 * @property {String} strokeColor
 */

export class Material {
	#fillColor;
	#strokeColor;

	/**
	 * @param {MaterialDescriptor} descriptor
	 */
	constructor(descriptor) {
		this.#fillColor = descriptor.fillColor;
		this.#strokeColor = descriptor.strokeColor;
	}

	getFillColor() {
		return this.#fillColor;
	}

	getStrokeColor() {
		return this.#strokeColor;
	}
}