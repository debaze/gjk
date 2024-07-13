/**
 * @typedef {Object} MaterialDescriptor
 * @property {String} color
 */

export class Material {
	#color;

	/**
	 * @param {MaterialDescriptor} descriptor
	 */
	constructor(descriptor) {
		this.#color = descriptor.color;
	}

	getColor() {
		return this.#color;
	}
}