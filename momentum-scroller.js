import {
  getDeviceHeuristics,
  getTransformProperties,
  isPrimaryInput,
  ScrollContainerTools,
  validateArgument,
} from "./utilities.js";

const deviceHeuristics = getDeviceHeuristics();
const momentumScrollerKey = Symbol("momentumScrollerKey");

class MomentumScroller {
  static #scrollerMap = new Map();

  static autoCreateScrollers({
    rootSelector = ":root",
    autoActivate = true,
    convertBodyToScroller = true,
  } = {}) {
    validateArgument("rootSelector", rootSelector, {
      allowedTypes: ["string"],
    });
    validateArgument("rootSelector", !!document.querySelector(rootSelector), {
      allowedValues: [true],
      customErrorMessage: "rootSelector does not exist",
    });
    validateArgument("convertBodyToScroller", convertBodyToScroller, {
      allowedTypes: ["boolean"],
    });

    const documentRoot = document.querySelector(":root");
    document
      .querySelectorAll(`${rootSelector}, ${rootSelector} *`)
      .forEach((element) => {
        const isAnElement = element instanceof Element;
        if (!isAnElement) return;

        const scrollerAlreadyExists = this.#scrollerMap.has(element);
        if (scrollerAlreadyExists) return;

        const { xAxisIsScrollable, yAxisIsScrollable } =
          ScrollContainerTools.getScrollableAxes(element);

        if (!xAxisIsScrollable && !yAxisIsScrollable) return;

        if (element !== documentRoot)
          return this.createScroller(element, autoActivate);

        if (!convertBodyToScroller) return;

        const root = document.querySelector(":root");
        root.style.setProperty("overflow", "hidden");
        const body = document.querySelector("body");
        body.style.setProperty("overflow", "auto");
        body.style.setProperty("margin", "0");
        if (xAxisIsScrollable) body.style.setProperty("width", "100vw");
        if (yAxisIsScrollable) body.style.setProperty("height", "100vh");
        this.createScroller(body, autoActivate);
      });

    return this;
  }

  static createScroller(scrollContainer, autoActivate = true) {
    if (deviceHeuristics.isTouchScreen)
      throw new Error(
        "MomentumScroller instantiation blocked. Due to conflicts between native momentum scrolling systems and MomentumScroller.js, touch screen devices, such as this one, are not supported."
      );

    validateArgument("scrollContainer", scrollContainer, {
      allowedPrototypes: [Element],
    });
    validateArgument("autoActivate", autoActivate, {
      allowedTypes: ["boolean"],
    });

    if (this.#scrollerMap.has(scrollContainer))
      throw new Error(
        "A MomentumScroller instance for this scrollContainer already exists"
      );

    if (!this.#pointerDownRouterActivated) this.#activatePointerDownRouter();

    const scroller = new this(scrollContainer, momentumScrollerKey);

    if (autoActivate) scroller.activate();

    this.#scrollerMap.set(scrollContainer, scroller);

    return scroller;
  }

  static getScroller(scrollContainer) {
    return this.#scrollerMap.get(scrollContainer);
  }

  static getAllScrollers() {
    return Array.from(this.#scrollerMap.values());
  }

  static #pointerDownRouterActivated = false;

  static #activatePointerDownRouter() {
    document.addEventListener("pointerdown", (event) =>
      this.#pointerDownRouter(event)
    );
    this.#pointerDownRouterActivated = true;
  }

  static #selectorsOfElementsScrollerShouldIgnore = [
    "input[type=email]",
    "input[type=number]",
    "input[type=password]",
    "input[type=range]",
    "input[type=search]",
    "input[type=tel]",
    "input[type=text]",
    "input[type=url]",
    "textarea",
  ];

  static #selectorsOfClickableElements = [
    "a",
    "button",
    "details",
    "input[type=button]",
    "input[type=checkbox]",
    "input[type=color]",
    "input[type=date]",
    "input[type=datetime-local]",
    "input[type=file]",
    "input[type=image]",
    "input[type=month]",
    "input[type=radio]",
    "input[type=reset]",
    "input[type=submit]",
    "input[type=time]",
    "input[type=week]",
    "summary",
  ];

  static #selectorsOfOtherTouchScrollers = [];

  static verifySelectors(setterName, selectors) {
    validateArgument(setterName, selectors, {
      allowedTypes: ["array"],
    });

    selectors.forEach((selector) => {
      validateArgument(`${setterName} selectors`, selector, {
        allowedTypes: ["string"],
      });
      validateArgument(`${setterName} selectors`, selector.length, {
        allowedMin: 1,
        customErrorMessage: `${setterName} cannot be empty strings`,
      });
    });
  }

  static setSelectorsOfElementsScrollerShouldIgnore(
    selectors = [],
    keepCurrentSelectors = true
  ) {
    this.verifySelectors("selectorsOfElementsScrollerShouldIgnore", selectors);

    const currentSelector = this.#selectorsOfElementsScrollerShouldIgnore;

    selectors = keepCurrentSelectors
      ? [...new Set([...selectors, ...currentSelector])]
      : selectors;

    this.#selectorsOfElementsScrollerShouldIgnore = selectors;
    return this;
  }

  static setSelectorsOfClickableElements(
    selectors = [],
    keepCurrentSelectors = true
  ) {
    this.verifySelectors("selectorsOfClickableElements", selectors);

    const currentSelector = this.#selectorsOfClickableElements;

    selectors = keepCurrentSelectors
      ? [...new Set([...selectors, ...currentSelector])]
      : selectors;

    this.#selectorsOfClickableElements = selectors;
    return this;
  }

  static setSelectorsOfOtherTouchScrollers(
    selectors = [],
    keepCurrentSelectors = true
  ) {
    this.verifySelectors("selectorsOfOtherTouchScrollers", selectors);

    const currentSelector = this.#selectorsOfOtherTouchScrollers;

    selectors = keepCurrentSelectors
      ? [...new Set([...selectors, ...currentSelector])]
      : selectors;

    this.#selectorsOfOtherTouchScrollers = selectors;
    return this;
  }

  static async #pointerDownRouter(event) {
    const inputButtonIsPrimary = isPrimaryInput(event);
    if (!inputButtonIsPrimary) return;

    const targetOrAncestorIsOnIgnoreList =
      this.#selectorsOfElementsScrollerShouldIgnore.length &&
      this.#selectorsOfElementsScrollerShouldIgnore.some((selector) =>
        event.target.closest(selector)
      );
    if (targetOrAncestorIsOnIgnoreList) return;

    const eventTargets = event.composedPath();
    const topMomentumScrollerEventTarget = eventTargets.find(
      (eventTarget) =>
        eventTarget instanceof Element &&
        eventTarget.matches(".momentum-scroller")
    );

    if (!topMomentumScrollerEventTarget) return;

    const relevantEventTargetsAndProperties = eventTargets
      .map((eventTarget) => {
        const isAnElement = eventTarget instanceof Element;
        if (!isAnElement) return;

        const compileEventTargetProperties = (properties = {}) =>
          Object.assign({ eventTarget }, properties);
        const safeMatches = (selectors) =>
          selectors.length ? eventTarget.matches(selectors) : false;

        const isNonScroller = safeMatches(this.#selectorsOfClickableElements);
        if (isNonScroller)
          return compileEventTargetProperties({ isNonScroller });

        const isScrollerMomentum = eventTarget.matches(".momentum-scroller");
        if (isScrollerMomentum) {
          const { scrollableAxes } =
            this.getScroller(eventTarget).getScrollerData();
          return compileEventTargetProperties({
            isScrollerMomentum,
            scrollableAxes,
          });
        }

        const isScrollerNonMomentum = safeMatches(
          this.#selectorsOfOtherTouchScrollers
        );
        if (isScrollerNonMomentum) {
          const { xAxisIsScrollable, yAxisIsScrollable } =
            ScrollContainerTools.getScrollableAxes(eventTarget, {
              ignoreElementsWithOverflowHidden: false,
            });

          const scrollableAxes =
            xAxisIsScrollable && yAxisIsScrollable
              ? "horizontal-and-vertical"
              : xAxisIsScrollable && !yAxisIsScrollable
              ? "horizontal-only"
              : !xAxisIsScrollable && yAxisIsScrollable
              ? "vertical-only"
              : "none";

          if (scrollableAxes === "none")
            return compileEventTargetProperties({ isNonScroller: true });

          return compileEventTargetProperties({
            isScrollerNonMomentum,
            scrollableAxes,
          });
        }
      })
      .filter((eventTargetProperties) => eventTargetProperties);

    const moreThanOneRelevantEventTarget =
      relevantEventTargetsAndProperties.length > 1;

    const topEventTarget = eventTargets[0];

    const dispatchMomentumScrollerRouteEvent = (detail = {}) =>
      topEventTarget.dispatchEvent(
        new CustomEvent("momentumScrollerRoute", {
          bubbles: true,
          cancelable: true,
          detail: Object.assign(detail, { key: momentumScrollerKey }),
        })
      );

    if (!moreThanOneRelevantEventTarget)
      return dispatchMomentumScrollerRouteEvent({
        routedEvent: event,
        routeTarget: topMomentumScrollerEventTarget,
      });

    const thresholdTest = () =>
      new Promise((resolve) => {
        const pointerStartingPointX = event.screenX;
        const pointerStartingPointY = event.screenY;
        const thresholdTestAbortController = new AbortController();
        const abortAndResolve = (resolveData) => {
          thresholdTestAbortController.abort();
          resolve(resolveData);
        };
        document.addEventListener(
          "pointermove",
          (event) => {
            const getPointerCrossedThreshold = (
              originalPosition,
              newPosition,
              threshold = 10
            ) => Math.abs(originalPosition - newPosition) > threshold;

            const pointerCrossedHorizontalThreshold =
              getPointerCrossedThreshold(pointerStartingPointX, event.screenX);
            if (pointerCrossedHorizontalThreshold)
              return abortAndResolve({ event, thresholdCrossed: "horizontal" });

            const pointerCrossedVerticalThreshold = getPointerCrossedThreshold(
              pointerStartingPointY,
              event.screenY
            );
            if (pointerCrossedVerticalThreshold)
              return abortAndResolve({ event, thresholdCrossed: "vertical" });
          },
          { signal: thresholdTestAbortController.signal }
        );

        ["pointerup", "pointercancel", "keydown"].forEach((eventType) =>
          document.addEventListener(
            eventType,
            () => abortAndResolve({ thresholdCrossed: null }),
            { signal: thresholdTestAbortController.signal }
          )
        );
      });

    const findCompatibleScroller = ({
      scrollersToIgnore = [],
      allowNonMomentumScrollers = false,
      allowedScrollableAxes = [],
    }) =>
      relevantEventTargetsAndProperties.find(
        (relevantEventTargetProperties) =>
          !scrollersToIgnore.includes(
            relevantEventTargetProperties.eventTarget
          ) &&
          (relevantEventTargetProperties.isScrollerMomentum ||
            (relevantEventTargetProperties.isScrollerNonMomentum &&
              allowNonMomentumScrollers)) &&
          allowedScrollableAxes.includes(
            relevantEventTargetProperties.scrollableAxes
          )
      );

    const topRelevantEventTargetProperties =
      relevantEventTargetsAndProperties[0];

    dispatchMomentumScrollerRouteEvent({
      routedEvent: event,
      routeTarget: topRelevantEventTargetProperties.eventTarget,
    });

    if (
      topRelevantEventTargetProperties.isScrollerMomentum ||
      topRelevantEventTargetProperties.isScrollerNonMomentum
    ) {
      const topScrollerAlreadyUsesBothAxes =
        topRelevantEventTargetProperties.scrollableAxes ===
        "horizontal-and-vertical";
      if (topScrollerAlreadyUsesBothAxes) return;

      const scrollableAxesThatHaveMissingAxis =
        topRelevantEventTargetProperties.scrollableAxes === "horizontal-only"
          ? ["horizontal-and-vertical", "vertical-only"]
          : ["horizontal-and-vertical", "horizontal-only"];

      const nextCompatibleScroller = findCompatibleScroller({
        scrollersToIgnore: [topRelevantEventTargetProperties.eventTarget],
        allowNonMomentumScrollers:
          topRelevantEventTargetProperties.isScrollerMomentum ? true : false,
        allowedScrollableAxes: scrollableAxesThatHaveMissingAxis,
      });

      if (!nextCompatibleScroller) return;

      const thresholdTestResults = await thresholdTest();

      const noThresholdsWereCrossed = !thresholdTestResults.thresholdCrossed;
      const horizontalThresholdWasCrossedAndTopScrollerIsHorizontalOnly =
        thresholdTestResults.thresholdCrossed === "horizontal" &&
        topRelevantEventTargetProperties.scrollableAxes === "horizontal-only";
      const verticalThresholdWasCrossedAndTopScrollerIsVerticalOnly =
        thresholdTestResults.thresholdCrossed === "vertical" &&
        topRelevantEventTargetProperties.scrollableAxes === "vertical-only";

      if (
        noThresholdsWereCrossed ||
        horizontalThresholdWasCrossedAndTopScrollerIsHorizontalOnly ||
        verticalThresholdWasCrossedAndTopScrollerIsVerticalOnly
      )
        return;

      dispatchMomentumScrollerRouteEvent({
        routedEvent: thresholdTestResults.event,
        routeTarget: nextCompatibleScroller.eventTarget,
      });
    } else if (topRelevantEventTargetProperties.isNonScroller) {
      const scrollableAxesThatHaveMissingAxis = [
        "horizontal-and-vertical",
        "horizontal-only",
        "vertical-only",
      ];
      const firstCompatibleScroller = findCompatibleScroller({
        allowedScrollableAxes: scrollableAxesThatHaveMissingAxis,
      });

      const secondCompatibleScroller = findCompatibleScroller({
        scrollersToIgnore: [firstCompatibleScroller.eventTarget],
        allowedScrollableAxes: scrollableAxesThatHaveMissingAxis,
      });

      const thresholdTestResults = await thresholdTest();

      const noThresholdsWereCrossed = !thresholdTestResults.thresholdCrossed;
      if (noThresholdsWereCrossed) return;

      const routeToScroller = (routeTarget) =>
        dispatchMomentumScrollerRouteEvent({
          routedEvent: thresholdTestResults.event,
          routeTarget,
        });

      const scrollerIncludesCrossedThresholdAxis = (scrollableAxes) => {
        if (thresholdTestResults.thresholdCrossed === "horizontal") {
          return ["horizontal-only", "horizontal-and-vertical"].includes(
            scrollableAxes
          );
        } else if (thresholdTestResults.thresholdCrossed === "vertical") {
          return ["vertical-only", "horizontal-and-vertical"].includes(
            scrollableAxes
          );
        }
      };

      const firstCompatibleScrollerIncludesCrossedThresholdAxis =
        scrollerIncludesCrossedThresholdAxis(
          firstCompatibleScroller.scrollableAxes
        );

      if (firstCompatibleScrollerIncludesCrossedThresholdAxis)
        return routeToScroller(firstCompatibleScroller.eventTarget);

      if (!secondCompatibleScroller)
        return routeToScroller(firstCompatibleScroller.eventTarget);

      const secondCompatibleScrollerIncludesCrossedThresholdAxis =
        scrollerIncludesCrossedThresholdAxis(
          secondCompatibleScroller.scrollableAxes
        );
      if (secondCompatibleScrollerIncludesCrossedThresholdAxis)
        return routeToScroller(secondCompatibleScroller.eventTarget);

      return routeToScroller(firstCompatibleScroller.eventTarget);
    }
  }

  #scrollContainer;
  #decelerationLevel = "medium";
  #borderBouncinessLevel = "medium";
  #grabCursor = "grab";
  #grabbingCursor = "grabbing";
  #allowHorizontalScrolling = true;
  #allowVerticalScrolling = true;
  #decelerationLevelToQuantityMap = new Map([
    ["none", 0],
    ["minimum", 0.00004],
    ["low", 0.0002],
    ["medium", 0.001],
    ["high", 0.005],
    ["maximum", 0.025],
  ]);
  #borderBouncinessLevelToQuantityMap = new Map([
    ["none", Infinity],
    ["minimum", 0.02],
    ["low", 0.01],
    ["medium", 0.005],
    ["high", 0.00375],
    ["maximum", 0.0025],
  ]);

  constructor(scrollContainer, key) {
    validateArgument("key", key, {
      allowedValues: [momentumScrollerKey],
      customErrorMessage:
        "Please use the MomentumScroller.autoCreateScrollers static method or the MomentumScroller.createScroller static method to create scrollers",
    });

    this.#scrollContainer = scrollContainer;

    this.#scrollContainer.classList.add("momentum-scroller");

    this.#scrollContainer.addEventListener("momentumScrollerRoute", (event) => {
      const key = event.detail.key;
      validateArgument("key", key, {
        allowedValues: [momentumScrollerKey],
        customErrorMessage:
          "This momentumScrollerRoute event is invalid because it was not dispatched by the MomentumScroller module",
      });
      const { routedEvent, routeTarget } = event.detail;
      if (this.#scrollContainer === routeTarget)
        this.#pointerDownHandler(routedEvent);
    });

    this.#scrollContainer.addEventListener("smoothScrollerScrollStart", () => {
      if (this.#scrollResolve)
        this.#stopScroll({
          interruptedBy: "Smooth scroll on same container",
        });
    });

    this.#scrollContainer.querySelectorAll("*").forEach((element) =>
      element.addEventListener("dragstart", (event) => {
        if (this.#active) event.preventDefault();
      })
    );
  }

  getScrollerData() {
    return {
      active: this.#active,
      scrollContainer: this.#scrollContainer,
      scrollableAxes: this.#getUpdatedScrollableAxes(),
      scrolling: this.#scrolling,
    };
  }

  setDecelerationLevel(decelerationLevel = "medium") {
    validateArgument("decelerationLevel", decelerationLevel, {
      allowedValues: Array.from(this.#decelerationLevelToQuantityMap.keys()),
    });

    this.#decelerationLevel = decelerationLevel;
    return this;
  }

  setBorderBouncinessLevel(borderBouncinessLevel = "medium") {
    validateArgument("borderBouncinessLevel", borderBouncinessLevel, {
      allowedValues: Array.from(
        this.#borderBouncinessLevelToQuantityMap.keys()
      ),
    });

    this.#borderBouncinessLevel = borderBouncinessLevel;
    return this;
  }

  setGrabCursor(grabCursor = "grab") {
    validateArgument("grabCursor", grabCursor, {
      allowedTypes: ["string"],
      customErrorMessage:
        "grabCursor must be a String and should be appropriate for the CSS Cursor property (https://developer.mozilla.org/en-US/docs/Web/CSS/cursor)",
    });

    if (!this.#pointerIsDown && this.#active)
      this.#scrollContainer.style.setProperty("cursor", grabCursor);

    this.#grabCursor = grabCursor;
    return this;
  }

  setGrabbingCursor(grabbingCursor = "grabbing") {
    validateArgument("grabbingCursor", grabbingCursor, {
      allowedTypes: ["string"],
      customErrorMessage:
        "grabbingCursor must be a String and should be appropriate for the CSS Cursor property (https://developer.mozilla.org/en-US/docs/Web/CSS/cursor)",
    });

    if (this.#pointerIsDown && this.#active)
      this.#scrollContainer.style.setProperty("cursor", grabbingCursor);

    this.#grabbingCursor = grabbingCursor;
    return this;
  }

  setAllowHorizontalScrolling(allowHorizontalScrolling = true) {
    validateArgument("allowHorizontalScrolling", allowHorizontalScrolling, {
      allowedTypes: ["boolean"],
    });

    this.#allowHorizontalScrolling = allowHorizontalScrolling;
    return this;
  }

  setAllowVerticalScrolling(allowVerticalScrolling = true) {
    validateArgument("allowVerticalScrolling", allowVerticalScrolling, {
      allowedTypes: ["boolean"],
    });

    this.#allowVerticalScrolling = allowVerticalScrolling;
    return this;
  }

  #active = false;

  activate() {
    if (this.#active) return;

    this.#scrollContainer.dispatchEvent(
      new CustomEvent("momentumScrollerActivate", {
        bubbles: true,
        cancelable: true,
        detail: this.#getEventData(),
      })
    );

    this.#scrollContainer.style.setProperty("cursor", this.#grabCursor);
    this.#scrollContainer.style.setProperty("-webkit-user-select", "none");
    this.#scrollContainer.style.setProperty("user-select", "none");

    this.#active = true;

    return this;
  }

  deactivate() {
    if (!this.#active) return;

    this.#scrollContainer.dispatchEvent(
      new CustomEvent("momentumScrollerDeactivate", {
        bubbles: true,
        cancelable: true,
        detail: this.#getEventData(),
      })
    );

    if (this.#scrollResolve)
      this.#stopScroll({
        interruptedBy: "Momentum scroller deactivation",
      });

    this.#undoPointerDownChanges();

    this.#scrollContainer.style.removeProperty("cursor");
    this.#scrollContainer.style.removeProperty("-webkit-user-select");
    this.#scrollContainer.style.removeProperty("user-select");

    this.#active = false;

    return this;
  }

  toggleActivation() {
    if (this.#active) {
      return this.deactivate();
    } else if (!this.#active) {
      return this.activate();
    }
  }

  #xAxisIsScrollable;
  #yAxisIsScrollable;
  #scrollableAxes;
  #pointerMoveUpCancelAbortController = new AbortController();
  #pointerMoveLog = [];
  #pointerId;
  #pointerIsDown;
  #xAlreadyBounced;
  #yAlreadyBounced;

  #getUpdatedScrollableAxes() {
    const { xAxisIsScrollable, yAxisIsScrollable } =
      ScrollContainerTools.getScrollableAxes(this.#scrollContainer);

    this.#xAxisIsScrollable =
      this.#allowHorizontalScrolling && xAxisIsScrollable;
    this.#yAxisIsScrollable = this.#allowVerticalScrolling && yAxisIsScrollable;

    this.#scrollableAxes =
      this.#xAxisIsScrollable && this.#yAxisIsScrollable
        ? "horizontal-and-vertical"
        : this.#xAxisIsScrollable && !this.#yAxisIsScrollable
        ? "horizontal-only"
        : !this.#xAxisIsScrollable && this.#yAxisIsScrollable
        ? "vertical-only"
        : "none";

    return this.#scrollableAxes;
  }

  #pointerDownHandler(event) {
    if (!this.#active) return;

    this.#pointerIsDown = true;
    this.#pointerId = event.pointerId;
    this.#scrollContainer.setPointerCapture(event.pointerId);

    this.#scrollContainer.dispatchEvent(
      new CustomEvent("momentumScrollerPointerDown", {
        bubbles: true,
        cancelable: true,
        detail: this.#getEventData(),
      })
    );

    if (this.#scrollResolve)
      this.#stopScroll({
        interruptedBy: "Pointer down on scroll container",
      });

    if (this.#bounceResolve)
      this.#stopBounce({
        interruptedBy: "Pointer down on scroll container",
      });

    this.#scrollContainer.style.setProperty("cursor", this.#grabbingCursor);

    let movementX = 0;
    let previousScreenX = event.screenX; // Safari returns undefined for event.movementX
    let movementY = 0;
    let previousScreenY = event.screenY; // Safari returns undefined for event.movementY
    let currentTranslateX;
    let currentTranslateY;
    let bounciness;
    if (this.#borderBouncinessLevel !== "none") {
      this.#xAlreadyBounced = false;
      this.#yAlreadyBounced = false;

      const currentTransformProperties = getTransformProperties(
        this.#scrollContainer
      );

      this.#scrollContainer.style.setProperty(
        "transform",
        `translateX(${currentTransformProperties.translateX}px) translateY(${currentTransformProperties.translateY}px)`
      );

      currentTranslateX = currentTransformProperties
        ? currentTransformProperties.translateX
        : 0;
      currentTranslateY = currentTransformProperties
        ? currentTransformProperties.translateY
        : 0;

      bounciness = this.#borderBouncinessLevelToQuantityMap.get(
        this.#borderBouncinessLevel
      );
    }

    this.#pointerMoveUpCancelAbortController = new AbortController();

    this.#scrollContainer.addEventListener(
      "momentumScrollerRoute",
      (event) => {
        const key = event.detail.key;
        validateArgument("key", key, {
          allowedValues: [momentumScrollerKey],
          customErrorMessage:
            "This momentumScrollerRoute event is invalid because it was not dispatched by the MomentumScroller module",
        });
        const { routeTarget } = event.detail;
        if (this.#scrollContainer !== routeTarget)
          this.#undoPointerDownChanges();
      },
      { signal: this.#pointerMoveUpCancelAbortController.signal }
    );

    ["contextmenu", "keydown"].forEach((eventType) =>
      document.addEventListener(
        eventType,
        () => this.#undoPointerDownChanges(),
        { signal: this.#pointerMoveUpCancelAbortController.signal }
      )
    );

    ["pointerup", "pointercancel"].forEach((eventType) =>
      this.#scrollContainer.addEventListener(
        eventType,
        (event) => this.#pointerUpHandler(event),
        { signal: this.#pointerMoveUpCancelAbortController.signal }
      )
    );

    this.#scrollContainer.addEventListener(
      "pointermove",
      (event) => {
        if (this.#xAxisIsScrollable) {
          movementX = event.screenX - previousScreenX;
          previousScreenX = event.screenX;
        }

        if (this.#yAxisIsScrollable) {
          movementY = event.screenY - previousScreenY;
          previousScreenY = event.screenY;
        }

        const updateScrollLeft = () =>
          (this.#scrollContainer.scrollLeft -= movementX);
        const updateScrollTop = () =>
          (this.#scrollContainer.scrollTop -= movementY);
        const resetTranslateX = () => (currentTranslateX = 0);
        const resetTranslateY = () => (currentTranslateY = 0);

        if (this.#borderBouncinessLevel !== "none") {
          const { atLeftEdge, atRightEdge, atTopEdge, atBottomEdge } =
            ScrollContainerTools.getEdgeStatus(this.#scrollContainer);

          const tryingToScrollBeyondHorizontalEdge =
            (atLeftEdge && currentTranslateX + movementX > 0) ||
            (atRightEdge && currentTranslateX + movementX < 0);
          const tryingToScrollBeyondVerticalEdge =
            (atBottomEdge && currentTranslateY + movementY < 0) ||
            (atTopEdge && currentTranslateY + movementY > 0);

          const getCurrentTranslate = (currentTranslate, movement) =>
            currentTranslate +
            movement *
              (1 /
                (bounciness *
                  Math.abs(Math.pow(currentTranslate + movement, 2)) +
                  1));
          const updateCurrentTranslateX = () =>
            (currentTranslateX = getCurrentTranslate(
              currentTranslateX,
              movementX
            ));
          const updateCurrentTranslateY = () =>
            (currentTranslateY = getCurrentTranslate(
              currentTranslateY,
              movementY
            ));

          if (tryingToScrollBeyondHorizontalEdge) {
            updateCurrentTranslateX();
          } else if (!tryingToScrollBeyondHorizontalEdge) {
            resetTranslateX();
            updateScrollLeft();
          }

          if (tryingToScrollBeyondVerticalEdge) {
            updateCurrentTranslateY();
          } else if (!tryingToScrollBeyondVerticalEdge) {
            resetTranslateY();
            updateScrollTop();
          }

          this.#scrollContainer.style.setProperty(
            "transform",
            `translateX(${currentTranslateX}px) translateY(${currentTranslateY}px)`
          );
        } else if (!this.#borderBouncinessLevel !== "none") {
          resetTranslateX();
          resetTranslateY();
          updateScrollLeft();
          updateScrollTop();
        }

        this.#pointerMoveLog.push([
          event.screenX,
          event.screenY,
          event.timeStamp,
        ]);
      },
      { signal: this.#pointerMoveUpCancelAbortController.signal }
    );
  }

  #undoPointerDownChanges() {
    this.#scrollContainer.dispatchEvent(
      new CustomEvent("momentumScrollerPointerUp", {
        bubbles: true,
        cancelable: true,
        detail: this.#getEventData(),
      })
    );

    this.#pointerMoveUpCancelAbortController.abort();

    if (this.#pointerId)
      this.#scrollContainer.releasePointerCapture(this.#pointerId);

    this.#pointerIsDown = false;
    this.#pointerId = null;

    this.#scrollContainer.style.setProperty("cursor", this.#grabCursor);

    const currentTransformProperties = getTransformProperties(
      this.#scrollContainer
    );

    const onBorder =
      currentTransformProperties.translateX ||
      currentTransformProperties.translateY;

    if (onBorder) this.#bounce();
  }

  #pointerUpHandler(event) {
    this.#undoPointerDownChanges();

    const endTime = event.timeStamp;

    const getVelocity = (axis, endPosition) => {
      const meetsMomentumScrollCriteria =
        this.#pointerMoveLog.length > 0 &&
        endTime - this.#pointerMoveLog[this.#pointerMoveLog.length - 1][2] <
          100;

      if (!meetsMomentumScrollCriteria) return 0;

      const axisIndex = axis === "x" ? 0 : 1;

      for (let i = 1; i < 5; i++) {
        if (this.#pointerMoveLog.length < i) return 0;

        const startPosition =
          this.#pointerMoveLog[this.#pointerMoveLog.length - i][axisIndex];
        const startTime =
          this.#pointerMoveLog[this.#pointerMoveLog.length - i][2];

        const positionChange = endPosition - startPosition;
        const timeChange = endTime - startTime;

        if (positionChange && timeChange) {
          const velocity = positionChange / timeChange;

          const { atLeftEdge, atRightEdge, atTopEdge, atBottomEdge } =
            ScrollContainerTools.getEdgeStatus(this.#scrollContainer);

          if (axis === "x") {
            const tryingToScrollBeyondHorizontalEdge =
              (atLeftEdge && velocity > 0) || (atRightEdge && velocity < 0);
            if (tryingToScrollBeyondHorizontalEdge) return 0;
          } else if (axis === "y") {
            const tryingToScrollBeyondVerticalEdge =
              (atTopEdge && velocity > 0) || (atBottomEdge && velocity < 0);
            if (tryingToScrollBeyondVerticalEdge) return 0;
          }

          return velocity;
        }
      }

      return 0;
    };

    let endPositionX;
    let scrollInitialVelocityX = 0;
    if (this.#xAxisIsScrollable) {
      endPositionX = event.screenX;
      scrollInitialVelocityX = getVelocity("x", endPositionX);
    }

    let endPositionY;
    let scrollInitialVelocityY = 0;
    if (this.#yAxisIsScrollable) {
      endPositionY = event.screenY;
      scrollInitialVelocityY = getVelocity("y", endPositionY);
    }

    this.scroll({
      scrollInitialVelocityX,
      scrollInitialVelocityY,
    });

    this.#pointerMoveLog = [];
  }

  #scrolling = false;
  get scrolling() {
    return this.#scrolling;
  }
  #previousScrollDirectionX;
  #previousScrollDirectionY;
  #previousScrollDuration;
  #previousScrollStartTimestamp;
  #previousScrollStopTimestamp;
  #scrollCurrentVelocityX;
  #scrollCurrentVelocityY;
  #scrollDeceleration;
  #scrollDuration;
  #scrollElapsedTime;
  #scrollInitialVelocityX;
  #scrollInitialVelocityXMultiplier;
  #scrollInitialVelocityY;
  #scrollInitialVelocityYMultiplier;
  #scrollRafId;
  #scrollResolve;
  #scrollStartingPointX;
  #scrollStartingPointY;
  #scrollStartTime;
  #scrollVelocityHypotenuse;

  scroll({
    scrollInitialVelocityX = 0,
    scrollInitialVelocityY = 0,
    currentTime = NaN,
  }) {
    const { atLeftEdge, atRightEdge, atTopEdge, atBottomEdge } =
      ScrollContainerTools.getEdgeStatus(this.#scrollContainer);

    const isNewScroll = Number.isNaN(currentTime);
    if (isNewScroll) {
      validateArgument("scrollInitialVelocityX", scrollInitialVelocityX, {
        allowedTypes: ["number"],
        allowFiniteNumbersOnly: true,
      });
      validateArgument("scrollInitialVelocityY", scrollInitialVelocityY, {
        allowedTypes: ["number"],
        allowFiniteNumbersOnly: true,
      });

      if (this.#scrollResolve)
        this.#stopScroll({ interruptedBy: "New momentum scroll" });

      const scrollStartTimestamp = Date.now();
      const timeSincePreviousScrollStart =
        scrollStartTimestamp - this.#previousScrollStartTimestamp;
      const halfOfPreviousScrollDuration = 0.5 * this.#previousScrollDuration;
      const timeSincePreviousScrollStop =
        scrollStartTimestamp - this.#previousScrollStopTimestamp;
      const scrollMeetsMultiplierTimingCriteria =
        timeSincePreviousScrollStart < halfOfPreviousScrollDuration &&
        timeSincePreviousScrollStop < 500;

      const getInitialVelocityMultiplier = (
        scrollDirection,
        previousScrollDirection,
        edge1,
        edge2,
        initialVelocityMultiplier
      ) => {
        if (scrollDirection === 0) return 1;

        const scrollDirectionXMatchesPreviousScrollDirectionX =
          scrollDirection === previousScrollDirection;
        const scrollMeetsMultiplierPositionCriteria = !edge1 && !edge2;
        const allMultiplierCriteriaMet =
          scrollMeetsMultiplierPositionCriteria &&
          scrollDirectionXMatchesPreviousScrollDirectionX &&
          scrollMeetsMultiplierTimingCriteria;

        return allMultiplierCriteriaMet ? initialVelocityMultiplier + 1 : 1;
      };

      const scrollDirectionX = Math.sign(scrollInitialVelocityX);
      this.#scrollInitialVelocityXMultiplier = getInitialVelocityMultiplier(
        scrollDirectionX,
        this.#previousScrollDirectionX,
        atLeftEdge,
        atRightEdge,
        this.#scrollInitialVelocityXMultiplier
      );

      const scrollDirectionY = Math.sign(scrollInitialVelocityY);
      this.#scrollInitialVelocityYMultiplier = getInitialVelocityMultiplier(
        scrollDirectionY,
        this.#previousScrollDirectionY,
        atTopEdge,
        atBottomEdge,
        this.#scrollInitialVelocityYMultiplier
      );

      this.#previousScrollDuration = this.#scrollDuration;
      this.#previousScrollDirectionX = scrollDirectionX;
      this.#previousScrollDirectionY = scrollDirectionY;
      this.#previousScrollStartTimestamp = scrollStartTimestamp;

      this.#scrollInitialVelocityX =
        scrollInitialVelocityX * this.#scrollInitialVelocityXMultiplier;
      this.#scrollInitialVelocityY =
        scrollInitialVelocityY * this.#scrollInitialVelocityYMultiplier;

      this.#scrollVelocityHypotenuse = Math.hypot(
        this.#scrollInitialVelocityX,
        this.#scrollInitialVelocityY
      );

      this.#scrollDeceleration = this.#decelerationLevelToQuantityMap.get(
        this.#decelerationLevel
      );

      this.#scrollDuration =
        this.#scrollVelocityHypotenuse / this.#scrollDeceleration;

      this.#previousScrollDirectionX = scrollDirectionX;
      this.#previousScrollDirectionY = scrollDirectionY;
      this.#previousScrollDuration = this.#scrollDuration;
      this.#scrollStartingPointX = this.#scrollContainer.scrollLeft;
      this.#scrollStartingPointY = this.#scrollContainer.scrollTop;

      const getScrollDistance = (initialVelocity) =>
        (Math.abs(initialVelocity) * this.#scrollDuration) / 2;

      const scrollDistanceX = getScrollDistance(this.#scrollInitialVelocityX);
      const scrollDistanceY = getScrollDistance(this.#scrollInitialVelocityY);

      const minimumScrollableDistance = 1 / devicePixelRatio;
      const scrollDistanceXTooSmall =
        scrollDistanceX < minimumScrollableDistance;
      const scrollDistanceYTooSmall =
        scrollDistanceY < minimumScrollableDistance;

      if (
        (this.#scrollInitialVelocityX === 0 &&
          this.#scrollInitialVelocityY === 0) ||
        (this.#scrollableAxes === "horizontal-only" &&
          scrollDistanceXTooSmall) ||
        (this.#scrollableAxes === "vertical-only" && scrollDistanceYTooSmall) ||
        (this.#scrollableAxes === "horizontal-and-vertical" &&
          scrollDistanceXTooSmall &&
          scrollDistanceYTooSmall)
      ) {
        return new Promise((resolve) => {
          this.#scrollResolve = resolve;
          return this.#stopScroll({
            interruptedBy:
              "Scroll distance is below minimum scrollable distance",
          });
        });
      }

      return new Promise((resolve) => {
        this.#scrollResolve = resolve;
        this.#scrollRafId = requestAnimationFrame((currentTime) => {
          this.scroll({
            currentTime,
          });
        });
      });
    }

    if (!this.#scrollStartTime) {
      this.#scrollStartTime = currentTime;
      this.#scrolling = true;

      this.#scrollContainer.dispatchEvent(
        new CustomEvent("momentumScrollerScrollStart", {
          bubbles: true,
          cancelable: true,
          detail: this.#getEventData(),
        })
      );
    }

    this.#scrollContainer.dispatchEvent(
      new CustomEvent("momentumScrollerScroll", {
        bubbles: true,
        cancelable: true,
        detail: this.#getEventData(),
      })
    );

    this.#scrollElapsedTime = currentTime - this.#scrollStartTime;
    const elapsedTimeRatio = Math.min(
      this.#scrollElapsedTime / this.#scrollDuration,
      1
    );

    const getCurrentVelocity = (initialVelocity) =>
      Math.sign(initialVelocity) *
      (Math.abs(initialVelocity) -
        this.#scrollDeceleration *
          (Math.abs(initialVelocity) / this.#scrollVelocityHypotenuse) *
          this.#scrollElapsedTime);

    this.#scrollCurrentVelocityX = getCurrentVelocity(
      this.#scrollInitialVelocityX
    );
    this.#scrollCurrentVelocityY = getCurrentVelocity(
      this.#scrollInitialVelocityY
    );

    const getNextScrollPosition = (startingPoint, initialVelocity) =>
      startingPoint +
      (-initialVelocity * this.#scrollElapsedTime +
        Math.sign(initialVelocity) *
          0.5 *
          this.#scrollDeceleration *
          (Math.abs(initialVelocity) / this.#scrollVelocityHypotenuse) *
          Math.pow(this.#scrollElapsedTime, 2));

    if (this.#xAxisIsScrollable)
      this.#scrollContainer.scrollLeft = getNextScrollPosition(
        this.#scrollStartingPointX,
        this.#scrollInitialVelocityX
      );

    if (this.#yAxisIsScrollable)
      this.#scrollContainer.scrollTop = getNextScrollPosition(
        this.#scrollStartingPointY,
        this.#scrollInitialVelocityY
      );

    if (this.#borderBouncinessLevel !== "none") {
      const tryingToScrollBeyondHorizontalEdge =
        (this.#scrollInitialVelocityX > 0 && atLeftEdge) ||
        (this.#scrollInitialVelocityX < 0 && atRightEdge);
      const tryingToScrollBeyondVerticalEdge =
        (this.#scrollInitialVelocityY > 0 && atTopEdge) ||
        (this.#scrollInitialVelocityY < 0 && atBottomEdge);

      if (!this.#xAlreadyBounced && tryingToScrollBeyondHorizontalEdge) {
        this.#bounce({ initialVelocityX: this.#scrollCurrentVelocityX });
        this.#xAlreadyBounced = true;
      }
      if (!this.#yAlreadyBounced && tryingToScrollBeyondVerticalEdge) {
        this.#bounce({ initialVelocityY: this.#scrollCurrentVelocityY });
        this.#yAlreadyBounced = true;
      }
    }

    const atEdgeOfVerticalOnlyScroller =
      this.#scrollableAxes === "vertical-only" && (atTopEdge || atBottomEdge);

    const atEdgeOfHorizontalOnlyScroller =
      this.#scrollableAxes === "horizontal-only" && (atLeftEdge || atRightEdge);

    const atEdgeOfOneDimensionalScroller =
      atEdgeOfVerticalOnlyScroller || atEdgeOfHorizontalOnlyScroller;

    const atTopLeftVertex = atTopEdge && atLeftEdge;
    const atTopRightVertex = atTopEdge && atRightEdge;
    const atBottomRightVertex = atBottomEdge && atRightEdge;
    const atBottomLeftVertex = atBottomEdge && atLeftEdge;

    const atTopOrBottomEdgeAndNoHorizontalMovement =
      (atTopEdge || atBottomEdge) && !this.#scrollInitialVelocityX;
    const atLeftOrRightEdgeAndNoVerticalMovement =
      (atLeftEdge || atRightEdge) && !this.#scrollInitialVelocityY;

    const atVertexOfTwoDimensionalScroller =
      this.#scrollableAxes === "horizontal-and-vertical" &&
      (atTopLeftVertex ||
        atTopRightVertex ||
        atBottomRightVertex ||
        atBottomLeftVertex ||
        atTopOrBottomEdgeAndNoHorizontalMovement ||
        atLeftOrRightEdgeAndNoVerticalMovement);

    if (
      elapsedTimeRatio < 1 &&
      !atEdgeOfOneDimensionalScroller &&
      !atVertexOfTwoDimensionalScroller
    ) {
      this.#scrollRafId = requestAnimationFrame((currentTime) => {
        this.scroll({
          currentTime,
        });
      });
    } else if (
      elapsedTimeRatio >= 1 ||
      Number.isNaN(elapsedTimeRatio) ||
      atEdgeOfOneDimensionalScroller ||
      atVertexOfTwoDimensionalScroller
    ) {
      const resolveData = this.#getEventData();

      this.#previousScrollDirectionX = null;
      this.#previousScrollDirectionY = null;
      this.#previousScrollStartTimestamp = null;
      this.#scrollCurrentVelocityX = null;
      this.#scrollCurrentVelocityY = null;
      this.#scrollInitialVelocityXMultiplier = 1;
      this.#scrollInitialVelocityYMultiplier = 1;

      return this.#stopScroll(resolveData);
    }
  }

  #stopScroll(extraData = {}) {
    const eventData = this.#getEventData(extraData);

    this.#scrollResolve(eventData);

    this.#scrollContainer.dispatchEvent(
      new CustomEvent("momentumScrollerScrollStop", {
        bubbles: true,
        cancelable: true,
        detail: eventData,
      })
    );

    this.#previousScrollStopTimestamp = Date.now();
    cancelAnimationFrame(this.#scrollRafId);
    this.#scrolling = false;
    this.#scrollDeceleration = null;
    this.#scrollDuration = null;
    this.#scrollElapsedTime = null;
    this.#scrollResolve = null;
    this.#scrollStartingPointX = null;
    this.#scrollStartingPointY = null;
    this.#scrollStartTime = null;
    this.#scrollVelocityHypotenuse = null;
    this.#scrollInitialVelocityX = null;
    this.#scrollInitialVelocityY = null;
  }

  #getEventData(extraData) {
    const eventData = {
      interruptedBy: null,
      startPoint: [this.#scrollStartingPointX, this.#scrollStartingPointY],
      endPoint: [
        this.#scrollContainer.scrollLeft,
        this.#scrollContainer.scrollTop,
      ],
      distance: Math.hypot(
        Math.abs(this.#scrollStartingPointX - this.#scrollContainer.scrollLeft),
        Math.abs(this.#scrollStartingPointY - this.#scrollContainer.scrollTop)
      ),
      initialVelocityX: this.#scrollInitialVelocityX,
      initialVelocityY: this.#scrollInitialVelocityY,
      velocityHypotenuse: this.#scrollVelocityHypotenuse,
      duration: this.#scrollDuration,
      elapsedTime: this.#scrollElapsedTime,
      scrollContainer: this.#scrollContainer,
      momentumScroller: this,
    };

    if (extraData && typeof extraData === "object")
      Object.assign(eventData, extraData);

    return eventData;
  }

  #bounceDamping;
  #bounceElapsedTimeX = 0;
  #bounceElapsedTimeY = 0;
  #bounceInitialPositionX = 0;
  #bounceInitialPositionY = 0;
  #bounceInitialVelocityX = 0;
  #bounceInitialVelocityY = 0;
  #bounceRafId;
  #bounceResolve;
  #bounceStartTimeX;
  #bounceStartTimeY;
  #bounceTimeAtMaximumDisplacment;
  #bounceXFallingOnly;
  #bounceYFallingOnly;
  #bounceXBouncing;
  #bounceYBouncing;

  #getCurrentPositionX() {
    return getTransformProperties(this.#scrollContainer).translateX;
  }
  #getCurrentPositionY() {
    return getTransformProperties(this.#scrollContainer).translateY;
  }

  #bounce({
    initialVelocityX = 0,
    initialVelocityY = 0,
    currentTime = NaN,
  } = {}) {
    const isNewBounce = Number.isNaN(currentTime);
    if (isNewBounce) {
      validateArgument("initialVelocityX", initialVelocityX, {
        allowedTypes: ["number"],
        allowFiniteNumbersOnly: true,
        allowNonNaNNumbersOnly: true,
      });
      validateArgument("initialVelocityY", initialVelocityY, {
        allowedTypes: ["number"],
        allowFiniteNumbersOnly: true,
        allowNonNaNNumbersOnly: true,
      });

      const currentPositionX = this.#getCurrentPositionX();
      const currentPositionY = this.#getCurrentPositionY();

      const nothing =
        initialVelocityX === 0 &&
        initialVelocityY === 0 &&
        currentPositionX === 0 &&
        currentPositionY === 0;

      if (nothing) return;

      this.#bounceDamping = this.#borderBouncinessLevelToQuantityMap.get(
        this.#borderBouncinessLevel
      );

      this.#bounceTimeAtMaximumDisplacment = 1 / this.#bounceDamping;

      this.#bounceXFallingOnly =
        initialVelocityX === 0 && currentPositionX !== 0;
      this.#bounceYFallingOnly =
        initialVelocityY === 0 && currentPositionY !== 0;

      const getInitialVelocity = (currentPosition) =>
        currentPosition /
        (this.#bounceTimeAtMaximumDisplacment *
          Math.pow(
            Math.E,
            -1 * this.#bounceDamping * this.#bounceTimeAtMaximumDisplacment
          ));

      if (!this.#bounceXBouncing) {
        if (this.#bounceXFallingOnly) {
          initialVelocityX = getInitialVelocity(currentPositionX);
          this.#bounceInitialVelocityX = initialVelocityX / Math.E;
          this.#bounceInitialPositionX =
            this.#bounceInitialVelocityX * this.#bounceTimeAtMaximumDisplacment;
        } else if (!this.#bounceXFallingOnly) {
          this.#bounceInitialVelocityX = initialVelocityX * 0.1;
          this.#bounceInitialPositionX = 0;
        }
        if (this.#bounceInitialVelocityX) this.#bounceXBouncing = true;
      }

      if (!this.#bounceYBouncing) {
        if (this.#bounceYFallingOnly) {
          initialVelocityY = getInitialVelocity(currentPositionY);
          this.#bounceInitialVelocityY = initialVelocityY / Math.E;
          this.#bounceInitialPositionY =
            this.#bounceInitialVelocityY * this.#bounceTimeAtMaximumDisplacment;
        } else if (!this.#bounceYFallingOnly) {
          this.#bounceInitialVelocityY = initialVelocityY * 0.1;
          this.#bounceInitialPositionY = 0;
        }
        if (this.#bounceInitialVelocityY) this.#bounceYBouncing = true;
      }

      if (
        this.#bounceXBouncing &&
        this.#bounceYBouncing &&
        !(this.#bounceXFallingOnly && this.#bounceYFallingOnly)
      )
        return;

      return new Promise((resolve) => {
        this.#bounceResolve = resolve;
        this.#bounceRafId = requestAnimationFrame((currentTime) => {
          this.#bounce({
            currentTime,
          });
        });
      });
    }

    const dispatchMomentumScrollerBounceEvent = (detail) => {
      this.#scrollContainer.dispatchEvent(
        new CustomEvent("momentumScrollerBounceStart", {
          bubbles: true,
          cancelable: true,
          detail,
        })
      );
    };

    if (this.#bounceInitialVelocityX && !this.#bounceStartTimeX) {
      this.#bounceStartTimeX = currentTime;
      dispatchMomentumScrollerBounceEvent({ axis: "x" });
    }
    if (this.#bounceInitialVelocityY && !this.#bounceStartTimeY) {
      this.#bounceStartTimeY = currentTime;
      dispatchMomentumScrollerBounceEvent({ axis: "y" });
    }

    if (this.#bounceStartTimeX)
      this.#bounceElapsedTimeX = currentTime - this.#bounceStartTimeX;
    if (this.#bounceStartTimeY)
      this.#bounceElapsedTimeY = currentTime - this.#bounceStartTimeY;

    const getTranslate = (initialPosition, initialVelocity, elapsedTime) =>
      (initialPosition + initialVelocity * elapsedTime) /
      Math.pow(Math.E, this.#bounceDamping * elapsedTime);

    const translateX = getTranslate(
      this.#bounceInitialPositionX,
      this.#bounceInitialVelocityX,
      this.#bounceElapsedTimeX
    );
    const translateY = getTranslate(
      this.#bounceInitialPositionY,
      this.#bounceInitialVelocityY,
      this.#bounceElapsedTimeY
    );

    this.#scrollContainer.style.setProperty(
      "transform",
      `translateX(${translateX}px) translateY(${translateY}px)`
    );

    const getIsAtEquilibrium = (scrolling, elapsedTime, translate) =>
      !scrolling ||
      (scrolling &&
        elapsedTime > this.#bounceTimeAtMaximumDisplacment &&
        Math.abs(translate) < 1 / (devicePixelRatio * 10));

    const xIsAtEquilibrium = getIsAtEquilibrium(
      this.#bounceXBouncing,
      this.#bounceElapsedTimeX,
      translateX
    );
    const yIsAtEquilibrium = getIsAtEquilibrium(
      this.#bounceYBouncing,
      this.#bounceElapsedTimeY,
      translateY
    );

    if (!xIsAtEquilibrium || !yIsAtEquilibrium) {
      this.#bounceRafId = requestAnimationFrame((currentTime) => {
        this.#bounce({
          currentTime,
        });
      });
    } else if (xIsAtEquilibrium && yIsAtEquilibrium) {
      this.#scrollContainer.style.setProperty(
        "transform",
        "translateX(0) translateY(0)"
      );

      return this.#stopBounce();
    }
  }

  #stopBounce(extraData = {}) {
    this.#bounceResolve(extraData);

    this.#scrollContainer.dispatchEvent(
      new CustomEvent("momentumScrollerBounceStop", {
        bubbles: true,
        cancelable: true,
        detail: extraData,
      })
    );

    cancelAnimationFrame(this.#bounceRafId);
    this.#bounceDamping = null;
    this.#bounceInitialVelocityX = 0;
    this.#bounceInitialVelocityY = 0;
    this.#bounceXBouncing = false;
    this.#bounceYBouncing = false;
    this.#bounceStartTimeX = null;
    this.#bounceStartTimeY = null;
    this.#bounceElapsedTimeX = null;
    this.#bounceElapsedTimeY = null;
    this.#bounceXFallingOnly = null;
    this.#bounceYFallingOnly = null;
    this.#bounceResolve = null;
  }
}

export { MomentumScroller };
