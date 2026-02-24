#!/bin/bash
# Script to configure Podman PATH for current session
# Add to ~/.bashrc for permanent configuration

echo "Configuring Podman..."

# Add Podman to PATH
export PATH="$PATH:/c/Users/Daren/AppData/Local/Programs/Podman"

# Create alias for convenience
alias podman='podman.exe'

# Verify Podman is accessible
if command -v podman.exe &> /dev/null; then
    echo "✓ Podman configured successfully"
    podman.exe --version
    echo ""
    echo "Podman machine status:"
    podman.exe machine list
    echo ""
    echo "Running containers:"
    podman.exe ps
else
    echo "✗ Error: Podman not found"
    exit 1
fi

echo ""
echo "To make this permanent, add these lines to ~/.bashrc:"
echo "  export PATH=\"\$PATH:/c/Users/Daren/AppData/Local/Programs/Podman\""
echo "  alias podman='podman.exe'"
