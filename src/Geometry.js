import {Vector2} from "./math/index.js";

export class Geometry {
	#centerOfMass = new Vector2(0, 0);

	#vertices;

	/**
	 * @param {import("./math/index.js").Vector2[]} vertices
	 */
	constructor(vertices) {
		if (vertices.length < 3) {
			throw new Error("Too few vertices provided.");
		}

		this.#vertices = vertices;

		for (let i = 0; i < this.#vertices.length; i++) {
			const vertex = this.#vertices[i];

			this.#centerOfMass.add(vertex);
		}

		this.#centerOfMass.divideScalar(this.#vertices.length);
	}

	getCenterOfMass() {
		return this.#centerOfMass;
	}

	getVertices() {
		return this.#vertices;
	}
}