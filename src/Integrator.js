import {ClosestFeature, Object} from "./index.js";
import {abs, dot, negate, Vector2} from "./math/index.js";

import {GJK} from "../public/GJK.js";

const BISECTION_MAX_ITERATIONS = 32;
const CLOSEST_FEATURE_MAX_ITERATIONS = 32;
const POINT_CLOUD_VS_PLANE_MAX_ITERATIONS = 32;
const DISTANCE_TOLERANCE = 0.01;
const SEPARATION_TOLERANCE = 0.001;

/**
 * @typedef {(t: Number, deepestPointIndex: Number) => Number} SeparationFunction
 * @typedef {(t: Number, deepestPointIndex: Number) => import("./math/index.js").Vector2} PointFunction
 * @typedef {(t: Number) => import("./math/index.js").Vector2} NormalFunction
 * @typedef {(t: Number) => Number} OffsetFunction
 */

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
			const gjkResponse = GJK(objects[0], objects[1]);

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
				const A = objects[i];
				const B = objects[j];

				let t0 = 0;
				let t1 = 1;
				let toi = 0;

				closestFeature: for (let k = 0; k < CLOSEST_FEATURE_MAX_ITERATIONS; k++) {
					// Get closest features at t0.
					const gjkResponse = getClosestFeatures(A, B, t0);

					if (gjkResponse.overlap) {
						debugger;

						throw new Error("Shapes are overlapping");
					}

					const d = gjkResponse.distance;

					if (abs(d) < DISTANCE_TOLERANCE) {
						toi = t0;

						console.info("TOI", toi);

						break;
					}

					/**
					 * @type {import("./index.js").Object}
					 */
					let polygonAsPlane;

					/**
					 * @type {import("./index.js").Object}
					 */
					let polygonAsPolygon;

					/**
					 * @type {ClosestFeature}
					 */
					let separatingPlane;

					/**
					 * @type {PointFunction}
					 */
					let p;

					/**
					 * @type {NormalFunction}
					 */
					let n;

					/**
					 * @type {SeparationFunction}
					 */
					let s;

					const vertexVsVertexCase = gjkResponse.closestFeature1.isVertex && gjkResponse.closestFeature2.isVertex;

					if (vertexVsVertexCase) {
						s = function(t, deepestPointIndex) {
							const tA = A.at(t);
							const tB = B.at(t);

							const nA = new Vector2(gjkResponse.closestFeature1.vertices[0]).multiplyMatrix(tA);
							const nB = new Vector2(gjkResponse.closestFeature2.vertices[0]).multiplyMatrix(tB);

							const n = new Vector2(nB).subtract(nA).normalize();

							const pA = A.supportTime(n, t).transformedVertex;
							const pB = B.supportTime(negate(n), t).transformedVertex;

							const p = new Vector2(pB).subtract(pA);

							return dot(n, p);
						};
					}
					else {
						if (gjkResponse.closestFeature1.isEdge) {
							polygonAsPlane = A;
							polygonAsPolygon = B;
							separatingPlane = gjkResponse.closestFeature1;
						}
						else if (gjkResponse.closestFeature2.isEdge) {
							polygonAsPlane = B;
							polygonAsPolygon = A;
							separatingPlane = gjkResponse.closestFeature2;
						}

						p = function(t, deepestPointIndex) {
							const T = polygonAsPolygon.at(t);

							return new Vector2(polygonAsPolygon.geometry.vertices[deepestPointIndex]).multiplyMatrix(T);
						};

						s = function(t, deepestPointIndex) {
							let T = polygonAsPlane.at(t);

							const a = new Vector2(separatingPlane.vertices[0]).multiplyMatrix(T);
							const b = new Vector2(separatingPlane.vertices[1]).multiplyMatrix(T);
							const ab = new Vector2(b).subtract(a);
							let n;

							if (dot(ab, polygonAsPlane.geometry.centerOfMass) > 0) {
								n = new Vector2(-ab.y, ab.x).normalize();
							}
							else {
								n = new Vector2(ab.y, -ab.x).normalize();
							}

							const w = dot(n, a); // or dot(n, b)

							return dot(n, p(t, deepestPointIndex)) - w;
						}
					}

					t1 = 1;

					// Point cloud vs. plane
					pointCloudVsPlane: for (let l = 0; l < POINT_CLOUD_VS_PLANE_MAX_ITERATIONS; l++) {
						if (!vertexVsVertexCase) {
							let T = polygonAsPlane.at(t1);

							const a = new Vector2(separatingPlane.vertices[0]).multiplyMatrix(T);
							const b = new Vector2(separatingPlane.vertices[1]).multiplyMatrix(T);
							const ab = new Vector2(b).subtract(a);
							let n;

							if (dot(ab, polygonAsPlane.geometry.centerOfMass) > 0) {
								n = new Vector2(-ab.y, ab.x).normalize();
							}
							else {
								n = new Vector2(ab.y, -ab.x).normalize();
							}

							const deepestPoint = polygonAsPolygon.supportTime(negate(n), t1);
							const d = dot(deepestPoint.transformedVertex, n);

							if (d > DISTANCE_TOLERANCE) {
								t0 = t1;

								console.info("No collision. t0:", t0);

								updateObjectAtT(A, t0);
								updateObjectAtT(B, t0);

								break closestFeature;
							}

							if (d > -DISTANCE_TOLERANCE) {
								break pointCloudVsPlane;
							}

							t1 = bisection(s, deepestPoint.index);
						}
						else {
							t1 = bisection(s);
						}
					}

					t0 = t1;
				}
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
 * @param {(t: Number, deepestPointIndex: Number) => Number} s
 * @param {Number} [deepestPointIndex]
 */
function bisection(s, deepestPointIndex) {
	let t0 = 0;
	let t1 = 1;

	const s0 = s(t0, deepestPointIndex);
	const s1 = s(t1, deepestPointIndex);

	if (!(s0 > 0 && s1 < 0)) {
		console.warn("No guaranteed root");

		return 1;
	}

	for (let i = 0; i < BISECTION_MAX_ITERATIONS; i++) {
		const midpoint = (t0 + t1) * 0.5;
		const separation = s(midpoint, deepestPointIndex);

		if (separation > 0) {
			// Push t0 towards t1.
			t0 = midpoint;
		}
		else {
			// Push t1 towards t0.
			t1 = midpoint;
		}

		if (abs(separation) < SEPARATION_TOLERANCE) {
			break;
		}
	}

	return t0;
}