export class Scene {
	#objects;

	/**
	 * @param {import("./index.js").Object[]} objects
	 */
	constructor(objects) {
		this.#objects = objects;
	}

	getObjects() {
		return this.#objects;
	}
}