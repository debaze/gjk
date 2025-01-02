import {Application, Geometry, Material, Object, Scene} from "../src/index.js";
import {Vector2} from "../src/math/index.js";

const application = new Application();

document.body.appendChild(application.getRenderer().getCanvas());

await application.initialize();

const plane = new Object(
	new Geometry([
		new Vector2(-10, 0),
		new Vector2(10, 0),
	]),
	new Material({
		fillColor: "#ffee8c20",
		strokeColor: "#ffee8c50",
	}),
);
plane.position.set(new Vector2(0, -4));
plane.updateTransform();

const cube1 = new Object(
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
cube1.position.set(new Vector2(0, 2));
cube1.linearVelocity.set(new Vector2(0, -0.01));
// cube1.angularVelocity = -0.004;
cube1.updateTransform();

const cube2 = new Object(
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
cube2.position.set(new Vector2(7, -4));
cube2.linearVelocity.set(new Vector2(0, 0));
// cube2.angularVelocity = -0.004;
cube2.updateTransform();

const scene = new Scene([
	plane,
	cube1,
	// cube2,
]);

application.setScene(scene);
application.startLoop();