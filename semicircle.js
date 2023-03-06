L.Semicircle = L.Circle.extend({
  setAngle(angle) {
    this._angle = angle;
    return this.redraw();
  },
  getAngle() {
    return this._angle;
  },
  getPathString() {
    var p = this._point;
    var r = this._radius;

    this._path.setAttribute('transform', `rotate(${[this._angle + 90, p.x, p.y].join(',')})`);

    if (this._checkIfEmpty()) {
      return '';
    } else if (L.Browser.svg) {
      return `M${p.x},${p.y - r}A${r},${r},0,1,1,${p.x},${p.y + r}`;
    } else {
      //TODO: adapt
      p._round();
      r = Math.round(r);
      return `AL ${p.x},${p.y} ${r},${r} 0,${65535 * 360}`;
    }
  },
});

L.SemicircleMarker = L.Semicircle.extend({
  options: {
    radius: 10,
    weight: 2,
    angle: 0,
  },
  initialize(latlng, options) {
    L.Semicircle.prototype.initialize.call(this, latlng, null, options);
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
});
