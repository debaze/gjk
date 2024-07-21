import {Renderer} from "../src/index.js";
import {PolygonGeometry} from "../src/Geometry/index.js";
import {Material} from "../src/Material/index.js";
import {Vector3} from "../src/math/index.js";
import {Mesh} from "../src/Mesh/Mesh.js";
import {epa} from "./epa.js";
import {gjk} from "./gjk.js";

const renderer = new Renderer();
const mesh1 = new Mesh({
	position: new Vector3(-55, 32.5, 0),
	geometry: new PolygonGeometry({
		vertices: [
			new Vector3(-60, 0, 0),
			new Vector3(0, 100, 0),
			new Vector3(60, 0, 0),
			new Vector3(70, -30, 0),
		],
	}),
	material: new Material({
		color: "#2db83d",
	}),
});
const mesh2 = new Mesh({
	position: new Vector3(-50, 30, 0),
	geometry: new PolygonGeometry({
		vertices: [
			new Vector3(-30, 0, 0),
			new Vector3(0, 30, 0),
			new Vector3(30, 40, 0),
			new Vector3(60, 25, 0),
			new Vector3(80, 10, 0),
		],
	}),
	material: new Material({
		color: "#779ecb",
	}),
});
const debug = {};
let requestId;

function loop() {
	requestId = requestAnimationFrame(loop);

	delete debug.normal;
	delete debug.depth;

	renderer.render();

	try {
		const simplex = gjk(mesh1, mesh2);
		const intersecting = simplex !== null;

		if (intersecting) {
			// renderer.renderSimplex(simplex);

			const collision = epa(mesh1, mesh2, simplex);

			if (collision !== null) {
				// renderer.renderPolytope(collision.polytope);
				// renderer.renderCollision(collision);

				debug.normal = collision.normal;
				debug.depth = collision.depth;

				const bias = .001;
				const force = new Vector3(collision.normal)
					.multiplyScalar(collision.depth + bias);

				mesh1.getPosition().subtract(force);
			}
		}

		debug.intersecting = intersecting;

		renderer.renderMesh(mesh1, intersecting);
		renderer.renderMesh(mesh2, intersecting);
		renderer.renderDebug(debug);
	} catch (error) {
		console.error(error);

		cancelAnimationFrame(requestId);
	}
}

document.body.appendChild(renderer.getCanvas());

requestAnimationFrame(loop);

window.addEventListener("resize", function() {
	renderer.resize();
});

renderer.getCanvas().addEventListener("mousemove", function(event) {
	const O = renderer.getOrigin();
	const position = new Vector3(
		event.clientX - O[0],
		(-event.clientY + O[1]),
		0,
	);

	mesh1.getPosition().set(position);
});