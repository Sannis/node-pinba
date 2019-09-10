#!/bin/sh

all: pinba.json

pinba.json: pinba.proto
		../node_modules/.bin/pbjs -t json ./pinba.proto -o ./pinba.json

.PHONY: all
