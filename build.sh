#!/bin/sh

rm -rf build time.node;
node-waf configure && node-waf build && cp ./build/default/time.node .;
