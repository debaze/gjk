import {Vector3} from "../src/math/index.js";
import {negate} from "./helpers.js";

/**
 * @param {import("../src/Object/index.js").Object} object1
 * @param {import("../src/Object/index.js").Object} object2
 * @param {Vector3} D
 */
export function support(object1, object2, D) {
	const s0 = new Vector3(object1.getGeometry().support(D));
	s0.add(object1.getPosition());

	const s1 = new Vector3(object2.getGeometry().support(negate(new Vector3(D))));
	s1.add(object2.getPosition());

	return s0.subtract(s1);
}