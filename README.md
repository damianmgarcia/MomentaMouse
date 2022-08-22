# **MomentumScroller**

## **Description**

MomentumScroller is a JavaScript module that provides easy-to-use and customizable momentum scrolling functionality for your website's mouse-users. It allows mouse-users to flick through websites using their mouse as if it were a finger swiping on a touch-screen device. If you would like to see it in action, check out the demos at [damianmgarcia.com](https://damianmgarcia.com).

Also, check out [SmoothScroller](https://github.com/damianmgarcia/SmoothScroller). It is a JavaScript module that provides easy-to-use and customizable smooth scrolling functionality for your website and is designed to work well with MomentumScroller.

## **Features**

- Touch-screen-style scrolling for mouse-users
- Automatic scroller creation
- Easily customize scroll deceleration, border bounciness, cursors, and more.
- Dispatches custom events so your code can easily react

## **Installation**

### [Import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) MomentumScroller:

```javascript
import { MomentumScroller } from "https://damianmgarcia.com/scripts/modules/momentum-scroller.js";
```

## **Usage (Basic)**

### Automatically Create MomentumScrollers:

```javascript
MomentumScroller.autoCreateScrollers();
```

### Manually Create a MomentumScroller:

```javascript
MomentumScroller.createScroller(document.querySelector("body"));
```

Done! Mouse-users will be able to flick through the scroll container as if they were using a touch-screen device.

## **Usage (Advanced)**

Below is a list of all static and instance methods. Most methods allow for [method chaining](https://en.wikipedia.org/wiki/Method_chaining).

Method names are bolded and are followed by a description of the method's function.

If a method has parameters, they are listed in order below the method description. Parameter names are italicized, and if they have a default value, they are also italicized, followed by a description of the parameter's function. Some parameters are options objects.

### **Static** Methods:

- **autoCreateScrollers** — Searches for compatible elements to create MomentumScrollers. It returns the MomentumScroller class.
  - _Options Object:_
    - _rootSelector_ — _":root"_ — A [String](https://developer.mozilla.org/en-US/docs/Glossary/String) representing the [CSS selector](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) that will be used as the starting point in the process of automatically creating MomentumScrollers. The _rootSelector_ itself is included in the process. Ancestors of the _rootSelector_ will not be included.
    - _activateImmediately_ — _true_ — A [Boolean](https://developer.mozilla.org/en-US/docs/Glossary/Boolean) that determines the activation state of MomentumScroller instances after creation. If set to true, instances will be activated after they are created. If set to false, instances will not be activated after they are created.
    - _considerOverflowHiddenAxesNonScrollable_ — _true_ — A [Boolean](https://developer.mozilla.org/en-US/docs/Glossary/Boolean) that determines how _autoCreateScrollers_ handles elements with hidden [overflows](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow). If set to true, the horizontal axis of an element will be considered non-scrollable by the MomentumScroller instance if [overflow-x](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-x) is set to hidden, and the vertical axis of an element will be considered non-scrollable by the MomentumScroller instance if [overflow-y](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-y) is set to hidden. If set to false, the horizontal axis of an element will be considered scrollable by the MomentumScroller instance as long as there is scrollable overflow, and the vertical axis of an element will be considered scrollable by the MomentumScroller instance as long as there is scrollable overflow.
    - _selectorsToIgnore_ — _[ ]_ — An [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) of selectors that the _autoCreateScrollers_ method will refer to when deciding whether to create scrollers. If an element matches one of the selectors in this list, it will not be used to create a MomentumScroller instance.<br><br>
- **createScroller** — Creates a MomentumScroller. It returns a MomentumScroller instance.
  - _scrollContainer_ — The [Element](https://developer.mozilla.org/en-US/docs/Web/API/Element) that should gain MomentumScroller functionality.
  - _Options Object:_
    - _activateImmediately_ — _true_ — A [Boolean](https://developer.mozilla.org/en-US/docs/Glossary/Boolean) that determines the activation state of a MomentumScroller instance after creation. If set to true, an instance will be activated after it is created. If set to false, an instance will not be activated after it is created.<br><br>
- **setSelectorsOfElementsScrollerShouldIgnore** — Sets the selectors that MomentumScroller should ignore. It is like calling the [preventDefault method](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault); if a [pointerdown](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointerdown_event) EventTarget itself or one of its ancestors matches a selector in this list, MomentumScroller will not initiate a momentum scroll. It returns the MomentumScroller class.
  - _selectors_ — _[
    "input[type=email]",
    "input[type=number]",
    "input[type=password]",
    "input[type=range]",
    "input[type=search]",
    "input[type=tel]",
    "input[type=text]",
    "input[type=url]",
    "textarea",
    ]_ — An [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) of selectors that should be ignored by MomentumScroller.
  - _Options Object:_
    - _keepCurrentSelectors_ — _true_ — A [Boolean](https://developer.mozilla.org/en-US/docs/Glossary/Boolean) that determines how new selectors are added. If set to true, the new selectors will be added to the current list of selectors. If set to false, the new selectors will overwrite the current list of selectors.<br><br>
- **setSelectorsOfClickableElements** — Sets the selectors that MomentumScroller should provide wiggle room for so that they can receive click events. This wiggle room ensures that interactive elements can receive clicks while also allowing MomentumScroller to regain control and perform its functions when appropriate. It returns the MomentumScroller class.
  - _selectors_ — _[
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
    ]_ — An [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) of selectors of elements that need to be able to receive click events.
  - _Options Object:_
    - _keepCurrentSelectors_ — _true_ — A [Boolean](https://developer.mozilla.org/en-US/docs/Glossary/Boolean) that determines how new selectors are added. If set to true, the new selectors will be added to the current list of selectors. If set to false, the new selectors will overwrite the current list of selectors.<br><br>
- **setSelectorsOfOtherTouchScrollers** — Sets the selectors that MomentumScroller should provide wiggle room for so that they can perform their own touch-scrolling-like functionality. This wiggle room ensures that they can scroll as intended while also allowing MomentumScroller to regain control and perform its functions when appropriate. It returns the MomentumScroller class.
  - _selectors_ — _[ ]_ — An [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) of selectors of elements that have touch-scrolling-like functionality similar to MomentumScroller.
  - _Options Object:_
    - _keepCurrentSelectors_ — _true_ — A [Boolean](https://developer.mozilla.org/en-US/docs/Glossary/Boolean) that determines how new selectors are added. If set to true, the new selectors will be added to the current list of selectors. If set to false, the new selectors will overwrite the current list of selectors.<br><br>
- **getScroller** — Gets and returns a MomentumScroller instance if found, which gives you access to its methods; Otherwise, returns undefined.
  - _scrollContainer_ — The [Element](https://developer.mozilla.org/en-US/docs/Web/API/Element) that has MomentumScroller functionality.<br><br>
- **getAllScrollers** — Gets and returns an [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) of all MomentumScroller instances. The [_forEach_ method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach) may then be called to perform batch operations.

### **Instance** Methods:

- **getScrollerData** — Gets and returns an [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#objects) containing the following instance properties: active, scrollContainer, scrollableAxes, scrolling.<br><br>
- **setDecelerationLevel** — Sets the deceleration of momentum scrolls. It returns the MomentumScroller instance.
  - _decelerationLevel_ — _"medium"_ — A [String](https://developer.mozilla.org/en-US/docs/Glossary/String) representing the deceleration level, which may be any of the following values: "none", "minimum", "low", "medium", "high", or "maximum".<br><br>
- **setBorderBouncinessLevel** — Sets the bounciness of borders impacted by momentum scrolls. It returns the MomentumScroller instance.
  - _borderBouncinessLevel_ — _"medium"_ — A [String](https://developer.mozilla.org/en-US/docs/Glossary/String) representing the border bounciness level, which may be any of the following values: "none", "minimum", "low", "medium", "high", or "maximum".<br><br>
- **setGrabCursor** — Sets the [grab cursor](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor). It returns the MomentumScroller instance.
  - _grabCursor_ — _"grab"_ — A [String](https://developer.mozilla.org/en-US/docs/Glossary/String) representing the [grab cursor](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor).<br><br>
- **setGrabbingCursor** — Sets the [grabbing cursor](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor). It returns the MomentumScroller instance.
  - _grabbingCursor_ — _"grabbing"_ — A [String](https://developer.mozilla.org/en-US/docs/Glossary/String) representing the [grabbing cursor](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor).<br><br>
- **setAllowCursorSwitching** — Sets whether the MomentumScroller instance is allowed to switch cursors on [pointerdown](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointerdown_event) and [pointerup](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointerup_event) events. It returns the MomentumScroller instance.
  - _allowCursorSwitching_ — _true_ — A [Boolean](https://developer.mozilla.org/en-US/docs/Glossary/Boolean) that determines the cursor-switching function of the MomentumScroller instance. If set to true, the instance will switch the cursor to the grabbing cursor on pointerdown events and switch the cursor to the grab cursor on pointerup events. If set to false, the instance will not switch cursors. Switching cursors triggers [reflow](https://developer.mozilla.org/en-US/docs/Glossary/Reflow), which may cause performance issues.<br><br>
- **setAllowHorizontalScrolling** — Sets whether the MomentumScroller instance is allowed to scroll horizontally. It returns the MomentumScroller instance.
  - _allowHorizontalScrolling_ — _true_ — A [Boolean](https://developer.mozilla.org/en-US/docs/Glossary/Boolean) that determines the scrollability of a MomentumScroller instance's horizontal axis. If set to true, the instance will be able to perform momentum scrolls on the vertical axis if the vertical axis is scrollable. If set to false, the instance will not be able to perform scrolls on the vertical axis.<br><br>
- **setAllowVerticalScrolling** — Sets whether the MomentumScroller instance is allowed to scroll vertically. It returns the MomentumScroller instance.
  - _allowVerticalScrolling_ — _true_ — A [Boolean](https://developer.mozilla.org/en-US/docs/Glossary/Boolean) that determines the scrollability of a MomentumScroller instance's vertical axis. If set to true, the instance will be able to perform momentum scrolls on the horizontal axis if the horizontal axis is scrollable. If set to false, the instance will not be able to perform scrolls on the horizontal axis.<br><br>
- **activate** — Allows the MomentumScroller instance to perform momentum scrolls. To function properly, it changes the CSS cursor, disallows text selection, and disallows dragging. It returns the MomentumScroller instance.<br><br>
- **deactivate** — Blocks the MomentumScroller instance from performing momentum scrolls. It reverts the CSS cursor, allows text selection, and allows dragging. It returns the MomentumScroller instance.<br><br>
- **toggleActivation** — Toggles the MomentumScroller instance's activation state. It returns the MomentumScroller instance.

## **Events**

Below is a list of all [CustomEvents](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent) dispatched by MomentumScroller. You can listen for them with the [addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener) method.

Event names are bolded and are followed by a description of the trigger that leads to their dispatch.

If an event includes custom properties in the [CustomEvent details object](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail), they are listed below the event description. Custom property names are italicized and are followed by a description.

### **Static** Events:

- **momentumScrollerPointerRoute** — Dispatches when MomentumScroller selects an [EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget) to be the handler of [PointerEvents](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent). The EventTarget may be the scroll container of a MomentumScroller instance, or may match one of the selectors in the _selectorsOfClickableElements_ or _selectorsOfOtherTouchScrollers_ lists.
  - _pointerEvent_ — A [PointerEvent](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent), which is meant for processing by the _routeTo_ EventTarget. If there are no nested EventTargets of interest, it is simply a [pointerdown event](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointerdown_event). If there are nested EventTargets of interest and a threshold test is performed, it will be a [pointermove event](https://developer.mozilla.org/en-US/docs/Web/API/Document/pointermove_event), which provides the last known coordinates of the pointer so that the _routeTo_ EventTarget can smoothly transition into handling the event.
  - _routeTo_ — The EventTarget that MomentumScroller selected to be the handler of PointerEvents.
  - _routeFrom_ — The EventTarget which had previously been selected by MomentumScroller to be the handler of PointerEvents before a threshold test was performed, but is now giving up its handling of PointerEvents to the new _routeTo_ EventTarget after completion of a threshold test.

### **Instance** Events:

- **momentumScrollerActivate** — Dispatches when a MomentumScroller instance is activated
  - _scrollContainer_ — The MomentumScroller instance's scroll container
  - _initialVelocityX_ — The initial pointer velocity on the x axis
  - _initialVelocityY_ — The initial pointer velocity on the y axis
  - _initialVelocity_ — The hypotenuse of the initial pointer velocities
  - _startPoint_ — The pointer's starting coordinates
  - _endPoint_ — The pointer's ending coordinates
  - _distance_ — The distance scrolled after the pointerup event
  - _elapsedTime_ — The elapsed time of the scroll
  - _interruptedBy_ — The cause of a scroll's interruption if it was interrupted; Otherwise, null<br><br>
- **momentumScrollerDeactivate** — Dispatches when a MomentumScroller instance is deactivated
  - Same as momentumScrollerActivate<br><br>
- **momentumScrollerPointerHandlingStart** — Dispatches when a MomentumScroller instance gets control of the pointer
  - Same as momentumScrollerActivate<br><br>
- **momentumScrollerPointerHandlingStop** — Dispatches when a MomentumScroller instance loses control of the pointer
  - Same as momentumScrollerActivate<br><br>
- **momentumScrollerScrollStart** — Dispatches at the beginning of a momentum scroll
  - Same as momentumScrollerActivate<br><br>
- **momentumScrollerScroll** — Dispatches continuously while momentum scrolling
  - Same as momentumScrollerActivate<br><br>
- **momentumScrollerScrollStop** — Dispatches at the end of a momentum scroll
  - Same as momentumScrollerActivate<br><br>
- **momentumScrollerBounceStart** — Dispatches at the beginning of a bounce
  - _scrollContainer_ — The MomentumScroller instance's scroll container
  - _startTimeX_ — The timestamp at the moment the momentum scroll impacted a border on the x axis
  - _startTimeY_ — The timestamp at the moment the momentum scroll impacted a border on the y axis
  - _initialVelocityX_ — The velocity of the momentum scroll at the moment it impacted a border on the x axis
  - _initialVelocityY_ — The velocity of the momentum scroll at the moment it impacted a border on the y axis
  - _elapsedTimeX_ — The elapsed time of the bounce that occurred on the x axis
  - _elapsedTimeY_ — The elapsed time of the bounce that occurred on the y axis
  - _interruptedBy_ — The cause of a bounce's interruption if it was interrupted; Otherwise, null<br><br>
- **momentumScrollerBounceStop** — Dispatches when a bounce stops
  - Same as momentumScrollerBounceStart
