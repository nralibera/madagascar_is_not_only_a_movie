// The svg
var width = window.innerWidth*0.95;
var height = window.innerHeight*0.95;

var svg = d3.select("#my_dataviz")
            .attr("width", width)
            .attr("height", height);

// Map and projection
const projection = d3.geoMercator()
    .center([47.448,-21.397180])                // GPS of location to zoom on
    .scale(1500)                       // This is like the zoom
    .translate([ width/2, height/1.5 ])

// let movable_svg = d3.select("#movable_svg_2")
//                     .call(drag);

const path = d3.geoPath().projection(projection);

// Zoom
svg.call(d3.zoom().on('zoom',()=>{
    d3.select(".all_countries").attr("transform", d3.event.transform);
    }));

function drawSecondCountries(mapName,countriesPath,countryData){
    
    const country = countryData.filter(function(d){ return d.map_name==mapName})[0]
    const features = countriesPath.features.filter(function(d){ return d.properties.name==mapName})
    console.log(features)
    // console.log(mapName)
    
    const projection2 = d3.geoMercator()
    .center([country.long, country.lat])                 // GPS of location to zoom on
    .scale(1500)                       // This is like the zoom
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
    .on('drag', function () {
        // Calculate the distance moved by the mouse
        const dx = d3.event.x - d3.select(this).attr('initial-x');
        const dy = d3.event.y - d3.select(this).attr('initial-y');

        // Update the position of the dragged element during dragging
        d3.select(this).attr('transform', `translate(${dx},${dy})`);
    })
    .on('end', function () {
        // Remove the 'active' class when dragging ends
        d3.select(this).classed('active', false);
    });
    
    
    // console.log(second_countries.features)
    d3.select(".all_countries")
        .selectAll(".second_country")
        .data(features, function(d){return d.properties.name})
        .join(
        enter => enter.append("path")
        .attr("class", "second_country")
          .attr("fill", "blue")
          .attr("d", path2)
          .style("stroke", "none")
          .call(drag),
        update => update,
        exit => exit.remove()
          )
}


// Load external data and boot
Promise.all([
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-10m.json'),
    d3.json("./Data/MDG_adm2.topo.json"),
    d3.csv("./Data/Olympics_Country.csv")])

    .then(function([world, adm_2,all_country_coordinate]){

        // Filter data
        // data.features = data.features.filter(function(d){console.log(d.properties.name) ; return d.properties.name=="France"})
        let countries = topojson.feature(world, world.objects.countries);
        let second_countries = topojson.feature(world, world.objects.countries);
        let states = topojson.feature(adm_2, adm_2.objects.states);
        
        
        countries.features = countries.features.filter(function(d){ return d.properties.name=="Madagascar"})
        // Filter all_country_coordinate to only those with map_name
        all_country_coordinate = all_country_coordinate.filter(function(d){ return d.map_name!=""})
        // Draw the map
        svg.append("g")
            .attr("class", "all_countries")
            .selectAll(".country")
            .data(countries.features)
            .enter()
            .append("path")
            .attr("class", "country")
              .attr("fill", "red")
              .attr("d", path)
              .style("stroke", "none")
                                    
 

                    // Create a dropdown input
            const dropdown = d3.select("body")
            .append("select")
            .attr("id", "countrySelect")
            .style("position", "absolute")
            .style("top", "10px")
            .style("left", "10px")
            .style("z-index", "1000")
            .style('width', '200px')
            .on("change", function() {
                const map_name = d3.select(this).property("value");
                // Remove the previous svg
                // d3.select(".second_country").remove();
                drawSecondCountries(map_name,second_countries,all_country_coordinate);
            });

            // Add the country names as options
            dropdown.selectAll("option")
            .data(all_country_coordinate)
            .enter()
            .append("option")
            .text(d => d.map_name)  // Display the country name
            .attr("value", d => d.map_name);  // Use the ISO code as the value
})


// second_countries.features = second_countries.features.filter(function(d){ return d.properties.name=="France"})


// // console.log(second_countries.features)
// svg.append("g")
//     .attr("id", "movable_svg_2")
//     .selectAll(".second_country")
//     .data(second_countries.features)
//     .enter()
//     .append("path")
//     .attr("class", "second_country")
//       .attr("fill", "blue")
//       .attr("d", path2)
//       .style("stroke", "none")
//       .call(drag); 


// svg.append("g")
//     .selectAll(".region") 
//     .data(states.features)
//     .enter()
//     .append("path")
//     .attr("class", "region")
//     .attr("fill", "red")
//     .attr("d", path)
//     .style("stroke", "green")
//     .on("mouseover", function(event, d) {
//         // console.log(event)
//         d3.select(this).style("stroke", "blue")
//                 .attr("fill", "blue")
        
//     })