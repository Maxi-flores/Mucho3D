#!/bin/bash

echo "🔧 Fixing Plasmic imports..."

TARGET="@/plasmic-init"
REPLACEMENT="../plasmic-init"

# Replace in all js, jsx, ts, tsx files under pages/
find pages -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|$TARGET|$REPLACEMENT|g" {} +

echo "✅ Done! All '@/plasmic-init' imports replaced with '../plasmic-init'"
