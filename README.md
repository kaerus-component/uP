<a href="http://promises-aplus.github.com/promises-spec">
    <img src="http://promises-aplus.github.com/promises-spec/assets/logo-small.png"
         align="right" alt="Promises/A+ logo" />
</a>
[![Build Status](https://travis-ci.org/kaerus-component/uP.png)](https://travis-ci.org/kaerus-component/uP)

# microPromises
A+ compliant promises

#API
  - [uP()](#up)
  - [o.then()](#othenonfulfillfunctiononrejectfunction)
  - [o.fulfill()](#ofulfillvalueobject)
  - [o.reject()](#orejectreasonobject)
  - [o.resolved()](#oresolved)
  - [o.status()](#ostatus)
  - [o.async()](#oasyncprocfunctionargsobject)
  - [o.async2()](#oasync2)
  - [o.join()](#ojoinpromisesarray)
  - [o.spread()](#ospreadonfulfillfunctiononrejectfunction)
  - [o.timeout()](#otimeouttimenumbercallbackfunction)

## uP()

  Initializes and returns a promise
  Provide an object to mixin the features or a resolver callback function.
   
   Example: require uP
```js
    var uP = require('uP');
```

  
   Example: get a new promise
```js
    var p = uP();
```

  
   Example: initialize with object
```js
    var e = {x:42,test:function(){ this.fulfill(this.x) } };
    var p = uP(e);
    p.test();
    p.resolved(); // => 42
```

  
   Example: initialize with a function
```js
    var r = function(r){ r.fulfill('hello') };
    p = a(r);
    p.resolved(); // => 'hello'
```

## o.then(onFulfill:Function, onReject:Function)

  Attaches callback/errback handlers and returns a new promise 
  
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

  
  Example: null callbacks are ignored
```js
   p.then(function(v){
       if(v < 0) throw v;
       return v;
   }).then(null,function(e){
       e = -e;
       return e;
   }).then(function(value){
       console.log('we got:', value);
   });
   p.fulfill(-5); // => we got: 5
```

## o.fulfill(value:Object)

  Fulfills a promise with a value

## o.reject(reason:Object)

  Rejects promise with a reason

## o.resolved()

  Returns the resolved `value`

## o.status()

  Returns the current `status`

## o.async(proc:Function, args:Object)

  Makes a process/function asynchronous.
  The process may also return a promise itself which to wait on.
  Note: if the process returns undefined the promise will remain pending.  
  
  Example: Make readFileSync async
```js
   fs = require('fs');
   var asyncReadFile = p.async(fs.readFileSync,'./index.js');
   asyncReadFile.then(function(data){
       console.log(data.toString())
   },function(error){
       console.log("Read error:", error);
   });
```

## o.async2()

  Adapted for processes using a callback(err,ret). 
  
  Example: make readFile async
```js
   fs = require('fs');
   var asyncReadFile = p.async2(fs.readFile,'./index.js');
   asyncReadFile.then(function(data){
       console.log(data.toString())
   },function(error){
       console.log("Read error:", error);
   });
```

## o.join(promises:Array)

  Joins promises and assembles return values into an array.
  If any of the promises rejects the rejection handler is called with the error.  
  
  Example: join two promises
```js
   p = uP();
   a = uP();
   b = uP();
   p.join([a,b]).spread(function(x,y){
       console.log('a=%s, b=%s',x,y);
   },function(err){
       console.log('error=',e);
   });
   b.fulfill('hello');
   a.fulfill('world'); // => 'a=hello, b=world' 
   p.resolved(); // => ['hello','world']
```

## o.spread(onFulfill:Function, onReject:Function)

  Spread has the same semantic as then() but splits multiple fulfillment values & rejection reasons into separate arguments  
  
  Example: Fulfillment array elements as arguments
```js
   var p = uP();
   p.fulfill([1,2,3]).spread(function(a,b,c){
       console.log(a,b,c); // => 123
   });
```

## o.timeout(time:Number, callback:Function)

  Timeout a pending promise and invoke callback function on timeout.
  Without a callback it throws a RangeError('exceeded timeout').
