import {Geometry} from "./index.js";
import {dot, Matrix3, negate, Vector2} from "./math/index.js";

export class Object {
	#position = new Vector2(0, 0);
	#rotation = 0;
	#scale = new Vector2(1, 1);
	#transform = Matrix3.identity();
	#force = new Vector2(0, 0);

	#linearVelocity = new Vector2(0, 0);
	#linearAcceleration = new Vector2(0, 0);
	#angularVelocity = 0;
	#angularAcceleration = 0;

	#geometry;
	#material;

	label = "Untitled Object";

	/**
	 * @param {import("./Object.js").Object} object
	 */
	static copy(object) {
		const copy = new Object(Geometry.copy(object.geometry), object.material);

		copy.position = new Vector2(object.position);
		copy.rotation = object.rotation;
		copy.scale = new Vector2(object.scale);
		copy.transform = new Matrix3(object.transform);
		copy.force = new Vector2(object.force);
		copy.linearVelocity = new Vector2(object.linearVelocity);
		copy.#linearAcceleration = new Vector2(object.linearAcceleration);
		copy.angularVelocity = object.angularVelocity;
		copy.angularAcceleration = object.angularAcceleration;
		copy.label = object.label;

		return copy;
	}

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

	get force() {
		return this.#force;
	}

	set force(force) {
		this.#force = force;
	}

	get linearVelocity() {
		return this.#linearVelocity;
	}

	set linearVelocity(linearVelocity) {
		this.#linearVelocity = linearVelocity;
	}

	get linearAcceleration() {
		return this.#linearAcceleration;
	}

	set linearAcceleration(linearAcceleration) {
		this.#linearAcceleration = linearAcceleration;
	}

	get angularVelocity() {
		return this.#angularVelocity;
	}

	set angularVelocity(angularVelocity) {
		this.#angularVelocity = angularVelocity;
	}

	get angularAcceleration() {
		return this.#angularAcceleration;
	}

	set angularAcceleration(angularAcceleration) {
		this.#angularAcceleration = angularAcceleration;
	}

	get geometry() {
		return this.#geometry;
	}

	get material() {
		return this.#material;
	}

	updateTransform() {
		const transform = this.getTransform(this.#position, this.#rotation);

		this.#transform.set(transform);
	}

	/**
	 * @param {Number} t
	 */
	at(t) {
		const position = new Vector2(this.#linearVelocity).multiplyScalar(t).add(this.#position);
		const rotation = this.#rotation + this.#angularVelocity * t;

		return this.getTransform(position, rotation);
	}

	/**
	 * @param {import("../src/math/index.js").Vector2} position
	 * @param {Number} rotation
	 */
	getTransform(position, rotation) {
		const T = Matrix3.translation(position);
		T.multiply(Matrix3.rotation(rotation));
		T.multiply(Matrix3.scale(this.#scale));
		T.multiply(Matrix3.translation(negate(this.#geometry.centerOfMass)));

		return T;
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

		const vertices = this.#geometry.vertices;

		response.index = 0;
		response.vertex = vertices[response.index];

		let maxAngle = Number.NEGATIVE_INFINITY;

		for (let i = response.index; i < vertices.length; i++) {
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

	/**
	 * Returns the index of the point furthest in the direction of d.
	 * No transformation applied.
	 * 
	 * @param {import("../src/math/index.js").Vector2} d
	 */
	supportBase(d) {
		let maxIndex = 0;
		let maxValue = dot(this.#geometry.vertices[maxIndex], d);

		for (let i = 1; i < this.#geometry.vertices.length; i++) {
			let value = dot(this.#geometry.vertices[i], d);

			if (value > maxValue) {
				maxIndex = i;
				maxValue = value;
			}
		}

		return maxIndex;
	}

	/**
	 * @param {import("../src/math/index.js").Vector2} d
	 * @param {Number} t
	 */
	supportTime(d, t) {
		const transform = this.at(t);

		/**
		 * @type {import("../public/MinkowskiDifference.js").SupportTime}
		 */
		const response = {};

		let maxAngle = Number.NEGATIVE_INFINITY;

		for (let i = 0; i < this.#geometry.vertices.length; i++) {
			const vertex = this.#geometry.vertices[i];
			const transformedVertex = new Vector2(vertex).multiplyMatrix(transform);
			const angle = dot(transformedVertex, d);

			if (angle > maxAngle) {
				response.index = i;
				response.vertex = vertex;
				response.transformedVertex = transformedVertex;
				response.angle = angle;

				maxAngle = angle;
			}
		}

		return response;
	}
}