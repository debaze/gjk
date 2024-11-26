import {Vector2} from "../src/math/index.js";

/**
 * @todo Matrix multiplication costly with too many vertices
 * 
 * @param {import("../src/index.js").Object} object1
 * @param {import("../src/index.js").Object} object2
 * @param {import("../src/math/index.js").Vector2} D Direction, not necessarily normalized
 */
export function minkowskiSupport(object1, object2, D) {
	const s0 = new Vector2(object1.getGeometry().support(D));
	s0.multiplyMatrix(object1.transform);

	const s1 = new Vector2(object2.getGeometry().support(new Vector2(D).negate()));
	s1.multiplyMatrix(object2.transform);

	return s0.subtract(s1);
}