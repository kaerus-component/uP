var uP = require('..');

exports.resolved = function(value) {
	var promise = uP();
  	promise.fulfill(value);
  	return promise;
},

exports.rejected = function(reason) {
	var promise = uP();
	promise.reject(reason);
	return promise;
}

exports.deferred = function(){
  var promise = uP();
  
  return {
  	promise: promise,
  	resolve: function(value) {
  		promise.fulfill(value);
  	},
  	reject: function(error){
		  promise.reject(error);
  	}
  }
}
