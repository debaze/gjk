import {Renderer} from "../src/index.js";
import {Vector3} from "../src/math/index.js";
import {Polygon} from "../src/Shape/index.js";
import {gjk} from "./gjk.js";

export const O = new Vector3(0, 0, 0);

const renderer = new Renderer();
const shape1 = new Polygon(new Vector3(-50, 30, 0), [
	new Vector3(-30, 0, 0),
	new Vector3(0, 30, 0),
	new Vector3(30, 40, 0),
	new Vector3(60, 25, 0),
	new Vector3(80, 10, 0),
], "#779ecb");
const shape2 = new Polygon(new Vector3(-25, 73.5, 0), [
	new Vector3(-60, 0, 0),
	new Vector3(0, 100, 0),
	new Vector3(60, 0, 0),
	new Vector3(70, -30, 0),
], "#2db83d");
const debug = {};
let requestId;

function loop() {
	requestId = requestAnimationFrame(loop);

	try {
		const intersecting = gjk(shape1, shape2);

		debug.intersecting = intersecting;

		renderer.render(shape1, shape2, intersecting);
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

	shape2.setPosition(position);
});