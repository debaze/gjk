import {max, Vector2} from "./math/index.js";

export class Geometry {
	#vertices;
	#centerOfMass = new Vector2(0, 0);
	#radius = 0;

	/**
	 * @param {Geometry} geometry
	 */
	static copy(geometry) {
		const verticesCopy = [];

		for (let i = 0; i < geometry.vertices.length; i++) {
			verticesCopy[i] = new Vector2(geometry.vertices[i]);
		}

		const copy = new Geometry(verticesCopy);

		copy.centerOfMass = new Vector2(geometry.centerOfMass);
		copy.radius = geometry.radius;

		return copy;
	}

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

	set centerOfMass(centerOfMass) {
		this.#centerOfMass = new Vector2(centerOfMass);
	}

	get radius() {
		return this.#radius;
	}

	set radius(radius) {
		this.#radius = radius;
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