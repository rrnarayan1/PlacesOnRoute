function initMap() {
    var directionsService = new google.maps.DirectionsService;
    var directionsDisplay = new google.maps.DirectionsRenderer;

    var map = new google.maps.Map(document.getElementById('map'), {
      zoom: 12,
      center: {lat: -34.397, lng: 150.644}
    });
    var geocoder = new google.maps.Geocoder();
    var clickTime = "282 2nd Street 4th floor, San Francisco, CA 94105"
    var clickTimePosition;
    geocoder.geocode({'address': clickTime} ,function(result, status){
        if(status == "OK"){
            var posInit= {
                lat: result[0].geometry.location.lat(),
                lng: result[0].geometry.location.lng()
            };
            clickTimePosition = posInit;
            map.setCenter(posInit);
        }
        else{
            console.log("Could not find clickTime location!")
        }
    });

    directionsDisplay.setMap(map);
    
    
    var currentPos;
    var waypoint;
    getCurrentPosition(function(currentPosition){
        currentPos = currentPosition 
        document.getElementById("submit").style.visibility="visible";
        getSearchPosition(directionsService, currentPosition, clickTimePosition, function(searchPosition){
            var placeRequest = {
                location: searchPosition,
                radius: '1000',
                keyword: 'donuts coffee',
                type: 'cafe',
                rankBy: google.maps.places.RankBy.PROMINENCE 
            };
            service = new google.maps.places.PlacesService(map);
            service.nearbySearch(placeRequest, function(results, status){
                if(status == "OK"){
                    waypoint = results[0].geometry.location;
                }
            });
        });
    });
     
    document.getElementById('submit').addEventListener('click', function() {
        calculateAndDisplayRoute(directionsService, directionsDisplay, clickTimePosition, currentPos, waypoint);
    });
}

function getCurrentPosition(callback){
    console.log("getting current pos")
    var currentPosition;
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var currentPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            currentPosition = currentPos;
            console.log("got current pos")
            return callback(currentPosition)
        }); 
    } else {
        currentPosition = null
        console.log("No geolocation :(")
        return callback(currentPosition)
    }
}

function getSearchPosition(directionsService, currentPosition, clickTimePosition, callback){
    console.log("getting search pos")
    directionsService.route({
        origin: currentPosition,
        destination: clickTimePosition,
        travelMode: 'DRIVING'
        }, function(response, status) {
            if (status === 'OK') {
                var route = response.routes[0].overview_path;
                searchPosition=route[Math.floor(route.length/5)]
                console.log("Found place to search with!")  
                return callback(searchPosition);   
            }
            else{
                console.log("Could not find initial route :(")
                searchPosition=null
                return callback(searchPosition)
            }
        }
    );
}

function calculateAndDisplayRoute(directionsService, directionsDisplay, posInit, currentPos, waypoint) {
    var waypts = [];
    waypts.push({
        location: waypoint,
    })

    directionsService.route({
      origin: currentPos,
      destination: posInit,
      waypoints: waypts,
      optimizeWaypoints: true,
      travelMode: 'DRIVING'
    }, function(response, status) {
      if (status === 'OK') {
        directionsDisplay.setDirections(response);
        var route = response.routes[0];
        var summaryPanel = document.getElementById('directions-panel');
        summaryPanel.innerHTML = '';
        // For each route, display summary information.
        for (var i = 0; i < route.legs.length; i++) {
          var routeSegment = i + 1;
          summaryPanel.innerHTML += '<b>Route Segment: ' + routeSegment +
              '</b><br>';
          summaryPanel.innerHTML += route.legs[i].start_address + ' to ';
          summaryPanel.innerHTML += route.legs[i].end_address + '<br>';
          summaryPanel.innerHTML += route.legs[i].distance.text + '<br><br>';
        }
      } else {
        window.alert('Directions request failed due to ' + status);
      }
    });
}