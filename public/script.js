document.addEventListener('DOMContentLoaded', () => {
    // Fetch regions when the page loads
    fetch('https://riceyield.onrender.com/regions')
      .then(response => response.json())
      .then(data => {
        const dropdown = document.getElementById('region');
        data.forEach(region => {
          const option = document.createElement('option');
          option.value = region;
          option.textContent = region;
          dropdown.appendChild(option);
        });
      })
      .catch(error => {
        console.error('Error fetching regions:', error);
      });
  });
  
  // Fetch rice yield and chart data
  function getRiceYield() {
    const region = document.getElementById('region').value;
    const year = document.getElementById('year').value;
    const month = document.getElementById('month').value;
  
    fetch('https://riceyield.onrender.com/get-rice-yield', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ region, year, month })
    })
      .then(response => response.json())
      .then(data => {
        document.getElementById('result').textContent = `Rice Yield: ${data.value}`;
        // Assuming you fetch the 3 years before and after data here
        fetchRiceYieldChartData(region, year);
      })
      .catch(error => {
        document.getElementById('result').textContent = 'Error fetching data';
      });
  }
  
  // Fetch chart data for the selected region and year
  function fetchRiceYieldChartData(region, year) {
    const years = [];
    const yields = [];
    
    // Fetch data for 3 years before and after the selected year
    for (let i = -3; i <= 3; i++) {
      const targetYear = parseInt(year) + i;
      fetch('https://riceyield.onrender.com/get-rice-yield', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region, year: targetYear, month: '1' }) // January as an example
      })
      .then(response => response.json())
      .then(data => {
        years.push(targetYear);
        yields.push(data.value ? parseFloat(data.value).toFixed(2) : 'No data');
        
        // If all the years' data is fetched, update the chart
        if (years.length === 7) {
          updateChart(region, years, yields);
        }
      })
      .catch(error => console.error('Error fetching chart data:', error));
    }
  }
  
  // Update the chart
  function updateChart(region, years, yields) {
    const ctx = document.getElementById('chart').getContext('2d');
    const chartData = {
      labels: years, // Yearly data labels
      datasets: [{
        label: `Rice Yield for ${region}`, // Dynamic label with the region
        data: yields,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true
      }]
    };
  
    // Clear any existing chart before drawing a new one
    if (window.chartInstance) {
      window.chartInstance.destroy();
    }
  
    // Create a new chart with the updated data
    window.chartInstance = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Rice Yield (tons)'
            }
          }
        }
      }
    });
  }
  