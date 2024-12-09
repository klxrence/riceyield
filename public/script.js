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
          .then((data) => {
            // Parse value, handle "No data available"
            return parseFloat(data.value) || null;
          })
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
            labels, // Correctly formatted month-year labels
            datasets: [
              {
                label: `Rice Yield for ${region}`,
                data: values,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                pointBackgroundColor: labels.map((_, i) =>
                  i === 5 ? '#FF0000' : '#4CAF50' // Highlight current month
                ),
                pointRadius: labels.map((_, i) => (i === 5 ? 8 : 5)), // Highlighted point is larger
              },
            ],
          },
          options: {
            responsive: true,
            scales: {
              x: {
                title: { display: true, text: 'Month-Year' },
                ticks: {
                  callback: (value, index) => labels[index], // Ensure proper labeling
                },
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
                  label: (context) =>
                    `${context.dataset.label}: ${context.raw || 'No data'} tons`,
                },
              },
            },
          },
        });
      })
      .catch((error) => console.error('Error plotting chart:', error));
  }
  