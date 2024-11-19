import {Vector3} from "./math/index.js";

export class Object {
	#position;
	#velocity = new Vector3(0, 0, 0);
	#acceleration = new Vector3(0, 0, 0);
	#force = new Vector3(0, 0, 0);
	#geometry;
	#material;

	/**
	 * @param {import("./math/index.js").Vector3} position
	 * @param {import("./index.js").Geometry} geometry
	 * @param {import("./index.js").Material} material
	 */
	constructor(position, geometry, material) {
		this.#position = position;
		this.#geometry = geometry;
		this.#material = material;
	}

	getPosition() {
		return this.#position;
	}

	getVelocity() {
		return this.#velocity;
	}

	getAcceleration() {
		return this.#acceleration;
	}

	getForce() {
		return this.#force;
	}

	getGeometry() {
		return this.#geometry;
	}

	getMaterial() {
		return this.#material;
	}
}