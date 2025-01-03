import {Integrator, Renderer} from "./index.js";
import {clamp, inverse, Matrix3, Vector2, Vector3} from "./math/index.js";

/**
 * @typedef {Object} View
 * @property {import("./math/index.js").Vector2} viewport
 * @property {Number} zoomLevel
 * @property {import("./math/index.js").Matrix3} projection
 * @property {import("./math/index.js").Matrix3} projectionInverse
 * @property {import("./math/index.js").Vector2} mouse
 */

export class Application {
	// Zoom
	static MIN_ZOOM_LEVEL = 1;
	static MAX_ZOOM_LEVEL = 64;

	#integrator = new Integrator();

	#renderer = new Renderer();

	#viewport = new Vector2(0, 0);

	#zoomLevel = Application.MAX_ZOOM_LEVEL;

	#projection = Matrix3.identity();

	#projectionInverse = Matrix3.identity();

	#needsProjectionUpdate = true;

	/**
	 * @type {?import("./index.js").Scene}
	 */
	#scene = null;

	#resizeObserver = new ResizeObserver(this.#onResize.bind(this));

	#timeSinceLastFrame = 0;

	/**
	 * @type {?Number}
	 */
	#animationFrameRequestId = null;

	/**
	 * @type {?Number}
	 */
	#hoveredObjectIndex = null;

	/**
	 * @type {?Number}
	 */
	#draggedObjectIndex = null;

	#mouse = new Vector2(0, 0);

	#dragPosition = new Vector2(0, 0);

	async initialize() {
		const canvas = this.#renderer.getCanvas();

		try {
			this.#resizeObserver.observe(canvas, {
				box: "device-pixel-content-box",
			});
		} catch {
			this.#resizeObserver.observe(canvas, {
				box: "content-box",
			});
		}

		canvas.addEventListener("mousedown", this.#onMouseDown.bind(this));
		canvas.addEventListener("mousemove", this.#onMouseMove.bind(this));
		canvas.addEventListener("mouseup", this.#onMouseUp.bind(this));
		canvas.addEventListener("wheel", this.#onWheel.bind(this), {
			passive: true,
		});
	}

	getRenderer() {
		return this.#renderer;
	}

	getScene() {
		return this.#scene;
	}

	/**
	 * @param {import("./index.js").Scene} scene
	 */
	setScene(scene) {
		this.#scene = scene;

		this.#renderer.setScene(scene);
	}

	startLoop() {
		if (this.#scene === null) {
			throw new Error("A scene must be provided before starting the loop.");
		}

		this.#timeSinceLastFrame = performance.now();

		this.#loop();
	}

	stopLoop() {
		window.cancelAnimationFrame(this.#animationFrameRequestId);

		this.#animationFrameRequestId = null;
	}

	#loop() {
		this.#animationFrameRequestId = requestAnimationFrame(this.#loop.bind(this));

		const time = performance.now();

		this.#timeSinceLastFrame = time;

		try {
			if (this.#needsProjectionUpdate) {
				this.#updateProjection();
			}

			this.#updateView();

			this.#update();
			this.#render();
		}
		catch (error) {
			console.error(error);

			this.stopLoop();
		}
	}

	#update() {
		this.#integrator.update(this.#scene);
	}

	#render() {
		this.#renderer.render();
	}

	/**
	 * @param {MouseEvent} event
	 */
	#onMouseDown(event) {
		const client = new Vector2(event.clientX, event.clientY);

		if (this.#hoveredObjectIndex === null) {
			return;
		}

		this.#draggedObjectIndex = this.#hoveredObjectIndex;

		this.#dragPosition.set(client);
		this.#dragPosition.multiplyMatrix(this.#projectionInverse);

		// this.#integrator.onMouseDown(client);
	}

	/**
	 * @param {MouseEvent} event
	 */
	#onMouseMove(event) {
		const client = new Vector2(event.clientX, event.clientY);

		this.#mouse.set(client);
		this.#mouse.multiplyMatrix(this.#projectionInverse);

		if (this.#draggedObjectIndex !== null) {
			const object = this.#scene.getObjects()[this.#draggedObjectIndex];
			const drag = new Vector2(this.#mouse).subtract(this.#dragPosition);

			object.position.add(new Vector3(drag.x, drag.y, 0));
			object.updateTransform();

			this.#dragPosition.set(this.#mouse);
		}
	}

	/**
	 * @param {MouseEvent} event
	 */
	#onMouseUp(event) {
		this.#dragPosition.reset();
		this.#draggedObjectIndex = null;
	}

	/**
	 * @type {ResizeObserverCallback}
	 */
	#onResize(entries) {
		const canvasEntry = entries[0];
		const devicePixelRatio = window.devicePixelRatio;
		const viewport = new Vector2(
			canvasEntry.devicePixelContentBoxSize?.[0].inlineSize ?? canvasEntry.contentBoxSize[0].inlineSize,
			canvasEntry.devicePixelContentBoxSize?.[0].blockSize ?? canvasEntry.contentBoxSize[0].blockSize,
		).multiplyScalar(devicePixelRatio);

		viewport.x |= 0;
		viewport.y |= 0;

		this.#viewport.set(viewport);

		this.#needsProjectionUpdate = true;
	}

	/**
	 * @param {WheelEvent} event
	 */
	#onWheel(event) {
		const direction = Math.sign(-event.deltaY);

		this.#zoomLevel = clamp(this.#zoomLevel + direction, Application.MIN_ZOOM_LEVEL, Application.MAX_ZOOM_LEVEL);

		this.#needsProjectionUpdate = true;
	}

	#updateProjection() {
		const translationBias = new Vector2(1 - this.#viewport.x % 2, 1 - this.#viewport.y % 2);

		this.#projection.set(Matrix3.identity());
		this.#projection.multiply(Matrix3.translation(new Vector2(this.#viewport).add(translationBias).multiplyScalar(0.5)));
		this.#projection.multiply(Matrix3.scale(new Vector2(1, -1).multiplyScalar(this.#zoomLevel)));

		this.#projectionInverse.set(inverse(this.#projection));

		this.#needsProjectionUpdate = false;
	}

	#updateView() {
		/**
		 * @type {View}
		 */
		const view = {};

		view.viewport = this.#viewport;
		view.zoomLevel = this.#zoomLevel;
		view.projection = this.#projection;
		view.projectionInverse = this.#projectionInverse;
		view.mouse = this.#mouse;

		this.#renderer.setView(view);
	}
}