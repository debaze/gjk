import {MinkowskiDifference} from "./MinkowskiDifference.js";
import {cross, distance, dot, negate, Vector2} from "../src/math/index.js";
import {ClosestFeature} from "../src/ClosestFeature.js";

/**
 * @typedef {Object} SimplexVertex
 * @property {import("../src/math/index.js").Vector2} vertex vertex1 - vertex2
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

const GJK_SILENT = false;
const GJK_MAX_ITERATIONS = 8;

let maxRecordedIterations = 0;

/**
 * @param {Boolean} condition
 */
function assert(condition) {
	if (!condition) {
		throw new Error("Assertion failed");
	}
}

/**
 * @extends {Array<SimplexVertex>}
 */
class Simplex extends Array {
	divisor = 1;

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
 * @param {import("../src/index.js").Object} M1
 * @param {import("../src/index.js").Object} M2
 */
export function GJK(M1, M2) {
	/**
	 * @type {GJKResponse}
	 */
	const response = {};

	response.object1 = M1;
	response.object2 = M2;

	// D = COM(M2) - COM(M1)
	// const D = new Vector2(M2.geometry.centerOfMass).subtract(M1.geometry.centerOfMass);

	const S = new Simplex();
	// @ts-ignore
	S.push({});
	S[0].index1 = 0;
	S[0].index2 = 0;
	const p1 = M1.geometry.vertices[S[0].index1];
	const p2 = M2.geometry.vertices[S[0].index2];
	S[0].vertex1 = new Vector2(p1).multiplyMatrix(M1.transform);
	S[0].vertex2 = new Vector2(p2).multiplyMatrix(M2.transform);
	S[0].vertex = new Vector2(S[0].vertex2).subtract(S[0].vertex1);
	S[0].u = 1;
	S.length = 1;

	let i = 0;

	loop: for (; i < GJK_MAX_ITERATIONS; i++) {
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

		// If we have 3 points, then the origin is in the corresponding triangle.
		if (S.length === 3) {
			break loop;
		}

		const D = S.getSearchDirection();

		if (D.x === 0 && D.y === 0) {
			console.warn("Search direction is 0 (vertex overlap).");

			break loop;
		}

		const P = MinkowskiDifference.support(M1, M2, D);

		for (let i = 0; i < saveCount; i++) {
			if (P.index1 === save1[i] && P.index2 === save2[i]) {
				break loop;
			}
		}

		S.push(P);
	}

	if (!GJK_SILENT && i > maxRecordedIterations) {
		maxRecordedIterations = i;

		console.warn("GJK max recorded iterations:", maxRecordedIterations);
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

	const ab = new Vector2(b).subtract(a);
	const bc = new Vector2(c).subtract(b);
	const ca = new Vector2(a).subtract(c);
	const ac = new Vector2(c).subtract(a);
	const ba = new Vector2(a).subtract(b);
	const cb = new Vector2(b).subtract(c);
	const ap = new Vector2(p).subtract(a);
	const bp = new Vector2(p).subtract(b);
	const cp = new Vector2(p).subtract(c);
	const pa = new Vector2(a).subtract(p);
	const pb = new Vector2(b).subtract(p);
	const pc = new Vector2(c).subtract(p);

	let uAB = dot(bp, ba);
	let vAB = dot(ap, ab);
	let uBC = dot(cp, cb);
	let vBC = dot(bp, bc);
	let uCA = dot(ap, ac);
	let vCA = dot(cp, ca);

	if (vAB <= 0 && uCA <= 0) {
		// In region A.
		simplex[0].u = 1;
		simplex.divisor = 1;
		simplex.length = 1;

		return;
	}

	if (uAB <= 0 && vBC <= 0) {
		// In region B.
		simplex[0] = simplex[1];
		simplex[0].u = 1;
		simplex.divisor = 1;
		simplex.length = 1;

		return;
	}

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

	// In region ABC.
	assert(uABC > 0 && vABC > 0 && wABC > 0);

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

	const u = dot(new Vector2(p).subtract(b), new Vector2(a).subtract(b)); // dot(p - b, a - b)
	const v = dot(new Vector2(p).subtract(a), new Vector2(b).subtract(a)); // dot(p - a, b - a)

	if (v <= 0) {
		// In region A.
		simplex[0].u = 1;
		simplex.divisor = 1;
		simplex.length = 1;

		return;
	}

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
				simplex[0].vertex1,
			]);

			response.closestFeature2 = new ClosestFeature([
				simplex[0].vertex2,
			]);

			break;
		case 2:
			if (simplex[0].vertex1.x === simplex[1].vertex1.x && simplex[0].vertex1.y === simplex[1].vertex1.y) {
				// Closest feature 1 is a vertex
				response.closestFeature1 = new ClosestFeature([
					simplex[0].vertex1,
				]);
			}
			else {
				// Closest feature 1 is an edge
				response.closestFeature1 = new ClosestFeature([
					simplex[0].vertex1,
					simplex[1].vertex1,
				]);
			}

			if (simplex[0].vertex2.x === simplex[1].vertex2.x && simplex[0].vertex2.y === simplex[1].vertex2.y) {
				// Closest feature 2 is a vertex
				response.closestFeature2 = new ClosestFeature([
					simplex[0].vertex2,
				]);
			}
			else {
				// Closest feature 2 is an edge
				response.closestFeature2 = new ClosestFeature([
					simplex[0].vertex2,
					simplex[1].vertex2,
				]);
			}

			break;
	}
}