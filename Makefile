.PHONY: compile publish clean install

# Compile the extension
compile:
	npm run compile

# Package the extension into a .vsix file
publish: compile
	@command -v vsce >/dev/null 2>&1 || { echo "Installing vsce..."; npm install -g @vscode/vsce; }
	vsce package

# Clean build artifacts
clean:
	rm -rf dist out *.vsix

# Install the packaged extension locally
install: publish
	cursor --install-extension vscode-git-history-*.vsix
