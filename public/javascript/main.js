window.onload = () => {
  if (window.location.pathname === "/") enlargeBlobs();
  if (window.location.pathname.substr(0, 9) === "/dinodata") {
    enableDelete();
    enableChart();
  }
}

// Enlarge the blob upon hovering its swap element
function enlargeBlobs() {
  const ids = ['money', 'coding', 'social', 'ideas', 'music', 'watch', 'learn', 'gallery'];
  let swaps = [];
  let blobs = [];
  ids.forEach( id => {
    swaps.push(document.getElementById(id+'S'));
    blobs.push(document.getElementById(id+'B'));
  });
  swaps.forEach( (swap, index) => {
    swap.addEventListener('mouseover', () => {
      blobs[index].style.width = "145px";
      blobs[index].style.height = "145px";
    });
    swap.addEventListener('mouseout', () => {
      blobs[index].style.width = "121px";
      blobs[index].style.height = "121px";
    });
  });
}


/* ---------------------- */
/* Reptile Deletion Setup */
/* ---------------------- */
// TODO: Open an 'are you sure' prompt before deleting
// Add a listener to the delete button to remove a reptile
function enableDelete() {
  let deleteBs = document.getElementsByClassName('deleteReptile');
  if (deleteBs.length > 0) {
    let delete_button = deleteBs[0];
    delete_button.addEventListener('click', (e) => {
      const target = e.target;
      const id = target.getAttribute('data-id');
      remove(id);
    })
  }
}
// Issue an ajax request to delete a reptile with the given id
function remove(id) {
	let req = new XMLHttpRequest();
	req.open("DELETE", "/dinodata/cage/edit/"+id, true);
	req.onreadystatechange = () => {
		if (req.readyState == 4 && req.status == 200) {
      window.alert('Deleting reptile...')
			window.location.href = "/dinodata/cage";
		}
	}
  req.send("");
}


/* ------------------- */
/* Reading Chart Setup */
/* ------------------- */
// Get the embedded reptile ID and send it to the plotting functions
function enableChart() {
  let chartElems = document.getElementsByClassName("chart");
  if (chartElems.length > 0) {
    let chartElem = chartElems[0];
    let reptileId = chartElem.getAttribute("data-id");
    plotCage(reptileId);
  }
}
// Request data for the given reptile ID, parse it, plot it, and store it
async function plotCage(id) {
  let rawData = await getData(id);
  let dataset = parseData(rawData);
  plotData(weekSet(dataset));
  storeLocalData(dataset);
}
// Issue an ajax request to get readings for the reptile with the given ID
function getData(reptile_id) {
  return new Promise( resolve => {
    let req = new XMLHttpRequest();
    req.open("GET", "/dinodata/reading/"+reptile_id, true);
  	req.onreadystatechange = () => {
  		if (req.readyState == 4 && req.status == 200)	resolve(req.response);
  	}
    req.send("");
  });
}
// Get a graphable dataset
function parseData(rawData) {
  // Convert the data from a string to a js object
  let parsedRaw = JSON.parse(rawData);
  // Format the dates
  for (let i = 0; i < parsedRaw.length; i++)
    parsedRaw[i].date = dateFns.parse(parsedRaw[i].date);
  // Fill in missing dates and separate out the data categories
  let dataset = fullSet(parsedRaw);
  // Index the positions of the sundays and 1st of months found in the dataset
  dataset.weekPos = getWeekPositions(dataset.dates);
  dataset.monthPos = getMonthPositions(dataset.dates);
  // Set the timescale and where to start viewing the data
  dataset.currentPos = 0;
  dataset.timeScale = 'week';
  // If weeks of data were found, start on the last week
  if (dataset.weekPos && dataset.weekPos.length > 0)
    dataset.currentPos = dataset.weekPos[dataset.weekPos.length - 1];
  return dataset;
}


/* --------------- */
/* Dataset Parsing */
/* --------------- */
// Split the data into separate arrays to be fed to the graphs
function fullSet(raw) {
  // Return an empty set if there's no data
  let sets = { dates: [], coldest: [], warmest: [], humidity: [], hygiene: [] };
 	if (!raw || raw.length === 0)	return sets;
	// If there's only one datapoint, return it in a set
	else if (raw.length === 1) return singleSet(raw)
	// Otherwise fill in the missing dates between datapoints
	else return assignSetData(raw);
}
// Make a contiguous dataset and fill in the data by date
function assignSetData(raw) {
  // Obtain an empty data set with contiguous dates from the first to the last
  let fullSet = emptySet(raw[0].date, raw[raw.length-1].date);
  // Loop over the empty set, assigning data according to their date
  let index = 0;
  for (let i = 0; i < fullSet.dates.length; i++) {
    // Check that the dates match before assigning the next datum
    if (dateFns.isSameDay(fullSet.dates[i], raw[index].date)) {
      // Assign the readings at the current index
      fullSet.coldest[i] =  raw[index].coldest;
      fullSet.warmest[i] =  raw[index].warmest;
      fullSet.humidity[i] = raw[index].humidity;
      fullSet.hygiene[i] =  raw[index].grossness;
      // Increment the index to assign the next datum
      index++;
      if (index > raw.length-1) break; // Prevent index from overflowing raw
    }
  }
  return fullSet;
}
// Return a set with the first datum
function singleSet(raw) {
  return {
    dates:    [raw[0].dates],
    coldest:  [raw[0].coldest],
    warmest:  [raw[0].warmest],
    humidity: [raw[0].humidity],
    hygiene:  [raw[0].grossness]
  }
}
// Return an empty set of contiguous dates and reading slots
function emptySet(firstDate, lastDate) {
	let emptySet = { dates: [], coldest: [], warmest: [], humidity: [], hygiene: [] };
  emptySet.dates = dateFns.eachDay(	firstDate, lastDate	);
  // Put null in the other slots as placeholders
	for (let i = 0; i < emptySet.dates.length; i++){
		emptySet.coldest.push(null);
		emptySet.warmest.push(null);
		emptySet.humidity.push(null);
    emptySet.hygiene.push(null);
	}
	return emptySet;
}


/* ---------------- */
/* Dataset Indexing */
/* ---------------- */
// Return a list of the sunday positions in the dataset
function getWeekPositions(dates) {
	let weekPos = [];
	for (let i = 0; i < dates.length; i++)
		if (dateFns.isSunday(dates[i]))
      weekPos.push(i);
  // Include the first day of the previous week if it was not the first date
  if (weekPos[0] !== 0) weekPos.unshift(0);
	return weekPos;
}
// Obtain a list of the postions of first days of the month
function getMonthPositions(dates) {
	let monthPos = [];
	for (let i = 0; i < dates.length; i++)
		if (dateFns.isFirstDayOfMonth(dates[i]))
      monthPos.push(i);
  // Include the first day of the previous month if it was not the first date
  if (monthPos[0] !== 0) monthPos.unshift(0);
	return monthPos;
}


/* -------------------------- */
/* Dataset Week/Month Subsets */
/* -------------------------- */
// Return an empty dataset with 7 slots for data
function emptyWeekSet(date) {
	const firstOfWeek = dateFns.startOfWeek(date);
	const lastOfWeek = dateFns.endOfWeek(date);
	return {
		dates: dateFns.eachDay(firstOfWeek, lastOfWeek),
		coldest: [null, null, null, null, null, null, null],
		warmest: [null, null, null, null, null, null, null],
		humidity: [null, null, null, null, null, null, null],
    hygiene: [null, null, null, null, null, null, null]
	}
}
// Obtain a subset of the data spanning a week from the starting index
function weekSet(data) {
	// If the start is incremented past the data length, return nothing
	if (data.currentPos > data.dates.length-1) return;
	// Start a subset of the data to fill
	let subset = emptyWeekSet(data.dates[data.currentPos]);
	// Begin a counter at start
	let index = data.currentPos;
	// Loop over the data and add each datum to the subset
	for (let i = 0; i < 7; i++) {
		// Add data to the subset if the date has a corresponding datapoint
		if (dateFns.isSameDay(subset.dates[i], data.dates[index])) {
			subset.dates[i] =    data.dates[index];
			subset.coldest[i] =  data.coldest[index];
			subset.warmest[i] =  data.warmest[index];
			subset.humidity[i] = data.humidity[index];
      subset.hygiene[i] =  data.hygiene[index];
			// Increment the data counter and end if it was the last index
			index++;
			if (index > data.dates.length-1) break;
		}
	}
	return subset;
}
// Return an empty dataset spanning a month based on the month of the given date
function emptyMonthSet(date) {
	const firstOfMonth = dateFns.startOfMonth(date);
	const lastOfMonth = dateFns.lastDayOfMonth(date);
  const eachDay = dateFns.eachDay(firstOfMonth, lastOfMonth);
	let emptySet = {
		dates: eachDay,
		coldest: [],
		warmest: [],
		humidity: [],
    hygiene: []
	}
	for (let i = 0; i < eachDay.length; i++) {
		emptySet.coldest.push(null);
		emptySet.warmest.push(null);
		emptySet.humidity.push(null);
    emptySet.hygiene.push(null);
	}
	return emptySet;
}
// Obtain a subset of the data spanning a month from the starting index
function monthSet(data) {
	// If the start is incremented past the data length, return nothing
	if (data.currentPos > data.dates.length-1) return;
	// Start a subset of the data to fill
	let subset = emptyMonthSet(data.dates[data.currentPos]);
	// Begin a counter at start
	let index = data.currentPos;
	// Loop over the data and add each datum to the subset
	for (let i = 0; i < subset.dates.length; i++) {
		// Add data to the subset if the date has a corresponding datapoint
		if (dateFns.isSameDay(subset.dates[i], data.dates[index])) {
			subset.dates[i] =    data.dates[index];
			subset.coldest[i] =  data.coldest[index];
			subset.warmest[i] =  data.warmest[index];
			subset.humidity[i] = data.humidity[index];
      subset.hygiene[i] =  data.hygiene[index];
			// Increment the data counter and end if it was the last index
			index++;
			if (index > data.dates.length-1) break;
		}
	}
	return subset;
}


/* ---------------- */
/* Button functions */
/* ---------------- */
// TODO: When I'm composing the list of sundays and premiers,
// I should just put the first and last data points in with them
// So when decremented and there's less than a full month,
// it will take the chart to the first existing day of the previous
// Display the next or previous chronological data
function go(direction) {
  // Get the stored data or re-request it
	let dataset = retrieveLocalData();
  if (dataset && dataset.timeScale === "week") weekCrement(dataset, direction);
  else if (dataset && dataset.timeScale === "month") monthCrement(dataset, direction);
  else window.alert("timeScale not set!");
}
// Clickng the week view shows 7 day increments
function setWeekView() {
	// Get the stored data or re-request it
	let data = retrieveLocalData();
  if (data && data.timeScale === "month") {
		data.timeScale = "week";
		sessionStorage.setItem('timeScale', "week");
		let set = weekSet(data);
		if (set) plotData(set);
	}
}
// Clicking the month view shows 28-31 day increments
function setMonthView() {
	// Get the stored data or re-request it
	let data = retrieveLocalData();
	if (data && data.timeScale === "week") {
		data.timeScale = "month";
		sessionStorage.setItem('timeScale', "month");
		let set = monthSet(data);
		if (set) plotData(set);
	}
}
// Go forwards or backwards a week and plot it
function weekCrement(dataset, direction) {
  const indexCopy = dataset.currentPos;
  if (direction === 'back')
    dataset.currentPos = decrementWeek(dataset);
  else if (direction === 'forward')
    dataset.currentPos = incrementWeek(dataset);
  else window.alert("Invalid direction.");
  // Replot if the index changed
	if (dataset.currentPos !== indexCopy) {
		sessionStorage.setItem('currentPos', dataset.currentPos);
		plotData(weekSet(dataset));
	}
}
// Go forwards or backwards a month and plot it
function monthCrement(dataset, direction) {
  const indexCopy = dataset.currentPos;
  if (direction === "back")
    dataset.currentPos = decrementMonth(dataset);
  else if (direction === "forward")
    dataset.currentPos = incrementMonth(dataset);
  else window.alert("Invalid direction.");

  console.log("Before: ", indexCopy, " After: ", dataset.currentPos);
  console.log("Premiers: ", dataset.monthPos);

  // Replot if the index changed
  if (dataset.currentPos !== indexCopy) {
    sessionStorage.setItem('currentPos', dataset.currentPos);
    plotData(monthSet(dataset));
  }
}
// Take the current index and return the index of the previous/next week/month
function decrementWeek(dataset) {
  let newPos = dataset.currentPos;
  if (dataset.currentPos !== 0 && dataset.weekPos.length !== 0) {
    const closestWeekPos = findClosestIndex(dataset.currentPos, dataset.weekPos);
    // If the closest isn't the first, and there are more than 1 week positions
    if (closestWeekPos !== 0 && dataset.weekPos.length > 1) {
      newPos = dataset.weekPos[closestWeekPos-1];
    }
  }
  return newPos;
}
function incrementWeek(dataset) {
  let newPos = dataset.currentPos;
  if (newPos !== dataset.dates.length-1 && dataset.weekPos.length !== 0) {
    const closestWeekPos = findClosestIndex(dataset.currentPos, dataset.weekPos);
    // If the closest isn't the last, and there are more than 1 week positions
    if (closestWeekPos !== dataset.weekPos.length-1 && dataset.weekPos.length > 1)
      newPos = dataset.weekPos[closestWeekPos+1];
  }
  return newPos;
}
function decrementMonth(dataset) {
  let newPos = dataset.currentPos;
  if (dataset.currentPos !== 0 && dataset.monthPos.length !== 0) {
    const closestMonthPos = findClosestIndex(dataset.currentPos, dataset.monthPos);
    if (closestMonthPos !== 0 && dataset.monthPos.length > 1)
      newPos = dataset.monthPos[closestMonthPos-1];
  }
  return newPos;
}
function incrementMonth(dataset) {
  let newPos = dataset.currentPos;
  if (dataset.currentPos !== dataset.dates.length-1 && dataset.monthPos.length !== 0) {
    const closestMonthPos = findClosestIndex(dataset.currentPos, dataset.monthPos);
    if (closestMonthPos !== dataset.monthPos.length-1 && dataset.monthPos.length > 1)
      newPos = dataset.monthPos[closestMonthPos+1];
  }
  return newPos;
}


/* ------------------------- */
/* Dataset Storage/Retrieval */
/* ------------------------- */
// Get the data stored in sessionStorage or re-request it
function retrieveLocalData() {
	let dataset = null;
	if (typeof(Storage) !== "undefined") {
		dataset = {
			dates:      JSON.parse(sessionStorage.getItem('dates')),
			coldest:    JSON.parse(sessionStorage.getItem('coldest')),
			warmest:    JSON.parse(sessionStorage.getItem('warmest')),
			humidity:   JSON.parse(sessionStorage.getItem('humidity')),
      hygiene:    JSON.parse(sessionStorage.getItem('hygiene')),
			weekPos:    JSON.parse(sessionStorage.getItem('weekPos')),
			monthPos:   JSON.parse(sessionStorage.getItem('monthPos')),
			currentPos: parseInt(sessionStorage.getItem('currentPos')),
			timeScale:  sessionStorage.getItem('timeScale')
		}
	}
	return dataset;
}
// Store changes to the local data
function storeLocalData(dataset) {
	// Store the data in the session to scroll through graph data
	if (typeof(Storage) !== "undefined") {
		sessionStorage.setItem('dates',      JSON.stringify(dataset.dates));
		sessionStorage.setItem('coldest',    JSON.stringify(dataset.coldest));
		sessionStorage.setItem('warmest',    JSON.stringify(dataset.warmest));
		sessionStorage.setItem('humidity',   JSON.stringify(dataset.humidity));
    sessionStorage.setItem('hygiene',    JSON.stringify(dataset.hygiene));
		sessionStorage.setItem('weekPos',    JSON.stringify(dataset.weekPos));
		sessionStorage.setItem('monthPos',   JSON.stringify(dataset.monthPos));
		sessionStorage.setItem('currentPos', dataset.currentPos.toString());
		sessionStorage.setItem('timeScale',  dataset.timeScale);
	}
	else console.log("Please enable sessionStorage for on your browser.");

}


/* ------------------ */
/* Charting Functions */
/* ------------------ */
// Plot the given data for the temperature and humidity graphs
function plotData(data) {
  let chart = document.getElementById("cageChart");
	if (data && data.dates.length > 0) {
		plotReadings(chart, data);
	}
}
function replot() {
  let dataset = retrieveLocalData();
  let chart = document.getElementById("cageChart");
  plotReadings(chart, dataset);
}
// Plot the cool, warm, and humidity datapoints on the temperature graph
function plotReadings(chart, data) {
	if (chart) {
		// Check for previous chart instances and delete them
		if (window.chart) {	window.chart.destroy();	}
		// Create a new chart instance on the canvas
		chart = chart.getContext('2d');
		let plot = new Chart(chart, {
			type: 'line',
			data: {
				labels: dateset(data.dates),
				datasets: packData(data)
			},
			options: {
				scales: {
					yAxes: [{
						ticks: {
							beginAtZero: false
						}
					}]
				}
			}
		})
		// Store the curent chart in the window to delete later
		window.chart = plot;
		// Update the current chart with the new values
		plot.update();
	}
}
// Format the graph date label set to MM-DD-YY
function dateset(dates) {
	let labels = [];
	for (let i = 0; i < dates.length; i++) {
		let current = new Date(dates[i]);
		let dateLabel =
			(current.getMonth()+1).toString() + "-"
			+ current.getDate().toString() + "-"
			+ current.getFullYear().toString().substring(2);
		labels.push(dateLabel);
	}
	return labels;
}
// Package the enabled data types to display
function packData(data) {
  // Grab the checkbox elements
  var cbs = {
    cold: document.getElementById('coldCheck'),
    warm: document.getElementById('warmCheck'),
    humid: document.getElementById('humidCheck'),
    hygiene: document.getElementById('hygieneCheck')
  }
  var sets = [];
  if (cbs.cold.checked) sets.push(coolset(data.coldest));
  if (cbs.warm.checked) sets.push(warmset(data.warmest));
  if (cbs.humid.checked) sets.push(humidset(data.humidity));
  if (cbs.hygiene.checked) sets.push(hygieneset(data.hygiene));
  return sets;
}
// Package the cool readings into a graphable dataset
function coolset(cools) {
	const coolSet = {
		label: "Cool Temperatures",
		data: cools,
		//backgroundColor: ['#001F3F'],
		borderColor: ['#001F3F'],
		borderWidth: 2
	};
	return coolSet;
}
// Package the warm readings into a graphable dataset
function warmset(warms) {
	const warmSet = {
		label: "Warm Temperatures",
		data: warms,
		//backgroundColor: ['#FF0000'],
		borderColor: ['#FF0000'],
		borderWidth: 2
	}
	return warmSet;
}
// Package the humidity readings into a graphable dataset
function humidset(humids) {
	const humiSet = {
		label: "Humidity",
		data: humids,
		//backgroundColor: ['#EEEEEE'],
		borderColor: ['#7FDBFF'],
		borderWidth: 2
	}
	return humiSet;
}
// Package the hygiene readings into a graphable dataset
function hygieneset(hygienes) {
  const hygSet = {
		label: "Hygiene",
		data: hygienes,
		//backgroundColor: ['#EEEEEE'],
		borderColor: ['#7FDBFF'],
		borderWidth: 2
	}
	return hygSet;
}


/* --------------------- */
/* Misc Helper Functions */
/* --------------------- */
// Take a number and an array of numbers, look through the array for the index of the value closest to the given number
function findClosestIndex(number, array) {
	if (array) {
		let comparison = 0;
		for (let i = 0; i < array.length; i++)
			if (Math.abs(number - array[i]) < Math.abs(number - comparison))
				comparison = i;
		return comparison;
	}
}









/* --- Graveyard --- */
/*
//Plot the previous week in the dataset
function decrementWeek(dataset) {
	// shorthand the first and last sunday position in the data
	const lastSundayIndex = dataset.weekPos[dataset.weekPos.length - 1];
	const firstSundayIndex = dataset.weekPos[0];
	// check for the position of the current index in the sunday indices
	const currentSundayIndex = dataset.weekPos.indexOf(dataset.currentPos);
	// store the new starting position
	let newStart = 0;
	// if the index was found and not the first, go to the previous one
	if (currentSundayIndex > 0 && dataset.weekPos.length > 1)
    newStart = dataset.weekPos[currentSundayIndex - 1];
	// if not found, and the current is after the last sunday, set it to the last sunday
	else if (currentSundayIndex === -1 && dataset.currentPos > lastSundayIndex)
    newStart = lastSundayIndex;
	// if not found and is before the first sunday, set current to 0
	else if (currentSundayIndex === -1 && dataset.currentPos < firstSundayIndex)
    newStart = 0;
	// Otherwise go to the closest week
	else
    newStart = findClosestIndex(dataset.currentPos, dataset.weekPos);
	// Replot if the index Changed
	if (dataset.currentPos !== newStart) {
		sessionStorage.setItem('currentPos', newStart);
		plotData(weekSet(dataset, newStart));
	}
}
// Plot the next week in the dataset
function incrementWeek(dataSet) {
	// shorthand the first and last sunday positions in the data
	const lastSundayIndex = dataSet.weekPos[dataSet.weekPos.length - 1];
	const firstSundayIndex = dataSet.weekPos[0];
	// if on the last sunday, do nothing
	if (dataSet.currentPos === lastSundayIndex) return;
	// look for the current index in the list of sundays
	const currentSundayIndex = dataSet.weekPos.indexOf(dataSet.currentPos);
	// store the new starting position
	let newStart = 0;
	// if found, it will be >= 0. make sure its not the last one and increment
	if (currentSundayIndex >= 0 && currentSundayIndex !== lastSundayIndex)
		newStart = dataSet.weekPos[currentSundayIndex + 1];
	// if not found, and the current is after the last sunday, set it to the last sunday
	else if (currentSundayIndex === -1 && dataSet.currentPos > lastSundayIndex)
		newStart = lastSundayIndex;
	// if not found and is before the first sunday, set current to the first sunday
	else if (currentSundayIndex === -1 && dataSet.currentPos < firstSundayIndex)
		newStart = firstSundayIndex;
	// Otherwise go to the closest week
	else newStart = findClosestIndex(dataSet.currentPos, dataSet.weekPos);
	// Replot if the index changed
	if (dataSet.currentPos !== newStart) {
		sessionStorage.setItem('currentPos', newStart);
		plotData(weekSet(dataSet, newStart));
	}
}
// Plot the previous month in the dataset
function decrementMonth(dataSet) {
	if (dataSet.currentPos === 0) return;
	if (!dataSet.monthPos) return;
	else {
		// shorthand the first and last premier positions in the data
		const lastPremierIndex = dataSet.monthPos[dataSet.monthPos.length - 1];
		const firstPremierIndex = dataSet.monthPos[0];
		// check for the position of the current index in the premier indices
		const currentPremierIndex = dataSet.monthPos.indexOf(dataSet.currentPos);
		// store the new starting position
		let newStart = 0;
		// if the index was found and not the first, go to the previous one
		if (currentPremierIndex > 0 && dataSet.monthPos.length > 1) {
			newStart = dataSet.monthPos[currentPremierIndex - 1];
		}
		// if not found, and the current is after the last premier, set it to the last premier
		else if (currentPremierIndex === -1 && dataSet.currentPos > lastPremierIndex) {
			newStart = lastPremierIndex;
		}
		// if not found and is before the first premier, set current to 0
		else if (currentPremierIndex === -1 && dataSet.currentPos < firstPremierIndex) {
			newStart = 0;
		}
		// Otherwise go to the closest week
		else {
			newStart = findClosestIndex(dataSet.currentPos, dataSet.monthPos);
		}

		// Replot if the index Changed
		if (dataSet.currentPos !== newStart) {
			sessionStorage.setItem('currentPos', newStart);
			plotData(monthSet(dataSet, newStart))
		}
	}
}
// Plot the next month in the dataset
function incrementMonth(dataSet) {
	// If on the last day do nothing
	if (dataSet.currentPos === dataSet.dates.length - 1) return;
	// If there are no indexed premiers, the data does not span a week
	else if (!dataSet.monthPos) return;
	// If there are premiers, check for the next one and go to it
	else {
		// shorthand the first and last premier positions in the data
		const lastPremierIndex = dataSet.monthPos[dataSet.monthPos.length - 1];
		const firstPremierIndex = dataSet.monthPos[0];
		// if on the last premier, do nothing
		if (dataSet.currentPos === lastPremierIndex) return;
		// look for the current index in the list of premiers
		const currentPremierIndex = dataSet.monthPos.indexOf(dataSet.currentPos);
		// store the new starting position
		let newStart = 0;
		// if found, it will be >= 0. make sure its not the last one and increment
		if (currentPremierIndex >= 0 && currentPremierIndex !== lastPremierIndex) {
			newStart = dataSet.monthPos[currentPremierIndex + 1];
		}
		// if not found, and the current is after the last premier, set it to the last premier
		else if (currentPremierIndex === -1 && dataSet.currentPos > lastPremierIndex) {
			newStart = lastPremierIndex;
		}
		// if not found and is before the first premier, set current to the first premier
		else if (currentPremierIndex === -1 && dataSet.currentPos < firstPremierIndex) {
			newStart = firstPremierIndex;
		}
		// Otherwise go to the closest week
		else {
			newStart = findClosestIndex(dataSet.currentPos, dataSet.monthPos);
		}

		// Replot if the index changed
		if (dataSet.currentPos !== newStart) {
			sessionStorage.setItem('currentPos', newStart);
			plotData(monthSet(dataSet, newStart));
		}
	}
}
*/
