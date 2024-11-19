/* function loop() {
	requestId = requestAnimationFrame(loop);

	delete debug.normal;
	delete debug.depth;

	try {
		const simplex = GilbertJohnsonKeerthi(object1, object2);
		const intersecting = simplex !== null;

		if (intersecting) {
			// renderer.renderSimplex(simplex);

			const collision = ExpandingPolytopeAlgorithm(object1, object2, simplex);

			if (collision !== null) {
				// renderer.renderPolytope(collision.polytope);
				// renderer.renderCollisionNormal(collision);
				renderer.renderClosestEdges(object1, object2, collision);

				debug.normal = collision.normal;
				debug.depth = collision.depth;

				const bias = .001;
				const force = new Vector3(collision.normal)
					.multiplyScalar(collision.depth + bias);

					object2.getPosition().add(force);
			}
		}

		debug.intersecting = intersecting;

		// renderer.renderObject(object1, intersecting);
		// renderer.renderObject(object2, intersecting);
		// renderer.renderCenterOfMass(object1);
		// renderer.renderCenterOfMass(object2);
		// renderer.renderDebug(debug);

		renderer.render();
	} catch (error) {
		console.error(error);

		cancelAnimationFrame(requestId);
	}
} */

/**
 * @param {import("../src/Object/index.js").Object} object
 * @param {Boolean} intersecting
 */
/* renderObject__old(object, intersecting) {
	const position = object.getPosition();
	const geometry = object.getGeometry();
	const material = object.getMaterial();

	this.#context.save();

	if (intersecting) {
		this.#context.fillStyle = Renderer.#INTERSECTION_BACKGROUND_COLOR;
		this.#context.strokeStyle = Renderer.#INTERSECTION_EDGE_COLOR;
	} else {
		this.#context.fillStyle = `${material.getColor()}45`;
		this.#context.strokeStyle = material.getColor();
	}

	geometry.render(this.#context, position, this.#origin);

	this.#context.stroke();
	this.#context.fill();

	this.#context.restore();
} */

/**
 * @param {import("../src/Object/index.js").Object} object
 */
/* renderCenterOfMass(object) {
	const O = this.#origin;
	const centerOfMass = new Vector3(object.getGeometry().getCenterOfMass()).add(object.getPosition());

	this.#context.save();
	this.#context.fillStyle = "blue";
	this.#context.beginPath();
	this.#context.arc(centerOfMass[0] + O[0], O[1] - centerOfMass[1], 2, 0, pi * 2);
	this.#context.fill();
	this.#context.restore();
} */

/**
 * Renders the edge of each object involved in the collision.
 * 
 * @param {import("../src/Object/index.js").Object} object1
 * @param {import("../src/Object/index.js").Object} object2
 * @param {import("../public/epa.js").Collision} collision
 */
/* renderClosestEdges(object1, object2, collision) {
	const v = this.#viewport;

	const g1 = object1.getGeometry();
	const g2 = object2.getGeometry();

	if (g1 instanceof Geometry && g2 instanceof Geometry) {
		// const e1 = g1.support(collision.normal);
		// const e2 = g2.support(new Vector3(collision.normal).negate());

		const e1a = g1.getVertices()[0];
		const e1b = g1.getVertices()[1];

		this.#context.strokeStyle = "#de1818";
		this.#context.beginPath();

		this.#context.moveTo(v[2] / 2 + e1a[0], v[3] / 2 + e1a[1]);
		this.#context.lineTo(v[2] / 2 + e1b[0], v[3] / 2 + e1b[1]);

		this.#context.stroke();
	}
} */

/**
 * @param {import("../public/types.js").Simplex} simplex
 */
/* renderSimplex(simplex) {
	const O = this.#origin;

	this.#context.save();

	this.#context.fillStyle = `${Renderer.#POLYTOPE_COLOR}45`;
	this.#context.strokeStyle = Renderer.#POLYTOPE_COLOR;

	const v0 = new Vector3(
		simplex[0][0] + O[0],
		O[1] - simplex[0][1],
		O[2],
	);

	this.#context.beginPath();
	this.#context.moveTo(v0[0], v0[1]);

	const orderedIndices = [0, 1, //3//, 2];

	for (let i = 0; i < simplex.length; i++) {
		const j = orderedIndices[i];
		const vN = new Vector3(
			simplex[j][0] + O[0],
			O[1] - simplex[j][1],
			O[2],
		);

		this.#context.lineTo(vN[0], vN[1]);
	}

	this.#context.lineTo(v0[0], v0[1]);

	this.#context.stroke();
	this.#context.fill();

	this.#context.restore();
} */

/**
 * @param {Vector3[]} polytope
 */
/* renderPolytope(polytope) {
	const O = this.#origin;

	this.#context.save();

	this.#context.fillStyle = `${Renderer.#POLYTOPE_COLOR}45`;
	this.#context.strokeStyle = Renderer.#POLYTOPE_COLOR;

	const v0 = new Vector3(
		polytope[0][0] + O[0],
		O[1] - polytope[0][1],
		O[2],
	);

	this.#context.beginPath();
	this.#context.moveTo(v0[0], v0[1]);

	for (let i = 0; i < polytope.length; i++) {
		const vN = new Vector3(
			polytope[i][0] + O[0],
			O[1] - polytope[i][1],
			O[2],
		);

		this.#context.lineTo(vN[0], vN[1]);
	}

	this.#context.lineTo(v0[0], v0[1]);

	this.#context.stroke();
	this.#context.fill();

	this.#context.restore();
} */

/**
 * @param {import("../public/epa.js").Collision} collision
 */
/* renderCollisionNormal(collision) {
	const O = this.#origin;
	const normal = (new Vector3(collision.normal).multiplyScalar(collision.depth));

	this.#context.save();

	this.#context.strokeStyle = Renderer.#COLLISION_COLOR;

	this.#context.beginPath();
	this.#context.moveTo(O[0], O[1]);
	this.#context.lineTo(normal[0] + O[0], O[1] - normal[1]);
	this.#context.stroke();

	this.#context.restore();
} */

/**
 * @param {Record.<String, *>} objects
 */
/* renderDebug(objects) {
	const objectEntries = Object.entries(objects);
	let y = 20;

	this.#context.fillStyle = Renderer.#DEBUG_TEXT_COLOR;
	this.#context.font = "12px Consolas";

	for (const [name, value] of objectEntries) {
		this.#context.fillText(`${name}: ${value}`, 8, y);

		y += 12;
	}
} */

/* #renderOrigin() {
	const O = this.#origin;

	this.#context.fillStyle = Renderer.#AXIS_TEXT_COLOR;
	this.#context.font = "10px Consolas";
	this.#context.fillText("O", O[0] + 3, O[1] - 4);
} */

/**
 * @param {import("../src/Object/index.js").Object} object
 */
/* #renderSupport(object) {
	const O = this.#origin;
	const D = new Vector3(1, 1, 0);
	const support = new Vector3(object.getGeometry().support(D));
	support.add(object.getPosition());

	this.#context.save();

	this.#context.fillStyle = "#de1818";

	this.#context.beginPath();
	this.#context.arc(support[0] + O[0], -support[1] + O[1], 2, 0, pi * 2);
	this.#context.fill();

	this.#context.beginPath();
	this.#context.moveTo(O[0], O[1]);
	const t = new Vector2(D[0], D[1]).multiplyScalar(100);
	const tmp = new Vector2(t[0] + O[0], -t[1] + O[1]);
	this.#context.lineTo(tmp[0], tmp[1]);
	this.#context.stroke();

	this.#context.restore();
} */