import {abs, distance, dot, inverse, negate, Vector2} from "./math/index.js";

import {assert, GJK} from "../public/GJK.js";

const DISTANCE_MAX_ITERATIONS = 20;
const MAX_POLYGON_VERTICES = 8;

/**
 * @typedef {"points"|"edgeA"|"edgeB"} SeparationType
 */

/**
 * @typedef {Object} SeparationFunction
 * @property {import("./index.js").Object} A
 * @property {import("./index.js").Object} B
 * @property {import("./math/index.js").Vector2} localPoint
 * @property {import("./math/index.js").Vector2} axis Separating axis.
 * @property {SeparationType} type
 */

/**
 * @typedef {"undetermined"|"hit"|"failed"|"separated"|"overlapped"} ContinuousCollisionState
 */

/**
 * @typedef {Object} ContinuousCollisionOutput
 * @property {ContinuousCollisionState} state
 * @property {Number} fraction Time of impact if hit.
 */

export class Integrator {
	#integrationEnabled = true;

	/**
	 * @param {import("./index.js").Scene} scene
	 * @param {Number} frameIndex
	 */
	update(scene, frameIndex) {
		const objects = scene.getObjects();

		if (!this.#integrationEnabled) {
			return;
		}

		for (let i = 0; i < objects.length - 1; i++) {
			for (let j = i + 1; j < objects.length; j++) {
				const A = objects[i];
				const B = objects[j];

				const output = evaluateContinuousCollision(A, B, scene);

				advanceSimulation(A, output.fraction);
				advanceSimulation(B, output.fraction);

				/*if (output.state === "hit") {
					const gjk = GJK(A, B, A.transform, B.transform);
					const collisionNormal = new Vector2(B.position).subtract(A.position).normalize();

					// The coefficient of restitution must at least be > 0.25 to separate the shapes.
					const CrA = 1;
					const CrB = 1;

					const mA = 1;
					const mB = 1;

					const vA_vB_n = dot(new Vector2(A.linearVelocity).subtract(B.linearVelocity), collisionNormal);
					const invmA_invmB = 1 / mA + 1 / mB;

					// Linear impulse.
					{
						const jA = (-(1 + CrA) * vA_vB_n) / invmA_invmB;
						const jB = (-(1 + CrB) * vA_vB_n) / invmA_invmB;

						const impA = new Vector2(collisionNormal).multiplyScalar(jA / mA);
						const impB = new Vector2(collisionNormal).multiplyScalar(-jB / mB);

						A.linearVelocity.add(impA);
						B.linearVelocity.add(impB);
					}

					// Angular impulse.
					{
						const rA = distance(gjk.closest1, A.geometry.centerOfMass);
						const rB = distance(gjk.closest2, B.geometry.centerOfMass);

						let jA_div = new Vector2(collisionNormal).multiplyScalar(rA);
						const jA = (-(1 + CrA) * vA_vB_n) / (invmA_invmB + dot(jA_div, collisionNormal));
					}

					advanceSimulation(A, 1 - output.fraction);
					advanceSimulation(B, 1 - output.fraction);
				}*/
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

	if (gjk.closestFeature1.isVertex && gjk.closestFeature2.isVertex) {
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

	if (gjk.closestFeature1.isVertex && gjk.closestFeature2.isEdge) {
		// Point on A and edge on B. Use B as edge.
		f.type = "edgeB";

		const localPointB0 = B.geometry.vertices[gjk.closestFeature2.indices[0]];
		const localPointB1 = B.geometry.vertices[gjk.closestFeature2.indices[1]];

		f.axis = crossVS(new Vector2(localPointB1).subtract(localPointB0), 1).normalize();

		const rotationB = B.rotationAt(t);
		const normal = new Vector2(f.axis).multiplyMatrix(rotationB);

		f.localPoint = new Vector2(localPointB0).add(localPointB1).multiplyScalar(0.5);

		const pointB = new Vector2(f.localPoint).multiplyMatrix(transformB);

		const localPointA = A.geometry.vertices[gjk.closestFeature1.indices[0]];

		const pointA = new Vector2(localPointA).multiplyMatrix(transformA);

		const s = dot(new Vector2(pointA).subtract(pointB), normal);

		if (s < 0) {
			f.axis = negate(f.axis);
		}

		return f;
	}

	// Edge on A and point or edge on B. Use A as edge.
	f.type = "edgeA";

	const localPointA0 = A.geometry.vertices[gjk.closestFeature1.indices[0]];
	const localPointA1 = A.geometry.vertices[gjk.closestFeature1.indices[1]];

	f.axis = crossVS(new Vector2(localPointA1).subtract(localPointA0), 1).normalize();

	const rotationA = A.rotationAt(t);
	const normal = new Vector2(f.axis).multiplyMatrix(rotationA);

	f.localPoint = new Vector2(localPointA0).add(localPointA1).multiplyScalar(0.5);

	const pointA = new Vector2(f.localPoint).multiplyMatrix(transformA);

	const localPointB = B.geometry.vertices[gjk.closestFeature2.indices[0]];

	const pointB = new Vector2(localPointB).multiplyMatrix(transformB);

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
	const rotationA = f.A.rotationAt(t);
	const rotationB = f.B.rotationAt(t);

	let normal;
	let pointA;
	let pointB;

	switch (f.type) {
		case "points": {
			normal = f.axis;

			const axisA = new Vector2(f.axis).multiplyMatrix(inverse(rotationA));
			const axisB = negate(f.axis).multiplyMatrix(inverse(rotationB));

			output.indexA = f.A.supportBase(axisA);
			output.indexB = f.B.supportBase(axisB);

			pointA = new Vector2(f.A.geometry.vertices[output.indexA]).multiplyMatrix(transformA);
			pointB = new Vector2(f.B.geometry.vertices[output.indexB]).multiplyMatrix(transformB);

			break;
		}
		case "edgeA": {
			normal = new Vector2(f.axis).multiplyMatrix(rotationA);

			const axisB = negate(normal).multiplyMatrix(inverse(rotationB));

			output.indexA = -1;
			output.indexB = f.B.supportBase(axisB);

			pointA = new Vector2(f.localPoint).multiplyMatrix(transformA);
			pointB = new Vector2(f.B.geometry.vertices[output.indexB]).multiplyMatrix(transformB);

			break;
		}
		case "edgeB": {
			normal = new Vector2(f.axis).multiplyMatrix(rotationB);

			const axisA = negate(normal).multiplyMatrix(inverse(rotationA));

			output.indexA = f.A.supportBase(axisA);
			output.indexB = -1;

			pointA = new Vector2(f.localPoint).multiplyMatrix(transformB);
			pointB = new Vector2(f.A.geometry.vertices[output.indexA]).multiplyMatrix(transformA);

			break;
		}
	}

	output.separation = dot(new Vector2(pointB).subtract(pointA), normal);

	return output;
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

	let normal;
	let pointA;
	let pointB;

	switch (f.type) {
		case "points":
			normal = f.axis;
			pointA = new Vector2(f.A.geometry.vertices[indexA]).multiplyMatrix(transformA);
			pointB = new Vector2(f.B.geometry.vertices[indexB]).multiplyMatrix(transformB);

			break;
		case "edgeA": {
			const rotationA = f.A.rotationAt(t);

			normal = new Vector2(f.axis).multiplyMatrix(rotationA);
			pointA = new Vector2(f.localPoint).multiplyMatrix(transformA);
			pointB = new Vector2(f.B.geometry.vertices[indexB]).multiplyMatrix(transformB);

			break;
		}
		case "edgeB": {
			const rotationB = f.B.rotationAt(t);

			normal = new Vector2(f.axis).multiplyMatrix(rotationB);
			pointA = new Vector2(f.localPoint).multiplyMatrix(transformB);
			pointB = new Vector2(f.A.geometry.vertices[indexA]).multiplyMatrix(transformA);

			break;
		}
		default:
			assert(false);

			break;
	}

	return dot(new Vector2(pointB).subtract(pointA), normal);
}

/**
 * @param {import("./math/index.js").Vector2} v
 * @param {Number} s
 */
function crossVS(v, s) {
	return new Vector2(s * v.y, -s * v.x);
}

/**
 * @param {import("./index.js").Object} A
 * @param {import("./index.js").Object} B
 * @param {import("./index.js").Scene} [scene] Used to debug GJK output.
 */
function evaluateContinuousCollision(A, B, scene) {
	/**
	 * @type {ContinuousCollisionOutput}
	 */
	const output = {};

	output.state = "undetermined";
	output.fraction = 0;

	let t0 = 0;

	const tolerance = 0.25 * 0.005;
	const target = 0.005;

	assert(target > tolerance);

	let distanceIterations = 0;

	while (true) {
		const transformA = A.at(t0);
		const transformB = B.at(t0);
		const gjk = GJK(A, B, transformA, transformB);

		if (scene) {
			scene.setGJKResponse(gjk);
		}

		distanceIterations++;

		// If the shapes are overlapped, we give up on continuous collision.
		if (gjk.distance <= 0) {
			output.state = "overlapped";
			output.fraction = 0;

			// console.error("Shapes are overlapping.");

			break;
		}

		if (gjk.distance <= target + tolerance) {
			output.state = "hit";
			output.fraction = t0;

			break;
		}

		const f = createSeparationFunction(A, B, gjk, t0);

		let t1 = 1;
		let done = false;
		let pushBackIterations = 0;

		while (true) {
			const separationOutput = findMinSeparation(f, t1);
			let s1 = separationOutput.separation;

			// Is the configuration separated at t1?
			if (s1 > target + tolerance) {
				output.state = "separated";
				output.fraction = 1;
				done = true;

				break;
			}

			// Has the separation reached tolerance?
			if (s1 > target - tolerance) {
				t0 = t1;

				break;
			}

			// Compute the initial separation of the witness points.
			let s0 = evaluateSeparation(f, separationOutput.indexA, separationOutput.indexB, t0);

			// Check for initial overlap. This might happen if the root finder runs out of iterations.
			if (s0 < target - tolerance) {
				output.state = "failed";
				output.fraction = t0;
				done = true;

				console.error("Initial overlap found.");

				break;
			}

			// Check for touching.
			if (s0 <= target + tolerance) {
				output.state = "hit";
				output.fraction = t0;
				done = true;

				break;
			}

			// Compute root.
			let a0 = t0;
			let a1 = t1;
			let rootFinderIterations = 0;

			while (true) {
				let t;

				if (rootFinderIterations & 1) {
					// False position
					t = a0 + (target - s0) * (a1 - a0) / (s1 - s0);
				}
				else {
					// Bisection
					t = (a0 + a1) * 0.5;
				}

				rootFinderIterations++;

				const s = evaluateSeparation(f, separationOutput.indexA, separationOutput.indexB, t);

				if (abs(s - target) < tolerance) {
					t1 = t;

					break;
				}

				if (s > target) {
					a0 = t;
					s0 = s;
				}
				else {
					a1 = t;
					s1 = s;
				}

				if (rootFinderIterations == 50) {
					break;
				}
			}

			pushBackIterations++;

			if (pushBackIterations == MAX_POLYGON_VERTICES) {
				break;
			}
		}

		if (done) {
			break;
		}

		// Root finder got stuck.
		if (distanceIterations == DISTANCE_MAX_ITERATIONS) {
			output.state = "failed";
			output.fraction = t0;

			console.error("Root finder failure.");

			break;
		}
	}

	return output;
}