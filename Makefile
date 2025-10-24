
# POSIX Makefile (Linux/WSL/Git Bash). Mirrors npm scripts.
PORT        ?= 8080
DIST_DIR    ?= dist
## POSIX Makefile (Linux/WSL/Git Bash). Mirrors npm scripts.
PORT        ?= 8080
DIST_DIR    ?= dist
SCHEMA_LINT ?= 0

.PHONY: check report clean

check:
	@FILE=$(word 2,$(MAKECMDGOALS)); \
	if [ -z "$$FILE" ]; then echo "Usage: make check <path/to/openapi.yaml>"; exit 2; fi; \
	echo "Check (bundle + lint + report) [SCHEMA_LINT=$(SCHEMA_LINT)]"; \
	env SCHEMA_LINT=$(SCHEMA_LINT) pnpm run check -- "$$FILE"

report:
	@FILE=$(word 2,$(MAKECMDGOALS)); \
	if [ -z "$$FILE" ]; then echo "Usage: make report <path/to/openapi.yaml>"; exit 2; fi; \
	echo "Report (HTML) on http://127.0.0.1:$(PORT)/grade-report.html"; \
	env SCHEMA_LINT=$(SCHEMA_LINT) pnpm run report -- "$$FILE"

clean:
	@echo "Cleaning $(DIST_DIR)"; \
	rm -f $(DIST_DIR)/bundled-* $(DIST_DIR)/grade-report.json $(DIST_DIR)/grade-report.html

%:
	@true
	@FILE=$(word 2,$(MAKECMDGOALS)); \
