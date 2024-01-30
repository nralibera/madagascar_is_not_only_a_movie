import { width, height, svg, path, projection, drawRegion } from './app.js';
// import {cartogram} from './cartogram.js';


const regionGroup = d3.select("svg").append('g').attr("class", "all_regions");
// generate 22 random colors
const randomColorList = [...Array(22)].map(() => '#'+(Math.random()*0xFFFFFF<<0).toString(16).padStart(6, '0'));


let scale;

export function drawCartogram(countries,regions,populationData){

    let cartogram = topogram.cartogram()
                    .projection(projection)
                    .properties(function(d) {
                        // console.log(d);
                        return d.properties;
                    })
                    .value((d) => {  
        // console.log(scale(+populationData.data.filter(e=>e.ADM1_EN==d.properties.NAME_2)[0].P_2018est));
        // This function should return the value for each feature
        return scale(+populationData.data.filter(e=>e.ADM1_EN==d.properties.NAME_2)[0].P_2018est);}); 

    const scaleColor = d3.scaleOrdinal()
        .domain(regions.objects.states.geometries.map(d=>d.properties.NAME_2))
        .range(randomColorList);
   
    
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

    // Scale vale of popAtYear to a range of 1-1000
    scale = d3.scaleLinear()
                    .domain([lowValue, highValue])
                    .range([5, 90]);

    // add year select and update cartogram
    const yearList = [...Array(10)].map((_,i)=>2009+i);

    const select = d3.select(".dataviz")
        .append("select")
        .attr("class","yearSelect")
        .attr("value",yearList[0])
        .on("change",function(){
            // console.log("change")
            update(cartogram,regions,populationData,scaleColor);
        });

    select.selectAll("option")
        .data(yearList)
        .enter()
        .append("option")
        .attr("value",d=>d)
        
        .text(d=>d)
    
    update(cartogram,regions,populationData,scaleColor);

    // d3.select("svg")
    //     .append("select")
    //     .attr("class","yearSelect")

    //     .on("change",function(){
    //     });
    

    // console.log(features)
    
    // regionGroup.selectAll(".regions")
    //     .data(features)
    //     .enter()
    //     .append("path")
    //     .attr("d", cartogram.path)
    //     .attr("class", "regions")
    //     .attr("fill", "#FA6900");
}
  
function init(cartogram,regions,scaleColor){

    const features = cartogram.features(regions, regions.objects.states.geometries);
    // console.log(features)
    regionGroup
    .selectAll(".regions")
    .data(features)
          .enter()
          .append("path")
            .attr("class", "regions")
            .attr("fill", d=>scaleColor(d.properties.NAME_2))
            .attr("d", path);
}

function update(cartogram,regions,populationData,scaleColor){
    console.log("update")
    const year = d3.select(".yearSelect").property("value");

    // // get all pop of 2018 from populationData in the field P_2018est as a list
    const yearString = year == 2009 ? "P_"+year :"P_"+year+"est";
    // const popAtYear = populationData.data.map(d=>d[yearString]).sort(d3.ascending);
    // // console.log(popAtYear)
    // const lowValue = popAtYear[0];
    // const highValue = popAtYear[popAtYear.length-1];

    // console.log(yearString,popAtYear);
    // console.log(lowValue,highValue)

    // // Scale vale of popAtYear to a range of 1-1000
    // const scale = d3.scaleLinear()
    //                 .domain([lowValue, highValue])
    //                 .range([1, 1000]);

    
    // Update value of cartogram
    cartogram.value((d) => {  
        const pop = +populationData.data.filter(e => e.ADM1_EN == d.properties.NAME_2)[0][yearString];
        console.log(d.properties.NAME_2,pop,scale(pop))
        return scale(pop);
    });

    
    // generate the new features, pre-projected
    const features = cartogram(regions, regions.objects.states.geometries).features;

    // update the data
    regionGroup
        .selectAll(".regions")
        .data(features)
        .join("path")
        .attr("class", "regions")
            .transition()
            .duration(750)
            .ease(d3.easeLinear)
            .attr("fill", d=>scaleColor(d.properties.NAME_2))
            .attr("d", cartogram.path);
}