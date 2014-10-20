/*global Promise, describe, it*/

var promise;

console.log("promise",promise);
try {
    promise = require('micropromise');
}
catch (e) {
    promise = require('..');
}

describe("Constructor",function(){
    it("should be a function", function(){
	promise.should.be.a.Function;
    });
})
