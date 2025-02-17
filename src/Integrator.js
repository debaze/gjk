import {Object} from "./index.js";
import {abs, dot, Vector2} from "./math/index.js";

import {GJK} from "../public/GJK.js";

// Iteration limits
const BISECTION_MAX_ITERATIONS = 32;
const CLOSEST_FEATURE_MAX_ITERATIONS = 2;
const POINT_CLOUD_VS_PLANE_MAX_ITERATIONS = 4;

// Tolerances
const DISTANCE_TOLERANCE = 0.001;
const BISECTION_TOLERANCE = 0.001;

/**
 * @typedef {Object} Collision
 * @property {import("../public/GJK.js").GJKResponse} gjk
 * @property {import("./index.js").Object} a First object
 * @property {import("./index.js").Object} b Second object
 * @property {Number} toi Time of impact
 * @property {import("./math/index.js").Vector2} n Collision normal
 */

export class Integrator {
	/**
	 * @param {import("./index.js").Scene} scene
	 * @param {Number} frameIndex
	 */
	update(scene, frameIndex) {
		const objects = scene.getObjects();

		if (objects.length === 2) {
			const gjkResponse = GJK(objects[0], objects[1]); // at t = 0

			scene.setGJKResponse(gjkResponse);
		}

		this.#integrate(objects, frameIndex);
	}

	/**
	 * @param {import("./index.js").Object[]} objects
	 * @param {Number} frameIndex
	 */
	#integrate(objects, frameIndex) {
		// Standard update
		{
			for (let i = 0; i < objects.length; i++) {
				const a = objects[i];

				updateObjectAtT(a, 1);
			}

			return;
		}

		for (let i = 0; i < objects.length - 1; i++) {
			for (let j = i + 1; j < objects.length; j++) {
				const a = objects[i]; // plane
				const b = objects[j]; // polygon (cube)

				let t0 = 0;
				let t1 = 1;
				let toi = 0;

				closestFeature: for (let k = 0; k < CLOSEST_FEATURE_MAX_ITERATIONS; k++) {
					// Get closest features at t0.
					const closestFeatures = getClosestFeatures(a, b, t0);

					/**
					 * @todo Tolerance?
					 */
					if (closestFeatures.distance === 0) {
						debugger;
						throw new Error("The shapes are initially intersecting.");
					}

					const s = closestFeatures.distance;

					if (abs(s) < DISTANCE_TOLERANCE) {
						toi = t0;

						break;
					}

					/**
					 * @todo Separating axis for polygon vs. polygon.
					 */
					const {polygon, plane} = ca(a, b);

					t1 = 1;

					// Point cloud vs. plane
					pointCloudVsPlane: for (let l = 0; l < POINT_CLOUD_VS_PLANE_MAX_ITERATIONS; l++) {
						const support = polygon.supportTime(new Vector2(plane.n).negate(), t1);
						const d = dot(support.transformedVertex, plane.n);

						/* if (d > DISTANCE_TOLERANCE) {
							console.log("No collision.");

							// No collision.
							advanceTime(a, t1);
							advanceTime(b, t1);

							break closestFeature;
						} */

						/* if (d > -DISTANCE_TOLERANCE) {
							console.log("Advance t0 = t1.");

							break pointCloudVsPlane;
						} */

						// Find root.
						{
							/**
							 * @param {Number} t
							 */
							function n(t) {
								// plane.linearVelocity * t + plane.normal
								// return new Vector2(plane.lv).multiplyScalar(t).add(plane.n);
								return plane.n;
							}

							/**
							 * @param {Number} t
							 */
							function w(t) {
								// plane.offset + plane.angularVelocity * t
								// return plane.w + plane.av * t;
								return plane.w;
							}

							/**
							 * @param {Number} t
							 */
							function separation(t) {
								const transform = polygon.at(t);
								const p = new Vector2(support.vertex).multiplyMatrix(transform);

								return dot(n(t), p) - w(t);
							}

							// Perform root finding.
							t1 = bisection(separation);
						}
					}

					t0 = t1;
				}

				updateObjectAtT(a, t0);
				updateObjectAtT(b, t0);
			}
		}
	}

	/**
	 * @param {Collision[]} collisions
	 */
	#resolveCollisions(collisions) {
		for (let i = 0; i < collisions.length; i++) {
			const collision = collisions[i];
			const a = collision.a;
			const b = collision.b;
			const toi = collision.toi;
			const n = new Vector2(b.position).subtract(a.position).normalize();

			const vA0 = a.linearVelocity;
			const vB0 = b.linearVelocity;

			// a.linearVelocity.add(impulseA);
			// b.linearVelocity.add(impulseB);

			// const vA1 = a.linearVelocity;
			// const vB1 = b.linearVelocity;

			// Calculate ratio of speeds after and before collision along n.
			// const Cr = -dot(new Vector2(vA1).subtract(vB1), n) / dot(new Vector2(vA0).subtract(vB0), n);
			const crA = 1;
			const crB = 1;

			const mA = 1;
			const mB = 1;
			const invMassA = 1 / mA;
			const invMassB = 1 / mB;
			const invMasses = invMassA + invMassB;

			const jA = dot(new Vector2(vA0).subtract(vB0).multiplyScalar(1 + crA).negate(), n) / invMasses;
			const jB = dot(new Vector2(vA0).subtract(vB0).multiplyScalar(1 + crB).negate(), n) / invMasses;

			const impA = new Vector2(n).multiplyScalar(-jA);
			const impB = new Vector2(n).multiplyScalar(jB);

			const vA1 = new Vector2(vA0).add(new Vector2(n).multiplyScalar(jA / mA));
			const vB1 = new Vector2(vB0).subtract(new Vector2(n).multiplyScalar(jB / mB));

			a.linearVelocity.add(vA1);
			b.linearVelocity.add(vB1);
		}
	}
}

/**
 * @param {import("./index.js").Object} object
 * @param {Number} t
 */
function getObjectAt(object, t) {
	const copy = Object.copy(object);

	updateObjectAtT(copy, t);

	return copy;
}

/**
 * @param {import("./index.js").Object} object
 * @param {Number} t
 */
function updateObjectAtT(object, t) {
	object.position.add(new Vector2(object.linearVelocity).multiplyScalar(t));
	object.rotation += object.angularVelocity * t;

	object.linearVelocity.add(new Vector2(object.linearAcceleration).multiplyScalar(t));
	object.angularVelocity += object.angularAcceleration * t;

	object.updateTransform();
}

/**
 * @todo Fix case when dot product cancels relativeVelocity and d
 * (e.g. one is 1, 0 and the other is 0, 1).
 * 
 * @param {import("./index.js").Object} a
 * @param {import("./index.js").Object} b
 * @param {import("../public/GJK.js").GJKResponse} gjkResponse
 */
function calculateVelocityBound(a, b, gjkResponse) {
	// (vB - vA) · (d / ||d||) + ||wA|| * rA + ||wB|| * rB
	const relativeVelocity = new Vector2(b.linearVelocity).subtract(a.linearVelocity);
	const d = new Vector2(gjkResponse.closest2).subtract(gjkResponse.closest1);
	d.divideScalar(d.magnitude());

	let velocityBound = dot(relativeVelocity, d);
	velocityBound += a.angularVelocity * a.geometry.radius + b.angularVelocity * b.geometry.radius;

	if (velocityBound === 0) {
		debugger;
	}

	return velocityBound;
}

/**
 * @param {import("./index.js").Object} a
 * @param {import("./index.js").Object} b
 * @param {Number} t
 */
function getClosestFeatures(a, b, t) {
	const aAtTimeT = getObjectAt(a, t);
	const bAtTimeT = getObjectAt(b, t);

	return GJK(aAtTimeT, bAtTimeT);
}

/**
 * Debug function.
 * Converts polygon/polygon case to plane/polygon case.
 * 
 * @param {import("./index.js").Object} a
 * @param {import("./index.js").Object} b
 */
function ca(a, b) {
	let polygon;

	/**
	 * @type {Plane}
	 */
	let plane;

	if (a.label === "Plane") {
		plane = {
			n: new Vector2(0, 1),
			w: a.position.y,
			av: a.angularVelocity,
			lv: a.linearVelocity,
		};
		polygon = b;
	}

	if (b.label === "Plane") {
		plane = {
			n: new Vector2(0, 1),
			w: b.position.y,
			av: b.angularVelocity,
			lv: b.linearVelocity,
		};
		polygon = a;
	}

	if (!polygon || !plane) {
		throw new Error("Could not convert polygon/polygon to plane/polygon.");
	}

	return {polygon, plane};
}

/**
 * @typedef {Object} Plane
 * @property {import("./math/index.js").Vector2} n Normal
 * @property {Number} w Offset
 * @property {import("./math/index.js").Vector2} lv Linear velocity
 * @property {Number} av Angular velocity
 */

/**
 * @param {(t: Number) => Number} separation
 */
function bisection(separation) {
	let t0 = 0;
	let t1 = 1;

	const s0 = separation(t0);
	const s1 = separation(t1);

	if (!(s0 > 0 && s1 < 0)) {
		return 1;
	}

	for (let i = 0; i < BISECTION_MAX_ITERATIONS; i++) {
		const t1_2 = (t0 + t1) * 0.5;
		const s = separation(t1_2);

		if (s > 0) {
			// Push t0 towards t1.
			t0 = t1_2;
		}

		if (s < 0) {
			// Push t1 towards t0.
			t1 = t1_2;
		}

		if (abs(s) < BISECTION_TOLERANCE) {
			break;
		}
	}

	return t0;
}