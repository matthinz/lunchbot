.PHONY: build clean start test

build: dist

clean:
	rm -rf dist

start: build
	yarn start

test: build
	yarn test

dist: node_modules $(shell find src -name "*.ts")
	-rm -rf $@
	yarn build && touch $@

node_modules: package.json yarn.lock
	yarn && touch $@
