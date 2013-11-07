 /**      
 * Provides A+ v1.1 compliant promises.   
 * @module uP
 * @name microPromise
 * @main uP
 */

(function(root){
    "use strict";

    var task; // for non-blocking tasks

    if(typeof root !== 'function') {
        try { root = global } catch(e) { try { root = window } catch(e) {} }

        task = root.setImmediate;

        if(typeof task !== 'function'){
            if(root.process && typeof root.process.nextTick === 'function') task = root.process.nextTick;
            else if(root.vertx && typeof root.vertx.runOnLoop === 'function') task = root.vertx.RunOnLoop;
            else if(root.vertx && typeof root.vertx.runOnContext === 'function') task = root.vertx.runOnContext;
            else if (root.MessageChannel && typeof root.MessageChannel === 'function') {
                var fifo = [], channel = new root.MessageChannel();
                channel.port1.onmessage = function () { (fifo.shift())() };
                task = function (f){ fifo[fifo.length] = f; channel.port2.postMessage(); };
            } 
            else if(typeof root.setTimeout === 'function') task = function(f){ root.setTimeout(f,0) };
            else throw new Error("No candidate for setImmediate()"); 
        }
    } else task = root;

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
        "use strict";

        proto = proto ? proto : {};

        var promise,
            states = ['pending','fulfilled','rejected'],
            state = 0, 
            value,
            timer, 
            tuple = [];

        promise = Object.create(proto,{
            then: {value: then},
            done: {value: done},
            defer:{ value: defer },
            fulfill: {value: fulfill},
            reject: {value:  reject},
            resolve: {value:  resolve},
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
            resolved: {get: function(){return value}},
            isPending: {get: function(){return state === 0}}
        });

        if(typeof proto === 'function') proto(promise);

        
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
        function then(f,r,n){
            var p = uP(proto);

            tuple[tuple.length] = [p,f,r,n];

            if(state) task(resolver);

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
        function done(f,r,n){
            
            if(typeof r !== 'function') r = handleError;

            var p = this.then(f,r,n);
        
            function handleError(e){
                task(function(){
                    if(typeof promise.onerror === 'function'){
                        promise.onerror(e);
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
         *      p.resolved; // => 123
         *  Example: multiple fulfillment values
         *      p = uP();
         *      p.fulfill(1,2,3);
         *      p.resolved; // => [1,2,3]
         *      
         * @param {Object} value
         * @return {Object} promise
         * @api public
         */
        function fulfill(x){
            if(!state){

                if(arguments.length > 1)
                x = [].slice.call(arguments);

                state = 1;
                value = x;

                task(resolver);
            }

            return this;    
        }

        /**
         * Rejects promise with a `reason`
         *
         *  Example:
         *      p = uP();
         *      p.reject('some error');
         *      p.status; // => 'rejected'
         *      p.resolved; // => 'some error'
         *      
         * @param {Object} reason 
         * @return {Object} promise
         * @api public
         */
        function reject(x){
            if(!state){

                state = 2;
                value = x;

                task(resolver);
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

        function resolver(){
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
                    if(state == 1) p.fulfill(x);
                    else if(state == 2) p.reject(x);
                }
            }
        }

        function resolve(x){
            var thenable, z = 0, p = this;

            if(x === p) reject(new TypeError("x === p"));

            if(x && (typeof x === 'object' || typeof x === 'function')){
                try { thenable = x.then } catch(e){ reject(e) }
            }

            if(typeof thenable === 'function'){
                try {
                    thenable.apply(x,[function(y){
                        if(!z++) p.resolve(y);
                    },function(r){
                        if(!z++) p.reject(r);
                    }]);
                } catch(e) {
                    if(!z++) reject(e);
                }    
            } else {
                fulfill(x);
            }
        }

        return promise;
    }

    /* expose this module */
    if(module && module.exports) module.exports = uP;
    else if(typeof define ==='function' && define.amd) define(uP); 
    else root.uP = uP;
})(this);

