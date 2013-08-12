<a href="http://promises-aplus.github.com/promises-spec">
    <img src="http://promises-aplus.github.com/promises-spec/assets/logo-small.png"
         align="right" alt="Promises/A+ logo" />
</a>
[![Build Status](https://travis-ci.org/kaerus-component/uP.png)](https://travis-ci.org/kaerus-component/uP)

# microPromises
A+ compliant promises. If you need more features check out [promise.js](https://github.com/kaerus-component/promise).

  - [uP()](#up)
  - [then()](#then)
  - [fulfill()](#fulfill)
  - [reject()](#reject)

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
    // resolved getter contains the value 
    p.resolved; // => 42
    // status getter contains the state
    p.status; // => 'fulfilled'
```

  
   Example: initialize with a function
```js
    var r = function(r){ r.fulfill('hello') };
    p = a(r);
    p.resolved; // => 'hello'
```

## then()

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

## fulfill()

  Fulfills a promise with a `value`

## reject()

  Rejects promise with a `reason`
