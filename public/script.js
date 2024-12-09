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
        fetchRiceYieldChartData(region, year, month);
      })
      .catch(error => {
        document.getElementById('result').textContent = 'Error fetching data';
      });
  }
  
  // Fetch chart data for the selected region and year
  function fetchRiceYieldChartData(region, year, month) {
    const years = [];
    const months = [];
    const yields = [];
    
    // Fetch data for 3 years before and after the selected year
    for (let i = -3; i <= 3; i++) {
      const targetYear = parseInt(year) + i;
      for (let j = 1; j <= 12; j++) {  // Loop through all months
        const targetMonth = j;
        fetch('https://riceyield.onrender.com/get-rice-yield', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ region, year: targetYear, month: targetMonth.toString() })
        })
        .then(response => response.json())
        .then(data => {
          years.push(targetYear);
          months.push(new Date(targetYear, targetMonth - 1).toLocaleString('default', { month: 'short' }));
          yields.push(data.value ? parseFloat(data.value).toFixed(2) : 'No data');
          
          // If all the years' data is fetched, update the chart
          if (years.length === 7 * 12) {  // 7 years * 12 months
            updateChart(region, years, months, yields);
          }
        })
        .catch(error => console.error('Error fetching chart data:', error));
      }
    }
  }
  
  // Update the chart
  function updateChart(region, years, months, yields) {
    // Sort the years and months to ensure they're in order
    const sortedData = months.map((month, index) => ({
      year: years[index],
      month,
      yield: yields[index]
    }));
  
    // Sort by year and month
    sortedData.sort((a, b) => {
      const dateA = new Date(a.year, months.indexOf(a.month));
      const dateB = new Date(b.year, months.indexOf(b.month));
      return dateA - dateB;
    });
  
    // Extract the sorted months, years, and yields
    const sortedMonths = sortedData.map(item => item.month);
    const sortedYears = sortedData.map(item => item.year);
    const sortedYields = sortedData.map(item => item.yield);
  
    const ctx = document.getElementById('chart').getContext('2d');
    const chartData = {
      labels: sortedMonths, // Monthly labels (Jan, Feb, etc.)
      datasets: [{
        label: `Rice Yield for ${region}`, // Dynamic label with the region
        data: sortedYields,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        pointRadius: 5,  // Increase the size of the dots
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',  // Color of the dots
        pointBorderColor: 'rgba(75, 192, 192, 1)',  // Border color of the dots
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
              text: 'Month/Year'
            },
            ticks: {
              callback: function(value, index, values) {
                const year = sortedYears[index];
                return `${sortedMonths[index]} ${year}`;
              }
            }
          }
        }
      }
    });
  }
  