# Contributing to ripthrow

First off, thank you for considering contributing to `ripthrow`! It's people like you who make the open-source community such an amazing place to learn, inspire, and create.

## Principles

- **Zero Dependencies:** `ripthrow` must remain lightweight and have zero runtime dependencies.
- **Type Safety:** All changes must preserve or improve the robust type inference of the library.
- **Zero Overhead:** Performance is a feature. Changes should be benchmarked if they affect the hot path.

## Development Setup

This project uses [Bun](https://bun.sh) as its runtime, package manager, and test runner.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MechanicalLabs/ripthrow.git
   cd ripthrow
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

## Workflow

### 1. Code Quality

We use [Biome](https://biomejs.dev) for linting and formatting. Before submitting a PR, ensure your code complies:

```bash
bun run lint
```

To automatically fix formatting issues:

```bash
bun run format
```

### 2. Build

Before publishing, verify the build succeeds (JS bundle + type declarations):

```bash
bun run build
```

### 3. Testing

All features and bug fixes must include tests. We use Bun's built-in test runner:

```bash
bun test
```

### 4. Dependency Check

We use [Knip](https://knip.dev) to ensure no unused files or dependencies are added:

```bash
bun run knip
```

### 5. Documentation

If you add a new feature, please:
- Add JSDoc comments with examples.
- Update the manual in `docs/manual/` if necessary.
- API documentation is automatically generated from JSDoc using `bun run docs`.

### 6. Examples

The `examples/` directory contains usage patterns. If you introduce a significant change, please update or add a new example to ensure they remain functional.

## Pull Request Process

1. Create a new branch for your feature or bug fix.
2. Ensure all tests, linting, and knip checks pass.
3. Update documentation and examples as needed.
4. Open a Pull Request with a clear description of the changes.

Thank you for contributing!
