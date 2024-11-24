import {ClosestPointLine, ClosestPointPoint, ClosestPointPolygon, ClosestPointTriangle} from "../public/Distance.js";
import {GetMinkowskiDifference} from "../public/MinkowskiDifference.js";
import {Scene} from "./index.js";
import {Vector2} from "./math/Vector2.js";

export class Integrator {
	/**
	 * @type {?import("./Application.js").View}
	 */
	#view = null;

	/**
	 * @param {Scene} scene
	 * @param {Number} deltaTime
	 */
	update(scene, deltaTime) {
		const objects = scene.getObjects();

		const markedObject1 = objects[scene.getMarkedObject1Index()];
		const markedObject2 = objects[scene.getMarkedObject2Index()];

		const closestPointResponse = ClosestPointPolygon(markedObject1, this.#view.mouse);
		// const minkowskiDifference = GetMinkowskiDifference(markedObject1, markedObject2);

		scene.setClosestPointResponse(closestPointResponse);
		// scene.setMinkowskiDifference(minkowskiDifference);
	}

	/**
	 * @param {import("./Application.js").View} view
	 */
	setView(view) {
		this.#view = view;
	}
}