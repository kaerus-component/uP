var G;

try { G = global } catch(e) { try { G = window } catch(e) { G = this } }

(function(){
	"use strict";

	var sI = G.setImmediate;

	if(!sI){
	    if(G.process && typeof G.process.nextTick === 'function') {
	        sI = G.process.nextTick;
	    } else if(G.setTimeout) {
	        sI = G.setTimeout;
	    } else throw new Error("No candidate for setImmediate");  
	}

	function uP(o){
		o = o ? o : {};

		var state = 0, value = undefined, handlers = [];

		o.then = function(f,r){
			var p = uP();

			handlers.push([p,f,r]);
			
			if(state) sI(function(){ resolve() });

			return p;
		}

		o.fulfill = function(x){
			if(state) return;

	    	state = 1;
	    	value = x;

	    	resolve();
		}

		o.reject = function(x){
			if(state) return;

			state = 2;
			value = x;

			resolve();
		}

		function resolve(){
			var t, p, v, h;
			
			v = value;
	    	
	    	while(t = handlers.shift()) {
	        	p = t[0];
	        	h = t[state];

	        	if(typeof h === 'function') {
	            	try {
	                	v = h.call(p,value);  
	            	} catch(e) {
	                	p.reject(e); 
	            	}  

	            	if(v && typeof v.then === 'function')
	            		v.then(p.fulfill,p.reject);
	            	else p.fulfill(v);   
	        	} else {
	            	if(state == 1) p.fulfill(v);
	            	else p.reject(v);
	        	}
	    	}
		}

		return o;
	}

	if (module && module.exports) module.exports = uP;
	else G.uP = uP;

})();
