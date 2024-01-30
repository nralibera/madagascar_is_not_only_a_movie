import { howBig } from "./howBig.js";
import { drawCartogram } from "./cartogram.js";

// The svg
export const width = window.innerWidth*0.95;
export const height = window.innerHeight*0.95;

export const svg = d3.select("#my_dataviz")
            .attr("width", width)
            .attr("height", height);

// Map and projection
export const projection = d3.geoMercator()
    .center([47.448,-21.397180])        
    .scale(4000)                      
    .translate([ width/2, height/1.5 ])


export const path = d3.geoPath().projection(projection);

// Zoom
svg.call(d3.zoom().on('zoom',()=>{
    d3.select(".all_countries").attr("transform", d3.event.transform);
    d3.select(".all_regions").attr("transform", d3.event.transform);
    }));

export function drawRegion(regionData){
    // console.log(regionData)
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
    d3.csv("./Data/Olympics_Country.csv"),
    d3.json("./Data/Population/MDG_adm2_pop.json"),])

    .then(function([world, adm_2,all_country_coordinate,populationData]){

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
        // drawCartogram(countries,adm_2,populationData);
})

