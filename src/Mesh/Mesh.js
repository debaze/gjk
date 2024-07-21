import {Geometry} from "../Geometry/index.js";
import {Material} from "../Material/index.js";
import {Vector3} from "../math/index.js";

/**
 * @typedef {Object} MeshDescriptor
 * @property {Vector3} position
 * @property {Geometry} geometry
 * @property {Material} material
 */

export class Mesh {
	#position;
	#geometry;
	#material;

	/**
	 * @param {MeshDescriptor} descriptor
	 */
	constructor(descriptor) {
		this.#position = descriptor.position;
		this.#geometry = descriptor.geometry;
		this.#material = descriptor.material;
	}

	getPosition() {
		return this.#position;
	}

	/**
	 * @param {Vector3} position
	 */
	setPosition(position) {
		this.#position.set(position);
	}

	getGeometry() {
		return this.#geometry;
	}

	getMaterial() {
		return this.#material;
	}
}