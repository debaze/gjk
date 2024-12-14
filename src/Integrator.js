import {GJK} from "../public/GJK.js";
import {min} from "./math/index.js";
import {dot} from "./math/vec.js";
import {Vector2} from "./math/Vector2.js";

const MAX_ITER = 10;
const TOLERANCE = 0.001;

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

		this.#integrate(objects, deltaTime);
	}

	/**
	 * @param {import("./Application.js").View} view
	 */
	setView(view) {
		this.#view = view;
	}

	/**
	 * @todo Delta time should not be used within the physics simulation
	 * 
	 * @param {import("./index.js").Object[]} objects
	 * @param {Number} deltaTime
	 */
	#integrate(objects, deltaTime) {
		for (let i = 0; i < objects.length - 1; i++) {
			for (let j = i + 1; j < objects.length; j++) {
				const a = objects[i];
				const b = objects[j];

				let gjkResponse = GJK(a, b);

				if (gjkResponse.intersecting) {
					continue;
				}

				const velocityBound = calculateVelocityBound(a, b, gjkResponse);

				if (velocityBound === 0) {
					continue;
				}

				let t = 0;
				let d = gjkResponse.distance;
				let delta = 0;

				if (d < 0) {
					console.warn("Got negative distance", d);
				}

				for (let i = 0; i < MAX_ITER && d > TOLERANCE && t < 1; i++) {
					delta = Math.abs(d / velocityBound);

					t = min(1, t + delta);

					advanceTime(a, t);
					advanceTime(b, t);

					gjkResponse = GJK(a, b);
					d = gjkResponse.distance;

					if (d < 0) {
						console.warn("Got negative distance", d);
					}
				}

				if (t < 1) {
					// debugger;
				}
			}
		}
	}
}

/**
 * @param {import("./index.js").Object} object
 * @param {Number} t
 */
function advanceTime(object, t) {
	const linearVelocity = new Vector2(object.linearVelocity).multiplyScalar(t);
	const angularVelocity = object.angularVelocity * t;

	const linearAcceleration = new Vector2(object.linearAcceleration).multiplyScalar(t);
	const angularAcceleration = object.angularAcceleration * t;

	object.position.add(linearVelocity);

	/**
	 * @todo Rotate about center of mass, not position
	 */
	object.rotation += angularVelocity;

	object.linearVelocity.add(linearAcceleration);
	object.angularVelocity += angularAcceleration;

	object.updateTransform();
}

/**
 * @param {import("./index.js").Object} a
 * @param {import("./index.js").Object} b
 * @param {import("../public/GJK.js").GJKResponse} gjkResponse
 */
function calculateVelocityBound(a, b, gjkResponse) {
	// (vB - vA) · (d / ||d||) + ||wA|| * rA + ||wB|| * rB
	const relativeVelocity = new Vector2(b.linearVelocity).subtract(a.linearVelocity);
	const distanceNormal = new Vector2(gjkResponse.closest2).subtract(gjkResponse.closest1).normalize();

	let velocityBound = dot(relativeVelocity, distanceNormal);
	velocityBound += a.angularVelocity * a.geometry.radius + b.angularVelocity * b.geometry.radius;

	return velocityBound;
}