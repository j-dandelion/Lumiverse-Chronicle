// node_modules/preact/dist/preact.module.js
var n;
var l;
var u;
var t;
var i;
var r;
var o;
var e;
var f;
var c;
var a;
var s;
var h;
var p;
var v;
var y;
var d = {};
var w = [];
var _ = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
var g = Array.isArray;
function m(n2, l2) {
  for (var u2 in l2)
    n2[u2] = l2[u2];
  return n2;
}
function b(n2) {
  n2 && n2.parentNode && n2.parentNode.removeChild(n2);
}
function k(l2, u2, t2) {
  var i2, r2, o2, e2 = {};
  for (o2 in u2)
    o2 == "key" ? i2 = u2[o2] : o2 == "ref" ? r2 = u2[o2] : e2[o2] = u2[o2];
  if (arguments.length > 2 && (e2.children = arguments.length > 3 ? n.call(arguments, 2) : t2), typeof l2 == "function" && l2.defaultProps != null)
    for (o2 in l2.defaultProps)
      e2[o2] === undefined && (e2[o2] = l2.defaultProps[o2]);
  return x(l2, e2, i2, r2, null);
}
function x(n2, t2, i2, r2, o2) {
  var e2 = { type: n2, props: t2, key: i2, ref: r2, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: undefined, __v: o2 == null ? ++u : o2, __i: -1, __u: 0 };
  return o2 == null && l.vnode != null && l.vnode(e2), e2;
}
function S(n2) {
  return n2.children;
}
function C(n2, l2) {
  this.props = n2, this.context = l2;
}
function $(n2, l2) {
  if (l2 == null)
    return n2.__ ? $(n2.__, n2.__i + 1) : null;
  for (var u2;l2 < n2.__k.length; l2++)
    if ((u2 = n2.__k[l2]) != null && u2.__e != null)
      return u2.__e;
  return typeof n2.type == "function" ? $(n2) : null;
}
function I(n2) {
  if (n2.__P && n2.__d) {
    var u2 = n2.__v, t2 = u2.__e, i2 = [], r2 = [], o2 = m({}, u2);
    o2.__v = u2.__v + 1, l.vnode && l.vnode(o2), q(n2.__P, o2, u2, n2.__n, n2.__P.namespaceURI, 32 & u2.__u ? [t2] : null, i2, t2 == null ? $(u2) : t2, !!(32 & u2.__u), r2), o2.__v = u2.__v, o2.__.__k[o2.__i] = o2, D(i2, o2, r2), u2.__e = u2.__ = null, o2.__e != t2 && P(o2);
  }
}
function P(n2) {
  if ((n2 = n2.__) != null && n2.__c != null)
    return n2.__e = n2.__c.base = null, n2.__k.some(function(l2) {
      if (l2 != null && l2.__e != null)
        return n2.__e = n2.__c.base = l2.__e;
    }), P(n2);
}
function A(n2) {
  (!n2.__d && (n2.__d = true) && i.push(n2) && !H.__r++ || r != l.debounceRendering) && ((r = l.debounceRendering) || o)(H);
}
function H() {
  try {
    for (var n2, l2 = 1;i.length; )
      i.length > l2 && i.sort(e), n2 = i.shift(), l2 = i.length, I(n2);
  } finally {
    i.length = H.__r = 0;
  }
}
function L(n2, l2, u2, t2, i2, r2, o2, e2, f2, c2, a2) {
  var s2, h2, p2, v2, y2, _2, g2, m2 = t2 && t2.__k || w, b2 = l2.length;
  for (f2 = T(u2, l2, m2, f2, b2), s2 = 0;s2 < b2; s2++)
    (p2 = u2.__k[s2]) != null && (h2 = p2.__i != -1 && m2[p2.__i] || d, p2.__i = s2, _2 = q(n2, p2, h2, i2, r2, o2, e2, f2, c2, a2), v2 = p2.__e, p2.ref && h2.ref != p2.ref && (h2.ref && J(h2.ref, null, p2), a2.push(p2.ref, p2.__c || v2, p2)), y2 == null && v2 != null && (y2 = v2), (g2 = !!(4 & p2.__u)) || h2.__k === p2.__k ? (f2 = j(p2, f2, n2, g2), g2 && h2.__e && (h2.__e = null)) : typeof p2.type == "function" && _2 !== undefined ? f2 = _2 : v2 && (f2 = v2.nextSibling), p2.__u &= -7);
  return u2.__e = y2, f2;
}
function T(n2, l2, u2, t2, i2) {
  var r2, o2, e2, f2, c2, a2 = u2.length, s2 = a2, h2 = 0;
  for (n2.__k = new Array(i2), r2 = 0;r2 < i2; r2++)
    (o2 = l2[r2]) != null && typeof o2 != "boolean" && typeof o2 != "function" ? (typeof o2 == "string" || typeof o2 == "number" || typeof o2 == "bigint" || o2.constructor == String ? o2 = n2.__k[r2] = x(null, o2, null, null, null) : g(o2) ? o2 = n2.__k[r2] = x(S, { children: o2 }, null, null, null) : o2.constructor === undefined && o2.__b > 0 ? o2 = n2.__k[r2] = x(o2.type, o2.props, o2.key, o2.ref ? o2.ref : null, o2.__v) : n2.__k[r2] = o2, f2 = r2 + h2, o2.__ = n2, o2.__b = n2.__b + 1, e2 = null, (c2 = o2.__i = O(o2, u2, f2, s2)) != -1 && (s2--, (e2 = u2[c2]) && (e2.__u |= 2)), e2 == null || e2.__v == null ? (c2 == -1 && (i2 > a2 ? h2-- : i2 < a2 && h2++), typeof o2.type != "function" && (o2.__u |= 4)) : c2 != f2 && (c2 == f2 - 1 ? h2-- : c2 == f2 + 1 ? h2++ : (c2 > f2 ? h2-- : h2++, o2.__u |= 4))) : n2.__k[r2] = null;
  if (s2)
    for (r2 = 0;r2 < a2; r2++)
      (e2 = u2[r2]) != null && (2 & e2.__u) == 0 && (e2.__e == t2 && (t2 = $(e2)), K(e2, e2));
  return t2;
}
function j(n2, l2, u2, t2) {
  var i2, r2;
  if (typeof n2.type == "function") {
    for (i2 = n2.__k, r2 = 0;i2 && r2 < i2.length; r2++)
      i2[r2] && (i2[r2].__ = n2, l2 = j(i2[r2], l2, u2, t2));
    return l2;
  }
  n2.__e != l2 && (t2 && (l2 && n2.type && !l2.parentNode && (l2 = $(n2)), u2.insertBefore(n2.__e, l2 || null)), l2 = n2.__e);
  do {
    l2 = l2 && l2.nextSibling;
  } while (l2 != null && l2.nodeType == 8);
  return l2;
}
function O(n2, l2, u2, t2) {
  var i2, r2, o2, e2 = n2.key, f2 = n2.type, c2 = l2[u2], a2 = c2 != null && (2 & c2.__u) == 0;
  if (c2 === null && e2 == null || a2 && e2 == c2.key && f2 == c2.type)
    return u2;
  if (t2 > (a2 ? 1 : 0)) {
    for (i2 = u2 - 1, r2 = u2 + 1;i2 >= 0 || r2 < l2.length; )
      if ((c2 = l2[o2 = i2 >= 0 ? i2-- : r2++]) != null && (2 & c2.__u) == 0 && e2 == c2.key && f2 == c2.type)
        return o2;
  }
  return -1;
}
function z(n2, l2, u2) {
  l2[0] == "-" ? n2.setProperty(l2, u2 == null ? "" : u2) : n2[l2] = u2 == null ? "" : typeof u2 != "number" || _.test(l2) ? u2 : u2 + "px";
}
function N(n2, l2, u2, t2, i2) {
  var r2, o2;
  n:
    if (l2 == "style")
      if (typeof u2 == "string")
        n2.style.cssText = u2;
      else {
        if (typeof t2 == "string" && (n2.style.cssText = t2 = ""), t2)
          for (l2 in t2)
            u2 && l2 in u2 || z(n2.style, l2, "");
        if (u2)
          for (l2 in u2)
            t2 && u2[l2] == t2[l2] || z(n2.style, l2, u2[l2]);
      }
    else if (l2[0] == "o" && l2[1] == "n")
      r2 = l2 != (l2 = l2.replace(s, "$1")), o2 = l2.toLowerCase(), l2 = o2 in n2 || l2 == "onFocusOut" || l2 == "onFocusIn" ? o2.slice(2) : l2.slice(2), n2.l || (n2.l = {}), n2.l[l2 + r2] = u2, u2 ? t2 ? u2[a] = t2[a] : (u2[a] = h, n2.addEventListener(l2, r2 ? v : p, r2)) : n2.removeEventListener(l2, r2 ? v : p, r2);
    else {
      if (i2 == "http://www.w3.org/2000/svg")
        l2 = l2.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if (l2 != "width" && l2 != "height" && l2 != "href" && l2 != "list" && l2 != "form" && l2 != "tabIndex" && l2 != "download" && l2 != "rowSpan" && l2 != "colSpan" && l2 != "role" && l2 != "popover" && l2 in n2)
        try {
          n2[l2] = u2 == null ? "" : u2;
          break n;
        } catch (n3) {}
      typeof u2 == "function" || (u2 == null || u2 === false && l2[4] != "-" ? n2.removeAttribute(l2) : n2.setAttribute(l2, l2 == "popover" && u2 == 1 ? "" : u2));
    }
}
function V(n2) {
  return function(u2) {
    if (this.l) {
      var t2 = this.l[u2.type + n2];
      if (u2[c] == null)
        u2[c] = h++;
      else if (u2[c] < t2[a])
        return;
      return t2(l.event ? l.event(u2) : u2);
    }
  };
}
function q(n2, u2, t2, i2, r2, o2, e2, f2, c2, a2) {
  var s2, h2, p2, v2, y2, d2, _2, k2, x2, M, $2, I2, P2, A2, H2, T2 = u2.type;
  if (u2.constructor !== undefined)
    return null;
  128 & t2.__u && (c2 = !!(32 & t2.__u), o2 = [f2 = u2.__e = t2.__e]), (s2 = l.__b) && s2(u2);
  n:
    if (typeof T2 == "function")
      try {
        if (k2 = u2.props, x2 = T2.prototype && T2.prototype.render, M = (s2 = T2.contextType) && i2[s2.__c], $2 = s2 ? M ? M.props.value : s2.__ : i2, t2.__c ? _2 = (h2 = u2.__c = t2.__c).__ = h2.__E : (x2 ? u2.__c = h2 = new T2(k2, $2) : (u2.__c = h2 = new C(k2, $2), h2.constructor = T2, h2.render = Q), M && M.sub(h2), h2.state || (h2.state = {}), h2.__n = i2, p2 = h2.__d = true, h2.__h = [], h2._sb = []), x2 && h2.__s == null && (h2.__s = h2.state), x2 && T2.getDerivedStateFromProps != null && (h2.__s == h2.state && (h2.__s = m({}, h2.__s)), m(h2.__s, T2.getDerivedStateFromProps(k2, h2.__s))), v2 = h2.props, y2 = h2.state, h2.__v = u2, p2)
          x2 && T2.getDerivedStateFromProps == null && h2.componentWillMount != null && h2.componentWillMount(), x2 && h2.componentDidMount != null && h2.__h.push(h2.componentDidMount);
        else {
          if (x2 && T2.getDerivedStateFromProps == null && k2 !== v2 && h2.componentWillReceiveProps != null && h2.componentWillReceiveProps(k2, $2), u2.__v == t2.__v || !h2.__e && h2.shouldComponentUpdate != null && h2.shouldComponentUpdate(k2, h2.__s, $2) === false) {
            u2.__v != t2.__v && (h2.props = k2, h2.state = h2.__s, h2.__d = false), u2.__e = t2.__e, u2.__k = t2.__k, u2.__k.some(function(n3) {
              n3 && (n3.__ = u2);
            }), w.push.apply(h2.__h, h2._sb), h2._sb = [], h2.__h.length && e2.push(h2);
            break n;
          }
          h2.componentWillUpdate != null && h2.componentWillUpdate(k2, h2.__s, $2), x2 && h2.componentDidUpdate != null && h2.__h.push(function() {
            h2.componentDidUpdate(v2, y2, d2);
          });
        }
        if (h2.context = $2, h2.props = k2, h2.__P = n2, h2.__e = false, I2 = l.__r, P2 = 0, x2)
          h2.state = h2.__s, h2.__d = false, I2 && I2(u2), s2 = h2.render(h2.props, h2.state, h2.context), w.push.apply(h2.__h, h2._sb), h2._sb = [];
        else
          do {
            h2.__d = false, I2 && I2(u2), s2 = h2.render(h2.props, h2.state, h2.context), h2.state = h2.__s;
          } while (h2.__d && ++P2 < 25);
        h2.state = h2.__s, h2.getChildContext != null && (i2 = m(m({}, i2), h2.getChildContext())), x2 && !p2 && h2.getSnapshotBeforeUpdate != null && (d2 = h2.getSnapshotBeforeUpdate(v2, y2)), A2 = s2 != null && s2.type === S && s2.key == null ? E(s2.props.children) : s2, f2 = L(n2, g(A2) ? A2 : [A2], u2, t2, i2, r2, o2, e2, f2, c2, a2), h2.base = u2.__e, u2.__u &= -161, h2.__h.length && e2.push(h2), _2 && (h2.__E = h2.__ = null);
      } catch (n3) {
        if (u2.__v = null, c2 || o2 != null)
          if (n3.then) {
            for (u2.__u |= c2 ? 160 : 128;f2 && f2.nodeType == 8 && f2.nextSibling; )
              f2 = f2.nextSibling;
            o2[o2.indexOf(f2)] = null, u2.__e = f2;
          } else {
            for (H2 = o2.length;H2--; )
              b(o2[H2]);
            B(u2);
          }
        else
          u2.__e = t2.__e, u2.__k = t2.__k, n3.then || B(u2);
        l.__e(n3, u2, t2);
      }
    else
      o2 == null && u2.__v == t2.__v ? (u2.__k = t2.__k, u2.__e = t2.__e) : f2 = u2.__e = G(t2.__e, u2, t2, i2, r2, o2, e2, c2, a2);
  return (s2 = l.diffed) && s2(u2), 128 & u2.__u ? undefined : f2;
}
function B(n2) {
  n2 && (n2.__c && (n2.__c.__e = true), n2.__k && n2.__k.some(B));
}
function D(n2, u2, t2) {
  for (var i2 = 0;i2 < t2.length; i2++)
    J(t2[i2], t2[++i2], t2[++i2]);
  l.__c && l.__c(u2, n2), n2.some(function(u3) {
    try {
      n2 = u3.__h, u3.__h = [], n2.some(function(n3) {
        n3.call(u3);
      });
    } catch (n3) {
      l.__e(n3, u3.__v);
    }
  });
}
function E(n2) {
  return typeof n2 != "object" || n2 == null || n2.__b > 0 ? n2 : g(n2) ? n2.map(E) : n2.constructor !== undefined ? null : m({}, n2);
}
function G(u2, t2, i2, r2, o2, e2, f2, c2, a2) {
  var s2, h2, p2, v2, y2, w2, _2, m2 = i2.props || d, k2 = t2.props, x2 = t2.type;
  if (x2 == "svg" ? o2 = "http://www.w3.org/2000/svg" : x2 == "math" ? o2 = "http://www.w3.org/1998/Math/MathML" : o2 || (o2 = "http://www.w3.org/1999/xhtml"), e2 != null) {
    for (s2 = 0;s2 < e2.length; s2++)
      if ((y2 = e2[s2]) && "setAttribute" in y2 == !!x2 && (x2 ? y2.localName == x2 : y2.nodeType == 3)) {
        u2 = y2, e2[s2] = null;
        break;
      }
  }
  if (u2 == null) {
    if (x2 == null)
      return document.createTextNode(k2);
    u2 = document.createElementNS(o2, x2, k2.is && k2), c2 && (l.__m && l.__m(t2, e2), c2 = false), e2 = null;
  }
  if (x2 == null)
    m2 === k2 || c2 && u2.data == k2 || (u2.data = k2);
  else {
    if (e2 = x2 == "textarea" && k2.defaultValue != null ? null : e2 && n.call(u2.childNodes), !c2 && e2 != null)
      for (m2 = {}, s2 = 0;s2 < u2.attributes.length; s2++)
        m2[(y2 = u2.attributes[s2]).name] = y2.value;
    for (s2 in m2)
      y2 = m2[s2], s2 == "dangerouslySetInnerHTML" ? p2 = y2 : s2 == "children" || (s2 in k2) || s2 == "value" && ("defaultValue" in k2) || s2 == "checked" && ("defaultChecked" in k2) || N(u2, s2, null, y2, o2);
    for (s2 in k2)
      y2 = k2[s2], s2 == "children" ? v2 = y2 : s2 == "dangerouslySetInnerHTML" ? h2 = y2 : s2 == "value" ? w2 = y2 : s2 == "checked" ? _2 = y2 : c2 && typeof y2 != "function" || m2[s2] === y2 || N(u2, s2, y2, m2[s2], o2);
    if (h2)
      c2 || p2 && (h2.__html == p2.__html || h2.__html == u2.innerHTML) || (u2.innerHTML = h2.__html), t2.__k = [];
    else if (p2 && (u2.innerHTML = ""), L(t2.type == "template" ? u2.content : u2, g(v2) ? v2 : [v2], t2, i2, r2, x2 == "foreignObject" ? "http://www.w3.org/1999/xhtml" : o2, e2, f2, e2 ? e2[0] : i2.__k && $(i2, 0), c2, a2), e2 != null)
      for (s2 = e2.length;s2--; )
        b(e2[s2]);
    c2 && x2 != "textarea" || (s2 = "value", x2 == "progress" && w2 == null ? u2.removeAttribute("value") : w2 != null && (w2 !== u2[s2] || x2 == "progress" && !w2 || x2 == "option" && w2 != m2[s2]) && N(u2, s2, w2, m2[s2], o2), s2 = "checked", _2 != null && _2 != u2[s2] && N(u2, s2, _2, m2[s2], o2));
  }
  return u2;
}
function J(n2, u2, t2) {
  try {
    if (typeof n2 == "function") {
      var i2 = typeof n2.__u == "function";
      i2 && n2.__u(), i2 && u2 == null || (n2.__u = n2(u2));
    } else
      n2.current = u2;
  } catch (n3) {
    l.__e(n3, t2);
  }
}
function K(n2, u2, t2) {
  var i2, r2;
  if (l.unmount && l.unmount(n2), (i2 = n2.ref) && (i2.current && i2.current != n2.__e || J(i2, null, u2)), (i2 = n2.__c) != null) {
    if (i2.componentWillUnmount)
      try {
        i2.componentWillUnmount();
      } catch (n3) {
        l.__e(n3, u2);
      }
    i2.base = i2.__P = null;
  }
  if (i2 = n2.__k)
    for (r2 = 0;r2 < i2.length; r2++)
      i2[r2] && K(i2[r2], u2, t2 || typeof n2.type != "function");
  t2 || b(n2.__e), n2.__c = n2.__ = n2.__e = undefined;
}
function Q(n2, l2, u2) {
  return this.constructor(n2, u2);
}
function R(u2, t2, i2) {
  var r2, o2, e2, f2;
  t2 == document && (t2 = document.documentElement), l.__ && l.__(u2, t2), o2 = (r2 = typeof i2 == "function") ? null : i2 && i2.__k || t2.__k, e2 = [], f2 = [], q(t2, u2 = (!r2 && i2 || t2).__k = k(S, null, [u2]), o2 || d, d, t2.namespaceURI, !r2 && i2 ? [i2] : o2 ? null : t2.firstChild ? n.call(t2.childNodes) : null, e2, !r2 && i2 ? i2 : o2 ? o2.__e : t2.firstChild, r2, f2), D(e2, u2, f2);
}
function X(n2) {
  function l2(n3) {
    var u2, t2;
    return this.getChildContext || (u2 = new Set, (t2 = {})[l2.__c] = this, this.getChildContext = function() {
      return t2;
    }, this.componentWillUnmount = function() {
      u2 = null;
    }, this.shouldComponentUpdate = function(n4) {
      this.props.value != n4.value && u2.forEach(function(n5) {
        n5.__e = true, A(n5);
      });
    }, this.sub = function(n4) {
      u2.add(n4);
      var l3 = n4.componentWillUnmount;
      n4.componentWillUnmount = function() {
        u2 && u2.delete(n4), l3 && l3.call(n4);
      };
    }), n3.children;
  }
  return l2.__c = "__cC" + y++, l2.__ = n2, l2.Provider = l2.__l = (l2.Consumer = function(n3, l3) {
    return n3.children(l3);
  }).contextType = l2, l2;
}
n = w.slice, l = { __e: function(n2, l2, u2, t2) {
  for (var i2, r2, o2;l2 = l2.__; )
    if ((i2 = l2.__c) && !i2.__)
      try {
        if ((r2 = i2.constructor) && r2.getDerivedStateFromError != null && (i2.setState(r2.getDerivedStateFromError(n2)), o2 = i2.__d), i2.componentDidCatch != null && (i2.componentDidCatch(n2, t2 || {}), o2 = i2.__d), o2)
          return i2.__E = i2;
      } catch (l3) {
        n2 = l3;
      }
  throw n2;
} }, u = 0, t = function(n2) {
  return n2 != null && n2.constructor === undefined;
}, C.prototype.setState = function(n2, l2) {
  var u2;
  u2 = this.__s != null && this.__s != this.state ? this.__s : this.__s = m({}, this.state), typeof n2 == "function" && (n2 = n2(m({}, u2), this.props)), n2 && m(u2, n2), n2 != null && this.__v && (l2 && this._sb.push(l2), A(this));
}, C.prototype.forceUpdate = function(n2) {
  this.__v && (this.__e = true, n2 && this.__h.push(n2), A(this));
}, C.prototype.render = S, i = [], o = typeof Promise == "function" ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e = function(n2, l2) {
  return n2.__v.__b - l2.__v.__b;
}, H.__r = 0, f = Math.random().toString(8), c = "__d" + f, a = "__a" + f, s = /(PointerCapture)$|Capture$/i, h = 0, p = V(false), v = V(true), y = 0;

// node_modules/preact/hooks/dist/hooks.module.js
var t2;
var r2;
var u2;
var i2;
var o2 = 0;
var f2 = [];
var c2 = l;
var e2 = c2.__b;
var a2 = c2.__r;
var v2 = c2.diffed;
var l2 = c2.__c;
var m2 = c2.unmount;
var s2 = c2.__;
function p2(n2, t3) {
  c2.__h && c2.__h(r2, n2, o2 || t3), o2 = 0;
  var u3 = r2.__H || (r2.__H = { __: [], __h: [] });
  return n2 >= u3.__.length && u3.__.push({}), u3.__[n2];
}
function d2(n2) {
  return o2 = 1, h2(D2, n2);
}
function h2(n2, u3, i3) {
  var o3 = p2(t2++, 2);
  if (o3.t = n2, !o3.__c && (o3.__ = [i3 ? i3(u3) : D2(undefined, u3), function(n3) {
    var t3 = o3.__N ? o3.__N[0] : o3.__[0], r3 = o3.t(t3, n3);
    t3 !== r3 && (o3.__N = [r3, o3.__[1]], o3.__c.setState({}));
  }], o3.__c = r2, !r2.__f)) {
    var f3 = function(n3, t3, r3) {
      if (!o3.__c.__H)
        return true;
      var u4 = o3.__c.__H.__.filter(function(n4) {
        return n4.__c;
      });
      if (u4.every(function(n4) {
        return !n4.__N;
      }))
        return !c3 || c3.call(this, n3, t3, r3);
      var i4 = o3.__c.props !== n3;
      return u4.some(function(n4) {
        if (n4.__N) {
          var t4 = n4.__[0];
          n4.__ = n4.__N, n4.__N = undefined, t4 !== n4.__[0] && (i4 = true);
        }
      }), c3 && c3.call(this, n3, t3, r3) || i4;
    };
    r2.__f = true;
    var { shouldComponentUpdate: c3, componentWillUpdate: e3 } = r2;
    r2.componentWillUpdate = function(n3, t3, r3) {
      if (this.__e) {
        var u4 = c3;
        c3 = undefined, f3(n3, t3, r3), c3 = u4;
      }
      e3 && e3.call(this, n3, t3, r3);
    }, r2.shouldComponentUpdate = f3;
  }
  return o3.__N || o3.__;
}
function y2(n2, u3) {
  var i3 = p2(t2++, 3);
  !c2.__s && C2(i3.__H, u3) && (i3.__ = n2, i3.u = u3, r2.__H.__h.push(i3));
}
function A2(n2) {
  return o2 = 5, T2(function() {
    return { current: n2 };
  }, []);
}
function T2(n2, r3) {
  var u3 = p2(t2++, 7);
  return C2(u3.__H, r3) && (u3.__ = n2(), u3.__H = r3, u3.__h = n2), u3.__;
}
function q2(n2, t3) {
  return o2 = 8, T2(function() {
    return n2;
  }, t3);
}
function x2(n2) {
  var u3 = r2.context[n2.__c], i3 = p2(t2++, 9);
  return i3.c = n2, u3 ? (i3.__ == null && (i3.__ = true, u3.sub(r2)), u3.props.value) : n2.__;
}
function j2() {
  for (var n2;n2 = f2.shift(); ) {
    var t3 = n2.__H;
    if (n2.__P && t3)
      try {
        t3.__h.some(z2), t3.__h.some(B2), t3.__h = [];
      } catch (r3) {
        t3.__h = [], c2.__e(r3, n2.__v);
      }
  }
}
c2.__b = function(n2) {
  r2 = null, e2 && e2(n2);
}, c2.__ = function(n2, t3) {
  n2 && t3.__k && t3.__k.__m && (n2.__m = t3.__k.__m), s2 && s2(n2, t3);
}, c2.__r = function(n2) {
  a2 && a2(n2), t2 = 0;
  var i3 = (r2 = n2.__c).__H;
  i3 && (u2 === r2 ? (i3.__h = [], r2.__h = [], i3.__.some(function(n3) {
    n3.__N && (n3.__ = n3.__N), n3.u = n3.__N = undefined;
  })) : (i3.__h.some(z2), i3.__h.some(B2), i3.__h = [], t2 = 0)), u2 = r2;
}, c2.diffed = function(n2) {
  v2 && v2(n2);
  var t3 = n2.__c;
  t3 && t3.__H && (t3.__H.__h.length && (f2.push(t3) !== 1 && i2 === c2.requestAnimationFrame || ((i2 = c2.requestAnimationFrame) || w2)(j2)), t3.__H.__.some(function(n3) {
    n3.u && (n3.__H = n3.u), n3.u = undefined;
  })), u2 = r2 = null;
}, c2.__c = function(n2, t3) {
  t3.some(function(n3) {
    try {
      n3.__h.some(z2), n3.__h = n3.__h.filter(function(n4) {
        return !n4.__ || B2(n4);
      });
    } catch (r3) {
      t3.some(function(n4) {
        n4.__h && (n4.__h = []);
      }), t3 = [], c2.__e(r3, n3.__v);
    }
  }), l2 && l2(n2, t3);
}, c2.unmount = function(n2) {
  m2 && m2(n2);
  var t3, r3 = n2.__c;
  r3 && r3.__H && (r3.__H.__.some(function(n3) {
    try {
      z2(n3);
    } catch (n4) {
      t3 = n4;
    }
  }), r3.__H = undefined, t3 && c2.__e(t3, r3.__v));
};
var k2 = typeof requestAnimationFrame == "function";
function w2(n2) {
  var t3, r3 = function() {
    clearTimeout(u3), k2 && cancelAnimationFrame(t3), setTimeout(n2);
  }, u3 = setTimeout(r3, 35);
  k2 && (t3 = requestAnimationFrame(r3));
}
function z2(n2) {
  var t3 = r2, u3 = n2.__c;
  typeof u3 == "function" && (n2.__c = undefined, u3()), r2 = t3;
}
function B2(n2) {
  var t3 = r2;
  n2.__c = n2.__(), r2 = t3;
}
function C2(n2, t3) {
  return !n2 || n2.length !== t3.length || t3.some(function(t4, r3) {
    return t4 !== n2[r3];
  });
}
function D2(n2, t3) {
  return typeof t3 == "function" ? t3(n2) : t3;
}

// src/context.ts
var ChronicleContext = X(null);
function useChronicleCtx() {
  return x2(ChronicleContext);
}

// src/styles.ts
function injectStyles() {
  const style = document.createElement("style");
  style.setAttribute("data-chronicle", "styles");
  style.textContent = getChronicleCSS();
  document.head.appendChild(style);
  return () => style.remove();
}
function getChronicleCSS() {
  return `
    /* ── Chronicle Design Tokens ────────────────────────── */
    :root {
      --chronicle-error-bg: rgba(239, 68, 68, 0.1);
      --chronicle-error-border: rgba(252, 165, 165, 0.25);
      --chronicle-error-text: rgb(252, 165, 165);
      --chronicle-success-text: rgb(74, 222, 128);
      --chronicle-overlay-bg: rgba(0, 0, 0, 0.5);
    }

    /* ── Summarize Button ─────────────────────────────────── */
    [data-chronicle="summarize-btn"] {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .chronicle-summarize-btn {
      background: var(--lumiverse-primary-015);
      border: 1px solid var(--lumiverse-primary-050);
      color: var(--lumiverse-primary);
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: background var(--lumiverse-transition-fast), border-color var(--lumiverse-transition-fast);
    }
    .chronicle-summarize-btn:hover:not(:disabled) {
      background: var(--lumiverse-primary-030);
    }
    .chronicle-summarize-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .chronicle-summarize-spinner {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid var(--lumiverse-primary-020);
      border-top-color: var(--lumiverse-primary);
      border-radius: 50%;
      animation: chronicle-spin 0.6s linear infinite;
    }
    @keyframes chronicle-spin {
      to { transform: rotate(360deg); }
    }

    /* ── Prompt Manager ─────────────────────────────── */
    [data-chronicle="prompt-manager"] {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 4px;
      border-top: 1px solid var(--lumiverse-border);
      padding-top: 8px;
    }
    .chronicle-pm-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .chronicle-pm-label {
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text-dim);
      font-weight: 500;
    }
    .chronicle-pm-select {
      background: var(--lumiverse-fill-hover);
      border: 1px solid var(--lumiverse-border);
      color: var(--lumiverse-text);
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      padding: 6px 8px;
      border-radius: 6px;
      cursor: pointer;
    }
    .chronicle-pm-textarea {
      background: var(--lumiverse-fill-hover);
      border: 1px solid var(--lumiverse-border);
      color: var(--lumiverse-text);
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      padding: 8px;
      border-radius: 6px;
      resize: vertical;
      min-height: 160px;
      width: 100%;
      box-sizing: border-box;
      font-family: var(--lumiverse-font-mono);
      line-height: 1.4;
    }
    .chronicle-pm-textarea:focus {
      outline: none;
      border-color: var(--lumiverse-primary);
    }
    .chronicle-pm-params {
      margin-top: 12px;
      padding: 10px 12px;
      background: var(--lumiverse-fill-hover);
      border: 1px solid var(--lumiverse-border);
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .chronicle-pm-params-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .chronicle-pm-params-row .chronicle-pm-label {
      min-width: 110px;
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      margin: 0;
    }
    .chronicle-pm-params-val {
      color: var(--lumiverse-text-dim);
      font-weight: 500;
      margin-left: 2px;
    }
    .chronicle-pm-range {
      flex: 1;
      accent-color: var(--lumiverse-primary);
    }
    .chronicle-pm-details {
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
    }
    .chronicle-pm-preview-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
    }
    .chronicle-pm-preview-section {
      width: 100%;
    }
    .chronicle-pm-preview-section .chronicle-pm-pre,
    .chronicle-pm-preview-section .chronicle-pm-textarea {
      margin-top: 8px;
    }
    .chronicle-pm-preview-bar .chronicle-pm-toolbar {
      margin-left: auto;
    }
    .chronicle-pm-summary {
      cursor: pointer;
      color: var(--lumiverse-text-dim);
      user-select: none;
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
    }
    .chronicle-pm-pre {
      background: var(--lumiverse-bg-deep);
      border: 1px solid var(--lumiverse-border);
      border-radius: 6px;
      padding: 8px;
      margin-top: 4px;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: calc(10px * var(--lumiverse-font-scale, 1));
      max-height: 150px;
      overflow-y: auto;
      font-family: var(--lumiverse-font-mono);
    }
    .chronicle-summarize-action-btn {
      background: var(--lumiverse-primary-015);
      border: 1px solid var(--lumiverse-primary-050);
      color: var(--lumiverse-primary);
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: background var(--lumiverse-transition-fast);
      flex: 1;
      min-width: 140px;
    }
    .chronicle-summarize-action-btn:hover:not(:disabled) {
      background: var(--lumiverse-primary-030);
    }
    .chronicle-summarize-action-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .chronicle-pm-toolbar {
      display: flex;
      gap: 4px;
    }
    .chronicle-pm-tool-btn {
      background: var(--lumiverse-fill-subtle);
      border: 1px solid var(--lumiverse-border);
      color: var(--lumiverse-text-dim);
      font-size: calc(10px * var(--lumiverse-font-scale, 1));
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: background var(--lumiverse-transition-fast);
    }
    .chronicle-pm-tool-btn:hover:not(:disabled) {
      background: var(--lumiverse-fill-hover);
      color: var(--lumiverse-text);
    }
    .chronicle-pm-tool-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .chronicle-pm-delete-btn {
      background: var(--chronicle-error-bg);
      color: var(--chronicle-error-text);
      border: 1px solid var(--chronicle-error-border);
      font-size: calc(10px * var(--lumiverse-font-scale, 1));
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: background var(--lumiverse-transition-fast);
    }
    .chronicle-pm-delete-btn:hover:not(:disabled) {
      background: var(--chronicle-error-bg);
      filter: brightness(1.3);
    }
    .chronicle-pm-delete-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .chronicle-pm-error { font-size: calc(11px * var(--lumiverse-font-scale, 1)); color: var(--chronicle-error-text); }
    .chronicle-pm-warning {
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text-subtle);
      background: var(--lumiverse-fill-hover);
      border: 1px solid var(--lumiverse-border);
      border-radius: 6px;
      padding: 6px 10px;
      margin-bottom: 8px;
    }
    .chronicle-pm-overlay {
      position: fixed; inset: 0;
      background: var(--chronicle-overlay-bg);
      display: flex; align-items: center; justify-content: center;
      z-index: 10000;
    }
    .chronicle-pm-dialog {
      background: var(--lumiverse-bg);
      border: 1px solid var(--lumiverse-border);
      border-radius: 12px;
      padding: 20px;
      min-width: 300px;
      max-width: 400px;
    }
    .chronicle-pm-dialog h4 { margin: 0 0 12px 0; font-size: calc(14px * var(--lumiverse-font-scale, 1)); }
    .chronicle-pm-input {
      width: 100%;
      background: var(--lumiverse-fill-hover);
      border: 1px solid var(--lumiverse-border);
      color: var(--lumiverse-text);
      caret-color: var(--lumiverse-text);
      font-size: calc(13px * var(--lumiverse-font-scale, 1));
      padding: 8px 10px;
      border-radius: 6px;
      box-sizing: border-box;
    }
    .chronicle-pm-input:focus {
      outline: none;
      border-color: var(--lumiverse-primary);
      box-shadow: 0 0 0 2px var(--lumiverse-primary-010);
    }
    .chronicle-pm-dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
    .chronicle-pm-dialog-btn {
      padding: 6px 14px; border-radius: 6px; cursor: pointer;
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill-subtle);
      color: var(--lumiverse-text);
    }
    .chronicle-pm-dialog-primary {
      background: var(--lumiverse-primary-010);
      border-color: var(--lumiverse-primary);
      color: var(--lumiverse-primary);
    }

    /* ── Summarize Flow ──────────────────────────────── */
    [data-chronicle="summarize-flow"] { display: flex; flex-direction: column; gap: 12px; }
    .chronicle-sf-count {
      background: var(--lumiverse-fill-hover);
      color: var(--lumiverse-primary);
      font-size: calc(13px * var(--lumiverse-font-scale, 1));
      padding: 10px 14px;
      border-radius: 8px;
      font-weight: 500;
      text-align: center;
    }

    /* ── Auto-hide controls ─────────────────────────────── */
    .chronicle-sf-autohide {
      padding: 10px 12px;
      background: var(--lumiverse-fill-subtle);
      border: 1px solid var(--lumiverse-border);
      border-radius: 8px;
    }

    .chronicle-sf-autohide-toggle-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .chronicle-sf-autohide-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text);
    }

    .chronicle-sf-autohide-toggle input[type="checkbox"] {
      margin: 0;
      accent-color: var(--lumiverse-primary);
    }

    .chronicle-sf-autohide-count {
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .chronicle-sf-autohide-input {
      width: 68px;
      padding: 4px 8px;
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      background: var(--lumiverse-fill);
      border: 1px solid var(--lumiverse-border);
      border-radius: 6px;
      color: var(--lumiverse-text);
      text-align: center;
      box-sizing: border-box;
    }

    .chronicle-sf-autohide-input:focus {
      outline: none;
      border-color: var(--lumiverse-primary);
      box-shadow: 0 0 0 2px var(--lumiverse-primary-010);
    }

    .chronicle-sf-autohide-input:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* ── Info tooltip ──────────────────────────────────── */
    .chronicle-info-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 1px solid var(--lumiverse-text-dim);
      color: var(--lumiverse-text-dim);
      font-size: calc(10px * var(--lumiverse-font-scale, 1));
      font-weight: 700;
      font-style: normal;
      font-family: var(--lumiverse-font-sans, sans-serif);
      opacity: 0.4;
      flex-shrink: 0;
      position: relative;
      user-select: none;
      line-height: 1;
    }

    .chronicle-info-icon:hover {
      opacity: 0.8;
    }

    .chronicle-info-icon::after {
      content: attr(data-tooltip);
      position: absolute;
      top: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: var(--lumiverse-bg-deep);
      color: var(--lumiverse-text);
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      font-weight: 400;
      font-family: var(--lumiverse-font-sans, sans-serif);
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid var(--lumiverse-border);
      white-space: normal;
      width: max-content;
      max-width: 280px;
      line-height: 1.4;
      pointer-events: none;
      display: none;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
      text-align: left;
    }

    .chronicle-info-icon:hover::after {
      display: block;
    }

    .chronicle-sf-generate-row {
      display: flex;
    }
    .chronicle-sf-hint {
      color: var(--lumiverse-text-dim);
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      text-align: center;
      padding: 16px 0;
    }
    .chronicle-sf-title-row { display: flex; flex-direction: column; gap: 4px; }
    .chronicle-sf-title-format-hint {
      font-size: calc(10px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text-dim);
      opacity: 0.6;
      margin-left: 4px;
      white-space: nowrap;
    }
    .chronicle-sf-format-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .chronicle-sf-format-custom-input {
      margin-top: 4px;
    }
    .chronicle-sf-content {
      background: var(--lumiverse-fill-hover);
      border: 1px solid var(--lumiverse-border);
      border-radius: 8px;
      padding: 12px;
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 300px;
      overflow-y: auto;
    }
    .chronicle-sf-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .chronicle-sf-btn {
      padding: 8px 16px; border-radius: 8px; cursor: pointer;
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill-subtle);
      color: var(--lumiverse-text);
      transition: background var(--lumiverse-transition-fast);
      flex: 1; text-align: center; min-width: 80px;
    }
    .chronicle-sf-btn:hover:not(:disabled) { background: var(--lumiverse-fill-hover); }
    .chronicle-sf-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .chronicle-sf-btn-primary {
      background: var(--lumiverse-primary-010);
      border-color: var(--lumiverse-primary);
      color: var(--lumiverse-primary);
      font-weight: 500;
    }
    .chronicle-sf-btn-primary:hover:not(:disabled) { background: var(--lumiverse-fill-hover); }
    .chronicle-sf-error {
      background: var(--chronicle-error-bg);
      border: 1px solid var(--chronicle-error-border);
      color: var(--chronicle-error-text);
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      padding: 8px 12px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* ── Settings Manager ──────────────────────────── */
    [data-chronicle="settings-manager"] {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 4px;
      border-top: 1px solid var(--lumiverse-border);
      padding-top: 8px;
    }
    .chronicle-sm-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .chronicle-sm-label {
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text-dim);
      font-weight: 500;
    }
    .chronicle-sm-select {
      background: var(--lumiverse-fill-hover);
      border: 1px solid var(--lumiverse-border);
      color: var(--lumiverse-text);
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      padding: 6px 8px;
      border-radius: 6px;
      cursor: pointer;
    }
    .chronicle-sm-delete-btn {
      background: var(--chronicle-error-bg);
      color: var(--chronicle-error-text);
      border: 1px solid var(--chronicle-error-border);
      font-size: calc(10px * var(--lumiverse-font-scale, 1));
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: background var(--lumiverse-transition-fast);
    }
    .chronicle-sm-delete-btn:hover:not(:disabled) {
      background: var(--chronicle-error-bg);
      filter: brightness(1.3);
    }
    .chronicle-sm-delete-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .chronicle-sm-error { font-size: calc(11px * var(--lumiverse-font-scale, 1)); color: var(--chronicle-error-text); }
    .chronicle-sm-preview-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
    }
    .chronicle-sm-summary {
      cursor: pointer;
      color: var(--lumiverse-text-dim);
      user-select: none;
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
    }
    .chronicle-sm-toolbar {
      display: flex;
      gap: 4px;
      margin-left: auto;
    }
    .chronicle-sm-tool-btn {
      background: var(--lumiverse-fill-subtle);
      border: 1px solid var(--lumiverse-border);
      color: var(--lumiverse-text-dim);
      font-size: calc(10px * var(--lumiverse-font-scale, 1));
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: background var(--lumiverse-transition-fast);
    }
    .chronicle-sm-tool-btn:hover:not(:disabled) {
      background: var(--lumiverse-fill-hover);
      color: var(--lumiverse-text);
    }
    .chronicle-sm-tool-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .chronicle-sm-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .chronicle-sm-section-heading {
      font-size: calc(10px * var(--lumiverse-font-scale, 1));
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--lumiverse-text-dim);
      margin-top: 4px;
    }
    .chronicle-sm-field-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .chronicle-sm-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }
    .chronicle-sm-field-small {
      max-width: 100px;
    }
    .chronicle-sm-field-label {
      font-size: calc(10px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text-dim);
      font-weight: 500;
    }
    .chronicle-sm-input {
      width: 100%;
      background: var(--lumiverse-fill-hover);
      border: 1px solid var(--lumiverse-border);
      color: var(--lumiverse-text);
      caret-color: var(--lumiverse-text);
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      padding: 6px 8px;
      border-radius: 6px;
      box-sizing: border-box;
    }
    .chronicle-sm-input:focus {
      outline: none;
      border-color: var(--lumiverse-primary);
      box-shadow: 0 0 0 2px var(--lumiverse-primary-010);
    }
    .chronicle-sm-field-row {
      display: flex;
      gap: 8px;
      align-items: flex-end;
      flex-wrap: wrap;
    }
    .chronicle-sm-toggle-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 14px;
    }
    .chronicle-sm-toggle {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text);
      cursor: pointer;
      user-select: none;
    }
    .chronicle-sm-toggle input[type="checkbox"] {
      accent-color: var(--lumiverse-primary);
      cursor: pointer;
    }
    .chronicle-sm-group-toggle {
      background: none;
      border: none;
      color: var(--lumiverse-text-dim);
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      cursor: pointer;
      padding: 4px 0;
      text-align: left;
      display: flex;
      align-items: center;
      gap: 4px;
      border-bottom: 1px solid var(--lumiverse-border);
      width: 100%;
      font-weight: 500;
    }
    .chronicle-sm-group-toggle:hover {
      color: var(--lumiverse-text);
    }
    .chronicle-sm-chevron {
      font-size: 8px;
      transition: transform 0.15s;
      display: inline-block;
    }
    .chronicle-sm-chevron-open {
      transform: rotate(90deg);
    }
    .chronicle-sm-inactive-note {
      font-size: calc(10px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text-dim);
      padding: 6px 8px;
      background: var(--lumiverse-fill-subtle);
      border-radius: 4px;
      font-style: italic;
    }
    .chronicle-sm-overlay {
      position: fixed; inset: 0;
      background: var(--chronicle-overlay-bg);
      display: flex; align-items: center; justify-content: center;
      z-index: 10000;
    }
    .chronicle-sm-dialog {
      background: var(--lumiverse-bg);
      border: 1px solid var(--lumiverse-border);
      border-radius: 12px;
      padding: 20px;
      min-width: 300px;
      max-width: 400px;
    }
    .chronicle-sm-dialog h4 { margin: 0 0 12px 0; font-size: calc(14px * var(--lumiverse-font-scale, 1)); }
    .chronicle-sm-dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
    .chronicle-sm-dialog-btn {
      padding: 6px 14px; border-radius: 6px; cursor: pointer;
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill-subtle);
      color: var(--lumiverse-text);
    }
    .chronicle-sm-dialog-primary {
      background: var(--lumiverse-primary-010);
      border-color: var(--lumiverse-primary);
      color: var(--lumiverse-primary);
    }

    /* ── Summarize Flow — Keys row ─────────────────── */
    .chronicle-sf-keys-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .chronicle-sf-keys-input {
      background: var(--lumiverse-fill-hover);
      border: 1px solid var(--lumiverse-border);
      color: var(--lumiverse-text);
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      padding: 6px 8px;
      border-radius: 6px;
      width: 100%;
      box-sizing: border-box;
      font-family: inherit;
    }
    .chronicle-sf-keys-input:focus {
      outline: none;
      border-color: var(--lumiverse-primary);
    }
    .chronicle-sf-keys-hint {
      font-size: calc(10px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text-dim);
      opacity: 0.6;
      padding-left: 2px;
    }

    /* ── Connection Manager ──────────────────────── */
    [data-chronicle="connection-manager"] {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 4px;
      border-top: 1px solid var(--lumiverse-border);
      padding-top: 8px;
    }
    .chronicle-conn-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .chronicle-conn-label {
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text-dim);
      font-weight: 500;
    }
    .chronicle-conn-select {
      background: var(--lumiverse-fill-hover);
      border: 1px solid var(--lumiverse-border);
      color: var(--lumiverse-text);
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      padding: 6px 8px;
      border-radius: 6px;
      cursor: pointer;
    }
    .chronicle-conn-select:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* ── Connection Hint ──────────────────────────── */
    .chronicle-conn-hint {
      font-size: calc(10px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text-dim);
      line-height: 1.4;
      display: flex;
      gap: 4px;
      align-items: flex-start;
      margin-top: 4px;
    }
    .chronicle-conn-hint-icon {
      flex-shrink: 0;
      font-size: 11px;
    }
    .chronicle-conn-hint-text {
      flex: 1;
    }
    .chronicle-conn-link {
      background: none;
      border: none;
      padding: 0;
      margin: 0;
      color: var(--lumiverse-primary);
      cursor: pointer;
      font-size: inherit;
      font-family: inherit;
      text-decoration: underline;
      text-decoration-style: dotted;
      display: inline;
    }
    .chronicle-conn-link:hover {
      text-decoration-style: solid;
    }
    .chronicle-conn-hint-close {
      background: none;
      border: none;
      color: var(--lumiverse-text-dim);
      cursor: pointer;
      padding: 0 2px;
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      line-height: 1;
      flex-shrink: 0;
      margin-left: auto;
      opacity: 0.5;
    }
    .chronicle-conn-hint-close:hover {
      opacity: 1;
      color: var(--lumiverse-text);
    }

    /* ── New Connection Button Blink ──────────────── */
    @keyframes chronicle-conn-blink {
      0%, 100% {
        box-shadow: 0 0 0 0 transparent;
      }
      50% {
        box-shadow: 0 0 0 3px var(--lumiverse-primary), 0 0 10px var(--lumiverse-primary-050);
      }
    }
    .chronicle-conn-highlight {
      animation: chronicle-conn-blink 2s ease-in-out 2;
    }

    /* ── Lorebook Manager ──────────────────────────── */
    [data-chronicle="lorebook-manager"] {
      margin-top: 4px;
      border-top: 1px solid var(--lumiverse-border);
      padding-top: 8px;
    }
    .chronicle-lb-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .chronicle-lb-label {
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text-dim);
      font-weight: 500;
    }
    .chronicle-lb-select {
      background: var(--lumiverse-fill-hover);
      border: 1px solid var(--lumiverse-border);
      color: var(--lumiverse-text);
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      padding: 6px 8px;
      border-radius: 6px;
      cursor: pointer;
    }
    .chronicle-lb-select:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* ── Error boundary ─────────────────────────────────── */
    .chronicle-error-boundary {
      padding: 24px;
      text-align: center;
      background: var(--lumiverse-fill-subtle);
      border: 1px solid var(--lumiverse-border);
      border-radius: 8px;
      margin: 16px;
    }
    .chronicle-error-boundary-icon { font-size: 32px; margin-bottom: 8px; }
    .chronicle-error-boundary-title { font-size: 14px; font-weight: 600; color: var(--lumiverse-text); margin-bottom: 4px; }
    .chronicle-error-boundary-msg { font-size: 12px; color: var(--lumiverse-text-secondary); margin-bottom: 12px; word-break: break-word; }
    .chronicle-error-boundary-dismiss {
      background: var(--lumiverse-fill-subtle);
      border: 1px solid var(--lumiverse-border);
      color: var(--lumiverse-text);
      font-size: 12px;
      padding: 4px 12px;
      border-radius: 4px;
      cursor: pointer;
    }

    /* ── Summary Generation Toast ─────────────────────── */
    .chronicle-toast {
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      background: var(--lumiverse-bg);
      border: 1px solid var(--lumiverse-border);
      border-radius: 10px;
      padding: 10px 18px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      font-size: calc(13px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text);
      max-width: 420px;
      white-space: nowrap;
      transition: opacity 0.4s ease;
    }
    .chronicle-toast-fading {
      opacity: 0;
    }
    .chronicle-toast-error {
      border-color: var(--chronicle-error-border);
    }
    .chronicle-toast-success {
      border-color: var(--chronicle-success-text);
    }
    .chronicle-toast-icon {
      color: var(--chronicle-success-text);
      font-weight: 700;
      font-size: calc(14px * var(--lumiverse-font-scale, 1));
    }

    /* ── Delete Confirmation Popup ───────────────────── */
    .chronicle-dc-overlay {
      position: fixed; inset: 0;
      background: var(--chronicle-overlay-bg);
      display: flex; align-items: center; justify-content: center;
      z-index: 10000;
    }
    .chronicle-dc-dialog {
      background: var(--lumiverse-bg);
      border: 1px solid var(--lumiverse-border);
      border-radius: 10px;
      padding: 16px;
      max-width: 280px;
      width: 90%;
    }
    .chronicle-dc-dialog h4 {
      margin: 0 0 8px 0;
      font-size: calc(13px * var(--lumiverse-font-scale, 1));
      color: var(--chronicle-error-text);
      font-weight: 600;
    }
    .chronicle-dc-message {
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text);
      margin: 0 0 16px 0;
      line-height: 1.4;
    }
    .chronicle-dc-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .chronicle-dc-btn {
      padding: 5px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill-subtle);
      color: var(--lumiverse-text);
      transition: background var(--lumiverse-transition-fast);
    }
    .chronicle-dc-btn:hover {
      background: var(--lumiverse-fill-hover);
    }
    .chronicle-dc-btn-delete {
      background: var(--chronicle-error-bg);
      border-color: var(--chronicle-error-border);
      color: var(--chronicle-error-text);
    }
    .chronicle-dc-btn-delete:hover {
      filter: brightness(1.3);
    }

  `;
}

// src/select-mode.ts
function getSelectedMessageIds() {
  const seen = new Set;
  const ids = [];
  document.querySelectorAll("[data-message-id]").forEach((el) => {
    const classStr = el.className;
    if (typeof classStr === "string" && classStr.includes("selected")) {
      const mid = el.getAttribute("data-message-id");
      if (mid && !seen.has(mid)) {
        seen.add(mid);
        ids.push(mid);
      }
    }
  });
  return ids;
}
function findChatColumn() {
  return document.querySelector("[data-select-mode]") ?? document.querySelector('[class*="chatColumnInner"]') ?? null;
}
function observeSelectMode(onActivate, onDeactivate) {
  const observer = new MutationObserver((mutations) => {
    for (const m3 of mutations) {
      if (m3.type === "attributes" && m3.attributeName === "data-select-mode") {
        const el = m3.target;
        console.log("[Chronicle] data-select-mode changed:", el.hasAttribute("data-select-mode"), el);
        if (el.hasAttribute("data-select-mode")) {
          onActivate();
        } else {
          onDeactivate();
        }
      }
    }
  });
  observer.observe(document.body, {
    attributes: true,
    subtree: true,
    attributeFilter: ["data-select-mode"]
  });
  const initial = findChatColumn();
  if (initial?.hasAttribute("data-select-mode")) {
    setTimeout(onActivate, 0);
  }
  return () => observer.disconnect();
}
// node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js
var f3 = 0;
function u3(e3, t3, n2, o3, i3, u4) {
  t3 || (t3 = {});
  var a3, c3, p3 = t3;
  if ("ref" in p3)
    for (c3 in p3 = {}, t3)
      c3 == "ref" ? a3 = t3[c3] : p3[c3] = t3[c3];
  var l3 = { type: e3, props: p3, key: n2, ref: a3, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: undefined, __v: --f3, __i: -1, __u: 0, __source: i3, __self: u4 };
  if (typeof e3 == "function" && (a3 = e3.defaultProps))
    for (c3 in a3)
      p3[c3] === undefined && (p3[c3] = a3[c3]);
  return l.vnode && l.vnode(l3), l3;
}

// src/components/SummarizeButton.tsx
var SummarizeButton = ({ selectedCount: _initialCount }) => {
  const [selectedCount, setSelectedCount] = d2(_initialCount);
  y2(() => {
    let pendingUpdate = false;
    const checkCount = () => {
      if (pendingUpdate)
        return;
      pendingUpdate = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const ids = getSelectedMessageIds();
          setSelectedCount(ids.length);
          pendingUpdate = false;
        });
      });
    };
    checkCount();
    const observer = new MutationObserver(() => checkCount());
    const chatContainer = document.querySelector("[data-select-mode]") ?? document.querySelector('[class*="chatColumnInner"]');
    if (chatContainer) {
      observer.observe(chatContainer, {
        attributes: true,
        subtree: true,
        childList: true
      });
    }
    return () => observer.disconnect();
  }, []);
  const handleClick = () => {
    if (selectedCount === 0)
      return;
    getOpenModal()?.(selectedCount);
  };
  return /* @__PURE__ */ u3("button", {
    class: "chronicle-summarize-btn",
    disabled: selectedCount === 0,
    onClick: handleClick,
    title: "Summarize selected messages",
    children: "Summarize"
  }, undefined, false, undefined, this);
};

// src/components/ErrorBoundary.tsx
class ErrorBoundary extends C {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  componentDidCatch(err) {
    const label = this.props.name ? `[Chronicle:${this.props.name}]` : "[Chronicle]";
    console.error(`${label} Render error:`, err);
    this.setState({ error: err.message });
  }
  render() {
    if (this.state.error) {
      return /* @__PURE__ */ u3("div", {
        "data-chronicle": "error-boundary",
        class: "chronicle-error-boundary",
        children: [
          /* @__PURE__ */ u3("div", {
            class: "chronicle-error-boundary-icon",
            children: "⚠"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ u3("div", {
            class: "chronicle-error-boundary-title",
            children: "Chronicle Error"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ u3("div", {
            class: "chronicle-error-boundary-msg",
            children: this.state.error
          }, undefined, false, undefined, this),
          /* @__PURE__ */ u3("button", {
            class: "chronicle-error-boundary-dismiss",
            onClick: () => this.setState({ error: null }),
            children: "Dismiss"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this);
    }
    return /* @__PURE__ */ u3(S, {
      children: this.props.children
    }, undefined, false, undefined, this);
  }
}

// src/select-bar.tsx
var _trackedRenders = [];
function setRenderTracker(renders) {
  _trackedRenders = renders;
}
function trackRender(root, unmount) {
  _trackedRenders.push({ root, unmount });
}
function untrackRender(root) {
  const idx = _trackedRenders.findIndex((r3) => r3.root === root);
  if (idx !== -1)
    _trackedRenders.splice(idx, 1);
}
function unmountComponentAtNode(node) {
  R(null, node);
}
function findSelectBar() {
  const countEls = document.querySelectorAll('[class*="count"]');
  for (const el of countEls) {
    if (el.textContent?.includes("selected")) {
      const left = el.parentElement;
      const bar = left?.parentElement;
      if (bar)
        return bar;
    }
  }
  const buttons = document.querySelectorAll("button");
  for (const btn of buttons) {
    if (btn.textContent?.trim() === "Cancel") {
      const actions = btn.parentElement;
      const bar = actions?.parentElement;
      if (bar && bar.querySelector('[class*="actions"]')) {
        return bar;
      }
    }
  }
  const bars = document.querySelectorAll('[class*="MessageSelectBar"][class*="bar"]');
  for (const bar of bars) {
    if (bar.querySelector('[class*="actions"]') && bar.querySelector('[class*="count"]')) {
      return bar;
    }
  }
  const allActions = document.querySelectorAll('[class*="actions"]');
  for (const actions of allActions) {
    if (actions.querySelector('[class*="count"]'))
      continue;
    const bar = actions.parentElement;
    if (bar && bar.querySelector('[class*="count"]')) {
      if (bar.querySelector("button")) {
        return bar;
      }
    }
  }
  return null;
}
function injectIntoSelectBar() {
  const bar = findSelectBar();
  console.log("[Chronicle] Looking for MessageSelectBar:", bar?.tagName, bar?.className);
  if (!bar) {
    console.warn("[Chronicle] MessageSelectBar not found");
    return null;
  }
  const actions = bar.querySelector('[class*="actions"]');
  console.log("[Chronicle] Looking for .actions inside bar:", actions?.className);
  if (!actions) {
    const childClasses = Array.from(bar.children).map((c3) => c3.className);
    console.warn("[Chronicle] .actions not found in bar. Children:", childClasses);
    return null;
  }
  const cancelBtn = Array.from(actions.querySelectorAll("button")).find((b2) => b2.textContent?.trim() === "Cancel" && !b2.closest("[data-chronicle]"));
  let summaryCleanup = null;
  if (!actions.querySelector('[data-chronicle="summarize-btn"]')) {
    const summaryMount = document.createElement("span");
    summaryMount.setAttribute("data-chronicle", "summarize-btn");
    summaryMount.style.display = "contents";
    if (cancelBtn) {
      actions.insertBefore(summaryMount, cancelBtn);
    } else {
      actions.appendChild(summaryMount);
    }
    R(/* @__PURE__ */ u3(ErrorBoundary, {
      name: "button",
      children: /* @__PURE__ */ u3(SummarizeButton, {
        selectedCount: 0
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this), summaryMount);
    trackRender(summaryMount, () => unmountComponentAtNode(summaryMount));
    summaryCleanup = () => {
      unmountComponentAtNode(summaryMount);
      summaryMount.remove();
      untrackRender(summaryMount);
    };
  }
  return {
    cleanup: () => {
      summaryCleanup?.();
    }
  };
}

// src/backend-relay.ts
function setupBackendListener(spindleCtx) {
  return spindleCtx.onBackendMessage((payload) => {
    const msg = payload;
    if (!msg || typeof msg.type !== "string")
      return;
    switch (msg.type) {
      case "summarize_progress":
      case "summarize_failed":
      case "summarize_preview":
      case "summarize_saved":
      case "connections_list":
      case "discard_confirmed":
      case "lorebooks_list":
        window.dispatchEvent(new CustomEvent("chronicle:backend-message", { detail: payload }));
        break;
    }
  });
}

// src/teardown.ts
function createFullTeardown(state) {
  return function fullTeardown() {
    state._removeObserver?.();
    state._removeObserver = null;
    state._removeStyles?.();
    state._removeStyles = null;
    state._selectBarCleanup?.cleanup();
    state._selectBarCleanup = null;
    state._backendUnsub?.();
    state._backendUnsub = null;
    state._moduleBackendUnsub?.();
    state._moduleBackendUnsub = null;
    for (const r3 of [...state._renders].reverse()) {
      try {
        r3.unmount();
      } catch {}
    }
    state._renders.length = 0;
    state._teardownRef.current = null;
  };
}

// src/prompts.ts
var SUMMARIZE_SYSTEM_PROMPT = `<> Your task: Analyze the given story/roleplay and return a past-tense summary/breakdown in JSON format. The JSON must include three fields: title, content, and keywords. The JSON should be your only output.

<> Title field instructions:
Choose a short, unique, descriptive title that fits with the tone and theme of the story.

<> Content field instructions:
1. Begin the content field with "# Scene Summary {number} - {title}".
2. If relevant and possible, note the timeframe of the scene and 1-3 major locations involved
3. In the first group of bullet points (what happened): narrate 5-10 key highlights, details, or moments that meaningfully affected character development and memories. Carefully consider the natural memory formation of each character in the scene. OOC conversation is not useful here and should be ignored and excluded.
4. In the second group of bullet points (memorable quotes): capture 5-10 interesting or important character quotes/speech/thoughts, labeled by character name in parenthesis.

Complete example for content field:
    # Scene Summary 14 - Ashes Between Them

    > Locations: Helios Research Station, Observation Deck, Crew Quarters
    > Timeframe: Late night through early morning. During the final week before evacuation.
    > What happened:
    - Selene's growing frustration with the station leadership finally gave way to open distrust after she discovered the evacuation plans had been falsified.
    - Mirek struggled with guilt over previous command decisions and quietly admitted he no longer believed he deserved the crew's loyalty.
    - Jun's exhaustion and fear became more visible as he pushed himself to repair the transmitter, revealing how deeply he feared being abandoned again.
    - A tense confrontation in the observation deck forced the group to acknowledge long-buried resentment surrounding the failed rescue mission months earlier.
    - Despite the conflict, the survivors gradually began relying on one another more honestly, with several characters dropping defensive facades they had maintained since arriving on the station.
    - Director Vale's refusal to apologize revealed that his need for control mattered more to him than the crew's trust, permanently damaging his relationship with the others.

    > Memorable quotes:
    - (Selene) "You kept asking us to trust you while hiding everything that mattered!"
    - (Mirek) "Maybe I stopped acting like a captain a long time ago."
    - (Jun) "I'm tired of pretending I'm not scared all the time."
    - (Director Vale) "Leadership means carrying decisions nobody else can survive making."

<> Keyword field instructions (CRITICAL):
You MUST provide 15-30 specific, descriptive, relevant keywords that would help a vectorized database find this entry again if mentioned or alluded to. Keywords must be concrete and scene-specific (locations, objects, proper nouns, unique actions). Do not use abstract themes (e.g., "sadness", "love") or character names. Prioritize one-word keywords over phrases or word pairs. NEVER return an empty keys array — you must always generate at least 10 keywords.

Return ONLY the JSON, no other text. ALL THREE FIELDS (title, content, keywords) are REQUIRED — never omit or leave any field empty.`;
var SUMMARIZE_USER_PROMPT = `Title: {{TITLE}}

Messages to summarize:
---
{{MESSAGES}}
---

Generate a lorebook entry from these messages.`;
function buildSummarizePrompt(messages, title, systemPromptOverride, sceneNumber, recentContext) {
  let effectiveSystem = systemPromptOverride?.trim() || SUMMARIZE_SYSTEM_PROMPT;
  if (sceneNumber) {
    effectiveSystem = effectiveSystem.replace(/\{number\}/g, sceneNumber);
  }
  if (recentContext) {
    effectiveSystem += recentContext;
  }
  const formatted = messages.map((m3, i3) => `[${i3 + 1}] ${m3.role}: ${m3.content}`).join(`

`);
  const userPrompt = SUMMARIZE_USER_PROMPT.replace("{{TITLE}}", title || "(generate a title)").replace("{{MESSAGES}}", formatted);
  return {
    systemPrompt: effectiveSystem,
    userPrompt
  };
}
var KEYWORD_STOP_WORDS = new Set([
  "this",
  "that",
  "with",
  "from",
  "were",
  "they",
  "have",
  "been",
  "what",
  "when",
  "where",
  "which",
  "their",
  "about",
  "would",
  "could",
  "into",
  "over",
  "after",
  "before",
  "between",
  "under",
  "while",
  "there",
  "said",
  "very",
  "just",
  "than",
  "then",
  "also",
  "more",
  "some",
  "these",
  "those",
  "should",
  "because",
  "without",
  "through",
  "against",
  "during",
  "still",
  "might",
  "down",
  "back",
  "being",
  "made",
  "much",
  "each",
  "other",
  "before",
  "after",
  "above",
  "below",
  "upon",
  "across",
  "along",
  "among",
  "around",
  "behind",
  "beneath",
  "beside",
  "beyond",
  "inside",
  "outside",
  "beneath",
  "within",
  "without",
  "little",
  "enough",
  "every",
  "almost",
  "quite",
  "rather",
  "already",
  "however",
  "though",
  "either",
  "neither",
  "whether",
  "whatever",
  "whoever",
  "whomever",
  "whose",
  "whom",
  "who",
  "which",
  "that",
  "these",
  "those"
]);
function parseSummaryResponse(text) {
  const lines = text.split(`
`);
  let lastTitleIdx = -1;
  let lastContentIdx = -1;
  for (let i3 = 0;i3 < lines.length; i3++) {
    const upperLine = lines[i3].toLocaleUpperCase();
    if (upperLine.startsWith("TITLE:")) {
      lastTitleIdx = i3;
    }
    if (upperLine.startsWith("CONTENT:")) {
      lastContentIdx = i3;
    }
  }
  if (lastContentIdx === -1)
    return null;
  const titleLine = lastTitleIdx >= 0 ? lines[lastTitleIdx].slice(6).trim() : null;
  const content = lines.slice(lastContentIdx + 1).join(`
`).trim();
  if (!content)
    return null;
  return {
    title: titleLine || "Untitled Entry",
    content
  };
}

// src/presets.ts
var DEFAULT_PARAMS = {
  temperature: 0.3,
  top_p: 1,
  max_tokens: 4096,
  top_k: 0
};
var STORAGE_KEY = "chronicle_prompt_presets";
var BUILT_IN_PRESETS = [
  {
    id: "default",
    name: "Default",
    systemPrompt: SUMMARIZE_SYSTEM_PROMPT,
    builtIn: true,
    outputFormat: "json"
  }
];
function loadUserPresets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw)
      return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed))
      return [];
    return parsed.filter((p3) => typeof p3 === "object" && p3 !== null && typeof p3.id === "string" && typeof p3.name === "string" && typeof p3.systemPrompt === "string");
  } catch {
    return [];
  }
}
function saveUserPresets(presets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch (err) {
    console.error("[Chronicle] Failed to save presets:", err);
  }
}
function getAllPresets() {
  return [...BUILT_IN_PRESETS, ...loadUserPresets()];
}
function getPreset(id) {
  return getAllPresets().find((p3) => p3.id === id);
}
function getOldFormatPresets() {
  return loadUserPresets().filter((p3) => p3.outputFormat !== "json");
}
function updatePreset(id, updates) {
  const userPresets = loadUserPresets();
  const idx = userPresets.findIndex((p3) => p3.id === id);
  if (idx === -1)
    return null;
  userPresets[idx] = { ...userPresets[idx], ...updates };
  saveUserPresets(userPresets);
  return userPresets[idx];
}
function findPresetByName(name) {
  return loadUserPresets().find((p3) => !p3.builtIn && p3.name === name);
}
function savePreset(name, systemPrompt, params) {
  const userPresets = loadUserPresets();
  const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const preset = { id, name, systemPrompt, builtIn: false, outputFormat: "json", params };
  userPresets.push(preset);
  saveUserPresets(userPresets);
  return preset;
}
function deletePreset(id) {
  const userPresets = loadUserPresets();
  const idx = userPresets.findIndex((p3) => p3.id === id);
  if (idx === -1)
    return false;
  userPresets.splice(idx, 1);
  saveUserPresets(userPresets);
  return true;
}
function exportPresets() {
  return JSON.stringify(loadUserPresets(), null, 2);
}
function importPresets(json) {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed))
      return { success: false, count: 0, error: "Expected an array of presets" };
    const valid = parsed.filter((p3) => typeof p3 === "object" && p3 !== null && typeof p3.id === "string" && typeof p3.name === "string" && typeof p3.systemPrompt === "string");
    if (valid.length === 0)
      return { success: false, count: 0, error: "No valid presets found in file" };
    const existing = loadUserPresets();
    const existingIds = new Set([...BUILT_IN_PRESETS.map((p3) => p3.id), ...existing.map((p3) => p3.id)]);
    const deduped = valid.filter((p3) => !existingIds.has(p3.id));
    const merged = [...existing, ...deduped];
    saveUserPresets(merged);
    return { success: true, count: deduped.length };
  } catch (err) {
    return { success: false, count: 0, error: err instanceof Error ? err.message : "Invalid JSON" };
  }
}

// src/components/PromptManager.tsx
var PROMPT_SELECTED_KEY = "chronicle_selected_prompt_preset";
var PromptManager = ({
  onActivePromptChange,
  onParamsChange,
  loading = false
}) => {
  const [presets, setPresets] = d2([]);
  const [params, setParams] = d2({ ...DEFAULT_PARAMS });
  const restoreSelectedPreset = () => {
    try {
      const saved = localStorage.getItem(PROMPT_SELECTED_KEY);
      if (saved && getAllPresets().some((p3) => p3.id === saved))
        return saved;
    } catch {}
    return "default";
  };
  const [selectedPresetId, setSelectedPresetId] = d2(restoreSelectedPreset);
  const [useCustom, setUseCustom] = d2(false);
  const [isEditing, setIsEditing] = d2(false);
  const [customPrompt, setCustomPrompt] = d2("");
  const [showSaveDialog, setShowSaveDialog] = d2(false);
  const [saveName, setSaveName] = d2("");
  const [importError, setImportError] = d2(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = d2(false);
  const [expanded, setExpanded] = d2(false);
  const fileInputRef = A2(null);
  const autosaveIntervalRef = A2(null);
  const AUTOSAVE_NAME = "Autosave";
  y2(() => {
    setPresets(getAllPresets());
  }, []);
  const refreshPresets = q2(() => {
    setPresets(getAllPresets());
  }, []);
  const activePrompt = T2(() => {
    if (useCustom && customPrompt.trim())
      return customPrompt.trim();
    if (!useCustom) {
      const preset = getPreset(selectedPresetId);
      return preset?.systemPrompt;
    }
    return;
  }, [useCustom, customPrompt, selectedPresetId]);
  y2(() => {
    onActivePromptChange?.(activePrompt);
  }, [activePrompt, onActivePromptChange]);
  y2(() => {
    if (!useCustom && selectedPresetId) {
      const preset = getPreset(selectedPresetId);
      if (preset?.params) {
        setParams({ ...preset.params });
      } else {
        setParams({ ...DEFAULT_PARAMS });
      }
    }
  }, [selectedPresetId, useCustom]);
  y2(() => {
    onParamsChange?.(params);
  }, [params, onParamsChange]);
  const ensureAutosavePreset = q2((promptOverride) => {
    const currentPreset = presets.find((p3) => p3.id === selectedPresetId);
    if (currentPreset && !currentPreset.builtIn) {
      if (!isEditing)
        setIsEditing(true);
      return;
    }
    if (promptOverride === undefined && !customPrompt.trim() && currentPreset?.systemPrompt) {
      setCustomPrompt(currentPreset.systemPrompt);
    }
    const localAutosave = findPresetByName(AUTOSAVE_NAME);
    if (localAutosave) {
      setSelectedPresetId(localAutosave.id);
      try {
        localStorage.setItem(PROMPT_SELECTED_KEY, localAutosave.id);
      } catch {}
      if (localAutosave.params)
        setParams({ ...localAutosave.params });
    } else {
      const saved = savePreset(AUTOSAVE_NAME, promptOverride ?? (customPrompt || currentPreset?.systemPrompt || ""), params);
      refreshPresets();
      setSelectedPresetId(saved.id);
      try {
        localStorage.setItem(PROMPT_SELECTED_KEY, saved.id);
      } catch {}
    }
    if (!isEditing)
      setIsEditing(true);
  }, [presets, selectedPresetId, customPrompt, params, refreshPresets, isEditing]);
  const doAutosave = q2(() => {
    if (!isEditing)
      return;
    const currentPreset = presets.find((p3) => p3.id === selectedPresetId);
    if (currentPreset && !currentPreset.builtIn) {
      const update = { params };
      if (customPrompt.trim())
        update.systemPrompt = customPrompt;
      updatePreset(selectedPresetId, update);
      refreshPresets();
      return;
    }
    if (!customPrompt.trim())
      return;
    const existing = findPresetByName(AUTOSAVE_NAME);
    let saved;
    if (existing) {
      const updated = updatePreset(existing.id, { systemPrompt: customPrompt, params });
      if (!updated)
        return;
      saved = updated;
    } else {
      saved = savePreset(AUTOSAVE_NAME, customPrompt, params);
    }
    refreshPresets();
    setSelectedPresetId(saved.id);
    setIsEditing(false);
    try {
      localStorage.setItem(PROMPT_SELECTED_KEY, saved.id);
    } catch {}
  }, [isEditing, customPrompt, params, refreshPresets, presets, selectedPresetId]);
  const doAutosaveRef = A2(doAutosave);
  doAutosaveRef.current = doAutosave;
  const stopAutosaveInterval = q2(() => {
    if (autosaveIntervalRef.current !== null) {
      clearInterval(autosaveIntervalRef.current);
      autosaveIntervalRef.current = null;
    }
  }, []);
  const startAutosaveInterval = q2(() => {
    stopAutosaveInterval();
    autosaveIntervalRef.current = setInterval(() => doAutosaveRef.current(), 3000);
  }, [stopAutosaveInterval]);
  y2(() => {
    return () => {
      doAutosaveRef.current();
      stopAutosaveInterval();
    };
  }, []);
  y2(() => {
    if (isEditing && customPrompt.trim()) {
      doAutosaveRef.current();
      startAutosaveInterval();
    } else {
      stopAutosaveInterval();
    }
  }, [isEditing, customPrompt]);
  const handlePresetChange = q2((e3) => {
    const id = e3.target.value;
    if (id === selectedPresetId && !useCustom)
      return;
    if (id === "__custom__") {
      if (!useCustom) {
        const current = getPreset(selectedPresetId);
        if (current)
          setCustomPrompt(current.systemPrompt || "");
      }
      setUseCustom(true);
    } else {
      doAutosaveRef.current();
      stopAutosaveInterval();
      setSelectedPresetId(id);
      setUseCustom(false);
      setIsEditing(false);
      setCustomPrompt("");
      try {
        localStorage.setItem(PROMPT_SELECTED_KEY, id);
      } catch {}
      const preset = getPreset(id);
      if (preset?.params) {
        setParams({ ...preset.params });
      } else {
        setParams({ ...DEFAULT_PARAMS });
      }
    }
  }, [selectedPresetId, useCustom, stopAutosaveInterval]);
  const selectedPreset = presets.find((p3) => p3.id === selectedPresetId);
  const handleSavePreset = q2(() => {
    if (!saveName.trim())
      return;
    if (!activePrompt)
      return;
    stopAutosaveInterval();
    setIsEditing(false);
    const saved = savePreset(saveName.trim(), activePrompt, params);
    refreshPresets();
    setSelectedPresetId(saved.id);
    setUseCustom(false);
    try {
      localStorage.setItem(PROMPT_SELECTED_KEY, saved.id);
    } catch {}
    setSaveName("");
    setShowSaveDialog(false);
  }, [saveName, activePrompt, params, refreshPresets, stopAutosaveInterval]);
  const handleDeleteClick = q2(() => {
    setShowDeleteConfirm(true);
  }, []);
  const handleConfirmDelete = q2(() => {
    if (!selectedPreset)
      return;
    deletePreset(selectedPreset.id);
    refreshPresets();
    if (selectedPresetId === selectedPreset.id) {
      setSelectedPresetId("default");
      setIsEditing(false);
      setCustomPrompt("");
      try {
        localStorage.setItem(PROMPT_SELECTED_KEY, "default");
      } catch {}
    }
    setShowDeleteConfirm(false);
  }, [selectedPreset, selectedPresetId, refreshPresets]);
  const handleCancelDelete = q2(() => {
    setShowDeleteConfirm(false);
  }, []);
  y2(() => {
    if (showDeleteConfirm)
      setShowDeleteConfirm(false);
  }, [selectedPresetId]);
  const handleExport = q2(() => {
    const json = exportPresets();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a3 = document.createElement("a");
    a3.href = url;
    a3.download = `chronicle-presets-${new Date().toISOString().slice(0, 10)}.json`;
    a3.click();
    URL.revokeObjectURL(url);
  }, []);
  const handleImportFile = q2((e3) => {
    const input = e3.target;
    const file = input.files?.[0];
    if (!file)
      return;
    const reader = new FileReader;
    reader.onload = () => {
      const text = reader.result;
      const result = importPresets(text);
      if (result.success) {
        refreshPresets();
        setImportError(null);
      } else {
        setImportError(result.error || "Import failed");
      }
    };
    reader.readAsText(file);
    input.value = "";
  }, [refreshPresets]);
  const handleTriggerImport = q2(() => {
    fileInputRef.current?.click();
  }, []);
  const prevPresetRef = A2(null);
  y2(() => {
    const prev = prevPresetRef.current;
    if (prev !== null && prev !== selectedPresetId) {
      const p3 = getPreset(selectedPresetId);
      console.log("[Chronicle-prompts] preset switch:", prev, "→", selectedPresetId, "| params from preset:", p3?.params ? JSON.stringify(p3.params) : "none (will use DEFAULT)", "| current params state:", JSON.stringify(params));
    }
    prevPresetRef.current = selectedPresetId;
  });
  return /* @__PURE__ */ u3("div", {
    "data-chronicle": "prompt-manager",
    children: [
      getOldFormatPresets().length > 0 && /* @__PURE__ */ u3("div", {
        class: "chronicle-pm-warning",
        children: "⚠ Some custom presets use the old TITLE:/CONTENT: format and won't produce trigger keys. Edit or recreate them to use the new JSON output format."
      }, undefined, false, undefined, this),
      /* @__PURE__ */ u3("div", {
        class: "chronicle-pm-row",
        children: [
          /* @__PURE__ */ u3("label", {
            class: "chronicle-pm-label",
            children: "Prompt Preset"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ u3("select", {
            class: "chronicle-pm-select",
            value: useCustom ? "__custom__" : selectedPresetId,
            onChange: handlePresetChange,
            disabled: loading,
            children: [
              presets.map((p3) => /* @__PURE__ */ u3("option", {
                value: p3.id,
                children: [
                  p3.name,
                  p3.builtIn ? "" : " (custom)"
                ]
              }, p3.id, true, undefined, this)),
              /* @__PURE__ */ u3("option", {
                value: "__custom__",
                children: "Custom prompt…"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      selectedPreset && /* @__PURE__ */ u3("div", {
        class: "chronicle-pm-preview-section",
        children: [
          /* @__PURE__ */ u3("div", {
            class: "chronicle-pm-preview-bar",
            children: [
              /* @__PURE__ */ u3("span", {
                class: "chronicle-pm-summary",
                onClick: () => setExpanded((e3) => !e3),
                children: [
                  expanded ? "▼" : "▶",
                  " View prompt"
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ u3("div", {
                class: "chronicle-pm-toolbar",
                children: [
                  selectedPreset && !selectedPreset.builtIn && /* @__PURE__ */ u3("button", {
                    class: "chronicle-pm-delete-btn",
                    onClick: handleDeleteClick,
                    disabled: loading,
                    title: "Delete this preset",
                    children: "Delete Preset"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ u3("button", {
                    class: "chronicle-pm-tool-btn",
                    onClick: () => setShowSaveDialog(true),
                    disabled: loading || !useCustom && !selectedPreset,
                    title: "Save current custom prompt as a named preset",
                    children: "Save"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ u3("button", {
                    class: "chronicle-pm-tool-btn",
                    onClick: handleExport,
                    disabled: presets.filter((p3) => !p3.builtIn).length === 0,
                    title: "Export custom presets",
                    children: "Export"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ u3("button", {
                    class: "chronicle-pm-tool-btn",
                    onClick: handleTriggerImport,
                    disabled: loading,
                    title: "Import presets from file",
                    children: "Import"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ u3("input", {
                    ref: fileInputRef,
                    type: "file",
                    accept: ".json",
                    style: { display: "none" },
                    onChange: handleImportFile
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          expanded && /* @__PURE__ */ u3(S, {
            children: [
              /* @__PURE__ */ u3("textarea", {
                class: "chronicle-pm-textarea",
                value: useCustom || isEditing ? customPrompt : selectedPreset?.systemPrompt || "",
                onInput: (e3) => {
                  const val = e3.target.value;
                  setCustomPrompt(val);
                  ensureAutosavePreset(val);
                },
                placeholder: "Enter your custom summarization prompt…",
                rows: 16,
                disabled: loading
              }, undefined, false, undefined, this),
              /* @__PURE__ */ u3("div", {
                class: "chronicle-pm-params",
                children: [
                  /* @__PURE__ */ u3("div", {
                    class: "chronicle-pm-params-row",
                    children: [
                      /* @__PURE__ */ u3("label", {
                        class: "chronicle-pm-label",
                        children: [
                          "Temperature ",
                          /* @__PURE__ */ u3("span", {
                            class: "chronicle-pm-params-val",
                            children: params.temperature.toFixed(1)
                          }, undefined, false, undefined, this)
                        ]
                      }, undefined, true, undefined, this),
                      /* @__PURE__ */ u3("input", {
                        type: "range",
                        class: "chronicle-pm-range",
                        min: "0",
                        max: "2",
                        step: "0.1",
                        value: params.temperature,
                        onInput: (e3) => {
                          setParams((p3) => ({ ...p3, temperature: parseFloat(e3.target.value) }));
                        },
                        disabled: loading
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ u3("div", {
                    class: "chronicle-pm-params-row",
                    children: [
                      /* @__PURE__ */ u3("label", {
                        class: "chronicle-pm-label",
                        children: [
                          "Top P ",
                          /* @__PURE__ */ u3("span", {
                            class: "chronicle-pm-params-val",
                            children: params.top_p.toFixed(2)
                          }, undefined, false, undefined, this)
                        ]
                      }, undefined, true, undefined, this),
                      /* @__PURE__ */ u3("input", {
                        type: "range",
                        class: "chronicle-pm-range",
                        min: "0",
                        max: "1",
                        step: "0.05",
                        value: params.top_p,
                        onInput: (e3) => {
                          setParams((p3) => ({ ...p3, top_p: parseFloat(e3.target.value) }));
                        },
                        disabled: loading
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ u3("div", {
                    class: "chronicle-pm-params-row",
                    children: [
                      /* @__PURE__ */ u3("label", {
                        class: "chronicle-pm-label",
                        children: [
                          "Top K ",
                          /* @__PURE__ */ u3("span", {
                            class: "chronicle-pm-params-val",
                            children: params.top_k
                          }, undefined, false, undefined, this)
                        ]
                      }, undefined, true, undefined, this),
                      /* @__PURE__ */ u3("input", {
                        type: "range",
                        class: "chronicle-pm-range",
                        min: "0",
                        max: "500",
                        step: "1",
                        value: params.top_k,
                        onInput: (e3) => {
                          setParams((p3) => ({ ...p3, top_k: parseInt(e3.target.value) || 0 }));
                        },
                        disabled: loading
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ u3("div", {
                    class: "chronicle-pm-params-row",
                    children: [
                      /* @__PURE__ */ u3("label", {
                        class: "chronicle-pm-label",
                        children: "Max Tokens"
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ u3("input", {
                        type: "number",
                        class: "chronicle-pm-input",
                        min: "1",
                        max: "100000",
                        value: params.max_tokens,
                        onInput: (e3) => {
                          setParams((p3) => ({ ...p3, max_tokens: parseInt(e3.target.value) || 1 }));
                        },
                        disabled: loading,
                        style: "width: 100px"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      importError && /* @__PURE__ */ u3("div", {
        class: "chronicle-pm-error",
        children: importError
      }, undefined, false, undefined, this),
      showSaveDialog && /* @__PURE__ */ u3("div", {
        class: "chronicle-pm-overlay",
        onClick: () => setShowSaveDialog(false),
        children: /* @__PURE__ */ u3("div", {
          class: "chronicle-pm-dialog",
          onClick: (e3) => e3.stopPropagation(),
          children: [
            /* @__PURE__ */ u3("h4", {
              children: "Save as Preset"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ u3("input", {
              class: "chronicle-pm-input",
              value: saveName,
              onInput: (e3) => setSaveName(e3.target.value),
              placeholder: "Preset name…",
              onKeyDown: (e3) => e3.key === "Enter" && handleSavePreset(),
              autoFocus: true
            }, undefined, false, undefined, this),
            /* @__PURE__ */ u3("div", {
              class: "chronicle-pm-dialog-actions",
              children: [
                /* @__PURE__ */ u3("button", {
                  class: "chronicle-pm-dialog-btn",
                  onClick: () => setShowSaveDialog(false),
                  children: "Cancel"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ u3("button", {
                  class: "chronicle-pm-dialog-btn chronicle-pm-dialog-primary",
                  onClick: handleSavePreset,
                  disabled: !saveName.trim(),
                  children: "Save"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      showDeleteConfirm && selectedPreset && /* @__PURE__ */ u3("div", {
        class: "chronicle-dc-overlay",
        onClick: handleCancelDelete,
        children: /* @__PURE__ */ u3("div", {
          class: "chronicle-dc-dialog",
          onClick: (e3) => e3.stopPropagation(),
          children: [
            /* @__PURE__ */ u3("h4", {
              children: "Delete Preset"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ u3("p", {
              class: "chronicle-dc-message",
              children: [
                "Are you sure you want to delete ",
                /* @__PURE__ */ u3("strong", {
                  children: selectedPreset.name
                }, undefined, false, undefined, this),
                "? This cannot be undone."
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ u3("div", {
              class: "chronicle-dc-actions",
              children: [
                /* @__PURE__ */ u3("button", {
                  class: "chronicle-dc-btn chronicle-dc-btn-delete",
                  onClick: handleConfirmDelete,
                  children: "Delete Preset"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ u3("button", {
                  class: "chronicle-dc-btn",
                  onClick: handleCancelDelete,
                  children: "Cancel"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
};

// src/settings.ts
var DEFAULT_SETTINGS = {
  position: 1,
  depth: 4,
  role: "system",
  order: 100,
  selective: false,
  constant: false,
  disabled: false,
  caseSensitive: false,
  matchWholeWords: true,
  useRegex: false,
  useProbability: false,
  vectorized: false,
  probability: 100,
  scanDepth: null,
  selectiveLogic: 2,
  priority: 10,
  sticky: 0,
  cooldown: 0,
  delay: 0,
  preventRecursion: false,
  excludeRecursion: false,
  delayUntilRecursion: false,
  groupName: "",
  groupWeight: 100,
  groupOverride: false,
  automationId: "",
  worldBookId: null
};
var STORAGE_KEY2 = "chronicle_settings_presets";
var BUILT_IN_PRESETS2 = [
  {
    id: "default",
    name: "Default",
    settings: { ...DEFAULT_SETTINGS },
    builtIn: true
  },
  {
    id: "after_main",
    name: "After Main Prompt",
    settings: { ...DEFAULT_SETTINGS, position: 1, matchWholeWords: true },
    builtIn: true
  },
  {
    id: "always_constant",
    name: "Always Active",
    settings: { ...DEFAULT_SETTINGS, constant: true, matchWholeWords: true, useProbability: false, probability: 100 },
    builtIn: true
  },
  {
    id: "vector",
    name: "Vector Search",
    settings: { ...DEFAULT_SETTINGS, vectorized: true, constant: false, matchWholeWords: false },
    builtIn: true
  },
  {
    id: "depth_insert",
    name: "At Depth Insert",
    settings: { ...DEFAULT_SETTINGS, position: 4, depth: 6, matchWholeWords: true },
    builtIn: true
  }
];
function loadUserPresets2() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY2);
    if (!raw)
      return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed))
      return [];
    return parsed.filter((p3) => typeof p3 === "object" && p3 !== null && typeof p3.id === "string" && typeof p3.name === "string" && typeof p3.settings === "object");
  } catch {
    return [];
  }
}
function saveUserPresets2(presets) {
  try {
    localStorage.setItem(STORAGE_KEY2, JSON.stringify(presets));
  } catch (err) {
    console.error("[Chronicle] Failed to save settings presets:", err);
  }
}
function getAllSettingsPresets() {
  return [...BUILT_IN_PRESETS2, ...loadUserPresets2()];
}
function getSettingsPreset(id) {
  return getAllSettingsPresets().find((p3) => p3.id === id);
}
function saveSettingsPreset(name, settings) {
  const userPresets = loadUserPresets2();
  const id = `settings_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const preset = { id, name, settings, builtIn: false };
  userPresets.push(preset);
  saveUserPresets2(userPresets);
  return preset;
}
function deleteSettingsPreset(id) {
  const userPresets = loadUserPresets2();
  const idx = userPresets.findIndex((p3) => p3.id === id);
  if (idx === -1)
    return false;
  userPresets.splice(idx, 1);
  saveUserPresets2(userPresets);
  return true;
}
function updateSettingsPreset(id, updates) {
  const userPresets = loadUserPresets2();
  const idx = userPresets.findIndex((p3) => p3.id === id);
  if (idx === -1)
    return null;
  userPresets[idx] = { ...userPresets[idx], ...updates };
  saveUserPresets2(userPresets);
  return userPresets[idx];
}
function findSettingsPresetByName(name) {
  return loadUserPresets2().find((p3) => !p3.builtIn && p3.name === name);
}
function exportSettingsPresets() {
  return JSON.stringify(loadUserPresets2(), null, 2);
}
function importSettingsPresets(json) {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed))
      return { success: false, count: 0, error: "Expected an array of presets" };
    const valid = parsed.filter((p3) => typeof p3 === "object" && p3 !== null && typeof p3.id === "string" && typeof p3.name === "string" && typeof p3.settings === "object");
    if (valid.length === 0)
      return { success: false, count: 0, error: "No valid settings presets found in file" };
    const existing = loadUserPresets2();
    const existingIds = new Set([...BUILT_IN_PRESETS2.map((p3) => p3.id), ...existing.map((p3) => p3.id)]);
    const deduped = valid.filter((p3) => !existingIds.has(p3.id));
    const merged = [...existing, ...deduped];
    saveUserPresets2(merged);
    return { success: true, count: deduped.length };
  } catch (err) {
    return { success: false, count: 0, error: err instanceof Error ? err.message : "Invalid JSON" };
  }
}
var POSITION_OPTIONS = [
  { value: 0, label: "Before Main Prompt" },
  { value: 1, label: "After Main Prompt" },
  { value: 2, label: "Before AN" },
  { value: 3, label: "After AN" },
  { value: 4, label: "At Depth" }
];
var ROLE_OPTIONS = [
  { value: "system", label: "System" },
  { value: "user", label: "User" },
  { value: "assistant", label: "Assistant" }
];
var SELECTIVE_LOGIC_OPTIONS = [
  { value: 0, label: "AND All Keys" },
  { value: 1, label: "NOT None" },
  { value: 2, label: "OR Any Key" },
  { value: 3, label: "NOT All" }
];
function settingsToCreateInput(settings) {
  return {
    position: settings.position,
    ...settings.position === 4 ? { depth: settings.depth } : {},
    role: settings.role,
    order_value: settings.order,
    selective: settings.selective,
    constant: settings.constant,
    disabled: settings.disabled,
    case_sensitive: settings.caseSensitive,
    match_whole_words: settings.matchWholeWords,
    use_regex: settings.useRegex,
    use_probability: settings.useProbability,
    vectorized: settings.vectorized,
    probability: settings.probability,
    scan_depth: settings.scanDepth,
    selective_logic: settings.selectiveLogic,
    priority: settings.priority,
    sticky: settings.sticky,
    cooldown: settings.cooldown,
    delay: settings.delay,
    prevent_recursion: settings.preventRecursion,
    exclude_recursion: settings.excludeRecursion,
    delay_until_recursion: settings.delayUntilRecursion,
    group_name: settings.groupName,
    group_weight: settings.groupWeight,
    group_override: settings.groupOverride,
    automation_id: settings.automationId || undefined
  };
}

// src/components/SettingsManager.tsx
var SETTINGS_SELECTED_KEY = "chronicle_selected_settings_preset";
var SettingsManager = ({
  settings,
  onSettingsChange,
  loading = false
}) => {
  const [presets, setPresets] = d2([]);
  const restoreSelectedPreset = () => {
    try {
      const saved = localStorage.getItem(SETTINGS_SELECTED_KEY);
      if (saved && getAllSettingsPresets().some((p3) => p3.id === saved))
        return saved;
    } catch {}
    return "default";
  };
  const [selectedPresetId, setSelectedPresetId] = d2(restoreSelectedPreset);
  const [useCustom, setUseCustom] = d2(false);
  const [isEditing, setIsEditing] = d2(false);
  const [expanded, setExpanded] = d2(false);
  const [showSaveDialog, setShowSaveDialog] = d2(false);
  const [saveName, setSaveName] = d2("");
  const [importError, setImportError] = d2(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = d2(false);
  const fileInputRef = A2(null);
  const autosaveIntervalRef = A2(null);
  const doAutosaveRef = A2(null);
  const AUTOSAVE_NAME = "Autosave";
  const [timingOpen, setTimingOpen] = d2(false);
  const [recursionOpen, setRecursionOpen] = d2(false);
  const [groupOpen, setGroupOpen] = d2(false);
  const [metadataOpen, setMetadataOpen] = d2(false);
  y2(() => {
    setPresets(getAllSettingsPresets());
  }, []);
  const refreshPresets = q2(() => {
    setPresets(getAllSettingsPresets());
  }, []);
  const applyPreset = q2((id) => {
    if (id === "__custom__") {
      setUseCustom(true);
      return;
    }
    if (autosaveIntervalRef.current !== null) {
      clearInterval(autosaveIntervalRef.current);
      autosaveIntervalRef.current = null;
    }
    const preset = getSettingsPreset(id);
    if (preset) {
      onSettingsChange({ ...preset.settings });
      setSelectedPresetId(id);
      setUseCustom(false);
      setIsEditing(false);
      try {
        localStorage.setItem(SETTINGS_SELECTED_KEY, id);
      } catch {}
    }
  }, [onSettingsChange]);
  const handlePresetChange = q2((e3) => {
    const id = e3.target.value;
    if (id === selectedPresetId && !useCustom)
      return;
    if (id === "__custom__") {
      setUseCustom(true);
    } else {
      applyPreset(id);
    }
  }, [useCustom, applyPreset]);
  const ensureAutosavePreset = q2((overrideSettings) => {
    const currentPreset = presets.find((p3) => p3.id === selectedPresetId);
    if (currentPreset && !currentPreset.builtIn) {
      if (!isEditing)
        setIsEditing(true);
      return;
    }
    const autosave = presets.find((p3) => p3.name === AUTOSAVE_NAME && !p3.builtIn);
    if (autosave) {
      setSelectedPresetId(autosave.id);
      try {
        localStorage.setItem(SETTINGS_SELECTED_KEY, autosave.id);
      } catch {}
    } else {
      const saved = saveSettingsPreset(AUTOSAVE_NAME, overrideSettings ?? settings);
      refreshPresets();
      setSelectedPresetId(saved.id);
      try {
        localStorage.setItem(SETTINGS_SELECTED_KEY, saved.id);
      } catch {}
    }
    if (!isEditing)
      setIsEditing(true);
  }, [presets, selectedPresetId, settings, refreshPresets, isEditing]);
  const doAutosave = q2(() => {
    if (!isEditing)
      return;
    const currentPreset = presets.find((p3) => p3.id === selectedPresetId);
    if (currentPreset && !currentPreset.builtIn) {
      updateSettingsPreset(selectedPresetId, { settings });
      refreshPresets();
      return;
    }
    const existing = findSettingsPresetByName(AUTOSAVE_NAME);
    let saved;
    if (existing) {
      const updated = updateSettingsPreset(existing.id, { settings });
      if (!updated)
        return;
      saved = updated;
    } else {
      saved = saveSettingsPreset(AUTOSAVE_NAME, settings);
    }
    refreshPresets();
    setSelectedPresetId(saved.id);
    setIsEditing(false);
    try {
      localStorage.setItem(SETTINGS_SELECTED_KEY, saved.id);
    } catch {}
  }, [isEditing, settings, refreshPresets, presets, selectedPresetId]);
  doAutosaveRef.current = doAutosave;
  const stopAutosaveInterval = q2(() => {
    if (autosaveIntervalRef.current !== null) {
      clearInterval(autosaveIntervalRef.current);
      autosaveIntervalRef.current = null;
    }
  }, []);
  const startAutosaveInterval = q2(() => {
    stopAutosaveInterval();
    autosaveIntervalRef.current = setInterval(() => doAutosaveRef.current?.(), 3000);
  }, [stopAutosaveInterval]);
  y2(() => {
    return () => {
      doAutosaveRef.current?.();
      stopAutosaveInterval();
    };
  }, []);
  y2(() => {
    if (isEditing) {
      doAutosaveRef.current?.();
      startAutosaveInterval();
    } else {
      stopAutosaveInterval();
    }
  }, [isEditing]);
  const handleSavePreset = q2(() => {
    if (!saveName.trim())
      return;
    stopAutosaveInterval();
    setIsEditing(false);
    const saved = saveSettingsPreset(saveName.trim(), settings);
    refreshPresets();
    setSelectedPresetId(saved.id);
    setUseCustom(false);
    try {
      localStorage.setItem(SETTINGS_SELECTED_KEY, saved.id);
    } catch {}
    setSaveName("");
    setShowSaveDialog(false);
  }, [saveName, settings, refreshPresets, stopAutosaveInterval]);
  const selectedPreset = presets.find((p3) => p3.id === selectedPresetId);
  const handleDeleteClick = q2(() => {
    setShowDeleteConfirm(true);
  }, []);
  const handleConfirmDelete = q2(() => {
    if (!selectedPreset)
      return;
    deleteSettingsPreset(selectedPreset.id);
    refreshPresets();
    if (selectedPresetId === selectedPreset.id) {
      setSelectedPresetId("default");
      setIsEditing(false);
      try {
        localStorage.setItem(SETTINGS_SELECTED_KEY, "default");
      } catch {}
      const defaultPreset = getSettingsPreset("default");
      if (defaultPreset)
        onSettingsChange({ ...defaultPreset.settings });
    }
    setShowDeleteConfirm(false);
  }, [selectedPreset, selectedPresetId, refreshPresets, onSettingsChange]);
  const handleCancelDelete = q2(() => {
    setShowDeleteConfirm(false);
  }, []);
  y2(() => {
    if (showDeleteConfirm)
      setShowDeleteConfirm(false);
  }, [selectedPresetId]);
  const handleExport = q2(() => {
    const json = exportSettingsPresets();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a3 = document.createElement("a");
    a3.href = url;
    a3.download = `chronicle-settings-${new Date().toISOString().slice(0, 10)}.json`;
    a3.click();
    URL.revokeObjectURL(url);
  }, []);
  const handleImportFile = q2((e3) => {
    const input = e3.target;
    const file = input.files?.[0];
    if (!file)
      return;
    const reader = new FileReader;
    reader.onload = () => {
      const text = reader.result;
      const result = importSettingsPresets(text);
      if (result.success) {
        refreshPresets();
        setImportError(null);
      } else {
        setImportError(result.error || "Import failed");
      }
    };
    reader.readAsText(file);
    input.value = "";
  }, [refreshPresets]);
  const handleTriggerImport = q2(() => {
    fileInputRef.current?.click();
  }, []);
  const update = q2((key, value) => {
    const newSettings = { ...settings, [key]: value };
    onSettingsChange(newSettings);
    if (useCustom || selectedPreset && !selectedPreset.builtIn) {
      ensureAutosavePreset(newSettings);
    }
  }, [settings, onSettingsChange, ensureAutosavePreset, useCustom, selectedPreset]);
  const toggle = q2((key) => {
    update(key, !settings[key]);
  }, [update, settings]);
  return /* @__PURE__ */ u3("div", {
    "data-chronicle": "settings-manager",
    children: [
      /* @__PURE__ */ u3("div", {
        class: "chronicle-sm-row",
        children: [
          /* @__PURE__ */ u3("label", {
            class: "chronicle-sm-label",
            children: "Lorebook Settings Preset"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ u3("select", {
            class: "chronicle-sm-select",
            value: useCustom ? "__custom__" : selectedPresetId,
            onChange: handlePresetChange,
            disabled: loading,
            children: [
              presets.map((p3) => /* @__PURE__ */ u3("option", {
                value: p3.id,
                children: [
                  p3.name,
                  p3.builtIn ? "" : " (custom)"
                ]
              }, p3.id, true, undefined, this)),
              /* @__PURE__ */ u3("option", {
                value: "__custom__",
                children: "Custom settings…"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ u3("div", {
        class: "chronicle-sm-preview-bar",
        children: [
          /* @__PURE__ */ u3("span", {
            class: "chronicle-sm-summary",
            onClick: () => setExpanded((e3) => !e3),
            children: [
              expanded ? "▼" : "▶",
              " View settings"
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ u3("div", {
            class: "chronicle-sm-toolbar",
            children: [
              selectedPreset && !selectedPreset.builtIn && /* @__PURE__ */ u3("button", {
                class: "chronicle-sm-delete-btn",
                onClick: handleDeleteClick,
                disabled: loading,
                title: "Delete this preset",
                children: "Delete Preset"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ u3("button", {
                class: "chronicle-sm-tool-btn",
                onClick: () => setShowSaveDialog(true),
                disabled: loading || !useCustom,
                title: "Save as preset",
                children: "Save"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ u3("button", {
                class: "chronicle-sm-tool-btn",
                onClick: handleExport,
                disabled: presets.filter((p3) => !p3.builtIn).length === 0,
                title: "Export custom presets",
                children: "Export"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ u3("button", {
                class: "chronicle-sm-tool-btn",
                onClick: handleTriggerImport,
                disabled: loading,
                title: "Import presets from file",
                children: "Import"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ u3("input", {
                ref: fileInputRef,
                type: "file",
                accept: ".json",
                style: { display: "none" },
                onChange: handleImportFile
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      expanded && /* @__PURE__ */ u3("div", {
        class: "chronicle-sm-form",
        children: [
          /* @__PURE__ */ u3("span", {
            class: "chronicle-sm-section-heading",
            children: "Injection"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ u3("div", {
            class: "chronicle-sm-field-group",
            children: /* @__PURE__ */ u3("div", {
              class: "chronicle-sm-field-row",
              children: [
                /* @__PURE__ */ u3("div", {
                  class: "chronicle-sm-field",
                  children: [
                    /* @__PURE__ */ u3("label", {
                      class: "chronicle-sm-field-label",
                      children: "Position"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ u3("select", {
                      class: "chronicle-sm-select",
                      value: settings.position,
                      onChange: (e3) => update("position", Number(e3.target.value)),
                      children: POSITION_OPTIONS.map((opt) => /* @__PURE__ */ u3("option", {
                        value: opt.value,
                        children: opt.label
                      }, opt.value, false, undefined, this))
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this),
                settings.position === 4 && /* @__PURE__ */ u3("div", {
                  class: "chronicle-sm-field chronicle-sm-field-small",
                  children: [
                    /* @__PURE__ */ u3("label", {
                      class: "chronicle-sm-field-label",
                      children: "Depth"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ u3("input", {
                      type: "number",
                      class: "chronicle-sm-input",
                      value: settings.depth,
                      min: 0,
                      onInput: (e3) => update("depth", parseInt(e3.target.value) || 0)
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this),
                /* @__PURE__ */ u3("div", {
                  class: "chronicle-sm-field",
                  children: [
                    /* @__PURE__ */ u3("label", {
                      class: "chronicle-sm-field-label",
                      children: "Role"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ u3("select", {
                      class: "chronicle-sm-select",
                      value: settings.role,
                      onChange: (e3) => update("role", e3.target.value),
                      children: ROLE_OPTIONS.map((opt) => /* @__PURE__ */ u3("option", {
                        value: opt.value,
                        children: opt.label
                      }, opt.value, false, undefined, this))
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this),
                /* @__PURE__ */ u3("div", {
                  class: "chronicle-sm-field chronicle-sm-field-small",
                  children: [
                    /* @__PURE__ */ u3("label", {
                      class: "chronicle-sm-field-label",
                      children: "Order"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ u3("input", {
                      type: "number",
                      class: "chronicle-sm-input",
                      value: settings.order,
                      onInput: (e3) => update("order", parseInt(e3.target.value) || 0)
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this)
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ u3("span", {
            class: "chronicle-sm-section-heading",
            children: "Activation"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ u3("div", {
            class: "chronicle-sm-field-group",
            children: [
              /* @__PURE__ */ u3("div", {
                class: "chronicle-sm-toggle-row",
                children: [
                  /* @__PURE__ */ u3("label", {
                    class: "chronicle-sm-toggle",
                    children: [
                      /* @__PURE__ */ u3("input", {
                        type: "checkbox",
                        checked: settings.selective,
                        onChange: () => toggle("selective"),
                        disabled: loading
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ u3("span", {
                        children: "Selective"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ u3("label", {
                    class: "chronicle-sm-toggle",
                    children: [
                      /* @__PURE__ */ u3("input", {
                        type: "checkbox",
                        checked: settings.constant,
                        onChange: () => toggle("constant"),
                        disabled: loading
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ u3("span", {
                        children: "Constant"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ u3("label", {
                    class: "chronicle-sm-toggle",
                    children: [
                      /* @__PURE__ */ u3("input", {
                        type: "checkbox",
                        checked: settings.disabled,
                        onChange: () => toggle("disabled"),
                        disabled: loading
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ u3("span", {
                        children: "Disabled"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ u3("label", {
                    class: "chronicle-sm-toggle",
                    children: [
                      /* @__PURE__ */ u3("input", {
                        type: "checkbox",
                        checked: settings.caseSensitive,
                        onChange: () => toggle("caseSensitive"),
                        disabled: loading
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ u3("span", {
                        children: "Case Sensitive"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ u3("label", {
                    class: "chronicle-sm-toggle",
                    children: [
                      /* @__PURE__ */ u3("input", {
                        type: "checkbox",
                        checked: settings.matchWholeWords,
                        onChange: () => toggle("matchWholeWords"),
                        disabled: loading
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ u3("span", {
                        children: "Match Whole Words"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ u3("label", {
                    class: "chronicle-sm-toggle",
                    children: [
                      /* @__PURE__ */ u3("input", {
                        type: "checkbox",
                        checked: settings.useRegex,
                        onChange: () => toggle("useRegex"),
                        disabled: loading
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ u3("span", {
                        children: "Use Regex"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ u3("label", {
                    class: "chronicle-sm-toggle",
                    children: [
                      /* @__PURE__ */ u3("input", {
                        type: "checkbox",
                        checked: settings.useProbability,
                        onChange: () => toggle("useProbability"),
                        disabled: loading
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ u3("span", {
                        children: "Use Probability"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ u3("label", {
                    class: "chronicle-sm-toggle",
                    children: [
                      /* @__PURE__ */ u3("input", {
                        type: "checkbox",
                        checked: settings.vectorized,
                        onChange: () => toggle("vectorized"),
                        disabled: loading
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ u3("span", {
                        children: "Vectorized"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ u3("div", {
                class: "chronicle-sm-field-row",
                children: [
                  /* @__PURE__ */ u3("div", {
                    class: "chronicle-sm-field chronicle-sm-field-small",
                    children: [
                      /* @__PURE__ */ u3("label", {
                        class: "chronicle-sm-field-label",
                        children: "Probability"
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ u3("input", {
                        type: "number",
                        class: "chronicle-sm-input",
                        value: settings.probability,
                        min: 0,
                        max: 100,
                        onInput: (e3) => update("probability", parseInt(e3.target.value) || 0)
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ u3("div", {
                    class: "chronicle-sm-field chronicle-sm-field-small",
                    children: [
                      /* @__PURE__ */ u3("label", {
                        class: "chronicle-sm-field-label",
                        children: "Scan Depth"
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ u3("input", {
                        type: "number",
                        class: "chronicle-sm-input",
                        value: settings.scanDepth ?? "",
                        min: 0,
                        placeholder: "Default",
                        onInput: (e3) => {
                          const val = e3.target.value;
                          update("scanDepth", val === "" ? null : parseInt(val) || 0);
                        }
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  settings.selective && /* @__PURE__ */ u3("div", {
                    class: "chronicle-sm-field",
                    children: [
                      /* @__PURE__ */ u3("label", {
                        class: "chronicle-sm-field-label",
                        children: "Selective Logic"
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ u3("select", {
                        class: "chronicle-sm-select",
                        value: settings.selectiveLogic,
                        onChange: (e3) => update("selectiveLogic", Number(e3.target.value)),
                        children: SELECTIVE_LOGIC_OPTIONS.map((opt) => /* @__PURE__ */ u3("option", {
                          value: opt.value,
                          children: opt.label
                        }, opt.value, false, undefined, this))
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ u3("button", {
            type: "button",
            class: "chronicle-sm-group-toggle",
            onClick: () => setTimingOpen((o3) => !o3),
            children: [
              /* @__PURE__ */ u3("span", {
                class: `chronicle-sm-chevron ${timingOpen ? "chronicle-sm-chevron-open" : ""}`,
                children: "▶"
              }, undefined, false, undefined, this),
              "Timing"
            ]
          }, undefined, true, undefined, this),
          timingOpen && /* @__PURE__ */ u3("div", {
            class: "chronicle-sm-field-group",
            children: /* @__PURE__ */ u3("div", {
              class: "chronicle-sm-field-row",
              children: [
                /* @__PURE__ */ u3("div", {
                  class: "chronicle-sm-field chronicle-sm-field-small",
                  children: [
                    /* @__PURE__ */ u3("label", {
                      class: "chronicle-sm-field-label",
                      children: "Priority"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ u3("input", {
                      type: "number",
                      class: "chronicle-sm-input",
                      value: settings.priority,
                      onInput: (e3) => update("priority", parseInt(e3.target.value) || 0)
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this),
                /* @__PURE__ */ u3("div", {
                  class: "chronicle-sm-field chronicle-sm-field-small",
                  children: [
                    /* @__PURE__ */ u3("label", {
                      class: "chronicle-sm-field-label",
                      children: "Sticky"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ u3("input", {
                      type: "number",
                      class: "chronicle-sm-input",
                      value: settings.sticky,
                      min: 0,
                      onInput: (e3) => update("sticky", parseInt(e3.target.value) || 0)
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this),
                /* @__PURE__ */ u3("div", {
                  class: "chronicle-sm-field chronicle-sm-field-small",
                  children: [
                    /* @__PURE__ */ u3("label", {
                      class: "chronicle-sm-field-label",
                      children: "Cooldown"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ u3("input", {
                      type: "number",
                      class: "chronicle-sm-input",
                      value: settings.cooldown,
                      min: 0,
                      onInput: (e3) => update("cooldown", parseInt(e3.target.value) || 0)
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this),
                /* @__PURE__ */ u3("div", {
                  class: "chronicle-sm-field chronicle-sm-field-small",
                  children: [
                    /* @__PURE__ */ u3("label", {
                      class: "chronicle-sm-field-label",
                      children: "Delay"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ u3("input", {
                      type: "number",
                      class: "chronicle-sm-input",
                      value: settings.delay,
                      min: 0,
                      onInput: (e3) => update("delay", parseInt(e3.target.value) || 0)
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this)
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ u3("button", {
            type: "button",
            class: "chronicle-sm-group-toggle",
            onClick: () => setRecursionOpen((o3) => !o3),
            children: [
              /* @__PURE__ */ u3("span", {
                class: `chronicle-sm-chevron ${recursionOpen ? "chronicle-sm-chevron-open" : ""}`,
                children: "▶"
              }, undefined, false, undefined, this),
              "Recursion",
              settings.vectorized ? " (inactive for vector)" : ""
            ]
          }, undefined, true, undefined, this),
          recursionOpen && /* @__PURE__ */ u3("div", {
            class: "chronicle-sm-field-group",
            children: [
              settings.vectorized && /* @__PURE__ */ u3("div", {
                class: "chronicle-sm-inactive-note",
                children: "Vectorized entries do not participate in recursive keyword chaining. Semantic retrieval uses indexed content directly."
              }, undefined, false, undefined, this),
              /* @__PURE__ */ u3("div", {
                class: "chronicle-sm-toggle-row",
                children: [
                  /* @__PURE__ */ u3("label", {
                    class: "chronicle-sm-toggle",
                    children: [
                      /* @__PURE__ */ u3("input", {
                        type: "checkbox",
                        checked: settings.preventRecursion,
                        onChange: () => toggle("preventRecursion"),
                        disabled: loading || settings.vectorized
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ u3("span", {
                        children: "Prevent Recursion"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ u3("label", {
                    class: "chronicle-sm-toggle",
                    children: [
                      /* @__PURE__ */ u3("input", {
                        type: "checkbox",
                        checked: settings.excludeRecursion,
                        onChange: () => toggle("excludeRecursion"),
                        disabled: loading || settings.vectorized
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ u3("span", {
                        children: "Exclude Recursion"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ u3("label", {
                    class: "chronicle-sm-toggle",
                    children: [
                      /* @__PURE__ */ u3("input", {
                        type: "checkbox",
                        checked: settings.delayUntilRecursion,
                        onChange: () => toggle("delayUntilRecursion"),
                        disabled: loading || settings.vectorized
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ u3("span", {
                        children: "Delay Until Recursion"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ u3("button", {
            type: "button",
            class: "chronicle-sm-group-toggle",
            onClick: () => setGroupOpen((o3) => !o3),
            children: [
              /* @__PURE__ */ u3("span", {
                class: `chronicle-sm-chevron ${groupOpen ? "chronicle-sm-chevron-open" : ""}`,
                children: "▶"
              }, undefined, false, undefined, this),
              "Group"
            ]
          }, undefined, true, undefined, this),
          groupOpen && /* @__PURE__ */ u3("div", {
            class: "chronicle-sm-field-group",
            children: [
              /* @__PURE__ */ u3("div", {
                class: "chronicle-sm-field-row",
                children: [
                  /* @__PURE__ */ u3("div", {
                    class: "chronicle-sm-field",
                    children: [
                      /* @__PURE__ */ u3("label", {
                        class: "chronicle-sm-field-label",
                        children: "Group Name"
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ u3("input", {
                        type: "text",
                        class: "chronicle-sm-input",
                        value: settings.groupName,
                        onInput: (e3) => update("groupName", e3.target.value)
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ u3("div", {
                    class: "chronicle-sm-field chronicle-sm-field-small",
                    children: [
                      /* @__PURE__ */ u3("label", {
                        class: "chronicle-sm-field-label",
                        children: "Weight"
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ u3("input", {
                        type: "number",
                        class: "chronicle-sm-input",
                        value: settings.groupWeight,
                        onInput: (e3) => update("groupWeight", parseInt(e3.target.value) || 0)
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ u3("label", {
                class: "chronicle-sm-toggle",
                children: [
                  /* @__PURE__ */ u3("input", {
                    type: "checkbox",
                    checked: settings.groupOverride,
                    onChange: () => toggle("groupOverride"),
                    disabled: loading
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ u3("span", {
                    children: "Group Override"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ u3("button", {
            type: "button",
            class: "chronicle-sm-group-toggle",
            onClick: () => setMetadataOpen((o3) => !o3),
            children: [
              /* @__PURE__ */ u3("span", {
                class: `chronicle-sm-chevron ${metadataOpen ? "chronicle-sm-chevron-open" : ""}`,
                children: "▶"
              }, undefined, false, undefined, this),
              "Metadata"
            ]
          }, undefined, true, undefined, this),
          metadataOpen && /* @__PURE__ */ u3("div", {
            class: "chronicle-sm-field-group",
            children: /* @__PURE__ */ u3("div", {
              class: "chronicle-sm-field",
              children: [
                /* @__PURE__ */ u3("label", {
                  class: "chronicle-sm-field-label",
                  children: "Automation ID"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ u3("input", {
                  type: "text",
                  class: "chronicle-sm-input",
                  value: settings.automationId,
                  onInput: (e3) => update("automationId", e3.target.value)
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      importError && /* @__PURE__ */ u3("div", {
        class: "chronicle-sm-error",
        children: importError
      }, undefined, false, undefined, this),
      showSaveDialog && /* @__PURE__ */ u3("div", {
        class: "chronicle-sm-overlay",
        onClick: () => setShowSaveDialog(false),
        children: /* @__PURE__ */ u3("div", {
          class: "chronicle-sm-dialog",
          onClick: (e3) => e3.stopPropagation(),
          children: [
            /* @__PURE__ */ u3("h4", {
              children: "Save Settings as Preset"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ u3("input", {
              class: "chronicle-sm-input",
              value: saveName,
              onInput: (e3) => setSaveName(e3.target.value),
              placeholder: "Preset name…",
              onKeyDown: (e3) => e3.key === "Enter" && handleSavePreset(),
              autoFocus: true
            }, undefined, false, undefined, this),
            /* @__PURE__ */ u3("div", {
              class: "chronicle-sm-dialog-actions",
              children: [
                /* @__PURE__ */ u3("button", {
                  class: "chronicle-sm-dialog-btn",
                  onClick: () => setShowSaveDialog(false),
                  children: "Cancel"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ u3("button", {
                  class: "chronicle-sm-dialog-btn chronicle-sm-dialog-primary",
                  onClick: handleSavePreset,
                  disabled: !saveName.trim(),
                  children: "Save"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      showDeleteConfirm && selectedPreset && /* @__PURE__ */ u3("div", {
        class: "chronicle-dc-overlay",
        onClick: handleCancelDelete,
        children: /* @__PURE__ */ u3("div", {
          class: "chronicle-dc-dialog",
          onClick: (e3) => e3.stopPropagation(),
          children: [
            /* @__PURE__ */ u3("h4", {
              children: "Delete Preset"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ u3("p", {
              class: "chronicle-dc-message",
              children: [
                "Are you sure you want to delete ",
                /* @__PURE__ */ u3("strong", {
                  children: selectedPreset.name
                }, undefined, false, undefined, this),
                "? This cannot be undone."
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ u3("div", {
              class: "chronicle-dc-actions",
              children: [
                /* @__PURE__ */ u3("button", {
                  class: "chronicle-dc-btn chronicle-dc-btn-delete",
                  onClick: handleConfirmDelete,
                  children: "Delete Preset"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ u3("button", {
                  class: "chronicle-dc-btn",
                  onClick: handleCancelDelete,
                  children: "Cancel"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
};

// src/connections.ts
var CONNECTION_STORAGE_KEY = "chronicle_selected_connection";
var DEFAULT_CONNECTION_ID = "__default__";
function loadSelectedConnectionId() {
  try {
    return localStorage.getItem(CONNECTION_STORAGE_KEY) || DEFAULT_CONNECTION_ID;
  } catch {
    return DEFAULT_CONNECTION_ID;
  }
}
function saveSelectedConnectionId(id) {
  try {
    if (id === DEFAULT_CONNECTION_ID) {
      localStorage.removeItem(CONNECTION_STORAGE_KEY);
    } else {
      localStorage.setItem(CONNECTION_STORAGE_KEY, id);
    }
  } catch (err) {
    console.error("[Chronicle] Failed to save connection selection:", err);
  }
}

// src/components/ConnectionManager.tsx
var ConnectionManager = ({
  onConnectionChange,
  loading = false,
  onOpenConnectionsDrawer
}) => {
  const [connections, setConnections] = d2([]);
  const [selectedId, setSelectedId] = d2(loadSelectedConnectionId);
  const [fetching, setFetching] = d2(true);
  const [hintDismissed, setHintDismissed] = d2(() => {
    try {
      return localStorage.getItem("chronicle:connHintDismissed") === "true";
    } catch {
      return false;
    }
  });
  const receivedRef = A2(false);
  const ctx = useChronicleCtx();
  y2(() => {
    if (ctx) {
      try {
        ctx.sendToBackend({ type: "list_connections" });
      } catch {
        console.warn("[Chronicle] Failed to request connection list");
      }
    }
    const timer = setTimeout(() => setFetching(false), 15000);
    return () => clearTimeout(timer);
  }, [ctx]);
  y2(() => {
    const handler = (e3) => {
      const msg = e3.detail;
      if (!msg)
        return;
      if (msg.type === "connections_list" && Array.isArray(msg.connections)) {
        if (receivedRef.current)
          return;
        receivedRef.current = true;
        const conns = msg.connections;
        setConnections(conns);
        setSelectedId((current) => {
          if (current !== DEFAULT_CONNECTION_ID && !conns.some((c3) => c3.id === current)) {
            saveSelectedConnectionId(DEFAULT_CONNECTION_ID);
            return DEFAULT_CONNECTION_ID;
          }
          return current;
        });
        setFetching(false);
      }
    };
    window.addEventListener("chronicle:backend-message", handler);
    return () => window.removeEventListener("chronicle:backend-message", handler);
  }, []);
  const effectiveConnectionId = selectedId === DEFAULT_CONNECTION_ID ? undefined : selectedId;
  y2(() => {
    if (fetching)
      return;
    onConnectionChange?.(effectiveConnectionId);
  }, [effectiveConnectionId, onConnectionChange, fetching]);
  const handleChange = (e3) => {
    const id = e3.target.value;
    setSelectedId(id);
    saveSelectedConnectionId(id);
  };
  const dismissHint = () => {
    setHintDismissed(true);
    try {
      localStorage.setItem("chronicle:connHintDismissed", "true");
    } catch {}
  };
  const isDisabled = loading || fetching;
  return /* @__PURE__ */ u3("div", {
    "data-chronicle": "connection-manager",
    children: [
      /* @__PURE__ */ u3("div", {
        class: "chronicle-conn-row",
        children: [
          /* @__PURE__ */ u3("label", {
            class: "chronicle-conn-label",
            children: "Connection Profile"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ u3("select", {
            class: "chronicle-conn-select",
            value: selectedId,
            onChange: handleChange,
            disabled: isDisabled,
            children: [
              /* @__PURE__ */ u3("option", {
                value: DEFAULT_CONNECTION_ID,
                children: fetching ? "Loading…" : "Default"
              }, undefined, false, undefined, this),
              connections.map((c3) => /* @__PURE__ */ u3("option", {
                value: c3.id,
                children: [
                  c3.name,
                  " (",
                  c3.provider,
                  ")"
                ]
              }, c3.id, true, undefined, this))
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      !hintDismissed && /* @__PURE__ */ u3("div", {
        class: "chronicle-conn-hint",
        children: [
          /* @__PURE__ */ u3("span", {
            class: "chronicle-conn-hint-icon",
            children: "ⓘ"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ u3("span", {
            class: "chronicle-conn-hint-text",
            children: [
              "To use a different model, please set up a new",
              " ",
              /* @__PURE__ */ u3("button", {
                class: "chronicle-conn-link",
                onClick: () => onOpenConnectionsDrawer?.(),
                children: "connection profile"
              }, undefined, false, undefined, this),
              " ",
              "to use for summaries.",
              /* @__PURE__ */ u3("br", {}, undefined, false, undefined, this),
              "(Tip: Duplicate your current one to avoid re-entering API key)"
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ u3("button", {
            class: "chronicle-conn-hint-close",
            onClick: dismissHint,
            title: "Dismiss",
            children: "✕"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
};

// src/components/LorebookManager.tsx
var AUTO_GENERATE_ID = "__auto_generate__";
var DEFAULT_LOREBOOK_ID = "__default__";
var LOREBOOK_SELECTED_KEY = "chronicle_selected_lorebook";
var LorebookManager = ({
  onLorebookChange,
  loading = false
}) => {
  const [chatLinked, setChatLinked] = d2(null);
  const [characterLinked, setCharacterLinked] = d2(null);
  const [allLorebooks, setAllLorebooks] = d2([]);
  const [fetching, setFetching] = d2(true);
  const restoreSelection = () => {
    try {
      const saved = localStorage.getItem(LOREBOOK_SELECTED_KEY);
      if (saved) {
        if (saved === DEFAULT_LOREBOOK_ID) {
          localStorage.removeItem(LOREBOOK_SELECTED_KEY);
          return AUTO_GENERATE_ID;
        }
        return saved;
      }
    } catch {}
    return AUTO_GENERATE_ID;
  };
  const [selectedId, setSelectedId] = d2(restoreSelection);
  const receivedRef = A2(false);
  const ctx = useChronicleCtx();
  y2(() => {
    if (ctx) {
      try {
        ctx.sendToBackend({ type: "list_lorebooks" });
      } catch {
        console.warn("[Chronicle] Failed to request lorebook list");
      }
    }
    const timer = setTimeout(() => setFetching(false), 15000);
    return () => clearTimeout(timer);
  }, [ctx]);
  y2(() => {
    const handler = (e3) => {
      const msg = e3.detail;
      if (!msg)
        return;
      if (msg.type === "lorebooks_list") {
        if (receivedRef.current)
          return;
        receivedRef.current = true;
        const chat = msg.chatLinked ? msg.chatLinked : null;
        const char = msg.characterLinked ? msg.characterLinked : null;
        const books = msg.allLorebooks || [];
        setChatLinked(chat);
        setCharacterLinked(char);
        setAllLorebooks(books);
        setSelectedId((current) => {
          if (current === AUTO_GENERATE_ID || current === DEFAULT_LOREBOOK_ID)
            return current;
          if (chat?.id === current || char?.id === current)
            return current;
          if (books.some((b2) => b2.id === current))
            return current;
          try {
            localStorage.setItem(LOREBOOK_SELECTED_KEY, AUTO_GENERATE_ID);
          } catch {}
          return AUTO_GENERATE_ID;
        });
        setFetching(false);
      }
    };
    window.addEventListener("chronicle:backend-message", handler);
    return () => window.removeEventListener("chronicle:backend-message", handler);
  }, []);
  y2(() => {
    if (fetching)
      return;
    const effectiveId = selectedId === DEFAULT_LOREBOOK_ID ? undefined : selectedId;
    onLorebookChange?.(effectiveId);
  }, [selectedId, onLorebookChange, fetching]);
  const handleChange = (e3) => {
    const id = e3.target.value;
    setSelectedId(id);
    try {
      localStorage.setItem(LOREBOOK_SELECTED_KEY, id);
    } catch {}
  };
  const linkedIds = new Set;
  if (chatLinked)
    linkedIds.add(chatLinked.id);
  if (characterLinked)
    linkedIds.add(characterLinked.id);
  const isDisabled = loading || fetching;
  return /* @__PURE__ */ u3("div", {
    "data-chronicle": "lorebook-manager",
    children: /* @__PURE__ */ u3("div", {
      class: "chronicle-lb-row",
      children: [
        /* @__PURE__ */ u3("label", {
          class: "chronicle-lb-label",
          children: "Lorebook to Use"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ u3("select", {
          class: "chronicle-lb-select",
          value: selectedId,
          onChange: handleChange,
          disabled: isDisabled,
          children: [
            characterLinked ? /* @__PURE__ */ u3("option", {
              value: characterLinked.id,
              children: [
                "Character-linked (",
                characterLinked.name,
                ")"
              ]
            }, undefined, true, undefined, this) : !fetching ? /* @__PURE__ */ u3("option", {
              value: "",
              disabled: true,
              children: "Character-linked (empty)"
            }, undefined, false, undefined, this) : null,
            chatLinked ? /* @__PURE__ */ u3("option", {
              value: chatLinked.id,
              children: [
                "Persona-linked (",
                chatLinked.name,
                ")"
              ]
            }, undefined, true, undefined, this) : !fetching ? /* @__PURE__ */ u3("option", {
              value: "",
              disabled: true,
              children: "Persona-linked (empty)"
            }, undefined, false, undefined, this) : null,
            /* @__PURE__ */ u3("option", {
              value: AUTO_GENERATE_ID,
              children: "Auto Generate"
            }, undefined, false, undefined, this),
            allLorebooks.filter((b2) => !linkedIds.has(b2.id)).map((b2) => /* @__PURE__ */ u3("option", {
              value: b2.id,
              children: b2.name
            }, b2.id, false, undefined, this))
          ]
        }, undefined, true, undefined, this),
        fetching && /* @__PURE__ */ u3("span", {
          style: {
            fontSize: "calc(10px * var(--lumiverse-font-scale, 1))",
            color: "var(--lumiverse-text-dim)",
            marginTop: 2
          },
          children: "Loading lorebooks…"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
};

// src/types.ts
var PROTOCOL_VERSION = 2;
function isValidSummarizeRequestV2(payload) {
  if (!payload || typeof payload !== "object")
    return false;
  const p3 = payload;
  return p3.type === "summarize_v2" && p3.protocolVersion === PROTOCOL_VERSION && Array.isArray(p3.messageIds) && p3.messageIds.length > 0 && p3.messageIds.every((id) => typeof id === "string") && typeof p3.previewOnly === "boolean";
}
function isValidSaveSummaryRequest(payload) {
  if (!payload || typeof payload !== "object")
    return false;
  const p3 = payload;
  return p3.type === "save_summary" && typeof p3.requestId === "string";
}
function isValidDiscardSummaryRequest(payload) {
  if (!payload || typeof payload !== "object")
    return false;
  const p3 = payload;
  return p3.type === "discard_summary" && typeof p3.requestId === "string";
}
function isValidListConnectionsRequest(payload) {
  if (!payload || typeof payload !== "object")
    return false;
  return payload.type === "list_connections";
}
function isValidListLorebooksRequest(payload) {
  if (!payload || typeof payload !== "object")
    return false;
  return payload.type === "list_lorebooks";
}

// src/components/SummarizeFlow.tsx
var TITLE_FORMAT_PRESETS = [
  { label: "{title}", value: "{title}" },
  { label: "{number} - {title}", value: "{number} - {title}" },
  { label: "{date} - {title}", value: "{date} - {title}" },
  { label: "{date} {time} - {title}", value: "{date} {time} - {title}" },
  { label: "Chronicle: {title}", value: "Chronicle: {title}" },
  { label: "Chronicle: {title} ({date})", value: "Chronicle: {title} ({date})" },
  { label: "Custom…", value: "__custom__" }
];
var SummarizeFlow = (props) => {
  const {
    selectedCount,
    onRequestClose,
    preview: previewProp,
    entrySettings: entrySettingsProp,
    lorebookId: lorebookIdProp,
    initialActivePrompt,
    initialConnectionId,
    initialGenerationParams,
    onGenerateStart
  } = props;
  const [flowState, setFlowState] = d2(previewProp ? "preview" : "idle");
  const [previewData, setPreviewData] = d2(previewProp ?? null);
  const [errorMessage, setErrorMessage] = d2(null);
  const [errorStage, setErrorStage] = d2(undefined);
  const [errorRetryable, setErrorRetryable] = d2(true);
  const [activePrompt, setActivePrompt] = d2(initialActivePrompt ?? undefined);
  const [summaryTitle, setSummaryTitle] = d2(previewProp?.title ?? "");
  const [summaryKeys, setSummaryKeys] = d2(previewProp?.keys ?? []);
  const [summaryContent, setSummaryContent] = d2(previewProp?.content ?? "");
  const [entrySettings, setEntrySettings] = d2(entrySettingsProp ?? { ...DEFAULT_SETTINGS });
  const [connectionId, setConnectionId] = d2(initialConnectionId ?? undefined);
  const [lorebookId, setLorebookId] = d2(lorebookIdProp ?? undefined);
  const [autoHidePrior, setAutoHidePrior] = d2(() => {
    try {
      return localStorage.getItem("chronicle:autoHidePrior") === "true";
    } catch {
      return true;
    }
  });
  const [keepVisibleCount, setKeepVisibleCount] = d2(() => {
    try {
      const v3 = localStorage.getItem("chronicle:keepVisibleCount");
      return v3 ? Math.max(0, parseInt(v3, 10) || 0) : 10;
    } catch {
      return 10;
    }
  });
  const [includeRecentContext, setIncludeRecentContext] = d2(() => {
    try {
      return localStorage.getItem("chronicle:includeRecentContext") === "true";
    } catch {
      return false;
    }
  });
  const [recentContextCount, setRecentContextCount] = d2(() => {
    try {
      const v3 = localStorage.getItem("chronicle:recentContextCount");
      return v3 ? Math.max(1, Math.min(10, parseInt(v3, 10) || 3)) : 3;
    } catch {
      return 3;
    }
  });
  const [generationParams, setGenerationParams] = d2(initialGenerationParams ? { ...initialGenerationParams } : { ...DEFAULT_PARAMS });
  const DEFAULT_TITLE_FORMAT = "{number} - {title}";
  const [titleFormat, setTitleFormat] = d2(() => {
    try {
      return localStorage.getItem("chronicle:titleFormat") || DEFAULT_TITLE_FORMAT;
    } catch {
      return DEFAULT_TITLE_FORMAT;
    }
  });
  const [useCustomFormat, setUseCustomFormat] = d2(() => {
    try {
      return localStorage.getItem("chronicle:useCustomTitleFormat") === "true";
    } catch {
      return false;
    }
  });
  const selectedFormatValue = useCustomFormat ? "__custom__" : titleFormat;
  const previewDataRef = A2(previewProp ?? null);
  const flowStateRef = A2(previewProp ? "preview" : "idle");
  previewDataRef.current = previewData;
  flowStateRef.current = flowState;
  const ctx = useChronicleCtx();
  const sendToBackend = q2((payload) => {
    if (!ctx)
      return;
    try {
      ctx.sendToBackend(payload);
    } catch {}
  }, [ctx]);
  y2(() => {
    if (previewProp) {
      setSummaryTitle(previewProp.title);
      setSummaryKeys(previewProp.keys ?? []);
    }
  }, [previewProp]);
  y2(() => {
    try {
      localStorage.setItem("chronicle:autoHidePrior", String(autoHidePrior));
    } catch {}
  }, [autoHidePrior]);
  y2(() => {
    try {
      localStorage.setItem("chronicle:keepVisibleCount", String(keepVisibleCount));
    } catch {}
  }, [keepVisibleCount]);
  y2(() => {
    try {
      localStorage.setItem("chronicle:useCustomTitleFormat", String(useCustomFormat));
    } catch {}
  }, [useCustomFormat]);
  y2(() => {
    return () => {
      if (flowStateRef.current === "saving")
        return;
      const activePreview = previewDataRef.current;
      if (activePreview) {
        try {
          ctx?.sendToBackend({ type: "discard_summary", requestId: activePreview.requestId });
        } catch {}
      }
    };
  }, [ctx]);
  const onRequestCloseRef = A2(onRequestClose);
  y2(() => {
    onRequestCloseRef.current = onRequestClose;
  }, [onRequestClose]);
  y2(() => {
    const handler = (e3) => {
      const msg = e3.detail;
      if (!msg)
        return;
      switch (msg.type) {
        case "summarize_preview": {
          const data = msg;
          setPreviewData(data);
          setFlowState("preview");
          setSummaryTitle(data.title);
          setSummaryKeys(data.keys ?? []);
          setSummaryContent(data.content ?? "");
          setErrorMessage(null);
          break;
        }
        case "summarize_saved": {
          onRequestCloseRef.current?.();
          break;
        }
        case "summarize_failed": {
          setFlowState("error");
          setErrorMessage(msg.error);
          setErrorStage(msg.stage);
          setErrorRetryable(msg.retryable ?? true);
          break;
        }
        case "summarize_progress": {
          if (msg.stage === "saving") {
            setFlowState("saving");
          }
          break;
        }
      }
    };
    window.addEventListener("chronicle:backend-message", handler);
    return () => window.removeEventListener("chronicle:backend-message", handler);
  }, []);
  y2(() => {
    if (selectedCount === 0 && flowState !== "saving" && flowState !== "preview") {
      resetFlow();
    }
  }, [selectedCount]);
  y2(() => {
    if (flowState !== "saving")
      return;
    const timer = setTimeout(() => {
      setFlowState("save_timeout");
    }, 15000);
    return () => clearTimeout(timer);
  }, [flowState]);
  const resetFlow = q2(() => {
    setFlowState("idle");
    setPreviewData(null);
    setErrorMessage(null);
    setErrorStage(undefined);
    setErrorRetryable(true);
    setSummaryTitle("");
    setSummaryContent("");
  }, []);
  const discardPending = q2((requestId) => {
    sendToBackend({ type: "discard_summary", requestId });
  }, [sendToBackend]);
  const handleCreateSummary = q2((customPrompt) => {
    if (previewData) {
      discardPending(previewData.requestId);
      setPreviewData(null);
      previewDataRef.current = null;
    }
    const ids = getSelectedMessageIds();
    if (ids.length === 0) {
      setFlowState("error");
      setErrorMessage("No messages currently selected.");
      return;
    }
    sendToBackend({
      type: "summarize_v2",
      protocolVersion: PROTOCOL_VERSION,
      messageIds: ids,
      customPrompt,
      previewOnly: true,
      connectionId,
      worldBookId: lorebookId,
      autoHidePrior,
      keepVisibleCount: autoHidePrior ? keepVisibleCount : 0,
      params: generationParams,
      includeRecentContext,
      recentContextCount
    });
    onGenerateStart?.({
      customPrompt,
      connectionId,
      lorebookId,
      entrySettings,
      activePrompt: customPrompt ?? activePrompt,
      generationParams
    });
  }, [sendToBackend, previewData, discardPending, connectionId, lorebookId, onGenerateStart, entrySettings, activePrompt, autoHidePrior, keepVisibleCount, includeRecentContext, recentContextCount, generationParams]);
  const handleRetry = q2(() => {
    if (previewData) {
      discardPending(previewData.requestId);
    }
    setPreviewData(null);
    setErrorMessage(null);
    handleCreateSummary(activePrompt);
  }, [previewData, discardPending, handleCreateSummary, activePrompt]);
  const handleSave = q2(() => {
    if (!previewData)
      return;
    setFlowState("saving");
    const settingsInput = settingsToCreateInput(entrySettings);
    sendToBackend({
      type: "save_summary",
      requestId: previewData.requestId,
      title: summaryTitle !== previewData.title ? summaryTitle : undefined,
      titleFormat,
      keys: summaryKeys,
      content: summaryContent !== previewData.content ? summaryContent : undefined,
      settings: settingsInput,
      lorebookId
    });
  }, [previewData, sendToBackend, summaryTitle, summaryKeys, summaryContent, entrySettings, lorebookId, titleFormat]);
  const handleDiscard = q2(() => {
    if (!previewData)
      return;
    discardPending(previewData.requestId);
    resetFlow();
  }, [previewData, discardPending, resetFlow]);
  const handleErrorRetry = q2(() => {
    if (errorStage === "saving" && previewData) {
      if (errorRetryable) {
        handleSave();
      }
    } else {
      handleCreateSummary(activePrompt);
    }
  }, [errorStage, previewData, errorRetryable, handleSave, handleCreateSummary, activePrompt]);
  const activeObserversRef = A2(new Set);
  const moreActionsBlinkedRef = A2(0);
  const watchForDuplicate = q2(() => {
    const observer = new MutationObserver((mutations) => {
      const hasAddedNodes = mutations.some((m3) => m3.addedNodes.length > 0);
      if (!hasAddedNodes && Date.now() - moreActionsBlinkedRef.current < 30000)
        return;
      if (Date.now() - moreActionsBlinkedRef.current > 30000) {
        observer.disconnect();
        activeObserversRef.current.delete(observer);
        return;
      }
      const items = document.querySelectorAll('[class*="contextMenu"] button, [class*="ContextMenu"] button');
      for (const btn of items) {
        if (btn.textContent?.includes("Duplicate")) {
          btn.classList.remove("chronicle-conn-highlight");
          btn.offsetWidth;
          btn.classList.add("chronicle-conn-highlight");
          observer.disconnect();
          activeObserversRef.current.delete(observer);
          break;
        }
      }
    });
    activeObserversRef.current.add(observer);
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      activeObserversRef.current.delete(observer);
    }, 35000);
  }, []);
  y2(() => {
    return () => {
      for (const obs of activeObserversRef.current) {
        obs.disconnect();
      }
      activeObserversRef.current.clear();
    };
  }, []);
  const handleOpenConnectionsDrawer = q2(() => {
    onRequestClose?.();
    requestAnimationFrame(() => {
      const connectBtn = document.querySelector('button[title="Connections"]');
      if (connectBtn) {
        connectBtn.click();
      }
      setTimeout(() => {
        const allButtons = document.querySelectorAll("button");
        for (const btn of allButtons) {
          if (btn.textContent?.includes("New Connection")) {
            btn.classList.remove("chronicle-conn-highlight");
            btn.offsetWidth;
            btn.classList.add("chronicle-conn-highlight");
            break;
          }
        }
      }, 300);
      setTimeout(() => {
        const moreBtns = document.querySelectorAll('button[title="More actions"]');
        if (moreBtns.length > 0) {
          const moreBtn = moreBtns[0];
          moreBtn.classList.remove("chronicle-conn-highlight");
          moreBtn.offsetWidth;
          moreBtn.classList.add("chronicle-conn-highlight");
          moreActionsBlinkedRef.current = Date.now();
          watchForDuplicate();
        }
      }, 800);
    });
  }, [onRequestClose, watchForDuplicate]);
  if (selectedCount === 0 && flowState === "idle") {
    return /* @__PURE__ */ u3("div", {
      class: "chronicle-sf-hint",
      children: "Select messages in a chat to summarize them."
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ u3("div", {
    "data-chronicle": "summarize-flow",
    children: [
      flowState === "idle" && /* @__PURE__ */ u3(S, {
        children: [
          /* @__PURE__ */ u3("div", {
            class: "chronicle-sf-generate-row",
            children: /* @__PURE__ */ u3("button", {
              class: "chronicle-summarize-action-btn",
              onClick: () => handleCreateSummary(activePrompt),
              disabled: !activePrompt,
              children: "Generate and Preview"
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ u3("div", {
            class: "chronicle-sf-count",
            children: [
              selectedCount,
              " message",
              selectedCount !== 1 ? "s" : "",
              " selected"
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ u3("div", {
            class: "chronicle-sf-autohide",
            children: [
              /* @__PURE__ */ u3("div", {
                class: "chronicle-sf-autohide-toggle-row",
                children: [
                  /* @__PURE__ */ u3("label", {
                    class: "chronicle-sf-autohide-toggle",
                    children: [
                      /* @__PURE__ */ u3("input", {
                        type: "checkbox",
                        checked: autoHidePrior,
                        onChange: (e3) => setAutoHidePrior(e3.target.checked)
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ u3("span", {
                        children: "Auto-hide prior messages"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ u3("span", {
                    class: "chronicle-info-icon",
                    "data-tooltip": "After summary is finalized, automatically hide summarized messages and all previous messages from context. (Applies to database, no need to scroll up and load messages)",
                    children: "i"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ u3("div", {
                class: "chronicle-sf-autohide-count",
                children: [
                  /* @__PURE__ */ u3("input", {
                    class: "chronicle-sf-autohide-input",
                    type: "number",
                    min: "0",
                    step: "1",
                    value: keepVisibleCount,
                    disabled: !autoHidePrior,
                    onInput: (e3) => {
                      const raw = e3.target.value;
                      if (raw === "") {
                        setKeepVisibleCount(0);
                      } else {
                        const v3 = parseInt(raw, 10);
                        if (!isNaN(v3) && v3 >= 0)
                          setKeepVisibleCount(v3);
                      }
                    }
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ u3("label", {
                    class: "chronicle-pm-label",
                    style: { opacity: autoHidePrior ? 1 : 0.5 },
                    children: "Number of prior messages to keep visible"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ u3("span", {
                    class: "chronicle-info-icon",
                    "data-tooltip": "Protects a number of recent messages from the auto-hide function. This helps keep LLM responses coherent and consistent after summarization. (Recommended: 5-10 messages)",
                    children: "i"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ u3("div", {
            class: "chronicle-sf-autohide",
            children: [
              /* @__PURE__ */ u3("div", {
                class: "chronicle-sf-autohide-toggle-row",
                children: [
                  /* @__PURE__ */ u3("label", {
                    class: "chronicle-sf-autohide-toggle",
                    children: [
                      /* @__PURE__ */ u3("input", {
                        type: "checkbox",
                        checked: includeRecentContext,
                        disabled: !lorebookId || lorebookId === "__auto_generate__",
                        onChange: (e3) => {
                          const checked = e3.target.checked;
                          setIncludeRecentContext(checked);
                          try {
                            localStorage.setItem("chronicle:includeRecentContext", String(checked));
                          } catch {}
                        }
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ u3("span", {
                        style: { opacity: !lorebookId || lorebookId === "__auto_generate__" ? 0.5 : 1 },
                        children: "Include recent summaries as context"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ u3("span", {
                    class: "chronicle-info-icon",
                    "data-tooltip": "Fetches the most recent lorebook entries and includes their summaries as context for the LLM. This helps the LLM write a coherent next scene and use the correct scene number. Requires a lorebook to be selected.",
                    children: "i"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ u3("div", {
                class: "chronicle-sf-autohide-count",
                children: [
                  /* @__PURE__ */ u3("input", {
                    class: "chronicle-sf-autohide-input",
                    type: "number",
                    min: "1",
                    max: "10",
                    step: "1",
                    value: recentContextCount,
                    disabled: !includeRecentContext || !lorebookId || lorebookId === "__auto_generate__",
                    onInput: (e3) => {
                      const raw = e3.target.value;
                      if (raw === "") {
                        setRecentContextCount(3);
                      } else {
                        const v3 = parseInt(raw, 10);
                        if (!isNaN(v3) && v3 >= 1) {
                          const clamped = Math.max(1, Math.min(10, v3));
                          setRecentContextCount(clamped);
                          try {
                            localStorage.setItem("chronicle:recentContextCount", String(clamped));
                          } catch {}
                        }
                      }
                    }
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ u3("label", {
                    class: "chronicle-pm-label",
                    style: { opacity: includeRecentContext && lorebookId && lorebookId !== "__auto_generate__" ? 1 : 0.5 },
                    children: "Number of recent entries to include"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ u3(LorebookManager, {
            onLorebookChange: setLorebookId,
            loading: false
          }, undefined, false, undefined, this),
          /* @__PURE__ */ u3(ConnectionManager, {
            onConnectionChange: setConnectionId,
            loading: false,
            onOpenConnectionsDrawer: handleOpenConnectionsDrawer
          }, undefined, false, undefined, this),
          /* @__PURE__ */ u3(PromptManager, {
            onActivePromptChange: setActivePrompt,
            onParamsChange: (p3) => {
              if (p3)
                setGenerationParams(p3);
            },
            loading: false
          }, undefined, false, undefined, this),
          /* @__PURE__ */ u3(SettingsManager, {
            settings: entrySettings,
            onSettingsChange: setEntrySettings,
            loading: false
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      flowState === "preview" && previewData && /* @__PURE__ */ u3(S, {
        children: [
          /* @__PURE__ */ u3("div", {
            class: "chronicle-sf-title-row",
            children: [
              /* @__PURE__ */ u3("label", {
                class: "chronicle-pm-label",
                children: "Title"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ u3("input", {
                class: "chronicle-pm-input",
                value: summaryTitle,
                onInput: (e3) => setSummaryTitle(e3.target.value)
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ u3("div", {
            class: "chronicle-sf-title-row",
            children: [
              /* @__PURE__ */ u3("label", {
                class: "chronicle-pm-label",
                children: "Title Format"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ u3("div", {
                class: "chronicle-sf-format-row",
                children: [
                  /* @__PURE__ */ u3("select", {
                    class: "chronicle-pm-select",
                    value: selectedFormatValue,
                    onChange: (e3) => {
                      const val = e3.target.value;
                      if (val === "__custom__") {
                        setUseCustomFormat(true);
                      } else {
                        setUseCustomFormat(false);
                        setTitleFormat(val);
                        try {
                          localStorage.setItem("chronicle:titleFormat", val);
                        } catch {}
                      }
                    },
                    children: TITLE_FORMAT_PRESETS.map((p3) => /* @__PURE__ */ u3("option", {
                      value: p3.value,
                      children: p3.label
                    }, p3.value, false, undefined, this))
                  }, undefined, false, undefined, this),
                  useCustomFormat && /* @__PURE__ */ u3("input", {
                    class: "chronicle-pm-input chronicle-sf-format-custom-input",
                    value: titleFormat,
                    onInput: (e3) => {
                      const val = e3.target.value;
                      setTitleFormat(val);
                      try {
                        localStorage.setItem("chronicle:titleFormat", val);
                      } catch {}
                    },
                    placeholder: DEFAULT_TITLE_FORMAT
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ u3("span", {
                    class: "chronicle-sf-title-format-hint",
                    children: [
                      "Variables: ",
                      "{title}",
                      ", ",
                      "{date}",
                      ", ",
                      "{time}",
                      ", ",
                      "{number}"
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ u3("textarea", {
            class: "chronicle-pm-textarea",
            style: { minHeight: 200, maxHeight: 400, marginTop: 0 },
            value: summaryContent,
            onInput: (e3) => setSummaryContent(e3.target.value)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ u3("div", {
            class: "chronicle-sf-keys-row",
            children: [
              /* @__PURE__ */ u3("label", {
                class: "chronicle-pm-label",
                children: "Trigger Keys"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ u3("input", {
                class: "chronicle-sf-keys-input",
                value: summaryKeys.join(", "),
                onInput: (e3) => {
                  const raw = e3.target.value;
                  const keys = raw.split(",").map((k3) => k3.trim()).filter((k3) => k3.length > 0);
                  setSummaryKeys(keys);
                },
                placeholder: "key1, key2, key3"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ u3("span", {
                class: "chronicle-sf-keys-hint",
                children: "(Comma-separated)"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ u3("div", {
            class: "chronicle-sf-actions",
            children: [
              /* @__PURE__ */ u3("button", {
                class: "chronicle-sf-btn chronicle-sf-btn-primary",
                onClick: handleSave,
                children: "Save Entry"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ u3("button", {
                class: "chronicle-sf-btn",
                onClick: handleRetry,
                children: "Retry"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ u3("button", {
                class: "chronicle-sf-btn",
                onClick: handleDiscard,
                children: "Discard"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      flowState === "saving" && /* @__PURE__ */ u3("div", {
        class: "chronicle-sf-count",
        children: [
          /* @__PURE__ */ u3("span", {
            class: "chronicle-summarize-spinner"
          }, undefined, false, undefined, this),
          " Saving entry…"
        ]
      }, undefined, true, undefined, this),
      flowState === "save_timeout" && /* @__PURE__ */ u3("div", {
        class: "chronicle-sf-error",
        children: [
          /* @__PURE__ */ u3("span", {
            children: "The entry was saved but the confirmation response timed out. The entry should appear in the list below after refreshing."
          }, undefined, false, undefined, this),
          /* @__PURE__ */ u3("button", {
            class: "chronicle-sf-btn",
            onClick: () => resetFlow(),
            style: { flex: "0 0 auto", marginLeft: 8 },
            children: "Dismiss"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      flowState === "error" && errorMessage && /* @__PURE__ */ u3("div", {
        class: "chronicle-sf-error",
        children: [
          /* @__PURE__ */ u3("span", {
            children: errorMessage
          }, undefined, false, undefined, this),
          (errorStage !== "saving" || errorRetryable) && /* @__PURE__ */ u3("button", {
            class: "chronicle-sf-btn",
            onClick: handleErrorRetry,
            style: { flex: "0 0 auto", marginLeft: 8 },
            children: "Retry"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
};

// src/components/SummaryToast.tsx
var SummaryToast = ({ state, message, onDone }) => {
  const [fading, setFading] = d2(false);
  const timerRef = A2(null);
  y2(() => {
    if (state === "error") {
      timerRef.current = setTimeout(() => {
        setFading(true);
        setTimeout(() => onDone?.(), 450);
      }, 4000);
    }
    if (state === "success") {
      timerRef.current = setTimeout(() => {
        setFading(true);
        setTimeout(() => onDone?.(), 450);
      }, 3000);
    }
    return () => {
      if (timerRef.current)
        clearTimeout(timerRef.current);
    };
  }, [state, onDone]);
  const isError = state === "error";
  const isSuccess = state === "success";
  return /* @__PURE__ */ u3("div", {
    class: `chronicle-toast${isError ? " chronicle-toast-error" : ""}${isSuccess ? " chronicle-toast-success" : ""}${fading ? " chronicle-toast-fading" : ""}`,
    children: [
      state === "generating" && /* @__PURE__ */ u3("span", {
        class: "chronicle-summarize-spinner"
      }, undefined, false, undefined, this),
      state === "success" && /* @__PURE__ */ u3("span", {
        class: "chronicle-toast-icon",
        children: "✓"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ u3("span", {
        children: message
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
};
// src/main.tsx
var _openModal;
function getOpenModal() {
  return _openModal;
}
var _activeTeardown = null;
var _modalOpen = false;
var _modalSafetyTimer = null;
function setup(spindleCtx) {
  console.log("[Chronicle] Setup starting...");
  let _removeObserver = null;
  let _removeStyles = null;
  let _backendUnsub = null;
  let _selectBarCleanup = null;
  const _renders = [];
  setRenderTracker(_renders);
  let _generating = false;
  let _generationSelectedCount = 0;
  let _generationEntrySettings = { ...DEFAULT_SETTINGS };
  let _generationLorebookId;
  let _generationActivePrompt;
  let _generationConnectionId;
  let _generationParams;
  let _toastCleanup = null;
  let _generatingSafetyTimer = null;
  function startGenerating() {
    _generating = true;
    _generatingSafetyTimer = setTimeout(() => {
      if (_generating) {
        _generating = false;
        showSummaryToast("error", "Summary generation timed out.");
      }
      _generatingSafetyTimer = null;
    }, 300000);
  }
  function stopGenerating() {
    _generating = false;
    if (_generatingSafetyTimer) {
      clearTimeout(_generatingSafetyTimer);
      _generatingSafetyTimer = null;
    }
  }
  function showSummaryToast(state, message) {
    dismissSummaryToast();
    const mount = document.createElement("div");
    mount.setAttribute("data-chronicle", "toast");
    document.body.appendChild(mount);
    const cleanup = () => {
      R(null, mount);
      mount.remove();
      if (_toastCleanup === cleanup)
        _toastCleanup = null;
    };
    R(/* @__PURE__ */ u3(SummaryToast, {
      state,
      message,
      onDone: state !== "generating" ? cleanup : undefined
    }, undefined, false, undefined, this), mount);
    _toastCleanup = cleanup;
  }
  function dismissSummaryToast() {
    _toastCleanup?.();
    _toastCleanup = null;
  }
  function ChronicleModalShell({ count, onClose, onGenerateStart }) {
    y2(() => {
      const handler = (e3) => {
        if (e3.key === "Escape")
          onClose();
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }, [onClose]);
    return /* @__PURE__ */ u3(SummarizeFlow, {
      selectedCount: count,
      onRequestClose: onClose,
      onGenerateStart
    }, undefined, false, undefined, this);
  }
  function openChronicleModal(count) {
    if (count === 0)
      return;
    if (!spindleCtx)
      return;
    if (_modalOpen || _generating)
      return;
    const maxH = Math.min(720, window.innerHeight - 200);
    const modal = spindleCtx.ui.showModal({
      title: "Create Summary / Memory",
      width: 600,
      maxHeight: maxH
    });
    const handleGenerateStart = (params) => {
      startGenerating();
      _generationSelectedCount = count;
      _generationEntrySettings = params.entrySettings;
      _generationLorebookId = params.lorebookId;
      _generationActivePrompt = params.activePrompt;
      _generationConnectionId = params.connectionId;
      _generationParams = params.generationParams;
      showSummaryToast("generating", "Generating summary…");
      modal.dismiss();
    };
    _modalOpen = true;
    R(/* @__PURE__ */ u3(ChronicleContext.Provider, {
      value: spindleCtx,
      children: /* @__PURE__ */ u3(ErrorBoundary, {
        name: "modal",
        children: /* @__PURE__ */ u3(ChronicleModalShell, {
          count,
          onClose: () => modal.dismiss(),
          onGenerateStart: handleGenerateStart
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this), modal.root);
    const dismissAndRelease = () => {
      R(null, modal.root);
      _modalOpen = false;
      if (_modalSafetyTimer) {
        clearTimeout(_modalSafetyTimer);
        _modalSafetyTimer = null;
      }
    };
    modal.onDismiss(dismissAndRelease);
    if (_modalSafetyTimer) {
      clearTimeout(_modalSafetyTimer);
      _modalSafetyTimer = null;
    }
    _modalSafetyTimer = setTimeout(() => {
      _modalOpen = false;
      _modalSafetyTimer = null;
    }, 60000);
  }
  _openModal = openChronicleModal;
  function openPreviewModal(previewData, count) {
    if (!spindleCtx)
      return;
    if (_modalOpen)
      return;
    const maxH = Math.min(720, window.innerHeight - 200);
    const modal = spindleCtx.ui.showModal({
      title: `Lorebook Entry Preview (${count} ${count === 1 ? "message" : "messages"})`,
      width: 600,
      maxHeight: maxH
    });
    const handleGenerateStart = (params) => {
      startGenerating();
      _generationSelectedCount = count;
      _generationEntrySettings = params.entrySettings;
      _generationLorebookId = params.lorebookId;
      _generationActivePrompt = params.activePrompt;
      _generationConnectionId = params.connectionId;
      _generationParams = params.generationParams;
      showSummaryToast("generating", "Generating summary…");
      modal.dismiss();
    };
    _modalOpen = true;
    if (_modalSafetyTimer) {
      clearTimeout(_modalSafetyTimer);
      _modalSafetyTimer = null;
    }
    R(/* @__PURE__ */ u3(ChronicleContext.Provider, {
      value: spindleCtx,
      children: /* @__PURE__ */ u3(ErrorBoundary, {
        name: "preview-modal",
        children: /* @__PURE__ */ u3(SummarizeFlow, {
          selectedCount: count,
          preview: previewData,
          entrySettings: _generationEntrySettings,
          lorebookId: _generationLorebookId,
          initialActivePrompt: _generationActivePrompt,
          initialConnectionId: _generationConnectionId,
          initialGenerationParams: _generationParams,
          onRequestClose: () => modal.dismiss(),
          onGenerateStart: handleGenerateStart
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this), modal.root);
    const dismissAndRelease = () => {
      R(null, modal.root);
      _modalOpen = false;
      if (_modalSafetyTimer) {
        clearTimeout(_modalSafetyTimer);
        _modalSafetyTimer = null;
      }
    };
    modal.onDismiss(dismissAndRelease);
    _modalSafetyTimer = setTimeout(() => {
      _modalOpen = false;
      _modalSafetyTimer = null;
    }, 60000);
  }
  function onSelectModeActivate() {
    console.log("[Chronicle] Select mode activated");
    const existingSummary = document.querySelector('[data-chronicle="summarize-btn"]');
    if (existingSummary) {
      return;
    }
    _selectBarCleanup?.cleanup();
    _selectBarCleanup = injectIntoSelectBar();
  }
  function onSelectModeDeactivate() {
    console.log("[Chronicle] Select mode deactivated");
    _selectBarCleanup?.cleanup();
    _selectBarCleanup = null;
  }
  _removeStyles = injectStyles();
  _backendUnsub = setupBackendListener(spindleCtx);
  const _moduleBackendUnsub = spindleCtx.onBackendMessage((payload) => {
    const msg = payload;
    if (!msg || typeof msg.type !== "string")
      return;
    if (msg.type === "summarize_preview" && _generating) {
      const data = msg;
      stopGenerating();
      dismissSummaryToast();
      openPreviewModal(data, _generationSelectedCount);
      return;
    }
    if (msg.type === "summarize_saved") {
      dismissSummaryToast();
      showSummaryToast("success", "Summary saved to lorebook");
      return;
    }
    if (msg.type === "summarize_failed" && _generating) {
      stopGenerating();
      const errorMsg = msg.error || "Unknown error occurred.";
      showSummaryToast("error", `Summary failed: ${errorMsg}`);
      return;
    }
  });
  _removeObserver = observeSelectMode(onSelectModeActivate, onSelectModeDeactivate);
  const teardownState = {
    _removeObserver,
    _removeStyles,
    _selectBarCleanup,
    _backendUnsub,
    _moduleBackendUnsub,
    _renders,
    _teardownRef: { current: null }
  };
  const fullTeardown = createFullTeardown(teardownState);
  teardownState._teardownRef.current = fullTeardown;
  _activeTeardown = fullTeardown;
  console.log("[Chronicle] Setup complete");
}
function teardown() {
  console.log("[Chronicle] Teardown requested");
  if (_activeTeardown) {
    _activeTeardown();
    _activeTeardown = null;
    return;
  }
  document.querySelectorAll("[data-chronicle]").forEach((el) => el.remove());
}
export {
  teardown,
  setup,
  parseSummaryResponse,
  isValidSummarizeRequestV2,
  isValidSaveSummaryRequest,
  isValidListLorebooksRequest,
  isValidListConnectionsRequest,
  isValidDiscardSummaryRequest,
  getOpenModal,
  buildSummarizePrompt,
  PROTOCOL_VERSION
};
