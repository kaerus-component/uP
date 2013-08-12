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
     *  Example: require uP
     *       var uP = require('uP');
     *
     *  Example: get a new promise
     *       var p = uP();
     *
     *  Example: initialize with object
     *       var e = {x:42,test:function(){ this.fulfill(this.x) } };
     *       var p = uP(e);
     *       p.test();
     *       // resolved getter contains the value 
     *       p.resolved; // => 42
     *       // status getter contains the state
     *       p.status; // => 'fulfilled'
     *
     *  Example: initialize with a function
     *       var r = function(r){ r.fulfill('hello') };
     *       p = a(r);
     *       p.resolved; // => 'hello'
     *
     * @constructor
     * @static
     * @param {Object} o
     * @return {Object} promise
     * @api public
     */
    function uP(proto){
        proto = proto ? proto : {};

        var states = ['pending','fulfilled','rejected'],
            state = 0, 
            value,
            timer, 
            tuple = [];

         /**
         * Attaches callback/errback handlers and returns a new promise 
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
         * Example: null callbacks are ignored
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
        function then(f,r){
            var p = uP();

            tuple.push([p,f,r]);

            if(state) task( resolve );

            return p;
        }

        /**
         * Fulfills a promise with a `value` 
         * 
         * @param {Object} value
         * @return {Object} promise
         * @api public
         */
        function fulfill(x){
            if(!state){

                state = 1;
                value = x;

                resolve();
            }

            return this;    
        }

        /**
         * Rejects promise with a `reason`
         * 
         * @param {Object} reason 
         * @return {Object} promise
         * @api public
         */
        function reject(x){
            if(!state){

                state = 2;
                value = x;

                resolve();
            }

            return this;    
        }
        /**
        * Run `task` after nextTick / event loop or fulfill promise unless task is a function.
        * 
        * Example:
        *       function t1(){ throw new Error('to late!') }
        *       p.defer(t1); 
        *       p.status; // => 'pending'
        *       // after nextTick 
        *       p.status; // => 'rejected'
        *       p.resolved; // => [ERROR: 'to late!']
        * Example:
        *       p.defer([task1,task2,task3]);
        *       // schedules task1-3 to run after nextTick
        * Example: 
        *       p.defer('hello');
        *       // ... after nextTick
        *       p.resolved; // 'hello'
        *       p.status; // 'fulfilled'
        *
        * @param {Function} task
        * @return {Object} value
        * @api public 
        */
        function defer(t){
            if(typeof t === 'function') task(enclose(t));
            else if(Array.isArray(t)) for(var i in t) defer(t[i]);
            else fulfill(t);

            return this;
        }

        function enclose(func){
            try { func.call(promise) } catch(err) { reject(err) }
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

        var promise = Object.create(proto,{
            then: {value: then},
            defer:{ value: defer },
            fulfill: {value: fulfill},
            reject: {value:  reject},
            /**
            * returns `status` of promise which can be either 'pending', 'fulfilled' or 'rejected'
            * 
            * @attribute status 
            * @return {String} status
            * @api public 
            */
            status: {get: function(){return states[state]}},
            /**
            * returns the resolved `value`, either from fulfillment or rejection.
            * 
            * @attribute resolved
            * @return {Object} value
            * @api public 
            */
            resolved: {get: function(){return value}}
        });

        // todo: return constructor? 
        if(typeof proto === 'function') proto(promise);

        return promise;
    }


    if(module && module.exports) module.exports = uP;
    else if(typeof define ==='function' && define.amd) define(uP); 
    else G.uP = uP;
})();
