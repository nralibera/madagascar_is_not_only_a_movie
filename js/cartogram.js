import {width, height, path, projection, drawRegion } from './app.js';

// // The svg
// const width = window.innerWidth*0.95;
// const height = window.innerHeight*0.95;

let scale;

export function drawCartogram(countries,regionsTopo,populationData){
    const stackedPopulationData = buildStackedData(populationData);
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


    // add year select and updateMap cartogram
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
            updateMap(regions, populationData, colorScale, scaleLinear);
        });
    
    const tickmarks = slider.append("datalist").attr("id", "tickmarks");
    tickmarks.selectAll("option")
        .data(yearList)
        .join("option")
        .attr("value", d=>d)
        .text(d=>d);

    updateMap(regions,populationData,colorScale,scaleLinear);
    // updateBarChart("a",regions,stackedPopulationData);
    
    const divForBarChart = d3.select(".map")
                            .append("div")
                            .attr("class","popUpBarChart")
                            .style("width", "100%")
                            .style("height", "100%")
                            .style("position","absolute")
                            .style("top",0)
                            .style("left",0)
                            .style("z-index",1000)
                            .style("background-color","rgb(2, 0, 22)")
                            .style("display","none");

    // Add button to show bar chart
    d3.select(".mapOptions").append("button")
    .text("Global population")
    .on("click", function(){
        d3.select(".popUpBarChart").style("display","flex");
        updateBarChart(regions,stackedPopulationData);
    });
    // Add button to close bar chart
    d3.select('.popUpBarChart').append("button")
    .text("Close Bar Chart")
    .on("click", function(){
        d3.select(".popUpBarChart").style("display","none");
    });

}

function updateMap(regions,populationData,colorScale,scaleLinear){
    const year = d3.select(".yearSelect").property("value");

    // // get all pop of 2018 from populationData in the field P_2018est as a list
    const yearString = year == 2009 ? "P_"+year :"P_"+year+"est";

    // updateMap the data
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

function buildStackedData(populationData){
    const data = [];
    const yearList = [...Array(10)].map((_,i)=>2009+i);
    const regions = populationData.data.map(d=>d.ADM1_EN);
    for (let i = 0; i < yearList.length; i++) {
        const yearString = yearList[i] == 2009 ? "P_"+yearList[i] :"P_"+yearList[i]+"est";
        const popAtYearGroupByRegion = {};
        popAtYearGroupByRegion.group = yearList[i];
        regions.forEach(region => {
            popAtYearGroupByRegion[region] = +populationData.data.filter(e=>e.ADM1_EN==region)[0][yearString];
        });
        data.push(popAtYearGroupByRegion);
    }
    return data;
}

function updateBarChart(regions,populationData){

    // / set the dimensions and margins of the graph
    const margin = {top: 10, right: 50, bottom: 20, left: 50},
    widthWithMargin = width*0.7 - margin.left - margin.right,
    heightWithMargin = height*0.5 - margin.top - margin.bottom;

    // If svg exist use it else create it
    let svg = d3.select(".popUpBarChart").select(".barChart g");

    if (svg.empty()){
        svg = d3.select(".popUpBarChart")
                .append("svg")
                .attr("class","barChart")            
                .attr("width", widthWithMargin + margin.left + margin.right)
                .attr("height", heightWithMargin + margin.top + margin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");
    }

    svg.selectAll(".axis, .bar").remove(); // remove the axis if it exist
    // console.log(d3.select(".barChart"));


    // List of subgroups = header of the csv files = soil condition here
    const subgroups = regions.features.map(d=>d.properties.NAME_2);

    // List of groups = species here = value of the first column called group -> I show them on the X axis
    const groups = [...Array(10)].map((_,i)=>2009+i);

    // Add X axis
    const x = d3.scaleBand()
        .domain(groups)
        .range([0, widthWithMargin])
        .padding([0.2]);

    svg.append("g")
    .attr("class","axis")
    .attr("transform", "translate(0," + heightWithMargin + ")")
    .call(d3.axisBottom(x).tickSizeOuter(0));

    const sumOfPopIn2018 = Object.values(populationData[populationData.length-1]).reduce((a, b) => a + b, 0) - 2018;
    
    // Add Y axis
    const y = d3.scaleLinear()
                .domain([0, sumOfPopIn2018])
                .range([ heightWithMargin, 0 ]);

    
    svg.append("g")
        .attr("class","axis")
        .call(d3.axisLeft(y).tickFormat(d3.format(".2s")));

    // color palette = one color per subgroup
    const randomColorList = [...Array(22)].map(() => '#'+(Math.random()*0xFFFFFF<<0).toString(16).padStart(6, '0'));
    const color = d3.scaleOrdinal()
                    .domain(subgroups)
                    .range(randomColorList)

    //stack the data? --> stack per subgroup
    const stackedData = d3.stack()
                    .keys(subgroups)
                    (populationData)

                    
    // Show the bars
    svg.append("g")
        .selectAll("g")
        // Enter in the stack data = loop key per key = group per group
        .data(stackedData, function(d) { return d.key; })
        .join("g")
            .attr("fill", function(d) { return color(d.key); })
            .selectAll("rect")
            // enter a second time = loop subgroup per subgroup to add all rectangles
            .data(function(d) { return d; }, function(d) { return d.data.group + ':' + (d[1]-d[0]); })
            .join("rect")
            .attr("x", function(d) { return x(d.data.group); })
            .attr("y", function(d) { return y(0); }) // Start at the bottom
            .attr("height", 0) // Start with a height of 0
            .attr("width",x.bandwidth())
            .attr("class","bar")
            .on("mouseover", function(event, d) {
                showTooltipBarChart(event,d);
            })
            .on("mouseout", function(event, d) {
                d3.select(".tooltip").remove();
            });
            
            
            
        d3.selectAll(".bar")
            .transition()
            .duration(800)
            .attr("y", function(d) { return y(d[1]); })
            .attr("height", function(d) { return y(d[0]) - y(d[1]); })

}

function showTooltipBarChart(event){
    
    const tooltip = d3.select(".popUpBarChart")
                        .append("div")
                        .attr("class","tooltip");

    const pop = event[1]- event[0];

    // add space between number
    const popString = pop.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    // find the key where the value is equal to the pop
    const regionName = Object.keys(event.data).find(key => event.data[key] === pop);
    
    tooltip.text(regionName + " : " + popString)
            .style("left", (d3.event.pageX + 20) + "px")
            .style("top", (d3.event.pageY + 20) + "px");
}