# WordPress JS Packages

#### Version 0.1.1

This repository contains JavaScript add-ons for the WordPress Block Editor. The project is currently private and under continual development.

## Installation

To use this package in your WordPress projects, install it with npm directly from the Git repository using SSH.

Some blocks contain additional Sass styles which should be loaded into front-end stylesheet.

## What's in here

### Linked Group Block

A variation on the Group block which adds standard Link controls. The link implementation uses ideas from [Accessible cards](https://kittygiraudel.com/2022/04/02/accessible-cards/) and [Inclusive Components: Cards](https://inclusive-components.design/cards/).

### Related Posts Query

A variation on the Query Loop block which replaces the query with content from IOP's [WordPress Related Posts](https://github.com/ideasonpurpose/wp-related-posts) library.

### Utilities

A few utility classes are exported. `usePublicPostTypes` and `usePublicTaxonomies` are direct lifts from the [WordPress Gutenberg source code](https://github.com/WordPress/gutenberg/blob/e90c88fee31120e0091e044c149f8b4f5f947f4a/packages/edit-site/src/components/add-new-template/utils.js#L91-L125). These functions are useful for pre-populating a WordPress data-store with all PostType and Taxonomy data for use in interfaces or block rendering.

## Installation

### Prerequisites

- SSH access to GitHub configured (your SSH key must be added to your GitHub account)
- You or the consuming project must have access to this private repository

1. Or, install directly with this line:

   ```sh
   npm install git+ssh://git@github.com:ideasonpurpose/wp-js-packages.git
   ```

2. Or, add the dependency to your project's `package.json`:

   ```json
   {
     "dependencies": {
       "@ideasonpurpose/wp-js-packages": "git+ssh://git@github.com:ideasonpurpose/wp-js-packages.git"
     }
   }
   ```

   Then install the dependency:

   ```bash
   npm install
   ```

### Usage in Code

Import one of the included packages into **editor.js** or whatever script loads in your editor:

```javascript
// @link https://github.com/ideasonpurpose/wp-js-packages
import { initLinkedGroupBlock } from "@ideasonpurpose/wp-js-packages";

// Instantiate the function
initLinkedGroupBlock();
```

Also add the matching Sass frontend styles:

```scss
// Import linked-group-front-end styles
// @link https://github.com/ideasonpurpose/wp-js-packages
@use "@ideasonpurpose/wp-js-packages/editor/block/group/linked-group-front-end";
```

Until PHP namespaces can be resolved, the PHP component should be copied into the project and loaded from there. Make sure to create a matching `Blocks/Variation/namespace

```sh
cp block/group/LinkedGroup.php wp-content/themes/my-theme/lib
```

Then initiate it from your code (likely funtions.php)
