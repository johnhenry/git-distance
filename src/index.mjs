import { execSync } from 'child_process';
import { distance } from 'fastest-levenshtein';

/**
 * Checks if a file exists in a specific branch
 * @param {string} branch - Branch name
 * @param {string} file - File path
 * @returns {boolean} True if file exists in branch
 * @example
 * const exists = fileExistsInBranch('main', 'src/index.mjs');
 */
const fileExistsInBranch = (branch, file) => {
  try {
    execSync(`git cat-file -e ${branch}:${file}`, { 
      stdio: ['pipe', 'pipe', 'ignore'] 
    });
    return true;
  } catch {
    return false;
  }
};

/**
 * Gets file content from a specific branch
 * @param {string} branch - Branch name
 * @param {string} file - File path
 * @param {boolean} verbose - Whether to output debug messages
 * @returns {string} File content or empty string if not found
 * @example
 * const content = getFileFromBranch('main', 'src/index.mjs', false);
 */
const getFileFromBranch = (branch, file, verbose = false) => {
  if (!fileExistsInBranch(branch, file)) {
    if (verbose) {
      console.error(`[DEBUG] File ${file} does not exist in branch ${branch} (treating as empty string, distance will be length of file in other branch)`);
    }
    return '';
  }
  
  try {
    if (verbose) {
      console.error(`[DEBUG] Fetching ${file} from branch ${branch}`);
    }
    return execSync(`git show ${branch}:${file}`, { 
      encoding: 'utf-8', 
      stdio: ['pipe', 'pipe', 'ignore'] 
    });
  } catch (error) {
    if (verbose) {
      console.error(`[DEBUG] Failed to fetch ${file} from ${branch}: ${error.message}`);
    }
    return '';
  }
};

/**
 * Gets the current git branch name
 * @param {boolean} verbose - Whether to output debug messages
 * @returns {string} Current branch name
 * @example
 * const current = getCurrentBranch(false);
 */
const getCurrentBranch = (verbose = false) => {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    if (verbose) {
      console.error(`[DEBUG] Current branch: ${branch}`);
    }
    return branch;
  } catch (error) {
    if (verbose) {
      console.error(`[DEBUG] Failed to get current branch: ${error.message}`);
    }
    throw new Error('Not in a git repository');
  }
};

/**
 * Gets list of changed files between two branches
 * @param {string} branch1 - First branch name
 * @param {string} branch2 - Second branch name
 * @param {boolean} verbose - Whether to output debug messages
 * @returns {string[]} Array of file paths
 * @example
 * const files = getChangedFiles('main', 'feature', false);
 */
const getChangedFiles = (branch1, branch2, verbose = false) => {
  try {
    if (verbose) {
      console.error(`[DEBUG] Getting changed files between ${branch1} and ${branch2}`);
    }
    const output = execSync(`git diff --name-only ${branch1}..${branch2}`, { 
      encoding: 'utf-8' 
    });
    const files = output.trim().split('\n').filter(Boolean);
    if (verbose) {
      console.error(`[DEBUG] Found ${files.length} changed files`);
    }
    return files;
  } catch (error) {
    if (verbose) {
      console.error(`[DEBUG] Failed to get changed files: ${error.message}`);
    }
    throw new Error(`Failed to compare branches: ${error.message}`);
  }
};

/**
 * Main CLI runner function
 * @example
 * run(); // Called from bin/git-distance.mjs
 */
const run = () => {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`Usage: git-distance <branch1> [branch2] [--verbose|-V] [--list|-L]

Compare Levenshtein distance of changed files between branches.
If branch2 is omitted, compares branch1 to current branch.

Options:
  --verbose, -V    Show debug messages
  --list, -L       Show per-file distances (default: only total)

Examples:
  git-distance main                    # Compare current branch to main (total only)
  git-distance main feature            # Compare main to feature branch (total only)
  git-distance main feature --list    # Compare with per-file breakdown
  git-distance main feature --verbose  # Compare with debug output`);
    process.exit(0);
  }

  // Extract flags and filter them out
  const verbose = args.includes('--verbose') || args.includes('-V');
  const list = args.includes('--list') || args.includes('-L');
  const branchArgs = args.filter(arg => 
    arg !== '--verbose' && arg !== '-V' && arg !== '--list' && arg !== '-L'
  );

  let branch1, branch2;

  if (branchArgs.length === 1) {
    branch1 = getCurrentBranch(verbose);
    branch2 = branchArgs[0];
    if (verbose) {
      console.error(`[DEBUG] Comparing current branch (${branch1}) to ${branch2}`);
    }
  } else if (branchArgs.length === 2) {
    branch1 = branchArgs[0];
    branch2 = branchArgs[1];
    if (verbose) {
      console.error(`[DEBUG] Comparing ${branch1} to ${branch2}`);
    }
  } else {
    console.error('Error: Invalid number of arguments. Use --help for usage.');
    process.exit(1);
  }

  const files = getChangedFiles(branch1, branch2, verbose);

  if (files.length === 0) {
    console.log('No changed files between branches.');
    process.exit(0);
  }

  let total = 0;
  const maxFileLen = list ? Math.max(...files.map((f) => f.length)) : 0;

  for (const file of files) {
    const contentA = getFileFromBranch(branch1, file, verbose);
    const contentB = getFileFromBranch(branch2, file, verbose);
    const dist = distance(contentA, contentB);
    total += dist;

    if (list) {
      console.log(`${file.padEnd(maxFileLen)}  ${dist}`);
    }
  }

  if (list) {
    console.log('─'.repeat(maxFileLen + 10));
  }
  console.log(total);
};

export { run, getFileFromBranch, getCurrentBranch, getChangedFiles, fileExistsInBranch };

