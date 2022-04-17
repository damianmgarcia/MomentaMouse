import {
  getDeviceHeuristics,
  isPrimaryInput,
  validateArgument,
} from "https://damianmgarcia.com/scripts/modules/utilities.js";

const deviceHeuristics = getDeviceHeuristics();

class MomentumScroller {
  static scrollerMap = new Map();

  #scrollContainer;
  #deceleration = "medium";
  #grabCursor = "grab";
  #grabbingCursor = "grabbing";
  #stopScrollOnPointerDown = true;
  #preventDefaultSelectors = [];
  #decelerationMap = new Map([
    ["zero", 0],
    ["low", 0.0001875],
    ["medium", 0.00075],
    ["high", 0.006],
    ["infinite", Infinity],
  ]);

  constructor(scrollContainer) {
    if (deviceHeuristics.isTouchScreen)
      throw new Error(
        "MomentumScroller instantiation blocked. Due to conflicts between native momentum scrolling systems and MomentumScroller.js, touch screen devices, such as this one, are not supported."
      );

    this.#scrollContainer = validateArgument(
      "scrollContainer",
      scrollContainer,
      {
        allowedPrototypes: [Element],
      }
    );

    if (MomentumScroller.scrollerMap.has(scrollContainer))
      throw new Error(
        "A MomentumScroller instance for this scrollContainer already exists"
      );

    this.#scrollContainer.addEventListener("pointerdown", (event) =>
      this.pointerDownHandler(event)
    );

    this.#scrollContainer.addEventListener("smoothScrollStart", () => {
      if (this.#resolve)
        this.abortPriorScrolls({
          interruptedBy: "Smooth scroll on same container",
        });
    });

    MomentumScroller.scrollerMap.set(scrollContainer, this);
  }

  setDeceleration(deceleration) {
    validateArgument("deceleration", deceleration, {
      allowedValues: Array.from(this.#decelerationMap.keys()),
    });

    this.#deceleration = deceleration;
    return this;
  }

  setGrabCursor(grabCursor) {
    validateArgument("grabCursor", grabCursor, {
      allowedTypes: ["string"],
      customErrorMessage:
        "grabCursor must be a String and should be appropriate for the CSS Cursor property (https://developer.mozilla.org/en-US/docs/Web/CSS/cursor)",
    });

    this.#grabCursor = grabCursor;
    return this;
  }

  setGrabbingCursor(grabbingCursor) {
    validateArgument("grabbingCursor", grabbingCursor, {
      allowedTypes: ["string"],
      customErrorMessage:
        "grabbingCursor must be a String and should be appropriate for the CSS Cursor property (https://developer.mozilla.org/en-US/docs/Web/CSS/cursor)",
    });

    this.#grabbingCursor = grabbingCursor;
    return this;
  }

  setStopScrollOnPointerDown(stopScrollOnPointerDown) {
    validateArgument("stopScrollOnPointerDown", stopScrollOnPointerDown, {
      allowedTypes: ["boolean"],
    });

    this.#stopScrollOnPointerDown = stopScrollOnPointerDown;
    return this;
  }

  setPreventDefaultSelectors(preventDefaultSelectors) {
    validateArgument("preventDefaultSelectors", preventDefaultSelectors, {
      allowedTypes: ["array"],
    });

    preventDefaultSelectors.forEach((preventDefaultSelector) =>
      validateArgument("preventDefaultSelectors", preventDefaultSelector, {
        allowedTypes: ["string"],
      })
    );

    this.#preventDefaultSelectors = preventDefaultSelectors;
    return this;
  }

  setDecelerationMap(decelerationMap) {
    validateArgument("decelerationMap", decelerationMap, {
      allowedPrototypes: [Map],
    });

    Array.from(decelerationMap.keys()).forEach((decelerationMapKey) =>
      validateArgument("decelerationMapKeys", decelerationMapKey, {
        allowedTypes: ["string"],
      })
    );

    Array.from(decelerationMap.values()).forEach((decelerationMapValue) =>
      validateArgument("decelerationMapValues", decelerationMapValue, {
        allowedTypes: ["number"],
      })
    );

    this.#decelerationMap = decelerationMap;
    return this;
  }

  #active = false;

  get isActive() {
    return this.#active;
  }

  activate() {
    if (this.#active) return;

    const momentumScrollActivateEvent = new CustomEvent(
      "momentumScrollActivate",
      {
        bubbles: true,
        cancelable: true,
        detail: this.getEventData(),
      }
    );
    this.#scrollContainer.dispatchEvent(momentumScrollActivateEvent);

    this.#scrollContainer.style.setProperty("cursor", this.#grabCursor);

    this.#active = true;

    return this;
  }

  deactivate() {
    if (!this.#active) return;

    const momentumScrollDeactivateEvent = new CustomEvent(
      "momentumScrollDeactivate",
      {
        bubbles: true,
        cancelable: true,
        detail: this.getEventData(),
      }
    );
    this.#scrollContainer.dispatchEvent(momentumScrollDeactivateEvent);

    this.#scrollContainer.style.removeProperty("cursor");

    this.#active = false;

    return this;
  }

  toggleOnOff() {
    if (this.#active) {
      return this.deactivate();
    } else if (!this.#active) {
      return this.activate();
    }
  }

  #paused = false;

  pause() {
    this.#paused = true;
    return this;
  }

  unpause() {
    this.#paused = false;
    return this;
  }

  #xAxisIsScrollable;
  #yAxisIsScrollable;
  #scrollerType;
  #pointerMoveUpCancelAbortController = new AbortController();
  #pointerMoveLog = [];
  #pointerIsDown;

  get pointerIsDown() {
    return this.#pointerIsDown;
  }

  pointerDownHandler(event) {
    if (!this.#active) return;

    if (this.#preventDefaultSelectors) {
      if (
        this.#preventDefaultSelectors.some((cssSelector) =>
          event.target.closest(cssSelector)
        )
      )
        return;
    }

    const inputButtonIsPrimary = isPrimaryInput(event);
    if (!inputButtonIsPrimary) return;

    this.#xAxisIsScrollable =
      this.#scrollContainer.scrollWidth > this.#scrollContainer.clientWidth;
    this.#yAxisIsScrollable =
      this.#scrollContainer.scrollHeight > this.#scrollContainer.clientHeight;

    this.#scrollerType =
      this.#xAxisIsScrollable && this.#yAxisIsScrollable
        ? "horizontal-and-vertical"
        : this.#xAxisIsScrollable && !this.#yAxisIsScrollable
        ? "horizontal-only"
        : !this.#xAxisIsScrollable && this.#yAxisIsScrollable
        ? "vertical-only"
        : "none";

    if (this.#scrollerType === "none") return;

    this.#pointerIsDown = true;

    if (this.#stopScrollOnPointerDown)
      if (this.#resolve)
        this.abortPriorScrolls({
          interruptedBy: "Pointer down on scroll container",
        });

    const momentumScrollPointerDownEvent = new CustomEvent(
      "momentumScrollPointerDown",
      {
        bubbles: true,
        cancelable: true,
        detail: this.getEventData(),
      }
    );
    this.#scrollContainer.dispatchEvent(momentumScrollPointerDownEvent);

    this.#scrollContainer.style.setProperty("cursor", this.#grabbingCursor);

    let movementX = 0;
    let previousScreenX = event.screenX; // Safari returns undefined for event.movementX
    let movementY = 0;
    let previousScreenY = event.screenY; // Safari returns undefined for event.movementY

    this.#scrollContainer.addEventListener(
      "pointermove",
      (event) => {
        if (!this.#paused)
          this.#scrollContainer.setPointerCapture(event.pointerId);

        if (this.#xAxisIsScrollable) {
          movementX = event.screenX - previousScreenX;
          previousScreenX = event.screenX;
        }

        if (this.#yAxisIsScrollable) {
          movementY = event.screenY - previousScreenY;
          previousScreenY = event.screenY;
        }

        if (this.#paused) return;
        if (this.#xAxisIsScrollable)
          this.#scrollContainer.scrollLeft -= movementX;
        if (this.#yAxisIsScrollable)
          this.#scrollContainer.scrollTop -= movementY;

        this.#pointerMoveLog.push([
          event.screenX,
          event.screenY,
          event.timeStamp,
        ]);
      },
      { signal: this.#pointerMoveUpCancelAbortController.signal }
    );

    this.#scrollContainer.addEventListener(
      "pointerup",
      (event) => this.pointerUpHandler(event),
      {
        once: true,
        signal: this.#pointerMoveUpCancelAbortController.signal,
      }
    );

    this.#scrollContainer.addEventListener(
      "pointercancel",
      (event) => this.pointerUpHandler(event),
      {
        once: true,
        signal: this.#pointerMoveUpCancelAbortController.signal,
      }
    );
  }

  pointerUpHandler(event) {
    this.#pointerIsDown = false;

    this.#scrollContainer.style.setProperty("cursor", this.#grabCursor);

    const momentumScrollPointerUpEvent = new CustomEvent(
      "momentumScrollPointerUp",
      {
        bubbles: true,
        cancelable: true,
        detail: this.getEventData(),
      }
    );
    this.#scrollContainer.dispatchEvent(momentumScrollPointerUpEvent);

    this.#pointerMoveUpCancelAbortController.abort();
    this.#pointerMoveUpCancelAbortController = new AbortController();

    if (this.#paused) return;

    const endTime = event.timeStamp;

    const meetsMomentumScrollCriteria =
      this.#pointerMoveLog.length > 0 &&
      endTime - this.#pointerMoveLog[this.#pointerMoveLog.length - 1][2] < 100;

    let endPositionX;
    let velocityX = 0;
    if (this.#xAxisIsScrollable) {
      endPositionX = event.screenX;
      velocityX = getVelocity(this.#pointerMoveLog, 0, endPositionX);
    }

    let endPositionY;
    let velocityY = 0;
    if (this.#yAxisIsScrollable) {
      endPositionY = event.screenY;
      velocityY = getVelocity(this.#pointerMoveLog, 1, endPositionY);
    }

    function getVelocity(movementLog, axisIndex, endPosition) {
      if (!meetsMomentumScrollCriteria) return 0;

      for (let i = 1; i < 5; i++) {
        if (movementLog.length < i) return 0;

        const startPosition = movementLog[movementLog.length - i][axisIndex];
        const startTime = movementLog[movementLog.length - i][2];

        const positionChange = endPosition - startPosition;
        const timeChange = endTime - startTime;

        if (positionChange && timeChange) {
          return positionChange / timeChange;
        }
      }

      return 0;
    }

    this.scroll({
      velocityX: velocityX,
      velocityY: velocityY,
    });

    this.#pointerMoveLog = [];
  }

  #isScrolling = false;

  get isScrolling() {
    return this.#isScrolling;
  }

  #scrollDirectionPreviousY;
  #scrollDirectionPreviousX;
  #scrollDistance;
  #scrollDuration;
  #scrollDurationPrevious;
  #scrollVelocityMultiplierX = 1;
  #scrollVelocityMultiplierY = 1;
  #scrollRafId;
  #scrollStartingPointX;
  #scrollStartingPointY;
  #scrollTimestampPrevious;
  #startTime;
  #elapsedTime;
  #resolve;

  scroll(
    { velocityX = 0, velocityY = 0 },
    newMomentumScroll = true,
    deceleration,
    currentTime
  ) {
    const reachedTopEdge = this.#scrollContainer.scrollTop === 0;
    const reachedBottomEdge =
      this.#scrollContainer.scrollHeight -
        this.#scrollContainer.scrollTop -
        this.#scrollContainer.clientHeight <=
      1;
    const reachedLeftEdge = this.#scrollContainer.scrollLeft === 0;
    const reachedRightEdge =
      this.#scrollContainer.scrollWidth -
        this.#scrollContainer.scrollLeft -
        this.#scrollContainer.clientWidth <=
      1;

    const reachedEdgeOfVerticalOnlyScroller =
      (reachedTopEdge || reachedBottomEdge) &&
      this.#scrollerType === "vertical-only";

    const reachedEdgeOfHorizontalOnlyScroller =
      (reachedLeftEdge || reachedRightEdge) &&
      this.#scrollerType === "horizontal-only";

    const reachedEdgeOfOneDimensionalScroller =
      reachedEdgeOfVerticalOnlyScroller || reachedEdgeOfHorizontalOnlyScroller;

    const reachedTopLeftVertex = reachedTopEdge && reachedLeftEdge;
    const reachedTopRightVertex = reachedTopEdge && reachedRightEdge;
    const reachedBottomRightVertex = reachedBottomEdge && reachedRightEdge;
    const reachedBottomLeftVertex = reachedBottomEdge && reachedLeftEdge;

    const reachedVertexOfTwoDimensionalScroller =
      (reachedTopLeftVertex ||
        reachedTopRightVertex ||
        reachedBottomRightVertex ||
        reachedBottomLeftVertex) &&
      this.#scrollerType === "horizontal-and-vertical";

    if (newMomentumScroll) {
      validateArgument("velocityX", velocityX, {
        allowedTypes: ["number"],
        allowFiniteNumbersOnly: true,
      });
      validateArgument("velocityY", velocityY, {
        allowedTypes: ["number"],
        allowFiniteNumbersOnly: true,
      });

      const velocityHypotenuse = Math.hypot(velocityX, velocityY);

      const decelerationValue = this.#decelerationMap.get(this.#deceleration);

      this.#scrollDuration = velocityHypotenuse / decelerationValue;
      this.#scrollDistance = (velocityHypotenuse * this.#scrollDuration) / 2;

      const scrollDistanceX =
        this.#scrollDistance * (Math.abs(velocityX) / velocityHypotenuse);
      const scrollDistanceY =
        this.#scrollDistance * (Math.abs(velocityY) / velocityHypotenuse);

      const minimumScrollableDistance = 1 / devicePixelRatio;
      const xDistanceBelowMinimum = scrollDistanceX < minimumScrollableDistance;
      const yDistanceBelowMinimum = scrollDistanceY < minimumScrollableDistance;

      if (
        (velocityX === 0 && velocityY === 0) ||
        (this.#scrollerType === "horizontal-only" && xDistanceBelowMinimum) ||
        (this.#scrollerType === "vertical-only" && yDistanceBelowMinimum) ||
        (this.#scrollerType === "horizontal-and-vertical" &&
          xDistanceBelowMinimum &&
          yDistanceBelowMinimum)
      ) {
        if (this.#resolve)
          this.abortPriorScrolls({ interruptedBy: "New momentum scroll" });
        return new Promise((resolve) => {
          this.#resolve = resolve;
          return this.abortPriorScrolls({
            interruptedBy:
              "Scroll distance is below minimum scrollable distance",
          });
        });
      }

      if (this.#resolve)
        this.abortPriorScrolls({ interruptedBy: "New momentum scroll" });

      const scrollTimestamp = Date.now();
      this.#scrollStartingPointY = this.#scrollContainer.scrollTop;
      this.#scrollStartingPointX = this.#scrollContainer.scrollLeft;

      const timeSinceLastScroll =
        scrollTimestamp - this.#scrollTimestampPrevious;
      const halfTheDurationOfPreviousScroll =
        0.5 * this.#scrollDurationPrevious;
      const timeSinceLastScrollAbortion =
        scrollTimestamp - this.#abortionTimestamp;
      const isWithinTimeWindow =
        timeSinceLastScroll < halfTheDurationOfPreviousScroll &&
        timeSinceLastScrollAbortion < 500;

      const scrollDirectionX = Math.sign(velocityX);
      if (scrollDirectionX) {
        const sameDirectionX =
          scrollDirectionX === this.#scrollDirectionPreviousX;
        const multipleQuickSameDirectionXScrolls =
          !reachedLeftEdge &&
          !reachedRightEdge &&
          sameDirectionX &&
          isWithinTimeWindow;

        this.#scrollVelocityMultiplierX = multipleQuickSameDirectionXScrolls
          ? this.#scrollVelocityMultiplierX + 1
          : 1;
      } else if (!scrollDirectionX) {
        this.#scrollVelocityMultiplierX = 1;
      }

      const scrollDirectionY = Math.sign(velocityY);
      if (scrollDirectionY) {
        const sameScrollDirectionY =
          scrollDirectionY === this.#scrollDirectionPreviousY;
        const multipleQuickSameDirectionYScrolls =
          !reachedTopEdge &&
          !reachedBottomEdge &&
          sameScrollDirectionY &&
          isWithinTimeWindow;

        this.#scrollVelocityMultiplierY = multipleQuickSameDirectionYScrolls
          ? this.#scrollVelocityMultiplierY + 1
          : 1;
      } else if (!scrollDirectionY) {
        this.#scrollVelocityMultiplierY = 1;
      }

      this.#scrollDurationPrevious = this.#scrollDuration;
      this.#scrollDirectionPreviousX = scrollDirectionX;
      this.#scrollDirectionPreviousY = scrollDirectionY;
      this.#scrollTimestampPrevious = scrollTimestamp;

      const multiplierAdjustedVelocityX =
        velocityX * this.#scrollVelocityMultiplierX;
      const multiplierAdjustedVelocityY =
        velocityY * this.#scrollVelocityMultiplierY;

      return new Promise((resolve) => {
        this.#resolve = resolve;
        this.#scrollRafId = requestAnimationFrame((currentTime) => {
          this.scroll(
            {
              velocityX: multiplierAdjustedVelocityX,
              velocityY: multiplierAdjustedVelocityY,
            },
            false,
            decelerationValue,
            currentTime
          );
        });
      });
    }

    if (!this.#startTime) {
      this.#startTime = currentTime;

      const momentumScrollStartEvent = new CustomEvent("momentumScrollStart", {
        bubbles: true,
        cancelable: true,
        detail: this.getEventData(),
      });
      this.#scrollContainer.dispatchEvent(momentumScrollStartEvent);
    }

    this.#elapsedTime = currentTime - this.#startTime;
    const elapsedTimeRatio = Math.min(
      this.#elapsedTime / this.#scrollDuration,
      1
    );

    if (!this.#active) {
      return this.abortPriorScrolls({
        interruptedBy: "Momentum scroller deactivation",
      });
    }

    const velocityHypotenuse = Math.hypot(velocityX, velocityY);

    if (this.#xAxisIsScrollable) {
      const nextScrollX =
        this.#scrollStartingPointX +
        (-velocityX * this.#elapsedTime +
          Math.sign(velocityX) *
            0.5 *
            deceleration *
            (Math.abs(velocityX) / velocityHypotenuse) *
            Math.pow(this.#elapsedTime, 2));
      this.#scrollContainer.scrollLeft = nextScrollX;
    }

    if (this.#yAxisIsScrollable) {
      const nextScrollY =
        this.#scrollStartingPointY +
        (-velocityY * this.#elapsedTime +
          Math.sign(velocityY) *
            0.5 *
            deceleration *
            (Math.abs(velocityY) / velocityHypotenuse) *
            Math.pow(this.#elapsedTime, 2));
      this.#scrollContainer.scrollTop = nextScrollY;
    }

    const momentumScrollEvent = new CustomEvent("momentumScroll", {
      bubbles: true,
      cancelable: true,
      detail: this.getEventData(),
    });
    this.#scrollContainer.dispatchEvent(momentumScrollEvent);

    if (
      elapsedTimeRatio < 1 &&
      !reachedEdgeOfOneDimensionalScroller &&
      !reachedVertexOfTwoDimensionalScroller
    ) {
      this.#isScrolling = true;
      this.#scrollRafId = requestAnimationFrame((currentTime) => {
        this.scroll(
          { velocityX: velocityX, velocityY: velocityY },
          false,
          deceleration,
          currentTime
        );
      });
    } else if (
      elapsedTimeRatio >= 1 ||
      Number.isNaN(elapsedTimeRatio) ||
      reachedEdgeOfOneDimensionalScroller ||
      reachedVertexOfTwoDimensionalScroller
    ) {
      const resolveData = this.getEventData();

      this.#isScrolling = false;
      this.#scrollVelocityMultiplierX = 1;
      this.#scrollVelocityMultiplierY = 1;
      this.#scrollDirectionPreviousX = null;
      this.#scrollDirectionPreviousY = null;
      this.#scrollTimestampPrevious = null;

      return this.abortPriorScrolls(resolveData);
    }
  }

  #abortionTimestamp;

  abortPriorScrolls(extraData = {}) {
    if (this.#resolve) this.#resolve(this.getEventData(extraData));

    const momentumScrollStopEvent = new CustomEvent("momentumScrollStop", {
      bubbles: true,
      cancelable: true,
      detail: this.getEventData(extraData),
    });
    this.#scrollContainer.dispatchEvent(momentumScrollStopEvent);

    this.#abortionTimestamp = Date.now();
    cancelAnimationFrame(this.#scrollRafId);
    this.#startTime = null;
    this.#scrollStartingPointX = null;
    this.#scrollStartingPointY = null;
    this.#scrollDuration = null;
    this.#elapsedTime = null;
    this.#resolve = null;
  }

  getEventData(extraData) {
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
      duration: this.#scrollDuration,
      elapsedTime: this.#elapsedTime,
      scrollContainer: this.#scrollContainer,
      momentumScroller: this,
    };

    if (extraData && typeof extraData === "object")
      Object.assign(eventData, extraData);

    return eventData;
  }
}

export { MomentumScroller };
