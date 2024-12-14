document.addEventListener('DOMContentLoaded', () => {
    const regionsDropdown = document.getElementById('region');
  
    fetch('https://riceyield.onrender.com/regions')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        regionsDropdown.innerHTML = ''; // Clear the "Loading regions..." message
        data.forEach(region => {
          const option = document.createElement('option');
          option.value = region;
          option.textContent = region;
          regionsDropdown.appendChild(option);
        });
      })
      .catch(error => {
        console.error('Error fetching regions:', error);
        regionsDropdown.innerHTML = '<option value="">Error loading regions</option>';
      });
  });
  
  // Fetch rice yield and chart data
  function getRiceYield() {
    const region = document.getElementById('region').value;
    const year = parseInt(document.getElementById('year').value);
    const month = parseInt(document.getElementById('month').value);
  
    if (!region || !year || !month) {
      document.getElementById('result').textContent = 'Please provide all inputs';
      return;
    }
  
    fetch('https://riceyield.onrender.com/get-rice-yield', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ region, year, month })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        document.getElementById('result').textContent = `Rice Yield: ${data.value}`;
        fetchRiceYieldChartData(region, year, month);
      })
      .catch(error => {
        console.error('Error fetching rice yield:', error);
        document.getElementById('result').textContent = 'Error fetching data';
      });
  }
  
  // Fetch chart data for 5 months before and 6 months after the selected month
  function fetchRiceYieldChartData(region, year, month) {
    const monthsToFetch = 12; // 5 months before and 6 months after
    const startDate = new Date(year, month - 1);
    startDate.setMonth(startDate.getMonth() - 5);
  
    const promises = [];
    const labels = [];
  
    // Fetch data for the 12 months
    for (let i = 0; i < monthsToFetch; i++) {
      const targetDate = new Date(startDate);
      targetDate.setMonth(targetDate.getMonth() + i);
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth() + 1;
      labels.push(targetDate.toLocaleString('default', { month: 'short' }) + '-' + targetYear);
  
      promises.push(
        fetch('https://riceyield.onrender.com/get-rice-yield', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ region, year: targetYear, month: targetMonth })
        })
        .then(response => response.json())
        .then(data => {
          return data.value ? parseFloat(data.value) : null; // Return null for missing data
        })
        .catch(error => {
          console.error('Error fetching chart data:', error);
          return null; // Return null if error fetching data
        })
      );
    }
  
    // Process the results to handle missing data and render the chart
    Promise.all(promises)
      .then(results => {
        const data = results.map(result => result === null ? null : result);
        updateChart(region, labels, data, year, month);
      })
      .catch(error => console.error('Error processing chart data:', error));
  }
  
  function updateChart(region, labels, data, selectedYear, selectedMonth) {
    const ctx = document.getElementById('chart').getContext('2d');
    const highlightedIndex = labels.findIndex(label => {
      const [month, year] = label.split('-');
      const date = new Date(`${month}-01-${year}`);
      return date.getFullYear() === selectedYear && date.getMonth() === selectedMonth - 1;
    });
  
    if (window.chartInstance) {
      window.chartInstance.destroy();
    }
  
    window.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: `Rice Yield for ${region}`,
          data,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          pointRadius: 5,
          pointBackgroundColor: data.map((_, index) =>
            index === highlightedIndex ? 'rgba(255, 99, 132, 1)' : 'rgba(75, 192, 192, 1)'
          ),
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Rice Yield (tons)' }
          },
          x: {
            title: { display: true, text: 'Month-Year' }
          }
        }
      }
    });
  }
  
