import {abs, cos, dot, negate, sin, Vector2} from "./math/index.js";

import {GJK} from "../public/GJK.js";

const FEATURE_ADVANCEMENT_LOOP_MAX_ITERATIONS = 32;
const DEEPEST_POINT_SOLVER_MAX_ITERATIONS = 32;
const BISECTION_MAX_ITERATIONS = 32;

const BISECTION_TOLERANCE = 0.001;
const DISTANCE_TOLERANCE = 0.001;

const BISECTION_DEBUG = true;

/**
 * @typedef {(t: Number, p: Vector2) => Number} SeparationFunctionOld
 */

/**
 * @typedef {Object} Rotation
 * @property {Number} c Cos
 * @property {Number} s Sin
 */

/**
 * @typedef {Object} Sweep
 * @property {import("./math/index.js").Vector2} localCenter Local center of mass position
 * @property {import("./math/index.js").Vector2} c1 Starting center of mass world position
 * @property {import("./math/index.js").Vector2} c2 Ending center of mass world position
 * @property {Rotation} q1 Starting world rotation
 * @property {Rotation} q2 Ending world rotation
 */

/**
 * @typedef {"points"|"edgeA"|"edgeB"} SeparationType
 */

/**
 * @typedef {Object} SeparationFunction
 * @property {import("./index.js").Object} A
 * @property {import("./index.js").Object} B
 * @property {Sweep} sweepA
 * @property {Sweep} sweepB
 * @property {import("./math/index.js").Vector2} localPoint
 * @property {import("./math/index.js").Vector2} axis Separating axis
 * @property {SeparationType} type
 */

export class Integrator {
	#integrationEnabled = true;

	/**
	 * @param {import("./index.js").Scene} scene
	 * @param {Number} frameIndex
	 */
	update(scene, frameIndex) {
		const objects = scene.getObjects();

		/* {
			for (let i = 0; i < objects.length; i++) {
				advanceSimulation(objects[i], 1);
			}

			return;
		} */

		if (!this.#integrationEnabled) {
			return;
		}

		for (let i = 0; i < objects.length - 1; i++) {
			for (let j = i + 1; j < objects.length; j++) {
				const A = objects[i];
				const B = objects[j];

				let t0 = 0;
				let t1 = 1;
				let fraction = 0;

				featureAdvancementLoop: for (let k = 0; k < FEATURE_ADVANCEMENT_LOOP_MAX_ITERATIONS; k++) {
					// Get closest features at t0.
					const gjkResponse = GJK(A, B);

					scene.setGJKResponse(gjkResponse);

					// If the shapes are overlapped, we give up on continuous collision.
					if (gjkResponse.distance <= 0) {
						fraction = 0;

						console.error("Shapes are overlapping");

						break;
					}

					const d = gjkResponse.distance;

					if (abs(d) < DISTANCE_TOLERANCE) {
						fraction = t0;

						console.info("TOI:", fraction);

						// advanceSimulation(A, fraction);
						// advanceSimulation(B, fraction);

						break;
					}

					const f = createSeparationFunction(A, B, gjkResponse, t0);

					t1 = 1;

					let done = true;

					deepestPointSolver: for (let l = 0; l < DEEPEST_POINT_SOLVER_MAX_ITERATIONS; l++) {
						const output = findMinSeparation(f, t1);
						let s1 = output.separation;

						// Is the final configuration separated?
						if (s1 > DISTANCE_TOLERANCE) {
							fraction = 1;
							done = true;

							// advanceSimulation(A, fraction);
							// advanceSimulation(B, fraction);

							break;
						}

						// Has the separation reached tolerance?
						if (s1 > -DISTANCE_TOLERANCE) {
							t0 = t1;

							break;
						}

						// Compute the initial separation of the witness points.
						let s0 = evaluateSeparation(f, output.indexA, output.indexB, t0);

						// Check for initial overlap. This might happen if the root finder runs out of iterations.
						if (s0 < -DISTANCE_TOLERANCE) {
							fraction = t0;
							done = true;

							advanceSimulation(A, fraction);
							advanceSimulation(B, fraction);

							debugger;

							break;
						}

						// Check for touching.
						if (s0 <= DISTANCE_TOLERANCE) {
							fraction = t0;
							done = true;

							advanceSimulation(A, fraction);
							advanceSimulation(B, fraction);

							break;
						}

						// Compute root.
						let a0 = t0;
						let a1 = t1;

						for (let m = 0; m < BISECTION_MAX_ITERATIONS; m++) {
							const t = (a0 + a1) * 0.5;
							const s = evaluateSeparation(f, output.indexA, output.indexB, t);

							if (abs(s) < DISTANCE_TOLERANCE) {
								t1 = t;

								break;
							}

							if (s > 0) {
								a0 = t;
								s0 = s;
							}
							else {
								a1 = t;
								s1 = s;
							}
						}
					}

					if (done) {
						break;
					}

					continue;

					/**
					 * @type {import("./index.js").Object}
					 */
					let polygonAsPlane;

					/**
					 * @type {import("./index.js").Object}
					 */
					let polygonAsPolygon;

					/**
					 * @type {import("./index.js").ClosestFeature}
					 */
					let separatingPlane;

					/**
					 * @type {SeparationFunctionOld}
					 */
					let s;

					const vertexVsVertexCase = gjkResponse.closestFeature1.isVertex && gjkResponse.closestFeature2.isVertex;

					if (vertexVsVertexCase) {
						// Vertex-vertex case
						const uA = gjkResponse.closest1;
						const uB = gjkResponse.closest2;
						const u = new Vector2(uB).subtract(uA);

						const pAi = A.supportTime(u, 1).index;
						const pBi = B.supportTime(negate(u), 1).index;

						s = function(t) {
							const tA = A.at(t);
							const tB = B.at(t);

							const pA = new Vector2(A.geometry.vertices[pAi]).multiplyMatrix(tA);
							const pB = new Vector2(B.geometry.vertices[pBi]).multiplyMatrix(tB);

							return dot(pB.subtract(pA), u);
						};
					}
					else {
						// Vertex-edge case
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

						s = function(t, p) {
							const Tplane = polygonAsPlane.at(t);
							const Tpoly = polygonAsPolygon.at(t);

							const p_t = new Vector2(p).multiplyMatrix(Tpoly);

							/* const a = new Vector2(polygonAsPlane.geometry.vertices[separatingPlane.indices[0]]).multiplyMatrix(Tplane);
							const b = new Vector2(polygonAsPlane.geometry.vertices[separatingPlane.indices[1]]).multiplyMatrix(Tplane);
							const ab = new Vector2(b).subtract(a);
							const n = new Vector2(-ab.y, ab.x);

							if (dot(n, new Vector2(polygonAsPlane.geometry.centerOfMass).subtract(a)) <= 0) {
								n.multiplyScalar(-1);
							}

							n.normalize(); */
							const n = new Vector2(0, 1);

							// const w = dot(n, polygonAsPlane === A ? gjkResponse.closest1 : gjkResponse.closest2);
							const w = 0;

							// console.log(n, w, dot(n, new Vector2(polygonAsPlane.geometry.centerOfMass).subtract(a)));

							return dot(n, p_t) - w;
						}
					}

					t1 = 1;

					deepestPointSolver: for (let l = 0; l < DEEPEST_POINT_SOLVER_MAX_ITERATIONS; l++) {
						if (vertexVsVertexCase) {
							console.log("vertex vs. vertex");

							const uA = gjkResponse.closest1;
							const uB = gjkResponse.closest2;
							const u = new Vector2(uB).subtract(uA);

							const pA = A.supportTime(u, 1).vertex;
							const pB = B.supportTime(negate(u), 1).vertex;

							const tA = A.at(t1);
							const tB = B.at(t1);

							const pAt = new Vector2(pA).multiplyMatrix(tA);
							const pBt = new Vector2(pB).multiplyMatrix(tB);

							const d = dot(pBt.subtract(pAt), u);

							if (d > DISTANCE_TOLERANCE) {
								fraction = 1;

								advanceSimulation(A, fraction);
								advanceSimulation(B, fraction);

								// console.info("No collision. t0:", t0, "t1:", t1);

								break featureAdvancementLoop;
							}

							if (d > -DISTANCE_TOLERANCE) {
								break deepestPointSolver;
							}

							t1 = bisection(s);
						}
						else {
							const Tplane = polygonAsPlane.at(t1);

							/* const a = new Vector2(polygonAsPlane.geometry.vertices[separatingPlane.indices[0]]).multiplyMatrix(Tplane);
							const b = new Vector2(polygonAsPlane.geometry.vertices[separatingPlane.indices[1]]).multiplyMatrix(Tplane);
							const ab = new Vector2(b).subtract(a);
							const n = new Vector2(-ab.y, ab.x);
							n.normalize();

							if (dot(n, ab) <= 0) {
								n.multiplyScalar(-1);
							} */
							const n = new Vector2(0, 1);

							const deepestPoint = polygonAsPolygon.supportTime(negate(n), 1);
							const d = s(t1, deepestPoint.vertex);
							// const d = dot(n, deepestPoint.transformedVertex);
							// const d = -deepestPoint.angle;

							if (d > DISTANCE_TOLERANCE) {
								advanceSimulation(A, t1);
								advanceSimulation(B, t1);

								console.info("No collision\nt0 =", t0, "\nt1 =", t1);

								break featureAdvancementLoop;
							}

							if (d > -DISTANCE_TOLERANCE) {
								break deepestPointSolver;
							}

							t1 = bisection(s, deepestPoint.vertex);
						}
					}

					advanceSimulation(A, t1);
					advanceSimulation(B, t1);

					t0 = t1;
				}
			}
		}
	}
}

/**
 * @param {import("./index.js").Object} A
 * @param {Number} t
 */
function advanceSimulation(A, t) {
	A.position.add(new Vector2(A.linearVelocity).multiplyScalar(t));
	A.rotation += A.angularVelocity * t;

	A.linearVelocity.add(new Vector2(A.linearAcceleration).multiplyScalar(t));
	A.angularVelocity += A.angularAcceleration * t;

	A.updateTransform();
}

/**
 * @param {import("./index.js").Object} A
 * @param {import("./index.js").Object} B
 * @param {import("../public/GJK.js").GJKResponse} gjk
 * @param {Number} t
 */
function createSeparationFunction(A, B, gjk, t) {
	/**
	 * @type {SeparationFunction}
	 */
	const f = {};

	f.A = A;
	f.B = B;

	const transformA = A.at(t);
	const transformB = B.at(t);

	if (gjk.simplex.length === 1) {
		// Points on both A and B.
		f.type = "points";

		const localPointA = A.geometry.vertices[gjk.closestFeature1.indices[0]];
		const localPointB = B.geometry.vertices[gjk.closestFeature2.indices[0]];

		const pointA = new Vector2(localPointA).multiplyMatrix(transformA);
		const pointB = new Vector2(localPointB).multiplyMatrix(transformB);

		f.axis = new Vector2(pointB).subtract(pointA).normalize();
		f.localPoint = new Vector2(0, 0);

		return f;
	}

	if (gjk.closestFeature1.indices[0] === gjk.closestFeature1.indices[1]) {
		// Point on A and edge on B.
		f.type = "edgeB";

		const localPointB0 = B.geometry.vertices[gjk.closestFeature2.indices[0]];
		const localPointB1 = B.geometry.vertices[gjk.closestFeature2.indices[1]];

		f.axis = crossVS(new Vector2(localPointB1).subtract(localPointB0), 1).normalize();
		f.localPoint = new Vector2(localPointB0).add(localPointB1).multiplyScalar(0.5);

		const pointB = new Vector2(f.localPoint).multiplyMatrix(transformB);

		const localPointA = A.geometry.vertices[gjk.closestFeature1.indices[0]];

		const pointA = new Vector2(localPointA).multiplyMatrix(transformA);

		const normal = rotate(f.axis, B.rotation + B.angularVelocity * t);
		const s = dot(new Vector2(pointA).subtract(pointB), normal);

		if (s < 0) {
			f.axis = negate(f.axis);
		}

		return f;
	}

	// Edge on A and point or edge on B.
	f.type = "edgeA";

	const localPointA0 = A.geometry.vertices[gjk.closestFeature1.indices[0]];
	const localPointA1 = A.geometry.vertices[gjk.closestFeature1.indices[1]];

	f.axis = crossVS(new Vector2(localPointA1).subtract(localPointA0), 1).normalize();
	f.localPoint = new Vector2(localPointA0).add(localPointA1).multiplyScalar(0.5);

	const pointA = new Vector2(f.localPoint).multiplyMatrix(transformA);

	const localPointB = B.geometry.vertices[gjk.closestFeature2.indices[0]];

	const pointB = new Vector2(localPointB).multiplyMatrix(transformB);

	const normal = rotate(f.axis, A.rotation + A.angularVelocity * t);
	const s = dot(new Vector2(pointB).subtract(pointA), normal);

	if (s < 0) {
		f.axis = negate(f.axis);
	}

	return f;
}

/**
 * @param {SeparationFunction} f
 * @param {Number} t
 */
function findMinSeparation(f, t) {
	const output = {};
	const transformA = f.A.at(t);
	const transformB = f.B.at(t);

	switch (f.type) {
		case "points": {
			const axisA = inverseRotate(f.axis, f.A.rotation + f.A.angularVelocity * t);
			const axisB = inverseRotate(negate(f.axis), f.B.rotation + f.B.angularVelocity * t);

			output.indexA = f.A.supportBase(axisA);
			output.indexB = f.B.supportBase(axisB);

			const localPointA = f.A.geometry.vertices[output.indexA];
			const localPointB = f.B.geometry.vertices[output.indexB];

			const pointA = new Vector2(localPointA).multiplyMatrix(transformA);
			const pointB = new Vector2(localPointB).multiplyMatrix(transformB);

			output.separation = dot(new Vector2(pointB).subtract(pointA), f.axis);

			return output;
		}
		case "edgeA": {
			const pointA = new Vector2(f.localPoint).multiplyMatrix(transformA);

			const normal = rotate(f.axis, f.A.rotation + f.A.angularVelocity * t);

			const axisB = inverseRotate(negate(normal), f.B.rotation + f.B.angularVelocity * t);

			output.indexA = -1;
			output.indexB = f.B.supportBase(axisB);

			const localPointB = f.B.geometry.vertices[output.indexB];

			const pointB = new Vector2(localPointB).multiplyMatrix(transformB);

			output.separation = dot(new Vector2(pointB).subtract(pointA), normal);

			return output;
		}
		case "edgeB": {
			const pointB = new Vector2(f.localPoint).multiplyMatrix(transformB);

			const normal = rotate(f.axis, f.B.rotation + f.B.angularVelocity * t);

			const axisA = inverseRotate(negate(normal), f.A.rotation + f.A.angularVelocity * t);

			output.indexA = f.A.supportBase(axisA);
			output.indexB = -1;

			const localPointA = f.A.geometry.vertices[output.indexA];

			const pointA = new Vector2(localPointA).multiplyMatrix(transformA);

			output.separation = dot(new Vector2(pointA).subtract(pointB), normal);

			return output;
		}
	}
}

/**
 * @param {SeparationFunction} f
 * @param {Number} indexA
 * @param {Number} indexB
 * @param {Number} t
 */
function evaluateSeparation(f, indexA, indexB, t) {
	const transformA = f.A.at(t);
	const transformB = f.B.at(t);

	switch (f.type) {
		case "points": {
			const localPointA = f.A.geometry.vertices[indexA];
			const localPointB = f.B.geometry.vertices[indexB];

			const pointA = new Vector2(localPointA).multiplyMatrix(transformA);
			const pointB = new Vector2(localPointB).multiplyMatrix(transformB);

			return dot(new Vector2(pointB).subtract(pointA), f.axis);
		}
		case "edgeA": {
			const normal = rotate(f.axis, f.A.rotation + f.A.angularVelocity * t);

			const pointA = new Vector2(f.localPoint).multiplyMatrix(transformA);

			const localPointB = f.B.geometry.vertices[indexB];

			const pointB = new Vector2(localPointB).multiplyMatrix(transformB);

			return dot(new Vector2(pointB).subtract(pointA), normal);
		}
		case "edgeB": {
			const normal = rotate(f.axis, f.B.rotation + f.B.angularVelocity * t);

			const pointB = new Vector2(f.localPoint).multiplyMatrix(transformB);

			const localPointA = f.A.geometry.vertices[indexA];

			const pointA = new Vector2(localPointA).multiplyMatrix(transformA);

			return dot(new Vector2(pointA).subtract(pointB), normal);
		}
	}
}

/**
 * @param {SeparationFunctionOld} s
 * @param {import("./math/index.js").Vector2} [p]
 */
function bisection(s, p) {
	let t0 = 0;
	let t1 = 1;

	if (BISECTION_DEBUG) {
		const s0 = s(t0, p);
		const s1 = s(t1, p);

		if (!(s0 >= 0 && s1 < 0)) {
			console.warn("No guaranteed root");

			return 1;
		}
	}

	for (let i = 0; i < BISECTION_MAX_ITERATIONS; i++) {
		const midpoint = (t0 + t1) * 0.5;
		const sample = s(midpoint, p);

		if (sample >= 0) {
			// Push t0 towards t1.
			t0 = midpoint;

			// console.log("midpoint", midpoint, "sample", sample, "move t0");
		}
		else {
			// Push t1 towards t0.
			t1 = midpoint;

			// console.log("midpoint", midpoint, "sample", sample, "move t1");
		}

		if (abs(sample) < BISECTION_TOLERANCE) {
			break;
		}
	}

	return t0;
}

/**
 * @param {import("./math/index.js").Vector2} v
 * @param {Number} s
 */
function crossVS(v, s) {
	return new Vector2(s * v.y, -s * v.x);
}

/**
 * @param {import("./math/index.js").Vector2} v
 * @param {Number} a Angle in radians
 */
function rotate(v, a) {
	const c = cos(a);
	const s = sin(a);

	return new Vector2(c * v.x - s * v.y, s * v.x + c * v.y);
}

/**
 * @param {import("./math/index.js").Vector2} v
 * @param {Number} a Angle in radians
 */
function inverseRotate(v, a) {
	const c = cos(a);
	const s = sin(a);

	return new Vector2(c * v.x + s * v.y, -s * v.x + c * v.y);
}