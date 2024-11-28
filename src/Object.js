import {dot, Matrix3, Vector2} from "./math/index.js";

export class Object {
	#position = new Vector2(0, 0);
	#rotation = 0;
	#scale = new Vector2(1, 1);
	#transform = Matrix3.identity();

	#velocity = new Vector2(0, 0);
	#acceleration = new Vector2(0, 0);
	#force = new Vector2(0, 0);

	#geometry;
	#material;

	/**
	 * @param {import("./index.js").Geometry} geometry
	 * @param {import("./index.js").Material} material
	 */
	constructor(geometry, material) {
		this.#geometry = geometry;
		this.#material = material;
	}

	get position() {
		return this.#position;
	}

	set position(position) {
		this.#position.set(position);
	}

	get rotation() {
		return this.#rotation;
	}

	set rotation(rotation) {
		this.#rotation = rotation;
	}

	get scale() {
		return this.#scale;
	}

	set scale(scale) {
		this.#scale.set(scale);
	}

	get transform() {
		return this.#transform;
	}

	set transform(transform) {
		this.#transform.set(transform);
	}

	getVelocity() {
		return this.#velocity;
	}

	getAcceleration() {
		return this.#acceleration;
	}

	getForce() {
		return this.#force;
	}

	getGeometry() {
		return this.#geometry;
	}

	getMaterial() {
		return this.#material;
	}

	updateTransform() {
		const translation = Matrix3.translation(this.#position);
		const rotation = Matrix3.rotation(this.#rotation);
		const scale = Matrix3.scale(this.#scale);
		const transform = translation.multiply(rotation).multiply(scale);

		this.#transform.set(transform);
	}

	/**
	 * @param {import("../src/math/index.js").Vector2} D Direction
	 */
	support(D) {
		/**
		 * @type {import("../public/MinkowskiDifference.js").Support}
		 */
		const response = {};

		const rotationMatrixInverse = Matrix3.rotation(-this.#rotation);
		const DInverse = new Vector2(D).multiplyMatrix(rotationMatrixInverse);

		const vertices = this.#geometry.getVertices();

		response.index = 0;
		response.vertex = vertices[response.index];

		let maxAngle = dot(response.vertex, DInverse);

		for (let i = response.index + 1; i < vertices.length; i++) {
			const vertex = vertices[i];
			const angle = dot(vertex, DInverse);

			if (angle > maxAngle) {
				response.index = i;
				response.vertex = vertex;

				maxAngle = angle;
			}
		}

		response.vertex = new Vector2(response.vertex).multiplyMatrix(this.#transform);

		return response;
	}
}