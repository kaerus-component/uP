<a href="http://promises-aplus.github.com/promises-spec">
    <img src="http://promises-aplus.github.io/promises-spec/assets/logo-small.png"
         align="right" alt="Promises/A+ logo" />
</a>
[![Build Status](https://travis-ci.org/kaerus-component/uP.png)](https://travis-ci.org/kaerus-component/uP)

# microPromise(uP) - A+ v1.1 compliant promises

  - [Promise()](#promisemixinobjectresolverfunction)
  - [Promise.resolver()](#promiseresolverresolverfunction)
  - [Promise.thenable()](#promisethenablepobject)
  - [Promise.wrap()](#promisewrapclassfunctioninstanceobject)
  - [Promise.defer()](#promisedeferfunctionargs)
  - [Promise.async()](#promiseasyncfunctionfunctioncallbackfunction)
  - [Promise.isPending()](#promiseispending)
  - [Promise.isFulfilled()](#promiseisfulfilled)
  - [Promise.isRejected()](#promiseisrejected)
  - [Promise.hasResolved()](#promisehasresolved)
  - [Promise.valueOf()](#promisevalueof)
  - [Promise.reason()](#promisereason)
  - [Promise.then()](#promisethenonfulfillfunctiononrejectfunctiononnotifyfunction)
  - [Promise.spread()](#promisespreadonfulfillfunctiononrejectfunctiononnotifyfunction)
  - [Promise.done()](#promisedoneonfulfillfunctiononrejectfunctiononnotifyfunction)
  - [Promise.end()](#promiseendcallbackfunction)
  - [Promise.catch()](#promisecatchonerrorfunction)
  - [Promise.fulfill()](#promisefulfillvalueobject)
  - [Promise.reject()](#promiserejectreasonobject)
  - [Promise.resolve()](#promiseresolvevalueobject)
  - [Promise.progress()](#promiseprogressargumentsobject)
  - [Promise.timeout()](#promisetimeouttimenumbercallbackfunction)
  - [Promise.callback()](#promisecallbackcallbackfunction)
  - [Promise.join()](#promisejoinpromisesarray)

## Promise([mixin]:Object, [resolver]:Function)

  Promise constructor

  * param Object [mixin] - Mixin promise into object
  * param Function [resolver] - Resolver function(resolve,reject,progress,timeout) 
  * return Object Promise

  
## Promise.resolver(resolver:Function)

  Promise resolver

  * param Function resolver - resolver function(fulfill,reject,progress,timeout) 
  * return Object Promise

  
## Promise.thenable(p:Object)

  Helper for identifying a promise-like objects or functions

  * param Object p - Object or Function to test
  * return Boolean - Returns true if thenable or else false

  
## Promise.wrap(class:Function, [instance]:Object)

  Wrap a promise around function or constructor

  * param Function class - class to wrap
  * param Object [instance] - optional instance
  * return Function function to wrap
  * throw 

  Example: wrap an Array
```js
   p = Promise.wrap(Array);
   
   var r = c(1,2,3); // => calls Array constructor and returns fulfilled promise
   r.valueOf(); // => [1,2,3];
```

## Promise.defer(-:Function, [args]:...)

  Deferres a task and returns a pending promise fulfilled with the return value from task.
  The task may also return a promise itself which to wait on.

  * param Function - task to defer
  * param ... [args] - optional list of arguments
  * return Object - returns a pending promise

  Example: Make readFileSync async
```js
   fs = require('fs');
   var asyncReadFile = Promise().defer(fs.readFileSync,'./index.js','utf-8');
   asyncReadFile.then(function(data){
       console.log(data)
   },function(error){
       console.log("Read error:", error);
   });
```

## Promise.async(function:Function, [callback]:Function)

  Make function asyncronous and fulfill/reject promise on execution.

  * param Function function - function to make async
  * param Function [callback] - optional callback to call
  * return Object promise

  Example: make readFile async
```js
   fs = require('fs');
   var asyncReadFile = Promise.async(fs.readFile);
   asyncReadFile('package.json','utf8').then(function(data){
       console.log(data);
   },function(error){
       console.log("Read error:", error);
   });
```

## Promise.isPending()

  Check if promise is pending

  * return Boolean - Returns true if pending or else false

  
## Promise.isFulfilled()

  Check if promise is fulfilled

  * return Boolean - Returns true if pending or else false

  
## Promise.isRejected()

  Check if promise is rejeced

  * return Boolean - Returns true if pending or else false

  
## Promise.hasResolved()

  Check if promise has resolved

  * return Boolean - Returns true if pending or else false

  
## Promise.valueOf()

  Get value if promise has been fulfilled

  * return Boolean - Returns true if pending or else false

  
## Promise.reason()

  Get reason if promise has rejected

  * return Boolean - Returns true if pending or else false

  
## Promise.then(onFulfill:Function, onReject:Function, onNotify:Function)

  Attaches callback,errback,notify handlers and returns a promise

  * param Function onFulfill callback
  * param Function onReject errback
  * param Function onNotify callback
  * return Object a decendant promise

  Example: catch fulfillment or rejection
```js
   var p = Promise();
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

## Promise.spread(onFulfill:Function, onReject:Function, onNotify:Function)

  Like `then` but spreads array into multiple arguments

  * param Function onFulfill callback
  * param Function onReject errback
  * param Function onNotify callback
  * return Object a decendant promise

  Example: Multiple fulfillment values
```js
   p = Promise();
   p.fulfill([1,2,3])
   p.spread(function(a,b,c){
       console.log(a,b,c); // => '1 2 3'
   });
```

## Promise.done(onFulfill:Function, onReject:Function, onNotify:Function)

  Terminates chain of promises, calls onerror or throws on unhandled Errors

  * param Function onFulfill callback
  * param Function onReject errback
  * param Function onNotify callback

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
```

  
```js
   p.fulfill(142); // => v is: 142, throws [RangeError:'to large']
```

  
  Example: define onerror handler defined on promise
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

## Promise.end(callback:Function)

  Terminates chain, invokes a callback or throws Error on error

  * param Function callback - Callback with value or Error object on error.

  
## Promise.catch(onError:Function)

  Catches errors, terminates promise chain and calls errBack handler.

  * param Function onError callback
  * return undefined 

  Example: Catch error
```js
   p = Promise();
   p.then(function(v){
       console.log("someone said:", v);  //-> "Hello there"
       return "boom!";
     })
    .then(function(v){ if(v === 'boom!') throw "something bad happened!";})
    .catch(function(e){
       console.log("error:",e);
    });
   p.resolve("Hello there");
```

## Promise.fulfill(value:Object)

  Fulfills a promise with a `value`

  * param Object value 
  * return Object promise

  Example: fulfillment
```js
   p = Promise();
   p.fulfill(123);
```

  
   Example: multiple fulfillment values in array
```js
   p = Promise();
   p.fulfill([1,2,3]);
   p.resolved; // => [1,2,3]
```

  
   Example: Pass through opaque arguments (experimental)
```js
   p = Promise();
   p.fulfill("hello","world");
   p.then(function(x,o){
       console.log(x,o[0]); // => "hello world"
       o.push("!");
       return "bye bye";
   }).then(function(x,o){
       console.log(x,o.join('')); // => "bye bye world!"
   })
```

## Promise.reject(reason:Object)

  Rejects promise with a `reason`

  * param Object reason 
  * return Object promise

  Example:
```js
   p = Promise();
   p.then(function(ok){
      console.log("ok:",ok);
   }, function(error){
      console.log("error:",error);
   });
   p.reject('some error'); // outputs => 'error: some error'
```

## Promise.resolve(value:Object)

  Resolves a promise and performs unwrapping if necessary

  * param Object value - Promise or literal
  * return Object promise

  Example: resolve a literal
```js
   p = Promise();
   p.resolve(123); // fulfills promise to 123
```

  
   Example: resolve value from pending promise
```js
   p1 = Promise();
   p2 = Promise();
   p1.resolve(p2);
   p2.fulfill(123) // => p1 fulfills to 123
```

## Promise.progress(arguments:Object)

  Notifies attached handlers

  * param Object arguments 

  Example:
```js
   p = Promise();
   p.then(function(ok){
      console.log("ok:",ok);
   }, function(error){
      console.log("error:",error);
   }, function(notify){
      console.log(notify);
   });
   p.progress("almost done"); // optputs => 'almost done'
   p.reject('some error'); // outputs => 'error: some error'
```

## Promise.timeout(time:Number, callback:Function)

  Timeout a pending promise and invoke callback function on timeout.
  Without a callback it throws a RangeError('exceeded timeout').

  * param Number time - timeout value in ms or null to clear timeout
  * param Function callback - optional timeout function callback
  * throw 
  * return Object promise

  Example: timeout & abort()
```js
   var p = Promise();
   p.timeout(5000);
   // ... after 5 secs ... => Aborted: |RangeError: 'exceeded timeout']
```

  
  Example: cancel timeout
```js
   p.timeout(5000);
   p.timeout(null); // timeout cancelled
```

## Promise.callback(callback:Function)

  Resolves promise to a nodejs styled callback function(err,ret) 
  and passes the callbacks return value down the chain.

  * param Function callback - Callback function
  * return Object promise

  Example:
```js
   function cb(err,ret){
     if(err) console.log("error(%s):",err,ret);
     else console.log("success:", ret);
```

  
```js
     return "nice";
   }
```

  
```js
   p = Promise();
   p.callback(cb)
    .then(function(cbret){ 
      console.log("callback says:", cbret); //-> callback says: nice 
   });
```

  
```js
   p.fulfill("ok"); //-> success: ok
```

## Promise.join(promises:Array)

  Joins promises and collects results into an array.
  If any of the promises are rejected the chain is also rejected.

  * param Array promises 
  * return Object promise

  Example: join with two promises
```js
   a = Promise();
   b = Promise();
   c = Promise();
   a.join([b,c]).spread(function(a,b,c){
       console.log(a,b,c);
   },function(err){
       console.log('error=',err);
   });
   b.fulfill('world');
   a.fulfill('hello');
   c.fulfill('!'); // => 'hello world !''
```

