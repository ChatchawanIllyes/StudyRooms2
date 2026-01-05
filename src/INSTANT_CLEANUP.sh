#!/bin/bash

# 🧹 INSTANT CLEANUP - Delete ALL old web files
# Run this ONCE to get a clean React Native project

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║           🧹 CLEANING UP OLD WEB FILES - PLEASE WAIT...              ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Count files before
BEFORE=$(find . -type f | wc -l)

# Delete old web UI components
echo "🗑️  Deleting /components/ (old web UI components)..."
rm -rf components/

# Delete old web app structure
echo "🗑️  Deleting /src/app/ (old web structure)..."
rm -rf src/app/

# Delete supabase backend
echo "🗑️  Deleting /supabase/ (backend files)..."
rm -rf supabase/

# Delete utils folder (has old supabase utilities)
echo "🗑️  Deleting /utils/ (old utilities)..."
rm -rf utils/

# Delete styles folder
echo "🗑️  Deleting /styles/ (CSS files)..."
rm -rf styles/

# Delete guidelines
echo "🗑️  Deleting /guidelines/ (optional guidelines)..."
rm -rf guidelines/

# Delete optional documentation files
echo "🗑️  Deleting extra .md files..."
rm -f ATTRIBUTIONS.md

# Count files after
AFTER=$(find . -type f | wc -l)
DELETED=$((BEFORE - AFTER))

echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ CLEANUP COMPLETE!                              ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Files deleted: $DELETED"
echo ""
echo "✨ Your project is now 100% clean React Native!"
echo ""
echo "📂 What's left (all React Native files):"
echo "   ✅ /src/screens/     - All app screens"
echo "   ✅ /src/context/     - Theme management"
echo "   ✅ /src/utils/       - Room utilities"
echo "   ✅ /App.tsx          - Main entry"
echo "   ✅ /package.json     - Dependencies"
echo "   ✅ Documentation     - All .md guides"
echo ""
echo "🚀 Next steps:"
echo "   1. npm install"
echo "   2. npx expo start"
echo "   3. Scan QR code with Expo Go"
echo ""
echo "🎉 Ready to code!"
