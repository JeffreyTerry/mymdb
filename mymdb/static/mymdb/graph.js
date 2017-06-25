// constants
var standardRadius = 22;
var width = window.innerWidth * 0.65;
var height = window.innerHeight - 45;

//Set up the colour scale
// var color = d3.scale.category20();
var customColorRange = colorbrewer.RdYlGn[11].slice(0, 5);
Array.prototype.push.apply(customColorRange, colorbrewer.RdYlGn[11].slice(6));
var color = d3.scale.ordinal()
                .domain([4.5,5,5.5,6,6.5,7,7.5,8,8.5,9,9.5,10])
                .range(customColorRange);

function roundToNearestHalf(x) {
    return Math.round(x * 2) / 2;
}

function nodeInnerFillFunction(d) {
    return color(Math.max(4.5, roundToNearestHalf(d.rating)));
}

function nodeOuterFillFunction(d) {
    if (d.rating > 7.5)
        return shadeColor(nodeInnerFillFunction(d), 50);
    else
        return shadeColor(nodeInnerFillFunction(d), -30);
}

function mouseenter() {
    // Show 'Click Here' Icon
    var x_position = $(this)[0].transform.animVal[0].matrix['e'] + 20;
    var y_position = $(this)[0].transform.animVal[0].matrix['f'] - 18;
    var clickHereDiv = $('<img id="click_here_icon" src=' + STATIC_URL_BASE + '/mymdb/images/click_here.png height=40 width=200 style="position: absolute; top: ' + y_position + 'px; left: ' + x_position + 'px;">')
    $('body').append(clickHereDiv);

    // If we haven't already appended the outer circle
    var secondaryCircle = d3.select(this)
        .insert("circle", ':first-child')
        .attr('class', 'secondary')
        .attr("fill", nodeOuterFillFunction)
        .attr("r", standardRadius)
        .transition()
        .duration(50)
        .attr("r", standardRadius * 1.4);
    $(this).first().click(clickMovieNode);
}

function mouseleave() {
    // Hide 'Click Here' Icon
    $('#click_here_icon').remove();
    
    d3.select(this).selectAll("circle.secondary")
        .transition()
        .duration(50)
        .attr("r", standardRadius)
        .remove();
}

var linkedNodes = new Set();
var existingNodes = new Set();  // {imdbIDs}
var expandedNodes = new Set();
var movieCache = {};  // imdbID -> {'movie': movie_data_object, 'recommendations': list_of_recommendation_objects}
var movieHistoryQueue = [];
var movieHistorySet = new Set();

function MyMDbGraph(el) {

    this.fixNodePosition = function(id) {
        nodes[findNodeIndex(id)].fixed = true;
    };

    // Add and remove elements on the graph object
    this.addNode = function(title, id, genre, rating) {
        if (!existingNodes.has(id)) {
            nodes.push({'title': title,
                        'id': id,
                        'genre': genre,
                        'rating': rating});
            update();
            existingNodes.add(id)
        }
    };

    this.removeNode = function(id) {
        var n = findNode(id);

        // Remove neighbor nodes if they are leafs; otherwise, store them for later
        var nonLeafNeighbors = [];
        for (var i = 0; i < links.length; ++i) {
            if ((links[i]['source'] === n)||(links[i]['target'] === n)) {
                var currentNeighborID;
                if (links[i]['source'] === n)
                    currentNeighborID = links[i]['target'].id;
                else
                    currentNeighborID = links[i]['source'].id;

                if (!movieHistorySet.has(currentNeighborID)) {
                    removeNodeHelper(currentNeighborID);
                } else {
                    nonLeafNeighbors.push(currentNeighborID);
                }
            }
        }

        // Remove any links to the removed node
        for (var i = 0; i < links.length; ++i) {
            if ((links[i]['source'] === n)||(links[i]['target'] === n)) {
                links.splice(i,1);
                i--;
            }
        }

        // Reconnect non-leaf neighbors to each other if necessary
        if (nonLeafNeighbors.length > 1) {
            var newRoot = nonLeafNeighbors.shift();
            for (var i = 0; i < nonLeafNeighbors.length; ++i) {
                linkedNodes.delete(nonLeafNeighbors[i]);
                this.addLink(newRoot, nonLeafNeighbors[i]);
            }
        }

        removeNodeHelper(id);
        update();
    };

    var removeNodeHelper = function(id) {
        // Remove all traces of the node
        existingNodes.delete(id);
        linkedNodes.delete(id);
        if (expandedNodes.has(id))
            expandedNodes.delete(id);

        var index = findNodeIndex(id);
        if(index !== undefined) {
            nodes.splice(index, 1);
        }
    };

    this.addLink = function(sourceID, targetID) {
        var sourceNode = findNode(sourceID);
        var targetNode = findNode(targetID);

        if((sourceNode !== undefined) && (targetNode !== undefined)) {
            if (!linkedNodes.has(targetNode.id)) {
                links.push({"source": sourceNode, "target": targetNode});
                linkedNodes.add(targetNode.id);
                update();
            }
        }
    };

    var findNode = function(id) {
        for (var i=0; i < nodes.length; i++) {
            if (nodes[i].id === id)
                return nodes[i]
        };
    };

    var findNodeIndex = function(id) {
        for (var i=0; i < nodes.length; i++) {
            if (nodes[i].id === id)
                return i
        };
    };

    // set up the D3 visualisation in the specified element
    var svg = this.svg = d3.select(el).append("svg:svg")
        .attr("width", width)
        .attr("height", height);

    svg.append("g")
        .attr("class", "links");

    svg.append("g")
        .attr("class", "nodes");

    svg.append("g")
        .attr("class", "node-titles");

    var force = d3.layout.force()
        .gravity(0.1)
        .friction(0.7)
        .linkDistance(100)
        .charge(-2000)
        .size([width, height]);

    var nodes = force.nodes(),
        links = force.links();

    var update = function() {

        var link = svg.select("g.links").selectAll("line.link")
            .data(links, function(d) { return d.source.id + "-" + d.target.id; });

        link.enter().insert("line")
            .attr("class", "link");

        link.exit().remove();

        var node = svg.select("g.nodes").selectAll("g.node")
            .data(nodes, function(d) { return d.title; });

        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("movie-title", function(d) { return d.title; })
            .attr("movie-id", function(d) { return d.id; })
            .style("fill", nodeInnerFillFunction)
            .on("mouseenter", mouseenter)
            .on("mouseleave", mouseleave)
            .call(force.drag);

        nodeEnter.append("circle")
            .attr('class', 'primary')
            .attr("r", function(d) {
                return standardRadius;
            });

        node.exit().remove();

        var text = svg.select("g.node-titles").selectAll("text.node-title")
            .data(nodes, function(d) { return d.title; });

        var textEnter = text.enter()
            .append("text")
            .attr("class", "node-title")
            .attr("dx", 23)
            .attr("dy", ".35em")
            .text(function(d) { return d.title } );

        text.exit().remove();

        force.on("tick", function() {
          link.attr("x1", function(d) { return d.source.x; })
              .attr("y1", function(d) { return d.source.y; })
              .attr("x2", function(d) { return d.target.x; })
              .attr("y2", function(d) { return d.target.y; });

          node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

          text.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
        });

        // Restart the force layout.
        force.start();
    }

    // Make it all go
    update();
}
