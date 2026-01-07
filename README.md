# git-distance

Calculate Levenshtein distance between git branches for all changed files.

## Installation

```bash
npm install -g git-distance
```

Or use locally:

```bash
npm link
```

## Usage

```bash
# Compare current branch to main
git-distance main

# Compare two specific branches
git-distance main feature-branch
```

## Output

The tool displays the Levenshtein distance for each changed file and a total:

```
src/index.mjs      847
src/utils.mjs      124
README.md          60
───────────────────────
total              1031
```

## How it works

1. Finds all files that differ between the two branches using `git diff --name-only`
2. Retrieves the content of each file from both branches
3. Calculates the Levenshtein distance between the two versions
4. Displays results per file and a total distance

## Requirements

- Node.js 14.0.0 or higher
- Git repository

