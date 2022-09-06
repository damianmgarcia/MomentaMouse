# **MomentaMouse**

## **Description**

MomentaMouse enables mouse-users to use touch-style scrolling and flicking gestures to navigate websites. Web developers interested in this functionality simply need to import the module to begin automatically or manually creating MomentaMouse scrollers.

If you would like to see it in action, check out [its demo page](https://damianmgarcia.com/momenta-mouse/index.html) as well as the demos at [damianmgarcia.com](https://damianmgarcia.com).

Also, check out [SmoothScroller](https://github.com/damianmgarcia/SmoothScroller). It is a JavaScript module that provides easy-to-use and customizable smooth scrolling functionality for your website and is designed to work well with MomentaMouse.

## **Features**

- Touch-style scrolling and flicking gestures for mouse-users
- Automatic scroller creation
- Easily customize scroll deceleration, border bounciness, cursors, and more.
- Dispatches custom events so your code can easily react

## **Installation**

### [Import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) MomentaMouse:

```javascript
import { MomentaMouse } from "https://damianmgarcia.com/scripts/modules/momenta-mouse.js";
```

## **Usage (Basic)**

### Automatically Create MomentaMouse Scrollers:

```javascript
MomentaMouse.autoCreateScrollers();
```

### Manually Create a MomentaMouse Scroller:

```javascript
MomentaMouse.createScroller(document.querySelector("body"));
```

## **Usage (Advanced)**

Below is a list of all static and instance methods. Most methods allow for [method chaining](https://en.wikipedia.org/wiki/Method_chaining).

Method names are bolded and are followed by a description of the method's function.

If a method has parameters, they are listed in order below the method description. Parameter names are italicized, and if they have a default value, they are also italicized, followed by a description of the parameter's function. Some parameters are options objects.

### **Static** Methods:

- **autoCreateScrollers** — Searches for compatible elements to create MomentaMouse Scrollers. It returns the MomentaMouse class.
  - _Options Object:_
    - _rootSelector_ — _":root"_ — A [String](https://developer.mozilla.org/en-US/docs/Glossary/String) representing the [CSS selector](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) that will be used as the starting point in the process of automatically creating MomentaMouse Scrollers. The _rootSelector_ itself is included in the process. Ancestors of the _rootSelector_ will not be included.
    - _activateImmediately_ — _true_ — A [Boolean](https://developer.mozilla.org/en-US/docs/Glossary/Boolean) that determines the activation state of MomentaMouse instances after creation. If set to true, instances will be activated after they are created. If set to false, instances will not be activated after they are created.
    - _considerOverflowHiddenAxesNonScrollable_ — _true_ — A [Boolean](https://developer.mozilla.org/en-US/docs/Glossary/Boolean) that determines how _autoCreateScrollers_ handles elements with hidden [overflows](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow). If set to true, the horizontal axis of an element will be considered non-scrollable by the MomentaMouse instance if [overflow-x](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-x) is set to hidden, and the vertical axis of an element will be considered non-scrollable by the MomentaMouse instance if [overflow-y](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-y) is set to hidden. If set to false, the horizontal axis of an element will be considered scrollable by the MomentaMouse instance as long as there is scrollable overflow, and the vertical axis of an element will be considered scrollable by the MomentaMouse instance as long as there is scrollable overflow.
    - _selectorsToIgnore_ — _[ ]_ — An [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) of selectors that the _autoCreateScrollers_ method will refer to when deciding whether to create scrollers. If an element matches one of the selectors in this list, it will not be used to create a MomentaMouse instance.<br><br>
- **createScroller** — Creates a MomentaMouse. It returns a MomentaMouse instance.
  - _scrollContainer_ — The [Element](https://developer.mozilla.org/en-US/docs/Web/API/Element) that should gain MomentaMouse functionality.
  - _Options Object:_
    - _activateImmediately_ — _true_ — A [Boolean](https://developer.mozilla.org/en-US/docs/Glossary/Boolean) that determines the activation state of a MomentaMouse instance after creation. If set to true, an instance will be activated after it is created. If set to false, an instance will not be activated after it is created.<br><br>
- **setAllowQuickToggleKey** — Sets whether MomentaMouse temporarily deactivates instances in response to holding down the quick toggle key, which is the Ctrl key. This temporary deactivation allows users to highlight and drag text, images, and links. It returns the MomentaMouse class.
  - _allowQuickToggleKey_ — _true_ — A [Boolean](https://developer.mozilla.org/en-US/docs/Glossary/Boolean) that determines how MomentaMouse will respond when the quick toggle key is held down. If set to true, all MomentaMouse instances will be deactivated when the quick toggle key is held down, and then reactivated when the key is let go. If set to false, MomentaMouse will not deactivate instances when the quick toggle key is held down.<br><br>
- **setSelectorsOfElementsScrollerShouldIgnore** — Sets the selectors that MomentaMouse should ignore. It is like calling the [preventDefault method](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault); if a [pointerdown](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointerdown_event) EventTarget itself or one of its ancestors matches a selector in this list, MomentaMouse will not initiate a momentum scroll. It returns the MomentaMouse class.
  - _selectors_ — _[
    "input[type=email]",
    "input[type=number]",
    "input[type=password]",
    "input[type=range]",
    "input[type=search]",
    "input[type=tel]",
    "input[type=text]",
    "input[type=url]",
    "select",
    "textarea",
    ]_ — An [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) of selectors that should be ignored by MomentaMouse.
  - _Options Object:_
    - _keepCurrentSelectors_ — _true_ — A [Boolean](https://developer.mozilla.org/en-US/docs/Glossary/Boolean) that determines how new selectors are added. If set to true, the new selectors will be added to the current list of selectors. If set to false, the new selectors will overwrite the current list of selectors.<br><br>
- **setSelectorsOfClickableElements** — Sets the selectors that MomentaMouse should provide wiggle room for so that they can receive click events. This wiggle room ensures that interactive elements can receive clicks while also allowing MomentaMouse to regain control and perform its functions when appropriate. It returns the MomentaMouse class.
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
- **setSelectorsOfOtherTouchScrollers** — Sets the selectors that MomentaMouse should provide wiggle room for so that they can perform their own touch-scrolling-like functionality. This wiggle room ensures that they can scroll as intended while also allowing MomentaMouse to regain control and perform its functions when appropriate. It returns the MomentaMouse class.
  - _selectors_ — _[ ]_ — An [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) of selectors of elements that have touch-scrolling-like functionality similar to MomentaMouse.
  - _Options Object:_
    - _keepCurrentSelectors_ — _true_ — A [Boolean](https://developer.mozilla.org/en-US/docs/Glossary/Boolean) that determines how new selectors are added. If set to true, the new selectors will be added to the current list of selectors. If set to false, the new selectors will overwrite the current list of selectors.<br><br>
- **getScroller** — Gets and returns a MomentaMouse instance if found, which gives you access to its methods; Otherwise, returns undefined.
  - _scrollContainer_ — The [Element](https://developer.mozilla.org/en-US/docs/Web/API/Element) that has MomentaMouse functionality.<br><br>
- **getAllScrollers** — Gets and returns an [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) of all MomentaMouse instances. The [_forEach_ method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach) may then be called to perform batch operations.

### **Instance** Methods:

- **getScrollerData** — Gets and returns an [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#objects) containing the following instance properties: active, isCurrentlyHandlingPointer, scrollContainer, scrollableAxes, scrolling.<br><br>
- **setDecelerationLevel** — Sets the deceleration of momentum scrolls. It returns the MomentaMouse instance.
  - _decelerationLevel_ — _"medium"_ — A [String](https://developer.mozilla.org/en-US/docs/Glossary/String) representing the deceleration level, which may be any of the following values: "none", "minimum", "low", "medium", "high", or "maximum".<br><br>
- **setBorderBouncinessLevel** — Sets the bounciness of borders impacted by momentum scrolls. It returns the MomentaMouse instance.
  - _borderBouncinessLevel_ — _"medium"_ — A [String](https://developer.mozilla.org/en-US/docs/Glossary/String) representing the border bounciness level, which may be any of the following values: "none", "minimum", "low", "medium", "high", or "maximum". Bouncing and overscroll effects are accomplished with CSS transforms, and therefore any value other than "none" will add a CSS transform declaration to the _scrollContainer_. Keep in mind that an element with a transform declaration value other than "none" will become a [containing block](https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block) for descendant elements that have [position](https://developer.mozilla.org/en-US/docs/Web/CSS/position) values of absolute or fixed. For fixed-position descendant elements, this means they will become fixed to the containing block rather than the viewport.<br><br>
- **setGrabCursor** — Sets the [grab cursor](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor). It returns the MomentaMouse instance.
  - _grabCursor_ — _"grab"_ — A [String](https://developer.mozilla.org/en-US/docs/Glossary/String) representing the [grab cursor](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor).<br><br>
- **setGrabbingCursor** — Sets the [grabbing cursor](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor). It returns the MomentaMouse instance.
  - _grabbingCursor_ — _"grabbing"_ — A [String](https://developer.mozilla.org/en-US/docs/Glossary/String) representing the [grabbing cursor](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor).<br><br>
- **setAllowCursorSwitching** — Sets whether the MomentaMouse instance is allowed to switch cursors on [pointerdown](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointerdown_event) and [pointerup](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointerup_event) events. It returns the MomentaMouse instance.
  - _allowCursorSwitching_ — _true_ — A [Boolean](https://developer.mozilla.org/en-US/docs/Glossary/Boolean) that determines the cursor-switching function of the MomentaMouse instance. If set to true, the instance will switch the cursor to the grabbing cursor on pointerdown events and switch the cursor to the grab cursor on pointerup events. If set to false, the instance will not switch cursors. Switching cursors triggers [reflow](https://developer.mozilla.org/en-US/docs/Glossary/Reflow), which may cause performance issues.<br><br>
- **setAllowHorizontalScrolling** — Sets whether the MomentaMouse instance is allowed to scroll horizontally. It returns the MomentaMouse instance.
  - _allowHorizontalScrolling_ — _true_ — A [Boolean](https://developer.mozilla.org/en-US/docs/Glossary/Boolean) that determines the scrollability of a MomentaMouse instance's horizontal axis. If set to true, the instance will be able to perform momentum scrolls on the vertical axis if the vertical axis is scrollable. If set to false, the instance will not be able to perform scrolls on the vertical axis.<br><br>
- **setAllowVerticalScrolling** — Sets whether the MomentaMouse instance is allowed to scroll vertically. It returns the MomentaMouse instance.
  - _allowVerticalScrolling_ — _true_ — A [Boolean](https://developer.mozilla.org/en-US/docs/Glossary/Boolean) that determines the scrollability of a MomentaMouse instance's vertical axis. If set to true, the instance will be able to perform momentum scrolls on the horizontal axis if the horizontal axis is scrollable. If set to false, the instance will not be able to perform scrolls on the horizontal axis.<br><br>
- **activate** — Allows the MomentaMouse instance to perform momentum scrolls. To function properly, it changes the CSS cursor, disallows text selection, and disallows dragging. It returns the MomentaMouse instance.<br><br>
- **deactivate** — Blocks the MomentaMouse instance from performing momentum scrolls. It reverts the CSS cursor, allows text selection, and allows dragging. It returns the MomentaMouse instance.<br><br>
- **toggleActivation** — Toggles the MomentaMouse instance's activation state. It returns the MomentaMouse instance.

## **Events**

Below is a list of all [CustomEvents](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent) dispatched by MomentaMouse. You can listen for them with the [addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener) method.

Event names are bolded and are followed by a description of the trigger that leads to their dispatch.

If an event includes custom properties in the [CustomEvent details object](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail), they are listed below the event description. Custom property names are italicized and are followed by a description.

### **Static** Events:

- **momentaMouseScrollerPointerRoute** — Dispatches when MomentaMouse selects an [EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget) to be the handler of [PointerEvents](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent). The EventTarget may be the scroll container of a MomentaMouse instance, or may match one of the selectors in the _selectorsOfClickableElements_ or _selectorsOfOtherTouchScrollers_ lists.
  - _pointerEvent_ — A [PointerEvent](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent), which is meant for processing by the _routeTo_ EventTarget. If there are no nested EventTargets of interest, it is simply a [pointerdown event](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointerdown_event). If there are nested EventTargets of interest and a threshold test is performed, it will be a [pointermove event](https://developer.mozilla.org/en-US/docs/Web/API/Document/pointermove_event), which provides the last known coordinates of the pointer so that the _routeTo_ EventTarget can smoothly transition into handling the event.
  - _routeTo_ — The EventTarget that MomentaMouse selected to be the handler of PointerEvents.
  - _routeFrom_ — The EventTarget which had previously been selected by MomentaMouse to be the handler of PointerEvents before a threshold test was performed, but is now giving up its handling of PointerEvents to the new _routeTo_ EventTarget after completion of a threshold test.

### **Instance** Events:

- **momentaMouseScrollerActivate** — Dispatches when a MomentaMouse instance is activated
  - _scrollContainer_ — The MomentaMouse instance's scroll container
  - _initialVelocityX_ — The initial pointer velocity on the x axis
  - _initialVelocityY_ — The initial pointer velocity on the y axis
  - _initialVelocity_ — The hypotenuse of the initial pointer velocities
  - _startPoint_ — The pointer's starting coordinates
  - _endPoint_ — The pointer's ending coordinates
  - _distance_ — The distance scrolled after the pointerup event
  - _elapsedTime_ — The elapsed time of the scroll
  - _interruptedBy_ — The cause of a scroll's interruption if it was interrupted; Otherwise, null<br><br>
- **momentaMouseScrollerDeactivate** — Dispatches when a MomentaMouse instance is deactivated
  - Same as momentaMouseScrollerActivate<br><br>
- **momentaMouseScrollerPointerHandlingStart** — Dispatches when a MomentaMouse instance gets control of the pointer
  - Same as momentaMouseScrollerActivate<br><br>
- **momentaMouseScrollerPointerHandlingStop** — Dispatches when a MomentaMouse instance loses control of the pointer
  - Same as momentaMouseScrollerActivate<br><br>
- **momentaMouseScrollerScrollStart** — Dispatches at the beginning of a momentum scroll
  - Same as momentaMouseScrollerActivate<br><br>
- **momentaMouseScrollerScroll** — Dispatches continuously while momentum scrolling
  - Same as momentaMouseScrollerActivate<br><br>
- **momentaMouseScrollerScrollStop** — Dispatches at the end of a momentum scroll
  - Same as momentaMouseScrollerActivate<br><br>
- **momentaMouseScrollerBounceStart** — Dispatches at the beginning of a bounce
  - _scrollContainer_ — The MomentaMouse instance's scroll container
  - _startTimeX_ — The timestamp at the moment the momentum scroll impacted a border on the x axis
  - _startTimeY_ — The timestamp at the moment the momentum scroll impacted a border on the y axis
  - _initialVelocityX_ — The velocity of the momentum scroll at the moment it impacted a border on the x axis
  - _initialVelocityY_ — The velocity of the momentum scroll at the moment it impacted a border on the y axis
  - _elapsedTimeX_ — The elapsed time of the bounce that occurred on the x axis
  - _elapsedTimeY_ — The elapsed time of the bounce that occurred on the y axis
  - _interruptedBy_ — The cause of a bounce's interruption if it was interrupted; Otherwise, null<br><br>
- **momentaMouseScrollerBounceStop** — Dispatches when a bounce stops
  - Same as momentaMouseScrollerBounceStart
