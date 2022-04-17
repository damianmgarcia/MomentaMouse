# **MomentumScroller**

## **Description**

MomentumScroller is a JavaScript module that provides advanced, easy-to-use momentum scrolling functionality for your website's mouse-users. It allows mouse-users to flick through websites exactly as they would on touch-screen devices. You can easily customize the grab and grabbing cursors, the scroll deceleration rate, and more. If you would like to see it in action, check out the demos at [damianmgarcia.com](https://damianmgarcia.com).

Also, check out [SmoothScroller](https://github.com/damianmgarcia/SmoothScroller). It is JavaScript module that provides advanced, easy-to-use smooth scrolling functionality for your website and is designed to work well with MomentumScroller.

## **Features**

- Touch-Screen-Style Momentum Scrolling on Non-Touch-Screen Devices
- Customizable Scroll Deceleration Rates
- Customizable Grab and Grabbing Cursors
- Toggle On and Off
- Events
- Promise-Based

## **Installation**

### [Import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) the MomentumScroller module:

```javascript
import { MomentumScroller } from "https://damianmgarcia.com/scripts/modules/momentum-scroller.js";
```

## **Usage**

### Instantiate a MomentumScroller:

```javascript
const momentumScrollerInstance = new MomentumScroller(
  document.querySelector("body")
);
```

### Activate it:

```javascript
momentumScrollerInstance.activate();
```

That's it! After activation, mouse-users will be able to flick through the scroll container as if they were using a touch-screen device.

If necessary, you may also deactivate or toggle the activation state of a MomentumScroller.

### Deactivate a MomentumScroller:

```javascript
momentumScrollerInstance.deactivate();
```

### Toggle Activation State of a MomentumScroller:

```javascript
momentumScrollerInstance.toggleOnOff();
```

## **Customization**

There are a number of setters available to customize MomentumScroller instances. The setters are chainable and may be used during or after instantiation.

### Setters:

- **setGrabCursor()** — _string_ — The desired [CSS cursor](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor) for grab _(default: "grab")_
- **setGrabbingCursor()** — _string_ — The desired [CSS cursor](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor) for grabbing _(default: "grabbing")_
- **setDeceleration()** — _string_ — The desired deceleration rate _(default: "medium")_
- **setStopScrollOnPointerDown()** — _boolean_ — The desired behavior on scroll container pointerdown events _(default: true)_
- **setPreventDefaultSelectors()** — _array_ — The list of [CSS selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) that the scroller should prevent default behavior on, i.e. not handle input on _(default: [])_
- **setDecelerationMap()** — _map_ — The deceleration [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) that maps string keys to number values _(default: new Map([
  ["zero", 0],
  ["low", 0.0001875],
  ["medium", 0.00075],
  ["high", 0.006],
  ["infinite", Infinity],
  ]))_

### Example of Using Setters to Customize a MomentumScroller:

```javascript
const momentumScrollerInstance = new MomentumScroller(
  document.querySelector("body")
)
  .setGrabCursor("var(--custom-grab-cursor)")
  .setGrabbingCursor("var(--custom-grabbing-cursor)")
  .setPreventDefaultSelectors(["header", "textarea"])
  .activate();
```

## **Events**

### Event Types:

- **momentumScrollActivate** — Dispatches when a momentum scroller is activated
- **momentumScrollDeactivate** — Dispatches when a momentum scroller is deactivated
- **momentumScrollPointerDown** — Dispatches on scroll container pointerdown events
- **momentumScrollPointerUp** — Dispatches on scroll container pointerup events
- **momentumScrollStart** — Dispatches when a momentum scroll starts
- **momentumScroll** — Dispatches continuously while momentum scrolling
- **momentumScrollStop** — Dispatches when a momentum scroll stops

### Event Data:

- **interruptedBy** — The cause of a scroll's interruption if it was interrupted; otherwise, null.
- **startPoint** — The starting coordinates
- **endPoint** — The ending coordinates
- **distance** — The total scroll distance
- **duration** — The duration of the scroll if it were not limited by the size of the scroll container
- **elapsedTime** — The elapsed time of the scroll
- **scrollContainer** — Reference to the scroll container
- **momentumScroller** — Reference to the instance

### Example of Listening to MomentumScroller Events:

```javascript
document.addEventListener("momentumScrollActivate", (event) => {
  const scrollData = event.detail; // CustomEvent data is located in event.detail
  if (scrollData.scrollContainer === document.querySelector("body")) {
    // Do something
  }
});
```

## **Promise**

The momentum scroll method returns a promise that resolves upon scroll completion, and the promise includes the same data as the event data above.

## **Miscellaneous**

### The isScrolling Property:

An instance's <code>isScrolling</code> property tells you if it is scrolling or not

```javascript
if (momentumScrollerInstance.isScrolling) {
  // Do something
}
```

### The MomentumScroller Map:

The static property, <code>MomentumScroller.scrollerMap</code>, is a map of scroll containers mapped to their instances. Since it is a JavaScript [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) object, you can use any of the available methods that Map provides.

Since the map is iterable, one of many potential uses could be to iterate through all scrollers and toggle them on or off simultaneously:

```javascript
MomentumScroller.scrollerMap.forEach((momentumScroller) =>
  momentumScroller.toggleOnOff()
);
```

### Pause and Unpause Methods:

The <code>pause()</code> method is useful when you want to temporarily pause most of the MomentumScroller's handling of a pointerdown event to allow some other element to manage the pointerdown event, but still allow the MomentumScroller to keep track of pointer position. This ensures a smooth transition back to the MomentumScroller when it is unpaused with the <code>unpause()</code> method.

For an example of this effect, please visit [damianmgarcia.com](https://damianmgarcia.com). Click and hold on a link or video and, while holding, move your mouse cursor up or down until you see the link or video smoothly relinquish its control of the pointer to the momentum scroller.
