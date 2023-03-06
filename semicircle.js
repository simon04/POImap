L.SemicircleMarker = L.CircleMarker.extend({
  options: {
    radius: 10,
    weight: 2,
    angle: 0,
  },
  initialize(latlng, options) {
    L.CircleMarker.prototype.initialize.call(this, latlng, null, options);
    this._radius = this.options.radius;
    this._angle = this.options.angle;
  },
  projectLatlngs() {
    this._point = this._map.latLngToLayerPoint(this._latlng);
  },
  setRadius(radius) {
    this._radius = radius;
    return this.redraw();
  },
  setAngle(angle) {
    this._angle = angle;
    return this.redraw();
  },
  _updatePath() {
    var p = this._point;
    var r = this._radius;
    this._path.setAttribute('d', `M${p.x},${p.y - r}A${r},${r},0,1,1,${p.x},${p.y + r}`);
    this._path.setAttribute('transform', `rotate(${[this._angle + 90, p.x, p.y].join(',')})`);
  },
});
