const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const app = express();
const PORT = 8080;

// Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: 'https://riceyield.vercel.app', // Replace with your Vercel URL
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
    console.log('Request Body:', req.body);
    const { region, year, month } = req.body;
  
    if (!region || !year || !month) {
      console.error('Invalid input:', req.body);
      return res.status(400).send('Invalid input');
    }
  
    const formattedDate = `${month}/1/${year}`;
    console.log('Formatted Date:', formattedDate);
  
    const record = dataset.find((row) => row.Date === formattedDate);
    console.log('Matching Record:', record);
  
    if (record) {
      const value = record[region];
      console.log('Rice Yield for', region, 'on', formattedDate, ':', value);
      res.json({ value: value ? parseFloat(value).toFixed(2) : 'No data available' });
    } else {
      console.error('Date not found in dataset');
      res.status(404).send('Date not found in dataset');
    }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Dataset:', dataset);
  
});