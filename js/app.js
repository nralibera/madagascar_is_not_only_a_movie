import { howBig } from "./howBig.js";
import { drawPopulationMap } from "./cartogram.js";

// The svg
export const width = window.innerWidth;
export const height = window.innerHeight;

const mapOptions = d3.select(".mapOptions");

export const svg = d3.select(".map")
                        .append("svg")
                        .attr("class","myDataviz")
                        .attr("width", width)
                        .attr("height", height);
// Map Options
export const mapScale = 1800;
export const mapTranslate = [ width/2, height/2.1 ];

// Map and projection
export const projection = d3.geoOrthographic()
    .rotate([-47.448,21.397180]) // Center on Madagascar
    .scale(mapScale)                      
    .translate(mapTranslate)


export const path = d3.geoPath().projection(projection);

// Manage Map zoom
svg.call(d3.zoom().on('zoom',()=>{
    d3.select(".all_countries").attr("transform", d3.event.transform);
    d3.select(".all_regions").attr("transform", d3.event.transform);
    d3.select(".all_towns").attr("transform", d3.event.transform);
    }));


/**
 * This function is used to draw regions on a map.
 * It takes GeoJSON data as input and appends SVG path elements to represent each region.
 *
 * @param {Object} regionData - The GeoJSON data representing the regions.
 */
export function drawRegion(regionData){
    // Append a new 'g' SVG group element with the class 'all_regions'
    svg.append("g")
        .attr("class", "all_regions")
        // Select all elements with the class 'region'
        .selectAll(".region") 
        // Bind the GeoJSON data to the selected elements
        .data(regionData.features)
        // For each datum, append a new 'path' SVG element
        .join("path")
        // Add the class 'region' to each new path
        .attr("class", "region")
        // Set the fill color of each path to 'none'
        .attr("fill", "none")
        // Set the 'd' attribute of each path to represent the datum's geometry
        .attr("d", path)
}

/**
 * This function is used to draw main towns on a map.
 * It takes GeoJSON data for regions and towns as input and appends SVG elements to represent each town.
 *
 * @param {Object} regions - The GeoJSON data representing the regions.
 * @param {Object} townData - The GeoJSON data representing the towns.
 */
export function drawMainTowns(regions, townData){
    // Get all name_1 in regions
    const mainTowns = regions.features.map(d => d.properties.NAME_1.toLowerCase());
    // Remove duplicates
    const uniqueMainTowns = [...new Set(mainTowns)];

    const townDataCopy = townData;
    // Filter features only on town in townList
    townDataCopy.features = townDataCopy.features.filter((d) => {
        const townName = d.properties.PPPTNAME;
        if (townName){
            return uniqueMainTowns.includes(townName.toLowerCase());
        }
    });

    // Draw town points
    svg.append('g')
       .attr('class', "all_towns")
       .selectAll('.townPoint')
       .data(townDataCopy.features)
       .join('circle')
       .attr('class', 'townPoint')
       .attr('r', 3)
       .attr('fill', '#FF5733')
       .attr("transform", function(d) {
            return "translate(" + projection([
                d.geometry.coordinates[0],
                d.geometry.coordinates[1]
            ]) + ")";
        });

    // Add town names
    d3.select('.all_towns')
      .selectAll('.townName')
      .data(townDataCopy.features)
      .join('text')
      .attr("fill", "white")
      .attr("text-anchor", "middle")
      .attr("dy", "-.8em") 
      .style('font-size', ".7em")
      .text(function(d) {
            return d.properties.PPPTNAME;
        })
        .attr("transform", function(d) {
            return "translate(" + projection([
                d.geometry.coordinates[0],
                d.geometry.coordinates[1]
            ]) + ")";
        });   
}


/**
 * This function is used to clear the map visualization.
 * It removes all child elements of the selected elements.
 * Specifically, it targets elements with the classes ".mapOptions", ".map", and ".myDataviz".
 */
function clearMap() {
    // Remove all child elements of any element with the class ".mapOptions"
    d3.select(".mapOptions").selectAll("*").remove();

    // For each element with the class ".map", remove all child elements except the first one
    d3.selectAll(".map").each(function() {
        d3.select(this).selectAll("*:not(:first-child)").remove();
    });

    // Remove all child elements of any element with the class ".myDataviz"
    d3.select(".myDataviz").selectAll("*").remove();
}

// Load external data and boot
Promise.all([
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-10m.json'),
    d3.json("Data/mdg_geojson/MDG_adm2.topo.json"),
    d3.csv("Data/world_country.csv"),
    d3.json("Data/Population/MDG_adm2_pop.json"),
    d3.json("Data/mdg_geolocated_towns.geojson")])
    .then(function([world, adm_2,all_country_coordinate,populationData,townData]){

        // Filter data
        const countries = topojson.feature(world, world.objects.countries);
        const regions = topojson.feature(adm_2, adm_2.objects.states); // For Madagascar Regions
        
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
        
        const header = d3.select(".header");

        // Add button for each map on header
        // Button for How Big?
        header.append('div')
            .attr('class', 'button')
            .on('click', function(event, d) {
                clearMap();
                howBig(countries,world,all_country_coordinate,regions,townData);
            })
            .text('How Big?');

        // Button for Population
        header.append('div')
            .attr('class', 'button')
            .on('click', function(event, d) {
                clearMap();
                drawPopulationMap(adm_2,populationData);
            })
            .text('Population');

        // Choose the Default map here    
        // drawPopulationMap(adm_2,populationData);
        howBig(countries,world,all_country_coordinate,regions,townData);
        
})

