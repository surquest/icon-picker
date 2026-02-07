# Icon Picker

**A static website for browsing, searching, and customizing SVG icons directly from the `icons` folder, using the `.metadata.json` file to source icon metadata.**

> **Deployed Example:** [https://surquest.github.io/icon-picker/](https://surquest.github.io/icon-picker/)

A modern, static web application for browsing, searching, and customizing a library of SVG icons.

## Features

- **Browsing:** View a grid of available icons loaded dynamically from a local library.
- **Search:** Filter icons instantly by name or tags.
- **Customization:**
  - **Color:** Choose from a palette of predefined colors.
  - **Size:** Adjust the icon size using an interactive slider.
- **Export:** Download your customized icon as an **SVG** or **PNG** file as well as **CSS** stylesheet.
- **Modern UI:** Built with Google's Material Web Components and Tailwind CSS.

## Getting Started

Because this project uses ES modules and `fetch` requests to load icon data, it **must be run on a local web server**. Opening the `index.html` file directly in your browser will not work due to CORS restrictions.

### Prerequisites

You need a way to serve static files. Some options include:

- **VS Code:** The [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension.
- **Python:** `python -m http.server`
- **Node.js:** `npx serve`

### Installation & Running

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd icon-picker
    ```

2.  **Start the server:**
    
    *   **Using Python:**
        ```bash
        cd src
        python -m http.server 8000
        # Open http://localhost:8000 in your browser
        ```
    
    *   **Using VS Code Live Server:**
        - Open the project in VS Code.
        - Right-click `src/index.html` and select "Open with Live Server".

## Project Structure

```
src/
├── icons/              # SVG files and .metadata.json
├── js/
│   ├── app.js          # Main application logic
│   ├── IconService.js  # Handles fetching icon data
│   ├── UIManager.js    # Manages DOM updates and event handling
│   └── ...
├── styles/             # Stylesheets
├── index.html          # Entry point
└── styles.css          # App-specific styles
```

## Adding New Icons

To add new icons to the library:

1.  Place the SVG file in the `src/icons/` directory.
2.  Update `src/icons/.metadata.json` to include the new icon's details (name, path, tags).

## Technologies

- **JavaScript (ES6+)** - Native modules, no bundler required.
- **[Material Web](https://github.com/material-components/material-web)** - Google's Material Design web components.
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework (via CDN).
