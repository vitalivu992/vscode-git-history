.PHONY: compile package clean test install

# help extract target and comment from Makefile
help:
	@echo "Usage: make <target>"
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?### .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?### "}; {printf "  \033[36m%-30s\033[0m %s\n", $$1, $$2}'

clean: ### Clean build artifacts
	rm -rf dist out *.vsix
	rm -rf screenshots/
	rm -rf .node_modules/

compile: ### Compile the extension
	npm install
	npm run compile

test: ### Run tests and capture screenshots
	npm run test 
	npm run screenshot

package: compile ### Package the extension into a .vsix file
	@command -v vsce >/dev/null 2>&1 || { echo "Installing vsce..."; npm install -g @vscode/vsce; }
	vsce package

install: package ### Install the packaged extension locally
	cursor --install-extension vscode-git-history-*.vsix
