import {Vector3} from "../src/math/index.js";
import {Shape} from "../src/Shape/index.js";
import {O} from "./main.js";

/**
 * @param {Shape} shape1
 * @param {Shape} shape2
 * @param {Vector3} D
 */
export function support(shape1, shape2, D) {
	const s0 = shape1.support(D);
	const s1 = shape2.support(new Vector3(O).subtract(D));
	const s = new Vector3(s0).subtract(s1);

	return s;
}