test: test-nodejs

test-nodejs:
	@echo "Running tests for nodejs"
	@./node_modules/.bin/promises-aplus-tests ./test/adapter.js

test-phantomjs:
	@echo "Running tests for phantomjs"
	@./node_modules/mocha-phantomjs/bin/mocha-phantomjs test/runner.html

.PHONY: test
