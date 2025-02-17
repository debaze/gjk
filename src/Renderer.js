import {Matrix3, pi, transpose, Vector2} from "./math/index.js";

export class Renderer {
	static #INTERSECTION_EDGE_COLOR = "#ff746c";
	static #INTERSECTION_BACKGROUND_COLOR = "#ff746c45";
	static #SIMPLEX_FILL_COLOR = "#ff980020";
	static #SIMPLEX_STROKE_COLOR = "#ff980050";
	static #COLLISION_COLOR = "#670066";

	// Background
	static #BACKGROUND_COLOR = "#111";

	// Grid
	static #GRID_COLUMN_GAP = 1;
	static #GRID_ROW_GAP = 1;
	static #GRID_COLOR = "#222222";

	// Axes
	static #AXIS_COLOR = "#333333";

	// Geometry
	static #CENTER_OF_MASS_STROKE_COLOR = "#000000";

	// Hovering
	static #HOVER_FILL_COLOR = "#273ea520";
	static #HOVER_STROKE_COLOR = "#273ea550";

	// Debug
	static #DEBUG_TOOLTIP_MARGIN = new Vector2(8, 8);
	static #DEBUG_TOOLTIP_SIZE = new Vector2(120, 30);
	static #DEBUG_TOOLTIP_BACKGROUND_COLOR = "#000000a0";

	#canvas;

	/**
	 * @type {?CanvasRenderingContext2D}
	 */
	#context = null;

	/**
	 * @type {?import("./Application.js").View}
	 */
	#view = null;

	#transform = Matrix3.identity();

	#debugTooltipSize = new Vector2(Renderer.#DEBUG_TOOLTIP_SIZE);

	/**
	 * @type {?import("./index.js").Scene}
	 */
	#scene = null;

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
			this.#renderCenterOfMass(object);
		}

		if (this.#scene.getGJKResponse() !== null) {
			this.#renderGJKResponse(this.#scene.getGJKResponse());
		}

		this.#renderDebug();
	}

	#clear() {
		const w = this.#view.viewport.x;
		const h = this.#view.viewport.y;

		this.#context.fillStyle = Renderer.#BACKGROUND_COLOR;
		this.#context.fillRect(-w * 0.5, -h * 0.5, w, h);
	}

	/**
	 * @param {import("./index.js").Object} object
	 * @param {Number} index
	 */
	#renderObject(object, index) {
		const geometry = object.geometry;
		const vertices = geometry.vertices;

		this.#context.save();
		this.#context.beginPath();

		for (let i = 0; i < vertices.length; i++) {
			const v = new Vector2(vertices[i]).multiplyMatrix(object.transform);

			this.#context.lineTo(v.x, v.y);
		}

		this.#context.closePath();

		/**
		 * @todo Move into Application
		 */
		/* const mouse = new Vector2(this.#view.mouse).multiplyMatrix(this.#view.projection);
		const isHovering = this.#context.isPointInPath(mouse.x, mouse.y);

		if (isHovering) {
			this.#hoveredObjectIndex = index;

			this.#context.fillStyle = Renderer.#HOVER_FILL_COLOR;
			this.#context.strokeStyle = Renderer.#HOVER_STROKE_COLOR;
		}
		else {
			if (this.#hoveredObjectIndex === index) {
				this.#hoveredObjectIndex = null;
			}

			this.#context.fillStyle = object.material.getFillColor();
			this.#context.strokeStyle = object.material.getStrokeColor();
		} */

		this.#context.fillStyle = object.material.getFillColor();
		this.#context.strokeStyle = object.material.getStrokeColor();

		this.#context.fill();
		this.#context.stroke();

		this.#context.restore();

		this.#renderCenterOfMass(object);
	}

	/**
	 * @param {import("../public/GJK.js").GJKResponse} response
	 */
	#renderGJKResponse(response) {
		this.#context.save();

		// Draw simplex on the shapes.
		if (response.simplex) {
			const simplex = response.simplex;

			this.#context.fillStyle = Renderer.#SIMPLEX_FILL_COLOR;
			this.#context.strokeStyle = Renderer.#SIMPLEX_STROKE_COLOR;

			{
				this.#context.save();

				const P0 = response.object1.geometry.vertices[simplex[0].index1];

				this.#setTransform(response.object1.transform);

				this.#context.beginPath();
				this.#context.moveTo(P0.x, P0.y);

				for (let i = 1; i < simplex.length; i++) {
					const P = response.object1.geometry.vertices[simplex[i].index1];

					this.#context.lineTo(P.x, P.y);
				}

				this.#context.lineTo(P0.x, P0.y);
				this.#context.stroke();
				this.#context.fill();
				this.#context.restore();
			}

			{
				this.#context.save();

				const P0 = response.object2.geometry.vertices[simplex[0].index2];

				this.#setTransform(response.object2.transform);

				this.#context.beginPath();
				this.#context.moveTo(P0.x, P0.y);

				for (let i = 1; i < simplex.length; i++) {
					const P = response.object2.geometry.vertices[simplex[i].index2];
	
					this.#context.lineTo(P.x, P.y);
				}

				this.#context.lineTo(P0.x, P0.y);
				this.#context.fill();
				this.#context.stroke();
				this.#context.restore();
			}
		}

		// Draw closest point on shape 1.
		if (response.closest1) {
			this.#renderPoint(response.closest1);
		}

		// Draw closest point on shape 2.
		if (response.closest2) {
			this.#renderPoint(response.closest2);
		}

		if (response.closest1 && response.closest2) {
			const p1 = response.closest1;
			const p2 = response.closest2;

			this.#context.strokeStyle = Renderer.#HOVER_STROKE_COLOR;
			this.#context.beginPath();
			this.#context.moveTo(p1.x, p1.y);
			this.#context.lineTo(p2.x, p2.y);
			this.#context.stroke();
		}
	}

	/**
	 * @param {import("./math/index.js").Vector2} p
	 */
	#renderPoint(p) {
		this.#context.fillStyle = Renderer.#HOVER_FILL_COLOR;
		this.#context.strokeStyle = Renderer.#HOVER_STROKE_COLOR;
		this.#context.beginPath();
		this.#context.arc(p.x, p.y, 0.1, 0, pi * 2);
		this.#context.fill();
		this.#context.stroke();
	}

	#renderDebug() {
		this.#renderDebugTooltip();
	}

	#renderDebugTooltip() {
		this.#context.fillStyle = Renderer.#DEBUG_TOOLTIP_BACKGROUND_COLOR;

		const tooltipX = (this.#view.mouse.x); // + Renderer.#DEBUG_TOOLTIP_MARGIN.x) / this.#zoomLevel;
		const tooltipY = (this.#view.mouse.y); // - Renderer.#DEBUG_TOOLTIP_MARGIN.y) / this.#zoomLevel;

		const flipX = Number(tooltipX + this.#debugTooltipSize.x <= this.#view.viewport.x * 0.5) * 2 - 1;
		const flipY = Number(tooltipY - this.#debugTooltipSize.y <= -this.#view.viewport.y * 0.5) * 2 - 1;

		this.#context.fillRect(tooltipX, tooltipY, this.#debugTooltipSize.x * flipX / this.#view.zoomLevel, this.#debugTooltipSize.y * flipY / this.#view.zoomLevel);

		this.#context.save();
		this.#context.font = "0.25px Arial";
		this.#context.fillStyle = "#fff";
		this.#context.scale(1, -1);
		this.#context.fillText(`${this.#view.mouse}`, tooltipX, -tooltipY + 0.35);
		this.#context.restore();
	}

	/**
	 * @param {import("./Application.js").View} view
	 */
	setView(view) {
		this.#view = view;

		this.#canvas.width = this.#view.viewport.x;
		this.#canvas.height = this.#view.viewport.y;

		const P = transpose(this.#view.projection);

		this.#context.setTransform({
			a: P[0],
			b: P[3],
			c: P[1],
			d: P[4],
			e: P[2],
			f: P[5],
		});

		this.#context.lineWidth = 1 / this.#view.zoomLevel;
	}

	/// Stable utilities ///

	/**
	 * @param {import("./math/index.js").Matrix3} T
	 */
	#setTransform(T) {
		this.#transform.set(T);

		const TP = transpose(new Matrix3(this.#view.projection).multiply(this.#transform));

		this.#context.setTransform({
			a: TP[0],
			b: TP[3],
			c: TP[1],
			d: TP[4],
			e: TP[2],
			f: TP[5],
		});
	}

	#renderGrid() {
		const w = this.#view.viewport.x;
		const h = this.#view.viewport.y;

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
		const w = this.#view.viewport.x;
		const h = this.#view.viewport.y;

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
	 * @param {import("./index.js").Object} object
	 */
	#renderCenterOfMass(object) {
		const C = object.geometry.centerOfMass;

		this.#context.save();

		this.#context.fillStyle = Renderer.#CENTER_OF_MASS_STROKE_COLOR;
		this.#context.strokeStyle = Renderer.#CENTER_OF_MASS_STROKE_COLOR;

		this.#setTransform(object.transform);

		this.#context.beginPath();
		this.#context.arc(C.x, C.y, 0.2, 0, pi * 2);
		this.#context.stroke();
		this.#context.clip();

		this.#context.beginPath();
		this.#context.rect(C.x, C.y, -1, 1);
		this.#context.rect(C.x, C.y, 1, -1);
		this.#context.fill();
		this.#context.stroke();

		this.#context.restore();
	}
}