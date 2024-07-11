import {Vector3} from "../src/math/index.js";
import {O} from "./main.js";

/**
 * @param {Vector3[]} simplex
 * @param {Vector3} D
 */
export function lineCase(simplex, D) {
	const [b, a] = simplex;
	const ab = new Vector3(b).subtract(a);
	const ao = new Vector3(O).subtract(a);

	if (ab.dot(ao) > 0) {
		D.set(ab.cross(ao).cross(ab));
	} else {
		simplex.length = 0;
		simplex.push(a);
		D.set(ao);
	}
}