import {MinkowskiDifference} from "./MinkowskiDifference.js";
import {cross, distance, dot, negate, Vector2} from "../src/math/index.js";
import {ClosestFeature} from "../src/ClosestFeature.js";

/**
 * @typedef {Object} SimplexVertex
 * @property {import("../src/math/index.js").Vector2} vertex vertex2 - vertex1
 * @property {import("../src/math/index.js").Vector2} vertex1 Transformed support point on shape 1
 * @property {import("../src/math/index.js").Vector2} vertex2 Transformed support point on shape 2
 * @property {Number} index1 Index on shape 1
 * @property {Number} index2 Index on shape 2
 * @property {Number} u Closest point barycentric coordinate
 */

/**
 * @typedef {Object} GJKResponse
 * @property {import("../src/index.js").Object} object1 Reference to object 1
 * @property {import("../src/index.js").Object} object2 Reference to object 2
 * @property {import("../src/index.js").ClosestFeature} closestFeature1 Closest feature on object 1
 * @property {import("../src/index.js").ClosestFeature} closestFeature2 Closest feature on object 2
 * @property {import("../src/math/index.js").Vector2} closest1 Closest point on the closest feature on object 1
 * @property {import("../src/math/index.js").Vector2} closest2 Closest point on the closest feature on object 2
 * @property {Number} distance Distance between the closest points
 * @property {Simplex} [simplex] Visualization purposes
 */

const GJK_MAX_ITERATIONS = 8;

let maxRecordedIterations = 0;

/**
 * @param {Boolean} condition
 */
export function assert(condition) {
	if (!condition) {
		throw new Error("Assertion failed");
	}
}

/**
 * @extends {Array<SimplexVertex>}
 */
class Simplex extends Array {
	divisor = 1;
	D = new Vector2(0, 0);

	getSearchDirection() {
		switch (this.length) {
			case 1:
				return negate(this[0].vertex);
			case 2: {
				const ab = new Vector2(this[1].vertex).subtract(this[0].vertex);
				const sign = cross(ab, negate(this[0].vertex));

				if (sign > 0) {
					return new Vector2(-ab.y, ab.x);
				}
				else {
					return new Vector2(ab.y, -ab.x);
				}
			}
			default:
				assert(false);

				return new Vector2(0, 0);
		}
	}

	copy() {
		const copy = new Simplex();

		for (let i = 0; i < this.length; i++) {
			copy[i] = this[i];
		}

		return copy;
	}
}

/**
 * @param {import("../src/index.js").Object} A
 * @param {import("../src/index.js").Object} B
 * @param {import("../src/math/index.js").Matrix3} transformA
 * @param {import("../src/math/index.js").Matrix3} transformB
 */
export function GJK(A, B, transformA, transformB) {
	/**
	 * @type {GJKResponse}
	 */
	const response = {};

	response.object1 = A;
	response.object2 = B;

	// D = COM(M2) - COM(M1)
	// const D = new Vector2(M2.geometry.centerOfMass).subtract(M1.geometry.centerOfMass);
	// const A = MinkowskiDifference.support(M1, M2, D);

	const S = new Simplex();
	// @ts-ignore
	S.push({});
	S[0].index1 = 0;
	S[0].index2 = 0;
	const p1 = A.geometry.vertices[S[0].index1];
	const p2 = B.geometry.vertices[S[0].index2];
	S[0].vertex1 = new Vector2(p1).multiplyMatrix(transformA);
	S[0].vertex2 = new Vector2(p2).multiplyMatrix(transformB);
	S[0].vertex = new Vector2(S[0].vertex2).subtract(S[0].vertex1);
	S[0].u = 1;
	S.length = 1;

	let i = 0;

	loop: for (; i <= GJK_MAX_ITERATIONS; i++) {
		const save1 = [], save2 = [];
		const saveCount = S.length;

		for (let i = 0; i < saveCount; i++) {
			save1[i] = S[i].index1;
			save2[i] = S[i].index2;
		}

		// Determine the closest point on the simplex and remove unused vertices.
		switch (S.length) {
			case 1:
				break;
			case 2:
				ClosestPointLine(S, new Vector2(0, 0));

				break;
			case 3:
				ClosestPointTriangle(S, new Vector2(0, 0));

				break;
			default:
				assert(false);
		}

		// If we still have 3 points, then the origin is in the corresponding triangle.
		if (S.length === 3) {
			break loop;
		}

		S.D = S.getSearchDirection();

		if (dot(S.D, S.D) < Number.EPSILON * Number.EPSILON) {
			console.warn("[GJK]: Search direction is 0 (vertex overlap).");

			break;
		}

		const P = MinkowskiDifference.support(A, B, transformA, transformB, S.D);

		for (let i = 0; i < saveCount; i++) {
			if (P.index1 === save1[i] && P.index2 === save2[i]) {
				break loop;
			}
		}

		S.push(P);

		if (i == GJK_MAX_ITERATIONS) {
			console.warn("[GJK]: Iteration limit reached.");
		}
	}

	if (i > maxRecordedIterations) {
		maxRecordedIterations = i;

		console.warn("[GJK]: Max recorded iteration count", maxRecordedIterations);
	}

	response.simplex = S;

	getClosestPointsOnPolygons(response, S);
	getClosestFeaturesOnPolygons(response, S);

	response.distance = distance(response.closest1, response.closest2);

	return response;
}

/**
 * 1. Compute edge barycentric coordinates uAB, vAB, uBC, vBC, uCA, vCA.
 * 2. Test vertex regions.
 * 3. If not in a vertex region, compute triangle barycentric coordinates uABC, vABC, wABC.
 * 4. Test edge regions.
 * 5. If not in an edge region, return interior region.
 * 
 * @param {Simplex} simplex
 * @param {import("../src/math/index.js").Vector2} p
 */
export function ClosestPointTriangle(simplex, p) {
	const a = simplex[0].vertex;
	const b = simplex[1].vertex;
	const c = simplex[2].vertex;

	const ap = new Vector2(p).subtract(a);
	const ab = new Vector2(b).subtract(a);
	const ac = new Vector2(c).subtract(a);

	const vAB = dot(ap, ab);
	const uCA = dot(ap, ac);

	if (vAB <= 0 && uCA <= 0) {
		// In region A.
		simplex[0].u = 1;
		simplex.divisor = 1;
		simplex.length = 1;

		return;
	}

	const bp = new Vector2(p).subtract(b);
	const bc = new Vector2(c).subtract(b);
	const ba = new Vector2(a).subtract(b);

	const uAB = dot(bp, ba);
	const vBC = dot(bp, bc);

	if (uAB <= 0 && vBC <= 0) {
		// In region B.
		simplex[0] = simplex[1];
		simplex[0].u = 1;
		simplex.divisor = 1;
		simplex.length = 1;

		return;
	}

	const cp = new Vector2(p).subtract(c);
	const ca = new Vector2(a).subtract(c);
	const cb = new Vector2(b).subtract(c);

	const uBC = dot(cp, cb);
	const vCA = dot(cp, ca);

	if (uBC <= 0 && vCA <= 0) {
		// In region C.
		simplex[0] = simplex[2];
		simplex[0].u = 1;
		simplex.divisor = 1;
		simplex.length = 1;

		return;
	}

	// Compute signed triangle area.
	const area = cross(ab, ac);

	const pa = new Vector2(a).subtract(p);
	const pb = new Vector2(b).subtract(p);
	const pc = new Vector2(c).subtract(p);

	// Compute triangle barycentric coordinates (pre-division).
	const uABC = cross(pb, pc);
	const vABC = cross(pc, pa);
	const wABC = cross(pa, pb);

	if (uAB > 0 && vAB > 0 && wABC * area <= 0) {
		// In region AB.
		simplex[0].u = uAB;
		simplex[1].u = vAB;
		simplex.divisor = dot(ab, ab);
		simplex.length = 2;

		return;
	}

	if (uBC > 0 && vBC > 0 && uABC * area <= 0) {
		// In region BC.
		simplex[0] = simplex[1];
		simplex[1] = simplex[2];

		simplex[0].u = uBC;
		simplex[1].u = vBC;
		simplex.divisor = dot(bc, bc);
		simplex.length = 2;

		return;
	}

	if (uCA > 0 && vCA > 0 && vABC * area <= 0) {
		// In region CA.
		simplex[1] = simplex[0];
		simplex[0] = simplex[2];

		simplex[0].u = uCA;
		simplex[1].u = vCA;
		simplex.divisor = dot(ca, ca);
		simplex.length = 2;

		return;
	}

	// Without CCD, this throws when the shapes separate after an intersection.
	// With CCD, this is never reached since no intersection should ever occur.
	// assert(uABC > 0 && vABC > 0 && wABC > 0);

	// In region ABC.
	simplex[0].u = uABC;
	simplex[1].u = vABC;
	simplex[2].u = wABC;
	simplex.divisor = area;
	simplex.length = 3;
}

/**
 * @param {Simplex} simplex
 * @param {import("../src/math/index.js").Vector2} p
 */
export function ClosestPointLine(simplex, p) {
	const a = simplex[0].vertex;
	const b = simplex[1].vertex;
	const ab = new Vector2(b).subtract(a);

	const v = dot(new Vector2(p).subtract(a), ab);

	if (v <= 0) {
		// In region A.
		simplex[0].u = 1;
		simplex.divisor = 1;
		simplex.length = 1;

		return;
	}

	const u = dot(new Vector2(p).subtract(b), new Vector2(a).subtract(b));

	if (u <= 0) {
		// In region B.
		simplex[0] = simplex[1];
		simplex[0].u = 1;
		simplex.divisor = 1;
		simplex.length = 1;

		return;
	}

	// In region AB.
	simplex[0].u = u;
	simplex[1].u = v;
	simplex.divisor = dot(ab, ab);
	simplex.length = 2;
}

/**
 * @param {GJKResponse} response
 * @param {Simplex} simplex
 */
function getClosestPointsOnPolygons(response, simplex) {
	const s = 1 / simplex.divisor;

	switch (simplex.length) {
		case 1:
			response.closest1 = simplex[0].vertex1;
			response.closest2 = simplex[0].vertex2;

			break;
		case 2:
			response.closest1 = new Vector2(simplex[0].vertex1).multiplyScalar(simplex[0].u * s)
				.add(new Vector2(simplex[1].vertex1).multiplyScalar(simplex[1].u * s));
			response.closest2 = new Vector2(simplex[0].vertex2).multiplyScalar(simplex[0].u * s)
				.add(new Vector2(simplex[1].vertex2).multiplyScalar(simplex[1].u * s));

			break;
		case 3:
			response.closest1 = new Vector2(simplex[0].vertex1).multiplyScalar(simplex[0].u * s)
				.add(new Vector2(simplex[1].vertex1).multiplyScalar(simplex[1].u * s))
				.add(new Vector2(simplex[2].vertex1).multiplyScalar(simplex[2].u * s));
			response.closest2 = new Vector2(response.closest1);

			break;
	}
}

/**
 * @param {GJKResponse} response
 * @param {Simplex} simplex
 */
function getClosestFeaturesOnPolygons(response, simplex) {
	switch (simplex.length) {
		case 1:
			// Both closest features are vertices
			response.closestFeature1 = new ClosestFeature([
				simplex[0].index1,
			]);

			response.closestFeature2 = new ClosestFeature([
				simplex[0].index2,
			]);

			break;
		case 2:
			if (simplex[0].vertex1.x === simplex[1].vertex1.x && simplex[0].vertex1.y === simplex[1].vertex1.y) {
				// Closest feature 1 is a vertex
				response.closestFeature1 = new ClosestFeature([
					simplex[0].index1,
				]);
			}
			else {
				// Closest feature 1 is an edge
				response.closestFeature1 = new ClosestFeature([
					simplex[0].index1,
					simplex[1].index1,
				]);
			}

			if (simplex[0].vertex2.x === simplex[1].vertex2.x && simplex[0].vertex2.y === simplex[1].vertex2.y) {
				// Closest feature 2 is a vertex
				response.closestFeature2 = new ClosestFeature([
					simplex[0].index2,
				]);
			}
			else {
				// Closest feature 2 is an edge
				response.closestFeature2 = new ClosestFeature([
					simplex[0].index2,
					simplex[1].index2,
				]);
			}

			break;
	}
}