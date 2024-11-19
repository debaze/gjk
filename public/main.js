import {Application, Geometry, Material, Object, Scene} from "../src/index.js";
import {Vector3} from "../src/math/index.js";

const application = new Application();

document.body.appendChild(application.getRenderer().getCanvas());

await application.initialize();

const scene = new Scene([
	new Object(
		new Vector3(-155, 32.5, 0),
		new Geometry([
			new Vector3(-60, 0, 0),
			new Vector3(0, 100, 0),
			new Vector3(60, 0, 0),
			new Vector3(70, -30, 0),
		]),
		new Material({
			fillColor: "#ffee8c20",
			strokeColor: "#ffee8c50",
		}),
	),
	new Object(
		new Vector3(-50, 130, 0),
		new Geometry([
			new Vector3(-30, 0, 0),
			new Vector3(0, 30, 0),
			new Vector3(30, 40, 0),
			new Vector3(60, 25, 0),
			new Vector3(80, 10, 0),
		]),
		new Material({
			fillColor: "#ffee8c20",
			strokeColor: "#ffee8c50",
		}),
	),
	new Object(
		new Vector3(0, 0, 0),
		new Geometry([
			new Vector3(0, 0, 0),
			new Vector3(0, 48, 0),
			new Vector3(32, 48, 0),
			new Vector3(32, 0, 0),
		]),
		new Material({
			fillColor: "#ffee8c20",
			strokeColor: "#ffee8c50",
		}),
	),
]);

application.setScene(scene);
application.startLoop();