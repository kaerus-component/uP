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

	var sI = G.setImmediate;

	if(!sI){
        if(G.process && typeof G.process.nextTick === 'function') sI = G.process.nextTick;
        else sI = setTimeout; 
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
         * @method async 
         * @param {Function} func alias for setImmediate 
         * @api public
         */
        o.async = sI;

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

            if(state) o.async(function(){ resolve() });

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
                    if(isP(v)) v.then(o.fulfill,o.reject);
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
            if(t === null || state) {
                clearTimeout(timer);
                timer = null;
            } else if(!timer){
                f = f ? f : function(){o.reject(RangeError("exceeded timeout"));}
                timer = setTimeout(f,t);
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

                    if(isP(v))
                        v.then(p.fulfill,p.reject);
                    else p.fulfill(v);   
                } else {
                    if(state == 1) p.fulfill(v);
                    else p.reject(v);
                }
            }
        }

        function isP(f){
            return f && typeof f.then === 'function';
        }

        return o;
    }

    if (module && module.exports) module.exports = uP;
    else G.uP = uP;
})();
