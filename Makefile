
all: clean configure build

clean:
	node-gyp clean

configure:
	node-gyp configure

build:
	node-gyp build

test:
	mocha --reporter spec

.PHONY: clean configure build test
