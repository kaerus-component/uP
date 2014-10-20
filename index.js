/*global require, global, window */

/**
 * Provides A+ v1.1 compliant promises.
 * @module Promise
 * @name microPromise
 * @main Promise
 */

var task = require('microtask'); // nextTick shim

(function(root){
    "use strict";

    try {root = window;} catch(e){ try {root = global;} catch(f){} }

    var slice = Array.prototype.slice,
        isArray = Array.isArray;

    var PENDING   = 0,   
	FULFILLED = 1, 
	REJECTED  = 2;  
    
    /**
     * Promise constructor
     * 
     * @param {Object} [mixin] - Mixin promise into object
     * @param {Function} [resolver] - Resolver function(resolve,reject,progress,timeout) 
     * @return {Object} Promise
     * @api public
     */
    function Promise(p){
	var self = this;
	
        // object mixin
        if(p && typeof p === 'object'){
            for(var k in Promise.prototype)
		p[k] = Promise.prototype[k];
	    p._promise = {_chain:[]};

	    return p;
        }
	
	// create new instance
        if(!(this instanceof Promise))
            return new Promise(p);

	this._promise = {_chain: []};

        // resolver callback
        if(typeof p === 'function') {
	    task(function(){
		var res = self.resolve.bind(self),
		    rej = self.reject.bind(self),
		    pro = self.progress.bind(self),
		    tim = self.timeout.bind(self);
		
		p(res, rej, pro, tim);
	    });
        }
    }

    /**
     * Promise resolver
     * 
     * @param {Object} [Promise|Object|Function]  
     * @param {Function} [resolver] - Resolver function(resolve,reject,progress,timeout) 
     * @return {Object} Promise
     * @api public
     */
    Promise.resolver = function(p,r){

	if(typeof r === 'function') {
	    
	    if(Promise.thenable(p)){
		return r(p.resolve,p.reject,p.progress,p.timeout);
	    }
	    else if(p) {
		return Promise.resolver(Promise(p),r);
	    }
	    else return new Promise(r);
	}
	
	return new Promise(p);
    };

    
    /**
     * Helper for identifying a promise-like objects or functions
     * 
     * @param {Object} p - Object or Function to test
     * @return {Boolean} - Returns true if thenable or else false
     */
    Promise.thenable = function(p){
	var then;
	
	if(p && (typeof p === 'object' || typeof p === 'function')){
	    try { then = p.then; } catch (e) { return false; };
	}
	
	return (typeof then === 'function');
    };

    
    /**
     * Wrap a promise around function or constructor
     *
     * Example: wrap an Array
     *      p = Promise.wrap(Array);
     *      
     *      var r = c(1,2,3); // => calls Array constructor and returns fulfilled promise
     *      r.valueOf(); // => [1,2,3]; 
     *
     * @return {Function} function to wrap
     * @throws {Error} not wrappable
     * @api public
     */
    Promise.wrap = function(Klass,inst){
        var p = new Promise();

	if(!Klass) throw Error("Nothing to wrap!");
	
        return function(){
            var KC =  Klass.prototype.constructor,
		args = slice.call(arguments),
		ret;
		
	    
            if(typeof KC === 'function'){
		try {
		    ret = KC.apply(inst,args);
		    if(!(ret instanceof Klass)){
			KC = function(){};
			
			KC.prototype = Klass.prototype;

			inst = new KC();
			
			try {
			    ret = Klass.apply(inst,args);
			} catch (e){
			    p.reject(e);
			    return;
			}
			   
			ret = Object(ret) === ret ? ret : inst;
		    }
		    
		    p.resolve(ret);
		    
		} catch(err){
		    p.reject(err);
		}
	    } else throw Error("not wrappable");

            return p;
        };
    };

    
    /**
     * Deferres a task and returns a pending promise fulfilled with the return value from task.
     * The task may also return a promise itself which to wait on.
     *
     * Example: Make readFileSync async
     *      fs = require('fs');
     *      var asyncReadFile = Promise().defer(fs.readFileSync,'./index.js','utf-8');
     *      asyncReadFile.then(function(data){
     *          console.log(data)
     *      },function(error){
     *          console.log("Read error:", error);
     *      });
     *
     * @return {Object} - returns a pending promise
     * @api public
     */
    Promise.defer = function(){
        var args = slice.call(arguments),
            f = args.shift(),
            p = new Promise();

        if(typeof f === 'function'){
            task(enclose,args);
        }

        function enclose(){
            try {
		p.resolve(f.apply(p,args));
	    } catch(err) {
		p.reject(err);
	    }
        }

        return p;
    };

    
    /**
     * Make an asynchrounous funtion.
     *
     * Example: make readFile async
     *      fs = require('fs');
     *      var asyncReadFile = Promise.async(fs.readFile);
     *      asyncReadFile('package.json','utf8').then(function(data){
     *          console.log(data);
     *      },function(error){
     *          console.log("Read error:", error);
     *      });
     *
     * @return {Object} promise
     * @api public
     */
    Promise.async = function(func,cb){
	var p = new Promise(), called;

	if(typeof func !=='function')
	    throw new TypeError("func is not a function");
	
	var cb = typeof cb === 'function' ? cb : function (err,ret){
	    called = true;
	    
	    if(err) p.reject(err);
	    else if(err === 0) p.progress(ret);
	    else p.fulfill(ret);
	};
	
        return function(){
	    var args = slice.call(arguments);

	    args.push(cb);

	    task(function(){
		var ret;
		
		try {
		    ret = func.apply(null,args);
		} catch(err) {
		    cb(err);
		}
		
		if(ret !==undefined && !called) {
		    if(ret instanceof Error) cb(ret);
		    else cb(undefined,ret);
		}
	    });
	    
	    return p;
	};
    };
    
    /**
     * Check if promise is pending
     * 
     * @return {Boolean} - Returns true if pending or else false
     */
    Promise.prototype.isPending = function(){
	return !this._promise._state;
    };

    /**
     * Check if promise is fulfilled
     * 
     * @return {Boolean} - Returns true if pending or else false
     */
    Promise.prototype.isFulfilled = function(){
	return this._promise._state === FULFILLED;
    };

    /**
     * Check if promise is rejeced
     * 
     * @return {Boolean} - Returns true if pending or else false
     */ 
    Promise.prototype.isRejected = function(){
	return this._promise._state === REJECTED;
    };

    /**
     * Check if promise has resolved
     * 
     * @return {Boolean} - Returns true if pending or else false
     */ 
    Promise.prototype.hasResolved = function(){
	return !!this._promise._state;
    };

    /**
     * Get value if promise has been fulfilled
     * 
     * @return {Boolean} - Returns true if pending or else false
     */
    Promise.prototype.valueOf = function(){
	return this.isFulfilled() ? this._promise._value : undefined;
    };

    /**
     * Get reason if promise has rejected
     * 
     * @return {Boolean} - Returns true if pending or else false
     */
    Promise.prototype.reason = function(){
	return this.isRejected() ? this._promise._value : undefined;
    };
    
    /**
     * Attaches callback,errback,notify handlers and returns a promise
     *
     * Example: catch fulfillment or rejection
     *      var p = Promise();
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
    Promise.prototype.then = function(f,r,n){
        var p = new Promise();
	  
	this._promise._chain.push([p,f,r,n]);

	if(this._promise._state) task(traverse,[this._promise]);

        return p;
    };

    
    /**
     * Like `then` but spreads array into multiple arguments
     *
     * Example: Multiple fulfillment values
     *      p = Promise();
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
    Promise.prototype.spread = function(f,r,n){
        function s(v,a){
            if(!isArray(v)) v = [v];
            return f.apply(f,v.concat(a));
        }

        return this.then(s,r,n);
    };

    
    /**
     * Terminates chain of promises, calls onerror or throws on unhandled Errors
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
     *
     *      p.fulfill(142); // => v is: 142, throws [RangeError:'to large']
     *
     * Example: define onerror handler defined on promise
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
    Promise.prototype.done = function(f,r,n){	
        var self = this, p = this.then(f,catchError,n);

        function catchError(e){
            task(function(){
		if(typeof r === 'function') r(e);
                else if(typeof self.onerror === 'function'){
                    self.onerror(e);
                } else if(Promise.onerror === 'function'){
                    Promise.onerror(e);
                } else throw e;
            });
        }
    };

    /** 
     * Terminates chain, invokes a callback or throws Error on error 
     *
     * @param {Function} callback - Callback with value or Error object on error.
     * @api public
     */
    Promise.prototype.end = function(callback){
	
	this.then(callback,function(e){
	    if(!(e instanceof Error)){
		e = new Error(e);
	    }
	    
	    if(typeof callback === 'function') callback(e);
	    else throw e;
	});
    };


    /**
     * Catches errors, terminates promise chain and calls errBack handler.
     *
     *
     * Example: Catch error
     *      p = Promise();
     *      p.then(function(v){
     *          console.log("someone said:", v);  //-> "Hello there"
     *          return "boom!";
     *        })
     *       .then(function(v){ if(v === 'boom!') throw "something bad happened!";})
     *       .catch(function(e){
     *          console.log("error:",e);
     *       });
     *      p.resolve("Hello there");
     *
     * @param {Function} onError callback
     * @return undefined 
     * @api public
     */
    Promise.prototype.catch = function(errBack){
	this.done(undefined,errBack);
    };
    /**
     * Fulfills a promise with a `value`
     *
     *
     *  Example: fulfillment
     *      p = Promise();
     *      p.fulfill(123);
     *
     *  Example: multiple fulfillment values in array
     *      p = Promise();
     *      p.fulfill([1,2,3]);
     *      p.resolved; // => [1,2,3]
     *
     *  Example: Pass through opaque arguments (experimental)
     *      p = Promise();
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
    Promise.prototype.fulfill = function(value,opaque){

	if(!this._promise._state) {
	    this._promise._state = FULFILLED;
	    this._promise._value = value;
	    this._promise._opaque = opaque;
	    
	    task(traverse,[this._promise]);
	}
	
        return this;
    };


    /**
     * Rejects promise with a `reason`
     *
     *  Example:
     *      p = Promise();
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
    Promise.prototype.reject = function(reason,opaque){
	
	if(!this._promise._state){
	    this._promise._state = REJECTED;
	    this._promise._value = reason;
	    this._promise._opaque = opaque;
	    
	    task(traverse,[this._promise]);
	}
	
        return this;
    };

    /**
     * Resolves a promise and performs unwrapping if necessary  
     *
     *
     *  Example: resolve a literal
     *      p = Promise();
     *      p.resolve(123); // fulfills promise to 123
     *
     *  Example: resolve value from pending promise
     *      p1 = Promise();
     *      p2 = Promise();
     *      p1.resolve(p2);
     *      p2.fulfill(123) // => p1 fulfills to 123
     *
     * @param {Object} value - Promise or literal
     * @return {Object} promise
     * @api public
     */
    Promise.prototype.resolve = function(x,o){
        var then, z, p = this;

        if(!this._promise._state){
            if(x === p) p.reject(new TypeError("Promise cannot resolve itself!"));

            if(x && (typeof x === 'object' || typeof x === 'function')){
                try { then = x.then; } catch(e){ p.reject(e); }
            }

            if(typeof then !== 'function'){
		this.fulfill(x,o);
            } else if(!z){
                try {
                    then.apply(x,[function(y){
                        if(!z) {
                            p.resolve(y,o);
                            z = true;
                        }
                    },function(r){
                        if(!z) {
                            p.reject(r);
                            z = true;
                        }
                    }]);
                } catch(e) {
                    if(!z) {
			p.reject(e);
			z = true;
                    }
                }
            }
        }

        return this;
    };


    /**
     * Notifies attached handlers
     *
     *  Example:
     *      p = Promise();
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
    Promise.prototype.progress = function(){
        var notify, chain = this._promise._chain;

	for(var i = 0, l = chain.length; i < l; i++){
            if(typeof (notify = chain[i][2]) === 'function')
                notify.apply(this,arguments);
        }
    };

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
     * @param {Number} time - timeout value in ms or null to clear timeout
     * @param {Function} callback - optional timeout function callback
     * @throws {RangeError} If exceeded timeout
     * @return {Object} promise
     * @api public
     */
    Promise.prototype.timeout = function(msec,func){
        var p = this;

        if(msec === null) {
            if(this._promise._timeout)
		root.clearTimeout(this._promise._timeout);
	    
            this._promise._timeout = null;
        } else if(!this._promise._timeout){
            this._promise._timeout = root.setTimeout(onTimeout,msec);
        }

        function onTimeout(){
            var e = new RangeError("exceeded timeout");
            if(!this._promise._state) {
                if(typeof func === 'function') func(p);
                else if(typeof p.onerror === 'function') p.onerror(e);
                else throw e;
            }
        }

        return this;
    };

    /**
     * Resolves promise to a nodejs styled callback function(err,ret) 
     * and passes the callbacks return value down the chain.
     *
     * Example:
     *      function cb(err,ret){
     *        if(err) console.log("error(%s):",err,ret);
     *        else console.log("success:", ret);
     *
     *        return "nice";
     *      }
     *
     *      p = Promise();
     *      p.callback(cb)
     *       .then(function(cbret){ 
     *         console.log("callback says:", cbret); //-> callback says: nice 
     *      });
     *
     *      p.fulfill("ok"); //-> success: ok
     *
     * @param {Function} callback - Callback function
     * @return {Object} promise
     * @api public
     */
    Promise.prototype.callback = function(callback){
        return this.then(function(value,opaque){
            return callback(undefined,value,opaque);
        },function(reason,opaque){
	    var error = reason;
	    
	    if(!(error instanceof Error)){
		if(typeof reason === 'object'){
		    error = new Error(JSON.stringify(reason));
		    for(var k in reason)
			error[k] = reason[k];
		} else {
		    error = new Error(reason);
		}
	    }

            return callback(error,opaque);
        },function(progress){
            return callback(0,progress);
        });
    };
    
    /**
     * Joins promises and collects results into an array.
     * If any of the promises are rejected the chain is also rejected.
     *
     * Example: join with two promises
     *      a = Promise();
     *      b = Promise();
     *      c = Promise();
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
    Promise.prototype.join = function(j){
        var p = this,
            y = [],
            u = new Promise().resolve(p).then(function(v){y[0] = v;});

        if(arguments.length > 1) {
            j = slice.call(arguments);
        }

        if(!isArray(j)) j = [j];

	function stop(error){
	    u.reject(error);
	}
	
        function collect(i){
            j[i].then(function(v){
                y[i+1] = v;
            }).catch(stop);

            return function(){return j[i];};
        }

        for(var i = 0; i < j.length; i++){
            u = u.then(collect(i));
        }

        return u.then(function(){return y;});
    };

    /* Resolver function, yields a promised value to handlers */
    function traverse(_promise){
	var l, tuple = _promise._chain;
	
	if(!tuple.length) return;

	var t,p,h,v = _promise._value;
	
        while((t = tuple.shift())) {
	    p = t[0];
            h = t[_promise._state];

            if(typeof h === 'function') {
                try {
                    v = h(_promise._value,_promise._opaque);
		    p.resolve(v,_promise._opaque);
                } catch(e) {
		    p.reject(e);
                }
            } else {
		p._promise._state = _promise._state;
		p._promise._value = v;
		p._promise._opaque = _promise._opaque;
		
		task(traverse,[p._promise]);
            }
        }
    }

    /* expose this module */
    if(module && module.exports) module.exports = Promise;
    else if(typeof define ==='function' && define.amd) define(Promise);
    else root.Promise = Promise;
}(this));
