# WordPress JS Packages

#### Version 0.0.5

This repository contains JavaScript add-ons for the WordPress Block Editor.

This is currently private and under continual development, so it is distributed via GitHub Packages (not npm) using the @iop-dev namespace.

Packages are distributed via GitHub Packages, ensuring secure and private distribution within your organization.

## Installation

To use this package in your WordPress projects, install it directly from the Git repository using SSH.

### Prerequisites

- SSH access to GitHub configured (your SSH key must be added to your GitHub account)
- You or the consuming project must have access to this private repository

### Installation Steps

1. In your project's `package.json`, add the dependency:

   ```json
   {
     "dependencies": {
       "@iop-dev/wp-js-packages": "git+ssh://git@github.com:ideasonpurpose/wp-js-packages.git"
     }
   }
   ```

2. Install the dependency:

   ```bash
   npm install
   ```

### Usage in Code

Import and use the package as per its documentation:

```javascript
import { registerLinkedGroupBlock } from '@iop-dev/wp-js-packages';

// Use the function
registerLinkedGroupBlock();
```
