export class ClosestFeature {
	#indices;

	/**
	 * @param {Number[]} indices
	 */
	constructor(indices) {
		this.#indices = indices;

		if (this.#indices.length === 0 || this.#indices.length > 2) {
			throw new Error("Closest feature can only be a vertex or an edge.");
		}
	}

	get indices() {
		return this.#indices;
	}

	get isVertex() {
		return this.#indices.length === 1;
	}

	get isEdge() {
		return this.#indices.length === 2;
	}
}