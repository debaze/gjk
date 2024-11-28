import {GJK} from "../public/GJK.js";

export class Integrator {
	/**
	 * @type {?import("./Application.js").View}
	 */
	#view = null;

	/**
	 * @param {import("./index.js").Scene} scene
	 * @param {Number} deltaTime
	 */
	update(scene, deltaTime) {
		const objects = scene.getObjects();

		const markedObject1 = objects[scene.getMarkedObject1Index()];
		const markedObject2 = objects[scene.getMarkedObject2Index()];

		markedObject1.rotation += 0.005;
		markedObject1.updateTransform();

		markedObject2.position.set(this.#view.mouse);
		markedObject2.updateTransform();

		const gjkResponse = GJK(markedObject1, markedObject2);

		scene.setGJKResponse(gjkResponse);
	}

	/**
	 * @param {import("./Application.js").View} view
	 */
	setView(view) {
		this.#view = view;
	}
}