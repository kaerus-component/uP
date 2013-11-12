<a href="http://promises-aplus.github.com/promises-spec">
    <img src="http://promises-aplus.github.io/promises-spec/assets/logo-small.png"
         align="right" alt="Promises/A+ logo" />
</a>
[![Build Status](https://travis-ci.org/kaerus-component/uP.png)](https://travis-ci.org/kaerus-component/uP)

# microPromise(uP) - A+ v1.1 compliant promises
Provides a [fast](benchmarks.md) Promises framework which is fully conforming to the Promise/A+ v1.1 specification (passing ~870 [tests](https://travis-ci.org/kaerus-component/uP)).

  - [task](#task)
  - [uP.then()](#upthenonfulfillfunctiononrejectfunctiononnotifyfunction)
  - [uP.spread()](#upspreadonfulfillfunctiononrejectfunctiononnotifyfunction)
  - [uP.done()](#updoneonfulfillfunctiononrejectfunctiononnotifyfunction)
  - [uP.fulfill()](#upfulfillvalueobject)
  - [uP.resolve()](#upresolvevalueobject)
  - [uP.reject()](#uprejectreasonobject)
  - [uP.timeout()](#uptimeouttimenumbercallbackfunction)
  - [uP.wrap()](#upwrapprotoobject)
  - [uP.defer()](#updefer)
  - [uP.async()](#upasync)
  - [uP.join()](#upjoinpromisesarray)
  - [resolver()](#resolver)

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

## uP.spread(onFulfill:Function, onReject:Function, onNotify:Function)

  Same semantic as `then` but spreads array value into separate arguments 
  
  Example: Multiple fulfillment values
```js
   p = uP();
   p.fulfill([1,2,3])
   p.spread(function(a,b,c){
       console.log(a,b,c); // => '1 2 3'
   });
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
```

   
   Example: multiple fulfillment values in array
```js
   p = uP();
   p.fulfill([1,2,3]);
   p.resolved; // => [1,2,3]
```

## uP.resolve(value:Object)

  Resolves a promise with a `value` yielded from another promise 
  
   Example: resolve literal value
```js
   p = uP();
   p.resolve(123); // fulfills promise with 123
```

   Example: resolve value from another pending promise
```js
   p1 = uP();
   p2 = uP();
   p1.resolve(p2);
   p2.fulfill(123) // => p2._value = 123
```

## uP.reject(reason:Object)

  Rejects promise with a `reason`
  
   Example:
```js
   p = uP();
   p.then(function(ok){
      console.log("ok:",ok);
   }, function(error){
      console.log("error:",error);
   });
   p.reject('some error'); // outputs => 'error: some error'
```

## uP.timeout(time:Number, callback:Function)

  Timeout a pending promise and invoke callback function on timeout.
  Without a callback it throws a RangeError('exceeded timeout').
  
  Example: timeout & abort()
```js
   var p = Promise();
   p.attach({abort:function(msg){console.log('Aborted:',msg)}});
   p.timeout(5000);
   // ... after 5 secs ... => Aborted: |RangeError: 'exceeded timeout']
```

  Example: cancel timeout
```js
   p.timeout(5000);
   p.timeout(null); // timeout cancelled
```

## uP.wrap(proto:Object)

  Wraps a `proto` into a promise
  
  Example: wrap an Array
```js
   p = Promise();
   c = p.wrap(Array);
   c(1,2,3); // => calls constructor and fulfills promise 
   p.resolved; // => [1,2,3]
```

## uP.defer()

  Deferres a task and fulfills with return value.
  The process may also return a promise itself which to wait on.  
  
  Example: Make readFileSync async
```js
   fs = require('fs');
   var asyncReadFile = uP().defer(fs.readFileSync,'./index.js','utf-8');
   asyncReadFile.then(function(data){
       console.log(data)
   },function(error){
       console.log("Read error:", error);
   });
```

## uP.async()

  Adapted for nodejs style functions expecting a callback. 
  
  Example: make readFile async
```js
   fs = require('fs');
   var asyncReadFile = uP.async(fs.readFile,'./index.js','utf-8');
   asyncReadFile.then(function(data){
       console.log(data);
   },function(error){
       console.log("Read error:", error);
   });
```

## uP.join(promises:Array)

  Joins promises and collects results into an array.
  If any of the promises are rejected the chain is also rejected.  
  
  Example: join with two promises
```js
   a = uP();
   b = uP();
   c = uP();
   a.join([b,c]).spread(function(a,b,c){
       console.log(a,b,c);
   },function(err){
       console.log('error=',err);
   });
   b.fulfill('world');
   a.fulfill('hello'); 
   c.fulfill('!'); // => 'hello world !''
```
