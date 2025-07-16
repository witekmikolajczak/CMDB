#!/usr/bin/env bash

RELATIVE_MODE=true
EXCLUDES=()

# Parse arguments
while [[ $# -gt 0 ]]
do
    case "$1" in
        --full-path)
            RELATIVE_MODE=false
            shift
            ;;
        --exclude)
            shift
            PATTERN="$1"
            # Determine how to exclude:
            # If pattern contains '*', use -not -name
            # Otherwise, treat it as directory pattern
            if [[ "$PATTERN" == *"*"* ]]; then
                # Filename pattern
                EXCLUDES+=( -not -name "$PATTERN" )
            else
                # Directory pattern
                EXCLUDES+=( -not -path "*/$PATTERN/*" )
            fi
            shift
            ;;
        *)
            # directories
            DIRS+=("$1")
            shift
            ;;
    esac
done

if [ ${#DIRS[@]} -eq 0 ]; then
    echo "Usage: $0 [--full-path] [--exclude pattern] dir1 [dir2 ...]"
    exit 1
fi

TMPFILE=$(mktemp)
BASE_DIR=$(pwd)

# Build the find command dynamically
# We'll end with something like: find DIR ... ${EXCLUDES[@]} -type f
for DIR in "${DIRS[@]}"; do
    find "$DIR" "${EXCLUDES[@]}" -type f | while read -r FILE; do
        if [ "$RELATIVE_MODE" = true ]; then
            REL_PATH="${FILE#$BASE_DIR/}"
            echo "### START FILE: $REL_PATH ###" >> "$TMPFILE"
            cat "$FILE" >> "$TMPFILE"
            echo "### END FILE: $REL_PATH ###" >> "$TMPFILE"
        else
            echo "### START FILE: $FILE ###" >> "$TMPFILE"
            cat "$FILE" >> "$TMPFILE"
            echo "### END FILE: $FILE ###" >> "$TMPFILE"
        fi
        echo >> "$TMPFILE"
    done
done

pbcopy < "$TMPFILE"
rm "$TMPFILE"