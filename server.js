const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const app = express();
const PORT = 8000;  // Ensure this matches your deployed environment

// Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: 'https://riceyield.vercel.app', // Update to your frontend URL
}));
app.use(express.static('public'));

// Load the dataset into memory
const dataset = [];
const filePath = path.join(__dirname, 'rice_yield_data.csv');

fs.createReadStream(filePath)
  .pipe(csv())
  .on('data', (row) => dataset.push(row))
  .on('end', () => {
    console.log('Dataset loaded successfully');
  });

// Endpoint to fetch regions
app.get('/regions', (req, res) => {
    if (dataset.length > 0) {
        const regions = Object.keys(dataset[0]).filter((key) => key !== 'Date');
        console.log('Extracted Regions:', regions);
        res.json(regions);
    } else {
        console.error('Dataset not loaded yet');
        res.status(500).send('Dataset not loaded yet');
    }
});

// Endpoint to get rice yield
app.post('/get-rice-yield', (req, res) => {
    const { region, year, month } = req.body;

    if (!region || !year || !month) {
      return res.status(400).send('Missing required parameters');
    }

    const formattedDate = `${month}/1/${year}`;
    const record = dataset.find((row) => row.Date === formattedDate);

    if (record) {
      const value = record[region];
      res.json({ value: value ? parseFloat(value).toFixed(2) : 'No data available' });
    } else {
      res.status(404).send('Date not found in dataset');
    }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
