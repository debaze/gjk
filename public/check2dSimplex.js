import {Vector3} from "../src/math/index.js";
import {check1dSimplex} from "./check1dSimplex.js";
import {negate} from "./helpers.js";

/**
 * @param {Vector3[]} simplex
 * @param {Vector3} D
 */
export function check2dSimplex(simplex, D) {
	const [c, b, a] = simplex;
	const ab = new Vector3(b).subtract(a);
	const ac = new Vector3(c).subtract(a);
	const ao = negate(new Vector3(a));
	const abc = ab.cross(ac);

	if (abc.cross(ac).dot(ao) > 0) {
		if (ac.dot(ao) > 0) {
			simplex.length = 0;
			simplex.push(a, c);

			D.set(ac.cross(ao).cross(ac));

			return false;
		}

		simplex.length = 0;
		simplex.push(a, b);

		return check1dSimplex(simplex, D);
	}

	if (ab.cross(abc).dot(ao) > 0) {
		simplex.length = 0;
		simplex.push(a, b);

		return check1dSimplex(simplex, D);
	}

	if (abc.dot(ao) > 0) {
		simplex.length = 0;
		simplex.push(a, b, c);
		D.set(abc);

		return false;
	}

	simplex.length = 0;
	simplex.push(a, c, b);
	D.set(negate(abc));

	return false;
}