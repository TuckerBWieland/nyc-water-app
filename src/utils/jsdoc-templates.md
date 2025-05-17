# JSDoc Templates for NYC Water App

This file contains standardized JSDoc templates for use throughout the codebase.

## Vue Component Template

```js
/**
 * @component ComponentName
 * @description Brief description of what the component does
 * 
 * @example
 * <template>
 *   <ComponentName :prop1="value" @event="handler" />
 * </template>
 * 
 * @displayName ComponentName (for Vue DevTools)
 */
```

## Props Documentation Template

```js
/**
 * @prop {Type} propName - Description of the prop
 * @default defaultValue - Optional default value information
 */
```

## Event Documentation Template

```js
/**
 * @event eventName - Description of the event
 * @property {Type} propertyName - Description of a property in the event payload
 */
```

## Method Documentation Template

```js
/**
 * Brief description of what the method does
 * 
 * @param {Type} paramName - Description of the parameter
 * @returns {ReturnType} Description of the return value
 * @throws {ErrorType} Description of when this error is thrown
 */
```

## Composable Function Template

```js
/**
 * @composable useName
 * @description Brief description of what the composable does
 * 
 * @param {Type} options - Configuration options
 * @returns {Object} Returned reactive state and methods
 * @property {Type} returnProperty - Description of a returned property
 * 
 * @example
 * const { prop1, method1 } = useName({ option1: value })
 */
```

## Type Documentation Template

```js
/**
 * @typedef {Object} TypeName
 * @property {Type} propertyName - Description of the property
 * @property {Type} [optionalProperty] - Description of an optional property
 */
```

## Interface Documentation Template

```js
/**
 * Description of the interface
 * 
 * @interface InterfaceName
 * @property {Type} propertyName - Description of the property
 * @property {Type} [optionalProperty] - Description of an optional property
 */
```

## Enum Documentation Template

```js
/**
 * @enum {Type}
 * @readonly
 */
const EnumName = {
  /** Description of OPTION1 */
  OPTION1: 'value1',
  /** Description of OPTION2 */
  OPTION2: 'value2',
}
```