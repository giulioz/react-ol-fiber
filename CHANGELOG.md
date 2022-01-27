# react-ol-fiber

## 3.0.0

### Major Changes

- 32602d9: Renamed primitive to olPrimitive

### Minor Changes

- d47967f: Added (very hacky) support for render functions using `<olFn />` component

## 2.2.2

### Patch Changes

- 8a03938: Fixed a bug when using Supense inside the reconciler

## 2.2.1

### Patch Changes

- 6046e9c: Hack for instance recreation with spring applyProps

## 2.2.0

### Minor Changes

- 60bb479: Added react-spring support

## 2.1.0

### Minor Changes

- f98e503: Automatically call changed if available

## 2.0.0

### Major Changes

- 60196f6: BREAKING: Splitted args for native elements into args and arg. While args now takes always an array, arg can take the first object parameter.

## 1.1.1

### Patch Changes

- 1037b49: Updated internal deps

## 1.1.0

### Minor Changes

- 8ba0424: Added a `<OLPrimitive />` wrapper for primitives to maintain the correct type using generics

### Patch Changes

- 64437d8: Fixed correct target type in event handlers, now it will have the correct type for all events

## 1.0.0

### Major Changes

- b56bf79: Manual typings for some event handlers. Now using any cast on the event parameter is not necessary anymore.

## 0.4.0

### Minor Changes

- 90c5337: Added support for controls:

  ```
  <MapComponent>
     <zoomControl />
     <attributionControl />
  </MapComponent>
  ```

## 0.3.2

### Patch Changes

- 30dc50d: Updated dependencies

## 0.3.1

### Patch Changes

- 6615d99: Removed useless files from NPM

## 0.3.0

### Minor Changes

- d9a333f: Fixed JSX intrisics clashing for `<view />`, now it's callable using `<olView />`

## 0.2.0

### Minor Changes

- d194b16: Allow attachAdd to use setters
- cb62a44: Detect attach automatically in primitives

### Patch Changes

- 8a4634b: Fixed getImmutableChildren with components and attach prop priority

## 0.1.0

### Minor Changes

- f17dc72: Support for immutable objects re-creation

## 0.0.5

### Patch Changes

- Fixed style attach prop behaviour

## 0.0.4

### Patch Changes

- Add support for styles

## 0.0.3

### Patch Changes

- Add support for geometries
- Now features doesn't need the attach prop anymore

## 0.0.2

### Patch Changes

- Reduced package size.

## 0.0.1

### Major Changes

- Initial alpha publish to npm.
