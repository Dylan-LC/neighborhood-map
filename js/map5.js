  let drawingManager = null;
  let clickedMarker = null;
  let panorama = null;
  let markersArray = [];

  function initMap() {
    let map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 34.02198651329619 ,lng: -118.2878851890564},
      zoom: 13,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      streetViewControl: false
    });

    let infoWindow = new google.maps.InfoWindow();
    drawingManager = new google.maps.drawing.DrawingManager({
      // drawingMode: google.maps.drawing.OverlayType.MARKER,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: ['circle', 'polygon', 'polyline', 'rectangle']
      },
      // markerOptions: {icon: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png'},
      circleOptions: {
        // fillColor: '#ffff00',
        fillOpacity: 0.25,
        strokeWeight: 2,
        clickable: false,
        editable: true,
        zIndex: 1
      },

      polygonOptions: {
        fillOpacity: 0.25,
        strokeWeight: 2,
        clickable: false,
        editable: true,
        draggable: true,
        zIndex: 1
      },

      rectangleOptions: {
        fillOpacity: 0.25,
        strokeWeight: 2,
        clickable: false,
        editable: true,
        draggable: true,
        zIndex: 1
      }
    });
    drawingManager.setMap(map);


    let xmlUrl = 'db/new_markers.xml';

    downloadUrl('xmlUrl', function(data) {
        let xml = data.responseXML;
        let markers = xml.documentElement.getElementsByTagName('marker');

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
          streetview.setAttribute("id", "Div1");
          streetview.style.width = "200px";
          streetview.style.height = "200px";
          infowincontent.appendChild(streetview);

          let text = document.createElement('text');
          text.textContent = address
          infowincontent.appendChild(text);
          let marker = new google.maps.Marker({
            map: map,
            position: point,
            title: tit
          });

          markersArray.push(marker);

          marker.addListener('click', function() {
            infoWindow.setContent(infowincontent);
            infoWindow.open(map, marker);
            let panorama = new google.maps.StreetViewPanorama(
              document.getElementById('Div1'), {
                position: point,
                pov: {
                  heading: 34,
                  pitch: 10
                }
              });
            map.setStreetView(panorama);
          });
        });
      });
      document.getElementById('show-drawing-control').addEventListener('click', showDrawingControl);
      document.getElementById('hide-drawing-control').addEventListener('click', hideDrawingControl);

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

  function showDrawingControl() {
    drawingManager.setOptions({
      drawingControl: true
    });
  }

  function hideDrawingControl() {
    drawingManager.setOptions({
      drawingControl: false
    });
  }

  function doNothing() {}
