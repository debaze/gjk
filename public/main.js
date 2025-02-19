import {Application, Color, Geometry, Material, Object, Scene} from "../src/index.js";
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
		fillColor: Color.rgb(244, 254, 219),
		strokeColor: Color.rgb(0, 0, 0),
	}),
);
plane.label = "Plane";
plane.position.set(new Vector2(0.45, -0.625));
// plane.angularVelocity = radians(0.1);
// plane.linearVelocity = new Vector2(0, -0.002);
plane.updateTransform();

const triangle = new Object(
	new Geometry([
		new Vector2(0, 0),
		new Vector2(0, 1),
		new Vector2(6, 0),
	]),
	new Material({
		fillColor: Color.rgb(230, 221, 255),
		strokeColor: Color.rgb(0, 0, 0),
	}),
);
triangle.label = "Triangle";
triangle.position.set(new Vector2(-1, 1.9));
triangle.rotation = radians(-30);
// triangle.angularVelocity = radians(0.4627);
triangle.angularVelocity = radians(32.26);

// const toi = 2;
// triangle.rotation += triangle.angularVelocity * toi;
// triangle.angularVelocity = 0;

triangle.updateTransform();

const cube = new Object(
	new Geometry([
		new Vector2(-4, 1),
		new Vector2(4, 1),
		new Vector2(4, -1),
		new Vector2(-4, -1),
	]),
	new Material({
		fillColor: Color.rgb(244, 254, 219),
		strokeColor: Color.rgb(0, 0, 0),
	}),
);
cube.label = "Cube";
cube.position.set(new Vector2(0, -1));
cube.updateTransform();

const scene = new Scene([
	cube,
	triangle,
]);

application.setScene(scene);
application.startLoop();