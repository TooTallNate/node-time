.PHONY: configure build test

test:
	@mocha

configure:
	@node-waf configure

build:
	@node-waf build
