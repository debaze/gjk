import {Geometry} from "./index.js";
import {dot, Matrix3, Vector2} from "./math/index.js";

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
		const translationPos = Matrix3.translation(this.#position);
		const translationCOM = Matrix3.translation(new Vector2(this.#geometry.centerOfMass).negate());
		const rotation = Matrix3.rotation(this.#rotation);
		const scale = Matrix3.scale(this.#scale);

		const transform = Matrix3.identity();

		transform.multiply(translationPos);
		transform.multiply(rotation);
		transform.multiply(scale);
		transform.multiply(translationCOM);

		this.#transform.set(transform);
	}

	/**
	 * @param {Number} t
	 */
	at(t) {
		const p = new Vector2(this.#position).add(new Vector2(this.#linearVelocity).multiplyScalar(t));
		const r = this.#rotation + this.#angularVelocity * t;

		const translationPos = Matrix3.translation(p);
		const translationCOM = Matrix3.translation(new Vector2(this.#geometry.centerOfMass).negate());
		const rotation = Matrix3.rotation(r);
		const scale = Matrix3.scale(this.#scale);

		const transform = Matrix3.identity();

		transform.multiply(translationPos);
		transform.multiply(rotation);
		transform.multiply(scale);
		transform.multiply(translationCOM);

		return transform;
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
	 * @param {import("../src/math/index.js").Vector2} D
	 * @param {Number} t
	 */
	supportTime(D, t) {
		const transform = this.at(t);

		/**
		 * @type {import("../public/MinkowskiDifference.js").SupportTime}
		 */
		const response = {};

		const vertices = this.#geometry.vertices;

		response.index = 0;
		response.t = t;
		response.vertex = vertices[response.index];

		let maxAngle = Number.NEGATIVE_INFINITY;

		for (let i = response.index; i < vertices.length; i++) {
			const vertex = vertices[i];
			const transformedVertex = new Vector2(vertex).multiplyMatrix(transform);
			const angle = dot(transformedVertex, D);

			if (angle > maxAngle) {
				response.index = i;
				response.vertex = vertex;
				response.transformedVertex = transformedVertex;

				maxAngle = angle;
			}
		}

		return response;
	}
}