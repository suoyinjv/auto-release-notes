# 📝 Auto Release Notes

**Generate beautiful release notes automatically from conventional commits — zero external dependencies, works anywhere.**

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Auto%20Release%20Notes-green?logo=github)](https://github.com/marketplace/actions/auto-release-notes)

## ✨ Features

- 🔍 Automatically detects commits since the last release tag
- 📊 Categorizes by conventional commit type (`feat`, `fix`, `docs`, etc.)
- 🚀 Creates a GitHub Release with auto-generated notes
- 🏷️ Auto-increments version (minor for features, patch for fixes)
- 🔗 Links commit SHAs directly to the source
- 🎨 Beautiful emoji-categorized markdown output
- 🪶 Zero external runtime dependencies

## 🚀 Quick Start

Add this to your GitHub Actions workflow (e.g., `.github/workflows/release.yml`):

```yaml
name: Release

on:
  push:
    branches: [main, master]

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Auto Release Notes
        uses: suoyinjv/auto-release-notes@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

That's it. Every push to `main` will generate release notes and create a release.

## ⚙️ Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `token` | ✅ | `${{ github.token }}` | GitHub token with contents:write scope |
| `tag-prefix` | ❌ | `v` | Prefix for version tags (e.g. `v`) |
| `draft` | ❌ | `false` | Create release as draft |
| `prerelease` | ❌ | `false` | Mark release as prerelease |

## 📤 Outputs

| Output | Description |
|--------|-------------|
| `release-notes` | Generated markdown release notes |
| `release-version` | Auto-detected version number |
| `release-url` | URL of the created release |

## 🔧 Custom Workflow Example

```yaml
name: Custom Release

on:
  workflow_dispatch:
    inputs:
      prerelease:
        description: 'Pre-release?'
        required: true
        default: 'false'

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Generate Release Notes
        id: notes
        uses: suoyinjv/auto-release-notes@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          prerelease: ${{ github.event.inputs.prerelease }}

      - name: Show Generated Notes
        run: |
          echo "Version: ${{ steps.notes.outputs.release-version }}"
          echo "Release URL: ${{ steps.notes.outputs.release-url }}"
```

## 📋 Example Output

```
## 🚀 Features

- Add user authentication module ([abc1234](https://...))
- Implement dark mode ([def5678](https://...))

## 🐛 Bug Fixes

- Fix login timeout issue ([ghi9012](https://...))
- Resolve memory leak in cache ([jkl3456](https://...))

## 📖 Documentation

- Update API docs ([mno7890](https://...))
```

## 🤝 Contributing

PRs welcome! This action is built with Node.js and the GitHub Actions toolkit.

## 📄 License

MIT
