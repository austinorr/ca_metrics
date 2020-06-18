MAKEFLAGS += --silent
.PHONY: ccombine help
.DEFAULT_GOAL := help

define PRINT_HELP_PYSCRIPT
import re, sys

for line in sys.stdin:
	match = re.match(r'^([a-zA-Z_-]+):.*?## (.*)$$', line)
	if match:
		target, help = match.groups()
		print("%-20s %s" % (target, help))
endef
export PRINT_HELP_PYSCRIPT

help:
	@python -c "$$PRINT_HELP_PYSCRIPT" < $(MAKEFILE_LIST)


combine: ## combine files
	cat \
	docs/static/js/entrypoint.js \
	docs/static/js/util.js \
	docs/static/js/map.js \
	docs/static/js/base_chart.js  \
	docs/static/js/bar_chart.js \
	docs/static/js/bubble_chart.js \
	docs/static/js/radial_chart.js  \
	docs/static/js/init.js  \
	> docs/static/build.js

