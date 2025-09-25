# FiveDown

**FiveDown** is a web-based interactive spreadsheet, designed as a tool for engineering.

## Features

- **Spreadsheet Interface:**  
  Create and manage multiple sheets with editable rows and columns for descriptions, variable names, formulas, results, and units.
- **Formula Evaluation:**  
  Enter formulas referencing other rows (e.g., `height*pi*radius^2` for cylinder volume), and see results update automatically.
- **Drag-and-Drop:**  
  Reorder rows and columns easily using drag handles for intuitive data management.
- **Plotting and Visualization:**  
  Select data and plot it as bar charts, line charts, or scatter plots using Chart.js integration.
- **Multiple Sheets:**  
  Create and delete multiple sheets.
- **Local Storage:**  
  All data is automatically saved to your browser's `localStorage`, and `localStorage` only, so your sheets and work are preserved between sessions on the same device.

## Directory Structure

- `index.html` – Main application page implementing the UI and demo data.
- `js/` – JavaScript modules for:
  - `pubsub.js` (event system)
  - `row_collection.js` (row management)
  - `drag_drop.js` (drag-and-drop support)
  - `sheet_interface.js` (spreadsheet logic)
  - `project_menu.js` (sheet/project management)
  - `evaluator.js` (formula evaluation)
  - `plot.js` (visualization logic)
  - `UnitMath` (unit math)
- `src/` – CSS styles and UI normalization.
- `prompts/` – Likely contains prompt templates or configuration (specifics can be added).
- `tests/` – Test scripts or files for the application.

## Technologies Used

- **HTML5/CSS3** for structure and styling.
- **JavaScript ES6 Modules** for the application logic.
- **Chart.js** for data visualization.
- **Drag-and-drop API** for interactive row management.
- **localStorage API** for persistent, client-side storage.
- **UnitMath** for inferring units and doing automatic unit conversions

## Usage

Open `FiveDown/index.html` in your browser to launch the app.  
- Add or edit data directly in the table.
- Use formulas in the "Formula" column to compute derived results.
- Click the "Plot" button to visualize selected data.
- Manage sheets from the top menu.
- All your work is automatically saved in your browser and will be available when you return.

## Contributing

Contributions and suggestions are welcome. Please open an issue or submit a pull request.

## License

_No license specified. Contact the repository owner for usage details._
