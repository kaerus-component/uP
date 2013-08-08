var uP = require('..');

exports.fulfilled = function(value) {
	var promise = uP();
  	promise.fulfill(value);
  	return promise;
},

exports.rejected = function(reason) {
	var promise = uP();
	promise.reject(reason);
	return promise;
},

exports.pending = function() {
  var promise = uP();
  return {
  	promise: promise,
  	fulfill: function(value) {
  		promise.fulfill(value);
  	},
  	reject: function(error){
		promise.reject(error);
  	}
  }
}