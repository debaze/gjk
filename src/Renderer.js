import {Color} from "./Color.js";
import {Matrix3, pi, transpose, Vector2} from "./math/index.js";

export class Renderer {
	// static #INTERSECTION_EDGE_COLOR = "#ff746c";
	// static #INTERSECTION_BACKGROUND_COLOR = "#ff746c45";
	// static #COLLISION_COLOR = "#670066";

	// Background
	static #BACKGROUND_COLOR = "#ffffff";

	// Grid
	static #GRID_COLUMN_GAP = 1;
	static #GRID_ROW_GAP = 1;
	static #GRID_COLOR = "#dddddd";

	// Axes
	static #AXIS_COLOR = "#bbbbbb";

	// Geometry
	static #CENTER_OF_MASS_RADIUS = 0.15;
	static #CENTER_OF_MASS_COLOR = Color.rgb(0, 0, 0);
	static #DISTANCE_COLOR = "#8d8d8c";

	// Selection
	static #SELECTION_COLOR = "#4ceb00";

	// Debug
	static #DEBUG_TOOLTIP_MARGIN = new Vector2(8, 8);
	static #DEBUG_TOOLTIP_TEXT_COLOR = "#000000a0";
	static #SIMPLEX_COLOR = "#ff2600";

	#canvas;

	/**
	 * @type {?CanvasRenderingContext2D}
	 */
	#context = null;

	#projection = Matrix3.identity();
	#viewport = new Vector2(0, 0);
	#zoomLevel = 1;
	#mouse = new Vector2(0, 0);
	#transform = Matrix3.identity();

	/**
	 * @type {?import("./index.js").Scene}
	 */
	#scene = null;

	/**
	 * @type {?Number}
	 */
	hoveredObjectIndex = null;

	/**
	 * @type {?Number}
	 */
	draggedObjectIndex = null;

	drag = new Vector2(0, 0);

	constructor() {
		this.#canvas = document.createElement("canvas");
		this.#context = this.#canvas.getContext("2d");

		if (this.#context === null) {
			throw new Error("Could not get a 2D rendering context.");
		}
	}

	getCanvas() {
		return this.#canvas;
	}

	getScene() {
		return this.#scene;
	}

	/**
	 * @param {import("./index.js").Scene} scene
	 */
	setScene(scene) {
		this.#scene = scene;
	}

	render() {
		const objects = this.#scene.getObjects();

		this.#clear();

		this.#renderGrid();
		this.#renderAxes();

		for (let i = 0; i < objects.length; i++) {
			const object = objects[i];

			this.#renderObject(object, i);
		}

		this.#setTransform(Matrix3.identity());

		if (this.#scene.getGJKResponse() !== null) {
			this.#renderGjkResponse(this.#scene.getGJKResponse());
		}

		this.#renderDebugTooltip();
	}

	/**
	 * @param {import("./index.js").Object} object
	 * @param {Number} index
	 */
	#renderObject(object, index) {
		const isDragged = this.draggedObjectIndex === index;

		if (isDragged) {
			const position = new Vector2(object.position).add(this.drag);
			const transform = object.getTransform(position, object.rotation);

			this.#setTransform(transform);

			this.#context.beginPath();

			for (let i = 0; i < object.geometry.vertices.length; i++) {
				const P = object.geometry.vertices[i];

				this.#context.lineTo(P.x, P.y);
			}

			this.#context.closePath();

			this.#context.fillStyle = object.material.fillColor.withAlpha(0.5).toString();
			this.#context.fill();

			this.#context.setLineDash([0.1]);
			this.#context.strokeStyle = object.material.strokeColor.withAlpha(0.5).toString();
			this.#context.stroke();
			this.#context.setLineDash([]);

			this.#renderCenterOfMass(object.geometry.centerOfMass, 0.5);
		}

		this.#setTransform(object.transform);

		this.#context.beginPath();

		for (let i = 0; i < object.geometry.vertices.length; i++) {
			const P = object.geometry.vertices[i];

			this.#context.lineTo(P.x, P.y);
		}

		this.#context.closePath();

		this.#context.fillStyle = object.material.fillColor.toString();
		this.#context.fill();

		const mouse = new Vector2(this.#mouse).multiplyMatrix(this.#projection);
		const isHovered = this.#context.isPointInPath(mouse.x, mouse.y);

		if (isHovered) {
			this.hoveredObjectIndex = index;
		}
		else {
			if (this.draggedObjectIndex === null && this.hoveredObjectIndex === index) {
				this.hoveredObjectIndex = null;
			}
		}

		if (isDragged) {
			this.#context.lineWidth *= 2;
			this.#context.strokeStyle = Renderer.#SELECTION_COLOR;
		}
		else {
			this.#context.strokeStyle = object.material.strokeColor.toString();
		}

		this.#context.stroke();
		this.#context.lineWidth = 1 / this.#zoomLevel;

		this.#renderCenterOfMass(object.geometry.centerOfMass, 1);
	}

	/**
	 * @param {import("../public/GJK.js").GJKResponse} gjkResponse
	 */
	#renderGjkResponse(gjkResponse) {
		this.#context.save();

		if (gjkResponse.closest1 && gjkResponse.closest2) {
			const A = gjkResponse.closest1;
			const B = gjkResponse.closest2;

			this.#context.setLineDash([0.1]);
			this.#context.strokeStyle = Renderer.#DISTANCE_COLOR;
			this.#context.beginPath();
			this.#context.moveTo(A.x, A.y);
			this.#context.lineTo(B.x, B.y);
			this.#context.stroke();
			this.#context.setLineDash([]);
		}

		if (gjkResponse.simplex) {
			const simplex = gjkResponse.simplex;

			this.#context.fillStyle = Renderer.#SIMPLEX_COLOR;
			this.#context.strokeStyle = Renderer.#SIMPLEX_COLOR;
			this.#context.lineWidth *= 3;

			this.#context.save();

			if (gjkResponse.closestFeature1) {
				if (gjkResponse.closestFeature1.isVertex) {
					this.#setTransform(Matrix3.identity());

					this.#renderPoint(gjkResponse.closestFeature1.vertices[0], 0.075);
				}
				else if (gjkResponse.closestFeature1.isEdge) {
					const P0 = gjkResponse.object1.geometry.vertices[simplex[0].index1];

					this.#setTransform(gjkResponse.object1.transform);

					this.#context.beginPath();
					this.#context.moveTo(P0.x, P0.y);

					for (let i = 1; i < simplex.length; i++) {
						const P = gjkResponse.object1.geometry.vertices[simplex[i].index1];

						this.#context.lineTo(P.x, P.y);
					}

					this.#context.lineTo(P0.x, P0.y);
					this.#context.stroke();
				}
			}

			this.#context.restore();

			if (gjkResponse.closestFeature2) {
				if (gjkResponse.closestFeature2.isVertex) {
					this.#setTransform(Matrix3.identity());

					this.#renderPoint(gjkResponse.closestFeature2.vertices[0], 0.075);
				}
				else if (gjkResponse.closestFeature2.isEdge) {
					const P0 = gjkResponse.object2.geometry.vertices[simplex[0].index2];

					this.#setTransform(gjkResponse.object2.transform);

					this.#context.beginPath();
					this.#context.moveTo(P0.x, P0.y);

					for (let i = 1; i < simplex.length; i++) {
						const P = gjkResponse.object2.geometry.vertices[simplex[i].index2];

						this.#context.lineTo(P.x, P.y);
					}

					this.#context.lineTo(P0.x, P0.y);
					this.#context.stroke();
				}
			}

			this.#setTransform(Matrix3.identity());

			this.#context.restore();
		}
	}

	/// Stable utilities ///

	#clear() {
		const w = this.#viewport.x;
		const h = this.#viewport.y;

		this.#context.fillStyle = Renderer.#BACKGROUND_COLOR;
		this.#context.fillRect(-w * 0.5, -h * 0.5, w, h);
	}

	/**
	 * @param {import("./Application.js").View} view
	 */
	setView(view) {
		this.#viewport = view.viewport;
		this.#zoomLevel = view.zoomLevel;
		this.#mouse = view.mouse;

		this.#canvas.width = this.#viewport.x;
		this.#canvas.height = this.#viewport.y;

		this.#setProjection(view.projection);

		this.#context.lineWidth = 1 / this.#zoomLevel;
	}

	/**
	 * @param {import("./math/index.js").Matrix3} P
	 */
	#setProjection(P) {
		this.#projection.set(P);

		this.#updateProjectionAndTransform();
	}

	/**
	 * @param {import("./math/index.js").Matrix3} T
	 */
	#setTransform(T) {
		this.#transform.set(T);

		this.#updateProjectionAndTransform();
	}

	#updateProjectionAndTransform() {
		const PT = transpose(new Matrix3(this.#projection).multiply(this.#transform));

		this.#context.setTransform({
			a: PT[0],
			b: PT[3],
			c: PT[1],
			d: PT[4],
			e: PT[2],
			f: PT[5],
		});
	}

	#renderGrid() {
		const w = this.#viewport.x;
		const h = this.#viewport.y;

		this.#context.strokeStyle = Renderer.#GRID_COLOR;
		this.#context.beginPath();

		// Draw columns.
		for (let x = Renderer.#GRID_COLUMN_GAP; x < w * 0.5; x += Renderer.#GRID_COLUMN_GAP) {
			this.#context.moveTo(-x, -h * 0.5);
			this.#context.lineTo(-x, h * 0.5);
			this.#context.moveTo(x, -h * 0.5);
			this.#context.lineTo(x, h * 0.5);
		}

		// Draw rows.
		for (let y = Renderer.#GRID_ROW_GAP; y < h * 0.5; y += Renderer.#GRID_ROW_GAP) {
			this.#context.moveTo(-w * 0.5, -y);
			this.#context.lineTo(w * 0.5, -y);
			this.#context.moveTo(-w * 0.5, y);
			this.#context.lineTo(w * 0.5, y);
		}

		this.#context.stroke();
	}

	#renderAxes() {
		const w = this.#viewport.x;
		const h = this.#viewport.y;

		this.#context.strokeStyle = Renderer.#AXIS_COLOR;
		this.#context.beginPath();

		// Draw horizontal axis.
		this.#context.moveTo(-w * 0.5, 0);
		this.#context.lineTo(w * 0.5, 0);

		// Draw vertical axis.
		this.#context.moveTo(0, -h * 0.5);
		this.#context.lineTo(0, h * 0.5);

		this.#context.stroke();
	}

	/**
	 * @param {import("./math/index.js").Vector2} C Center of mass
	 * @param {Number} a Alpha
	 */
	#renderCenterOfMass(C, a) {
		this.#context.save();

		this.#context.fillStyle = Renderer.#CENTER_OF_MASS_COLOR.withAlpha(a).toString();
		this.#context.strokeStyle = Renderer.#CENTER_OF_MASS_COLOR.withAlpha(a).toString();

		this.#context.beginPath();
		this.#context.arc(C.x, C.y, Renderer.#CENTER_OF_MASS_RADIUS, 0, pi * 2);
		this.#context.stroke();
		this.#context.clip();

		this.#context.beginPath();
		this.#context.rect(C.x, C.y, -1, 1);
		this.#context.rect(C.x, C.y, 1, -1);
		this.#context.fill();
		this.#context.stroke();

		this.#context.restore();
	}

	/**
	 * @param {import("./math/index.js").Vector2} P
	 * @param {Number} [radius]
	 */
	#renderPoint(P, radius = 0.1) {
		this.#context.beginPath();
		this.#context.arc(P.x, P.y, radius, 0, pi * 2);
		this.#context.fill();
	}

	#renderDebugTooltip() {
		this.#setProjection(Matrix3.identity());

		const textLines = [
			`Position: (${this.#mouse.x.toFixed(3)}, ${this.#mouse.y.toFixed(3)})`,
			`Hovering object: ${this.hoveredObjectIndex}`,
			`Dragging object: ${this.draggedObjectIndex}`,
		];
		const fontSize = 12;

		this.#context.font = `${fontSize}px Consolas, monospace`;
		this.#context.fillStyle = Renderer.#DEBUG_TOOLTIP_TEXT_COLOR;

		for (let i = 0; i < textLines.length; i++) {
			this.#context.fillText(textLines[i], Renderer.#DEBUG_TOOLTIP_MARGIN.x, Renderer.#DEBUG_TOOLTIP_MARGIN.y + fontSize / 3 * 2 + i * fontSize);
		}
	}
}