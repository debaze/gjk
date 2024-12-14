import {Application, Geometry, Material, Object, Scene} from "../src/index.js";
import {Vector2} from "../src/math/index.js";

const application = new Application();

document.body.appendChild(application.getRenderer().getCanvas());

await application.initialize();

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
polygon1.position.set(new Vector2(-5, 0));
polygon1.updateTransform();

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
polygon2.position.set(new Vector2(4, 0));
polygon2.linearVelocity.set(new Vector2(-0.02, 0));
polygon2.angularVelocity = -0.004;
polygon2.updateTransform();

const scene = new Scene([
	polygon1,
	polygon2,
]);

application.setScene(scene);
application.startLoop();