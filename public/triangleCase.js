import {Vector3} from "../src/math/index.js";
import {lineCase} from "./lineCase.js";
import {negate} from "./negate.js";

/**
 * @param {Vector3[]} simplex
 * @param {Vector3} D
 */
export function triangleCase(simplex, D) {
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

		return lineCase(simplex, D);
	}

	if (ab.cross(abc).dot(ao) > 0) {
		simplex.length = 0;
		simplex.push(a, b);

		return lineCase(simplex, D);
	}

	return true;
}