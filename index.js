 /**      
 * Provides A+ v1.1 compliant promises.   
 * @module uP
 * @name microPromise
 * @main uP
 */

var task = require('microTask'); // nextTick shim

(function(root){
    "use strict"

    try {root = global} catch(e){ try {root = window} catch(e){} };

    function uP(proto){

        if(!(this instanceof uP))
            return new uP(proto);

        this._tuple = [];

        if(typeof proto === 'function') {
            var res = this.resolve.bind(this),
                rej = this.reject.bind(this);
            proto(res,rej);
        } else if(proto) for(var key in proto) this[key] = proto[key];
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
    uP.prototype.then = function then(f,r,n){
        var p = new uP();

        this._tuple[this._tuple.length] = [p,f,r,n];

        if(this._state) task(resolver,[this._tuple,this._state,this._value]);

        return p;
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
    uP.prototype.done = function done(f,r,n){
        
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
     * @param {Object} value
     * @return {Object} promise
     * @api public
     */
    uP.prototype.fulfill = function fulfill(x){
        if(!this._state){
            task(resolver,[this._tuple,this._state = 1,this._value = x]);
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
    uP.prototype.resolve = function resolve(x){
        var thenable, z = 0, p = this, z = 0;

        if(!this._state){
            if(x === p) p.reject(new TypeError("x === p"));

            if(x && (typeof x === 'object' || typeof x === 'function')){
                try { thenable = x.then } catch(e){ p.reject(e) }
            } 

            if(typeof thenable !== 'function'){
                task(resolver,[this._tuple,this._state = 1,this._value = x])   
            } else if(!z){
                try {
                    thenable.apply(x,[function(y){
                        if(!z++) p.resolve(y);
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
    uP.prototype.reject = function reject(x){
        if(!this._state){
            task(resolver,[this._tuple,this._state = 2,this._value = x]);
        }

        return this;    
    }

    /* Resolver function, yields back a promised value to handlers */
    function resolver(tuple,state,value){
        var t, p, h, x = value;

        while(t = tuple.shift()) {
            p = t[0];
            h = t[state];

            if(typeof h === 'function') {
                try {
                    x = h(value);
                    p.resolve(x);
                } catch(e) {
                    p.reject(e);
                }     
            } else {
                p._state = state;
                p._value = x;
                task(resolver,[p._tuple, p._state, p._value]);
            }
        }
    }

    /* expose this module */
    if(module && module.exports) module.exports = uP;
    else if(typeof define ==='function' && define.amd) define(uP); 
    else root.uP = uP;
}(this));

