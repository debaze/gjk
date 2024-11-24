import {Application, Geometry, Material, Object, Scene} from "../src/index.js";
import {Vector2} from "../src/math/index.js";

const application = new Application();

document.body.appendChild(application.getRenderer().getCanvas());

await application.initialize();

const scene = new Scene([
	// Point
	/* new Object(
		new Vector2(0, 0),
		new Geometry([
			new Vector2(1, 1),
		]),
		new Material({
			fillColor: "#ffee8c20",
			strokeColor: "#ffee8c50",
		}),
	), */
	// Line
	/* new Object(
		new Vector2(0, 0),
		new Geometry([
			new Vector2(-2, -1),
			new Vector2(3, 2),
		]),
		new Material({
			fillColor: "#ffee8c20",
			strokeColor: "#ffee8c50",
		}),
	), */
	// Triangle
	/* new Object(
		new Vector2(0, 0),
		new Geometry([
			new Vector2(-4, -1),
			new Vector2(-1, 5),
			new Vector2(3, 1),
		]),
		new Material({
			fillColor: "#ffee8c20",
			strokeColor: "#ffee8c50",
		}),
	), */
	// Polygon 1
	/* new Object(
		new Vector2(0, 0),
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
	), */
	// Polygon 2
	new Object(
		new Vector2(0, 0),
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
	),
]);

scene.setMarkedObject1Index(0);

application.setScene(scene);
application.startLoop();