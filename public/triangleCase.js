import {Vector3} from "../src/math/index.js";
import {lineCase} from "./lineCase.js";
import {O} from "./main.js";

/**
 * @param {Vector3[]} simplex
 * @param {Vector3} D
 */
export function triangleCase(simplex, D) {
	const [a, b, c] = simplex;
	const ab = new Vector3(b).subtract(a);
	const ac = new Vector3(c).subtract(a);
	const ao = new Vector3(O).subtract(a);
	const abc = ab.cross(ac);

	if (abc.cross(ac).dot(ao) > 0) {
		if (ac.dot(ao) > 0) {
			simplex.length = 0;
			simplex.push(a, c);
			D.set(ac.cross(ao).cross(ac));
		} else {
			simplex.length = 0;
			simplex.push(a, b);

			return lineCase(simplex, D);
		}
	} else {
		if (ab.cross(abc).dot(ao) > 0) {
			simplex.length = 0;
			simplex.push(a, b);

			return lineCase(simplex, D);
		} else {
			return true;
		}
	}

	return false;
}