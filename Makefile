KARMA = @./node_modules/karma/bin/karma
MOCHA = @./node_modules/mocha/bin/mocha
APLUS = @./node_modules/.bin/promises-aplus-tests
COMPONENT = @./node_modules/.bin/component

test: test-promise test-aplus

build-component:
	@echo "Building webcomponent"
	$(COMPONENT) build --standalone uPromise

test-promise: test-node test-browser

test-node:
	$(MOCHA) --require should --reporter spec

test-browser: build-component
	$(KARMA) start ./test/karma/karma.conf

test-aplus:
	$(APLUS) ./test/adapter.js 

doc: 
	@dox -a < index.js > doc
	@cat doc.header doc > README.md

.PHONY: build-component test doc
