// Initialize button status
let sliderValues = [0, 0, 0, 0, 0, 0];
let rowSelected = [true, true, true, true, true, true]; // Initialize all rows as selected

// Function to handle row selection
function handleRowSelection(rowIndex) {
    rowSelected[rowIndex] = !rowSelected[rowIndex];

    // Update the initial row value when deselected
    if (!rowSelected[rowIndex]) {
        sliderValues[rowIndex] = 0;
    }

    const slider = document.getElementById(`slider${rowIndex + 1}`);
    const checkbox = document.getElementById(`row${rowIndex + 1}-select`);

    // Toggle the checkbox between checked and unchecked based on the selection status
    if (rowSelected[rowIndex]) {
        checkbox.checked = true;
    } else {
        checkbox.checked = false;
    }

    // Enable or disable the slider based on the selection status
    slider.disabled = !rowSelected[rowIndex];
    slider.classList.toggle("disabled", !rowSelected[rowIndex]);
    updateResult();
}


// Add event listeners for row selections and initialize them
for (let i = 0; i < 6; i++) {
    const checkbox = document.getElementById(`row${i + 1}-select`);
    checkbox.checked = true; // Initialize the checkbox as selected
    checkbox.addEventListener("change", () => {
        handleRowSelection(i);
    });
}

// Function to toggle the slider values
function toggleSliderValue(sliderId) {
    const index = parseInt(sliderId.replace("slider", "")) - 1;
    // For the last slider with 3 values (0, 1, 2)
    if (index === 5) {
        const slider = document.getElementById(sliderId);
        sliderValues[index] = (sliderValues[index] + 1) % 3;
        slider.value = sliderValues[index];
    } else {
        // For the first five sliders with 0 and 1 values
        sliderValues[index] = (sliderValues[index] === 0) ? 1 : 0;
        document.getElementById(sliderId).value = sliderValues[index];
    }
    updateResult();
}

// Add click event listeners to all buttons
for (let i = 1; i <= 6; i++) {
    const sliderId = `slider${i}`;
    const slider = document.getElementById(sliderId);
    slider.addEventListener("input", () => {
        toggleSliderValue(sliderId);
        updateResult(); // Update the result when a slider is changed
    });
}

// Function to update the result based on the selected geographical area and button states
function updateResult() {
    // Get the selected area from the dropdown
    const selectedArea = document.getElementById('area-select').value;

    //const selectedArea = areaSelect.value;
    const selectedAreaText = areaSelect.options[areaSelect.selectedIndex].text;

    // Generate file paths for 2019 and 2021 based on the selected area
    areaToCsvPath2019[selectedArea] = `Result/${selectedAreaText}_prediction.csv`;
    areaToCTPath2019[selectedArea] = `Result/${selectedAreaText}_CTresult.csv`;
    areaToCsvPath2021[selectedArea] = `Result/${selectedAreaText}_prediction_2021.csv`;
    areaToCTPath2021[selectedArea] = `Result/${selectedAreaText}_CTresult_2021.csv`;

    const selectedYear = document.getElementById('year-select').value;

    if (selectedYear === '2019') {
        areaToCsvPath = areaToCsvPath2019;
        areaToCTPath = areaToCTPath2019;
    } else if (selectedYear === '2021') {
        areaToCsvPath = areaToCsvPath2021;
        areaToCTPath = areaToCTPath2021;
    }

    // Define a mapping of area values to CSV file paths
    const csvFilePath = areaToCsvPath[selectedArea];

    fetch(csvFilePath)
        .then(response => response.text())
        .then(csvData => {
            const csvRows = csvData.split('\n');
            const headers = csvRows[0].split(',');
            const data = csvRows.slice(1);

            // Initialize variables to calculate weighted average and sum
            let weightedSum = 0;
            let sumOfWeights = 0;

            data.forEach(row => {
                const rowValues = row.split(',');
                // Check if the row is not empty (e.g., it has at least 8 columns, as per your usage)
                if (rowValues.length >= 8) {
                    const rowSliderValues = rowValues.slice(0, 6).map(val => parseInt(val)); // Extract slider values from the row
                    const resultFloat = parseFloat(rowValues[6]); // Extract the float result
                    const popresultFloat = parseFloat(rowValues[7]); // Extract the float result
            
                    // Check if the row matches the selected slider values
                    const matchesSelectedAttributes = rowSliderValues.every((value, index) => {
                        return rowSelected[index] ? value === sliderValues[index] : true;
                    });
            
                    if (matchesSelectedAttributes) {
                        // Update weighted sum and sum of weights
                        weightedSum += resultFloat * popresultFloat;
                        sumOfWeights += popresultFloat;
                    }
                }
            });            

            if (sumOfWeights > 0) {
                // Calculate the weighted average
                const weightedAverage = weightedSum / sumOfWeights;

                // Round and display the result
                const roundedResult = Math.round(weightedAverage);
                document.getElementById("value").textContent = roundedResult;

                // Calculate and display the sum of population results
                const roundedPopResult = Math.round(sumOfWeights);
                document.getElementById("pop_value").textContent = roundedPopResult;
            } else {
                // No matching rows
                document.getElementById("value").textContent = '-';
                document.getElementById("pop_value").textContent = '-';
            }
        })
        .catch(error => console.error('Error fetching CSV:', error));
}


function updateColumnOptions() {
    const selectedArea = areaSelect.value;
    const csvFilePath = areaToCTPath[selectedArea];

    // Fetch the CSV file and update the column dropdown
    fetch(csvFilePath)
        .then(response => response.text())
        .then(csvData => {
            const headers = csvData.split('\n')[0].split(',');

            // Clear existing options
            columnSelect.innerHTML = '';

            // Populate the column dropdown with options
            headers.forEach(header => {
                const option = document.createElement('option');
                option.value = header;
                option.textContent = header;
                columnSelect.appendChild(option);
            });

            // Update the column result value when the area changes
            updateColumnResult();
        })
        .catch(error => console.error('Error fetching CSV:', error));
}


function updateColumnResult() {
    const selectedColumns = Array.from(columnSelect.selectedOptions).map(option => option.value);

    // Fetch the CSV file and update the column result value
    fetch(areaToCTPath[areaSelect.value])
        .then(response => response.text())
        .then(csvData => {
            const rows = csvData.split('\n');
            const headers = rows[0].split(',');
            const value1 = rows[1].split(',');
            const value2 = rows[2].split(',');
            const value3 = rows[3].split(',');

            // Initialize variables for sum calculation
            let sumResultRow1 = 0;
            let sumResultRow2 = 0;
            let sumResultPop = 0;

            selectedColumns.forEach(selectedColumn => {
                const columnIndex = headers.indexOf(selectedColumn);
                if (columnIndex !== -1) {
                    sumResultRow1 += parseFloat(value1[columnIndex]) || 0; // Sum for row 1
                    sumResultRow2 += parseFloat(value2[columnIndex]) || 0; // Sum for row 2
                    sumResultPop += parseFloat(value3[columnIndex]) || 0; // Sum for population
                }
            });

            // Display the sum of selected columns for row 1 and row 2
            const resultRow1 = Math.round(sumResultRow1);
            const resultRow2 = Math.round(sumResultRow2);
            const resultPop = Math.round(sumResultPop);

            columnResultValue.textContent = `(${resultRow1}, ${resultRow2})`;
            columnResultPopValue.textContent = resultPop;
        })
        .catch(error => console.error('Error fetching CSV:', error));
}


function handleYearChange() {
    // Get the selected year from the dropdown
    const selectedYear = document.getElementById('year-select').value;

    if (selectedYear === '2019') {
        areaToCsvPath = areaToCsvPath2019;
        areaToCTPath = areaToCTPath2019;
    } else if (selectedYear === '2021') {
        areaToCsvPath = areaToCsvPath2021;
        areaToCTPath = areaToCTPath2021;
    }

    // Update the result based on the selected year and settings
    updateResult();
    updateColumnOptions();
    // Add any other updates you need to perform here.
}

// Add an event listener to the year select dropdown
const yearSelect = document.getElementById('year-select');
const areaSelect = document.getElementById('area-select');
const columnSelect = document.getElementById('column-select');
const columnResultValue = document.getElementById('column-result-value');
const columnResultPopValue = document.getElementById('column-result-value-pop');
const areaToCsvPath2019 = {};
const areaToCTPath2019 = {};
const areaToCsvPath2021 = {};
const areaToCTPath2021 = {};

// You can use these objects as needed when the area selection changes

yearSelect.addEventListener('change', handleYearChange);

areaSelect.addEventListener('change', updateResult); // Update the result when the area is changed

areaSelect.addEventListener('change', updateColumnOptions);

columnSelect.addEventListener('change', updateColumnResult);

// Initialize button status and update result
document.addEventListener("DOMContentLoaded", () => {
    for (let i = 1; i <= 6; i++) {
        const sliderId = `slider${i}`;
        const slider = document.getElementById(sliderId);
        slider.value = sliderValues[i - 1]; // Set the initial slider value
    }
    handleYearChange();
    // Initial update of result
    const firstOption = columnSelect.querySelector('option');
    if (firstOption) {
        columnSelect.value = firstOption.value;
    }

    // Initialize columnResultValue with the first row value
    updateColumnResult();
});
