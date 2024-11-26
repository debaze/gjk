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
	 * @type {?import("../public/GJK.js").ClosestPointPolygonPolygonResponse}
	 */
	#closestPointResponse = null;

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

	getClosestPointResponse() {
		return this.#closestPointResponse;
	}

	/**
	 * @param {import("../public/GJK.js").ClosestPointPolygonPolygonResponse} closestPointResponse
	 */
	setClosestPointResponse(closestPointResponse) {
		this.#closestPointResponse = closestPointResponse;
	}
}