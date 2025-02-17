import {Application, Geometry, Material, Object, Scene} from "../src/index.js";
import {radians, Vector2} from "../src/math/index.js";

const application = new Application();

document.body.appendChild(application.getRenderer().getCanvas());

await application.initialize();

const plane = new Object(
	new Geometry([
		new Vector2(-3, 0),
		new Vector2(4, 0),
		new Vector2(3, -1),
		new Vector2(-2.25, -1.5),
	]),
	new Material({
		fillColor: "#f4fedb",
		strokeColor: "#000000",
	}),
);
plane.label = "Plane";
plane.position.set(new Vector2(0.45, -0.625));
// plane.angularVelocity = radians(0.1);
plane.updateTransform();

const triangle = new Object(
	new Geometry([
		new Vector2(0, 0),
		new Vector2(0, 1),
		new Vector2(6, 0),
	]),
	new Material({
		fillColor: "#e6ddff",
		strokeColor: "#000000",
	}),
);
triangle.label = "Triangle";
triangle.position.set(new Vector2(0, 2));
triangle.rotation = radians(-30);
// triangle.angularVelocity = radians(0.25);
triangle.angularVelocity = radians(70);

// const toi = 0.787109375;
// triangle.rotation += triangle.angularVelocity * toi;
// triangle.angularVelocity = 0;
triangle.updateTransform();

/* const cube = new Object(
	new Geometry([
		new Vector2(-1, 1),
		new Vector2(1, 1),
		new Vector2(1, -1),
		new Vector2(-1, -1),
	]),
	new Material({
		fillColor: "#ffee8c20",
		strokeColor: "#ffee8c50",
	}),
);
cube.label = "Cube";
cube.position.set(new Vector2(0, 2));
cube.linearVelocity.set(new Vector2(0, 0));
// cube.angularVelocity = -0.004;
cube.updateTransform(); */

const scene = new Scene([
	plane,
	triangle,
]);

application.setScene(scene);
application.startLoop();