# WordPress JS Packages

#### Version 0.0.7

This repository contains JavaScript add-ons for the WordPress Block Editor. The project is currently private and under continual development.


## Installation

To use this package in your WordPress projects, install it with npm directly from the Git repository using SSH.

Some blocks contain additional Sass styles which should be loaded into front-end stylesheet.

### Prerequisites

- SSH access to GitHub configured (your SSH key must be added to your GitHub account)
- You or the consuming project must have access to this private repository

### Installation Steps

1. In your project's `package.json`, add the dependency:

   ```json
   {
     "dependencies": {
       "@ideasonpurpose/wp-js-packages": "git+ssh://git@github.com:ideasonpurpose/wp-js-packages.git"
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
import { registerLinkedGroupBlock } from '@ideasonpurpose/wp-js-packages';

// Use the function
registerLinkedGroupBlock();
```

For frontend styles: 

```Sass
@use "@ideasonpurpose/wp-js-packages/editor/block/group/linked-group-front-end.scss"

Until PHP namespaces can be resolved, the PHP component should be copied into the project and loaded from there. 