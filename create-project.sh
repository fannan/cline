#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check arguments
if [ -z "$1" ]; then
    echo -e "${RED}Usage: $0 <project-name>${NC}"
    echo "Example: $0 my-app"
    exit 1
fi

PROJECT_NAME="$1"
PROJECT_DIR="$(pwd)/$PROJECT_NAME"

# Check if directory exists
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${RED}Error: Directory '$PROJECT_NAME' already exists${NC}"
    exit 1
fi

echo -e "${BLUE}Creating project: $PROJECT_NAME${NC}"

# Copy template
cp -r "$SCRIPT_DIR/template" "$PROJECT_DIR"

# Get template version
TEMPLATE_VERSION=$(git -C "$SCRIPT_DIR" describe --tags --always 2>/dev/null || echo "dev")
echo "$TEMPLATE_VERSION" > "$PROJECT_DIR/.template-version"

# Replace placeholders
cd "$PROJECT_DIR"

# Update package names
find . -type f -name "*.json" -exec sed -i '' "s/@my-app/@$PROJECT_NAME/g" {} \; 2>/dev/null || \
find . -type f -name "*.json" -exec sed -i "s/@my-app/@$PROJECT_NAME/g" {} \;

find . -type f -name "*.json" -exec sed -i '' "s/\"my-app\"/\"$PROJECT_NAME\"/g" {} \; 2>/dev/null || \
find . -type f -name "*.json" -exec sed -i "s/\"my-app\"/\"$PROJECT_NAME\"/g" {} \;

# Update CLAUDE.md
sed -i '' "s/My App/$PROJECT_NAME/g" CLAUDE.md 2>/dev/null || \
sed -i "s/My App/$PROJECT_NAME/g" CLAUDE.md

# Update wrangler.toml
if [ -f packages/api/wrangler.toml ]; then
    sed -i '' "s/my-app-api/$PROJECT_NAME-api/g" packages/api/wrangler.toml 2>/dev/null || \
    sed -i "s/my-app-api/$PROJECT_NAME-api/g" packages/api/wrangler.toml
fi

# Initialize git
git init -q
git add .
git commit -q -m "Initial commit from marcella-framework ($TEMPLATE_VERSION)"

echo ""
echo -e "${GREEN}Project created successfully!${NC}"
echo ""
echo "Next steps:"
echo "  cd $PROJECT_NAME"
echo "  npm install"
echo "  npm run dev"
echo ""
echo "To add services:"
echo "  cp -r $SCRIPT_DIR/services/d1 packages/shared/d1"
echo "  cp -r $SCRIPT_DIR/services/slack packages/shared/slack"
echo ""
