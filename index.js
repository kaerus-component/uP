 /**      
 * Provides A+ compliant promises with some extras.   
 * @module uP
 * @name microPromise
 * @main uP
 */
var G;

try { G = global } catch(e) { try { G = window } catch(e) { G = this } }

(function(){
	"use strict";
 
	var task = G.setImmediate; // for non-blocking tasks

	if(!task){
        if(G.process && typeof G.process.nextTick === 'function') task = G.process.nextTick;
        else if(G.vertx && typeof G.vertx.runOnLoop === 'function') task = G.vertx.RunOnLoop;
        else if (G.MessageChannel && typeof G.MessageChannel === "function") {
            var fifo = [], channel = new G.MessageChannel();
            channel.port1.onmessage = function () { (fifo.shift())() };
            task = function (f){ fifo[fifo.length] = f; channel.port2.postMessage(); };
        } else task = function(f){ G.setTimeout(f,0) }; 
    }

    /**
     * Initializes and returns a promise
     * Provide an object to mixin the features or a resolver callback function.
     *  
     *  #### Examples:
     *       // require uP
     *       var uP = require('uP');
     *
     *       // get promise
     *       var p = uP();
     *
     *       // initialize promise with object
     *       var e = {x:42,test:function(){ this.fulfill(this.x) } };
     *       var p = uP(e);
     *       p.test();
     *       p.resolved(); // => 42
     *
     *       // initialize promise with resolver
     *       var r = function(r){ r.fulfill('hello') };
     *       p = a(r);
     *       p.resolved(); // => 'hello'
     *
     * @constructor
     * @static
     * @param {Object} o mixin
     * @return {Object} with promise features
     * @api public
     */
    function uP(o){
        o = o ? o : {};

        var states = ['pending','fulfilled','rejected'],
            state = 0, 
            value,
            timer, 
            tuple = [];

        /**
         * Attaches callback/errback handlers and returns a new promise 
         * 
         *  #### Examples:
         *      // catch fulfillment or rejection
         *      var p = uP();
         *      p.then(function(value){
         *          console.log("received:", value);
         *      },function(error){
         *          console.log("failed with:", error);
         *      });
         *      p.fulfill('hello world!'); // => 'received: hello world!'
         *
         *      // chainable then clauses
         *      p.then(function(v){
         *          console.log('v is:', v);
         *          if(v > 10) throw new RangeError('to large!'');
         *          return v*2;
         *      }).then(function(v){ 
         *          // gets v*2 from above
         *          console.log('v is:', v)
         *      },function(e){
         *          console.log('error2:', e);
         *      });
         *      p.fulfill(142); // => v is: 142, error2: [RangeError:'to large']
         *
         *      // null callbacks are ignored
         *      p.then(function(v){
         *          if(v < 0) throw v;
         *          return v;
         *      }).then(null,function(e){
         *          e = -e;
         *          return e;
         *      }).then(function(value){
         *          console.log('we got:', value);
         *      });
         *      p.fulfill(-5); // => we got: 5
         *      
         * @param {Function} onFulfill callback
         * @param {Function} onReject errback 
         * @return {Object} a decendant promise
         * @api public
         */
        o.then = function(f,r){
            var p = uP();

            tuple.push([p,f,r]);

            if(state) task( resolve );

            return p;
        }

        /**
         * Fulfills a promise with a value 
         * @param {Object} value literal or object
         * @return {Object} promise for chaining
         * @api public
         */
        o.fulfill = function(x){
            if(!state){

                state = 1;
                value = x;

                resolve();
            }

            return this;    
        }

        /**
         * Rejects promise with a reason
         * @param {Object} reason literal or object 
         * @return {Object} promise for chaining
         * @api public
         */
        o.reject = function(x){
            if(!state){

                state = 2;
                value = x;

                resolve();
            }

            return this;    
        }

        /**
         * Returns the resolved value  
         * @return {Object} resolved value
         * @api public
         */
        o.resolved = function(){
            return value;
        }

        /**
         * Return the current state  
         * @return {String} 'pending','fulfilled','rejected'
         * @api public
         */
        o.status = function(){
            return states[state];
        }

        /**
         * Makes a process/function asynchronous.
         * The process may also return a promise itself which to wait on.
         * Note: if the process returns undefined the promise will remain pending.  
         * 
         * #### Example:
         *      // make readFileSync async
         *      fs = require('fs');
         *      var asyncReadFile = p.async(fs.readFileSync,'./index.js');
         *      asyncReadFile.then(function(data){
         *          console.log(data.toString())
         *      },function(error){
         *          console.log("Read error:", error);
         *      });
         *      
         * @param {Function} proc
         * @param {...} args    
         * @return {Object} promise for chaining
         * @api public
         */
        o.async = function(){
            var self = this,
                args = Array.prototype.slice.call(arguments),
                proc = args.shift(),
                ret;

            task(function(){
                try {
                    ret = proc.apply(null,args);
                    if(isPromise(ret)) ret.then(self.fulfill,self.reject);
                    else if(ret !== undefined) self.fulfill(ret);
                } catch (e) {
                    self.reject(e);
                }
            });

            return this;
        }
        /**
         * Adapted for processes using a callback(err,ret). 
         * 
         * #### Example:
         *      // make readFile async
         *      fs = require('fs');
         *      var asyncReadFile = p.async2(fs.readFile,'./index.js');
         *      asyncReadFile.then(function(data){
         *          console.log(data.toString())
         *      },function(error){
         *          console.log("Read error:", error);
         *      });
         *         
         * @return {Object} promise for chaining
         * @api public
         */
        o.async2 = function(){
            var self = this,
                args = Array.prototype.slice.call(arguments);

            function callback(err,ret){ if(!e) self.fulfill(ret); else self.reject(ret); }

            args[args.length] = callback;

            return this.async.apply(this,args);
        }

        /**
         * Joins promises and assembles return values into an array.
         * If any of the promises rejects the rejection handler is called with the error.  
         * 
         * #### Example:
         *      // join two promises
         *      p = uP();
         *      a = uP();
         *      b = uP();
         *      p.join([a,b]).spread(function(x,y){
         *          console.log('a=%s, b=%s',x,y);
         *      },function(err){
         *          console.log('error=',e);
         *      });
         *      b.fulfill('hello');
         *      a.fulfill('world'); // => 'a=hello, b=world' 
         *      p.resolved(); // => ['hello','world']
         *              
         * @return {Object} promise for chaining
         * @api public
         */
        o.join = function(promises){
            var val = [], 
                self = this, 
                chain = uP().fulfill();

            if(!Array.isArray(promises)) promises = [promises];

            function collect(i){
                promises[i].then(function(v){
                    val[i] = v;
                });

                return function(){return promises[i]}    
            }

            for(var i = 0, l = promises.length; i < l; i++){
                chain = chain.then(collect(i));
            }

            chain.then(function(){self.fulfill(val)},function(e){self.reject(e)});

            return this;
        }

        /**
         * Spread has the same semantic as then() but splits multiple fulfillment values & rejection reasons into separate arguments  
         * 
         * #### Example:
         *      var p = uP();
         *      p.fulfill([1,2,3]).spread(function(a,b,c){
         *          console.log(a,b,c); // => 123
         *      });     
         *      
         * @param {Function} onFulfill callback with multiple arguments
         * @param {Function} onReject errback with multiple arguments  
         * @return {Object} promise for chaining
         * @api public
         */
        o.spread = function(f,r){	
            function s(h){
                return function(v){
                    if(!Array.isArray(v)) v = [v];
                    return h.apply(null,v);	
                }
            }

            return this.then(s(f),s(r));
        }

        /**
         * Timeout a pending promise and invoke callback function on timeout.
         * Without a callback it throws a RangeError('exceeded timeout').
         * @param {Number} time timeout value in ms or null to clear timeout
         * @param {Function} callback optional timeout function callback
         * @throws {RangeError} If exceeded timeout  
         * @return {Object} promise
         * @api public
         */
        o.timeout = function(t,f){
            var self = this;

            if(t === null || state) {
                clearTimeout(timer);
                timer = null;
            } else if(!timer){
                f = f ? f : function(){ self.reject(RangeError("exceeded timeout")) }
                timer = G.setTimeout(f,t);
            }       

            return this;
        }

        function resolve(){
            var t, p, v, h;

            v = value;

            while(t = tuple.shift()) {
                p = t[0];
                h = t[state];

                if(typeof h === 'function') {
                    try {
                        v = h.call(p,value);  
                    } catch(e) {
                        p.reject(e); 
                    }  

                    if(isPromise(v)) v.then(p.fulfill,p.reject);
                    else p.fulfill(v);   
                } else {
                    if(state == 1) p.fulfill(v);
                    else p.reject(v);
                }
            }
        }

        function isPromise(f){
            return f && typeof f.then === 'function';
        }

        if(typeof o === 'function') o.call(null,o);

        return o;
    }

    if(module && module.exports) module.exports = uP;
    else if(typeof define ==='function' && define.amd) define(uP); 
    else G.uP = uP;
})();
