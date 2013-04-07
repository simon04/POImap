var IVB = {};
IVB.layers = {};

IVB.init = function () {
  // init map
  IVB.map = POImap.init();
  // init stop labels layer
  IVB.layers.stopLabels = L.layerGroup().addTo(IVB.map);
  IVB.map.getControl().addOverlay(IVB.layers.stopLabels, 'Haltestellen');
  // init proposed line extensions
  IVB.layers.proposed = L.layerGroup();
  IVB.map.getControl().addOverlay(IVB.layers.proposed, 'Erweiterung');
  var extensionUrl = 'http://www.overpass-api.de/api/interpreter?data=[out:json];(way(47.2,11.3,47.3,11.6)[railway=proposed];node(w););out body;';
  POImap.loadAndParseOverpassJSON(extensionUrl, null, IVB.displayExtension(IVB.layers.proposed), null);
  // load route relations
  var linesUrl = 'http://www.overpass-api.de/api/interpreter?data=[out:json];'
  + '(relation[operator="Innsbrucker Verkehrsbetriebe"][type=route][route=tram][ref~"1|3|6|STB"][name!="IVB Linie 3"];node(r)->.x;way(r);node(w););out body;';
  POImap.loadAndParseOverpassJSON(linesUrl, null, null, IVB.handleRelation);
};

IVB.displayExtension = function (layer) {
  return function (w) {
    L.geoJson({
      type: 'Feature',
      geometry: w.geometry
    }, {
      style: function (e) {
        return {
          opacity: 1,
          color: '#666',
          //svg: {'stroke-dasharray': '6,8'},
          weight: 3
        };
      }
    }).addTo(layer);
  };
};

IVB.handleRelation = function (p) {
  var stopAngles = IVB.getStopAngles(p);
  p.members.filter(function (mem) {
    return mem.obj && mem.role != 'platform';
  }).map(function (mem) {
    IVB.addLine(p.tags.ref, {
      type: 'Feature',
      geometry: mem.obj.geometry,
      id: mem.obj.id,
      tags: mem.obj.tags,
      reltags: p.tags,
      angle: stopAngles[mem.ref]
    });
  });
};

IVB.getStopAngles = function (relation) {
  var stopAngle = {};
  var getAngleForStop = function (stop) {
    relation.members.map(function (mem) {
      if (mem.type != 'way') return;
      // index of node in way
      var idx = mem.obj.nodes.indexOf(stop);
      if (idx < 0) return;
      // take two adjacent ways
      // ignore projection and use lat/lon directly (shouldn't make a big difference as 2 nodes are rather close)
      var lonlat1 = mem.obj.coordinates[idx === 0 ? 0 : idx - 1];
      var lonlat2 = mem.obj.coordinates[idx === 0 ? 1 : idx];
      // determine in which order those two nodes are used
      var polarity;
      var idxWay = relation.members.filter(function (r) {
        return r.obj.type == 'way' && r.role != 'platform';
      }).indexOf(mem);
      if (idxWay < 0) {
        // ignore
      } else if (idxWay === 0) {
        // assumes ways in a block, i.e., w/o stops in between
        // f first node linked to next way then -1 else +1
        var nodes = relation.members[1].obj.nodes;
        if (!nodes) return;
        polarity = nodes.indexOf(mem.obj.nodes[0]) >= 0 ? 180 : 0;
      } else {
        // if first node linked to previous way then +1 else -1
        var relNodes = relation.members[idxWay - 1].obj.nodes;
        if (!relNodes) return;
        polarity = relNodes.indexOf(mem.obj.nodes[0]) >= 0 ? 0 : 180;
      }
      // compute direction, i.e., angle (with mathematical meaning: 0=horizontal, anti-clockwise)
      var angle = polarity + Math.atan2(lonlat2[1] - lonlat1[1], lonlat2[0] - lonlat1[0]) * 180 / Math.PI;
      //console.log(relation.tags.name, stop, mem.obj, idx, idx == 0 ? 0 : idx - 1, idx == 0 ? 1 : idx, lonlat1, lonlat2, idxWay, polarity, angle);
      stopAngle[stop] = Math.round(angle);
    });
  };

  var stops = relation.members.filter(function (mem) {
    return mem.type == 'node' && mem.role.match(/stop/);// && mem.obj.tags.name && mem.obj.tags.name.match(/Klinik/);
  }).map(function (mem) {
    return mem.ref;
  }).map(getAngleForStop);
  return stopAngle;
};

IVB.halts = {};
IVB.addLine = function (lineref, geojson) {
  var layer = L.geoJson(geojson, {
    style: function (p) {
      // Adapt style/color
      var color = p.reltags.colour || p.reltags.color || '000000';
      return {opacity: 1, color: color.charAt(0) == '#' ? color : ('#' + color)};
    },
    pointToLayer: IVB.addStop,
    onEachFeature: IVB.bindPopup
  }).addTo(IVB.layers[lineref] || IVB.map);
  if (!IVB.layers[lineref]) {
    IVB.layers[lineref] = layer;
    IVB.map.getControl().addOverlay(layer, 'Linie ' + lineref);
  }
};

// Displaying of points, e.g., halts
IVB.addStop = function (data, latlng) {
  // Adapt handling of duplicate stations of same line
  if (data.tags && data.tags.name && data.id != 287054151) {
    var id = [data.reltags.ref, data.tags.name].join('/');
    if (!IVB.halts[id]) {
      // Adapt css classes of halt name
      var className = [
        'leaflet-div-icon', 'L' + data.reltags.ref,
        data.tags && data.tags.name ? data.tags.name.replace(/\/| /g, '-').replace(/\(|\)/g, '') : ''].join(' ');
        // Add halt name as DivIcon
        L.marker(latlng, {
          icon: L.divIcon({className: className, html: data.tags.name || ''})
        }).addTo(IVB.layers.stopLabels);
        IVB.halts[id] = true;
    }
  }
  // Add/return halt as CircleMarker
  return typeof data.angle === 'undefined'
  ? new L.CircleMarker(latlng, {fillOpacity: 1, weight: 0}).setRadius(4)
  : new L.SemicircleMarker(latlng, {fillOpacity: 1, weight: 0}).setRadius(8).setAngle(-1 * data.angle);
};

IVB.bindPopup = function (p, l) {
  // Adapt popup
  l.bindPopup('<img style="width:27px; height:27px" src="http://efa.ivb.at/ivb/images/buttons/ivb_button_'
    + p.reltags.ref.toLowerCase() + '.png">'
    + (p.tags && p.tags.name ? '&nbsp;' + p.tags.name : '')
  );
};
