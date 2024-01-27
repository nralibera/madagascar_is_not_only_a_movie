// Variable exportation
export {rootSvg,svg,g, graph,projection,pathGenerator,pattern,redPattern,width,height};

// the map
const width = window.innerWidth*0.7;
const height = window.innerHeight*0.9;

const rootSvg = d3.select('.map')    
              .append('svg')
              .attr('class', 'rootSvg')
              .attr('width', width)
              .attr('height', height);

       
const svg = d3.select('.rootSvg')
    .append('svg')
    .attr('class' , 'svg')
    .attr('width', width)
    .attr('height', height*0.6)
    .attr('y', height*0.025)

// Group for the map
const g = svg.append('g');

    
// SVG for the graph
const graph = rootSvg.append('svg')
                  .attr('class' , 'graph')
                  .attr('width', width)
                  .attr('x', width*0.1)
                  .attr('y', height*0.63);
 
 // Projection
const projection = d3.geoMercator().scale(10).translate([width / 2, height / 2.2]);
const pathGenerator = d3.geoPath(projection);

// Zoom
rootSvg.call(d3.zoom().on('zoom',()=>{
    g.attr("transform", d3.event.transform);
    }));

// Pattern Creation for Background

const pattern = svg.append('defs')
                  .append('pattern')
                    .attr('id', 'greyDots')
                    .attr('patternUnits', 'userSpaceOnUse')
                    .attr('width', 4)
                    .attr('height', 4);

pattern.append('circle')
        .attr('cx', 2)
        .attr('cy', 2)
        .attr('r', 1);

const redPattern = svg.append('defs')
                      .append('pattern')
                        .attr('id', 'redDots')
                        .attr('patternUnits', 'userSpaceOnUse')
                        .attr('width', 4)
                        .attr('height', 4);

  redPattern.append('circle')
    .attr('cx', 2)
    .attr('cy', 2)
    .attr('r', 1);



// Declare a variable to hold the interval IDs
let intervalIds = [];


/**
 * Function to get the athlete's name from their ID.
 * 
 * @param {number} athleteId - The ID of the athlete.
 * @param {Object} jsonData - The data containing information about the athletes.
 * @returns {string} The name of the athlete.
 */
export function getAthleteInfoFromId(athleteId, jsonData){
    // Convert the athleteId to a string and use it to get the athlete's information from jsonData
    let athleteInfo = jsonData[athleteId.toString()];
  
    // Return the athlete's name
    return athleteInfo['athlete_name']
  }
  
  
  /**
   * Function to build the path of an athlete's participation in games.
   * 
   * @param {number} athleteId - The ID of the athlete.
   * @param {Object} jsonData - The data containing information about the athletes and games.
   * @param {number} [year=null] - The year from which to consider games. If null, all games are considered.
   * @returns {Array|boolean} An array of LineString objects representing the path of the athlete's participation in games, or false if a year is specified and the athlete has only participated in one game.
   */
  export function buildAthletePath(athleteId, jsonData, year = null) {
    // Initialize an array to store the path
    let link = [];
  
    // Get the athlete's information from the jsonData
    let athleteInfo = jsonData[athleteId.toString()];
  
    // Get the coordinates of the athlete's country
    let athleteCountryCoord = [athleteInfo['athlete_country_coord'][1], athleteInfo['athlete_country_coord'][0]];
  
    // Iterate over the games the athlete has participated in
    for (let gameYear in athleteInfo['games_participation']) {
  
        // Get the details of the game
        let gameDetails = athleteInfo['games_participation'][gameYear];
  
        // Get the coordinates of the game's country
        const long =  gameDetails['games_country_coord'][1];
        const lat = gameDetails['games_country_coord'][0];
  
        // If a year is specified, only consider games from that year onwards
        if (year !== null) {
            if (gameYear >= year) {
                // Add a line from the athlete's country to the game's country to the path
                link.push({
                    'type': 'LineString',
                    'coordinates': [athleteCountryCoord, [long, lat]]
                });
  
                // Update the athlete's country to the game's country
                athleteCountryCoord = [long, lat];
            }
        } else {
            // If no year is specified, consider all games
            link.push({
                'type': 'LineString',
                'coordinates': [athleteCountryCoord, [long,lat]]
            });
  
            // Update the athlete's country to the game's country
            athleteCountryCoord = [long,lat];
        }
    }
  
    // If a year is specified and the athlete has only participated in one game, return false
    if (year !== null) {
        return link.length === 1 ? false : link;
    }
  
    // Return the path
    return link;
  }
  
  /**
   * Function to convert points to a path.
   * 
   * @param {Object|Array} linePropObject - An object representing a line (or an array of such objects).
   * @param {number} randomSlope - A factor to adjust the slope of the path.
   * @param {number} randomCurve - A factor to adjust the curvature of the path.
   * @param {number} randomInvert - A factor to invert the path.
   * @returns {string} A string representing a path that connects the points in the line.
   */
  export function pointsToPath(linePropObject, randomSlope, randomCurve, randomInvert) {
    // If the input is an array, map each line to a path and join them into a single string
    if (Array.isArray(linePropObject)) {
      return linePropObject.map(line => pointsToPath(line, randomSlope, randomCurve, randomInvert)).join('');
    }
  
    // Get the x and y coordinates of the start and end points
    const fromCoord = projection(linePropObject.coordinates[0]);
    const toCoord = projection(linePropObject.coordinates[1]);
  
    const fromX = fromCoord[0];
    const fromY = fromCoord[1];
    const toX = toCoord[0];
    const toY = toCoord[1];
  
    // Calculate the center point
    const centerPoint = [(fromX + toX) / 2, (fromY + toY) / 2];
  
    // Calculate the slope of the line
    const slope = (toY - fromY) / (toX - fromX);
  
    // Calculate the distance between the start and end points
    const distance = Math.sqrt(Math.pow((toX - fromX), 2) + Math.pow((toY - fromY), 2));
  
    // Calculate the offset for the curve
    const offset = (randomInvert * randomSlope) * randomCurve * Math.sqrt(distance);
  
    // Calculate the angle of the line
    const angle = Math.atan(slope);
  
    // Calculate the x and y offsets for the curve
    const offsetY = Math.cos(angle) * offset;
    const offsetX = Math.sin(angle) * offset;
  
    // Calculate the center point of the curve
    const offsetCenter = [centerPoint[0] - offsetX, centerPoint[1] + offsetY];
    const arcPointX = offsetCenter[0]
    const arcPointY = offsetCenter[1]
  
    // Return the path string
    return `M${fromX} ${fromY}Q${arcPointX} ${arcPointY} ${toX} ${toY}`;
  }
  
  
  /**
   * Function to build a list of medals won by an athlete.
   * 
   * @param {number} athleteId - The ID of the athlete.
   * @param {Object} jsonData - The data containing information about the athletes.
   * @param {Array} gamesData - The data containing information about the games.
   * @param {number} [year=null] - The year from which to consider games. If null, all games are considered.
   * @returns {Array} An array of objects, each representing the medals won by the athlete in a particular year.
   */
  export function buildAthleteMedalFromId(athleteId, jsonData, gamesData, year = null){
    const medals = [];
    const athleteInfo = jsonData[athleteId];
  
    // Create a lookup object from the gamesData array
    const gamesLookup = {};
    gamesData.forEach(game => {
      // Map each game's edition_id to its city
      gamesLookup[game['edition_id']] = game['city'];
    });
  
    // Iterate over the games the athlete has participated in
    for (let gameYear in athleteInfo['games_participation']) {
      const gameDetails = athleteInfo['games_participation'][gameYear];
      // Use the lookup object to find the city of the games
      const cityOfGames = gamesLookup[gameDetails['games_id']];
      const { gold, silver, bronze } = gameDetails;
  
      // If a year is specified, only consider games from that year onwards
      if (year === null || gameYear >= year) {
        // Add an object representing the medals won by the athlete in the current year to the medals array
        medals.push({'gameYear': gameYear, 'gold': gold, 'silver': silver, 'bronze': bronze, 'city': cityOfGames});
      }
    }
  
    // Return the medals array
    return medals;
  }
  
  
  /**
   * Function to build a set of years in which athletes from a given list have participated in games.
   * 
   * @param {Array} athleteList - An array of athlete IDs.
   * @param {Object} jsonData - The data containing information about the athletes.
   * @returns {Set} A set of years in which the athletes have participated in games.
   */
  export function buildYearParticipationFromAthleteList(athleteList, jsonData){
    // Initialize a new Set to store the years of participation
    let yearParticipation = new Set();
  
    // Iterate over the list of athletes
    for (let athleteId of athleteList){
      // Get the athlete's information from jsonData
      let athleteInfo = jsonData[athleteId.toString()];
  
      // Iterate over the games the athlete has participated in
      for (let gameYear in athleteInfo['games_participation']) {
        // If the year is not already in the set, add it
        if (!yearParticipation.has(gameYear)){
          yearParticipation.add(gameYear);
        }
      }
    }
  
    // Return the set of years
    return yearParticipation;
  }
  
  /**
   * Function to build a list of medals won by athletes from a given country or countries.
   * 
   * @param {string|Array} countryNoc - The NOC code of the country, or an array of NOC codes.
   * @param {Array} athleteList - An array of athlete IDs.
   * @param {Object} jsonData - The data containing information about the athletes.
   * @param {Array} medalCountryData - The data containing information about the medals won by each country.
   * @param {Array} gamesData - The data containing information about the games.
   * @param {number} [year=null] - The year from which to consider games. If null, all games are considered.
   * @returns {Array} An array of objects, each representing the medals won by the country or countries in a particular year.
   */
  export function buildCountryMedalFromAthleteList(countryNoc, athleteList, jsonData, medalCountryData, gamesData, year = null){
    let medals = [];
    // Get the years in which the athletes have participated in games
    const yearParticipation = buildYearParticipationFromAthleteList(athleteList, jsonData);
    
    // Iterate over the years of participation
    for (let gameYear of yearParticipation){
      // Get the city where the games were held in the current year
      const cityOfGames = gamesData.filter(d => d['year'] === gameYear)[0]['city'];
  
      // If countryNoc is an array, iterate over it and sum the medals won by each country
      if (Array.isArray(countryNoc)){
        let gold = 0;
        let silver = 0;
        let bronze = 0;
        for(let countryNocIter of countryNoc){
          // Get the medal information for the current country in the current year
          const medalInfoForCountry = medalCountryData.filter(d => d['country_noc'] === countryNocIter && d['year'] === gameYear)[0];
          if (medalInfoForCountry !== undefined){
            // Add the medals won by the current country to the total
            gold +=parseInt(medalInfoForCountry['gold'],10);
            silver +=parseInt(medalInfoForCountry['silver'],10);
            bronze +=parseInt(medalInfoForCountry['bronze'],10);
          } 
        }
        // Add an object representing the total medals won by the countries in the current year to the medals array
        medals.push({'gameYear': gameYear, 'gold': gold, 'silver': silver, 'bronze': bronze, 'city' : cityOfGames });
      }else{
        // If countryNoc is not an array, get the medal information for the country in the current year
        const medalInfoForCountry = medalCountryData.filter(d => d['country_noc'] === countryNoc && d['year'] === gameYear)[0];
        if (medalInfoForCountry !== undefined){
          // Add an object representing the medals won by the country in the current year to the medals array
          medals.push({'gameYear': gameYear, 'gold': medalInfoForCountry['gold'], 'silver': medalInfoForCountry['silver'], 'bronze': medalInfoForCountry['bronze'], 'city' : cityOfGames });
        } else {
          // If the country did not win any medals in the current year, add an object with zero medals to the medals array
          medals.push({'gameYear': gameYear, 'gold': 0, 'silver': 0, 'bronze': 0, 'city' : cityOfGames });
        }
      }
    }
  
    // Sort the medals array by year
    medals.sort((a, b) => a.gameYear - b.gameYear);
  
    // Return the medals array
    return medals;
  }
  
  
  /**
   * Function to build a list of athletes from a given country who participated in games in a given year.
   * 
   * @param {string} countryCode - The NOC code of the country.
   * @param {Object} jsonData - The data containing information about the athletes.
   * @param {number} [year=2016] - The year from which to consider games. If not specified, defaults to 2016.
   * @returns {Array} An array of athlete IDs.
   */
  export function buildAthleteListFromACountry(countryCode, jsonData, year = 2016){
    // Initialize an empty array to store the athlete IDs
    let athleteList = [];
  
    // Iterate over the jsonData object
    for (let athleteId in jsonData) {
      // Get the athlete's information
      let athleteInfo = jsonData[athleteId.toString()];
  
      // If the athlete is from the specified country and participated in games in the specified year, add their ID to the list
      if (athleteInfo['athlete_country_code'] === countryCode && athleteInfo['games_participation'][year] !== undefined) {
        athleteList.push(athleteId);
      }
    }
  
    // Return the list of athlete IDs
    return athleteList;
  }
  
  
  /**
   * Adds a moving circle along the length of the provided SVG path.
   *
   * @param {boolean} isLongLength - Indicates whether the path length is long.
   * @param {Object} athleteData - Data related to athletes.
   * @param {Object} gamesData - Data related to games.
   * @param {Object} athleteBioData - Data related to athlete biographies.
   * @param {boolean} drawLegend - Flag to determine whether to draw a legend.
   * @returns {function} - Returns a function to be used as a callback for d3 selection.
   */
  export function addMovingCircleOnPath(isLongLength, athleteData, gamesData, athleteBioData, drawLegend = false) {
    return function(d, i) {
      // Initialization
      let thisPath = d3.select(this);
      let stoppingCircleAdded = false;
      let randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
      let length = thisPath.node().getTotalLength();
  
      // Extract athlete ID from the path ID
      const athlete_id = thisPath._groups[0][0].id.replace("path", "");
  
      // Set delay based on index and path length
      const delay = isLongLength ? Math.min(i * 30, 2000) : i * 500;
  
      // Draw legend if specified
      if (drawLegend) {
        const allPaths = d3.selectAll("#path" + athlete_id);
        const legendDiv = d3.select(".legend");
        legendDiv.append("div")
          .attr("class", "legendItem")
          .text(getAthleteInfoFromId(athlete_id, athleteData))
          .style("background-color", randomColor)
          .on("mouseover", function(event, d) {
            allPaths.style("stroke-width", 6);
            d3.select("#circle" + athlete_id).attr("r", 5);
          })
          .on("mouseout", function(event, d) {
            allPaths.style("stroke-width", 2);
            d3.select("#circle" + athlete_id).attr("r", 3);
          })
          .on("click", function(event, d) {
            const medalsData = buildAthleteMedalFromId(athlete_id, athleteData, gamesData);
            const athleteBio = buildAthletBioFromId(athlete_id, athleteData, athleteBioData);
            drawJourneyFromMedalsData(medalsData);
            displayBio(athleteBio);
          });
      }
  
      // Set stroke color and initiate path animation
      thisPath.style("stroke", randomColor)
        .transition()
        .delay(delay)
        .duration(1000)
        .attr("stroke-dashoffset", 0)
        .on("end", function() {
          // Add a circle along the path
          let circle = g.append("circle")
            .attr("class", 'movingCircle')
            .attr('id', "circle" + athlete_id)
            .attr("r", 3)
            .attr("fill", randomColor);
  
          // Initialize variables for circle animation
          let startTime;
          let animationId;
  
          // Function to animate the circle along the path
          function animateCircle(timestamp) {
            if (!startTime) startTime = timestamp;
            let progress = timestamp - startTime;
            let t = progress / 3000;
  
            if (t > 1) {
              t = 0; // Reset t
              startTime = undefined; // Reset startTime
              if (!stoppingCircleAdded) {
                // Add a stopping circle at the end of the path
                g.append("circle")
                  .attr("class", 'stoppingCircle')
                  .attr('id', "circle" + athlete_id)
                  .attr("r", 3)
                  .attr("fill", randomColor)
                  .attr("transform", "translate(" + thisPath.node().getPointAtLength(length).x + "," + thisPath.node().getPointAtLength(length).y + ")")
                  .on("click", function(event, d) {
                    const medalsData = buildAthleteMedalFromId(athlete_id, athleteData, gamesData);
                    const athleteBio = buildAthletBioFromId(athlete_id, athleteData, athleteBioData);
                    drawJourneyFromMedalsData(medalsData);
                    displayBio(athleteBio);
                  })
                  .on("mouseover", function(event, d) {
                    d3.select(this).attr("r", 5);
                  })
                  .on("mouseout", function(event, d) {
                    d3.select(this).attr("r", 3);
                  });
  
                stoppingCircleAdded = true;
              }
            }
  
            // Schedule the next frame
            animationId = requestAnimationFrame(animateCircle);
            intervalIds.push(animationId);
  
            // Update circle position along the path
            let point = thisPath.node().getPointAtLength(t * length);
            circle.attr("transform", "translate(" + point.x + "," + point.y + ")");
          }
  
          // Start the circle animation
          requestAnimationFrame(animateCircle);
        });
    };
  }
  
  
  /**
   * Function to draw a path for each athlete in a list.
   * 
   * @param {Array} athleteList - The list of athlete IDs.
   * @param {Object} athleteData - The data containing information about the athletes.
   * @param {Object} athleteBioData - The data containing biographical information about the athletes.
   * @param {Object} gamesData - The data containing information about the games.
   */
  export function drawPathFromAnAthleteList(athleteList, athleteData, athleteBioData, gamesData){
  
    // Clear all intervals before removing the paths
    intervalIds.forEach(cancelAnimationFrame);
  
    // Clear the bio div
    const bioDiv = d3.select(".bio");
    bioDiv.selectAll("div, h2").remove();
  
    // Remove all bars, axes, and legend items
    d3.selectAll(".bar").remove();
    d3.selectAll(".axis").remove();
    d3.selectAll(".legendItem").remove();
  
    // If there are fewer than 16 athletes, draw a legend
    let drawLegend = false;
    if (athleteList.length <16) {
      drawLegend = true;
    }
  
    // Reset the interval IDs array
    intervalIds = [];
  
    // Remove all path groups, moving circles, and stopping circles
    // d3.selectAll(" .movingCircle, .stoppingCircle").remove();
  
    // Create an empty object to store the paths
    let athletePaths = [];
  
    // Loop over the athleteList and build the paths
    athleteList.forEach((athlete_id) => {
      athletePaths.push({'id':athlete_id, 'path': buildAthletePath(athlete_id, athleteData)});
    });
  
    // If there are more than 30 athletes, set isLongLength to true
    let isLongLength = athleteList.length > 30 ? true : false;
  
    // Create the paths
    let path = g.selectAll(".pathGroup")
                .data(athletePaths, d => d.id.toString())
                .join(      
                  enter => enter.append('path')
                 .attr("class", "pathGroup")
                  .attr("d", function(d){
                    // A path generator
                    const max = 1.1;
                    const min = 0.9;
    
                    const randomInvert = Math.random() < 0.5 ? -1 : 1;
                    const randomSlope = Math.random() * (max - min + 1) + min; 
                    const randomCurve = Math.random() * (1.7 - 0.95 + 1) + min; 
    
                    return pointsToPath(d.path, randomSlope, randomCurve, randomInvert)})
                  .attr("id",d => "path"+d.id.toString())
                  .style("fill", "none")
                  .style("stroke-width", 2)
                  .attr("stroke-dasharray", function() {
                      const thisPathLength = this.getTotalLength();
                      return thisPathLength + " " + thisPathLength;
                  })
                  .attr("stroke-dashoffset", function() {
                      return this.getTotalLength();
                  })
                  .each(addMovingCircleOnPath(isLongLength, athleteData, gamesData,athleteBioData,drawLegend))
                  .call(removeAllCircleExceptSelection),
                  update => update,
                  exit => exit.remove()
                )

  
    // Add a title to each path
    path.append('title')
        .text(d => getAthleteInfoFromId(d.id, athleteData) );
  
    // Add mouseover, mouseout, and click events to each path
    path.on("mouseover", function(event,d) {
          const allPath = d3.selectAll("#path"+event.id);
          allPath.style("stroke-width", 6)})
        .on("mouseout", function(event,d) {
          const allPath = d3.selectAll("#path"+event.id);
          allPath.style("stroke-width", 2)})
        .on("click", function(event,d) {
          // Get the athlete id from the path
          const athlete_id = event.id;
  
          const medalsData = buildAthleteMedalFromId(athlete_id, athleteData, gamesData);
          drawJourneyFromMedalsData(medalsData);
          const athleteBio =  buildAthletBioFromId(athlete_id,athleteData,athleteBioData);
          displayBio(athleteBio);
        })
  }
  
/**
 * Removes all circle elements that are not currently selected.
 *
 * @param {Selection} selection - The current selection of circle elements.
 */
function removeAllCircleExceptSelection(selection){
  // Get the IDs of the selected circles
  const selectedIds = selection._groups[0].map(d => d.id.replace("path","circle"));
  
  // Select all circles
  const allCircles = d3.selectAll(".stoppingCircle, .movingCircle");
  
  // Remove all circles that are not currently selected
  if (allCircles.length !== 0) {
    allCircles.each(function(d, i) {
      // Get the ID of the current circle
      const currentId = this.id;
  
      // If the current ID is not in the list of selected IDs, remove the circle
      if (!selectedIds.includes(currentId)) {
        d3.select('#' + currentId).remove();
      }
    });
  }
}

  /**
   * Function to map a value from one range to another.
   * 
   * @param {number} value - The input value to be mapped.
   * @returns {number} The input value mapped from the range [inputMin, inputMax] to the range [outputMin, outputMax].
   */
  export function mapRange(value) {
    // Define the minimum and maximum values of the input range
    const inputMin = 22;
    const inputMax = 30;
  
    // Define the minimum and maximum values of the output range
    const outputMin = 52;
    const outputMax = 60;
  
    // Map the input value from the input range to the output range
    // This is done by first normalizing the value to a 0-1 range (by subtracting inputMin and dividing by the input range),
    // then denormalizing it to the output range (by multiplying by the output range and adding outputMin).
    return ((value - inputMin) / (inputMax - inputMin)) * (outputMax - outputMin) + outputMin;
  }
  
  /**
   * Draws a bar chart representing the distribution of gold, silver, and bronze medals over different game years and cities.
   * @param {Array} medalsData - The data containing information about medals, game years, and cities.
   */
  export function drawJourneyFromMedalsData(medalsData) {
    // Clean Graph before redrawing
    graph.selectAll(".bar").remove();
    graph.selectAll(".axis").remove();
    d3.select(".bio").selectAll("div, h2").remove();
  
    // Define margin and dimensions for the SVG
    const margin = { top: 20, right: 30, bottom: 30, left: 60 };
    const svg_width = width * 0.8;
    const svg_height = 120 - margin.top;
  
    // Define subgroups (medal types)
    const subgroups = ['gold', 'silver', 'bronze'];
  
    // Define groups (game years and cities)
    const groups = d3.map(medalsData, function (d) { return (d.gameYear + " : " + d.city) }).keys();
  
    // Add X axis
    const x = d3.scaleBand()
      .domain(groups)
      .range([0, svg_width]);
  
    const xAxis = graph.append("g")
      .attr("transform", "translate(0," + svg_height * 0.55 + ")")
      .attr("stroke-width", 3)
      // .attr("stroke", "red")
      .attr("class", "axis")
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .transition()
        .duration(250)
  
    // Customize tick labels
    const fontSize = Math.min(Math.max(x.bandwidth() / 20, 10), 16);

    xAxis.selectAll("text")
      .attr("y", -mapRange(fontSize))
      .style("font-size", function (d) {
        return fontSize + "px";
      });
  
    // Add Y axis
    const maxY = 2;
    const y = d3.scaleLinear()
      .domain([0, maxY])
      .range([0, svg_height]);
  
    // Y axis for dots
    const maxYDots = 18;
    const yDots = d3.scaleLinear()
      .domain([0, maxYDots])
      .range([2.6 * svg_height / 4, svg_height + 2.6 * svg_height / 4]);
  
    graph.append("g")
      .attr("class", "axis")
      .style("display", "none")
      .call(d3.axisLeft(y));
  
    // Another scale for subgroup position
    const xSubgroup = d3.scaleBand()
      .domain(subgroups)
      .range([x.bandwidth() / 4, 3 * x.bandwidth() / 4])
      .padding(0.1);
  
    // Define color palette
    const color = d3.scaleOrdinal()
      .domain(subgroups)
      .range(['#FFD700', '#C0C0C0', '#CD7F32']);
  
    // Show the bars
    const bar = graph.append("g")
      .attr("class", "bar")
      .attr("transform", function (d) {
        return "translate(" + (xSubgroup.bandwidth() / 2) + ",0)";
      })
      .selectAll("g")
      .data(medalsData, d => d.gameYear)
      .join("g")
      .attr("transform", function (d) { return "translate(" + x(d.gameYear + ' : ' + d.city) + ",0)"; })
      .selectAll("rect")
      .data(function (d) { return subgroups.map(function (key) { return { key: key, value: d[key] }; }); }, d => d.key);
  
    bar.join(
      enter => enter.append('rect')
        .attr("x", function (d) { return xSubgroup(-d.key); })
        .call(enter => enter.transition(3000)
          .attr("x", function (d) { return xSubgroup(d.key); }))
    )
      .attr("y", function (d) { return y(0.5); })
      .attr("width", xSubgroup.bandwidth())
      .attr("height", y(1) / 2)
      .attr("fill", function (d) { return color(d.key); })
      .attr("rx", 3)
      .attr("ry", 3)
      .attr("transform", "translate(" + (-xSubgroup.bandwidth() / 2) + ",0)");
  
    // Show the text labels on the bars
    bar.join(
      enter => enter.append('text')
        .attr("x", function (d) { return xSubgroup(-d.key); })
        .call(enter => enter.transition(3000)
          .attr("x", function (d) { return xSubgroup(d.key); }))
    )
      .text(function (d) { return d.value; })
      .attr("y", function (d) { return y(0.5 + 0.25); })
      .attr("text-anchor", "middle")
      .style("font-family", "Poppins")
      .style("font-weight", "bold")
      .style("font-size", "13px")
      .style("fill", "white")
      .attr("dominant-baseline", "middle");
      
    // Show the dots representing the medal count
    const dots_bar = graph.append("g")
      .attr("class", "bar")
      .attr("transform", function (d) {
        return "translate(" + (xSubgroup.bandwidth() / 2) + ",0)";
      })
      .selectAll("g")
      .data(medalsData, d => d.gameYear)
      .join("g")
      .attr("transform", function (d) { return "translate(" + x(d.gameYear + ' : ' + d.city) + ",0)"; })
      .selectAll("rect")
      .data(function (d) { return subgroups.map(function (key) { return { key: key, value: d[key] }; }); })
      .join("g")
      .each(function (medalType) {
        d3.select(this)
          .selectAll('circle')
          .data(d3.range(medalType.value), d => d)
          .join(
            enter =>
              enter.append('circle')
                .attr("cx", function (d, i) {
                  let xCorrd;
                  if (medalType.value > 18) {
                    const bandwidth = xSubgroup.bandwidth();
                    xCorrd = i < 18 ? xSubgroup(medalType.key) - bandwidth / 4 : xSubgroup(medalType.key) + bandwidth / 4;
                    if (medalType.value > 36) {
                      xCorrd = i < 18 ? xSubgroup(medalType.key) - bandwidth / 4 : i < 36 ? xSubgroup(medalType.key) : xSubgroup(medalType.key) + bandwidth / 4;
                    }
                  } else {
                    xCorrd = xSubgroup(medalType.key);
                  }
                  return xCorrd;
                })
                .attr("cy", 100)
                .attr("r", function (d, i) {
                  let radius;
                  if (medalType.value > 36) {
                    radius = 1.8;
                  } else {
                    radius = 2.1;
                  }
                  return radius;
                })
                .style("fill", function (d) { return color(medalType.key) })
                .call(enter => enter.transition(3000)
                  .attr("cy", function (d, i) { return yDots(i % 18); })),
            update => update.style("fill","red"),
            exit => exit.remove()
          );
      });
  }
  
  
  /**
   * Function to build an athlete's bio from their ID.
   * 
   * @param {string} athleteId - The ID of the athlete.
   * @param {Object} athleteData - The data containing information about the athletes.
   * @param {Array} athleteBioData - An array of athlete bio data.
   * @returns {Object} An object containing the athlete's bio data, including their sport type.
   */
  export function buildAthletBioFromId(athleteId, athleteData, athleteBioData){
    // Create a lookup object from the athleteBioData array
    // This will allow us to quickly find an athlete's bio data by their ID
    let bioLookup = {};
    athleteBioData.forEach(bio => {
      bioLookup[bio['athlete_id']] = bio;
    });
  
    // Convert the athleteId to a string, as the keys in our lookup object are strings
    const athleteIdStr = athleteId.toString();
  
    // Get the athlete's bio data from the lookup object
    const athleteBio = bioLookup[athleteIdStr];
  
    // Get the athlete's sport type from the athleteData object
    const athleteSport = athleteData[athleteIdStr]['sport_type'];
  
    // Add the sport type to the athlete's bio data
    athleteBio['sport_type'] = athleteSport;
  
    // Return the athlete's bio data
    return athleteBio;
  }
  
  /**
   * Function to display an athlete's or a country's bio.
   * 
   * @param {Object|string} bio - The bio data of the athlete or the name of the country.
   * @param {boolean} isCountry - A flag indicating whether the bio is for a country or an athlete.
   */
  export function displayBio(bio, isCountry = false){
    // Select the div with class 'bio'
    const bioDiv = d3.select(".bio");
  
    // Remove all divs within the bioDiv
    bioDiv.selectAll("div").remove();
  
    // If the bio is for a country, display the country name
    if (isCountry){
      bioDiv.html(`
      <div class = 'bioInformation'> <span style="font-weight: bold; text-decoration: underline;"> Country Name:</span> ${bio} </div>`);
    } else {
      // If the bio is for an athlete, display the athlete's information
      bioDiv.html(`
      <h2> Athlete Information </h2>
      <div class = 'bioInformation'> <span style="font-weight: bold; text-decoration: underline;"> Name :</span> ${bio.name}</div>
      <div class = 'bioInformation'><span style="font-weight: bold; text-decoration: underline;"> Sports :</span> ${bio.sport_type}</div>
      <div class = 'bioInformation'> <span style="font-weight: bold; text-decoration: underline;"> Date of Birth :</span> ${bio.born}</div>
      <div class = 'bioInformation'> <span style="font-weight: bold; text-decoration: underline;"> Country :</span> ${bio.country}</div>
      <div class = 'bioInformation'> <span style="font-weight: bold; text-decoration: underline;"> Sex :</span> ${bio.sex}</div>
      <div style="font-weight: bold; text-decoration: underline; "> Description :</div> <div class = 'bioDescription'>${bio.description}</div>`);
    }
  }
  
  
  /**
   * Function to get the country code from the country map name.
   * 
   * @param {string} countryMapName - The name of the country on the map.
   * @param {Array} olympicsCountryData - The data containing information about the countries in the Olympics.
   * @param {boolean} isOlympicCode - A flag indicating whether to return the Olympic code or the international code.
   * @returns {string|Array} The international code or the Olympic code(s) of the country.
   */
  export function getCountryCodeFromCountryMapName(countryMapName, olympicsCountryData, isOlympicCode = false){
    // If the country map name is "Greenland", change it to "Denmark"
    if (countryMapName === "Greenland"){
      countryMapName = "Denmark";
    }
  
    // Find the country in the olympicsCountryData array that matches the country map name
    // and get its international code
    let inter_code = olympicsCountryData.filter(d => d['map_name'] === countryMapName)[0]['inter_code'];  
  
    // If the isOlympicCode flag is false, return the international code
    if (!isOlympicCode){
      return inter_code;
    } else {
      // If the isOlympicCode flag is true, find all countries in the olympicsCountryData array
      // that match the international code and get their Olympic codes
      const country_noc_list = olympicsCountryData.filter(d => d['inter_code'] === inter_code).map(d => d['country_noc']);
      return country_noc_list;
    }
  }
  
  
  /**
   * Function to update the display of selected athletes.
   * 
   * @param {Array} listOfAthletesToDisplay - The list of athletes to display.
   * @param {Object} jsonData - The data containing information about the athletes.
   */
  export function updateSelectedAthletes(listOfAthletesToDisplay, jsonData) {
    // Select the div with class 'selectedAthletes' and bind the data
    let athletes = d3.select(".selectedAthletes")
      .selectAll("div")
      .data(listOfAthletesToDisplay);
  
    // Join the data with the div elements
    athletes.join("div")
      .attr("class", "athlete")
      .on("click", function(d) {
        // On click, remove the athlete from the list and update the display
        listOfAthletesToDisplay.splice(listOfAthletesToDisplay.indexOf(d), 1);
        updateSelectedAthletes(listOfAthletesToDisplay, jsonData);
      })
      .text(function(d) { 
        // Display the athlete's info
        return getAthleteInfoFromId(d, jsonData); 
      });
  }
  
  /**
   * Function to find the year closest to a given year from a list of years.
   * 
   * @param {number} year - The year to compare to.
   * @param {Array} allYears - The list of years to compare with.
   * @returns {number} The year from allYears that is closest to the given year.
   */
  export function closestYear(year, allYears){
    return allYears.reduce(function(prev, curr) {
      // Compare the difference between the current year and the given year
      // with the difference between the previous closest year and the given year
      // Return the year with the smallest difference
      return (Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev);
    });
  }
  