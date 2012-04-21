function initMap() {
  var attr_osm = 'Map data &copy; <a href="http://openstreetmap.org/">OpenStreetMap</a> contributors',
      attr_mapbox = 'Imagery &copy; <a href="http://mapbox.com/about/maps/">MapBox</a>'
        attr_overpass = 'POI via <a href="http://www.overpass-api.de/">Overpass API</a>';

  var osm = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: [attr_osm, attr_overpass].join(', ')}),
      mapbox_streets = new L.TileLayer("http://{s}.tiles.mapbox.com/v3/mapbox.mapbox-streets/{z}/{x}/{y}.png", {attribution: [attr_mapbox, attr_osm, attr_overpass].join(', ')}),
      mapbox_light = new L.TileLayer("http://{s}.tiles.mapbox.com/v3/mapbox.mapbox-light/{z}/{x}/{y}.png", {attribution: [attr_mapbox, attr_osm, attr_overpass].join(', ')}),
      mapbox_simple = new L.TileLayer("http://{s}.tiles.mapbox.com/v3/mapbox.mapbox-simple/{z}/{x}/{y}.png", {attribution: [attr_mapbox, attr_osm, attr_overpass].join(', ')});

  map = new L.Map('map', {
    center: new L.LatLng(47.2632776, 11.4010086),
      zoom: 13,
      layers: mapbox_light,
  });

  map.getControl = function () {
    var ctrl = new L.Control.Layers({
      'MapBox Streets': mapbox_streets,
       'MapBox Light': mapbox_light,
       'MapBox Simple': mapbox_simple,
       'OpenSteetMap': osm,
    });
    return function () {
      return ctrl;
    }
  }();
  map.addControl(map.getControl());

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var center = new L.LatLng(position.coords.latitude, position.coords.longitude);
      map.setView(center, 13);
    });
  }

  return map;
}
