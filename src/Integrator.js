import {abs, dot, Vector2} from "./math/index.js";

import {GJK} from "../public/GJK.js";

// Iteration limits
const BISECTION_MAX_ITERATIONS = 32;
const CLOSEST_FEATURE_MAX_ITERATIONS = 4;
const POINT_CLOUD_VS_PLANE_MAX_ITERATIONS = 8;

// Tolerances
const DISTANCE_TOLERANCE = 0.001;
const DEPTH_TOLERANCE = 0.001;
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
	 */
	update(scene) {
		const objects = scene.getObjects();

		this.#integrate(objects);
	}

	/**
	 * @param {import("./index.js").Object[]} objects
	 */
	#integrate(objects) {
		for (let i = 0; i < objects.length - 1; i++) {
			for (let j = i + 1; j < objects.length; j++) {
				const a = objects[i];
				const b = objects[j];

				let t0 = 0;
				let t1 = 1;
				let toi = 0;

				closestFeature: for (let k = 0; k < CLOSEST_FEATURE_MAX_ITERATIONS; k++) {
					// Get closest features at t0.
					const closestFeatures = getClosestFeatures(a, b, t0);

					if (closestFeatures.intersecting) {
						throw new Error("The shapes are initially intersecting.");
					}

					const s = closestFeatures.distance;

					if (abs(s) < DISTANCE_TOLERANCE) {
						toi = t0;

						console.log("TOI", toi);

						advanceTime(a, toi);
						advanceTime(b, toi);

						break;
					}

					/**
					 * @todo Separating axis for polygon vs. polygon.
					 */
					const {polygon, plane} = ca(a, b);

					t1 = 1;

					// Point cloud vs. plane
					pointCloudVsPlane: for (let l = 0; l < POINT_CLOUD_VS_PLANE_MAX_ITERATIONS; l++) {
						let maxDepth = Number.NEGATIVE_INFINITY;
						let deepestVertex;

						// Get deepest point at t1.
						{
							const transform = polygon.at(t1);

							// Sample each polygon point at t1 to find the deepest point
							// in the opposite direction from the plane normal.
							for (let m = 0; m < polygon.geometry.vertices.length; m++) {
								const vertex = polygon.geometry.vertices[m];
								const point = new Vector2(vertex).multiplyMatrix(transform);

								const depth = dot(point, new Vector2(plane.n).negate());

								// console.log(depth, point);

								if (depth > maxDepth) {
									maxDepth = depth;
									deepestVertex = vertex;
								}
							}
						}

						if (maxDepth < DEPTH_TOLERANCE) {
							// console.log("No collision.");

							// No collision.
							advanceTime(a, t1);
							advanceTime(b, t1);

							break closestFeature;
						}

						if (maxDepth < -DEPTH_TOLERANCE) {
							// console.log("Advance t0 = t1.");

							break pointCloudVsPlane;
						}

						// Find root.
						{
							/**
							 * @param {Number} t
							 */
							function n(t) {
								return new Vector2(plane.n).add(new Vector2(plane.lv).multiplyScalar(t));
							}

							/**
							 * @param {Number} t
							 */
							function w(t) {
								return plane.w + plane.av * t;
							}

							/**
							 * @param {Number} t
							 */
							function separation(t) {
								const transform = polygon.at(t);
								const p = new Vector2(deepestVertex).multiplyMatrix(transform);

								return dot(n(t), p) - w(t);
							}

							// Perform root finding.
							const root = bisection(separation);

							t1 = root;
						}
					}

					t0 = t1;
				}

				// debugger;

				/* const velocityBound = calculateVelocityBound(a, b, gjk);

				if (velocityBound === 0) {
					continue;
				}

				let t = 0;
				let d = Integrator.#computeDistance(a, b, t);

				for (let i = 0; i < MAX_ITER && abs(d) > DISTANCE_TOLERANCE && t < 1; i++) {
					const delta = abs(d) / velocityBound;

					// t = min(1, t + delta);
					t = t + delta;
					d = Integrator.#computeDistance(a, b, t);
				}

				if (t < 1) {
					// Collision has occurred
				} */
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
	advanceTime(a, t);
	advanceTime(b, t);

	return GJK(a, b);
}









/**
 * @param {import("./index.js").Object} a
 * @param {import("./index.js").Object} b
 */
function ca(a, b) {
	let polygon;

	/**
	 * @type {Plane}
	 */
	let plane;

	if (a.geometry.vertices.length === 2) {
		plane = {
			n: new Vector2(0, 1),
			w: a.position.y,
			av: a.angularVelocity,
			lv: a.linearVelocity,
		};
		polygon = b;
	}

	if (b.geometry.vertices.length === 2) {
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
 * @param {import("./index.js").Object} polygon
 * @param {Plane} plane
 */
function findRootPointPlane(polygon, plane) {
	/**
	 * @param {import("./math/index.js").Vector2} p Point position
	 * @param {Number} t
	 */
	function p(p, t) {
		const transform = polygon.at(t);

		return new Vector2(p).multiplyMatrix(transform);
	}

	/**
	 * @param {Number} t
	 */
	function n(t) {
		return new Vector2(plane.n).add(new Vector2(plane.lv).multiplyScalar(t));
	}

	/**
	 * @param {Number} t
	 */
	function w(t) {
		return plane.w + plane.av * t;
	}

	for (let i = 0; i < DEEPEST_POINT_MAX_ITERATIONS; i++) {
		let maxDepth = Number.NEGATIVE_INFINITY;
		let deepestPoint;
		let belowPoints = [];

		// Sample each polygon point at t1 to find the deepest point
		// in the opposite direction from the plane normal.
		for (let i = 0; i < polygon.geometry.vertices.length; i++) {
			const vertex = polygon.geometry.vertices[i];
			const point = p(vertex, 1);

			const depth = dot(point, new Vector2(plane.n).negate());

			if (depth < 0) {
				belowPoints.push(point);
			}

			if (depth > maxDepth) {
				maxDepth = depth;
				deepestPoint = point;
			}
		}

		if (belowPoints.length === 0) {
			break;
		}

		// Create separation function with the deepest point.
		/**
		 * @param {Number} t
		 */
		function s(t) {
			return dot(n(t), deepestPoint) - w(t);
		}

		// We know there is at least 1 root between 0 and 1.
		// Perform root finding.
		const toi = bisection(s);

		// Advance safely by TOI amount.
		advanceTime(polygon, toi);
	}
}

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