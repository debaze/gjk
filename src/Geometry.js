import {max, Vector2} from "./math/index.js";

export class Geometry {
	#vertices;
	#centerOfMass = new Vector2(0, 0);
	#radius = 0;

	/**
	 * @param {import("./math/index.js").Vector2[]} vertices
	 */
	constructor(vertices) {
		this.#vertices = vertices;

		this.#calculateCenterOfMass();
		this.#calculateRadius();
	}

	get centerOfMass() {
		return this.#centerOfMass;
	}

	get radius() {
		return this.#radius;
	}

	get vertices() {
		return this.#vertices;
	}

	#calculateCenterOfMass() {
		for (let i = 0; i < this.#vertices.length; i++) {
			const vertex = this.#vertices[i];

			this.#centerOfMass.add(vertex);
		}

		this.#centerOfMass.divideScalar(this.#vertices.length);
	}

	#calculateRadius() {
		for (let i = 0; i < this.#vertices.length; i++) {
			const vertex = this.#vertices[i];
			const radius = new Vector2(vertex).subtract(this.#centerOfMass).magnitude();

			this.#radius = max(this.#radius, radius);
		}
	}
}