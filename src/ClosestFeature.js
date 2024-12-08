export class ClosestFeature {
	#vertices;

	/**
	 * @param {import("./math/index.js").Vector2[]} vertices
	 */
	constructor(vertices) {
		this.#vertices = vertices;

		if (this.#vertices.length === 0 || this.#vertices.length > 2) {
			throw new Error("Closest feature can only be a vertex or an edge.");
		}
	}

	get vertices() {
		return this.#vertices;
	}

	get isVertex() {
		return this.#vertices.length === 1;
	}

	get isEdge() {
		return this.#vertices.length === 2;
	}
}