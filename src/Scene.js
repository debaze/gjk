export class Scene {
	#objects;

	/**
	 * @type {?Number}
	 */
	#markedObject1Index = null;

	/**
	 * @type {?Number}
	 */
	#markedObject2Index = null;

	/**
	 * @type {?import("../public/gjk.js").GJKResponse}
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

	getMarkedObject1Index() {
		return this.#markedObject1Index;
	}

	/**
	 * @param {Number} index
	 */
	setMarkedObject1Index(index) {
		this.#markedObject1Index = index;
	}

	getMarkedObject2Index() {
		return this.#markedObject2Index;
	}

	/**
	 * @param {Number} index
	 */
	setMarkedObject2Index(index) {
		this.#markedObject2Index = index;
	}

	getGJKResponse() {
		return this.#gjkResponse;
	}

	/**
	 * @param {import("../public/gjk.js").GJKResponse} gjkResponse
	 */
	setGJKResponse(gjkResponse) {
		this.#gjkResponse = gjkResponse;
	}
}