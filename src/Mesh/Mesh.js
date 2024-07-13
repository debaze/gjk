import {Geometry} from "../Geometry/index.js";
import {Material} from "../Material/index.js";

/**
 * @typedef {Object} MeshDescriptor
 * @property {Geometry} geometry
 * @property {Material} material
 */

export class Mesh {
	#geometry;
	#material;

	/**
	 * @param {MeshDescriptor} descriptor
	 */
	constructor(descriptor) {
		this.#geometry = descriptor.geometry;
		this.#material = descriptor.material;
	}

	getGeometry() {
		return this.#geometry;
	}

	getMaterial() {
		return this.#material;
	}
}