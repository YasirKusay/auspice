import { extent, groups, mean, deviation } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { scaleLinear } from "d3-scale";
import { select, event as d3event } from "d3-selection";
import { symbol, symbolDiamond } from "d3-shape";
import { orderBy } from "lodash";
import { measurementIdSymbol, measurementJitterSymbol } from "../../util/globals";
import { getBrighterColor } from "../../util/colorHelpers";

/* C O N S T A N T S */
export const layout = {
  yMin: 0,
  yMax: 100,
  leftPadding: 180,
  rightPadding: 30,
  topPadding: 20,
  bottomPadding: 50,
  subplotHeight: 100,
  subplotPadding: 10,
  circleRadius: 3,
  circleHoverRadius: 5,
  circleStrokeWidth: 1,
  thresholdStrokeWidth: 2,
  thresholdStroke: "#DDD",
  subplotFill: "#adb1b3",
  subplotFillOpacity: "0.15",
  diamondSize: 50,
  standardDeviationStroke: 3,
  overallMeanColor: "#000",
  yAxisTickSize: 6,
  yAxisColorByLineHeight: 9,
  yAxisColorByLineStrokeWidth: 4
};
// Display overall mean at the center of each subplot
layout['overallMeanYValue'] = layout.subplotHeight / 2;

const classes = {
  xAxis: "measurementXAxis",
  yAxis: "measurementYAxis",
  yAxisColorByLabel: "measurementYAxisColorByLabel",
  threshold: "measurementThreshold",
  subplot: "measurementSubplot",
  subplotBackground: "measurementSubplotBackground",
  rawMeasurements: "rawMeasurements",
  rawMeasurementsGroup: "rawMeasurementsGroup",
  overallMean: "measurementsOverallMean",
  colorMean: "measurementsColorMean",
  mean: "mean",
  standardDeviation: "standardDeviation"
};

export const svgContainerDOMId = "measurementsSVGContainer";
const getMeasurementDOMId = (measurement) => `meaurement_${measurement[measurementIdSymbol]}`;
const getSubplotDOMId = (groupingValueIndex) => `measurement_subplot_${groupingValueIndex}`;

/**
 * Creates the D3 linear scale for the x-axis with the provided measurements'
 * values as the domain and the panelWidth with hard-coded padding values as
 * the range. Expected to be shared across all subplots.
 * @param {number} panelWidth
 * @param {Array<Object>} measurements
 * @returns {function}
 */
export const createXScale = (panelWidth, measurements) => {
  return (
    scaleLinear()
      .domain(extent(measurements, (m) => m.value))
      .range([layout.leftPadding, panelWidth - layout.rightPadding])
      .nice()
  );
};

/**
 * Creates the D3 linear scale for the y-axis of each individual subplot with
 * the hardcoded yMin and yMax with circle diameter as the domain and the hard-coded
 * subplot height as the range.
 * @returns {function}
 */
export const createYScale = () => {
  // Account for circle diameter so the plotted circles do not get cut off
  const domainMin = layout.yMin - (2 * layout.circleRadius);
  const domainMax = layout.yMax + (2 * layout.circleRadius);
  return (
    scaleLinear()
      .domain([domainMin, domainMax])
      .range([layout.subplotHeight, 0])
      .nice()
  );
};

/**
 * Uses D3.groups() to aggregate measurements into a nested array of groups
 * The groups are sorted by the order of values in the provided groupByValueOrder.
 * @param {Array<Object>} measurements
 * @param {string} groupBy
 * @param {Array<string>} groupByValueOrder
 * @returns {Array<Array<string, Array>>}
 */
export const groupMeasurements = (measurements, groupBy, groupByValueOrder) => {
  return orderBy(
    groups(measurements, (d) => d[groupBy]),
    ([groupingValue]) => groupByValueOrder.indexOf(groupingValue),
    "asc");
};

export const clearMeasurementsSVG = (ref) => {
  select(ref)
    .attr("height", null)
    .selectAll("*").remove();
};

const drawMeanAndStandardDeviation = (values, d3ParentNode, containerClass, colorBy, xScale, yValue) => {
  const meanAndStandardDeviation = {
    colorByAttr: colorBy.attribute,
    mean: mean(values),
    standardDeviation: deviation(values)
  };
  // Container for both mean and standard deviation
  const container = d3ParentNode.append("g")
    .attr("class", containerClass)
    .attr("display", "none")
    .selectAll("meanAndStandardDeviation")
    .data([meanAndStandardDeviation])
    .enter();

  container.append("path")
    .attr("class", classes.mean)
    .attr("transform", (d) => `translate(${xScale(d.mean)}, ${yValue})`)
    .attr("d", symbol().type(symbolDiamond).size(layout.diamondSize))
    .attr("fill", colorBy.color);

  if (meanAndStandardDeviation.standardDeviation !== undefined) {
    container.append("line")
      .attr("class", classes.standardDeviation)
      .attr("x1", (d) => xScale(d.mean - d.standardDeviation))
      .attr("x2", (d) => xScale(d.mean + d.standardDeviation))
      .attr("y1", yValue)
      .attr("y2", yValue)
      .attr("stroke-width", layout.standardDeviationStroke)
      .attr("stroke", colorBy.color);
  }
};

export const drawMeasurementsSVG = (ref, svgData) => {
  const {xScale, yScale, x_axis_label, threshold, groupingOrderedValues, groupedMeasurements} = svgData;

  // Do not draw SVG if there are no measurements
  if (groupedMeasurements && groupedMeasurements.length === 0) return;

  const svg = select(ref);
  const svgWidth = svg.node().getBoundingClientRect().width;

  // The number of groups is the number of subplots, which determines the final SVG height
  const totalSubplotHeight = (layout.subplotHeight * groupedMeasurements.length);
  const svgHeight = totalSubplotHeight + layout.topPadding + layout.bottomPadding;
  svg.attr("height", svgHeight);

  // Add threshold if provided
  if (threshold !== null) {
    const thresholdXValue = xScale(threshold);
    svg.append("line")
      .attr("class", classes.threshold)
      .attr("x1", thresholdXValue)
      .attr("x2", thresholdXValue)
      .attr("y1", layout.topPadding)
      .attr("y2", svgHeight - layout.bottomPadding)
      .attr("stroke-width", layout.thresholdStrokeWidth)
      .attr("stroke", layout.thresholdStroke)
      // Hide threshold by default since another function will toggle display
      .attr("display", "none");
  }

  // Add x-axis to the bottom of the SVG
  // (above the bottomPadding to leave room for the x-axis label)
  svg.append("g")
    .attr("class", classes.xAxis)
    .attr("transform", `translate(0, ${svgHeight - layout.bottomPadding})`)
    .call(axisBottom(xScale))
    .call((g) => g.attr("font-family", null))
    .append("text")
      .attr("x", layout.leftPadding + ((svgWidth - layout.leftPadding - layout.rightPadding)) / 2)
      .attr("y", layout.bottomPadding * 2 / 3)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .text(x_axis_label);

  // Create a subplot for each grouping
  let prevSubplotBottom = layout.topPadding;
  groupedMeasurements.forEach(([groupingValue, measurements], index) => {
    // Make each subplot its own SVG to re-use the same subplot yScale
    const subplot = svg.append("svg")
      .attr("class", classes.subplot)
      .attr("id", getSubplotDOMId(groupingOrderedValues.indexOf(groupingValue)))
      .attr("width", "100%")
      .attr("height", layout.subplotHeight)
      .attr("y", prevSubplotBottom);

    // Add subplot height to keep track of y position for next subplot
    prevSubplotBottom += layout.subplotHeight;

    // Add a rect to fill the entire width with a light grey background for every other group
    subplot.append("rect")
      .attr("class", classes.subplotBackground)
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", "100%")
      .attr("width", "100%")
      .attr("fill", index % 2 ? layout.subplotFill : "none")
      .attr("fill-opacity", layout.subplotFillOpacity);

    // Add y axis with a single tick that displays the grouping value
    subplot.append("g")
      .attr("class", classes.yAxis)
      .attr("transform", `translate(${layout.leftPadding}, 0)`)
      .call(
        axisLeft(yScale)
          .tickValues([yScale((layout.yMax - layout.yMin) / 2)])
          .tickSize(layout.yAxisTickSize)
          .tickFormat(groupingValue))
      .call((g) => {
        g.attr("font-family", null);
        // If necessary, scale down the text to fit in the available space for the y-Axis labels
        // This does mean that if the text is extremely long, it can be unreadable.
        // We can improve on this by manually splitting the text into parts that can fit on multiple lines,
        // but there're always limits of the available space so punting that for now.
        //    -Jover, 20 September 2022
        g.selectAll('text')
          .attr("transform", (_, i, element) => {
            const textWidth = select(element[i]).node().getBoundingClientRect().width;
            // Subtract the twice the y-axis tick size to give some padding around the text
            const availableTextWidth = layout.leftPadding - (2 * layout.yAxisTickSize);
            if (textWidth > availableTextWidth) {
              return `scale(${availableTextWidth / textWidth})`;
            }
            return null;
          });
      });

    // Add circles for each measurement
    subplot.append("g")
      .attr("class", classes.rawMeasurementsGroup)
      .attr("display", "none")
      .selectAll("dot")
      .data(measurements)
      .enter()
      .append("circle")
        .attr("class", classes.rawMeasurements)
        .attr("id", (d) => getMeasurementDOMId(d))
        .attr("cx", (d) => xScale(d.value))
        .attr("cy", (d) => yScale(d[measurementJitterSymbol]))
        .attr("r", layout.circleRadius)
        .on("mouseover.radius", (d, i, elements) => {
          select(elements[i]).transition()
            .duration("100")
            .attr("r", layout.circleHoverRadius);
        })
        .on("mouseout.radius", (_, i, elements) => {
          select(elements[i]).transition()
            .duration("200")
            .attr("r", layout.circleRadius);
        });

    // Draw overall mean and standard deviation for measurement values
    drawMeanAndStandardDeviation(
      measurements.map((d) => d.value),
      subplot,
      classes.overallMean,
      {attribute: null, color: layout.overallMeanColor},
      xScale,
      layout.overallMeanYValue
    );
  });
};

export const colorMeasurementsSVG = (ref, treeStrainColors) => {
  const svg = select(ref);
  svg.selectAll(`.${classes.rawMeasurements}`)
    .style("stroke", (d) => treeStrainColors[d.strain].color)
    .style("stroke-width", layout.circleStrokeWidth)
    .style("fill", (d) => getBrighterColor(treeStrainColors[d.strain].color));
};

export const drawMeansForColorBy = (ref, svgData, treeStrainColors, legendValues) => {
  const { xScale, groupingOrderedValues, groupedMeasurements } = svgData;
  const svg = select(ref);
  // Remove all current color by means
  svg.selectAll(`.${classes.colorMean}`).remove();
  // Calc and draw color by means for each group
  groupedMeasurements.forEach(([groupingValue, measurements]) => {
    // For each color-by attribute, create an array of measurement values and keep track of color
    const colorByGroups = {};
    measurements.forEach((measurement) => {
      const { attribute, color } = treeStrainColors[measurement.strain];
      colorByGroups[attribute] = colorByGroups[attribute] || {color: null, values: []};
      colorByGroups[attribute].values.push(measurement.value);
      if (!colorByGroups[attribute].color) {
        colorByGroups[attribute].color = color;
      }
    });
    // Plot mean/SD for each color-by attribute within subplot
    const subplot = svg.select(`#${getSubplotDOMId(groupingOrderedValues.indexOf(groupingValue))}`);
    const numberOfColorByAttributes = Object.keys(colorByGroups).length;
    // Calc space between means to evenly spread them within subplot
    // 2 x subplotPadding for padding of top and bottom of each subplot
    // 2 x subplotPadding for padding around the overall mean display
    const ySpacing = (layout.subplotHeight - 4 * layout.subplotPadding) / (numberOfColorByAttributes - 1);
    let yValue = layout.subplotPadding;
    // Order the color groups by the legend value order so that we have a stable order for the means
    legendValues
      .filter((attribute) => String(attribute) in colorByGroups)
      .forEach((attribute) => {
        const {color, values} = colorByGroups[attribute];
        drawMeanAndStandardDeviation(
          values,
          subplot,
          classes.colorMean,
          {attribute, color},
          xScale,
          yValue
        );
        // Increase yValue for next attribute mean
        yValue += ySpacing;
        // If the next yValue is near the overall mean display,
        // shift to below the overall mean display + subplotPadding
        if (yValue > (layout.overallMeanYValue - layout.subplotPadding) &&
            yValue < (layout.overallMeanYValue + layout.subplotPadding)) {
          yValue = layout.overallMeanYValue + layout.subplotPadding;
        }
      });
  });
};

export const changeMeasurementsDisplay = (ref, display) => {
  const svg = select(ref);
  const dataDisplayClasses = {
    raw: classes.rawMeasurementsGroup,
    mean: classes.colorMean
  };
  Object.entries(dataDisplayClasses).forEach(([displayOption, displayClass]) => {
    svg.selectAll(`.${displayClass}`)
      .attr("display", display === displayOption ? null : "none");
  });
};

export const toggleDisplay = (ref, elementClass, displayOn) => {
  const displayAttr = displayOn ? null : "none";
  select(ref)
    .selectAll(`.${classes[elementClass]}`)
      .attr("display", displayAttr);
};

export const addHoverPanelToMeasurementsAndMeans = (ref, handleHover, treeStrainColors) => {
  const svg = select(ref);
  svg.selectAll(`.${classes.rawMeasurements},.${classes.mean},.${classes.standardDeviation}`)
    .on("mouseover.hoverPanel", (d, i, elements) => {
      // Get mouse position for HoverPanel
      const { clientX, clientY } = d3event;

      // Use class name to check data type
      const className = elements[i].getAttribute("class");
      const dataType = className === classes.rawMeasurements ? "measurement" : "mean";

      // For the means, the bound data includes the color-by attribute
      // For the measurements, we need to get the color-by attribute from treeStrainColors
      let colorByAttr = d.colorByAttr;
      if (dataType === "measurement") {
        colorByAttr = treeStrainColors[d.strain]?.attribute || "undefined";
      }

      // sets hover data state to trigger the hover panel display
      handleHover(d, dataType, clientX, clientY, colorByAttr);
    })
    .on("mouseout.hoverPanel", () => handleHover(null));
};

export const addColorByAttrToGroupingLabel = (ref, treeStrainColors) => {
  const svg = select(ref);
  // Remove all previous color-by labels for the y-axis
  svg.selectAll(`.${classes.yAxisColorByLabel}`).remove();
  // Loop through the y-axis labels to check if they have a corresponding color-by
  svg.selectAll(`.${classes.yAxis}`).select(".tick")
    .each((_, i, elements) => {
      const groupingLabel = select(elements[i]);
      const groupingValue = groupingLabel.text();
      const groupingValueColorBy = treeStrainColors[groupingValue];
      if (groupingValueColorBy) {
        // Get the current label width to add colored line and text relative to the width
        const labelWidth = groupingLabel.node().getBoundingClientRect().width;
        groupingLabel.append("line")
          .attr("class", classes.yAxisColorByLabel)
          .attr("x1", -layout.yAxisTickSize)
          .attr("x2", -labelWidth)
          .attr("y1", layout.yAxisColorByLineHeight)
          .attr("y2", layout.yAxisColorByLineHeight)
          .attr("stroke-width", layout.yAxisColorByLineStrokeWidth)
          .attr("stroke", groupingValueColorBy.color);

        groupingLabel.append("text")
          .attr("class", classes.yAxisColorByLabel)
          .attr("x", labelWidth * -0.5)
          .attr("dy", layout.yAxisColorByLineHeight * 2 + layout.yAxisColorByLineStrokeWidth)
          .attr("text-anchor", "middle")
          .attr("fill", "currentColor")
          .text(`(${groupingValueColorBy.attribute})`);
      }
    });
};
