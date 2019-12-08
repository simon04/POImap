var POImap = {};

POImap.init = function() {
  var attr_osm = 'Map data &copy; <a href="//openstreetmap.org/">OpenStreetMap</a> contributors',
    attr_overpass = 'POI via <a href="//www.overpass-api.de/">Overpass API</a>';

  var osm = new L.TileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: [attr_osm, attr_overpass].join(', ')
    }),
    transport = new L.TileLayer('//{s}.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png', {
      opacity: 0.5,
      attribution: [
        '<a href="http://blog.gravitystorm.co.uk/2011/04/11/transport-map/">Gravitystorm Transport Map</a>',
        attr_osm,
        attr_overpass
      ].join(', ')
    }),
    osm_bw = new L.TileLayer('//{s}.www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png', {
      opacity: 0.5,
      attribution: [attr_osm, attr_overpass].join(', ')
    }),
    osm_no = new L.TileLayer('//{s}.www.toolserver.org/tiles/osm-no-labels/{z}/{x}/{y}.png', {
      attribution: [attr_osm, attr_overpass].join(', ')
    });

  map = new L.Map('map', {
    center: new L.LatLng(47.2632776, 11.4010086),
    zoom: 13,
    layers: osm
  });

  map.getControl = (function() {
    var ctrl = new L.Control.Layers({
      OpenStreetMap: osm,
      'OpenStreetMap (no labels)': osm_no,
      'OpenStreetMap (black/white)': osm_bw,
      'Transport Map': transport
    });
    return function() {
      return ctrl;
    };
  })();
  map.addControl(map.getControl());

  L.LatLngBounds.prototype.toOverpassBBoxString = function() {
    var a = this._southWest,
      b = this._northEast;
    return [a.lat, a.lng, b.lat, b.lng].join(',');
  };

  var path_style = L.Path.prototype._updateStyle;
  L.Path.prototype._updateStyle = function() {
    path_style.apply(this);
    for (var k in this.options.svg) {
      this._path.setAttribute(k, this.options.svg[k]);
    }
  };

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var center = new L.LatLng(position.coords.latitude, position.coords.longitude);
      map.setView(center, 13);
    });
  }

  POImap.map = map;
  return map;
};

POImap.loadAndParseOverpassJSON = function(
  overpassQueryUrl,
  callbackNode,
  callbackWay,
  callbackRelation
) {
  var url = overpassQueryUrl.replace(/(BBOX)/g, map.getBounds().toOverpassBBoxString());
  $.getJSON(url, function(json) {
    POImap.parseOverpassJSON(json, callbackNode, callbackWay, callbackRelation);
  });
};

POImap.parseOverpassJSON = function(overpassJSON, callbackNode, callbackWay, callbackRelation) {
  var nodes = {},
    ways = {};
  for (var i = 0; i < overpassJSON.elements.length; i++) {
    var p = overpassJSON.elements[i];
    switch (p.type) {
      case 'node':
        p.coordinates = [p.lon, p.lat];
        p.geometry = {type: 'Point', coordinates: p.coordinates};
        nodes[p.id] = p;
        // p has type=node, id, lat, lon, tags={k:v}, coordinates=[lon,lat], geometry
        if (typeof callbackNode === 'function') callbackNode(p);
        break;
      case 'way':
        p.coordinates = p.nodes.map(function(id) {
          return nodes[id].coordinates;
        });
        p.geometry = {type: 'LineString', coordinates: p.coordinates};
        ways[p.id] = p;
        // p has type=way, id, tags={k:v}, nodes=[id], coordinates=[[lon,lat]], geometry
        if (typeof callbackWay === 'function') callbackWay(p);
        break;
      case 'relation':
        if (!p.members) {
          console.log('Empty relation', p);
          break;
        }
        p.members.map(function(mem) {
          mem.obj = (mem.type == 'way' ? ways : nodes)[mem.ref];
        });
        // p has type=relation, id, tags={k:v}, members=[{role, obj}]
        if (typeof callbackRelation === 'function') callbackRelation(p);
        break;
    }
  }
};
