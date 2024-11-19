import {Scene} from "./index.js";

export class Integrator {
	#c;

	/**
	 * @param {Scene} scene
	 * @param {Number} deltaTimz
	 */
	update(scene, deltaTimz) {
		const objects = scene.getObjects();

		for (let objectIndex = 0; objectIndex < objects.length; objectIndex++) {
			const object = objects[objectIndex];

			// object.update(deltaTime);
		}
	}

	onMouseDown() {
		// TODO: If hovering, start drag
	}
}