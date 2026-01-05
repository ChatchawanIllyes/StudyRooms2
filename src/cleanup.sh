#!/bin/bash

# 🧹 Automated Cleanup Script for React Native Expo App
# This removes all old web-based files

echo "🧹 Starting cleanup..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the project root?"
    exit 1
fi

echo "📂 Deleting old web component folders..."

# Delete old web UI components
if [ -d "components" ]; then
    rm -rf components/
    echo "  ✅ Deleted /components/"
fi

# Delete old src/app structure
if [ -d "src/app" ]; then
    rm -rf src/app/
    echo "  ✅ Deleted /src/app/"
fi

# Delete supabase
if [ -d "supabase" ]; then
    rm -rf supabase/
    echo "  ✅ Deleted /supabase/"
fi

# Delete utils/supabase
if [ -d "utils/supabase" ]; then
    rm -rf utils/supabase/
    echo "  ✅ Deleted /utils/supabase/"
fi

# Delete utils folder if it's now empty
if [ -d "utils" ] && [ -z "$(ls -A utils)" ]; then
    rm -rf utils/
    echo "  ✅ Deleted empty /utils/"
fi

# Delete styles folder
if [ -d "styles" ]; then
    rm -rf styles/
    echo "  ✅ Deleted /styles/"
fi

# Delete guidelines (optional)
if [ -d "guidelines" ]; then
    rm -rf guidelines/
    echo "  ✅ Deleted /guidelines/"
fi

echo ""
echo "🎉 Cleanup complete!"
echo ""
echo "📦 Next steps:"
echo "  1. npm install"
echo "  2. npx expo start"
echo ""
echo "✨ Your project is now 100% clean React Native Expo!"