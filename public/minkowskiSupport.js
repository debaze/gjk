import {Vector3} from "../src/math/index.js";

/**
 * @param {import("../src/index.js").Object} object1
 * @param {import("../src/index.js").Object} object2
 * @param {Vector3} D
 */
export function minkowskiSupport(object1, object2, D) {
	const s0 = new Vector3(object1.getGeometry().support(D));
	s0.add(object1.getPosition());

	const s1 = new Vector3(object2.getGeometry().support(new Vector3(D).negate()));
	s1.add(object2.getPosition());

	return s0.subtract(s1);
}