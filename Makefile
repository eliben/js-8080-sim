.PHONY: lint test build

lint:
	# jshint uses .jshintignore and .jshintrc
	jshint .

test:
	npm test

build:
	browserify src/bundleMain.js --s js8080sim -o js8080simBundle.js
