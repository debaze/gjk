/**
 * @typedef {Object} MaterialDescriptor
 * @property {import("./index.js").Color} fillColor
 * @property {import("./index.js").Color} strokeColor
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

	get fillColor() {
		return this.#fillColor;
	}

	get strokeColor() {
		return this.#strokeColor;
	}
}