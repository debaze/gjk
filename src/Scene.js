export class Scene {
	#objects;

	/**
	 * @type {?import("../public/GJK.js").GJKResponse}
	 */
	#gjkResponse = null;

	/**
	 * @param {import("./index.js").Object[]} objects
	 */
	constructor(objects) {
		this.#objects = objects;
	}

	getObjects() {
		return this.#objects;
	}

	getGJKResponse() {
		return this.#gjkResponse;
	}

	/**
	 * @param {import("../public/GJK.js").GJKResponse} gjkResponse
	 */
	setGJKResponse(gjkResponse) {
		this.#gjkResponse = gjkResponse;
	}
}