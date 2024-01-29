// The svg
var width = window.innerWidth*0.95;
var height = window.innerHeight*0.95;

var svg = d3.select("#my_dataviz")
            .attr("width", width)
            .attr("height", height);

// Map and projection
const projection = d3.geoMercator()
    .center([47.448,-21.397180])        
    .scale(1500)                      
    .translate([ width/2, height/1.5 ])


const path = d3.geoPath().projection(projection);

// Zoom
svg.call(d3.zoom().on('zoom',()=>{
    d3.select(".all_countries").attr("transform", d3.event.transform);
    d3.select(".all_regions").attr("transform", d3.event.transform);
    }));


function drawSecondCountries(mapName,countryPathData,centerCoordinateData){
    let second_countries = topojson.feature(countryPathData, countryPathData.objects.countries);
    second_countries.features = second_countries.features.filter(function(d){ return d.properties.name==mapName});

    const averageCenter = centerCoordinateData.filter(function(d){ return d.map_name==mapName})[0];
    const projection2 = d3.geoMercator()
    .center([averageCenter.long, averageCenter.lat])                
    .scale(1500)
    .translate([ width/2, height/1.5 ])
    const path2 = d3.geoPath().projection(projection2);

    // Define the drag behavior using D3's drag() function
    const drag = d3.drag()
    .on('start', function () {
        // Bring the dragged element to the front
        d3.select(this).raise().classed('active', true);

        // Record the initial mouse position relative to the dragged element
        const [x, y] = d3.mouse(this);
        d3.select(this).attr('initial-x', x);
        d3.select(this).attr('initial-y', y);
        
    })
    .on('drag', function (d) {
        // Calculate the distance moved by the mouse
        const dx = d3.event.x - d3.select(this).attr('initial-x');
        const dy = d3.event.y - d3.select(this).attr('initial-y');

        // Update the position of the dragged element during dragging
        d3.select(this).attr('transform', `translate(${dx},${dy})`);

    })
    .on('end', function () {
        // Remove the 'active' class when dragging ends
        d3.select(this).classed('active', false);
        // drawSecondCountries(mapName,countriesPath,centerCoordinateData)
    });

    d3.select(".all_countries")
    .selectAll(".second_country")
        .data(second_countries.features, function(d){return d.properties.name})
        .join(
        enter => enter
        .append("path")
        .attr("class", "second_country")
          .attr("fill", "#FA6900")
        //   .attr('mask', 'url(#country-mask)')
          .attr("d", path2)
        //   .style("stroke", "none")
          .call(drag),
        update => update,
        exit => exit.remove()
          )
}

function howBig (countries,world,all_country_coordinate,regions){

    // Draw the map
    svg.append("g")
        .attr("class", "all_countries")
        .selectAll(".country")
        .data(countries.features)
        .join("path")
        .attr("class", "country")
          .attr("fill", "#00ccbc")
          .attr("d", path)
    
    drawRegion(regions);

    // Create a dropdown input
    const dropdown = d3.select("body")
    .append("select")
    .attr("id", "countrySelect")
    .on("change", function() {
        const map_name = d3.select(this).property("value");
        drawSecondCountries(map_name,world,all_country_coordinate);
    });

    // Add the country names as options
    dropdown.selectAll("option")
    .data(all_country_coordinate)
    .enter()
    .append("option")
    .text(d => d.map_name)  
    .attr("value", d => d.map_name);

    // Add a random button to trigger the drawSecondCountries function
    d3.select("body")
    .append("button")
    .attr("class", "randomButton")
    .text("Random Country")
    .on("click", function() {
        const randomIndex = Math.floor(Math.random() * all_country_coordinate.length);
        const map_name = all_country_coordinate[randomIndex].map_name;
        drawSecondCountries(map_name,world,all_country_coordinate);
        dropdown.property("value", map_name);
    });
}


function drawRegion(regionData){
    // How to load MDG REGIONS
    svg.append("g")
        .attr("class", "all_regions")
        .selectAll(".region") 
        .data(regionData.features)
        .join("path")
        .attr("class", "region")
        .attr("fill", "none")
        .attr("d", path)
        // .style("stroke", "green")
        // .on("mouseover", function(event, d) {
        //     // console.log(event)
        //     d3.select(this).style("stroke", "blue")
        //             .attr("fill", "blue")
            
        // })
}


// Load external data and boot
Promise.all([
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-10m.json'),
    d3.json("./Data/MDG_adm2.topo.json"),
    d3.csv("./Data/Olympics_Country.csv")])

    .then(function([world, adm_2,all_country_coordinate]){

        // Filter data
        let countries = topojson.feature(world, world.objects.countries);
        let regions = topojson.feature(adm_2, adm_2.objects.states); // For Madagascar Regions
        
        
        // Draw Madagascar
        countries.features = countries.features.filter(function(d){ return d.properties.name=="Madagascar"})

        // Filter all_country_coordinate to only those with map_name
        all_country_coordinate = all_country_coordinate.filter(function(d){ return d.map_name!=""})

        // sort all_country_coordinate by map_name
        all_country_coordinate.sort(function(a, b) {
            return a.map_name.localeCompare(b.map_name);
        });

        // Clean duplicate map_name
        all_country_coordinate = all_country_coordinate.filter(function(item, pos, ary) {
            return !pos || item.map_name != ary[pos - 1].map_name;
        });
        
        howBig(countries,world,all_country_coordinate,regions);
})

