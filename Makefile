.PHONY: lint test

lint:
	# jshint uses .jshintignore and .jshintrc
	jshint sim8080.js .

test:
	npm test
