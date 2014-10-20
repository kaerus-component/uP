/*global uPromise, describe, it*/

var promise;

try{ promise = uPromise} catch(e) { promise = require('..'); }

describe("Constructor",function(){
    it("should be a function", function(){
	promise.should.be.a.Function;
    });
})
