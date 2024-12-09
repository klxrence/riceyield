document.addEventListener('DOMContentLoaded', () => {
    const regionSelect = document.getElementById('region');
    const yearInput = document.getElementById('year');
    const monthSelect = document.getElementById('month');
    const resultDiv = document.getElementById('result');
    const chartCanvas = document.getElementById('chart');
    let chart;
  
    // Fetch regions on load
    fetch('http://riceyield.onrender.com/regions') // Update URL for deployed backend
      .then((response) => response.json())
      .then((regions) => {
        regions.forEach((region) => {
          const option = document.createElement('option');
          option.value = region;
          option.textContent = region;
          regionSelect.appendChild(option);
        });
      })
      .catch((error) => console.error('Error fetching regions:', error));
  
    // Function to format date to MMM-YYYY
    function formatDate(month, year) {
      const date = new Date(year, month - 1);
      return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    }
  
    // Fetch and display rice yield
    async function getRiceYield() {
      const region = regionSelect.value;
      const year = parseInt(yearInput.value, 10);
      const month = parseInt(monthSelect.value, 10);
  
      if (!region || !year || !month) {
        alert('Please fill all fields.');
        return;
      }
  
      try {
        const response = await fetch('http://riceyield.onrender.com/get-rice-yield', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ region, year, month }),
        });
        const data = await response.json();
  
        if (response.ok) {
          resultDiv.textContent = `Rice Yield for ${region} in ${formatDate(month, year)}: ${data.value} tons`;
          plotChart(region, year, month);
        } else {
          resultDiv.textContent = data || 'Error fetching rice yield';
        }
      } catch (error) {
        console.error('Error:', error);
        resultDiv.textContent = 'Error fetching rice yield';
      }
    }
  
    // Plot chart for rice yield
    async function plotChart(region, year, month) {
      const startDate = new Date(year, month - 1);
      const labels = [];
      const values = [];
      const promises = [];
  
      // Gather 5 months prior and 6 months ahead
      for (let i = -5; i <= 6; i++) {
        const targetDate = new Date(startDate);
        targetDate.setMonth(startDate.getMonth() + i);
  
        const targetYear = targetDate.getFullYear();
        const targetMonth = targetDate.getMonth() + 1;
        labels.push(formatDate(targetMonth, targetYear));
  
        promises.push(
          fetch('http://riceyield.onrender.com/get-rice-yield', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ region, year: targetYear, month: targetMonth }),
          })
            .then((res) => res.json())
            .then((data) => parseFloat(data.value) || null) // Handle "No data available"
        );
      }
  
      // Fetch data and update chart
      Promise.all(promises)
        .then((results) => {
          values.push(...results);
  
          if (chart) chart.destroy();
  
          chart = new Chart(chartCanvas, {
            type: 'line',
            data: {
              labels,
              datasets: [
                {
                  label: `Rice Yield in ${region}`,
                  data: values,
                  borderColor: '#4CAF50',
                  backgroundColor: 'rgba(76, 175, 80, 0.2)',
                  pointBackgroundColor: labels.map((_, i) =>
                    i === 5 ? '#FF0000' : '#4CAF50' // Highlight current month
                  ),
                },
              ],
            },
            options: {
              responsive: true,
              scales: {
                x: {
                  title: { display: true, text: 'Month-Year' },
                },
                y: {
                  title: { display: true, text: 'Rice Yield (tons)' },
                  beginAtZero: true,
                },
              },
              plugins: {
                legend: { display: true },
                tooltip: {
                  callbacks: {
                    label: (context) => `${context.raw} tons`,
                  },
                },
              },
            },
          });
        })
        .catch((error) => console.error('Error plotting chart:', error));
    }
  
    window.getRiceYield = getRiceYield;
  });
  