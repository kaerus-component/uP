<a href="http://promises-aplus.github.com/promises-spec">
    <img src="http://promises-aplus.github.com/promises-spec/assets/logo-small.png"
         align="right" alt="Promises/A+ logo" />
</a>
[![Build Status](https://travis-ci.org/kaerus-component/uP.png)](https://travis-ci.org/kaerus-component/uP)




<!-- Start index.js -->

## micro Promise

Provides A+ compliant promises with some extras.   

## uP(object)

@class uP

### Params: 

* **Object** *object* to mixin

### Return:

* **Object** with promise features

## async

@method async 

### Params: 

* **Function** *func* alias for setImmediate 

## then(onFulfill, onReject)

@method  then 

### Params: 

* **Function** *onFulfill* callback

* **Function** *onReject* errback 

### Return:

* **Object** promise

## fulfill(value)

@method fulfill 

### Params: 

* **Object** *value* fullfillment value

### Return:

* **Object** promise

## reject(reason)

@method reject 

### Params: 

* **Object** *reason* rejection value 

### Return:

* **Object** promise

## resolved()

@method resolved  

### Return:

* **Object** resolved value

## status()

@method status  

### Return:

* **String** 'pending','fulfilled','rejected'

## defer(proc)

@method defer 

### Params: 

* **Function** *proc* defers process execution 

### Return:

* **Object** promise

## spread(onFulfill, onReject)

@method spread 

### Params: 

* **Function** *onFulfill* callback with multiple arguments

* **Function** *onReject* errback with multiple arguments 

### Return:

* **Object** promise

## timeout(time, callback)

@method timeout 

### Params: 

* **Number** *time* timeout value in ms or null to clear timeout

* **Function** *callback* timeout function callback

### Return:

* **Object** promise

<!-- End index.js -->