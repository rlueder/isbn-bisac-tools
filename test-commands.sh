#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run a test
run_test() {
  local test_name="$1"
  local command="$2"

  echo -e "${BLUE}Testing:${NC} $test_name"
  echo -e "${YELLOW}Command:${NC} $command"
  echo -e "${YELLOW}Output:${NC}"

  eval "$command"
  local status=$?

  if [ $status -eq 0 ]; then
    echo -e "${GREEN}✓ Test passed${NC}"
  else
    echo -e "${RED}✗ Test failed (exit code: $status)${NC}"
  fi

  echo -e "\n${BLUE}--------------------------------------${NC}\n"
}

# Main test function
main() {
  echo -e "${BLUE}=== Testing ISBN-BISAC Tools CLI ====${NC}\n"

  # Test help command
  run_test "Help command" "node dist/src/cli.js --help"

  # Test version command
  run_test "Version command" "node dist/src/cli.js --version"

  # Test lookup command help
  run_test "Lookup command help" "node dist/src/cli.js lookup --help"

  # Test ISBN command help
  run_test "ISBN command help" "node dist/src/cli.js isbn --help"

  # Test scrape command help
  run_test "Scrape command help" "node dist/src/cli.js scrape --help"

  # Test browse command help
  run_test "Browse command help" "node dist/src/cli.js browse --help"

  # Test compare command help
  run_test "Compare command help" "node dist/src/cli.js compare --help"

  # Test export command help
  run_test "Export command help" "node dist/src/cli.js export --help"

  echo -e "${BLUE}=== All tests completed ====${NC}"
}

# Run the tests
main
