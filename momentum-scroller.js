import {
  getDeviceHeuristics,
  getTransformProperties,
  isPrimaryInput,
  ScrollContainerTools,
  validateArgument,
} from "https://damianmgarcia.com/scripts/modules/utilities.js";

const deviceHeuristics = getDeviceHeuristics();

class MomentumScroller {
  static scrollerMap = new Map();

  #scrollContainer;
  #decelerationLevel = "medium";
  #borderBouncinessLevel = "medium";
  #grabCursor = "grab";
  #grabbingCursor = "grabbing";
  #enableScrollStopOnPointerDown = true;
  #preventDefaultSelectors = [];
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
      if (this.#scrollResolve)
        this.abortPriorScrolls({
          interruptedBy: "Smooth scroll on same container",
        });
    });

    MomentumScroller.scrollerMap.set(scrollContainer, this);
  }

  setDecelerationLevel(decelerationLevel) {
    validateArgument("decelerationLevel", decelerationLevel, {
      allowedValues: Array.from(this.#decelerationLevelToQuantityMap.keys()),
    });

    this.#decelerationLevel = decelerationLevel;
    return this;
  }

  setBorderBouncinessLevel(borderBouncinessLevel) {
    validateArgument("borderBouncinessLevel", borderBouncinessLevel, {
      allowedValues: Array.from(
        this.#borderBouncinessLevelToQuantityMap.keys()
      ),
    });

    this.#borderBouncinessLevel = borderBouncinessLevel;
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

  setEnableScrollStopOnPointerDown(enableScrollStopOnPointerDown) {
    validateArgument(
      "enableScrollStopOnPointerDown",
      enableScrollStopOnPointerDown,
      {
        allowedTypes: ["boolean"],
      }
    );

    this.#enableScrollStopOnPointerDown = enableScrollStopOnPointerDown;
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
  #xBounced;
  #yBounced;

  get pointerIsDown() {
    return this.#pointerIsDown;
  }

  pointerDownHandler(event) {
    if (!this.#active) return;

    if (
      this.#preventDefaultSelectors &&
      this.#preventDefaultSelectors.some((cssSelector) =>
        event.target.closest(cssSelector)
      )
    )
      return;

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

    if (this.#enableScrollStopOnPointerDown && this.#scrollResolve)
      this.abortPriorScrolls({
        interruptedBy: "Pointer down on scroll container",
      });

    if (this.#bounceResolve)
      this.abortPriorBounces({
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

    let currentTranslateX;
    let currentTranslateY;
    let bounciness;
    if (this.#borderBouncinessLevel !== "none") {
      this.#xBounced = false;
      this.#yBounced = false;

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

        const updateScrollLeft = () =>
          (this.#scrollContainer.scrollLeft -= movementX);
        const updateScrollTop = () =>
          (this.#scrollContainer.scrollTop -= movementY);
        const resetTranslateX = () => (currentTranslateX = 0);
        const resetTranslateY = () => (currentTranslateY = 0);

        if (this.#borderBouncinessLevel !== "none") {
          const { atLeftEdge, atRightEdge, atTopEdge, atBottomEdge } =
            ScrollContainerTools.getScrollerPositionProperties(
              this.#scrollContainer
            );

          const tryingToScrollBeyondHorizontalEdge =
            (atLeftEdge && currentTranslateX + movementX > 0) ||
            (atRightEdge && currentTranslateX + movementX < 0);
          const tryingToScrollBeyondVerticalEdge =
            (atBottomEdge && currentTranslateY + movementY < 0) ||
            (atTopEdge && currentTranslateY + movementY > 0);

          if (tryingToScrollBeyondHorizontalEdge) {
            currentTranslateX =
              currentTranslateX +
              movementX *
                (1 /
                  (bounciness *
                    Math.abs(Math.pow(currentTranslateX + movementX, 2)) +
                    1));
          } else if (!tryingToScrollBeyondHorizontalEdge) {
            resetTranslateX();
            updateScrollLeft();
          }

          if (tryingToScrollBeyondVerticalEdge) {
            currentTranslateY =
              currentTranslateY +
              movementY *
                (1 /
                  (bounciness *
                    Math.abs(Math.pow(currentTranslateY + movementY, 2)) +
                    1));
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

    const currentTransformProperties = getTransformProperties(
      this.#scrollContainer
    );

    const onBorder =
      currentTransformProperties.translateX ||
      currentTransformProperties.translateY;

    if (onBorder) this.bounce();

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
            ScrollContainerTools.getScrollerPositionProperties(
              this.#scrollContainer
            );

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
    let velocityX = 0;
    if (this.#xAxisIsScrollable) {
      endPositionX = event.screenX;
      velocityX = getVelocity("x", endPositionX);
    }

    let endPositionY;
    let velocityY = 0;
    if (this.#yAxisIsScrollable) {
      endPositionY = event.screenY;
      velocityY = getVelocity("y", endPositionY);
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
  #scrollDuration;
  #scrollDurationPrevious;
  #scrollVelocityMultiplierX = 1;
  #scrollVelocityMultiplierY = 1;
  #scrollRafId;
  #scrollStartingPointX;
  #scrollStartingPointY;
  #scrollTimestampPrevious;
  #scrollStartTime;
  #scrollElapsedTime;
  #scrollResolve;

  scroll(
    { velocityX = 0, velocityY = 0 },
    currentTime = NaN,
    deceleration = NaN
  ) {
    const { atLeftEdge, atRightEdge, atTopEdge, atBottomEdge } =
      ScrollContainerTools.getScrollerPositionProperties(this.#scrollContainer);

    const atEdgeOfVerticalOnlyScroller =
      this.#scrollerType === "vertical-only" && (atTopEdge || atBottomEdge);

    const atEdgeOfHorizontalOnlyScroller =
      this.#scrollerType === "horizontal-only" && (atLeftEdge || atRightEdge);

    const atEdgeOfOneDimensionalScroller =
      atEdgeOfVerticalOnlyScroller || atEdgeOfHorizontalOnlyScroller;

    const atTopLeftVertex = atTopEdge && atLeftEdge;
    const atTopRightVertex = atTopEdge && atRightEdge;
    const atBottomRightVertex = atBottomEdge && atRightEdge;
    const atBottomLeftVertex = atBottomEdge && atLeftEdge;

    const atTopOrBottomEdgeAndNoHorizontalMovement =
      (atTopEdge || atBottomEdge) && !velocityX;
    const atLeftOrRightEdgeAndNoVerticalMovement =
      (atLeftEdge || atRightEdge) && !velocityY;

    const atVertexOfTwoDimensionalScroller =
      this.#scrollerType === "horizontal-and-vertical" &&
      (atTopLeftVertex ||
        atTopRightVertex ||
        atBottomRightVertex ||
        atBottomLeftVertex ||
        atTopOrBottomEdgeAndNoHorizontalMovement ||
        atLeftOrRightEdgeAndNoVerticalMovement);

    const isNewScroll = Number.isNaN(currentTime);
    if (isNewScroll) {
      validateArgument("velocityX", velocityX, {
        allowedTypes: ["number"],
        allowFiniteNumbersOnly: true,
      });
      validateArgument("velocityY", velocityY, {
        allowedTypes: ["number"],
        allowFiniteNumbersOnly: true,
      });

      const velocityHypotenuse = Math.hypot(velocityX, velocityY);

      deceleration = this.#decelerationLevelToQuantityMap.get(
        this.#decelerationLevel
      );

      this.#scrollDuration = velocityHypotenuse / deceleration;
      const scrollDistance = (velocityHypotenuse * this.#scrollDuration) / 2;

      const scrollDistanceX =
        scrollDistance * (Math.abs(velocityX) / velocityHypotenuse);
      const scrollDistanceY =
        scrollDistance * (Math.abs(velocityY) / velocityHypotenuse);

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
        if (this.#scrollResolve)
          this.abortPriorScrolls({ interruptedBy: "New momentum scroll" });
        return new Promise((resolve) => {
          this.#scrollResolve = resolve;
          return this.abortPriorScrolls({
            interruptedBy:
              "Scroll distance is below minimum scrollable distance",
          });
        });
      }

      if (this.#scrollResolve)
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
          !atLeftEdge && !atRightEdge && sameDirectionX && isWithinTimeWindow;

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
          !atTopEdge &&
          !atBottomEdge &&
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
        this.#scrollResolve = resolve;
        this.#scrollRafId = requestAnimationFrame((currentTime) => {
          this.scroll(
            {
              velocityX: multiplierAdjustedVelocityX,
              velocityY: multiplierAdjustedVelocityY,
            },
            currentTime,
            deceleration
          );
        });
      });
    }

    if (!this.#scrollStartTime) {
      this.#scrollStartTime = currentTime;

      const momentumScrollStartEvent = new CustomEvent("momentumScrollStart", {
        bubbles: true,
        cancelable: true,
        detail: this.getEventData(),
      });
      this.#scrollContainer.dispatchEvent(momentumScrollStartEvent);
    }

    this.#scrollElapsedTime = currentTime - this.#scrollStartTime;
    const elapsedTimeRatio = Math.min(
      this.#scrollElapsedTime / this.#scrollDuration,
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
        (-velocityX * this.#scrollElapsedTime +
          Math.sign(velocityX) *
            0.5 *
            deceleration *
            (Math.abs(velocityX) / velocityHypotenuse) *
            Math.pow(this.#scrollElapsedTime, 2));
      this.#scrollContainer.scrollLeft = nextScrollX;
    }

    if (this.#yAxisIsScrollable) {
      const nextScrollY =
        this.#scrollStartingPointY +
        (-velocityY * this.#scrollElapsedTime +
          Math.sign(velocityY) *
            0.5 *
            deceleration *
            (Math.abs(velocityY) / velocityHypotenuse) *
            Math.pow(this.#scrollElapsedTime, 2));
      this.#scrollContainer.scrollTop = nextScrollY;
    }

    if (this.#borderBouncinessLevel !== "none") {
      const tryingToScrollBeyondHorizontalEdge =
        (velocityX > 0 && atLeftEdge) || (velocityX < 0 && atRightEdge);
      const tryingToScrollBeyondVerticalEdge =
        (velocityY > 0 && atTopEdge) || (velocityY < 0 && atBottomEdge);

      if (!this.#xBounced && tryingToScrollBeyondHorizontalEdge) {
        const impactVelocityX =
          Math.sign(velocityX) *
          (Math.abs(velocityX) -
            deceleration *
              (Math.abs(velocityX) / velocityHypotenuse) *
              this.#scrollElapsedTime);
        this.bounce({ initialVelocityX: impactVelocityX });
        this.#xBounced = true;
      }
      if (!this.#yBounced && tryingToScrollBeyondVerticalEdge) {
        const impactVelocityY =
          Math.sign(velocityY) *
          (Math.abs(velocityY) -
            deceleration *
              (Math.abs(velocityY) / velocityHypotenuse) *
              this.#scrollElapsedTime);
        this.bounce({ initialVelocityY: impactVelocityY });
        this.#yBounced = true;
      }
    }

    const momentumScrollEvent = new CustomEvent("momentumScroll", {
      bubbles: true,
      cancelable: true,
      detail: this.getEventData(),
    });
    this.#scrollContainer.dispatchEvent(momentumScrollEvent);

    if (
      elapsedTimeRatio < 1 &&
      !atEdgeOfOneDimensionalScroller &&
      !atVertexOfTwoDimensionalScroller
    ) {
      this.#isScrolling = true;
      this.#scrollRafId = requestAnimationFrame((currentTime) => {
        this.scroll(
          { velocityX: velocityX, velocityY: velocityY },
          currentTime,
          deceleration
        );
      });
    } else if (
      elapsedTimeRatio >= 1 ||
      Number.isNaN(elapsedTimeRatio) ||
      atEdgeOfOneDimensionalScroller ||
      atVertexOfTwoDimensionalScroller
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
    if (this.#scrollResolve) this.#scrollResolve(this.getEventData(extraData));

    const momentumScrollStopEvent = new CustomEvent("momentumScrollStop", {
      bubbles: true,
      cancelable: true,
      detail: this.getEventData(extraData),
    });
    this.#scrollContainer.dispatchEvent(momentumScrollStopEvent);

    this.#abortionTimestamp = Date.now();
    cancelAnimationFrame(this.#scrollRafId);
    this.#scrollStartTime = null;
    this.#scrollStartingPointX = null;
    this.#scrollStartingPointY = null;
    this.#scrollDuration = null;
    this.#scrollElapsedTime = null;
    this.#scrollResolve = null;
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
      elapsedTime: this.#scrollElapsedTime,
      scrollContainer: this.#scrollContainer,
      momentumScroller: this,
    };

    if (extraData && typeof extraData === "object")
      Object.assign(eventData, extraData);

    return eventData;
  }

  #bounceRafId;
  #bounceInitialPositionX = 0;
  #bounceInitialPositionY = 0;
  #bounceInitialVelocityX = 0;
  #bounceInitialVelocityY = 0;
  #bounceElapsedTimeX = 0;
  #bounceElapsedTimeY = 0;
  #bounceResolve;
  #bounceStartTimeX;
  #bounceStartTimeY;
  #bounceTimeAtMaximumDisplacment;
  #bounceXIsBouncing;
  #bounceYIsBouncing;
  #bounceXFallingOnly;
  #bounceYFallingOnly;

  getCurrentPositionX() {
    return getTransformProperties(this.#scrollContainer).translateX;
  }
  getCurrentPositionY() {
    return getTransformProperties(this.#scrollContainer).translateY;
  }

  bounce({
    initialVelocityX = 0,
    initialVelocityY = 0,
    damping = NaN,
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

      const currentPositionX = this.getCurrentPositionX();
      const currentPositionY = this.getCurrentPositionY();

      const nothing =
        initialVelocityX === 0 &&
        initialVelocityY === 0 &&
        currentPositionX === 0 &&
        currentPositionY === 0;

      if (nothing) return;

      damping = this.#borderBouncinessLevelToQuantityMap.get(
        this.#borderBouncinessLevel
      );

      this.#bounceTimeAtMaximumDisplacment = 1 / damping;

      this.#bounceXFallingOnly =
        initialVelocityX === 0 && currentPositionX !== 0;
      this.#bounceYFallingOnly =
        initialVelocityY === 0 && currentPositionY !== 0;

      if (!this.#bounceXIsBouncing) {
        if (this.#bounceXFallingOnly) {
          initialVelocityX =
            currentPositionX /
            (this.#bounceTimeAtMaximumDisplacment *
              Math.pow(
                Math.E,
                -1 * damping * this.#bounceTimeAtMaximumDisplacment
              ));
          this.#bounceInitialVelocityX = initialVelocityX / Math.E;
          this.#bounceInitialPositionX =
            this.#bounceInitialVelocityX * this.#bounceTimeAtMaximumDisplacment;
        } else if (!this.#bounceXFallingOnly) {
          this.#bounceInitialVelocityX = initialVelocityX * 0.1;
          this.#bounceInitialPositionX = 0;
        }
        if (this.#bounceInitialVelocityX) this.#bounceXIsBouncing = true;
      }

      if (!this.#bounceYIsBouncing) {
        if (this.#bounceYFallingOnly) {
          initialVelocityY =
            currentPositionY /
            (this.#bounceTimeAtMaximumDisplacment *
              Math.pow(
                Math.E,
                -1 * damping * this.#bounceTimeAtMaximumDisplacment
              ));
          this.#bounceInitialVelocityY = initialVelocityY / Math.E;
          this.#bounceInitialPositionY =
            this.#bounceInitialVelocityY * this.#bounceTimeAtMaximumDisplacment;
        } else if (!this.#bounceYFallingOnly) {
          this.#bounceInitialVelocityY = initialVelocityY * 0.1;
          this.#bounceInitialPositionY = 0;
        }
        if (this.#bounceInitialVelocityY) this.#bounceYIsBouncing = true;
      }

      if (
        this.#bounceXIsBouncing &&
        this.#bounceYIsBouncing &&
        !(this.#bounceXFallingOnly && this.#bounceYFallingOnly)
      )
        return;

      return new Promise((resolve) => {
        this.#bounceResolve = resolve;
        this.#bounceRafId = requestAnimationFrame((currentTime) => {
          this.bounce({
            currentTime: currentTime,
            damping: damping,
          });
        });
      });
    }

    if (this.#bounceInitialVelocityX && !this.#bounceStartTimeX) {
      this.#bounceStartTimeX = currentTime;

      const bounceStartEvent = new CustomEvent("bounceStart", {
        bubbles: true,
        cancelable: true,
        detail: { axis: "x" },
      });
      this.#scrollContainer.dispatchEvent(bounceStartEvent);
    }
    if (this.#bounceInitialVelocityY && !this.#bounceStartTimeY) {
      this.#bounceStartTimeY = currentTime;

      const bounceStartEvent = new CustomEvent("bounceStart", {
        bubbles: true,
        cancelable: true,
        detail: { axis: "y" },
      });
      this.#scrollContainer.dispatchEvent(bounceStartEvent);
    }

    if (this.#bounceStartTimeX)
      this.#bounceElapsedTimeX = currentTime - this.#bounceStartTimeX;
    if (this.#bounceStartTimeY)
      this.#bounceElapsedTimeY = currentTime - this.#bounceStartTimeY;

    const translateX =
      (this.#bounceInitialPositionX +
        this.#bounceInitialVelocityX * this.#bounceElapsedTimeX) /
      Math.pow(Math.E, damping * this.#bounceElapsedTimeX);

    const translateY =
      (this.#bounceInitialPositionY +
        this.#bounceInitialVelocityY * this.#bounceElapsedTimeY) /
      Math.pow(Math.E, damping * this.#bounceElapsedTimeY);

    this.#scrollContainer.style.setProperty(
      "transform",
      `translateX(${translateX}px) translateY(${translateY}px)`
    );

    const xAtEquilibrium =
      !this.#bounceXIsBouncing ||
      (this.#bounceXIsBouncing &&
        this.#bounceElapsedTimeX > this.#bounceTimeAtMaximumDisplacment &&
        Math.abs(translateX) < 1 / (devicePixelRatio * 10));
    const yAtEquilibrium =
      !this.#bounceYIsBouncing ||
      (this.#bounceYIsBouncing &&
        this.#bounceElapsedTimeY > this.#bounceTimeAtMaximumDisplacment &&
        Math.abs(translateY) < 1 / (devicePixelRatio * 10));

    if (!xAtEquilibrium || !yAtEquilibrium) {
      this.#bounceRafId = requestAnimationFrame((currentTime) => {
        this.bounce({
          currentTime: currentTime,
          damping: damping,
        });
      });
    } else if (xAtEquilibrium && yAtEquilibrium) {
      this.#scrollContainer.style.setProperty(
        "transform",
        "translateX(0) translateY(0)"
      );

      return this.abortPriorBounces();
    }
  }

  abortPriorBounces(extraData = {}) {
    if (this.#bounceResolve) this.#bounceResolve(extraData);

    const bounceStopEvent = new CustomEvent("bounceStop", {
      bubbles: true,
      cancelable: true,
      detail: extraData,
    });
    this.#scrollContainer.dispatchEvent(bounceStopEvent);

    cancelAnimationFrame(this.#bounceRafId);
    this.#bounceInitialVelocityX = 0;
    this.#bounceInitialVelocityY = 0;
    this.#bounceXIsBouncing = false;
    this.#bounceYIsBouncing = false;
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
