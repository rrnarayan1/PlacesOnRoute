function initMap() {
    var directionsService = new google.maps.DirectionsService;
    var directionsDisplay = new google.maps.DirectionsRenderer;
    var directionsDisplay1 = new google.maps.DirectionsRenderer;

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
    directionsDisplay1.setMap(map);
    directionsDisplay.setPanel(document.getElementById('right-right-panel'));
    directionsDisplay1.setPanel(document.getElementById('right-below-panel'));
    
    var currentPos;
    var waypoints=[]
    getCurrentPosition(function(currentPosition){
        currentPos = currentPosition
        getSearchPosition(map,directionsService, currentPosition, clickTimePosition,[],1, function(waypointPlaces){
            changeHTMLWaypoints(waypointPlaces)
            waypoints = waypointPlaces
        });
    });
    document.getElementById('possibility0').addEventListener('click', function() {
        mode = checkMode()
        document.getElementById('right-below-panel').innerHTML=""
        directionsDisplay1.setDirections({routes: []})
        calculateAndDisplayRoute(directionsService, directionsDisplay, directionsDisplay1, clickTimePosition, currentPos, waypoints[0], mode);
    });
    document.getElementById('possibility1').addEventListener('click', function() {
        mode = checkMode()
        document.getElementById('right-below-panel').innerHTML=""
        directionsDisplay1.setDirections({routes: []})
        calculateAndDisplayRoute(directionsService, directionsDisplay, directionsDisplay1, clickTimePosition, currentPos, waypoints[1], mode);
    });
}
function checkMode(){
    if(document.getElementById('driving').checked)
        return 'DRIVING'
    else if(document.getElementById('bicycling').checked)
        return 'BICYCLING'
    else if(document.getElementById('walking').checked)
        return 'WALKING'
    else
        return 'TRANSIT'
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

function getSearchPosition(map,directionsService, currentPosition, clickTimePosition, waypointPlaces, multiplier, callback){
    console.log("getting search pos")
    directionsService.route({
        origin: currentPosition,
        destination: clickTimePosition,
        travelMode: 'DRIVING'
        }, function(response, status) {
            if (status === 'OK') {
                var route = response.routes[0].overview_path;
                searchPosition=route[Math.floor((multiplier*route.length)/5)-1]
                console.log("Found place to search with!")  
                document.getElementById('info').innerHTML = ""
                var placeRequest = {
                    location: searchPosition,
                    radius: '3000',
                    keyword: 'donuts coffee',
                    type: 'cafe',
                    rankBy: google.maps.places.RankBy.PROMINENCE 
                }
                service = new google.maps.places.PlacesService(map);
                service.nearbySearch(placeRequest, function(results, status){
                    if(status == "OK"){
                        //top 2 results only
                        counter = 0
                        //only look through the top 50 results.
                        var size = 50;
                        if(results.length < size){
                            size= results.length;
                        }
                        console.log("size "+size)
                        for(var i=0;i<size;i++){
                            if(counter == 2){
                                break;
                            }
                            if(results[i].opening_hours != null && results[i].opening_hours.open_now){
                                waypointPlaces[counter]=results[i]
                                counter+=1
                            }
                        }
                        if(waypointPlaces.length < 2 && multiplier != 5){
                            //didn't get enough places
                            console.log("recurse! multiplier is "+ multiplier+" now")
                            return getSearchPosition(map,directionsService, currentPosition, clickTimePosition, waypointPlaces, multiplier+1, callback)                      
                        }
                        else if(waypointPlaces.length == 0 && multiplier == 5){
                            //no good options to get food
                            console.log("no good places to get food :(")
                            waypointPlaces[0]=results[0]
                            waypointPlaces[1]=results[1]
                            return callback(waypointPlaces);
                        }
                        else{
                            console.log("hey got a good place")
                            return callback(waypointPlaces); 
                        }
                    } else{
                        console.log("something messed up when looking for places en route")
                    }
                });  
            }
            else{
                console.log("Could not find initial route :(")
                searchPosition=null
                //return callback(searchPosition)
            }
        }
    );
}

function changeHTMLWaypoints(possibleWaypoints, possiblePriorities){
    //possible Waypoints will only have 2 entries
    document.getElementById('poss0').innerHTML = possibleWaypoints[0].name
    if(possibleWaypoints.length==2){
        document.getElementById('poss1').innerHTML = possibleWaypoints[1].name
    }
    document.getElementById('possibility-title').style.visibility = "visible"
    document.getElementById('mode').style.visibility = "visible"


}

function calculateAndDisplayRoute(directionsService, directionsDisplay, directionsDisplay1, posInit, currentPos, waypointPlace, mode) {
    var waypts = [];
    waypts.push({
        location: waypointPlace.geometry.location,
    })
    console.log(mode)
    if(mode == 'TRANSIT'){
        directionsService.route({
          origin: currentPos,
          destination: waypts[0],
          optimizeWaypoints: true,
          travelMode: mode
        }, function(response, status) {
          if (status === 'OK') {
            directionsDisplay.setDirections(response);
          }
        })
        directionsService.route({
          origin: waypts[0],
          destination: posInit,
          optimizeWaypoints: true,
          travelMode: mode
        }, function(response, status) {
          if (status === 'OK') {
            directionsDisplay1.setDirections(response);
          }
        })    
    }
    else{
        directionsService.route({
          origin: currentPos,
          destination: posInit,
          waypoints: waypts,
          optimizeWaypoints: true,
          travelMode: mode
        }, function(response, status) {
          if (status === 'OK') {
            directionsDisplay.setDirections(response);
            var route = response.routes[0];
            var summaryPanel = document.getElementById('directions-panel');
            summaryPanel.innerHTML = '';
            if(waypointPlace.name != null){
                summaryPanel.innerHTML += "You're going to be stopping at "+waypointPlace.name+". "
            } if(waypointPlace.vicinity != null){
                summaryPanel.innerHTML += "The shop is located at "+waypointPlace.vicinity+". "
            } if(waypointPlace.formatted_phone_number != null){
                summaryPanel.innerHTML += "If you want to try ordering ahead, try calling here at "+
                waypointPlace.formatted_phone_number+"."
            }
            summaryPanel.innerHTML += "<br>"
          } else {
            window.alert('Directions request failed due to ' + status);
          }
        });
    }
}