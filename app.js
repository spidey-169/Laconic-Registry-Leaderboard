async function fetchData() {
    updateStatus("Fetching data");
    const loadingAnimation = animateDots(); // Start the dots animation

    const response = await fetch('https://laconicd.laconic.com/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: `
                {
                    queryRecords {
                        names
                    }
                }
            `
        })
    });

    const result = await response.json();
    clearInterval(loadingAnimation); // Stop the dots animation
    updateStatus("Data fetched"); // Update status to "Data fetched"

    // Timeout to hide the status after 2 seconds
    setTimeout(() => {
        updateStatus(""); // Clear the status text so it disappears
    }, 2000); // 2000ms = 2 seconds

    return result.data.queryRecords;
}

function processNames(data) {
    const authorities = {};

    data.forEach(record => {
        if (record.names) {
            let applicationProcessed = false;

            record.names.forEach(name => {
                const parts = name.split('/');
                if (parts.length > 2) {
                    const authority = parts[2];
                    const category = parts[3];

                    if (!authorities[authority]) {
                        authorities[authority] = { applications: 0, dns: 0, deployments: 0 };
                    }

                    if (category === 'applications' && !applicationProcessed) {
                        authorities[authority].applications += 1;
                        applicationProcessed = true; // Mark that an application has been processed
                    } else if (category === 'dns') {
                        authorities[authority].dns += 1;
                    } else if (category === 'deployments') {
                        authorities[authority].deployments += 1;
                    }
                }
            });
        }
    });

    return authorities;
}

function renderTable(authorities) {
    const tbody = document.querySelector('#leaderboard tbody');
    tbody.innerHTML = '';

    for (const [authority, scores] of Object.entries(authorities)) {
        const totalPoints = scores.applications + scores.dns + scores.deployments;
        const row = `
            <tr>
                <td>${authority}</td>
                <td>${scores.applications}</td>
                <td>${scores.dns}</td>
                <td>${scores.deployments}</td>
                <td>${totalPoints}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    }
}

let sortDirections = [true, true, true, true, true]; // true = ascending, false = descending

function sortTable(columnIndex) {
    const table = document.getElementById('leaderboard');
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    const isNumeric = columnIndex > 0;
    
    rows.sort((rowA, rowB) => {
        const cellA = rowA.cells[columnIndex].textContent.trim();
        const cellB = rowB.cells[columnIndex].textContent.trim();
        
        let comparison;
        if (isNumeric) {
            comparison = parseInt(cellA) - parseInt(cellB);
        } else {
            comparison = cellA.localeCompare(cellB);
        }
        
        return sortDirections[columnIndex] ? comparison : -comparison;
    });

    // Reverse the sorting direction for the next click
    sortDirections[columnIndex] = !sortDirections[columnIndex];

    const tbody = table.querySelector('tbody');
    rows.forEach(row => tbody.appendChild(row));
}

function updateStatus(message) {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = message;
    }
}

function animateDots() {
    const statusElement = document.getElementById('status');
    let dots = 0;

    return setInterval(() => {
        dots = (dots + 1) % 4; // Counts from 0 to 3 (corresponds to the dots)
        statusElement.textContent = 'Fetching data' + '.'.repeat(dots);
    }, 500); // 500ms interval for the animation
}

async function init() {
    const data = await fetchData();
    const authorities = processNames(data);
    renderTable(authorities);
}

init();
