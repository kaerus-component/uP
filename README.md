<a href="http://promises-aplus.github.com/promises-spec">
    <img src="http://promises-aplus.github.com/promises-spec/assets/logo-small.png"
         align="right" alt="Promises/A+ logo" />
</a>
[![Build Status](https://travis-ci.org/kaerus-component/uP.png)](https://travis-ci.org/kaerus-component/uP)


<!-- Start index.js -->

## uP

Provides A+ compliant promises with some extras.   

## uP({Object})

@class  uP

### Params: 

* **o** *{Object}* object to mixin

### Return:

* **Object** with promise features

## async

@method  async 

### Params: 

* **func** *{Function}* alias for setImmediate 

### Return:

* **String** 

## then({Function}, {Function})

@method  then 

### Params: 

* **onFulfill** *{Function}* callback

* **onReject** *{Function}* errback 

### Return:

* **Object** promise

## fulfill({Object})

@method  fulfill 

### Params: 

* **value** *{Object}* fulfillment value 

### Return:

* **Object** promise

## reject({Object})

@method  reject 

### Params: 

* **reason** *{Object}* rejection reason 

### Return:

* **Object** promise

## resolved()

@method  resolved  

### Return:

* **Object** resolved value or rejected reason

## status()

@method  status  

### Return:

* **String** state 'pending','fulfilled','rejected'

## defer({Function})

@method  defer 

### Params: 

* **proc** *{Function}* defer execution 

### Return:

* **Object** promise

## spread({Function}, {Function})

@method  spread 

### Params: 

* **onFulfill** *{Function}* callback with multiple arguments

* **onReject** *{Function}* errback with multiple arguments 

### Return:

* **Object** promise

## timeout({Number}, {Function})

@method  timeout 

### Params: 

* **time** *{Number}* timeout value in ms or null to clear timer

* **func** *{Function}* timeout callback

### Return:

* **Object** promise

<!-- End index.js -->


