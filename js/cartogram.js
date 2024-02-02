import {width, height, path, projection, drawRegion } from './app.js';

// // The svg
// const width = window.innerWidth*0.95;
// const height = window.innerHeight*0.95;

let scale;

export function drawCartogram(countries,regionsTopo,populationData){
    // console.log(regionsTopo)
        // Draw the map
    const svg = d3.select(".myDataviz");
    const regions = topojson.feature(regionsTopo, regionsTopo.objects.states);


    const regionGroup = svg.append('g').attr("class", "all_regions");

    const randomColorList = [...Array(22)].map(() => '#'+(Math.random()*0xFFFFFF<<0).toString(16).padStart(6, '0'));

    let cartogram = topogram.cartogram()
                    .projection(projection)
                    .properties(function(d) {
                        return d.properties;
                    })
                    .value((d) => {  
        // console.log(scale(+populationData.data.filter(e=>e.ADM1_EN==d.properties.NAME_2)[0].P_2018est));
        // This function should return the value for each feature
        return scale(+populationData.data.filter(e=>e.ADM1_EN==d.properties.NAME_2)[0].P_2018est);}); 

    // const scaleColor = d3.scaleOrdinal()
    //     .domain(regions.geometries.map(d=>d.properties.NAME_2))
    //     .range(randomColorList);

    const scaleColor = d3.scaleOrdinal();
   
    
    let lowValue = 0;
    let highValue = 0;
    // calculate the scale of population for all years
    for (let i = 2009; i < 2019; i++) {
        const yearString = i == 2009 ? "P_"+i :"P_"+i+"est";
        const popAtYear = populationData.data.map(d=>d[yearString]).sort(d3.ascending);
        // console.log(popAtYear)
        lowValue = popAtYear[0] < lowValue ? popAtYear[0] : lowValue;
        highValue = popAtYear[popAtYear.length-1] > highValue ? popAtYear[popAtYear.length-1] : highValue;
        // console.log(lowValue,highValue)
    }
    const ceiledHighValue = Math.ceil(highValue/1000000)*1000000;
    const  flooredLowValue = Math.floor(lowValue/1000000)*1000000;

    const scaleLinear = d3.scaleLinear().domain([flooredLowValue, ceiledHighValue]).range([0, 1]);
    const colorScale = d3.scaleSequential(d3.interpolateOranges);

        // Define the legend
    const legend = d3.select(".myDataviz").append("svg")
                    .attr("class", "legend")
                    .attr("width", width)
                    .attr("height", 50);

    // Define the number of legend items
    const numLegendItems = 10;
    const widthCenteringFactor = 0.5;
    const margin = {top: 10, right: 10, bottom: 10, left: 0};
    // Create an array of values for the legend items
    const legendValues = d3.range(flooredLowValue, ceiledHighValue, (ceiledHighValue - flooredLowValue) / numLegendItems);

    // Create the legend items
    const legendItem = legend.selectAll(".legendItem")
                                .data(legendValues)
                                .join("g")
                                .attr("class","legendItem")
                                .attr("transform", (d, i) => `translate(${i *widthCenteringFactor * width/numLegendItems + width*0.25}, 0)`);

    // Add a colored rectangle to each legend item
    legendItem.append("rect")
    .attr("width", width*widthCenteringFactor/numLegendItems - margin.left)
    .attr("height", 20)
    .attr("fill", d => colorScale(scaleLinear(d)));

    // Add a text label to each legend item
    legendItem.append("text")
    .attr("x", (width*widthCenteringFactor/numLegendItems-margin.left)/2)
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .style("font-size", "0.7rem")
    .style("font-weight", "bold")
    .style("fill", "rgb(2, 0, 22)")
    .text(d => d/1000000)
    .attr('fill', 'black'); 


    // add year select and update cartogram
    const yearList = [...Array(10)].map((_,i)=>2009+i);


    const slider = d3.select(".mapOptions").append("div").attr("class","slider");


    slider.append("input")
        .attr("type", "range")
        .attr("min", yearList[0]) // Assuming yearList is sorted
        .attr("max", yearList[yearList.length - 1])
        .attr("value", yearList[0])
        .attr("list", "tickmarks")
        .attr("class", "yearSelect")
        .on("input", function() {
            update(regions, populationData, colorScale, scaleLinear);
        });
    
    const tickmarks = slider.append("datalist").attr("id", "tickmarks");
    tickmarks.selectAll("option")
        .data(yearList)
        .join("option")
        .attr("value", d=>d)
        .text(d=>d);

    update(regions,populationData,colorScale,scaleLinear);
}
  
function init(cartogram,regions,scaleColor,scaleLinear){

    const features = cartogram.features(regions, regions.objects.states.geometries);
    // console.log(features)
    const regionGroup = d3.select(".all_regions");
    regionGroup.selectAll(".regions")
    .data(features)
          .enter()
          .append("path")
            .attr("class", "regions")
            .attr("fill", d=>scaleColor(d.properties.NAME_2))
            .attr("d", path);
}

function update(regions,populationData,colorScale,scaleLinear){
    const year = d3.select(".yearSelect").property("value");

    // // get all pop of 2018 from populationData in the field P_2018est as a list
    const yearString = year == 2009 ? "P_"+year :"P_"+year+"est";

    // update the data
    d3.select(".all_regions")
        .selectAll(".regions")
        .data(regions.features, function(d){return d.properties.ID_2})
        .join("path")
        .on("mouseover", function(event, d) {
            showTooltip(event,populationData,yearString);
        })
        .on("mouseout", function(event, d) {
            d3.select(".tooltip").remove();
        })
        .attr("class", "regions")
            .transition()
            .duration(750)
            .ease(d3.easeLinear)
            .attr("fill", (d)=>{
                let pop = +populationData.data.filter(e => e.ADM1_EN == d.properties.NAME_2)[0][yearString];
                pop = scaleLinear(pop);
                return colorScale(pop);
            })
            .attr("d", path)

}

function showTooltip(event, populationData,yearString){
    // console.log(event);
    const tooltip = d3.select(".map")
                        .append("div")
                        .attr("class","tooltip");

    const pop = +populationData.data.filter(e => e.ADM1_EN == event.properties.NAME_2)[0][yearString];

    // add space between number
    const popString = pop.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    tooltip.text(event.properties.NAME_2+" : "+popString)
            .style("left", (d3.event.pageX + 20) + "px")
            .style("top", (d3.event.pageY + 20) + "px");
}