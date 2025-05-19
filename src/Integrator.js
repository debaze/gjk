import {abs, dot, Matrix3, negate, Vector2} from "./math/index.js";

import {assert, GJK} from "../public/GJK.js";

const DISTANCE_MAX_ITERATIONS = 20;
const MAX_POLYGON_VERTICES = 8;
const ROOT_FINDER_ITERATION_LIMIT = 50;

/**
 * @typedef {"points"|"edgeA"|"edgeB"} SeparationType
 */

/**
 * @typedef {Object} SeparationFunction
 * @property {import("./math/index.js").Vector2} localPoint
 * @property {import("./math/index.js").Vector2} axis Separating axis.
 * @property {SeparationType} type
 */

/**
 * @typedef {"undetermined"|"hit"|"unresolved_root"|"separated"|"overlapped"} ContinuousCollisionState
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
		// const fixedDeltaTime = 0.0060606060606060606;

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

	const transformA = A.at(t);
	const transformB = B.at(t);

	if (gjk.closestFeature1.isVertex && gjk.closestFeature2.isVertex) {
		// Points on both A and B.
		f.type = "points";

		const localPointA = A.geometry.vertices[gjk.closestFeature1.indices[0]];
		const localPointB = B.geometry.vertices[gjk.closestFeature2.indices[0]];

		const pointA = new Vector2(localPointA).multiplyMatrix(transformA);
		const pointB = new Vector2(localPointB).multiplyMatrix(transformB);

		f.axis = new Vector2(pointB).subtract(pointA);
		f.localPoint = new Vector2(0, 0);

		return f;
	}

	assert(gjk.closestFeature1.isEdge || gjk.closestFeature2.isEdge);

	// Start by assuming that the edge feature is on A.
	f.type = "edgeA";

	let vertexObject = B;
	let edgeObject = A;
	let vertexObjectTransform = transformB;
	let edgeObjectTransform = transformA;
	let vertexFeature = gjk.closestFeature2;
	let edgeFeature = gjk.closestFeature1;

	if (!gjk.closestFeature1.isEdge) {
		f.type = "edgeB";

		vertexObject = A;
		edgeObject = B;
		vertexObjectTransform = transformA;
		edgeObjectTransform = transformB;
		vertexFeature = gjk.closestFeature1;
		edgeFeature = gjk.closestFeature2;
	}

	const edgeLocalPoint0 = edgeObject.geometry.vertices[edgeFeature.indices[0]];
	const edgeLocalPoint1 = edgeObject.geometry.vertices[edgeFeature.indices[1]];

	f.axis = perpendicularRight(new Vector2(edgeLocalPoint1).subtract(edgeLocalPoint0));

	const rotation = Matrix3.rotation(edgeObject.rotation + edgeObject.angularVelocity * t);
	const normal = new Vector2(f.axis).multiplyMatrix(rotation);

	f.localPoint = new Vector2(edgeLocalPoint0).lerp(edgeLocalPoint1, 0.5);

	const edgePoint = new Vector2(f.localPoint).multiplyMatrix(edgeObjectTransform);
	const vertexPoint = new Vector2(vertexObject.geometry.vertices[vertexFeature.indices[0]]).multiplyMatrix(vertexObjectTransform);

	if (dot(new Vector2(vertexPoint).subtract(edgePoint), normal) < 0) {
		f.axis = negate(f.axis);
	}

	return f;
}

/**
 * @param {SeparationFunction} f
 * @param {import("./index.js").Object} A
 * @param {import("./index.js").Object} B
 * @param {Number} t
 */
function findMinSeparation(f, A, B, t) {
	const output = {};
	const transformA = A.at(t);
	const transformB = B.at(t);
	const rotationA = Matrix3.rotation(A.rotation + A.angularVelocity * t);
	const rotationB = Matrix3.rotation(B.rotation + B.angularVelocity * t);
	const inverseRotationA = Matrix3.rotation(-(A.rotation + A.angularVelocity * t));
	const inverseRotationB = Matrix3.rotation(-(B.rotation + B.angularVelocity * t));

	let normal;
	let ab;

	switch (f.type) {
		case "points": {
			normal = f.axis;

			const axisA = new Vector2(normal).multiplyMatrix(inverseRotationA);
			const axisB = negate(normal).multiplyMatrix(inverseRotationB);

			output.indexA = A.supportBase(axisA);
			output.indexB = B.supportBase(axisB);

			const pointA = new Vector2(A.geometry.vertices[output.indexA]).multiplyMatrix(transformA);
			const pointB = new Vector2(B.geometry.vertices[output.indexB]).multiplyMatrix(transformB);

			ab = new Vector2(pointB).subtract(pointA);

			break;
		}
		case "edgeA": {
			normal = new Vector2(f.axis).multiplyMatrix(rotationA);

			const d = negate(normal).multiplyMatrix(inverseRotationB);

			output.indexB = B.supportBase(d);

			const pointA = new Vector2(f.localPoint).multiplyMatrix(transformA);
			const pointB = new Vector2(B.geometry.vertices[output.indexB]).multiplyMatrix(transformB);

			ab = new Vector2(pointB).subtract(pointA);

			break;
		}
		case "edgeB": {
			normal = new Vector2(f.axis).multiplyMatrix(rotationB);

			const d = negate(normal).multiplyMatrix(inverseRotationA);

			output.indexA = A.supportBase(d);

			const pointA = new Vector2(f.localPoint).multiplyMatrix(transformB);
			const pointB = new Vector2(A.geometry.vertices[output.indexA]).multiplyMatrix(transformA);

			ab = new Vector2(pointB).subtract(pointA);

			break;
		}
	}

	output.separation = dot(ab, normal);

	return output;
}

/**
 * @param {SeparationFunction} f
 * @param {import("./index.js").Object} A
 * @param {import("./index.js").Object} B
 * @param {Number} indexA
 * @param {Number} indexB
 * @param {Number} t
 */
function evaluateSeparation(f, A, B, indexA, indexB, t) {
	const transformA = A.at(t);
	const transformB = B.at(t);

	let a;
	let b;
	let d;

	switch (f.type) {
		case "points":
			a = new Vector2(A.geometry.vertices[indexA]).multiplyMatrix(transformA);
			b = new Vector2(B.geometry.vertices[indexB]).multiplyMatrix(transformB);
			d = f.axis;

			break;
		case "edgeA": {
			const rotationA = Matrix3.rotation(A.rotation + A.angularVelocity * t);

			a = new Vector2(f.localPoint).multiplyMatrix(transformA);
			b = new Vector2(B.geometry.vertices[indexB]).multiplyMatrix(transformB);
			d = new Vector2(f.axis).multiplyMatrix(rotationA);

			break;
		}
		case "edgeB": {
			const rotationB = Matrix3.rotation(B.rotation + B.angularVelocity * t);

			a = new Vector2(f.localPoint).multiplyMatrix(transformB);
			b = new Vector2(A.geometry.vertices[indexA]).multiplyMatrix(transformA);
			d = new Vector2(f.axis).multiplyMatrix(rotationB);

			break;
		}
	}

	return dot(new Vector2(b).subtract(a), d);
}

/**
 * @param {import("./math/index.js").Vector2} v
 */
function perpendicularRight(v) {
	return new Vector2(v.y, -v.x);
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

			return output;
		}

		if (gjk.distance <= target + tolerance) {
			output.state = "hit";
			output.fraction = t0;

			return output;
		}

		const f = createSeparationFunction(A, B, gjk, t0);

		let t1 = 1;
		let pushBackIterations = 0;

		while (true) {
			const separationOutput = findMinSeparation(f, A, B, t1);
			let s1 = separationOutput.separation;

			// Is the configuration separated at t1?
			if (s1 > target + tolerance) {
				output.state = "separated";
				output.fraction = 1;

				return output;
			}

			// Has the separation reached tolerance?
			if (s1 > target - tolerance) {
				t0 = t1;

				break;
			}

			// Compute the initial separation of the witness points.
			let s0 = evaluateSeparation(f, A, B, separationOutput.indexA, separationOutput.indexB, t0);

			if (s0 < target - tolerance) {
				// If the root finder runs out of iterations,
				// this could mean that there is an initial overlap.
				output.state = "unresolved_root";
				output.fraction = t0;

				return output;
			}

			// Check for touching.
			if (s0 <= target + tolerance) {
				output.state = "hit";
				output.fraction = t0;

				return output;
			}

			// Compute root.
			let a0 = t0;
			let a1 = t1;
			let rootFinderIterations = 0;

			while (true) {
				let t;

				if (rootFinderIterations & 1) {
					// Use false position.
					t = a0 + (target - s0) * (a1 - a0) / (s1 - s0);
				}
				else {
					// Use bisection.
					t = (a0 + a1) * 0.5;
				}

				rootFinderIterations++;

				const s = evaluateSeparation(f, A, B, separationOutput.indexA, separationOutput.indexB, t);

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

				if (rootFinderIterations >= ROOT_FINDER_ITERATION_LIMIT) {
					break;
				}
			}

			pushBackIterations++;

			// In my tests pushBackIterations is never higher than 1.
			if (pushBackIterations >= MAX_POLYGON_VERTICES) {
				break;
			}
		}

		if (distanceIterations >= DISTANCE_MAX_ITERATIONS) {
			// The root finder reached the iteration limit.
			output.state = "unresolved_root";
			output.fraction = t0;

			return output;
		}
	}
}