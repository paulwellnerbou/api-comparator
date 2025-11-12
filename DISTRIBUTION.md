# API Comparator - Distribution Guide

## Download Options

This release provides two ways to run API Comparator:

### 1. Standalone Binary (macOS Apple Silicon only)

**File:** `api-comparator`

This is a self-contained executable for **macOS with Apple Silicon (M1/M2/M3)**.

**Usage:**
```bash
chmod +x api-comparator
./api-comparator compare --input-file example.json --reference-base-url https://api-ref.example.com --target-base-url https://api-target.example.com
```

**Note:** This binary is platform-specific and will only work on macOS with Apple Silicon processors.

### 2. JavaScript Bundle (Cross-platform)

**Files needed:**
- `index.js` - Main executable
- `templates/` - Template files directory
- `package.json` - Version information

This works on **any platform** (macOS, Linux, Windows) with Bun or Node.js installed.

**Requirements:**
- [Bun](https://bun.sh/) (recommended) or [Node.js](https://nodejs.org/) v18+

**Usage with Bun:**
```bash
bun run index.js compare --input-file example.json --reference-base-url https://api-ref.example.com --target-base-url https://api-target.example.com
```

**Usage with Node.js:**
```bash
node index.js compare --input-file example.json --reference-base-url https://api-ref.example.com --target-base-url https://api-target.example.com
```

**Important:** Make sure the `templates/` directory and `package.json` are in the same directory as `index.js`.

## Full Documentation

For complete documentation, examples, and advanced usage, see the [GitHub repository](https://github.com/paulwellnerbou/api-comparator).
