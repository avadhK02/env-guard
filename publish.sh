#!/bin/bash
set -e

echo "🔨 Building package..."
npm run build

echo "🧪 Running tests..."
npm test

echo "🔍 Dry run (preview what will be published)..."
npm publish --dry-run

read -p "📦 Publish to npm? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    npm publish --access public
    echo "✅ Published successfully!"
    echo "📊 Package info:"
    npm view env-guard
else
    echo "❌ Publish cancelled."
fi
