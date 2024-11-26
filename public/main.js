import {Application, Geometry, Material, Object, Scene} from "../src/index.js";
import {Vector2} from "../src/math/index.js";

const application = new Application();

document.body.appendChild(application.getRenderer().getCanvas());

await application.initialize();

const triangle = new Object(
	new Geometry([
		new Vector2(-4, -1),
		new Vector2(-1, 5),
		new Vector2(3, 1),
	]),
	new Material({
		fillColor: "#ffee8c20",
		strokeColor: "#ffee8c50",
	}),
);
triangle.updateTransform();

const polygon1 = new Object(
	new Geometry([
		new Vector2(-2, 2),
		new Vector2(2, 2),
		new Vector2(2, -2),
		new Vector2(-2, -2),
	]),
	new Material({
		fillColor: "#ffee8c20",
		strokeColor: "#ffee8c50",
	}),
);
polygon1.position.add(new Vector2(4, 0));
polygon1.updateTransform();

const polygon3 = new Object(
	new Geometry([
		new Vector2(-2, 2),
		new Vector2(2, 2),
		new Vector2(2, -2),
		new Vector2(-2, -2),
	]),
	new Material({
		fillColor: "#ffee8c20",
		strokeColor: "#ffee8c50",
	}),
);
polygon3.position.set(new Vector2(-4, 0));
polygon3.updateTransform();

const polygon2 = new Object(
	new Geometry([
		new Vector2(3, 2),
		new Vector2(0, 5),
		new Vector2(-2.5, 3.5),
		new Vector2(-3.5, -1.5),
		new Vector2(1.5, -2),
	]),
	new Material({
		fillColor: "#ffee8c20",
		strokeColor: "#ffee8c50",
	}),
);
polygon2.updateTransform();

const scene = new Scene([
	// point,
	// line,
	// triangle,
	polygon1,
	polygon2,
]);

scene.setMarkedObject1Index(0);
scene.setMarkedObject2Index(1);

application.setScene(scene);
application.startLoop();