COMPONENT = @./node_modules/.bin/component

MOCHA = @./node_modules/mocha/bin/mocha
KARMA = @./node_modules/karma/bin/karma
APLUS = @./node_modules/.bin/promises-aplus-tests

build: build-nodejs build-component

build-nodejs:
	@echo "Installing nodejs dependencies"
	@npm i -d

build-component:
	@echo "Building component"
	$(COMPONENT) install
	$(COMPONENT) build --standalone uPromise

test: test-node test-browser

test-node: build-nodejs
	$(MOCHA) --require should --reporter spec
	$(APLUS) ./test/adapter.js

test-browser: build-component
	$(KARMA) start ./test/karma/karma.conf

doc: 
	@dox -a < index.js > doc
	@cat doc.header doc > README.md

.PHONY: build test doc
