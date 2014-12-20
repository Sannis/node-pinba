#!/bin/sh

CURR_HEAD_SHA := $(firstword $(shell git show-ref --hash HEAD | cut -b -6) master)
GITHUB_PROJECT_NAME := Sannis/node-pinba
GITHUB_PROJECT_URL := https://github.com/${GITHUB_PROJECT_NAME}
API_SRC_URL_FMT := https://github.com/${GITHUB_PROJECT_NAME}/blob/${CURR_HEAD_SHA}/{file}\#L{line}
API_DEST_DIR := ./doc/api

all: npm-install

npm-install: npm-install-stamp

npm-install-stamp:
		npm install
		touch npm-install-stamp

clean:
		rm -rf ./node_modules
		rm -f npm-install-stamp

test: npm-install
		./node_modules/.bin/mocha test/test.js --slow 333 -R spec

test-coveralls: npm-install
		rm -rf ./lib-cov && ./node_modules/.bin/jscoverage lib lib-cov
		LIB_COV=1 ./node_modules/.bin/mocha tests/test.js --slow 333 -R mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js

lint: npm-install
		./node_modules/.bin/jshint . --show-non-errors

doc: ./lib/pinba.js
		rm -rf ${API_DEST_DIR}
		./node_modules/.bin/ndoc \
		  --gh-ribbon ${GITHUB_PROJECT_URL} \
		  --link-format ${API_SRC_URL_FMT} \
		  --output ${API_DEST_DIR} \
		  ./lib/pinba.js

.PHONY: all npm-install clean test test-coveralls lint doc
