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
    const year = parseInt(document.getElementById('year').value);
    const month = parseInt(document.getElementById('month').value);
  
    fetch('https://riceyield.onrender.com/get-rice-yield', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ region, year, month })
    })
      .then(response => response.json())
      .then(data => {
        document.getElementById('result').textContent = `Rice Yield: ${data.value}`;
        // Fetch the chart data for 5 months before and 6 months after the selected month
        fetchRiceYieldChartData(region, year, month);
      })
      .catch(error => {
        document.getElementById('result').textContent = 'Error fetching data';
      });
  }
  
  // Fetch chart data for the selected region, year, and month
  function fetchRiceYieldChartData(region, year, month) {
    const monthsToFetch = 12; // Total months (5 months back + requested + 6 months forward)
    const startDate = new Date(year, month - 1); // Requested month/year
    startDate.setMonth(startDate.getMonth() - 5); // Start 5 months before the requested month
  
    const promises = [];
    const labels = [];
    for (let i = 0; i < monthsToFetch; i++) {
      const targetDate = new Date(startDate);
      targetDate.setMonth(targetDate.getMonth() + i);
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth() + 1; // JavaScript months are 0-based
      labels.push(targetDate.toLocaleString('default', { month: 'short' }) + '-' + targetYear);
      promises.push(
        fetch('https://riceyield.onrender.com/get-rice-yield', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ region, year: targetYear, month: targetMonth })
        }).then(response => response.json())
      );
    }
  
    Promise.all(promises)
      .then(results => {
        const data = results.map(result => (result.value ? parseFloat(result.value) : null));
        updateChart(region, labels, data, year, month);
      })
      .catch(error => console.error('Error fetching chart data:', error));
  }
  
  // Update the chart
  function updateChart(region, labels, data, selectedYear, selectedMonth) {
    const ctx = document.getElementById('chart').getContext('2d');
    const highlightedIndex = labels.findIndex(label => {
      const [month, year] = label.split('-');
      const date = new Date(`${month}-01-${year}`);
      return date.getFullYear() === selectedYear && date.getMonth() === selectedMonth - 1;
    });
  
    const chartData = {
      labels,
      datasets: [{
        label: `Rice Yield for ${region}`,
        data,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        pointRadius: 5,
        pointBackgroundColor: data.map((_, index) =>
          index === highlightedIndex ? 'rgba(255, 99, 132, 1)' : 'rgba(75, 192, 192, 1)'
        ),
        pointBorderColor: 'rgba(75, 192, 192, 1)',
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
          },
          x: {
            title: {
              display: true,
              text: 'Month-Year'
            }
          }
        }
      }
    });
  }
  