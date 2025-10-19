
# POSIX Makefile (Linux/WSL/Git Bash). Mirrors npm scripts.
PORT        ?= 8080
DIST_DIR    ?= dist
SCHEMA_LINT ?= 0

.PHONY: validate bundle preview swagger report clean validate-npx bundle-npx preview-npx grade grade-npx report-npx

validate:
	@FILE=$(word 2,$(MAKECMDGOALS)); \
	if [ -z "$$FILE" ]; then echo "Usage: make validate <path/to/openapi.yaml>"; exit 2; fi; \
	echo "Validate (bundle + spectral lint) [SCHEMA_LINT=$(SCHEMA_LINT)]"; \
	env SCHEMA_LINT=$(SCHEMA_LINT) npm run validate -- "$$FILE"

bundle:
	@FILE=$(word 2,$(MAKECMDGOALS)); \
	if [ -z "$$FILE" ]; then echo "Usage: make bundle <path/to/openapi.yaml>"; exit 2; fi; \
	echo "Bundle -> $(DIST_DIR)/bundled-$$(basename "$$FILE")"; \
	npm run bundle -- "$$FILE" --out "$(DIST_DIR)/bundled-$$(basename "$$FILE")"

preview:
	@FILE=$(word 2,$(MAKECMDGOALS)); \
	if [ -z "$$FILE" ]; then echo "Usage: make preview <path/to/openapi.yaml>"; exit 2; fi; \
	echo "Preview on http://127.0.0.1:$(PORT)"; \
	npm run preview -- "$$FILE" --port $(PORT)

swagger:
	@FILE=$(word 2,$(MAKECMDGOALS)); \
	if [ -z "$$FILE" ]; then echo "Usage: make swagger <path/to/openapi.yaml>"; exit 2; fi; \
	echo "Swagger UI on http://127.0.0.1:$(PORT)/swagger.html"; \
	npm run swagger -- "$$FILE" --port $(PORT)

report:
	@FILE=$(word 2,$(MAKECMDGOALS)); \
	if [ -z "$$FILE" ]; then echo "Usage: make report <path/to/openapi.yaml>"; exit 2; fi; \
	echo "Report (HTML) on http://127.0.0.1:$(PORT)/grade-report.html"; \
	npm run report -- "$$FILE" --port $(PORT)

grade:
	@FILE=$(word 2,$(MAKECMDGOALS)); \
	if [ -z "$$FILE" ]; then echo "Usage: make grade <path/to/openapi.yaml>"; exit 2; fi; \
	echo "Grade (A-E) [SCHEMA_LINT=$(SCHEMA_LINT)]"; \
	env SCHEMA_LINT=$(SCHEMA_LINT) npm run grade -- "$$FILE"

# npx variants
validate-npx:
	@FILE=$(word 2,$(MAKECMDGOALS)); \
	if [ -z "$$FILE" ]; then echo "Usage: make validate-npx <path/to/openapi.yaml>"; exit 2; fi; \
	echo "Validate (npx) [SCHEMA_LINT=$(SCHEMA_LINT)]"; \
	env SCHEMA_LINT=$(SCHEMA_LINT) npm run validate:npx -- "$$FILE"

bundle-npx:
	@FILE=$(word 2,$(MAKECMDGOALS)); \
	if [ -z "$$FILE" ]; then echo "Usage: make bundle-npx <path/to/openapi.yaml>"; exit 2; fi; \
	echo "Bundle (npx) -> $(DIST_DIR)/bundled-$$(basename "$$FILE")"; \
	npm run bundle:npx -- "$$FILE" --out "$(DIST_DIR)/bundled-$$(basename "$$FILE")"

preview-npx:
	@FILE=$(word 2,$(MAKECMDGOALS)); \
	if [ -z "$$FILE" ]; then echo "Usage: make preview-npx <path/to/openapi.yaml>"; exit 2; fi; \
	echo "Preview (npx) on http://127.0.0.1:$(PORT)"; \
	npm run preview:npx -- "$$FILE" --port $(PORT)

grade-npx:
	@FILE=$(word 2,$(MAKECMDGOALS)); \
	if [ -z "$$FILE" ]; then echo "Usage: make grade-npx <path/to/openapi.yaml>"; exit 2; fi; \
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
