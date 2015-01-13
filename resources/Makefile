#!/bin/sh

all: pinba.json

pinba.json: pinba.proto
		../node_modules/.bin/proto2js ./pinba.proto > ./pinba.json

.PHONY: all
