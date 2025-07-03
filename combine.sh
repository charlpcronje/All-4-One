#!/bin/bash

# Usage: ./combine.sh "py js ts json" "node_modules venv package-lock.json"
INCLUDE_EXTENSIONS=($1)
EXCLUDE_PATTERNS=($2)
OUTPUT="combined.md"
> "$OUTPUT"

# Build find expression for included extensions
EXT_EXPR=""
for ext in "${INCLUDE_EXTENSIONS[@]}"; do
    EXT_EXPR="$EXT_EXPR -o -name *.$ext"
done
EXT_EXPR="${EXT_EXPR# -o }"

# Build prune expression for excluded dirs/files
PRUNE_EXPR=""
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    PRUNE_EXPR="$PRUNE_EXPR -o -name $pattern"
done
PRUNE_EXPR="${PRUNE_EXPR# -o }"

# Run find
find . \( $PRUNE_EXPR \) -prune -false -o \( $EXT_EXPR \) -type f \
  | sort \
  | while read -r file; do
    echo -e "\n\n---\n### File: \`$file\`\n\n\`\`\`${file##*.}" >> "$OUTPUT"
    cat "$file" >> "$OUTPUT"
    echo -e "\n\`\`\`" >> "$OUTPUT"
done

echo "✅ Combined files written to $OUTPUT"
