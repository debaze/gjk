import {dot, Vector2} from "../src/math/index.js";

/**
 * @typedef {Object} Collision
 * @property {import("./GJK.js").GJKResponse} gjk
 * @property {import("../src/index.js").Object} a First object
 * @property {import("../src/index.js").Object} b Second object
 * @property {Number} toi Time of impact
 * @property {import("../src/math/index.js").Vector2} n Collision normal
 */

/**
 * @param {Collision[]} collisions
 */
function resolveCollisions(collisions) {
	for (let i = 0; i < collisions.length; i++) {
		const collision = collisions[i];
		const a = collision.a;
		const b = collision.b;
		const toi = collision.toi;
		const n = new Vector2(b.position).subtract(a.position).normalize();

		const vA0 = a.linearVelocity;
		const vB0 = b.linearVelocity;

		// a.linearVelocity.add(impulseA);
		// b.linearVelocity.add(impulseB);

		// const vA1 = a.linearVelocity;
		// const vB1 = b.linearVelocity;

		// Calculate ratio of speeds after and before collision along n.
		// const Cr = -dot(new Vector2(vA1).subtract(vB1), n) / dot(new Vector2(vA0).subtract(vB0), n);
		const crA = 1;
		const crB = 1;

		const mA = 1;
		const mB = 1;
		const invMassA = 1 / mA;
		const invMassB = 1 / mB;
		const invMasses = invMassA + invMassB;

		const jA = dot(new Vector2(vA0).subtract(vB0).multiplyScalar(1 + crA).negate(), n) / invMasses;
		const jB = dot(new Vector2(vA0).subtract(vB0).multiplyScalar(1 + crB).negate(), n) / invMasses;

		const impA = new Vector2(n).multiplyScalar(-jA);
		const impB = new Vector2(n).multiplyScalar(jB);

		const vA1 = new Vector2(vA0).add(new Vector2(n).multiplyScalar(jA / mA));
		const vB1 = new Vector2(vB0).subtract(new Vector2(n).multiplyScalar(jB / mB));

		a.linearVelocity.add(vA1);
		b.linearVelocity.add(vB1);
	}
}