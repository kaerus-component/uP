KARMA = @./node_modules/karma/bin/karma
MOCHA = @./node_modules/mocha/bin/mocha
APLUS = @./node_modules/.bin/promises-aplus-tests
COMPONENT = @./node_modules/.bin/component

test: build test-promise test-aplus

build:
	$(COMPONENT) build -n micropromise

test-promise: test-node test-browser

test-node:
	$(MOCHA) --require should --reporter spec

test-browser:
	$(KARMA) start ./test/karma/karma.conf

test-aplus:
	$(APLUS) ./test/adapter.js 

doc: 
	@dox -a < index.js > doc
	@cat doc.header doc > README.md

.PHONY: test doc
