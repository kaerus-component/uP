 /**      
 * Provides A+ v1.1 compliant promises.   
 * @module uP
 * @name microPromise
 * @main uP
 */

var task = require('microtask'); // nextTick shim

(function(root){
    "use strict"

    try {root = global} catch(e){ try {root = window} catch(e){} };

    var slice = Array.prototype.slice,
        isArray = Array.isArray;

    var uP = function microPromise(proto){
        // object mixin
        if(proto && typeof proto === 'object'){ 
            for(var key in uP.prototype) proto[key] = uP.prototype[key];
            proto._tuple = [];
            return proto;
        }

        if(!(this instanceof microPromise))
            return new microPromise(proto);

        this._tuple = [];

        // resolver callback
        if(typeof proto === 'function') {
            proto(this.resolve,this.reject,this.progress,this.timeout);
        }
    }

    /**
     * Attaches callback,errback,notify handlers and returns a promise 
     * 
     * Example: catch fulfillment or rejection
     *      var p = uP();
     *      p.then(function(value){
     *          console.log("received:", value);
     *      },function(error){
     *          console.log("failed with:", error);
     *      });
     *      p.fulfill('hello world!'); // => 'received: hello world!'
     *
     * Example: chainable then clauses
     *      p.then(function(v){
     *          console.log('v is:', v);
     *          if(v > 10) throw new RangeError('to large!');
     *          return v*2;
     *      }).then(function(v){ 
     *          // gets v*2 from above
     *          console.log('v is:', v)
     *      },function(e){
     *          console.log('error2:', e);
     *      });
     *      p.fulfill(142); // => v is: 142, error2: [RangeError:'to large']
     *
     * Example: undefined callbacks are ignored
     *      p.then(function(v){
     *          if(v < 0) throw v;
     *          return v;
     *      }).then(undefined,function(e){
     *          e = -e;
     *          return e;
     *      }).then(function(value){
     *          console.log('we got:', value);
     *      });
     *      p.fulfill(-5); // => we got: 5
     *      
     * @param {Function} onFulfill callback
     * @param {Function} onReject errback 
     * @param {Function} onNotify callback 
     * @return {Object} a decendant promise
     * @api public
     */
    uP.prototype.then = function(f,r,n){
        var p = new uP();

        this._tuple[this._tuple.length] = [p,f,r,n];

        if(this._state) task(resolver,[this._tuple,this._state,this._value,this._opaque]);

        return p;
    }
    /**
     * Same semantic as `then` but spreads array value into separate arguments 
     *
     * Example: Multiple fulfillment values
     *      p = uP();
     *      p.fulfill([1,2,3])
     *      p.spread(function(a,b,c){
     *          console.log(a,b,c); // => '1 2 3'
     *      });
     *  
     * @param {Function} onFulfill callback
     * @param {Function} onReject errback 
     * @param {Function} onNotify callback 
     * @return {Object} a decendant promise
     * @api public
     */
    uP.prototype.spread = function(f,r,n){  
        function s(v,a){
            if(!isArray(v)) v = [v];
            return f.apply(f,v.concat(a)); 
        }

        return this.then(s,r,n);
    }
    /**
     * Same as `then` but terminates a promise chain and calls onerror / throws error on unhandled Errors 
     *
     * Example: capture error with done
     *      p.then(function(v){
     *          console.log('v is:', v);
     *          if(v > 10) throw new RangeError('to large!');
     *          return v*2;
     *      }).done(function(v){ 
     *          // gets v*2 from above
     *          console.log('v is:', v)
     *      });
     *      p.fulfill(142); // => v is: 142, throws [RangeError:'to large']
     * Example: use onerror handler
     *      p.onerror = function(error){ console.log("Sorry:",error) };
     *      p.then(function(v){
     *          console.log('v is:', v);
     *          if(v > 10) throw new RangeError('to large!');
     *          return v*2;
     *      }).done(function(v){ 
     *          // gets v*2 from above
     *          console.log('v is:', v)
     *      });
     *      p.fulfill(142); // => v is: 142, "Sorry: [RangeError:'to large']"
     *
     * @param {Function} onFulfill callback
     * @param {Function} onReject errback 
     * @param {Function} onNotify callback 
     * @api public
     */
    uP.prototype.done = function(f,r,n){
    
        if(typeof r !== 'function') r = handleError;

        var self = this, p = this.then(f,r,n);
    
        function handleError(e){
            task(function(){
                if(typeof self.onerror === 'function'){
                    self.onerror(e);
                } else {
                    throw e;
                }
            });
        }
    }

    /**
     * Fulfills a promise with a `value` 
     * 
     *  Example: fulfillment
     *      p = uP();
     *      p.fulfill(123);
     *  
     *  Example: multiple fulfillment values in array
     *      p = uP();
     *      p.fulfill([1,2,3]);
     *      p.resolved; // => [1,2,3]
     *      
     *  Example: Pass through opaque arguments (experimental)
     *      p = uP();
     *      p.fulfill("hello","world");
     *      p.then(function(x,o){
     *          console.log(x,o[0]); // => "hello world"
     *          o.push("!");
     *          return "bye bye";
     *      }).then(function(x,o){
     *          console.log(x,o.join('')); // => "bye bye world!"
     *      })
     *
     * @param {Object} value
     * @return {Object} promise
     * @api public
     */
    uP.prototype.fulfill = function(x,o){
        if(!this._state){
            task(resolver,[this._tuple,this._state = 1,this._value = x, this._opaque = o]);
        }

        return this;    
    }

    /**
     * Resolves a promise with a `value` yielded from another promise 
     * 
     *  Example: resolve literal value
     *      p = uP();
     *      p.resolve(123); // fulfills promise with 123
     *      
     *  Example: resolve value from another pending promise
     *      p1 = uP();
     *      p2 = uP();
     *      p1.resolve(p2);
     *      p2.fulfill(123) // => p2._value = 123
     *      
     * @param {Object} value
     * @return {Object} promise
     * @api public
     */
    uP.prototype.resolve = function(x,o){
        var then, z = 0, p = this, z = 0;

        if(!this._state){
            if(x === p) p.reject(new TypeError("x === p"));

            if(x && (typeof x === 'object' || typeof x === 'function')){
                try { then = x.then } catch(e){ p.reject(e) }
            } 

            if(typeof then !== 'function'){
                task(resolver,[this._tuple,this._state = 1,this._value = x, this._opaque = o])   
            } else if(!z){
                try {
                    then.apply(x,[function(y){
                        if(!z++) p.resolve(y,o);
                    },function(r){
                        if(!z++) p.reject(r);
                    }]);
                } catch(e) {
                    if(!z++) p.reject(e);
                }  
            }
        }

        return this;
    }

    /**
     * Rejects promise with a `reason`
     *
     *  Example:
     *      p = uP();
     *      p.then(function(ok){
     *         console.log("ok:",ok);
     *      }, function(error){
     *         console.log("error:",error);
     *      });
     *      p.reject('some error'); // outputs => 'error: some error' 
     *      
     * @param {Object} reason 
     * @return {Object} promise
     * @api public
     */
    uP.prototype.reject = function(x,o){
        if(!this._state){
            task(resolver,[this._tuple,this._state = 2,this._value = x, this._opaque = o]);
        }

        return this;    
    }

    /**
     * Notifies attached handlers
     *
     *  Example:
     *      p = uP();
     *      p.then(function(ok){
     *         console.log("ok:",ok);
     *      }, function(error){
     *         console.log("error:",error);
     *      }, function(notify){
     *         console.log(notify);
     *      });
     *      p.progress("almost done"); // optputs => 'almost done' 
     *      p.reject('some error'); // outputs => 'error: some error' 
     *      
     * @param {Object} arguments 
     * @api public
     */
    uP.prototype.progress = function(){
        var args = slice.call(arguments), fn;
        for(var i = 0, l = this._tuple.length; i < l; i++){
            if(typeof (fn = this._tuple[i][3]) === 'function')
                fn.apply(this,arguments);
        }
    }

    /**
     * Timeout a pending promise and invoke callback function on timeout.
     * Without a callback it throws a RangeError('exceeded timeout').
     *
     * Example: timeout & abort()
     *      var p = Promise();
     *      p.attach({abort:function(msg){console.log('Aborted:',msg)}});
     *      p.timeout(5000);
     *      // ... after 5 secs ... => Aborted: |RangeError: 'exceeded timeout']
     *      
     * Example: cancel timeout
     *      p.timeout(5000);
     *      p.timeout(null); // timeout cancelled
     *            
     * @param {Number} time timeout value in ms or null to clear timeout
     * @param {Function} callback optional timeout function callback
     * @throws {RangeError} If exceeded timeout  
     * @return {Object} promise
     * @api public
     */
    uP.prototype.timeout = function(msec,func){
        var p = this;

        if(msec === null) {
            clearTimeout(p._timer);
            p._timer = null;
        } else if(!p._timer){             
            p._timer = setTimeout(onTimeout,msec);
        }       

        function onTimeout(){ 
            var e = RangeError("exceeded timeout");
            if(!p._state) {
                if(typeof func === 'function') func(p);
                else if(typeof p.onerror === 'function') p.onerror(e);
                else throw e;
            }
        }

        return this;
    }

    /**
     * Wraps a `proto` into a promise
     * 
     * Example: wrap an Array
     *      p = Promise();
     *      c = p.wrap(Array);
     *      c(1,2,3); // => calls constructor and fulfills promise 
     *      p.resolved; // => [1,2,3]
     *
     * @param {Object} proto
     * @return {Object} promise
     * @api public
     */
    uP.prototype.wrap = function(proto){
        var p = this;

        return function(){
            var args = slice.call(arguments), ret;

            if(proto instanceof uP){
                proto.fulfill(args).then(p.fulfill,p.reject);
            } else if(typeof proto === 'function'){
                try{
                    ret = proto.apply(p,args);
                    p.resolve(ret);
                } catch(err) {
                    p.reject(err);
                }
            }
                
            return p;
        }              
    }
    /**
     * Deferres a task and fulfills with return value.
     * The process may also return a promise itself which to wait on.  
     * 
     * Example: Make readFileSync async
     *      fs = require('fs');
     *      var asyncReadFile = uP().defer(fs.readFileSync,'./index.js','utf-8');
     *      asyncReadFile.then(function(data){
     *          console.log(data)
     *      },function(error){
     *          console.log("Read error:", error);
     *      });
     *         
     * @return {Object} promise
     * @api public
     */
    uP.prototype.defer = function(){
        var args = slice.call(arguments),
            proc = args.shift(),
            p = this;

        if(typeof proc === 'function'){
            task(enclose,args);
        }

        function enclose(){
            try { p.resolve(proc.apply(p,args)) } catch(err) { p.reject(err) } 
        }

        return this;
    }
    /**
     * Adapted for nodejs style functions expecting a callback. 
     * 
     * Example: make readFile async
     *      fs = require('fs');
     *      var asyncReadFile = uP.async(fs.readFile,'./index.js','utf-8');
     *      asyncReadFile.then(function(data){
     *          console.log(data);
     *      },function(error){
     *          console.log("Read error:", error);
     *      });
     *         
     * @return {Object} promise
     * @api public
     */
    uP.prototype.async = function(){
        var p = this,
            args = slice.call(arguments);

        function callback(err,ret){ if(!err) p.fulfill(ret); else p.reject(ret); }

        args[args.length] = callback;

        return this.defer.apply(this,args);
    }

    /**
     * Joins promises and collects results into an array.
     * If any of the promises are rejected the chain is also rejected.  
     * 
     * Example: join with two promises
     *      a = uP();
     *      b = uP();
     *      c = uP();
     *      a.join([b,c]).spread(function(a,b,c){
     *          console.log(a,b,c);
     *      },function(err){
     *          console.log('error=',err);
     *      });
     *      b.fulfill('world');
     *      a.fulfill('hello'); 
     *      c.fulfill('!'); // => 'hello world !''
     *
     * @param {Array} promises
     * @return {Object} promise
     * @api public
     */
    uP.prototype.join = function(j){
        var p = this, 
            y = [], 
            u = new uP().resolve(p).then(function(v){y[0] = v});

        if(arguments.length > 1) {
            j = slice.call(arguments);
        }

        if(!isArray(j)) j = [j];

        function collect(i){
            j[i].done(function(v){
                y[i+1] = v;
            },u.reject);

            return function(){return j[i]}    
        }

        for(var i = 0; i < j.length; i++){
            u = u.then(collect(i));
        }
        
        return u.then(function(){return y});
    }


    /* Resolver function, yields back a promised value to handlers */
    function resolver(tuple,state,value,opaque){
        var t, p, h, x = value;

        while(t = tuple.shift()) {
            p = t[0];
            h = t[state];

            if(typeof h === 'function') {
                try {
                    x = h(value,opaque);
                    p.resolve(x,opaque);
                } catch(e) {
                    p.reject(e);
                }     
            } else {
                p._state = state;
                p._value = x;
                p._opaque = opaque;
                task(resolver,[p._tuple, p._state, p._value, p._opaque]);
            }
        }
    }

    /* expose this module */
    if(module && module.exports) module.exports = uP;
    else if(typeof define ==='function' && define.amd) define(uP); 
    else root.uP = uP;
}(this));

