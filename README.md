# WordPress JS Packages

This repository contains JavaScript add-ons for the WordPress Block Editor.

This is currently private and under continual development, so it is distributed via GitHub Packages (not npm) using the @iop-dev namespace.

Packages are distributed via GitHub Packages, ensuring secure and private distribution within your organization.

## Installation

To use these packages in WordPress projects, follow these steps:

### 1. Set Up Authentication

Ensure you have a GitHub Personal Access Token (PAT) with `read:packages` permissions.

Create or update the `.npmrc` file in your consuming project's root directory:

```
@your-github-org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

Replace:

- `your-github-org` with your GitHub organization or username
- `YOUR_GITHUB_TOKEN` with your GitHub Personal Access Token

### 2. Environment Variable (Recommended)

For security, use an environment variable instead of hardcoding the token:

```
@your-github-org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Set the `GITHUB_TOKEN` environment variable in your build/CI system or locally:

```bash
export GITHUB_TOKEN=your_personal_access_token_here
```

### 3. Install Packages

Install the desired package:

```bash
npm install @iop-dev/wp-js-packages
```

### 4. Usage in Code

Import and use the package as per its documentation:

```javascript
import { registerLinkedGroupBlock } from '@iop-dev/wp-js-packages';

// Use the function
registerLinkedGroupBlock();
```

## GitHub Personal Access Token Setup

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/personal-access-tokens)
2. Generate a new token with the `read:packages` scope.
3. Copy the token and use it as described above.

**Important:** Keep your PAT secure and never commit it to version control. Use environment variables or secure CI/CD secrets.
