.PHONY: lint test bundle

lint:
	# jshint uses .jshintignore and .jshintrc
	jshint .

test:
	npm test

bundle:
	browserify src/bundleMain.js --s js8080sim -o js8080simBundle.js
