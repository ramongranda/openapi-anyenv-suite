
# POSIX Makefile (Linux/WSL/Git Bash). Mirrors npm scripts.
PORT        ?= 8080
DIST_DIR    ?= dist
SCHEMA_LINT ?= 0

.PHONY: validate bundle report clean validate-npx bundle-npx grade grade-npx report-npx

	env SCHEMA_LINT=$(SCHEMA_LINT) pnpm run validate -- "$$FILE"
	@FILE=$(word 2,$(MAKECMDGOALS)); \
	if [ -z "$$FILE" ]; then echo "Usage: make validate <path/to/openapi.yaml>"; exit 2; fi; \
	echo "Validate (bundle + spectral lint) [SCHEMA_LINT=$(SCHEMA_LINT)]"; \
	env SCHEMA_LINT=$(SCHEMA_LINT) npm run validate -- "$$FILE"

	pnpm run bundle -- "$$FILE" --out "$(DIST_DIR)/bundled-$$(basename "$$FILE")"
	@FILE=$(word 2,$(MAKECMDGOALS)); \
	if [ -z "$$FILE" ]; then echo "Usage: make bundle <path/to/openapi.yaml>"; exit 2; fi; \
	echo "Bundle -> $(DIST_DIR)/bundled-$$(basename "$$FILE")"; \
	npm run bundle -- "$$FILE" --out "$(DIST_DIR)/bundled-$$(basename "$$FILE")"

	pnpm run report -- "$$FILE" --port $(PORT)

report:
	@FILE=$(word 2,$(MAKECMDGOALS)); \
	if [ -z "$$FILE" ]; then echo "Usage: make report <path/to/openapi.yaml>"; exit 2; fi; \
	echo "Report (HTML) on http://127.0.0.1:$(PORT)/grade-report.html"; \
	env SCHEMA_LINT=$(SCHEMA_LINT) pnpm run grade -- "$$FILE"

grade:
	@FILE=$(word 2,$(MAKECMDGOALS)); \
	if [ -z "$$FILE" ]; then echo "Usage: make grade <path/to/openapi.yaml>"; exit 2; fi; \
	echo "Grade (A-E) [SCHEMA_LINT=$(SCHEMA_LINT)]"; \
	env SCHEMA_LINT=$(SCHEMA_LINT) npm run grade -- "$$FILE"
	env SCHEMA_LINT=$(SCHEMA_LINT) pnpm run validate:npx -- "$$FILE"
# npx variants
validate-npx:
	@FILE=$(word 2,$(MAKECMDGOALS)); \
	if [ -z "$$FILE" ]; then echo "Usage: make validate-npx <path/to/openapi.yaml>"; exit 2; fi; \
	echo "Validate (npx) [SCHEMA_LINT=$(SCHEMA_LINT)]"; \
	pnpm run bundle:npx -- "$$FILE" --out "$(DIST_DIR)/bundled-$$(basename "$$FILE")"

bundle-npx:
	@FILE=$(word 2,$(MAKECMDGOALS)); \
	if [ -z "$$FILE" ]; then echo "Usage: make bundle-npx <path/to/openapi.yaml>"; exit 2; fi; \
	echo "Bundle (npx) -> $(DIST_DIR)/bundled-$$(basename "$$FILE")"; \
	env SCHEMA_LINT=$(SCHEMA_LINT) pnpm run grade:npx -- "$$FILE"

 

grade-npx:
	@FILE=$(word 2,$(MAKECMDGOALS)); \
	pnpm run report:npx -- "$$FILE" --port $(PORT)
	echo "Grade (npx) [SCHEMA_LINT=$(SCHEMA_LINT)]"; \
	env SCHEMA_LINT=$(SCHEMA_LINT) npm run grade:npx -- "$$FILE"

report-npx:
	@FILE=$(word 2,$(MAKECMDGOALS)); \
	if [ -z "$$FILE" ]; then echo "Usage: make report-npx <path/to/openapi.yaml>"; exit 2; fi; \
	echo "Report (npx) on http://127.0.0.1:$(PORT)/grade-report.html"; \
	npm run report:npx -- "$$FILE" --port $(PORT)

clean:
	@echo "Cleaning $(DIST_DIR)"; \
	rm -f $(DIST_DIR)/bundled-* $(DIST_DIR)/grade-report.json $(DIST_DIR)/grade-report.html

%:
	@true
