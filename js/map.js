let map = null;
let drawingManager = null;
let clickedMarker = null;
let panorama = null;
// This global polygon letiable is to ensure only ONE polygon is rendered.
let polygon = null;
let geocoder = null;
let trafficLayer = null;

let markersArray = [];
let markersHotel = [];
let markersRestaurant = [];
let markersPark = [];
let markersMuseum = [];
let places = [];

let customLabel = {
  restaurant: {
    label: 'R'
  },
  museum: {
    label: 'M'
  },
  park: {
    label: 'P'
  },
  hotel: {
    label: 'H'
  }
};

let usc = {lat: 34.02198651329619 ,lng: -118.2878851890564};
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: usc,
    zoom: 13,
    // mapTypeId: google.maps.MapTypeId.ROADMAP,
    streetViewControl: false
  });

  let infoWindow = new google.maps.InfoWindow();
  let sv = new google.maps.StreetViewService();
  let pin = null;

  // This autocomplete is for use in the search within time entry box.
  let timeAutocomplete = new google.maps.places.Autocomplete(
      document.getElementById('search-within-time-text'));
  // This autocomplete is for use in the geocoder entry box.
  let geocodeAutocomplete = new google.maps.places.Autocomplete(
      document.getElementById('address'));
  // Bias the boundaries within the map for the zoom to area text.
  geocodeAutocomplete.bindTo('bounds', map);
  // Create a searchbox in order to execute a places search
  let searchBox = new google.maps.places.SearchBox(
      document.getElementById('places-search'));
  // Bias the searchbox to within the bounds of the map.
  searchBox.setBounds(map.getBounds());

  trafficLayer = new google.maps.TrafficLayer();

  drawingManager = new google.maps.drawing.DrawingManager({
    // drawingMode: google.maps.drawing.OverlayType.MARKER,
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_LEFT,
      // drawingModes: ['circle', 'polygon', 'polyline', 'rectangle']
      drawingModes: [
        google.maps.drawing.OverlayType.POLYGON
      ]
    },

    polygonOptions: {
      map: map,
      fillOpacity: 0.25,
      strokeWeight: 2,
      clickable: false,
      editable: true,
      zIndex: 1,
      geodesic: true
    },

  });
  // drawingManager.setMap(map);
  geocoder = new google.maps.Geocoder();
  let xmlUrl = 'db/new_markers.xml';

  downloadUrl('xmlUrl', function(data) {
      let xml = data.responseXML;
      // console.log(xml);
      // console.log(data.response)
      let markers = xml.documentElement.getElementsByTagName('marker');
      // console.log(markers);
      Array.prototype.forEach.call(markers, function(markerElem) {
        let id = markerElem.getAttribute('id');

        let name = markerElem.getAttribute('name');
        let address = markerElem.getAttribute('address');
        let type = markerElem.getAttribute('type');
        let tit = markerElem.getAttribute('title');
        let point = new google.maps.LatLng(
            parseFloat(markerElem.getAttribute('lat')),
            parseFloat(markerElem.getAttribute('lng')));

        let infowincontent = document.createElement('div');
        let strong = document.createElement('strong');
        strong.textContent = name
        infowincontent.appendChild(strong);
        infowincontent.appendChild(document.createElement('br'));

        // Create the infoWindow with div placeholder for the StreetView panorama.
        let streetview = document.createElement('div');
        streetview.style.width = "200px";
        streetview.style.height = "200px";
        infowincontent.appendChild(streetview);

        let text = document.createElement('text');
        text.textContent = address
        infowincontent.appendChild(text);
        let icon = customLabel[type] || {};
        let marker = new google.maps.Marker({
          map: map,
          position: point,
          label: icon.label,
          title: tit
        });

        // let bounds = new google.maps.LatLngBounds();
        // map.fitBounds(bounds);

        markersArray.push(marker);
        // console.log(markersArray);
        for (let i = 0; i < markersArray.length; i++) {
          if (markersArray[i].label == 'H') {
            markersHotel.push(markersArray[i]);
            // console.log(markersHotel);
          } else if (markersArray[i].label == 'R') {
            markersRestaurant.push(markersArray[i]);
          } else if (markersArray[i].label == 'P') {
            markersPark.push(markersArray[i]);
          } else {
            markersMuseum.push(markersArray[i]);
          }
        }

        marker.addListener('click', function() {
          clickedMarker = marker;
          infoWindow.setContent(infowincontent);
          infoWindow.open(map, marker);
          sv.getPanoramaByLocation(marker.getPosition(), 50, processSVData);
          // Handle the DOM ready event to create the StreetView panorama
          // as it can only be created once the DIV inside the infowindow is loaded in the DOM.
          pin = new google.maps.MVCObject();
          google.maps.event.addListenerOnce(infoWindow, "domready", function() {
            panorama = new google.maps.StreetViewPanorama(streetview, {
              navigationControl: false,
              enableCloseButton: false,
              addressControl: false,
              linksControl: false,
              visible: true
            });
            panorama.bindTo("position", pin);
          });
      });

        // marker.addListener('mouseover', function() {
        //   this.setIcon('http://maps.google.com/mapfiles/ms/icons/green.png');
        // });
        //
        // marker.addListener('mouseout', function() {
        //   this.setIcon('http://maps.google.com/mapfiles/ms/icons/red.png');
        // });

      });
    });

    document.getElementById('show-hotel-listings').addEventListener('click', showHotelListings);
    document.getElementById('hide-hotel-listings').addEventListener('click', hideHotelListings);

    document.getElementById('show-restaurant-listings').addEventListener('click', showRestaurantListings);
    document.getElementById('hide-restaurant-listings').addEventListener('click', hideRestaurantListings);

    document.getElementById('show-park-listings').addEventListener('click', showParkListings);
    document.getElementById('hide-park-listings').addEventListener('click', hideParkListings);

    document.getElementById('show-museum-listings').addEventListener('click', showMuseumListings);
    document.getElementById('hide-museum-listings').addEventListener('click', hideMuseumListings);

    document.getElementById('show-drawing-control').addEventListener('click', showDrawingControl);
    document.getElementById('hide-drawing-control').addEventListener('click', hideDrawingControl);
    document.getElementById('reset-location-usc').addEventListener('click', function() {
      map.setCenter(usc);
      showListings();
    });
    document.getElementById('traffic-layer').addEventListener('click', function() {
      toggleTrafficLayer(trafficLayer);
    });

    // Add an event listener so that the polygon is captured,  call the
    // searchWithinPolygon function. This will show the markers in the polygon,
    // and hide any outside of it.
    drawingManager.addListener('overlaycomplete', function(event) {
      // First, check if there is an existing polygon.
      // If there is, get rid of it and remove the markers
      if (polygon) {
        polygon.setMap(null);
        // hideListings(markers);
      }
      // Switching the drawing mode to the HAND (i.e., no longer drawing).
      drawingManager.setDrawingMode(null);
      // Creating a new draggable polygon from the overlay.
      polygon = event.overlay;
      polygon.setDraggable(true);
      console.log(polygon);
      // Searching within the polygon.
      searchWithinPolygon();
      // Make sure the search is re-done if the poly is changed.
      polygon.getPath().addListener('set_at', searchWithinPolygon);
      polygon.getPath().addListener('insert_at', searchWithinPolygon);
    });

    document.getElementById('submit').addEventListener('click', function() {
      geocodeAddress(geocoder, map);
    });

    document.getElementById('search-within-time').addEventListener('click', function() {
      searchWithinTime();
    });

    // Listen for the event fired when the user selects a prediction from the
    // picklist and retrieve more details for that place.
    searchBox.addListener('places_changed', function() {
      searchBoxPlaces(this);
    });

    // Listen for the event fired when the user selects a prediction and clicks
    // "go" more details for that place.
    document.getElementById('go-places').addEventListener('click', textSearchPlaces);

  }


  function processSVData(data, status) {
    if (status == google.maps.StreetViewStatus.OK) {
      let marker = clickedMarker;

      if (!!panorama && !!panorama.setPano) {

        panorama.setPano(data.location.pano);
        panorama.setPov({
          heading: 270,
          pitch: 0,
          zoom: 1
        });
        panorama.setVisible(true);

        google.maps.event.addListener(marker, 'click', function() {

          let markerPanoID = data.location.pano;
          // Set the Pano to use the passed panoID
          panorama.setPano(markerPanoID);
          panorama.setPov({
            heading: 270,
            pitch: 0,
            zoom: 1
          });
          panorama.setVisible(true);
        });
      }
    } else {
      panorama.setVisible(false);
      // alert("Street View data not found for this location.");
    }
  }


function downloadUrl(url, callback) {
  let request = window.ActiveXObject ?
      new ActiveXObject('Microsoft.XMLHTTP') :
      new XMLHttpRequest;

  request.onreadystatechange = function() {
    if (request.readyState == 4) {
      request.onreadystatechange = doNothing;
      callback(request, request.status);
    }
  };

  request.open('GET', 'db/new_markers.xml', true);
  request.send(null);
  // console.log(request)
}


// This function will loop through the markers array and display them all.
function showListings() {
  let bounds = new google.maps.LatLngBounds();
  // Extend the boundaries of the map for each marker and display the marker
  for (let i = 0; i < markersArray.length; i++) {
    markersArray[i].setMap(map);
    bounds.extend(markersArray[i].position);
  }
  map.fitBounds(bounds);
}


// This function will loop through the hotels' markers array and display them all.
function showHotelListings() {
  let bounds = new google.maps.LatLngBounds();
  // Extend the boundaries of the map for each marker and display the marker
  for (let i = 0; i < markersHotel.length; i++) {
    markersHotel[i].setMap(map);
    bounds.extend(markersHotel[i].position);
  }
  map.fitBounds(bounds);
}

// This function will loop through the hotel-listings and hide them all.
function hideHotelListings() {
  for (let i = 0; i < markersHotel.length; i++) {
    markersHotel[i].setMap(null);
  }
}

// This function will loop through the restaurants' markers array and display them all.
function showRestaurantListings() {
  let bounds = new google.maps.LatLngBounds();
  // Extend the boundaries of the map for each marker and display the marker
  for (let i = 0; i < markersRestaurant.length; i++) {
    markersRestaurant[i].setMap(map);
    bounds.extend(markersRestaurant[i].position);
  }
  map.fitBounds(bounds);
}

// This function will loop through the restaurant-listings and hide them all.
function hideRestaurantListings() {
  for (let i = 0; i < markersRestaurant.length; i++) {
    markersRestaurant[i].setMap(null);
  }
}

// This function will loop through the hotels' markers array and display them all.
function showParkListings() {
  let bounds = new google.maps.LatLngBounds();
  // Extend the boundaries of the map for each marker and display the marker
  for (let i = 0; i < markersPark.length; i++) {
    markersPark[i].setMap(map);
    bounds.extend(markersPark[i].position);
  }
  map.fitBounds(bounds);
}

// This function will loop through the hotel-listings and hide them all.
function hideParkListings() {
  for (let i = 0; i < markersPark.length; i++) {
    markersPark[i].setMap(null);
  }
}

// This function will loop through the hotels' markers array and display them all.
function showMuseumListings() {
  let bounds = new google.maps.LatLngBounds();
  // Extend the boundaries of the map for each marker and display the marker
  for (let i = 0; i < markersMuseum.length; i++) {
    markersMuseum[i].setMap(map);
    bounds.extend(markersMuseum[i].position);
  }
  map.fitBounds(bounds);
}

// This function will loop through the hotel-listings and hide them all.
function hideMuseumListings() {
  for (let i = 0; i < markersMuseum.length; i++) {
    markersMuseum[i].setMap(null);
  }
}

// This function will loop through the listings and hide them all.
function hideMarkers(markers) {
  for (let i = 0; i < markersArray.length; i++) {
    markersArray[i].setMap(null);
  }
}

function showDrawingControl() {
  drawingManager.setOptions({
    drawingControl: true
  });
  drawingManager.setMap(map);
}

// This shows and hides (respectively) the drawing options.
function hideDrawingControl() {
  drawingManager.setOptions({
    drawingControl: false
  });
  drawingManager.setMap(null);
  // In case the user drew anything, get rid of the polygon
  if (polygon !== null) {
    polygon.setMap(null);
  }
}


// This function hides all markers outside the polygon,
// and shows only the ones within it. This is so that the
// user can specify an exact area of search.
function searchWithinPolygon() {
  for (let i = 0; i < markersArray.length; i++) {
    if (google.maps.geometry.poly.containsLocation(markersArray[i].position, polygon)) {
      markersArray[i].setMap(map);
    } else {
      markersArray[i].setMap(null);
    }
  }
}


function geocodeAddress(geocoder, resultsMap) {
  let address = document.getElementById('address').value;
  geocoder.geocode({'address': address}, function(results, status) {
    if (status === 'OK') {
      resultsMap.setCenter(results[0].geometry.location);
      document.getElementById('location').value = results[0].geometry.location;
    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}

// This function allows the user to input a desired travel time, in
// minutes, and a travel mode, and a location - and only show the listings
// that are within that travel time (via that travel mode) of the location
function searchWithinTime() {
  // Initialize the distance matrix service.
  let distanceMatrixService = new google.maps.DistanceMatrixService;
  let address = document.getElementById('search-within-time-text').value;
  // Check to make sure the place entered isn't blank.
  if (address == '') {
    window.alert('You must enter an address.');
  } else {
    hideMarkers(markersArray);
    // Use the distance matrix service to calculate the duration of the
    // routes between all our markers, and the destination address entered
    // by the user. Then put all the origins into an origin matrix.
    let origins = [];
    for (let i = 0; i < markersArray.length; i++) {
      origins[i] = markersArray[i].position;
    }
    let destination = address;
    let mode = document.getElementById('mode').value;
    // Now that both the origins and destination are defined, get all the
    // info for the distances between them.
    distanceMatrixService.getDistanceMatrix({
      origins: origins,
      destinations: [destination],
      travelMode: google.maps.TravelMode[mode],
      unitSystem: google.maps.UnitSystem.IMPERIAL,
    }, function(response, status) {
      if (status !== google.maps.DistanceMatrixStatus.OK) {
        window.alert('Error was: ' + status);
      } else {
        displayMarkersWithinTime(response);
      }
    });
  }
}

// This function will go through each of the results, and,
// if the distance is LESS than the value in the picker, show it on the map.
function displayMarkersWithinTime(response) {
  let maxDuration = document.getElementById('max-duration').value;
  let origins = response.originAddresses;
  // console.log(origins);
  let destinations = response.destinationAddresses;
  // console.log(destinations);

  // Parse through the results, and get the distance and duration of each.
  // Because there might be  multiple origins and destinations we have a nested loop
  // Then, make sure at least 1 result was found.
  let atLeastOne = false;
  for (let i = 0; i < origins.length; i++) {
    let results = response.rows[i].elements
    for (let j = 0; j < results.length; j++) {
      let element = results[j];
      if (element.status === "OK") {
        // The distance is returned in feet, but the TEXT is in miles. If we wanted to switch
        // the function to show markers within a user-entered DISTANCE, we would need the
        // value for distance, but for now we only need the text.
        let distanceText = element.distance.text;
        // Duration value is given in seconds so we make it MINUTES. We need both the value
        // and the text.
        let duration = element.duration.value / 60;
        let durationText = element.duration.text;
        if (duration <= maxDuration) {
          //the origin [i] should = the markers[i]
          markersArray[i].setMap(map);
          atLeastOne = true;
          // Create a mini infowindow to open immediately and contain the
          // distance and duration
          let infowindow = new google.maps.InfoWindow({
            content: durationText + ' away, ' + distanceText +
              '<div><input type=\"button\" value=\"Show Route\" onclick =' +
              '\"displayDirections(&quot;' + origins[i] + '&quot;);\"></input></div>'
          });
          infowindow.open(map, markersArray[i]);
          // Put this in so that this small window closes if the user clicks
          // the marker, when the big infowindow opens
          markersArray[i].infowindow = infowindow;
          google.maps.event.addListener(markersArray[i], 'click', function() {
            this.infowindow.close();
          });
        }
      }
    }
  }
  if (!atLeastOne) {
    window.alert('We could not find any locations within that distance!');
  }
}

// This function is in response to the user selecting "show route" on one
// of the markers within the calculated distance. This will display the route
// on the map.
function displayDirections(origin) {
  hideMarkers(markersArray);
  let directionsService = new google.maps.DirectionsService;
  // Get the destination address from the user entered value.
  let destinationAddress = document.getElementById('search-within-time-text').value;
  // Get mode again from the user entered value.
  let mode = document.getElementById('mode').value;
  directionsService.route({
    // The origin is the passed in marker's position.
    origin: origin,
    // The destination is user entered address.
    destination: destinationAddress,
    travelMode: google.maps.TravelMode[mode]
  }, function(response, status) {
    if (status === google.maps.DirectionsStatus.OK) {
      let directionsDisplay = new google.maps.DirectionsRenderer({
        map: map,
        directions: response,
        draggable: true,
        polylineOptions: {
          strokeColor: 'blue'
        }
      });
    } else {
      window.alert('Directions request failed due to ' + status);
    }
  });
}


// This function fires when the user selects a searchbox picklist item.
// It will do a nearby search using the selected query string or place.
function searchBoxPlaces(searchBox) {
  hideMarkers(markersArray);
  places = searchBox.getPlaces();
  // For each place, get the icon, name and location.
  createMarkersForPlaces(places);
  if (places.length == 0) {
    window.alert('We did not find any places matching that search!');
  }
}


// This function firest when the user select "go" on the places search.
// It will do a nearby search using the entered query string or place.
function textSearchPlaces() {
  let bounds = map.getBounds();
  hideMarkers(markersArray);
  let placesService = new google.maps.places.PlacesService(map);
  placesService.textSearch({
    query: document.getElementById('places-search').value,
    bounds: bounds
  }, function(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      createMarkersForPlaces(results);
    }
  });
}


// This function creates markers for each place found in either places search.
function createMarkersForPlaces(places) {
  let bounds = new google.maps.LatLngBounds();
  let placeMarkers = [];
  for (let i = 0; i < places.length; i++) {
    let place = places[i];
    let icon = {
      url: place.icon,
      size: new google.maps.Size(35, 35),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(15, 34),
      scaledSize: new google.maps.Size(25, 25)
    };
    // Create a marker for each place.
    let marker = new google.maps.Marker({
      map: map,
      icon: icon,
      title: place.name,
      position: place.geometry.location,
      id: place.id
    });
    // If a marker is clicked, do a place details search on it in the next function.
    marker.addListener('click', function() {
    getPlacesDetails(this, place);
    });
    placeMarkers.push(marker);
    if (place.geometry.viewport) {
      // Only geocodes have viewport.
      bounds.union(place.geometry.viewport);
    } else {
      bounds.extend(place.geometry.location);
    }
  }
  map.fitBounds(bounds);
}


function toggleTrafficLayer(trafficLayer) {
  if (trafficLayer.map) {
    trafficLayer.setMap(null);
  } else {
    trafficLayer.setMap(map);
  }
}


function doNothing() {}
