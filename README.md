<a href="http://promises-aplus.github.com/promises-spec">
    <img src="http://promises-aplus.github.io/promises-spec/assets/logo-small.png"
         align="right" alt="Promises/A+ logo" />
</a>
[![Build Status](https://travis-ci.org/kaerus-component/uP.png)](https://travis-ci.org/kaerus-component/uP)

# microPromises
A+ compliant promises. If you need more features check out [promise.js](https://github.com/kaerus-component/promise).

  - [uP()](#up)
  - [then()](#then)
  - [done()](#done)
  - [fulfill()](#fulfill)
  - [reject()](#reject)
  - [defer()](#defer)

## microPromise

Provides A+ v1.1 compliant promises.   

## uP(o)

Initializes and returns a promise
Provide an object to mixin the features or a resolver callback function.
 
 Example: require uP
      var uP = require('uP');

 Example: get a new promise
      var p = uP();

 Example: initialize with object
      var e = {x:42,test:function(){ this.fulfill(this.x) } };
      var p = uP(e);
      p.test();
      // resolved getter contains the value 
      p.resolved; // => 42
      // status getter contains the state
      p.status; // => 'fulfilled'

 Example: initialize with a function
      var r = function(r){ r.fulfill('hello') };
      p = a(r);
      p.resolved; // => 'hello'

### Params: 

* **Object** *o* 

### Return:

* **Object** promise

returns `status` of promise which can be either 'pending', 'fulfilled' or 'rejected'

### Return:

* **String** status

returns the resolved `value`, either from fulfillment or rejection.

### Return:

* **Object** value

## then(onFulfill, onReject, onNotify)

Attaches callback,errback,notify handlers and returns a promise 

Example: catch fulfillment or rejection
     var p = uP();
     p.then(function(value){
         console.log("received:", value);
     },function(error){
         console.log("failed with:", error);
     });
     p.fulfill('hello world!'); // => 'received: hello world!'

Example: chainable then clauses
     p.then(function(v){
         console.log('v is:', v);
         if(v > 10) throw new RangeError('to large!');
         return v*2;
     }).then(function(v){ 
         // gets v*2 from above
         console.log('v is:', v)
     },function(e){
         console.log('error2:', e);
     });
     p.fulfill(142); // => v is: 142, error2: [RangeError:'to large']

Example: undefined callbacks are ignored
     p.then(function(v){
         if(v < 0) throw v;
         return v;
     }).then(undefined,function(e){
         e = -e;
         return e;
     }).then(function(value){
         console.log('we got:', value);
     });
     p.fulfill(-5); // => we got: 5
     

### Params: 

* **Function** *onFulfill* callback

* **Function** *onReject* errback 

* **Function** *onNotify* callback 

### Return:

* **Object** a decendant promise

## done(onFulfill, onReject, onNotify)

Same as `then` but terminates a promise chain and calls onerror / throws error on unhandled Errors 

Example: capture error with done
     p.then(function(v){
         console.log('v is:', v);
         if(v > 10) throw new RangeError('to large!');
         return v*2;
     }).done(function(v){ 
         // gets v*2 from above
         console.log('v is:', v)
     });
     p.fulfill(142); // => v is: 142, throws [RangeError:'to large']
Example: use onerror handler
     p.onerror = function(error){ console.log("Sorry:",error) };
     p.then(function(v){
         console.log('v is:', v);
         if(v > 10) throw new RangeError('to large!');
         return v*2;
     }).done(function(v){ 
         // gets v*2 from above
         console.log('v is:', v)
     });
     p.fulfill(142); // => v is: 142, "Sorry: [RangeError:'to large']"
     

### Params: 

* **Function** *onFulfill* callback

* **Function** *onReject* errback 

* **Function** *onNotify* callback 

## fulfill(value)

Fulfills a promise with a `value` 

 Example: fulfillment
     p = uP();
     p.fulfill(123);
     p.resolved; // => 123
 Example: multiple fulfillment values
     p = uP();
     p.fulfill(1,2,3);
     p.resolved; // => [1,2,3]
     

### Params: 

* **Object** *value* 

### Return:

* **Object** promise

## reject(reason)

Rejects promise with a `reason`

 Example:
     p = uP();
     p.reject('some error');
     p.status; // => 'rejected'
     p.resolved; // => 'some error'
     

### Params: 

* **Object** *reason* 

### Return:

* **Object** promise

## defer(task)

Run `task` after nextTick / event loop or fulfill promise unless task is a function.

Example:
      function t1(){ throw new Error('to late!') }
      p.defer(t1); 
      p.status; // => 'pending'
      // after nextTick 
      p.status; // => 'rejected'
      p.resolved; // => [ERROR: 'to late!']
Example:
      p.defer([task1,task2,task3]);
      // schedules task1-3 to run after nextTick
Example: 
      p.defer('hello');
      // ... after nextTick
      p.resolved; // 'hello'
      p.status; // 'fulfilled'

### Params: 

* **Function** *task* 

### Return:

* **Object** value

