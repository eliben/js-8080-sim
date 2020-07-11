.PHONY: lint test

lint:
	# jshint uses .jshintignore and .jshintrc
	jshint .

test:
	npm test
