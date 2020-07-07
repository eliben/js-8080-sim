.PHONY: lint test

lint:
	jshint --exclude sim8080.js .

test:
	npm test
