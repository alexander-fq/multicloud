#!/bin/bash
# Script to stop PostgreSQL Podman container
# Run with: ./podman-stop.sh

echo "Stopping PostgreSQL container..."

if podman ps -a | grep -q tramites-postgres; then
    podman stop tramites-postgres
    echo "✓ PostgreSQL stopped"

    read -p "Do you want to remove the container? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        podman rm tramites-postgres
        echo "✓ Container removed"

        read -p "Do you want to remove the data volume? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            podman volume rm tramites-postgres-data
            echo "✓ Volume removed"
        fi
    fi
else
    echo "PostgreSQL container is not running"
fi
