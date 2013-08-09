<a href="http://promises-aplus.github.com/promises-spec">
    <img src="http://promises-aplus.github.com/promises-spec/assets/logo-small.png"
         align="right" alt="Promises/A+ logo" />
</a>
[![Build Status](https://travis-ci.org/kaerus-component/uP.png)](https://travis-ci.org/kaerus-component/uP)

# microPromises

#API
  - [uP()](#up)
  - [o.then()](#othenonfulfillfunctiononrejectfunction)
  - [o.fulfill()](#ofulfillvalueobject)
  - [o.reject()](#orejectreasonobject)
  - [o.resolved()](#oresolved)
  - [o.status()](#ostatus)
  - [o.defer()](#odeferprocfunction)
  - [o.spread()](#ospreadonfulfillfunctiononrejectfunction)
  - [o.timeout()](#otimeouttimenumbercallbackfunction)

## uP(o:Object)

  Initializes and returns a promise.
  Provide an object to mixin the features.

## o.then(onFulfill:Function, onReject:Function)

  Attaches callback/errback handlers and returns a new promise

## o.fulfill(value:Object)

  Fulfills a promise with a value

## o.reject(reason:Object)

  Rejects promise with a reason

## o.resolved()

  Returns the resolved value

## o.status()

  Return the current state

## o.defer(proc:Function)

  Defer a process which can return a promise

## o.spread(onFulfill:Function, onReject:Function)

  Spread can be use instead of then() to get multiple arguments if fulfillment/rejected value is an array

## o.timeout(time:Number, callback:Function)

  Timeout a pending promise and invoke callback function on timeout. if no callback has been specified it throws a RangeError('exceeded timeout') exception error on timeout.
