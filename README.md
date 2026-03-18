# Bag Inspector

An online tool for parsing and visualizing ROSbag files. Drag and drop a `.bag` or `.mfbag` file to extract metadata, topic information, message definitions, and message time series. The tool provides interactive visualizations and allows downloading the parsed data for further analysis.

## Features

- **Drag-and-drop interface**: Simply drop your ROSbag file onto the designated area.
- **Metadata extraction**: View file name, size, start/end times, duration, and actual timestamps.
- **Topic information**: List all topics in the bag with their message types, MD5 sums, and message counts.
- **Message definitions**: Download the message definition schema in JSON format.
- **Message time series**: Visualize message frequency over time using an interactive timeline (powered by ECharts).
- **Data export**: Download parsed data as JSON (metadata and topic info) and binary BSON (time series).
- **Topic filtering**: Select specific topics to display in the table or timeline.
- **Progress tracking**: See parsing progress in real-time.

## How to Use

1. Install dependencies:
   ```bash
   yarn install
   ```
2. Start the development server:
   ```bash
   yarn start
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000).
3. Drag and drop a `.bag` or `.mfbag` file onto the dropzone, or click to select a file.
4. Wait for the parsing to complete (progress bar indicates status).
5. Once parsing is done:
   - View the metadata in the Bag Info section.
   - Explore topics in the Topic Table (or switch to Timeline view).
   - Download the message definition, data (metadata and topic info), and time series files.
6. Use the toggle switch to switch between Topic Table and Timeline views.
7. Filter topics by selecting/unselecting in the dropdown.

## Build for Production

To create a production build:
```bash
yarn build
```
The build output will be in the `build` folder, ready for deployment.

## Project Structure

- `src/App.tsx`: Main application component handling file drop and parsing logic.
- `src/components/`: Reusable components for metadata tables, topic tables, and timeline visualization.
- `src/utils/`: Utility functions for timestamp conversion and other helpers.
- `conf/nginx/`: Nginx configuration for production serving.
- `Dockerfile`: Multi-stage Docker build for containerization.

## Dependencies

Key dependencies include:
- `react` and `react-dom` for the UI.
- `rosbag` for parsing ROSbag files.
- `react-dropzone` for drag-and-drop functionality.
- `react-select` for topic filtering.
- `echarts` and `echarts-for-react` for timeline visualization.
- `lz4js` for decompression of LZ4-compressed bag chunks.
- `cbor-x` for CBOR encoding/decoding of time series data.
- `bson` and `buffer` for binary data handling.
- `lodash` for utility functions.

## Development

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app) and uses TypeScript.

### Available Scripts

In the project directory, you can run:

- `yarn start`: Runs the app in development mode.
- `yarn test`: Launches the test runner.
- `yarn build`: Builds the app for production.
- `yarn eject`: Removes the single build dependency (note: this is a one-way operation).

### TypeScript

The project uses TypeScript with a `tsconfig.json` file. TypeScript checking is enabled during development.

### Code Style

Code is formatted with Prettier. Linting is performed via ESLint (based on the `react-app` preset).

## Deployment

The Dockerfile provides a multi-stage build:
1. Build stage: Uses Node.js 24 to install dependencies and build the React app.
2. Production stage: Uses Nginx to serve the static build output.

To build and run the Docker container:
```bash
docker build -t bag-inspector .
docker run -p 80:80 bag-inspector
```

## License

This project is proprietary and confidential.
