<a href="http://promises-aplus.github.com/promises-spec">
    <img src="http://promises-aplus.github.io/promises-spec/assets/logo-small.png"
         align="right" alt="Promises/A+ logo" />
</a>
[![Build Status](https://travis-ci.org/kaerus-component/uP.png)](https://travis-ci.org/kaerus-component/uP)

# microPromise(uP) - A+ v1.1 compliant promises
Provides a [fast](benchmarks.md), small(~1.8KB minified) and fully conforming to Promise/A+ v1.1 specification (passing ~876 [tests](https://travis-ci.org/kaerus-component/uP)).

  - [uP.then()](#upthenonfulfillfunctiononrejectfunctiononnotifyfunction)
  - [uP.done()](#updoneonfulfillfunctiononrejectfunctiononnotifyfunction)
  - [uP.fulfill()](#upfulfillvalueobject)
  - [uP.resolve()](#upresolvevalueobject)
  - [uP.reject()](#uprejectreasonobject)

## uP.then(onFulfill:Function, onReject:Function, onNotify:Function)

  Attaches callback,errback,notify handlers and returns a promise 
  
  Example: catch fulfillment or rejection
```js
   var p = uP();
   p.then(function(value){
       console.log("received:", value);
   },function(error){
       console.log("failed with:", error);
   });
   p.fulfill('hello world!'); // => 'received: hello world!'
```

  
  Example: chainable then clauses
```js
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
```

  
  Example: undefined callbacks are ignored
```js
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
```

## uP.done(onFulfill:Function, onReject:Function, onNotify:Function)

  Same as `then` but terminates a promise chain and calls onerror / throws error on unhandled Errors 
  
  Example: capture error with done
```js
   p.then(function(v){
       console.log('v is:', v);
       if(v > 10) throw new RangeError('to large!');
       return v*2;
   }).done(function(v){ 
       // gets v*2 from above
       console.log('v is:', v)
   });
   p.fulfill(142); // => v is: 142, throws [RangeError:'to large']
```

  Example: use onerror handler
```js
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
```

## uP.fulfill(value:Object)

  Fulfills a promise with a `value` 
  
   Example: fulfillment
```js
   p = uP();
   p.fulfill(123);
   p.resolved; // => 123
```

   Example: multiple fulfillment values
```js
   p = uP();
   p.fulfill(1,2,3);
   p.resolved; // => [1,2,3]
```

## uP.resolve(value:Object)

  Resolves a promise with a `value` or another promise 
  
   Example: fulfillment
```js
   p = uP();
   p.resolve(123);
   p._value; // => 123
```

   Example: multiple fulfillment values
```js
   p = uP();
   p.fulfill(1,2,3);
   p.resolved; // => [1,2,3]
```

## uP.reject(reason:Object)

  Rejects promise with a `reason`
  
   Example:
```js
   p = uP();
   p.reject('some error');
   p.status; // => 'rejected'
   p.resolved; // => 'some error'
```