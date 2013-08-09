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
     * @class uP
     * @constructor
     * @static
     * @param {Object} object to mixin
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
         * @method  then 
         * @param {Function} onFulfill callback
         * @param {Function} onReject errback 
         * @return {Object} promise
         * @api public
         */
        o.then = function(f,r){
            var p = uP();

            tuple.push([p,f,r]);

            if(state) task( resolve );

            return p;
        }

        /**
         * @method fulfill 
         * @param {Object} value fullfillment value
         * @return {Object} promise
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
         * @method reject 
         * @param {Object} reason rejection value 
         * @return {Object} promise
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
         * @method resolved  
         * @return {Object} resolved value
         * @api public
         */
        o.resolved = function(){
            return value;
        }

        /**
         * @method status  
         * @return {String} 'pending','fulfilled','rejected'
         * @api public
         */
        o.status = function(){
            return states[state];
        }

        /**
         * @method defer 
         * @param {Function} proc defers process execution   
         * @return {Object} promise
         * @api public
         */
        o.defer = function(proc){
            var v;

            o.async(function(){
                try {
                    v = proc.call(o);
                    if(isPromise(v)) v.then(o.fulfill,o.reject);
                    else o.fulfill(v);
                } catch (e) {
                    o.reject(e);
                }
            });

            return this;
        }

        /**
         * @method spread 
         * @param {Function} onFulfill callback with multiple arguments
         * @param {Function} onReject errback with multiple arguments  
         * @return {Object} promise
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
         * @method timeout 
         * @param {Number} time timeout value in ms or null to clear timeout
         * @param {Function} callback timeout function callback
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

        return o;
    }

    if(module && module.exports) module.exports = uP;
    else if(typeof define ==='function' && define.amd) define(uP); 
    else G.uP = uP;
})();
