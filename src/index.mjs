import { execSync } from 'child_process';
import { distance } from 'fastest-levenshtein';

/**
 * Calculates Hamming distance between two strings
 * For strings of different lengths, pads the shorter string with spaces
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Hamming distance
 * @example
 * const dist = hammingDistance('abc', 'abd'); // Returns 1
 */
const hammingDistance = (str1, str2) => {
  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);
  
  // Pad shorter string with spaces
  const padded1 = str1.padEnd(maxLen, ' ');
  const padded2 = str2.padEnd(maxLen, ' ');
  
  let distance = 0;
  for (let i = 0; i < maxLen; i++) {
    if (padded1[i] !== padded2[i]) {
      distance++;
    }
  }
  return distance;
};

/**
 * Calculates the difference in character count between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Character count difference (can be negative)
 * @example
 * const diff = calculateAdditions('abc', 'abcdef'); // Returns 3
 */
const calculateAdditions = (str1, str2) => {
  return str2.length - str1.length;
};

/**
 * Calculates Damerau-Levenshtein distance (includes transpositions)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Damerau-Levenshtein distance
 * @example
 * const dist = damerauLevenshtein('ab', 'ba'); // Returns 1 (transposition)
 */
const damerauLevenshtein = (str1, str2) => {
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0) return len2;
  if (len2 === 0) return len1;
  
  // Create matrix
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
  
  // Initialize first row and column
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;
  
  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
      
      // Check for transposition
      if (i > 1 && j > 1 && 
          str1[i - 1] === str2[j - 2] && 
          str1[i - 2] === str2[j - 1]) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + cost);
      }
    }
  }
  
  return matrix[len1][len2];
};

/**
 * Calculates Jaro-Winkler similarity and converts to distance
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Jaro-Winkler distance (1 - similarity)
 * @example
 * const dist = jaroWinkler('MARTHA', 'MARHTA'); // Returns low value (high similarity)
 */
const jaroWinkler = (str1, str2) => {
  if (str1 === str2) return 0;
  if (str1.length === 0 || str2.length === 0) return 1;
  
  const matchWindow = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
  const str1Matches = Array(str1.length).fill(false);
  const str2Matches = Array(str2.length).fill(false);
  
  let matches = 0;
  let transpositions = 0;
  
  // Find matches
  for (let i = 0; i < str1.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, str2.length);
    
    for (let j = start; j < end; j++) {
      if (str2Matches[j] || str1[i] !== str2[j]) continue;
      str1Matches[i] = true;
      str2Matches[j] = true;
      matches++;
      break;
    }
  }
  
  if (matches === 0) return 1;
  
  // Find transpositions
  let k = 0;
  for (let i = 0; i < str1.length; i++) {
    if (!str1Matches[i]) continue;
    while (!str2Matches[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }
  
  // Calculate Jaro similarity
  const jaro = (
    matches / str1.length +
    matches / str2.length +
    (matches - transpositions / 2) / matches
  ) / 3;
  
  // Calculate Winkler modification (prefix bonus)
  let prefixLen = 0;
  const maxPrefix = Math.min(4, Math.min(str1.length, str2.length));
  for (let i = 0; i < maxPrefix; i++) {
    if (str1[i] === str2[i]) prefixLen++;
    else break;
  }
  
  const winkler = jaro + (0.1 * prefixLen * (1 - jaro));
  
  // Return distance (1 - similarity)
  return 1 - winkler;
};

/**
 * Calculates the length of the longest common subsequence
 * Returns the difference from max length as distance measure
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Distance based on LCS (max length - LCS length)
 * @example
 * const dist = longestCommonSubsequence('ABCDGH', 'AEDFHR'); // LCS is 'ADH', returns 3
 */
const longestCommonSubsequence = (str1, str2) => {
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0 || len2 === 0) return Math.max(len1, len2);
  
  // Create DP table
  const dp = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
  
  // Fill DP table
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  const lcsLength = dp[len1][len2];
  const maxLength = Math.max(len1, len2);
  
  // Return difference as distance measure
  return maxLength - lcsLength;
};

/**
 * Calculates the difference in line count between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Line count difference (can be negative)
 * @example
 * const diff = lineCountDifference('line1\nline2', 'line1\nline2\nline3'); // Returns 1
 */
const lineCountDifference = (str1, str2) => {
  const lines1 = str1.split('\n').length;
  const lines2 = str2.split('\n').length;
  return lines2 - lines1;
};

/**
 * Calculates the difference in word count between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Word count difference (can be negative)
 * @example
 * const diff = wordCountDifference('hello world', 'hello world test'); // Returns 1
 */
const wordCountDifference = (str1, str2) => {
  const words1 = str1.split(/\s+/).filter(Boolean).length;
  const words2 = str2.split(/\s+/).filter(Boolean).length;
  return words2 - words1;
};

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
    console.log(`Usage: git-distance <branch1> [branch2] [options] [distance-measure]

Compare distance metrics of changed files between branches.
If branch2 is omitted, compares branch1 to current branch.

Options:
  --verbose, -V    Show debug messages
  --list, -L       Show per-file distances (default: only total)

Distance Measures (mutually exclusive, default: Levenshtein):
  --hamming              Hamming distance (character differences, padded for length)
  --additions            Character count difference (can be negative)
  --damerau-levenshtein  Levenshtein distance with transpositions
  --jaro-winkler         Jaro-Winkler similarity converted to distance
  --lcs                  Longest Common Subsequence distance
  --lines                Line count difference (can be negative)
  --words                Word count difference (can be negative)

Examples:
  git-distance main                              # Levenshtein distance (default)
  git-distance main feature --hamming            # Hamming distance
  git-distance main feature --additions --list   # Character additions with per-file breakdown
  git-distance main feature --lines --verbose     # Line count difference with debug output`);
    process.exit(0);
  }

  // Extract flags and filter them out
  const verbose = args.includes('--verbose') || args.includes('-V');
  const list = args.includes('--list') || args.includes('-L');
  
  // Distance measure flags
  const distanceFlags = [
    '--hamming',
    '--additions',
    '--damerau-levenshtein',
    '--jaro-winkler',
    '--lcs',
    '--lines',
    '--words'
  ];
  
  // Check for distance measure flags
  const selectedDistanceFlags = distanceFlags.filter(flag => args.includes(flag));
  
  // Ensure only one distance measure is specified
  if (selectedDistanceFlags.length > 1) {
    console.error(`Error: Multiple distance measures specified: ${selectedDistanceFlags.join(', ')}`);
    console.error('Please specify only one distance measure at a time.');
    process.exit(1);
  }
  
  // Determine which distance measure to use (default: levenshtein)
  const distanceMeasure = selectedDistanceFlags.length > 0 ? selectedDistanceFlags[0] : 'levenshtein';
  
  // Filter out all flags from branch arguments
  const branchArgs = args.filter(arg => 
    arg !== '--verbose' && 
    arg !== '-V' && 
    arg !== '--list' && 
    arg !== '-L' &&
    !distanceFlags.includes(arg)
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

  // Select distance function based on flag
  const getDistance = (contentA, contentB) => {
    switch (distanceMeasure) {
      case '--hamming':
        return hammingDistance(contentA, contentB);
      case '--additions':
        return calculateAdditions(contentA, contentB);
      case '--damerau-levenshtein':
        return damerauLevenshtein(contentA, contentB);
      case '--jaro-winkler':
        return jaroWinkler(contentA, contentB);
      case '--lcs':
        return longestCommonSubsequence(contentA, contentB);
      case '--lines':
        return lineCountDifference(contentA, contentB);
      case '--words':
        return wordCountDifference(contentA, contentB);
      case 'levenshtein':
      default:
        return distance(contentA, contentB);
    }
  };

  let total = 0;
  const maxFileLen = list ? Math.max(...files.map((f) => f.length)) : 0;

  for (const file of files) {
    const contentA = getFileFromBranch(branch1, file, verbose);
    const contentB = getFileFromBranch(branch2, file, verbose);
    const dist = getDistance(contentA, contentB);
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

export { 
  run, 
  getFileFromBranch, 
  getCurrentBranch, 
  getChangedFiles, 
  fileExistsInBranch,
  hammingDistance,
  calculateAdditions,
  damerauLevenshtein,
  jaroWinkler,
  longestCommonSubsequence,
  lineCountDifference,
  wordCountDifference
};

