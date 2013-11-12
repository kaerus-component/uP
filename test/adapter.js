var Promise = require('..');

exports.resolved = function(value) {
	var promise = Promise();
  	promise.fulfill(value);
  	return promise;
},

exports.rejected = function(reason) {
	var promise = Promise();
	promise.reject(reason);
	return promise;
}

exports.deferred = function(){
  var promise = Promise();
  
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
