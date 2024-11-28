import {dot, Vector3} from "../../src/math/index.js";
import {MinkowskiDifference} from "../MinkowskiDifference.js";
import {check1dSimplex} from "./check1dSimplex.js";
import {check2dSimplex} from "./check2dSimplex.js";

/**
 * @typedef {Object} GJKResponse
 * @property {import("../../src/math/index.js").Vector3[]} simplex
 */

/**
 * Max iterations tested: 4
 */
const GJK_MAX_ITERATIONS = 8;

/**
 * @param {import("../../src/index.js").Object} object1
 * @param {import("../../src/index.js").Object} object2
 */
export function GilbertJohnsonKeerthi(object1, object2) {
	/**
	 * @type {GJKResponse}
	 */
	const response = {};

	response.simplex = [];

	// Start with an arbitrary direction.
	const D = new Vector3(0, 1, 0);
	const a = MinkowskiDifference.support(object1, object2, D).vertex;

	if (dot(a, D) < 0) {
		return response;
	}

	response.simplex.push(a);

	D.set(a);
	D.negate();

	for (let i = 0; i < GJK_MAX_ITERATIONS; i++) {
		const a = MinkowskiDifference.support(object1, object2, D).vertex;

		if (dot(a, D) < 0) {
			return response;
		}

		response.simplex.push(a);

		if (response.simplex.length === 2) {
			check1dSimplex(response.simplex, D);

			continue;
		}

		if (response.simplex.length === 3) {
			/* check2dSimplex(simplex, D);

			continue; */

			// 2D test
			if (check2dSimplex(response.simplex, D)) {
				return response;
			}
		}

		/* if (response.simplex.length === 4) {
			if (check3dSimplex(response.simplex, D)) {
				return response;
			}
		} */
	}

	return response;
}