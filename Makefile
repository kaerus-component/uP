COMPONENT = @./node_modules/.bin/component

MOCHA = @./node_modules/mocha/bin/mocha
KARMA = @./node_modules/karma/bin/karma
APLUS = @./node_modules/.bin/promises-aplus-tests

build: node_modules components

node_modules:
	@echo "Installing nodejs dependencies"
	@npm i -d

components:
	@echo "Building component"
	$(COMPONENT) install
	$(COMPONENT) build --standalone uPromise

test: build test-node test-browser

test-node: node_modules
	$(APLUS) ./test/adapter.js
	$(MOCHA) --require should --reporter spec

test-browser: components
	$(KARMA) start ./test/karma/karma.conf

doc: 
	@dox -a < index.js > doc
	@cat doc.header doc > README.md

.PHONY: node_modules components test doc
