"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/base64id/lib/base64id.js
var require_base64id = __commonJS({
  "node_modules/base64id/lib/base64id.js"(exports2, module2) {
    var crypto = require("crypto");
    var Base64Id = function() {
    };
    Base64Id.prototype.getRandomBytes = function(bytes) {
      var BUFFER_SIZE = 4096;
      var self = this;
      bytes = bytes || 12;
      if (bytes > BUFFER_SIZE) {
        return crypto.randomBytes(bytes);
      }
      var bytesInBuffer = parseInt(BUFFER_SIZE / bytes);
      var threshold = parseInt(bytesInBuffer * 0.85);
      if (!threshold) {
        return crypto.randomBytes(bytes);
      }
      if (this.bytesBufferIndex == null) {
        this.bytesBufferIndex = -1;
      }
      if (this.bytesBufferIndex == bytesInBuffer) {
        this.bytesBuffer = null;
        this.bytesBufferIndex = -1;
      }
      if (this.bytesBufferIndex == -1 || this.bytesBufferIndex > threshold) {
        if (!this.isGeneratingBytes) {
          this.isGeneratingBytes = true;
          crypto.randomBytes(BUFFER_SIZE, function(err, bytes2) {
            self.bytesBuffer = bytes2;
            self.bytesBufferIndex = 0;
            self.isGeneratingBytes = false;
          });
        }
        if (this.bytesBufferIndex == -1) {
          return crypto.randomBytes(bytes);
        }
      }
      var result = this.bytesBuffer.slice(bytes * this.bytesBufferIndex, bytes * (this.bytesBufferIndex + 1));
      this.bytesBufferIndex++;
      return result;
    };
    Base64Id.prototype.generateId = function() {
      var rand = Buffer.alloc(15);
      if (!rand.writeInt32BE) {
        return Math.abs(Math.random() * Math.random() * Date.now() | 0).toString() + Math.abs(Math.random() * Math.random() * Date.now() | 0).toString();
      }
      this.sequenceNumber = this.sequenceNumber + 1 | 0;
      rand.writeInt32BE(this.sequenceNumber, 11);
      if (crypto.randomBytes) {
        this.getRandomBytes(12).copy(rand);
      } else {
        [0, 4, 8].forEach(function(i) {
          rand.writeInt32BE(Math.random() * Math.pow(2, 32) | 0, i);
        });
      }
      return rand.toString("base64").replace(/\//g, "_").replace(/\+/g, "-");
    };
    exports2 = module2.exports = new Base64Id();
  }
});

// node_modules/engine.io-parser/lib/utf8.js
var require_utf8 = __commonJS({
  "node_modules/engine.io-parser/lib/utf8.js"(exports2, module2) {
    var stringFromCharCode = String.fromCharCode;
    function ucs2decode(string) {
      var output = [];
      var counter = 0;
      var length = string.length;
      var value;
      var extra;
      while (counter < length) {
        value = string.charCodeAt(counter++);
        if (value >= 55296 && value <= 56319 && counter < length) {
          extra = string.charCodeAt(counter++);
          if ((extra & 64512) == 56320) {
            output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
          } else {
            output.push(value);
            counter--;
          }
        } else {
          output.push(value);
        }
      }
      return output;
    }
    function ucs2encode(array) {
      var length = array.length;
      var index = -1;
      var value;
      var output = "";
      while (++index < length) {
        value = array[index];
        if (value > 65535) {
          value -= 65536;
          output += stringFromCharCode(value >>> 10 & 1023 | 55296);
          value = 56320 | value & 1023;
        }
        output += stringFromCharCode(value);
      }
      return output;
    }
    function checkScalarValue(codePoint, strict) {
      if (codePoint >= 55296 && codePoint <= 57343) {
        if (strict) {
          throw Error(
            "Lone surrogate U+" + codePoint.toString(16).toUpperCase() + " is not a scalar value"
          );
        }
        return false;
      }
      return true;
    }
    function createByte(codePoint, shift) {
      return stringFromCharCode(codePoint >> shift & 63 | 128);
    }
    function encodeCodePoint(codePoint, strict) {
      if ((codePoint & 4294967168) == 0) {
        return stringFromCharCode(codePoint);
      }
      var symbol = "";
      if ((codePoint & 4294965248) == 0) {
        symbol = stringFromCharCode(codePoint >> 6 & 31 | 192);
      } else if ((codePoint & 4294901760) == 0) {
        if (!checkScalarValue(codePoint, strict)) {
          codePoint = 65533;
        }
        symbol = stringFromCharCode(codePoint >> 12 & 15 | 224);
        symbol += createByte(codePoint, 6);
      } else if ((codePoint & 4292870144) == 0) {
        symbol = stringFromCharCode(codePoint >> 18 & 7 | 240);
        symbol += createByte(codePoint, 12);
        symbol += createByte(codePoint, 6);
      }
      symbol += stringFromCharCode(codePoint & 63 | 128);
      return symbol;
    }
    function utf8encode(string, opts) {
      opts = opts || {};
      var strict = false !== opts.strict;
      var codePoints = ucs2decode(string);
      var length = codePoints.length;
      var index = -1;
      var codePoint;
      var byteString = "";
      while (++index < length) {
        codePoint = codePoints[index];
        byteString += encodeCodePoint(codePoint, strict);
      }
      return byteString;
    }
    function readContinuationByte() {
      if (byteIndex >= byteCount) {
        throw Error("Invalid byte index");
      }
      var continuationByte = byteArray[byteIndex] & 255;
      byteIndex++;
      if ((continuationByte & 192) == 128) {
        return continuationByte & 63;
      }
      throw Error("Invalid continuation byte");
    }
    function decodeSymbol(strict) {
      var byte1;
      var byte2;
      var byte3;
      var byte4;
      var codePoint;
      if (byteIndex > byteCount) {
        throw Error("Invalid byte index");
      }
      if (byteIndex == byteCount) {
        return false;
      }
      byte1 = byteArray[byteIndex] & 255;
      byteIndex++;
      if ((byte1 & 128) == 0) {
        return byte1;
      }
      if ((byte1 & 224) == 192) {
        byte2 = readContinuationByte();
        codePoint = (byte1 & 31) << 6 | byte2;
        if (codePoint >= 128) {
          return codePoint;
        } else {
          throw Error("Invalid continuation byte");
        }
      }
      if ((byte1 & 240) == 224) {
        byte2 = readContinuationByte();
        byte3 = readContinuationByte();
        codePoint = (byte1 & 15) << 12 | byte2 << 6 | byte3;
        if (codePoint >= 2048) {
          return checkScalarValue(codePoint, strict) ? codePoint : 65533;
        } else {
          throw Error("Invalid continuation byte");
        }
      }
      if ((byte1 & 248) == 240) {
        byte2 = readContinuationByte();
        byte3 = readContinuationByte();
        byte4 = readContinuationByte();
        codePoint = (byte1 & 7) << 18 | byte2 << 12 | byte3 << 6 | byte4;
        if (codePoint >= 65536 && codePoint <= 1114111) {
          return codePoint;
        }
      }
      throw Error("Invalid UTF-8 detected");
    }
    var byteArray;
    var byteCount;
    var byteIndex;
    function utf8decode(byteString, opts) {
      opts = opts || {};
      var strict = false !== opts.strict;
      byteArray = ucs2decode(byteString);
      byteCount = byteArray.length;
      byteIndex = 0;
      var codePoints = [];
      var tmp;
      while ((tmp = decodeSymbol(strict)) !== false) {
        codePoints.push(tmp);
      }
      return ucs2encode(codePoints);
    }
    module2.exports = {
      version: "2.1.2",
      encode: utf8encode,
      decode: utf8decode
    };
  }
});

// node_modules/isarray/index.js
var require_isarray = __commonJS({
  "node_modules/isarray/index.js"(exports2, module2) {
    var toString = {}.toString;
    module2.exports = Array.isArray || function(arr) {
      return toString.call(arr) == "[object Array]";
    };
  }
});

// node_modules/has-binary2/index.js
var require_has_binary2 = __commonJS({
  "node_modules/has-binary2/index.js"(exports2, module2) {
    var isArray = require_isarray();
    var toString = Object.prototype.toString;
    var withNativeBlob = typeof Blob === "function" || typeof Blob !== "undefined" && toString.call(Blob) === "[object BlobConstructor]";
    var withNativeFile = typeof File === "function" || typeof File !== "undefined" && toString.call(File) === "[object FileConstructor]";
    module2.exports = hasBinary;
    function hasBinary(obj) {
      if (!obj || typeof obj !== "object") {
        return false;
      }
      if (isArray(obj)) {
        for (var i = 0, l = obj.length; i < l; i++) {
          if (hasBinary(obj[i])) {
            return true;
          }
        }
        return false;
      }
      if (typeof Buffer === "function" && Buffer.isBuffer && Buffer.isBuffer(obj) || typeof ArrayBuffer === "function" && obj instanceof ArrayBuffer || withNativeBlob && obj instanceof Blob || withNativeFile && obj instanceof File) {
        return true;
      }
      if (obj.toJSON && typeof obj.toJSON === "function" && arguments.length === 1) {
        return hasBinary(obj.toJSON(), true);
      }
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
          return true;
        }
      }
      return false;
    }
  }
});

// node_modules/after/index.js
var require_after = __commonJS({
  "node_modules/after/index.js"(exports2, module2) {
    module2.exports = after;
    function after(count, callback, err_cb) {
      var bail = false;
      err_cb = err_cb || noop;
      proxy.count = count;
      return count === 0 ? callback() : proxy;
      function proxy(err, result) {
        if (proxy.count <= 0) {
          throw new Error("after called too many times");
        }
        --proxy.count;
        if (err) {
          bail = true;
          callback(err);
          callback = err_cb;
        } else if (proxy.count === 0 && !bail) {
          callback(null, result);
        }
      }
    }
    function noop() {
    }
  }
});

// node_modules/engine.io-parser/lib/keys.js
var require_keys = __commonJS({
  "node_modules/engine.io-parser/lib/keys.js"(exports2, module2) {
    module2.exports = Object.keys || function keys(obj) {
      var arr = [];
      var has = Object.prototype.hasOwnProperty;
      for (var i in obj) {
        if (has.call(obj, i)) {
          arr.push(i);
        }
      }
      return arr;
    };
  }
});

// node_modules/engine.io-parser/lib/index.js
var require_lib = __commonJS({
  "node_modules/engine.io-parser/lib/index.js"(exports2) {
    var utf8 = require_utf8();
    var hasBinary = require_has_binary2();
    var after = require_after();
    var keys = require_keys();
    exports2.protocol = 3;
    var packets = exports2.packets = {
      open: 0,
      close: 1,
      ping: 2,
      pong: 3,
      message: 4,
      upgrade: 5,
      noop: 6
    };
    var packetslist = keys(packets);
    var err = { type: "error", data: "parser error" };
    var EMPTY_BUFFER = Buffer.concat([]);
    exports2.encodePacket = function(packet, supportsBinary, utf8encode, callback) {
      if (typeof supportsBinary === "function") {
        callback = supportsBinary;
        supportsBinary = null;
      }
      if (typeof utf8encode === "function") {
        callback = utf8encode;
        utf8encode = null;
      }
      if (Buffer.isBuffer(packet.data)) {
        return encodeBuffer(packet, supportsBinary, callback);
      } else if (packet.data && (packet.data.buffer || packet.data) instanceof ArrayBuffer) {
        return encodeBuffer({ type: packet.type, data: arrayBufferToBuffer(packet.data) }, supportsBinary, callback);
      }
      var encoded = packets[packet.type];
      if (void 0 !== packet.data) {
        encoded += utf8encode ? utf8.encode(String(packet.data), { strict: false }) : String(packet.data);
      }
      return callback("" + encoded);
    };
    function encodeBuffer(packet, supportsBinary, callback) {
      if (!supportsBinary) {
        return exports2.encodeBase64Packet(packet, callback);
      }
      var data = packet.data;
      var typeBuffer = Buffer.allocUnsafe(1);
      typeBuffer[0] = packets[packet.type];
      return callback(Buffer.concat([typeBuffer, data]));
    }
    exports2.encodeBase64Packet = function(packet, callback) {
      var data = Buffer.isBuffer(packet.data) ? packet.data : arrayBufferToBuffer(packet.data);
      var message = "b" + packets[packet.type];
      message += data.toString("base64");
      return callback(message);
    };
    exports2.decodePacket = function(data, binaryType, utf8decode) {
      if (data === void 0) {
        return err;
      }
      var type;
      if (typeof data === "string") {
        type = data.charAt(0);
        if (type === "b") {
          return exports2.decodeBase64Packet(data.substr(1), binaryType);
        }
        if (utf8decode) {
          data = tryDecode(data);
          if (data === false) {
            return err;
          }
        }
        if (Number(type) != type || !packetslist[type]) {
          return err;
        }
        if (data.length > 1) {
          return { type: packetslist[type], data: data.substring(1) };
        } else {
          return { type: packetslist[type] };
        }
      }
      if (binaryType === "arraybuffer") {
        var intArray = new Uint8Array(data);
        type = intArray[0];
        return { type: packetslist[type], data: intArray.buffer.slice(1) };
      }
      if (data instanceof ArrayBuffer) {
        data = arrayBufferToBuffer(data);
      }
      type = data[0];
      return { type: packetslist[type], data: data.slice(1) };
    };
    function tryDecode(data) {
      try {
        data = utf8.decode(data, { strict: false });
      } catch (e) {
        return false;
      }
      return data;
    }
    exports2.decodeBase64Packet = function(msg, binaryType) {
      var type = packetslist[msg.charAt(0)];
      var data = Buffer.from(msg.substr(1), "base64");
      if (binaryType === "arraybuffer") {
        var abv = new Uint8Array(data.length);
        for (var i = 0; i < abv.length; i++) {
          abv[i] = data[i];
        }
        data = abv.buffer;
      }
      return { type, data };
    };
    exports2.encodePayload = function(packets2, supportsBinary, callback) {
      if (typeof supportsBinary === "function") {
        callback = supportsBinary;
        supportsBinary = null;
      }
      if (supportsBinary && hasBinary(packets2)) {
        return exports2.encodePayloadAsBinary(packets2, callback);
      }
      if (!packets2.length) {
        return callback("0:");
      }
      function encodeOne(packet, doneCallback) {
        exports2.encodePacket(packet, supportsBinary, false, function(message) {
          doneCallback(null, setLengthHeader(message));
        });
      }
      map(packets2, encodeOne, function(err2, results) {
        return callback(results.join(""));
      });
    };
    function setLengthHeader(message) {
      return message.length + ":" + message;
    }
    function map(ary, each, done) {
      var result = new Array(ary.length);
      var next = after(ary.length, done);
      for (var i = 0; i < ary.length; i++) {
        each(ary[i], function(error, msg) {
          result[i] = msg;
          next(error, result);
        });
      }
    }
    exports2.decodePayload = function(data, binaryType, callback) {
      if (typeof data !== "string") {
        return exports2.decodePayloadAsBinary(data, binaryType, callback);
      }
      if (typeof binaryType === "function") {
        callback = binaryType;
        binaryType = null;
      }
      if (data === "") {
        return callback(err, 0, 1);
      }
      var length = "", n, msg, packet;
      for (var i = 0, l = data.length; i < l; i++) {
        var chr = data.charAt(i);
        if (chr !== ":") {
          length += chr;
          continue;
        }
        if (length === "" || length != (n = Number(length))) {
          return callback(err, 0, 1);
        }
        msg = data.substr(i + 1, n);
        if (length != msg.length) {
          return callback(err, 0, 1);
        }
        if (msg.length) {
          packet = exports2.decodePacket(msg, binaryType, false);
          if (err.type === packet.type && err.data === packet.data) {
            return callback(err, 0, 1);
          }
          var more = callback(packet, i + n, l);
          if (false === more) return;
        }
        i += n;
        length = "";
      }
      if (length !== "") {
        return callback(err, 0, 1);
      }
    };
    function bufferToString(buffer) {
      var str = "";
      for (var i = 0, l = buffer.length; i < l; i++) {
        str += String.fromCharCode(buffer[i]);
      }
      return str;
    }
    function stringToBuffer(string) {
      var buf = Buffer.allocUnsafe(string.length);
      for (var i = 0, l = string.length; i < l; i++) {
        buf.writeUInt8(string.charCodeAt(i), i);
      }
      return buf;
    }
    function arrayBufferToBuffer(data) {
      var length = data.byteLength || data.length;
      var offset = data.byteOffset || 0;
      return Buffer.from(data.buffer || data, offset, length);
    }
    exports2.encodePayloadAsBinary = function(packets2, callback) {
      if (!packets2.length) {
        return callback(EMPTY_BUFFER);
      }
      map(packets2, encodeOneBinaryPacket, function(err2, results) {
        return callback(Buffer.concat(results));
      });
    };
    function encodeOneBinaryPacket(p, doneCallback) {
      function onBinaryPacketEncode(packet) {
        var encodingLength = "" + packet.length;
        var sizeBuffer;
        if (typeof packet === "string") {
          sizeBuffer = Buffer.allocUnsafe(encodingLength.length + 2);
          sizeBuffer[0] = 0;
          for (var i = 0; i < encodingLength.length; i++) {
            sizeBuffer[i + 1] = parseInt(encodingLength[i], 10);
          }
          sizeBuffer[sizeBuffer.length - 1] = 255;
          return doneCallback(null, Buffer.concat([sizeBuffer, stringToBuffer(packet)]));
        }
        sizeBuffer = Buffer.allocUnsafe(encodingLength.length + 2);
        sizeBuffer[0] = 1;
        for (var i = 0; i < encodingLength.length; i++) {
          sizeBuffer[i + 1] = parseInt(encodingLength[i], 10);
        }
        sizeBuffer[sizeBuffer.length - 1] = 255;
        doneCallback(null, Buffer.concat([sizeBuffer, packet]));
      }
      exports2.encodePacket(p, true, true, onBinaryPacketEncode);
    }
    exports2.decodePayloadAsBinary = function(data, binaryType, callback) {
      if (typeof binaryType === "function") {
        callback = binaryType;
        binaryType = null;
      }
      var bufferTail = data;
      var buffers = [];
      var i;
      while (bufferTail.length > 0) {
        var strLen = "";
        var isString = bufferTail[0] === 0;
        for (i = 1; ; i++) {
          if (bufferTail[i] === 255) break;
          if (strLen.length > 310) {
            return callback(err, 0, 1);
          }
          strLen += "" + bufferTail[i];
        }
        bufferTail = bufferTail.slice(strLen.length + 1);
        var msgLength = parseInt(strLen, 10);
        var msg = bufferTail.slice(1, msgLength + 1);
        if (isString) msg = bufferToString(msg);
        buffers.push(msg);
        bufferTail = bufferTail.slice(msgLength + 1);
      }
      var total = buffers.length;
      for (i = 0; i < total; i++) {
        var buffer = buffers[i];
        callback(exports2.decodePacket(buffer, binaryType, true), i, total);
      }
    };
  }
});

// node_modules/ms/index.js
var require_ms = __commonJS({
  "node_modules/ms/index.js"(exports2, module2) {
    var s = 1e3;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var w = d * 7;
    var y = d * 365.25;
    module2.exports = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === "string" && val.length > 0) {
        return parse(val);
      } else if (type === "number" && isFinite(val)) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error(
        "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
      );
    };
    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || "ms").toLowerCase();
      switch (type) {
        case "years":
        case "year":
        case "yrs":
        case "yr":
        case "y":
          return n * y;
        case "weeks":
        case "week":
        case "w":
          return n * w;
        case "days":
        case "day":
        case "d":
          return n * d;
        case "hours":
        case "hour":
        case "hrs":
        case "hr":
        case "h":
          return n * h;
        case "minutes":
        case "minute":
        case "mins":
        case "min":
        case "m":
          return n * m;
        case "seconds":
        case "second":
        case "secs":
        case "sec":
        case "s":
          return n * s;
        case "milliseconds":
        case "millisecond":
        case "msecs":
        case "msec":
        case "ms":
          return n;
        default:
          return void 0;
      }
    }
    function fmtShort(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return Math.round(ms / d) + "d";
      }
      if (msAbs >= h) {
        return Math.round(ms / h) + "h";
      }
      if (msAbs >= m) {
        return Math.round(ms / m) + "m";
      }
      if (msAbs >= s) {
        return Math.round(ms / s) + "s";
      }
      return ms + "ms";
    }
    function fmtLong(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return plural(ms, msAbs, d, "day");
      }
      if (msAbs >= h) {
        return plural(ms, msAbs, h, "hour");
      }
      if (msAbs >= m) {
        return plural(ms, msAbs, m, "minute");
      }
      if (msAbs >= s) {
        return plural(ms, msAbs, s, "second");
      }
      return ms + " ms";
    }
    function plural(ms, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
    }
  }
});

// node_modules/debug/src/common.js
var require_common = __commonJS({
  "node_modules/debug/src/common.js"(exports2, module2) {
    function setup(env) {
      createDebug.debug = createDebug;
      createDebug.default = createDebug;
      createDebug.coerce = coerce;
      createDebug.disable = disable;
      createDebug.enable = enable;
      createDebug.enabled = enabled;
      createDebug.humanize = require_ms();
      Object.keys(env).forEach((key) => {
        createDebug[key] = env[key];
      });
      createDebug.instances = [];
      createDebug.names = [];
      createDebug.skips = [];
      createDebug.formatters = {};
      function selectColor(namespace) {
        let hash = 0;
        for (let i = 0; i < namespace.length; i++) {
          hash = (hash << 5) - hash + namespace.charCodeAt(i);
          hash |= 0;
        }
        return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
      }
      createDebug.selectColor = selectColor;
      function createDebug(namespace) {
        let prevTime;
        function debug(...args) {
          if (!debug.enabled) {
            return;
          }
          const self = debug;
          const curr = Number(/* @__PURE__ */ new Date());
          const ms = curr - (prevTime || curr);
          self.diff = ms;
          self.prev = prevTime;
          self.curr = curr;
          prevTime = curr;
          args[0] = createDebug.coerce(args[0]);
          if (typeof args[0] !== "string") {
            args.unshift("%O");
          }
          let index = 0;
          args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
            if (match === "%%") {
              return match;
            }
            index++;
            const formatter = createDebug.formatters[format];
            if (typeof formatter === "function") {
              const val = args[index];
              match = formatter.call(self, val);
              args.splice(index, 1);
              index--;
            }
            return match;
          });
          createDebug.formatArgs.call(self, args);
          const logFn = self.log || createDebug.log;
          logFn.apply(self, args);
        }
        debug.namespace = namespace;
        debug.enabled = createDebug.enabled(namespace);
        debug.useColors = createDebug.useColors();
        debug.color = selectColor(namespace);
        debug.destroy = destroy;
        debug.extend = extend;
        if (typeof createDebug.init === "function") {
          createDebug.init(debug);
        }
        createDebug.instances.push(debug);
        return debug;
      }
      function destroy() {
        const index = createDebug.instances.indexOf(this);
        if (index !== -1) {
          createDebug.instances.splice(index, 1);
          return true;
        }
        return false;
      }
      function extend(namespace, delimiter) {
        const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
        newDebug.log = this.log;
        return newDebug;
      }
      function enable(namespaces) {
        createDebug.save(namespaces);
        createDebug.names = [];
        createDebug.skips = [];
        let i;
        const split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
        const len = split.length;
        for (i = 0; i < len; i++) {
          if (!split[i]) {
            continue;
          }
          namespaces = split[i].replace(/\*/g, ".*?");
          if (namespaces[0] === "-") {
            createDebug.skips.push(new RegExp("^" + namespaces.substr(1) + "$"));
          } else {
            createDebug.names.push(new RegExp("^" + namespaces + "$"));
          }
        }
        for (i = 0; i < createDebug.instances.length; i++) {
          const instance = createDebug.instances[i];
          instance.enabled = createDebug.enabled(instance.namespace);
        }
      }
      function disable() {
        const namespaces = [
          ...createDebug.names.map(toNamespace),
          ...createDebug.skips.map(toNamespace).map((namespace) => "-" + namespace)
        ].join(",");
        createDebug.enable("");
        return namespaces;
      }
      function enabled(name) {
        if (name[name.length - 1] === "*") {
          return true;
        }
        let i;
        let len;
        for (i = 0, len = createDebug.skips.length; i < len; i++) {
          if (createDebug.skips[i].test(name)) {
            return false;
          }
        }
        for (i = 0, len = createDebug.names.length; i < len; i++) {
          if (createDebug.names[i].test(name)) {
            return true;
          }
        }
        return false;
      }
      function toNamespace(regexp) {
        return regexp.toString().substring(2, regexp.toString().length - 2).replace(/\.\*\?$/, "*");
      }
      function coerce(val) {
        if (val instanceof Error) {
          return val.stack || val.message;
        }
        return val;
      }
      createDebug.enable(createDebug.load());
      return createDebug;
    }
    module2.exports = setup;
  }
});

// node_modules/debug/src/browser.js
var require_browser = __commonJS({
  "node_modules/debug/src/browser.js"(exports2, module2) {
    exports2.log = log;
    exports2.formatArgs = formatArgs;
    exports2.save = save;
    exports2.load = load;
    exports2.useColors = useColors;
    exports2.storage = localstorage();
    exports2.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function useColors() {
      if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
        return true;
      }
      if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
        return false;
      }
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function formatArgs(args) {
      args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module2.exports.humanize(this.diff);
      if (!this.useColors) {
        return;
      }
      const c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      let index = 0;
      let lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, (match) => {
        if (match === "%%") {
          return;
        }
        index++;
        if (match === "%c") {
          lastC = index;
        }
      });
      args.splice(lastC, 0, c);
    }
    function log(...args) {
      return typeof console === "object" && console.log && console.log(...args);
    }
    function save(namespaces) {
      try {
        if (namespaces) {
          exports2.storage.setItem("debug", namespaces);
        } else {
          exports2.storage.removeItem("debug");
        }
      } catch (error) {
      }
    }
    function load() {
      let r;
      try {
        r = exports2.storage.getItem("debug");
      } catch (error) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = process.env.DEBUG;
      }
      return r;
    }
    function localstorage() {
      try {
        return localStorage;
      } catch (error) {
      }
    }
    module2.exports = require_common()(exports2);
    var { formatters } = module2.exports;
    formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (error) {
        return "[UnexpectedJSONParseError]: " + error.message;
      }
    };
  }
});

// node_modules/debug/src/node.js
var require_node = __commonJS({
  "node_modules/debug/src/node.js"(exports2, module2) {
    var tty = require("tty");
    var util = require("util");
    exports2.init = init;
    exports2.log = log;
    exports2.formatArgs = formatArgs;
    exports2.save = save;
    exports2.load = load;
    exports2.useColors = useColors;
    exports2.colors = [6, 2, 3, 4, 5, 1];
    try {
      const supportsColor = require("supports-color");
      if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
        exports2.colors = [
          20,
          21,
          26,
          27,
          32,
          33,
          38,
          39,
          40,
          41,
          42,
          43,
          44,
          45,
          56,
          57,
          62,
          63,
          68,
          69,
          74,
          75,
          76,
          77,
          78,
          79,
          80,
          81,
          92,
          93,
          98,
          99,
          112,
          113,
          128,
          129,
          134,
          135,
          148,
          149,
          160,
          161,
          162,
          163,
          164,
          165,
          166,
          167,
          168,
          169,
          170,
          171,
          172,
          173,
          178,
          179,
          184,
          185,
          196,
          197,
          198,
          199,
          200,
          201,
          202,
          203,
          204,
          205,
          206,
          207,
          208,
          209,
          214,
          215,
          220,
          221
        ];
      }
    } catch (error) {
    }
    exports2.inspectOpts = Object.keys(process.env).filter((key) => {
      return /^debug_/i.test(key);
    }).reduce((obj, key) => {
      const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
        return k.toUpperCase();
      });
      let val = process.env[key];
      if (/^(yes|on|true|enabled)$/i.test(val)) {
        val = true;
      } else if (/^(no|off|false|disabled)$/i.test(val)) {
        val = false;
      } else if (val === "null") {
        val = null;
      } else {
        val = Number(val);
      }
      obj[prop] = val;
      return obj;
    }, {});
    function useColors() {
      return "colors" in exports2.inspectOpts ? Boolean(exports2.inspectOpts.colors) : tty.isatty(process.stderr.fd);
    }
    function formatArgs(args) {
      const { namespace: name, useColors: useColors2 } = this;
      if (useColors2) {
        const c = this.color;
        const colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
        const prefix = `  ${colorCode};1m${name} \x1B[0m`;
        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push(colorCode + "m+" + module2.exports.humanize(this.diff) + "\x1B[0m");
      } else {
        args[0] = getDate() + name + " " + args[0];
      }
    }
    function getDate() {
      if (exports2.inspectOpts.hideDate) {
        return "";
      }
      return (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function log(...args) {
      return process.stderr.write(util.format(...args) + "\n");
    }
    function save(namespaces) {
      if (namespaces) {
        process.env.DEBUG = namespaces;
      } else {
        delete process.env.DEBUG;
      }
    }
    function load() {
      return process.env.DEBUG;
    }
    function init(debug) {
      debug.inspectOpts = {};
      const keys = Object.keys(exports2.inspectOpts);
      for (let i = 0; i < keys.length; i++) {
        debug.inspectOpts[keys[i]] = exports2.inspectOpts[keys[i]];
      }
    }
    module2.exports = require_common()(exports2);
    var { formatters } = module2.exports;
    formatters.o = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts).replace(/\s*\n\s*/g, " ");
    };
    formatters.O = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts);
    };
  }
});

// node_modules/debug/src/index.js
var require_src = __commonJS({
  "node_modules/debug/src/index.js"(exports2, module2) {
    if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) {
      module2.exports = require_browser();
    } else {
      module2.exports = require_node();
    }
  }
});

// node_modules/engine.io/lib/transport.js
var require_transport = __commonJS({
  "node_modules/engine.io/lib/transport.js"(exports2, module2) {
    var EventEmitter = require("events").EventEmitter;
    var parser = require_lib();
    var util = require("util");
    var debug = require_src()("engine:transport");
    module2.exports = Transport;
    function noop() {
    }
    function Transport(req) {
      this.readyState = "open";
      this.discarded = false;
    }
    util.inherits(Transport, EventEmitter);
    Transport.prototype.discard = function() {
      this.discarded = true;
    };
    Transport.prototype.onRequest = function(req) {
      debug("setting request");
      this.req = req;
    };
    Transport.prototype.close = function(fn) {
      if ("closed" === this.readyState || "closing" === this.readyState) return;
      this.readyState = "closing";
      this.doClose(fn || noop);
    };
    Transport.prototype.onError = function(msg, desc) {
      if (this.listeners("error").length) {
        var err = new Error(msg);
        err.type = "TransportError";
        err.description = desc;
        this.emit("error", err);
      } else {
        debug("ignored transport error %s (%s)", msg, desc);
      }
    };
    Transport.prototype.onPacket = function(packet) {
      this.emit("packet", packet);
    };
    Transport.prototype.onData = function(data) {
      this.onPacket(parser.decodePacket(data));
    };
    Transport.prototype.onClose = function() {
      this.readyState = "closed";
      this.emit("close");
    };
  }
});

// node_modules/negotiator/lib/charset.js
var require_charset = __commonJS({
  "node_modules/negotiator/lib/charset.js"(exports2, module2) {
    "use strict";
    module2.exports = preferredCharsets;
    module2.exports.preferredCharsets = preferredCharsets;
    var simpleCharsetRegExp = /^\s*([^\s;]+)\s*(?:;(.*))?$/;
    function parseAcceptCharset(accept) {
      var accepts = accept.split(",");
      for (var i = 0, j = 0; i < accepts.length; i++) {
        var charset = parseCharset(accepts[i].trim(), i);
        if (charset) {
          accepts[j++] = charset;
        }
      }
      accepts.length = j;
      return accepts;
    }
    function parseCharset(str, i) {
      var match = simpleCharsetRegExp.exec(str);
      if (!match) return null;
      var charset = match[1];
      var q = 1;
      if (match[2]) {
        var params = match[2].split(";");
        for (var j = 0; j < params.length; j++) {
          var p = params[j].trim().split("=");
          if (p[0] === "q") {
            q = parseFloat(p[1]);
            break;
          }
        }
      }
      return {
        charset,
        q,
        i
      };
    }
    function getCharsetPriority(charset, accepted, index) {
      var priority = { o: -1, q: 0, s: 0 };
      for (var i = 0; i < accepted.length; i++) {
        var spec = specify(charset, accepted[i], index);
        if (spec && (priority.s - spec.s || priority.q - spec.q || priority.o - spec.o) < 0) {
          priority = spec;
        }
      }
      return priority;
    }
    function specify(charset, spec, index) {
      var s = 0;
      if (spec.charset.toLowerCase() === charset.toLowerCase()) {
        s |= 1;
      } else if (spec.charset !== "*") {
        return null;
      }
      return {
        i: index,
        o: spec.i,
        q: spec.q,
        s
      };
    }
    function preferredCharsets(accept, provided) {
      var accepts = parseAcceptCharset(accept === void 0 ? "*" : accept || "");
      if (!provided) {
        return accepts.filter(isQuality).sort(compareSpecs).map(getFullCharset);
      }
      var priorities = provided.map(function getPriority(type, index) {
        return getCharsetPriority(type, accepts, index);
      });
      return priorities.filter(isQuality).sort(compareSpecs).map(function getCharset(priority) {
        return provided[priorities.indexOf(priority)];
      });
    }
    function compareSpecs(a, b) {
      return b.q - a.q || b.s - a.s || a.o - b.o || a.i - b.i || 0;
    }
    function getFullCharset(spec) {
      return spec.charset;
    }
    function isQuality(spec) {
      return spec.q > 0;
    }
  }
});

// node_modules/negotiator/lib/encoding.js
var require_encoding = __commonJS({
  "node_modules/negotiator/lib/encoding.js"(exports2, module2) {
    "use strict";
    module2.exports = preferredEncodings;
    module2.exports.preferredEncodings = preferredEncodings;
    var simpleEncodingRegExp = /^\s*([^\s;]+)\s*(?:;(.*))?$/;
    function parseAcceptEncoding(accept) {
      var accepts = accept.split(",");
      var hasIdentity = false;
      var minQuality = 1;
      for (var i = 0, j = 0; i < accepts.length; i++) {
        var encoding = parseEncoding(accepts[i].trim(), i);
        if (encoding) {
          accepts[j++] = encoding;
          hasIdentity = hasIdentity || specify("identity", encoding);
          minQuality = Math.min(minQuality, encoding.q || 1);
        }
      }
      if (!hasIdentity) {
        accepts[j++] = {
          encoding: "identity",
          q: minQuality,
          i
        };
      }
      accepts.length = j;
      return accepts;
    }
    function parseEncoding(str, i) {
      var match = simpleEncodingRegExp.exec(str);
      if (!match) return null;
      var encoding = match[1];
      var q = 1;
      if (match[2]) {
        var params = match[2].split(";");
        for (var j = 0; j < params.length; j++) {
          var p = params[j].trim().split("=");
          if (p[0] === "q") {
            q = parseFloat(p[1]);
            break;
          }
        }
      }
      return {
        encoding,
        q,
        i
      };
    }
    function getEncodingPriority(encoding, accepted, index) {
      var priority = { o: -1, q: 0, s: 0 };
      for (var i = 0; i < accepted.length; i++) {
        var spec = specify(encoding, accepted[i], index);
        if (spec && (priority.s - spec.s || priority.q - spec.q || priority.o - spec.o) < 0) {
          priority = spec;
        }
      }
      return priority;
    }
    function specify(encoding, spec, index) {
      var s = 0;
      if (spec.encoding.toLowerCase() === encoding.toLowerCase()) {
        s |= 1;
      } else if (spec.encoding !== "*") {
        return null;
      }
      return {
        i: index,
        o: spec.i,
        q: spec.q,
        s
      };
    }
    function preferredEncodings(accept, provided) {
      var accepts = parseAcceptEncoding(accept || "");
      if (!provided) {
        return accepts.filter(isQuality).sort(compareSpecs).map(getFullEncoding);
      }
      var priorities = provided.map(function getPriority(type, index) {
        return getEncodingPriority(type, accepts, index);
      });
      return priorities.filter(isQuality).sort(compareSpecs).map(function getEncoding(priority) {
        return provided[priorities.indexOf(priority)];
      });
    }
    function compareSpecs(a, b) {
      return b.q - a.q || b.s - a.s || a.o - b.o || a.i - b.i || 0;
    }
    function getFullEncoding(spec) {
      return spec.encoding;
    }
    function isQuality(spec) {
      return spec.q > 0;
    }
  }
});

// node_modules/negotiator/lib/language.js
var require_language = __commonJS({
  "node_modules/negotiator/lib/language.js"(exports2, module2) {
    "use strict";
    module2.exports = preferredLanguages;
    module2.exports.preferredLanguages = preferredLanguages;
    var simpleLanguageRegExp = /^\s*([^\s\-;]+)(?:-([^\s;]+))?\s*(?:;(.*))?$/;
    function parseAcceptLanguage(accept) {
      var accepts = accept.split(",");
      for (var i = 0, j = 0; i < accepts.length; i++) {
        var language = parseLanguage(accepts[i].trim(), i);
        if (language) {
          accepts[j++] = language;
        }
      }
      accepts.length = j;
      return accepts;
    }
    function parseLanguage(str, i) {
      var match = simpleLanguageRegExp.exec(str);
      if (!match) return null;
      var prefix = match[1];
      var suffix = match[2];
      var full = prefix;
      if (suffix) full += "-" + suffix;
      var q = 1;
      if (match[3]) {
        var params = match[3].split(";");
        for (var j = 0; j < params.length; j++) {
          var p = params[j].split("=");
          if (p[0] === "q") q = parseFloat(p[1]);
        }
      }
      return {
        prefix,
        suffix,
        q,
        i,
        full
      };
    }
    function getLanguagePriority(language, accepted, index) {
      var priority = { o: -1, q: 0, s: 0 };
      for (var i = 0; i < accepted.length; i++) {
        var spec = specify(language, accepted[i], index);
        if (spec && (priority.s - spec.s || priority.q - spec.q || priority.o - spec.o) < 0) {
          priority = spec;
        }
      }
      return priority;
    }
    function specify(language, spec, index) {
      var p = parseLanguage(language);
      if (!p) return null;
      var s = 0;
      if (spec.full.toLowerCase() === p.full.toLowerCase()) {
        s |= 4;
      } else if (spec.prefix.toLowerCase() === p.full.toLowerCase()) {
        s |= 2;
      } else if (spec.full.toLowerCase() === p.prefix.toLowerCase()) {
        s |= 1;
      } else if (spec.full !== "*") {
        return null;
      }
      return {
        i: index,
        o: spec.i,
        q: spec.q,
        s
      };
    }
    function preferredLanguages(accept, provided) {
      var accepts = parseAcceptLanguage(accept === void 0 ? "*" : accept || "");
      if (!provided) {
        return accepts.filter(isQuality).sort(compareSpecs).map(getFullLanguage);
      }
      var priorities = provided.map(function getPriority(type, index) {
        return getLanguagePriority(type, accepts, index);
      });
      return priorities.filter(isQuality).sort(compareSpecs).map(function getLanguage(priority) {
        return provided[priorities.indexOf(priority)];
      });
    }
    function compareSpecs(a, b) {
      return b.q - a.q || b.s - a.s || a.o - b.o || a.i - b.i || 0;
    }
    function getFullLanguage(spec) {
      return spec.full;
    }
    function isQuality(spec) {
      return spec.q > 0;
    }
  }
});

// node_modules/negotiator/lib/mediaType.js
var require_mediaType = __commonJS({
  "node_modules/negotiator/lib/mediaType.js"(exports2, module2) {
    "use strict";
    module2.exports = preferredMediaTypes;
    module2.exports.preferredMediaTypes = preferredMediaTypes;
    var simpleMediaTypeRegExp = /^\s*([^\s\/;]+)\/([^;\s]+)\s*(?:;(.*))?$/;
    function parseAccept(accept) {
      var accepts = splitMediaTypes(accept);
      for (var i = 0, j = 0; i < accepts.length; i++) {
        var mediaType = parseMediaType(accepts[i].trim(), i);
        if (mediaType) {
          accepts[j++] = mediaType;
        }
      }
      accepts.length = j;
      return accepts;
    }
    function parseMediaType(str, i) {
      var match = simpleMediaTypeRegExp.exec(str);
      if (!match) return null;
      var params = /* @__PURE__ */ Object.create(null);
      var q = 1;
      var subtype = match[2];
      var type = match[1];
      if (match[3]) {
        var kvps = splitParameters(match[3]).map(splitKeyValuePair);
        for (var j = 0; j < kvps.length; j++) {
          var pair = kvps[j];
          var key = pair[0].toLowerCase();
          var val = pair[1];
          var value = val && val[0] === '"' && val[val.length - 1] === '"' ? val.substr(1, val.length - 2) : val;
          if (key === "q") {
            q = parseFloat(value);
            break;
          }
          params[key] = value;
        }
      }
      return {
        type,
        subtype,
        params,
        q,
        i
      };
    }
    function getMediaTypePriority(type, accepted, index) {
      var priority = { o: -1, q: 0, s: 0 };
      for (var i = 0; i < accepted.length; i++) {
        var spec = specify(type, accepted[i], index);
        if (spec && (priority.s - spec.s || priority.q - spec.q || priority.o - spec.o) < 0) {
          priority = spec;
        }
      }
      return priority;
    }
    function specify(type, spec, index) {
      var p = parseMediaType(type);
      var s = 0;
      if (!p) {
        return null;
      }
      if (spec.type.toLowerCase() == p.type.toLowerCase()) {
        s |= 4;
      } else if (spec.type != "*") {
        return null;
      }
      if (spec.subtype.toLowerCase() == p.subtype.toLowerCase()) {
        s |= 2;
      } else if (spec.subtype != "*") {
        return null;
      }
      var keys = Object.keys(spec.params);
      if (keys.length > 0) {
        if (keys.every(function(k) {
          return spec.params[k] == "*" || (spec.params[k] || "").toLowerCase() == (p.params[k] || "").toLowerCase();
        })) {
          s |= 1;
        } else {
          return null;
        }
      }
      return {
        i: index,
        o: spec.i,
        q: spec.q,
        s
      };
    }
    function preferredMediaTypes(accept, provided) {
      var accepts = parseAccept(accept === void 0 ? "*/*" : accept || "");
      if (!provided) {
        return accepts.filter(isQuality).sort(compareSpecs).map(getFullType);
      }
      var priorities = provided.map(function getPriority(type, index) {
        return getMediaTypePriority(type, accepts, index);
      });
      return priorities.filter(isQuality).sort(compareSpecs).map(function getType(priority) {
        return provided[priorities.indexOf(priority)];
      });
    }
    function compareSpecs(a, b) {
      return b.q - a.q || b.s - a.s || a.o - b.o || a.i - b.i || 0;
    }
    function getFullType(spec) {
      return spec.type + "/" + spec.subtype;
    }
    function isQuality(spec) {
      return spec.q > 0;
    }
    function quoteCount(string) {
      var count = 0;
      var index = 0;
      while ((index = string.indexOf('"', index)) !== -1) {
        count++;
        index++;
      }
      return count;
    }
    function splitKeyValuePair(str) {
      var index = str.indexOf("=");
      var key;
      var val;
      if (index === -1) {
        key = str;
      } else {
        key = str.substr(0, index);
        val = str.substr(index + 1);
      }
      return [key, val];
    }
    function splitMediaTypes(accept) {
      var accepts = accept.split(",");
      for (var i = 1, j = 0; i < accepts.length; i++) {
        if (quoteCount(accepts[j]) % 2 == 0) {
          accepts[++j] = accepts[i];
        } else {
          accepts[j] += "," + accepts[i];
        }
      }
      accepts.length = j + 1;
      return accepts;
    }
    function splitParameters(str) {
      var parameters = str.split(";");
      for (var i = 1, j = 0; i < parameters.length; i++) {
        if (quoteCount(parameters[j]) % 2 == 0) {
          parameters[++j] = parameters[i];
        } else {
          parameters[j] += ";" + parameters[i];
        }
      }
      parameters.length = j + 1;
      for (var i = 0; i < parameters.length; i++) {
        parameters[i] = parameters[i].trim();
      }
      return parameters;
    }
  }
});

// node_modules/negotiator/index.js
var require_negotiator = __commonJS({
  "node_modules/negotiator/index.js"(exports2, module2) {
    "use strict";
    var preferredCharsets = require_charset();
    var preferredEncodings = require_encoding();
    var preferredLanguages = require_language();
    var preferredMediaTypes = require_mediaType();
    module2.exports = Negotiator;
    module2.exports.Negotiator = Negotiator;
    function Negotiator(request) {
      if (!(this instanceof Negotiator)) {
        return new Negotiator(request);
      }
      this.request = request;
    }
    Negotiator.prototype.charset = function charset(available) {
      var set = this.charsets(available);
      return set && set[0];
    };
    Negotiator.prototype.charsets = function charsets(available) {
      return preferredCharsets(this.request.headers["accept-charset"], available);
    };
    Negotiator.prototype.encoding = function encoding(available) {
      var set = this.encodings(available);
      return set && set[0];
    };
    Negotiator.prototype.encodings = function encodings(available) {
      return preferredEncodings(this.request.headers["accept-encoding"], available);
    };
    Negotiator.prototype.language = function language(available) {
      var set = this.languages(available);
      return set && set[0];
    };
    Negotiator.prototype.languages = function languages(available) {
      return preferredLanguages(this.request.headers["accept-language"], available);
    };
    Negotiator.prototype.mediaType = function mediaType(available) {
      var set = this.mediaTypes(available);
      return set && set[0];
    };
    Negotiator.prototype.mediaTypes = function mediaTypes(available) {
      return preferredMediaTypes(this.request.headers.accept, available);
    };
    Negotiator.prototype.preferredCharset = Negotiator.prototype.charset;
    Negotiator.prototype.preferredCharsets = Negotiator.prototype.charsets;
    Negotiator.prototype.preferredEncoding = Negotiator.prototype.encoding;
    Negotiator.prototype.preferredEncodings = Negotiator.prototype.encodings;
    Negotiator.prototype.preferredLanguage = Negotiator.prototype.language;
    Negotiator.prototype.preferredLanguages = Negotiator.prototype.languages;
    Negotiator.prototype.preferredMediaType = Negotiator.prototype.mediaType;
    Negotiator.prototype.preferredMediaTypes = Negotiator.prototype.mediaTypes;
  }
});

// node_modules/mime-db/db.json
var require_db = __commonJS({
  "node_modules/mime-db/db.json"(exports2, module2) {
    module2.exports = {
      "application/1d-interleaved-parityfec": {
        source: "iana"
      },
      "application/3gpdash-qoe-report+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/3gpp-ims+xml": {
        source: "iana",
        compressible: true
      },
      "application/3gpphal+json": {
        source: "iana",
        compressible: true
      },
      "application/3gpphalforms+json": {
        source: "iana",
        compressible: true
      },
      "application/a2l": {
        source: "iana"
      },
      "application/ace+cbor": {
        source: "iana"
      },
      "application/activemessage": {
        source: "iana"
      },
      "application/activity+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-costmap+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-costmapfilter+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-directory+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-endpointcost+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-endpointcostparams+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-endpointprop+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-endpointpropparams+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-error+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-networkmap+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-networkmapfilter+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-updatestreamcontrol+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-updatestreamparams+json": {
        source: "iana",
        compressible: true
      },
      "application/aml": {
        source: "iana"
      },
      "application/andrew-inset": {
        source: "iana",
        extensions: ["ez"]
      },
      "application/applefile": {
        source: "iana"
      },
      "application/applixware": {
        source: "apache",
        extensions: ["aw"]
      },
      "application/at+jwt": {
        source: "iana"
      },
      "application/atf": {
        source: "iana"
      },
      "application/atfx": {
        source: "iana"
      },
      "application/atom+xml": {
        source: "iana",
        compressible: true,
        extensions: ["atom"]
      },
      "application/atomcat+xml": {
        source: "iana",
        compressible: true,
        extensions: ["atomcat"]
      },
      "application/atomdeleted+xml": {
        source: "iana",
        compressible: true,
        extensions: ["atomdeleted"]
      },
      "application/atomicmail": {
        source: "iana"
      },
      "application/atomsvc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["atomsvc"]
      },
      "application/atsc-dwd+xml": {
        source: "iana",
        compressible: true,
        extensions: ["dwd"]
      },
      "application/atsc-dynamic-event-message": {
        source: "iana"
      },
      "application/atsc-held+xml": {
        source: "iana",
        compressible: true,
        extensions: ["held"]
      },
      "application/atsc-rdt+json": {
        source: "iana",
        compressible: true
      },
      "application/atsc-rsat+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rsat"]
      },
      "application/atxml": {
        source: "iana"
      },
      "application/auth-policy+xml": {
        source: "iana",
        compressible: true
      },
      "application/bacnet-xdd+zip": {
        source: "iana",
        compressible: false
      },
      "application/batch-smtp": {
        source: "iana"
      },
      "application/bdoc": {
        compressible: false,
        extensions: ["bdoc"]
      },
      "application/beep+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/calendar+json": {
        source: "iana",
        compressible: true
      },
      "application/calendar+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xcs"]
      },
      "application/call-completion": {
        source: "iana"
      },
      "application/cals-1840": {
        source: "iana"
      },
      "application/captive+json": {
        source: "iana",
        compressible: true
      },
      "application/cbor": {
        source: "iana"
      },
      "application/cbor-seq": {
        source: "iana"
      },
      "application/cccex": {
        source: "iana"
      },
      "application/ccmp+xml": {
        source: "iana",
        compressible: true
      },
      "application/ccxml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ccxml"]
      },
      "application/cdfx+xml": {
        source: "iana",
        compressible: true,
        extensions: ["cdfx"]
      },
      "application/cdmi-capability": {
        source: "iana",
        extensions: ["cdmia"]
      },
      "application/cdmi-container": {
        source: "iana",
        extensions: ["cdmic"]
      },
      "application/cdmi-domain": {
        source: "iana",
        extensions: ["cdmid"]
      },
      "application/cdmi-object": {
        source: "iana",
        extensions: ["cdmio"]
      },
      "application/cdmi-queue": {
        source: "iana",
        extensions: ["cdmiq"]
      },
      "application/cdni": {
        source: "iana"
      },
      "application/cea": {
        source: "iana"
      },
      "application/cea-2018+xml": {
        source: "iana",
        compressible: true
      },
      "application/cellml+xml": {
        source: "iana",
        compressible: true
      },
      "application/cfw": {
        source: "iana"
      },
      "application/city+json": {
        source: "iana",
        compressible: true
      },
      "application/clr": {
        source: "iana"
      },
      "application/clue+xml": {
        source: "iana",
        compressible: true
      },
      "application/clue_info+xml": {
        source: "iana",
        compressible: true
      },
      "application/cms": {
        source: "iana"
      },
      "application/cnrp+xml": {
        source: "iana",
        compressible: true
      },
      "application/coap-group+json": {
        source: "iana",
        compressible: true
      },
      "application/coap-payload": {
        source: "iana"
      },
      "application/commonground": {
        source: "iana"
      },
      "application/conference-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/cose": {
        source: "iana"
      },
      "application/cose-key": {
        source: "iana"
      },
      "application/cose-key-set": {
        source: "iana"
      },
      "application/cpl+xml": {
        source: "iana",
        compressible: true,
        extensions: ["cpl"]
      },
      "application/csrattrs": {
        source: "iana"
      },
      "application/csta+xml": {
        source: "iana",
        compressible: true
      },
      "application/cstadata+xml": {
        source: "iana",
        compressible: true
      },
      "application/csvm+json": {
        source: "iana",
        compressible: true
      },
      "application/cu-seeme": {
        source: "apache",
        extensions: ["cu"]
      },
      "application/cwt": {
        source: "iana"
      },
      "application/cybercash": {
        source: "iana"
      },
      "application/dart": {
        compressible: true
      },
      "application/dash+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mpd"]
      },
      "application/dash-patch+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mpp"]
      },
      "application/dashdelta": {
        source: "iana"
      },
      "application/davmount+xml": {
        source: "iana",
        compressible: true,
        extensions: ["davmount"]
      },
      "application/dca-rft": {
        source: "iana"
      },
      "application/dcd": {
        source: "iana"
      },
      "application/dec-dx": {
        source: "iana"
      },
      "application/dialog-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/dicom": {
        source: "iana"
      },
      "application/dicom+json": {
        source: "iana",
        compressible: true
      },
      "application/dicom+xml": {
        source: "iana",
        compressible: true
      },
      "application/dii": {
        source: "iana"
      },
      "application/dit": {
        source: "iana"
      },
      "application/dns": {
        source: "iana"
      },
      "application/dns+json": {
        source: "iana",
        compressible: true
      },
      "application/dns-message": {
        source: "iana"
      },
      "application/docbook+xml": {
        source: "apache",
        compressible: true,
        extensions: ["dbk"]
      },
      "application/dots+cbor": {
        source: "iana"
      },
      "application/dskpp+xml": {
        source: "iana",
        compressible: true
      },
      "application/dssc+der": {
        source: "iana",
        extensions: ["dssc"]
      },
      "application/dssc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xdssc"]
      },
      "application/dvcs": {
        source: "iana"
      },
      "application/ecmascript": {
        source: "iana",
        compressible: true,
        extensions: ["es", "ecma"]
      },
      "application/edi-consent": {
        source: "iana"
      },
      "application/edi-x12": {
        source: "iana",
        compressible: false
      },
      "application/edifact": {
        source: "iana",
        compressible: false
      },
      "application/efi": {
        source: "iana"
      },
      "application/elm+json": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/elm+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.cap+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/emergencycalldata.comment+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.control+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.deviceinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.ecall.msd": {
        source: "iana"
      },
      "application/emergencycalldata.providerinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.serviceinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.subscriberinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.veds+xml": {
        source: "iana",
        compressible: true
      },
      "application/emma+xml": {
        source: "iana",
        compressible: true,
        extensions: ["emma"]
      },
      "application/emotionml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["emotionml"]
      },
      "application/encaprtp": {
        source: "iana"
      },
      "application/epp+xml": {
        source: "iana",
        compressible: true
      },
      "application/epub+zip": {
        source: "iana",
        compressible: false,
        extensions: ["epub"]
      },
      "application/eshop": {
        source: "iana"
      },
      "application/exi": {
        source: "iana",
        extensions: ["exi"]
      },
      "application/expect-ct-report+json": {
        source: "iana",
        compressible: true
      },
      "application/express": {
        source: "iana",
        extensions: ["exp"]
      },
      "application/fastinfoset": {
        source: "iana"
      },
      "application/fastsoap": {
        source: "iana"
      },
      "application/fdt+xml": {
        source: "iana",
        compressible: true,
        extensions: ["fdt"]
      },
      "application/fhir+json": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/fhir+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/fido.trusted-apps+json": {
        compressible: true
      },
      "application/fits": {
        source: "iana"
      },
      "application/flexfec": {
        source: "iana"
      },
      "application/font-sfnt": {
        source: "iana"
      },
      "application/font-tdpfr": {
        source: "iana",
        extensions: ["pfr"]
      },
      "application/font-woff": {
        source: "iana",
        compressible: false
      },
      "application/framework-attributes+xml": {
        source: "iana",
        compressible: true
      },
      "application/geo+json": {
        source: "iana",
        compressible: true,
        extensions: ["geojson"]
      },
      "application/geo+json-seq": {
        source: "iana"
      },
      "application/geopackage+sqlite3": {
        source: "iana"
      },
      "application/geoxacml+xml": {
        source: "iana",
        compressible: true
      },
      "application/gltf-buffer": {
        source: "iana"
      },
      "application/gml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["gml"]
      },
      "application/gpx+xml": {
        source: "apache",
        compressible: true,
        extensions: ["gpx"]
      },
      "application/gxf": {
        source: "apache",
        extensions: ["gxf"]
      },
      "application/gzip": {
        source: "iana",
        compressible: false,
        extensions: ["gz"]
      },
      "application/h224": {
        source: "iana"
      },
      "application/held+xml": {
        source: "iana",
        compressible: true
      },
      "application/hjson": {
        extensions: ["hjson"]
      },
      "application/http": {
        source: "iana"
      },
      "application/hyperstudio": {
        source: "iana",
        extensions: ["stk"]
      },
      "application/ibe-key-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/ibe-pkg-reply+xml": {
        source: "iana",
        compressible: true
      },
      "application/ibe-pp-data": {
        source: "iana"
      },
      "application/iges": {
        source: "iana"
      },
      "application/im-iscomposing+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/index": {
        source: "iana"
      },
      "application/index.cmd": {
        source: "iana"
      },
      "application/index.obj": {
        source: "iana"
      },
      "application/index.response": {
        source: "iana"
      },
      "application/index.vnd": {
        source: "iana"
      },
      "application/inkml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ink", "inkml"]
      },
      "application/iotp": {
        source: "iana"
      },
      "application/ipfix": {
        source: "iana",
        extensions: ["ipfix"]
      },
      "application/ipp": {
        source: "iana"
      },
      "application/isup": {
        source: "iana"
      },
      "application/its+xml": {
        source: "iana",
        compressible: true,
        extensions: ["its"]
      },
      "application/java-archive": {
        source: "apache",
        compressible: false,
        extensions: ["jar", "war", "ear"]
      },
      "application/java-serialized-object": {
        source: "apache",
        compressible: false,
        extensions: ["ser"]
      },
      "application/java-vm": {
        source: "apache",
        compressible: false,
        extensions: ["class"]
      },
      "application/javascript": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["js", "mjs"]
      },
      "application/jf2feed+json": {
        source: "iana",
        compressible: true
      },
      "application/jose": {
        source: "iana"
      },
      "application/jose+json": {
        source: "iana",
        compressible: true
      },
      "application/jrd+json": {
        source: "iana",
        compressible: true
      },
      "application/jscalendar+json": {
        source: "iana",
        compressible: true
      },
      "application/json": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["json", "map"]
      },
      "application/json-patch+json": {
        source: "iana",
        compressible: true
      },
      "application/json-seq": {
        source: "iana"
      },
      "application/json5": {
        extensions: ["json5"]
      },
      "application/jsonml+json": {
        source: "apache",
        compressible: true,
        extensions: ["jsonml"]
      },
      "application/jwk+json": {
        source: "iana",
        compressible: true
      },
      "application/jwk-set+json": {
        source: "iana",
        compressible: true
      },
      "application/jwt": {
        source: "iana"
      },
      "application/kpml-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/kpml-response+xml": {
        source: "iana",
        compressible: true
      },
      "application/ld+json": {
        source: "iana",
        compressible: true,
        extensions: ["jsonld"]
      },
      "application/lgr+xml": {
        source: "iana",
        compressible: true,
        extensions: ["lgr"]
      },
      "application/link-format": {
        source: "iana"
      },
      "application/load-control+xml": {
        source: "iana",
        compressible: true
      },
      "application/lost+xml": {
        source: "iana",
        compressible: true,
        extensions: ["lostxml"]
      },
      "application/lostsync+xml": {
        source: "iana",
        compressible: true
      },
      "application/lpf+zip": {
        source: "iana",
        compressible: false
      },
      "application/lxf": {
        source: "iana"
      },
      "application/mac-binhex40": {
        source: "iana",
        extensions: ["hqx"]
      },
      "application/mac-compactpro": {
        source: "apache",
        extensions: ["cpt"]
      },
      "application/macwriteii": {
        source: "iana"
      },
      "application/mads+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mads"]
      },
      "application/manifest+json": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["webmanifest"]
      },
      "application/marc": {
        source: "iana",
        extensions: ["mrc"]
      },
      "application/marcxml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mrcx"]
      },
      "application/mathematica": {
        source: "iana",
        extensions: ["ma", "nb", "mb"]
      },
      "application/mathml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mathml"]
      },
      "application/mathml-content+xml": {
        source: "iana",
        compressible: true
      },
      "application/mathml-presentation+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-associated-procedure-description+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-deregister+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-envelope+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-msk+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-msk-response+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-protection-description+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-reception-report+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-register+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-register-response+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-schedule+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-user-service-description+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbox": {
        source: "iana",
        extensions: ["mbox"]
      },
      "application/media-policy-dataset+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mpf"]
      },
      "application/media_control+xml": {
        source: "iana",
        compressible: true
      },
      "application/mediaservercontrol+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mscml"]
      },
      "application/merge-patch+json": {
        source: "iana",
        compressible: true
      },
      "application/metalink+xml": {
        source: "apache",
        compressible: true,
        extensions: ["metalink"]
      },
      "application/metalink4+xml": {
        source: "iana",
        compressible: true,
        extensions: ["meta4"]
      },
      "application/mets+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mets"]
      },
      "application/mf4": {
        source: "iana"
      },
      "application/mikey": {
        source: "iana"
      },
      "application/mipc": {
        source: "iana"
      },
      "application/missing-blocks+cbor-seq": {
        source: "iana"
      },
      "application/mmt-aei+xml": {
        source: "iana",
        compressible: true,
        extensions: ["maei"]
      },
      "application/mmt-usd+xml": {
        source: "iana",
        compressible: true,
        extensions: ["musd"]
      },
      "application/mods+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mods"]
      },
      "application/moss-keys": {
        source: "iana"
      },
      "application/moss-signature": {
        source: "iana"
      },
      "application/mosskey-data": {
        source: "iana"
      },
      "application/mosskey-request": {
        source: "iana"
      },
      "application/mp21": {
        source: "iana",
        extensions: ["m21", "mp21"]
      },
      "application/mp4": {
        source: "iana",
        extensions: ["mp4s", "m4p"]
      },
      "application/mpeg4-generic": {
        source: "iana"
      },
      "application/mpeg4-iod": {
        source: "iana"
      },
      "application/mpeg4-iod-xmt": {
        source: "iana"
      },
      "application/mrb-consumer+xml": {
        source: "iana",
        compressible: true
      },
      "application/mrb-publish+xml": {
        source: "iana",
        compressible: true
      },
      "application/msc-ivr+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/msc-mixer+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/msword": {
        source: "iana",
        compressible: false,
        extensions: ["doc", "dot"]
      },
      "application/mud+json": {
        source: "iana",
        compressible: true
      },
      "application/multipart-core": {
        source: "iana"
      },
      "application/mxf": {
        source: "iana",
        extensions: ["mxf"]
      },
      "application/n-quads": {
        source: "iana",
        extensions: ["nq"]
      },
      "application/n-triples": {
        source: "iana",
        extensions: ["nt"]
      },
      "application/nasdata": {
        source: "iana"
      },
      "application/news-checkgroups": {
        source: "iana",
        charset: "US-ASCII"
      },
      "application/news-groupinfo": {
        source: "iana",
        charset: "US-ASCII"
      },
      "application/news-transmission": {
        source: "iana"
      },
      "application/nlsml+xml": {
        source: "iana",
        compressible: true
      },
      "application/node": {
        source: "iana",
        extensions: ["cjs"]
      },
      "application/nss": {
        source: "iana"
      },
      "application/oauth-authz-req+jwt": {
        source: "iana"
      },
      "application/oblivious-dns-message": {
        source: "iana"
      },
      "application/ocsp-request": {
        source: "iana"
      },
      "application/ocsp-response": {
        source: "iana"
      },
      "application/octet-stream": {
        source: "iana",
        compressible: false,
        extensions: ["bin", "dms", "lrf", "mar", "so", "dist", "distz", "pkg", "bpk", "dump", "elc", "deploy", "exe", "dll", "deb", "dmg", "iso", "img", "msi", "msp", "msm", "buffer"]
      },
      "application/oda": {
        source: "iana",
        extensions: ["oda"]
      },
      "application/odm+xml": {
        source: "iana",
        compressible: true
      },
      "application/odx": {
        source: "iana"
      },
      "application/oebps-package+xml": {
        source: "iana",
        compressible: true,
        extensions: ["opf"]
      },
      "application/ogg": {
        source: "iana",
        compressible: false,
        extensions: ["ogx"]
      },
      "application/omdoc+xml": {
        source: "apache",
        compressible: true,
        extensions: ["omdoc"]
      },
      "application/onenote": {
        source: "apache",
        extensions: ["onetoc", "onetoc2", "onetmp", "onepkg"]
      },
      "application/opc-nodeset+xml": {
        source: "iana",
        compressible: true
      },
      "application/oscore": {
        source: "iana"
      },
      "application/oxps": {
        source: "iana",
        extensions: ["oxps"]
      },
      "application/p21": {
        source: "iana"
      },
      "application/p21+zip": {
        source: "iana",
        compressible: false
      },
      "application/p2p-overlay+xml": {
        source: "iana",
        compressible: true,
        extensions: ["relo"]
      },
      "application/parityfec": {
        source: "iana"
      },
      "application/passport": {
        source: "iana"
      },
      "application/patch-ops-error+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xer"]
      },
      "application/pdf": {
        source: "iana",
        compressible: false,
        extensions: ["pdf"]
      },
      "application/pdx": {
        source: "iana"
      },
      "application/pem-certificate-chain": {
        source: "iana"
      },
      "application/pgp-encrypted": {
        source: "iana",
        compressible: false,
        extensions: ["pgp"]
      },
      "application/pgp-keys": {
        source: "iana",
        extensions: ["asc"]
      },
      "application/pgp-signature": {
        source: "iana",
        extensions: ["asc", "sig"]
      },
      "application/pics-rules": {
        source: "apache",
        extensions: ["prf"]
      },
      "application/pidf+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/pidf-diff+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/pkcs10": {
        source: "iana",
        extensions: ["p10"]
      },
      "application/pkcs12": {
        source: "iana"
      },
      "application/pkcs7-mime": {
        source: "iana",
        extensions: ["p7m", "p7c"]
      },
      "application/pkcs7-signature": {
        source: "iana",
        extensions: ["p7s"]
      },
      "application/pkcs8": {
        source: "iana",
        extensions: ["p8"]
      },
      "application/pkcs8-encrypted": {
        source: "iana"
      },
      "application/pkix-attr-cert": {
        source: "iana",
        extensions: ["ac"]
      },
      "application/pkix-cert": {
        source: "iana",
        extensions: ["cer"]
      },
      "application/pkix-crl": {
        source: "iana",
        extensions: ["crl"]
      },
      "application/pkix-pkipath": {
        source: "iana",
        extensions: ["pkipath"]
      },
      "application/pkixcmp": {
        source: "iana",
        extensions: ["pki"]
      },
      "application/pls+xml": {
        source: "iana",
        compressible: true,
        extensions: ["pls"]
      },
      "application/poc-settings+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/postscript": {
        source: "iana",
        compressible: true,
        extensions: ["ai", "eps", "ps"]
      },
      "application/ppsp-tracker+json": {
        source: "iana",
        compressible: true
      },
      "application/problem+json": {
        source: "iana",
        compressible: true
      },
      "application/problem+xml": {
        source: "iana",
        compressible: true
      },
      "application/provenance+xml": {
        source: "iana",
        compressible: true,
        extensions: ["provx"]
      },
      "application/prs.alvestrand.titrax-sheet": {
        source: "iana"
      },
      "application/prs.cww": {
        source: "iana",
        extensions: ["cww"]
      },
      "application/prs.cyn": {
        source: "iana",
        charset: "7-BIT"
      },
      "application/prs.hpub+zip": {
        source: "iana",
        compressible: false
      },
      "application/prs.nprend": {
        source: "iana"
      },
      "application/prs.plucker": {
        source: "iana"
      },
      "application/prs.rdf-xml-crypt": {
        source: "iana"
      },
      "application/prs.xsf+xml": {
        source: "iana",
        compressible: true
      },
      "application/pskc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["pskcxml"]
      },
      "application/pvd+json": {
        source: "iana",
        compressible: true
      },
      "application/qsig": {
        source: "iana"
      },
      "application/raml+yaml": {
        compressible: true,
        extensions: ["raml"]
      },
      "application/raptorfec": {
        source: "iana"
      },
      "application/rdap+json": {
        source: "iana",
        compressible: true
      },
      "application/rdf+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rdf", "owl"]
      },
      "application/reginfo+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rif"]
      },
      "application/relax-ng-compact-syntax": {
        source: "iana",
        extensions: ["rnc"]
      },
      "application/remote-printing": {
        source: "iana"
      },
      "application/reputon+json": {
        source: "iana",
        compressible: true
      },
      "application/resource-lists+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rl"]
      },
      "application/resource-lists-diff+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rld"]
      },
      "application/rfc+xml": {
        source: "iana",
        compressible: true
      },
      "application/riscos": {
        source: "iana"
      },
      "application/rlmi+xml": {
        source: "iana",
        compressible: true
      },
      "application/rls-services+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rs"]
      },
      "application/route-apd+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rapd"]
      },
      "application/route-s-tsid+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sls"]
      },
      "application/route-usd+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rusd"]
      },
      "application/rpki-ghostbusters": {
        source: "iana",
        extensions: ["gbr"]
      },
      "application/rpki-manifest": {
        source: "iana",
        extensions: ["mft"]
      },
      "application/rpki-publication": {
        source: "iana"
      },
      "application/rpki-roa": {
        source: "iana",
        extensions: ["roa"]
      },
      "application/rpki-updown": {
        source: "iana"
      },
      "application/rsd+xml": {
        source: "apache",
        compressible: true,
        extensions: ["rsd"]
      },
      "application/rss+xml": {
        source: "apache",
        compressible: true,
        extensions: ["rss"]
      },
      "application/rtf": {
        source: "iana",
        compressible: true,
        extensions: ["rtf"]
      },
      "application/rtploopback": {
        source: "iana"
      },
      "application/rtx": {
        source: "iana"
      },
      "application/samlassertion+xml": {
        source: "iana",
        compressible: true
      },
      "application/samlmetadata+xml": {
        source: "iana",
        compressible: true
      },
      "application/sarif+json": {
        source: "iana",
        compressible: true
      },
      "application/sarif-external-properties+json": {
        source: "iana",
        compressible: true
      },
      "application/sbe": {
        source: "iana"
      },
      "application/sbml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sbml"]
      },
      "application/scaip+xml": {
        source: "iana",
        compressible: true
      },
      "application/scim+json": {
        source: "iana",
        compressible: true
      },
      "application/scvp-cv-request": {
        source: "iana",
        extensions: ["scq"]
      },
      "application/scvp-cv-response": {
        source: "iana",
        extensions: ["scs"]
      },
      "application/scvp-vp-request": {
        source: "iana",
        extensions: ["spq"]
      },
      "application/scvp-vp-response": {
        source: "iana",
        extensions: ["spp"]
      },
      "application/sdp": {
        source: "iana",
        extensions: ["sdp"]
      },
      "application/secevent+jwt": {
        source: "iana"
      },
      "application/senml+cbor": {
        source: "iana"
      },
      "application/senml+json": {
        source: "iana",
        compressible: true
      },
      "application/senml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["senmlx"]
      },
      "application/senml-etch+cbor": {
        source: "iana"
      },
      "application/senml-etch+json": {
        source: "iana",
        compressible: true
      },
      "application/senml-exi": {
        source: "iana"
      },
      "application/sensml+cbor": {
        source: "iana"
      },
      "application/sensml+json": {
        source: "iana",
        compressible: true
      },
      "application/sensml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sensmlx"]
      },
      "application/sensml-exi": {
        source: "iana"
      },
      "application/sep+xml": {
        source: "iana",
        compressible: true
      },
      "application/sep-exi": {
        source: "iana"
      },
      "application/session-info": {
        source: "iana"
      },
      "application/set-payment": {
        source: "iana"
      },
      "application/set-payment-initiation": {
        source: "iana",
        extensions: ["setpay"]
      },
      "application/set-registration": {
        source: "iana"
      },
      "application/set-registration-initiation": {
        source: "iana",
        extensions: ["setreg"]
      },
      "application/sgml": {
        source: "iana"
      },
      "application/sgml-open-catalog": {
        source: "iana"
      },
      "application/shf+xml": {
        source: "iana",
        compressible: true,
        extensions: ["shf"]
      },
      "application/sieve": {
        source: "iana",
        extensions: ["siv", "sieve"]
      },
      "application/simple-filter+xml": {
        source: "iana",
        compressible: true
      },
      "application/simple-message-summary": {
        source: "iana"
      },
      "application/simplesymbolcontainer": {
        source: "iana"
      },
      "application/sipc": {
        source: "iana"
      },
      "application/slate": {
        source: "iana"
      },
      "application/smil": {
        source: "iana"
      },
      "application/smil+xml": {
        source: "iana",
        compressible: true,
        extensions: ["smi", "smil"]
      },
      "application/smpte336m": {
        source: "iana"
      },
      "application/soap+fastinfoset": {
        source: "iana"
      },
      "application/soap+xml": {
        source: "iana",
        compressible: true
      },
      "application/sparql-query": {
        source: "iana",
        extensions: ["rq"]
      },
      "application/sparql-results+xml": {
        source: "iana",
        compressible: true,
        extensions: ["srx"]
      },
      "application/spdx+json": {
        source: "iana",
        compressible: true
      },
      "application/spirits-event+xml": {
        source: "iana",
        compressible: true
      },
      "application/sql": {
        source: "iana"
      },
      "application/srgs": {
        source: "iana",
        extensions: ["gram"]
      },
      "application/srgs+xml": {
        source: "iana",
        compressible: true,
        extensions: ["grxml"]
      },
      "application/sru+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sru"]
      },
      "application/ssdl+xml": {
        source: "apache",
        compressible: true,
        extensions: ["ssdl"]
      },
      "application/ssml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ssml"]
      },
      "application/stix+json": {
        source: "iana",
        compressible: true
      },
      "application/swid+xml": {
        source: "iana",
        compressible: true,
        extensions: ["swidtag"]
      },
      "application/tamp-apex-update": {
        source: "iana"
      },
      "application/tamp-apex-update-confirm": {
        source: "iana"
      },
      "application/tamp-community-update": {
        source: "iana"
      },
      "application/tamp-community-update-confirm": {
        source: "iana"
      },
      "application/tamp-error": {
        source: "iana"
      },
      "application/tamp-sequence-adjust": {
        source: "iana"
      },
      "application/tamp-sequence-adjust-confirm": {
        source: "iana"
      },
      "application/tamp-status-query": {
        source: "iana"
      },
      "application/tamp-status-response": {
        source: "iana"
      },
      "application/tamp-update": {
        source: "iana"
      },
      "application/tamp-update-confirm": {
        source: "iana"
      },
      "application/tar": {
        compressible: true
      },
      "application/taxii+json": {
        source: "iana",
        compressible: true
      },
      "application/td+json": {
        source: "iana",
        compressible: true
      },
      "application/tei+xml": {
        source: "iana",
        compressible: true,
        extensions: ["tei", "teicorpus"]
      },
      "application/tetra_isi": {
        source: "iana"
      },
      "application/thraud+xml": {
        source: "iana",
        compressible: true,
        extensions: ["tfi"]
      },
      "application/timestamp-query": {
        source: "iana"
      },
      "application/timestamp-reply": {
        source: "iana"
      },
      "application/timestamped-data": {
        source: "iana",
        extensions: ["tsd"]
      },
      "application/tlsrpt+gzip": {
        source: "iana"
      },
      "application/tlsrpt+json": {
        source: "iana",
        compressible: true
      },
      "application/tnauthlist": {
        source: "iana"
      },
      "application/token-introspection+jwt": {
        source: "iana"
      },
      "application/toml": {
        compressible: true,
        extensions: ["toml"]
      },
      "application/trickle-ice-sdpfrag": {
        source: "iana"
      },
      "application/trig": {
        source: "iana",
        extensions: ["trig"]
      },
      "application/ttml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ttml"]
      },
      "application/tve-trigger": {
        source: "iana"
      },
      "application/tzif": {
        source: "iana"
      },
      "application/tzif-leap": {
        source: "iana"
      },
      "application/ubjson": {
        compressible: false,
        extensions: ["ubj"]
      },
      "application/ulpfec": {
        source: "iana"
      },
      "application/urc-grpsheet+xml": {
        source: "iana",
        compressible: true
      },
      "application/urc-ressheet+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rsheet"]
      },
      "application/urc-targetdesc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["td"]
      },
      "application/urc-uisocketdesc+xml": {
        source: "iana",
        compressible: true
      },
      "application/vcard+json": {
        source: "iana",
        compressible: true
      },
      "application/vcard+xml": {
        source: "iana",
        compressible: true
      },
      "application/vemmi": {
        source: "iana"
      },
      "application/vividence.scriptfile": {
        source: "apache"
      },
      "application/vnd.1000minds.decision-model+xml": {
        source: "iana",
        compressible: true,
        extensions: ["1km"]
      },
      "application/vnd.3gpp-prose+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp-prose-pc3ch+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp-v2x-local-service-information": {
        source: "iana"
      },
      "application/vnd.3gpp.5gnas": {
        source: "iana"
      },
      "application/vnd.3gpp.access-transfer-events+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.bsf+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.gmop+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.gtpc": {
        source: "iana"
      },
      "application/vnd.3gpp.interworking-data": {
        source: "iana"
      },
      "application/vnd.3gpp.lpp": {
        source: "iana"
      },
      "application/vnd.3gpp.mc-signalling-ear": {
        source: "iana"
      },
      "application/vnd.3gpp.mcdata-affiliation-command+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcdata-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcdata-payload": {
        source: "iana"
      },
      "application/vnd.3gpp.mcdata-service-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcdata-signalling": {
        source: "iana"
      },
      "application/vnd.3gpp.mcdata-ue-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcdata-user-profile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-affiliation-command+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-floor-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-location-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-mbms-usage-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-service-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-signed+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-ue-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-ue-init-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-user-profile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-affiliation-command+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-affiliation-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-location-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-mbms-usage-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-service-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-transmission-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-ue-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-user-profile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mid-call+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.ngap": {
        source: "iana"
      },
      "application/vnd.3gpp.pfcp": {
        source: "iana"
      },
      "application/vnd.3gpp.pic-bw-large": {
        source: "iana",
        extensions: ["plb"]
      },
      "application/vnd.3gpp.pic-bw-small": {
        source: "iana",
        extensions: ["psb"]
      },
      "application/vnd.3gpp.pic-bw-var": {
        source: "iana",
        extensions: ["pvb"]
      },
      "application/vnd.3gpp.s1ap": {
        source: "iana"
      },
      "application/vnd.3gpp.sms": {
        source: "iana"
      },
      "application/vnd.3gpp.sms+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.srvcc-ext+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.srvcc-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.state-and-event-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.ussd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp2.bcmcsinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp2.sms": {
        source: "iana"
      },
      "application/vnd.3gpp2.tcap": {
        source: "iana",
        extensions: ["tcap"]
      },
      "application/vnd.3lightssoftware.imagescal": {
        source: "iana"
      },
      "application/vnd.3m.post-it-notes": {
        source: "iana",
        extensions: ["pwn"]
      },
      "application/vnd.accpac.simply.aso": {
        source: "iana",
        extensions: ["aso"]
      },
      "application/vnd.accpac.simply.imp": {
        source: "iana",
        extensions: ["imp"]
      },
      "application/vnd.acucobol": {
        source: "iana",
        extensions: ["acu"]
      },
      "application/vnd.acucorp": {
        source: "iana",
        extensions: ["atc", "acutc"]
      },
      "application/vnd.adobe.air-application-installer-package+zip": {
        source: "apache",
        compressible: false,
        extensions: ["air"]
      },
      "application/vnd.adobe.flash.movie": {
        source: "iana"
      },
      "application/vnd.adobe.formscentral.fcdt": {
        source: "iana",
        extensions: ["fcdt"]
      },
      "application/vnd.adobe.fxp": {
        source: "iana",
        extensions: ["fxp", "fxpl"]
      },
      "application/vnd.adobe.partial-upload": {
        source: "iana"
      },
      "application/vnd.adobe.xdp+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xdp"]
      },
      "application/vnd.adobe.xfdf": {
        source: "iana",
        extensions: ["xfdf"]
      },
      "application/vnd.aether.imp": {
        source: "iana"
      },
      "application/vnd.afpc.afplinedata": {
        source: "iana"
      },
      "application/vnd.afpc.afplinedata-pagedef": {
        source: "iana"
      },
      "application/vnd.afpc.cmoca-cmresource": {
        source: "iana"
      },
      "application/vnd.afpc.foca-charset": {
        source: "iana"
      },
      "application/vnd.afpc.foca-codedfont": {
        source: "iana"
      },
      "application/vnd.afpc.foca-codepage": {
        source: "iana"
      },
      "application/vnd.afpc.modca": {
        source: "iana"
      },
      "application/vnd.afpc.modca-cmtable": {
        source: "iana"
      },
      "application/vnd.afpc.modca-formdef": {
        source: "iana"
      },
      "application/vnd.afpc.modca-mediummap": {
        source: "iana"
      },
      "application/vnd.afpc.modca-objectcontainer": {
        source: "iana"
      },
      "application/vnd.afpc.modca-overlay": {
        source: "iana"
      },
      "application/vnd.afpc.modca-pagesegment": {
        source: "iana"
      },
      "application/vnd.age": {
        source: "iana",
        extensions: ["age"]
      },
      "application/vnd.ah-barcode": {
        source: "iana"
      },
      "application/vnd.ahead.space": {
        source: "iana",
        extensions: ["ahead"]
      },
      "application/vnd.airzip.filesecure.azf": {
        source: "iana",
        extensions: ["azf"]
      },
      "application/vnd.airzip.filesecure.azs": {
        source: "iana",
        extensions: ["azs"]
      },
      "application/vnd.amadeus+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.amazon.ebook": {
        source: "apache",
        extensions: ["azw"]
      },
      "application/vnd.amazon.mobi8-ebook": {
        source: "iana"
      },
      "application/vnd.americandynamics.acc": {
        source: "iana",
        extensions: ["acc"]
      },
      "application/vnd.amiga.ami": {
        source: "iana",
        extensions: ["ami"]
      },
      "application/vnd.amundsen.maze+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.android.ota": {
        source: "iana"
      },
      "application/vnd.android.package-archive": {
        source: "apache",
        compressible: false,
        extensions: ["apk"]
      },
      "application/vnd.anki": {
        source: "iana"
      },
      "application/vnd.anser-web-certificate-issue-initiation": {
        source: "iana",
        extensions: ["cii"]
      },
      "application/vnd.anser-web-funds-transfer-initiation": {
        source: "apache",
        extensions: ["fti"]
      },
      "application/vnd.antix.game-component": {
        source: "iana",
        extensions: ["atx"]
      },
      "application/vnd.apache.arrow.file": {
        source: "iana"
      },
      "application/vnd.apache.arrow.stream": {
        source: "iana"
      },
      "application/vnd.apache.thrift.binary": {
        source: "iana"
      },
      "application/vnd.apache.thrift.compact": {
        source: "iana"
      },
      "application/vnd.apache.thrift.json": {
        source: "iana"
      },
      "application/vnd.api+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.aplextor.warrp+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.apothekende.reservation+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.apple.installer+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mpkg"]
      },
      "application/vnd.apple.keynote": {
        source: "iana",
        extensions: ["key"]
      },
      "application/vnd.apple.mpegurl": {
        source: "iana",
        extensions: ["m3u8"]
      },
      "application/vnd.apple.numbers": {
        source: "iana",
        extensions: ["numbers"]
      },
      "application/vnd.apple.pages": {
        source: "iana",
        extensions: ["pages"]
      },
      "application/vnd.apple.pkpass": {
        compressible: false,
        extensions: ["pkpass"]
      },
      "application/vnd.arastra.swi": {
        source: "iana"
      },
      "application/vnd.aristanetworks.swi": {
        source: "iana",
        extensions: ["swi"]
      },
      "application/vnd.artisan+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.artsquare": {
        source: "iana"
      },
      "application/vnd.astraea-software.iota": {
        source: "iana",
        extensions: ["iota"]
      },
      "application/vnd.audiograph": {
        source: "iana",
        extensions: ["aep"]
      },
      "application/vnd.autopackage": {
        source: "iana"
      },
      "application/vnd.avalon+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.avistar+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.balsamiq.bmml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["bmml"]
      },
      "application/vnd.balsamiq.bmpr": {
        source: "iana"
      },
      "application/vnd.banana-accounting": {
        source: "iana"
      },
      "application/vnd.bbf.usp.error": {
        source: "iana"
      },
      "application/vnd.bbf.usp.msg": {
        source: "iana"
      },
      "application/vnd.bbf.usp.msg+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.bekitzur-stech+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.bint.med-content": {
        source: "iana"
      },
      "application/vnd.biopax.rdf+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.blink-idb-value-wrapper": {
        source: "iana"
      },
      "application/vnd.blueice.multipass": {
        source: "iana",
        extensions: ["mpm"]
      },
      "application/vnd.bluetooth.ep.oob": {
        source: "iana"
      },
      "application/vnd.bluetooth.le.oob": {
        source: "iana"
      },
      "application/vnd.bmi": {
        source: "iana",
        extensions: ["bmi"]
      },
      "application/vnd.bpf": {
        source: "iana"
      },
      "application/vnd.bpf3": {
        source: "iana"
      },
      "application/vnd.businessobjects": {
        source: "iana",
        extensions: ["rep"]
      },
      "application/vnd.byu.uapi+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cab-jscript": {
        source: "iana"
      },
      "application/vnd.canon-cpdl": {
        source: "iana"
      },
      "application/vnd.canon-lips": {
        source: "iana"
      },
      "application/vnd.capasystems-pg+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cendio.thinlinc.clientconf": {
        source: "iana"
      },
      "application/vnd.century-systems.tcp_stream": {
        source: "iana"
      },
      "application/vnd.chemdraw+xml": {
        source: "iana",
        compressible: true,
        extensions: ["cdxml"]
      },
      "application/vnd.chess-pgn": {
        source: "iana"
      },
      "application/vnd.chipnuts.karaoke-mmd": {
        source: "iana",
        extensions: ["mmd"]
      },
      "application/vnd.ciedi": {
        source: "iana"
      },
      "application/vnd.cinderella": {
        source: "iana",
        extensions: ["cdy"]
      },
      "application/vnd.cirpack.isdn-ext": {
        source: "iana"
      },
      "application/vnd.citationstyles.style+xml": {
        source: "iana",
        compressible: true,
        extensions: ["csl"]
      },
      "application/vnd.claymore": {
        source: "iana",
        extensions: ["cla"]
      },
      "application/vnd.cloanto.rp9": {
        source: "iana",
        extensions: ["rp9"]
      },
      "application/vnd.clonk.c4group": {
        source: "iana",
        extensions: ["c4g", "c4d", "c4f", "c4p", "c4u"]
      },
      "application/vnd.cluetrust.cartomobile-config": {
        source: "iana",
        extensions: ["c11amc"]
      },
      "application/vnd.cluetrust.cartomobile-config-pkg": {
        source: "iana",
        extensions: ["c11amz"]
      },
      "application/vnd.coffeescript": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.document": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.document-template": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.presentation": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.presentation-template": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.spreadsheet": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.spreadsheet-template": {
        source: "iana"
      },
      "application/vnd.collection+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.collection.doc+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.collection.next+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.comicbook+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.comicbook-rar": {
        source: "iana"
      },
      "application/vnd.commerce-battelle": {
        source: "iana"
      },
      "application/vnd.commonspace": {
        source: "iana",
        extensions: ["csp"]
      },
      "application/vnd.contact.cmsg": {
        source: "iana",
        extensions: ["cdbcmsg"]
      },
      "application/vnd.coreos.ignition+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cosmocaller": {
        source: "iana",
        extensions: ["cmc"]
      },
      "application/vnd.crick.clicker": {
        source: "iana",
        extensions: ["clkx"]
      },
      "application/vnd.crick.clicker.keyboard": {
        source: "iana",
        extensions: ["clkk"]
      },
      "application/vnd.crick.clicker.palette": {
        source: "iana",
        extensions: ["clkp"]
      },
      "application/vnd.crick.clicker.template": {
        source: "iana",
        extensions: ["clkt"]
      },
      "application/vnd.crick.clicker.wordbank": {
        source: "iana",
        extensions: ["clkw"]
      },
      "application/vnd.criticaltools.wbs+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wbs"]
      },
      "application/vnd.cryptii.pipe+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.crypto-shade-file": {
        source: "iana"
      },
      "application/vnd.cryptomator.encrypted": {
        source: "iana"
      },
      "application/vnd.cryptomator.vault": {
        source: "iana"
      },
      "application/vnd.ctc-posml": {
        source: "iana",
        extensions: ["pml"]
      },
      "application/vnd.ctct.ws+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cups-pdf": {
        source: "iana"
      },
      "application/vnd.cups-postscript": {
        source: "iana"
      },
      "application/vnd.cups-ppd": {
        source: "iana",
        extensions: ["ppd"]
      },
      "application/vnd.cups-raster": {
        source: "iana"
      },
      "application/vnd.cups-raw": {
        source: "iana"
      },
      "application/vnd.curl": {
        source: "iana"
      },
      "application/vnd.curl.car": {
        source: "apache",
        extensions: ["car"]
      },
      "application/vnd.curl.pcurl": {
        source: "apache",
        extensions: ["pcurl"]
      },
      "application/vnd.cyan.dean.root+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cybank": {
        source: "iana"
      },
      "application/vnd.cyclonedx+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cyclonedx+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.d2l.coursepackage1p0+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.d3m-dataset": {
        source: "iana"
      },
      "application/vnd.d3m-problem": {
        source: "iana"
      },
      "application/vnd.dart": {
        source: "iana",
        compressible: true,
        extensions: ["dart"]
      },
      "application/vnd.data-vision.rdz": {
        source: "iana",
        extensions: ["rdz"]
      },
      "application/vnd.datapackage+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dataresource+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dbf": {
        source: "iana",
        extensions: ["dbf"]
      },
      "application/vnd.debian.binary-package": {
        source: "iana"
      },
      "application/vnd.dece.data": {
        source: "iana",
        extensions: ["uvf", "uvvf", "uvd", "uvvd"]
      },
      "application/vnd.dece.ttml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["uvt", "uvvt"]
      },
      "application/vnd.dece.unspecified": {
        source: "iana",
        extensions: ["uvx", "uvvx"]
      },
      "application/vnd.dece.zip": {
        source: "iana",
        extensions: ["uvz", "uvvz"]
      },
      "application/vnd.denovo.fcselayout-link": {
        source: "iana",
        extensions: ["fe_launch"]
      },
      "application/vnd.desmume.movie": {
        source: "iana"
      },
      "application/vnd.dir-bi.plate-dl-nosuffix": {
        source: "iana"
      },
      "application/vnd.dm.delegation+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dna": {
        source: "iana",
        extensions: ["dna"]
      },
      "application/vnd.document+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dolby.mlp": {
        source: "apache",
        extensions: ["mlp"]
      },
      "application/vnd.dolby.mobile.1": {
        source: "iana"
      },
      "application/vnd.dolby.mobile.2": {
        source: "iana"
      },
      "application/vnd.doremir.scorecloud-binary-document": {
        source: "iana"
      },
      "application/vnd.dpgraph": {
        source: "iana",
        extensions: ["dpg"]
      },
      "application/vnd.dreamfactory": {
        source: "iana",
        extensions: ["dfac"]
      },
      "application/vnd.drive+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ds-keypoint": {
        source: "apache",
        extensions: ["kpxx"]
      },
      "application/vnd.dtg.local": {
        source: "iana"
      },
      "application/vnd.dtg.local.flash": {
        source: "iana"
      },
      "application/vnd.dtg.local.html": {
        source: "iana"
      },
      "application/vnd.dvb.ait": {
        source: "iana",
        extensions: ["ait"]
      },
      "application/vnd.dvb.dvbisl+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.dvbj": {
        source: "iana"
      },
      "application/vnd.dvb.esgcontainer": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcdftnotifaccess": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcesgaccess": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcesgaccess2": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcesgpdd": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcroaming": {
        source: "iana"
      },
      "application/vnd.dvb.iptv.alfec-base": {
        source: "iana"
      },
      "application/vnd.dvb.iptv.alfec-enhancement": {
        source: "iana"
      },
      "application/vnd.dvb.notif-aggregate-root+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-container+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-generic+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-ia-msglist+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-ia-registration-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-ia-registration-response+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-init+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.pfr": {
        source: "iana"
      },
      "application/vnd.dvb.service": {
        source: "iana",
        extensions: ["svc"]
      },
      "application/vnd.dxr": {
        source: "iana"
      },
      "application/vnd.dynageo": {
        source: "iana",
        extensions: ["geo"]
      },
      "application/vnd.dzr": {
        source: "iana"
      },
      "application/vnd.easykaraoke.cdgdownload": {
        source: "iana"
      },
      "application/vnd.ecdis-update": {
        source: "iana"
      },
      "application/vnd.ecip.rlp": {
        source: "iana"
      },
      "application/vnd.eclipse.ditto+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ecowin.chart": {
        source: "iana",
        extensions: ["mag"]
      },
      "application/vnd.ecowin.filerequest": {
        source: "iana"
      },
      "application/vnd.ecowin.fileupdate": {
        source: "iana"
      },
      "application/vnd.ecowin.series": {
        source: "iana"
      },
      "application/vnd.ecowin.seriesrequest": {
        source: "iana"
      },
      "application/vnd.ecowin.seriesupdate": {
        source: "iana"
      },
      "application/vnd.efi.img": {
        source: "iana"
      },
      "application/vnd.efi.iso": {
        source: "iana"
      },
      "application/vnd.emclient.accessrequest+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.enliven": {
        source: "iana",
        extensions: ["nml"]
      },
      "application/vnd.enphase.envoy": {
        source: "iana"
      },
      "application/vnd.eprints.data+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.epson.esf": {
        source: "iana",
        extensions: ["esf"]
      },
      "application/vnd.epson.msf": {
        source: "iana",
        extensions: ["msf"]
      },
      "application/vnd.epson.quickanime": {
        source: "iana",
        extensions: ["qam"]
      },
      "application/vnd.epson.salt": {
        source: "iana",
        extensions: ["slt"]
      },
      "application/vnd.epson.ssf": {
        source: "iana",
        extensions: ["ssf"]
      },
      "application/vnd.ericsson.quickcall": {
        source: "iana"
      },
      "application/vnd.espass-espass+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.eszigno3+xml": {
        source: "iana",
        compressible: true,
        extensions: ["es3", "et3"]
      },
      "application/vnd.etsi.aoc+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.asic-e+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.etsi.asic-s+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.etsi.cug+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvcommand+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvdiscovery+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvprofile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvsad-bc+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvsad-cod+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvsad-npvr+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvservice+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvsync+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvueprofile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.mcid+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.mheg5": {
        source: "iana"
      },
      "application/vnd.etsi.overload-control-policy-dataset+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.pstn+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.sci+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.simservs+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.timestamp-token": {
        source: "iana"
      },
      "application/vnd.etsi.tsl+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.tsl.der": {
        source: "iana"
      },
      "application/vnd.eu.kasparian.car+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.eudora.data": {
        source: "iana"
      },
      "application/vnd.evolv.ecig.profile": {
        source: "iana"
      },
      "application/vnd.evolv.ecig.settings": {
        source: "iana"
      },
      "application/vnd.evolv.ecig.theme": {
        source: "iana"
      },
      "application/vnd.exstream-empower+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.exstream-package": {
        source: "iana"
      },
      "application/vnd.ezpix-album": {
        source: "iana",
        extensions: ["ez2"]
      },
      "application/vnd.ezpix-package": {
        source: "iana",
        extensions: ["ez3"]
      },
      "application/vnd.f-secure.mobile": {
        source: "iana"
      },
      "application/vnd.familysearch.gedcom+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.fastcopy-disk-image": {
        source: "iana"
      },
      "application/vnd.fdf": {
        source: "iana",
        extensions: ["fdf"]
      },
      "application/vnd.fdsn.mseed": {
        source: "iana",
        extensions: ["mseed"]
      },
      "application/vnd.fdsn.seed": {
        source: "iana",
        extensions: ["seed", "dataless"]
      },
      "application/vnd.ffsns": {
        source: "iana"
      },
      "application/vnd.ficlab.flb+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.filmit.zfc": {
        source: "iana"
      },
      "application/vnd.fints": {
        source: "iana"
      },
      "application/vnd.firemonkeys.cloudcell": {
        source: "iana"
      },
      "application/vnd.flographit": {
        source: "iana",
        extensions: ["gph"]
      },
      "application/vnd.fluxtime.clip": {
        source: "iana",
        extensions: ["ftc"]
      },
      "application/vnd.font-fontforge-sfd": {
        source: "iana"
      },
      "application/vnd.framemaker": {
        source: "iana",
        extensions: ["fm", "frame", "maker", "book"]
      },
      "application/vnd.frogans.fnc": {
        source: "iana",
        extensions: ["fnc"]
      },
      "application/vnd.frogans.ltf": {
        source: "iana",
        extensions: ["ltf"]
      },
      "application/vnd.fsc.weblaunch": {
        source: "iana",
        extensions: ["fsc"]
      },
      "application/vnd.fujifilm.fb.docuworks": {
        source: "iana"
      },
      "application/vnd.fujifilm.fb.docuworks.binder": {
        source: "iana"
      },
      "application/vnd.fujifilm.fb.docuworks.container": {
        source: "iana"
      },
      "application/vnd.fujifilm.fb.jfi+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.fujitsu.oasys": {
        source: "iana",
        extensions: ["oas"]
      },
      "application/vnd.fujitsu.oasys2": {
        source: "iana",
        extensions: ["oa2"]
      },
      "application/vnd.fujitsu.oasys3": {
        source: "iana",
        extensions: ["oa3"]
      },
      "application/vnd.fujitsu.oasysgp": {
        source: "iana",
        extensions: ["fg5"]
      },
      "application/vnd.fujitsu.oasysprs": {
        source: "iana",
        extensions: ["bh2"]
      },
      "application/vnd.fujixerox.art-ex": {
        source: "iana"
      },
      "application/vnd.fujixerox.art4": {
        source: "iana"
      },
      "application/vnd.fujixerox.ddd": {
        source: "iana",
        extensions: ["ddd"]
      },
      "application/vnd.fujixerox.docuworks": {
        source: "iana",
        extensions: ["xdw"]
      },
      "application/vnd.fujixerox.docuworks.binder": {
        source: "iana",
        extensions: ["xbd"]
      },
      "application/vnd.fujixerox.docuworks.container": {
        source: "iana"
      },
      "application/vnd.fujixerox.hbpl": {
        source: "iana"
      },
      "application/vnd.fut-misnet": {
        source: "iana"
      },
      "application/vnd.futoin+cbor": {
        source: "iana"
      },
      "application/vnd.futoin+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.fuzzysheet": {
        source: "iana",
        extensions: ["fzs"]
      },
      "application/vnd.genomatix.tuxedo": {
        source: "iana",
        extensions: ["txd"]
      },
      "application/vnd.gentics.grd+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.geo+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.geocube+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.geogebra.file": {
        source: "iana",
        extensions: ["ggb"]
      },
      "application/vnd.geogebra.slides": {
        source: "iana"
      },
      "application/vnd.geogebra.tool": {
        source: "iana",
        extensions: ["ggt"]
      },
      "application/vnd.geometry-explorer": {
        source: "iana",
        extensions: ["gex", "gre"]
      },
      "application/vnd.geonext": {
        source: "iana",
        extensions: ["gxt"]
      },
      "application/vnd.geoplan": {
        source: "iana",
        extensions: ["g2w"]
      },
      "application/vnd.geospace": {
        source: "iana",
        extensions: ["g3w"]
      },
      "application/vnd.gerber": {
        source: "iana"
      },
      "application/vnd.globalplatform.card-content-mgt": {
        source: "iana"
      },
      "application/vnd.globalplatform.card-content-mgt-response": {
        source: "iana"
      },
      "application/vnd.gmx": {
        source: "iana",
        extensions: ["gmx"]
      },
      "application/vnd.google-apps.document": {
        compressible: false,
        extensions: ["gdoc"]
      },
      "application/vnd.google-apps.presentation": {
        compressible: false,
        extensions: ["gslides"]
      },
      "application/vnd.google-apps.spreadsheet": {
        compressible: false,
        extensions: ["gsheet"]
      },
      "application/vnd.google-earth.kml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["kml"]
      },
      "application/vnd.google-earth.kmz": {
        source: "iana",
        compressible: false,
        extensions: ["kmz"]
      },
      "application/vnd.gov.sk.e-form+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.gov.sk.e-form+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.gov.sk.xmldatacontainer+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.grafeq": {
        source: "iana",
        extensions: ["gqf", "gqs"]
      },
      "application/vnd.gridmp": {
        source: "iana"
      },
      "application/vnd.groove-account": {
        source: "iana",
        extensions: ["gac"]
      },
      "application/vnd.groove-help": {
        source: "iana",
        extensions: ["ghf"]
      },
      "application/vnd.groove-identity-message": {
        source: "iana",
        extensions: ["gim"]
      },
      "application/vnd.groove-injector": {
        source: "iana",
        extensions: ["grv"]
      },
      "application/vnd.groove-tool-message": {
        source: "iana",
        extensions: ["gtm"]
      },
      "application/vnd.groove-tool-template": {
        source: "iana",
        extensions: ["tpl"]
      },
      "application/vnd.groove-vcard": {
        source: "iana",
        extensions: ["vcg"]
      },
      "application/vnd.hal+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hal+xml": {
        source: "iana",
        compressible: true,
        extensions: ["hal"]
      },
      "application/vnd.handheld-entertainment+xml": {
        source: "iana",
        compressible: true,
        extensions: ["zmm"]
      },
      "application/vnd.hbci": {
        source: "iana",
        extensions: ["hbci"]
      },
      "application/vnd.hc+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hcl-bireports": {
        source: "iana"
      },
      "application/vnd.hdt": {
        source: "iana"
      },
      "application/vnd.heroku+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hhe.lesson-player": {
        source: "iana",
        extensions: ["les"]
      },
      "application/vnd.hl7cda+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.hl7v2+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.hp-hpgl": {
        source: "iana",
        extensions: ["hpgl"]
      },
      "application/vnd.hp-hpid": {
        source: "iana",
        extensions: ["hpid"]
      },
      "application/vnd.hp-hps": {
        source: "iana",
        extensions: ["hps"]
      },
      "application/vnd.hp-jlyt": {
        source: "iana",
        extensions: ["jlt"]
      },
      "application/vnd.hp-pcl": {
        source: "iana",
        extensions: ["pcl"]
      },
      "application/vnd.hp-pclxl": {
        source: "iana",
        extensions: ["pclxl"]
      },
      "application/vnd.httphone": {
        source: "iana"
      },
      "application/vnd.hydrostatix.sof-data": {
        source: "iana",
        extensions: ["sfd-hdstx"]
      },
      "application/vnd.hyper+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hyper-item+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hyperdrive+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hzn-3d-crossword": {
        source: "iana"
      },
      "application/vnd.ibm.afplinedata": {
        source: "iana"
      },
      "application/vnd.ibm.electronic-media": {
        source: "iana"
      },
      "application/vnd.ibm.minipay": {
        source: "iana",
        extensions: ["mpy"]
      },
      "application/vnd.ibm.modcap": {
        source: "iana",
        extensions: ["afp", "listafp", "list3820"]
      },
      "application/vnd.ibm.rights-management": {
        source: "iana",
        extensions: ["irm"]
      },
      "application/vnd.ibm.secure-container": {
        source: "iana",
        extensions: ["sc"]
      },
      "application/vnd.iccprofile": {
        source: "iana",
        extensions: ["icc", "icm"]
      },
      "application/vnd.ieee.1905": {
        source: "iana"
      },
      "application/vnd.igloader": {
        source: "iana",
        extensions: ["igl"]
      },
      "application/vnd.imagemeter.folder+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.imagemeter.image+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.immervision-ivp": {
        source: "iana",
        extensions: ["ivp"]
      },
      "application/vnd.immervision-ivu": {
        source: "iana",
        extensions: ["ivu"]
      },
      "application/vnd.ims.imsccv1p1": {
        source: "iana"
      },
      "application/vnd.ims.imsccv1p2": {
        source: "iana"
      },
      "application/vnd.ims.imsccv1p3": {
        source: "iana"
      },
      "application/vnd.ims.lis.v2.result+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolconsumerprofile+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolproxy+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolproxy.id+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolsettings+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolsettings.simple+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.informedcontrol.rms+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.informix-visionary": {
        source: "iana"
      },
      "application/vnd.infotech.project": {
        source: "iana"
      },
      "application/vnd.infotech.project+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.innopath.wamp.notification": {
        source: "iana"
      },
      "application/vnd.insors.igm": {
        source: "iana",
        extensions: ["igm"]
      },
      "application/vnd.intercon.formnet": {
        source: "iana",
        extensions: ["xpw", "xpx"]
      },
      "application/vnd.intergeo": {
        source: "iana",
        extensions: ["i2g"]
      },
      "application/vnd.intertrust.digibox": {
        source: "iana"
      },
      "application/vnd.intertrust.nncp": {
        source: "iana"
      },
      "application/vnd.intu.qbo": {
        source: "iana",
        extensions: ["qbo"]
      },
      "application/vnd.intu.qfx": {
        source: "iana",
        extensions: ["qfx"]
      },
      "application/vnd.iptc.g2.catalogitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.conceptitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.knowledgeitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.newsitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.newsmessage+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.packageitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.planningitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ipunplugged.rcprofile": {
        source: "iana",
        extensions: ["rcprofile"]
      },
      "application/vnd.irepository.package+xml": {
        source: "iana",
        compressible: true,
        extensions: ["irp"]
      },
      "application/vnd.is-xpr": {
        source: "iana",
        extensions: ["xpr"]
      },
      "application/vnd.isac.fcs": {
        source: "iana",
        extensions: ["fcs"]
      },
      "application/vnd.iso11783-10+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.jam": {
        source: "iana",
        extensions: ["jam"]
      },
      "application/vnd.japannet-directory-service": {
        source: "iana"
      },
      "application/vnd.japannet-jpnstore-wakeup": {
        source: "iana"
      },
      "application/vnd.japannet-payment-wakeup": {
        source: "iana"
      },
      "application/vnd.japannet-registration": {
        source: "iana"
      },
      "application/vnd.japannet-registration-wakeup": {
        source: "iana"
      },
      "application/vnd.japannet-setstore-wakeup": {
        source: "iana"
      },
      "application/vnd.japannet-verification": {
        source: "iana"
      },
      "application/vnd.japannet-verification-wakeup": {
        source: "iana"
      },
      "application/vnd.jcp.javame.midlet-rms": {
        source: "iana",
        extensions: ["rms"]
      },
      "application/vnd.jisp": {
        source: "iana",
        extensions: ["jisp"]
      },
      "application/vnd.joost.joda-archive": {
        source: "iana",
        extensions: ["joda"]
      },
      "application/vnd.jsk.isdn-ngn": {
        source: "iana"
      },
      "application/vnd.kahootz": {
        source: "iana",
        extensions: ["ktz", "ktr"]
      },
      "application/vnd.kde.karbon": {
        source: "iana",
        extensions: ["karbon"]
      },
      "application/vnd.kde.kchart": {
        source: "iana",
        extensions: ["chrt"]
      },
      "application/vnd.kde.kformula": {
        source: "iana",
        extensions: ["kfo"]
      },
      "application/vnd.kde.kivio": {
        source: "iana",
        extensions: ["flw"]
      },
      "application/vnd.kde.kontour": {
        source: "iana",
        extensions: ["kon"]
      },
      "application/vnd.kde.kpresenter": {
        source: "iana",
        extensions: ["kpr", "kpt"]
      },
      "application/vnd.kde.kspread": {
        source: "iana",
        extensions: ["ksp"]
      },
      "application/vnd.kde.kword": {
        source: "iana",
        extensions: ["kwd", "kwt"]
      },
      "application/vnd.kenameaapp": {
        source: "iana",
        extensions: ["htke"]
      },
      "application/vnd.kidspiration": {
        source: "iana",
        extensions: ["kia"]
      },
      "application/vnd.kinar": {
        source: "iana",
        extensions: ["kne", "knp"]
      },
      "application/vnd.koan": {
        source: "iana",
        extensions: ["skp", "skd", "skt", "skm"]
      },
      "application/vnd.kodak-descriptor": {
        source: "iana",
        extensions: ["sse"]
      },
      "application/vnd.las": {
        source: "iana"
      },
      "application/vnd.las.las+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.las.las+xml": {
        source: "iana",
        compressible: true,
        extensions: ["lasxml"]
      },
      "application/vnd.laszip": {
        source: "iana"
      },
      "application/vnd.leap+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.liberty-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.llamagraphics.life-balance.desktop": {
        source: "iana",
        extensions: ["lbd"]
      },
      "application/vnd.llamagraphics.life-balance.exchange+xml": {
        source: "iana",
        compressible: true,
        extensions: ["lbe"]
      },
      "application/vnd.logipipe.circuit+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.loom": {
        source: "iana"
      },
      "application/vnd.lotus-1-2-3": {
        source: "iana",
        extensions: ["123"]
      },
      "application/vnd.lotus-approach": {
        source: "iana",
        extensions: ["apr"]
      },
      "application/vnd.lotus-freelance": {
        source: "iana",
        extensions: ["pre"]
      },
      "application/vnd.lotus-notes": {
        source: "iana",
        extensions: ["nsf"]
      },
      "application/vnd.lotus-organizer": {
        source: "iana",
        extensions: ["org"]
      },
      "application/vnd.lotus-screencam": {
        source: "iana",
        extensions: ["scm"]
      },
      "application/vnd.lotus-wordpro": {
        source: "iana",
        extensions: ["lwp"]
      },
      "application/vnd.macports.portpkg": {
        source: "iana",
        extensions: ["portpkg"]
      },
      "application/vnd.mapbox-vector-tile": {
        source: "iana",
        extensions: ["mvt"]
      },
      "application/vnd.marlin.drm.actiontoken+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.marlin.drm.conftoken+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.marlin.drm.license+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.marlin.drm.mdcf": {
        source: "iana"
      },
      "application/vnd.mason+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.maxar.archive.3tz+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.maxmind.maxmind-db": {
        source: "iana"
      },
      "application/vnd.mcd": {
        source: "iana",
        extensions: ["mcd"]
      },
      "application/vnd.medcalcdata": {
        source: "iana",
        extensions: ["mc1"]
      },
      "application/vnd.mediastation.cdkey": {
        source: "iana",
        extensions: ["cdkey"]
      },
      "application/vnd.meridian-slingshot": {
        source: "iana"
      },
      "application/vnd.mfer": {
        source: "iana",
        extensions: ["mwf"]
      },
      "application/vnd.mfmp": {
        source: "iana",
        extensions: ["mfm"]
      },
      "application/vnd.micro+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.micrografx.flo": {
        source: "iana",
        extensions: ["flo"]
      },
      "application/vnd.micrografx.igx": {
        source: "iana",
        extensions: ["igx"]
      },
      "application/vnd.microsoft.portable-executable": {
        source: "iana"
      },
      "application/vnd.microsoft.windows.thumbnail-cache": {
        source: "iana"
      },
      "application/vnd.miele+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.mif": {
        source: "iana",
        extensions: ["mif"]
      },
      "application/vnd.minisoft-hp3000-save": {
        source: "iana"
      },
      "application/vnd.mitsubishi.misty-guard.trustweb": {
        source: "iana"
      },
      "application/vnd.mobius.daf": {
        source: "iana",
        extensions: ["daf"]
      },
      "application/vnd.mobius.dis": {
        source: "iana",
        extensions: ["dis"]
      },
      "application/vnd.mobius.mbk": {
        source: "iana",
        extensions: ["mbk"]
      },
      "application/vnd.mobius.mqy": {
        source: "iana",
        extensions: ["mqy"]
      },
      "application/vnd.mobius.msl": {
        source: "iana",
        extensions: ["msl"]
      },
      "application/vnd.mobius.plc": {
        source: "iana",
        extensions: ["plc"]
      },
      "application/vnd.mobius.txf": {
        source: "iana",
        extensions: ["txf"]
      },
      "application/vnd.mophun.application": {
        source: "iana",
        extensions: ["mpn"]
      },
      "application/vnd.mophun.certificate": {
        source: "iana",
        extensions: ["mpc"]
      },
      "application/vnd.motorola.flexsuite": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.adsi": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.fis": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.gotap": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.kmr": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.ttc": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.wem": {
        source: "iana"
      },
      "application/vnd.motorola.iprm": {
        source: "iana"
      },
      "application/vnd.mozilla.xul+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xul"]
      },
      "application/vnd.ms-3mfdocument": {
        source: "iana"
      },
      "application/vnd.ms-artgalry": {
        source: "iana",
        extensions: ["cil"]
      },
      "application/vnd.ms-asf": {
        source: "iana"
      },
      "application/vnd.ms-cab-compressed": {
        source: "iana",
        extensions: ["cab"]
      },
      "application/vnd.ms-color.iccprofile": {
        source: "apache"
      },
      "application/vnd.ms-excel": {
        source: "iana",
        compressible: false,
        extensions: ["xls", "xlm", "xla", "xlc", "xlt", "xlw"]
      },
      "application/vnd.ms-excel.addin.macroenabled.12": {
        source: "iana",
        extensions: ["xlam"]
      },
      "application/vnd.ms-excel.sheet.binary.macroenabled.12": {
        source: "iana",
        extensions: ["xlsb"]
      },
      "application/vnd.ms-excel.sheet.macroenabled.12": {
        source: "iana",
        extensions: ["xlsm"]
      },
      "application/vnd.ms-excel.template.macroenabled.12": {
        source: "iana",
        extensions: ["xltm"]
      },
      "application/vnd.ms-fontobject": {
        source: "iana",
        compressible: true,
        extensions: ["eot"]
      },
      "application/vnd.ms-htmlhelp": {
        source: "iana",
        extensions: ["chm"]
      },
      "application/vnd.ms-ims": {
        source: "iana",
        extensions: ["ims"]
      },
      "application/vnd.ms-lrm": {
        source: "iana",
        extensions: ["lrm"]
      },
      "application/vnd.ms-office.activex+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ms-officetheme": {
        source: "iana",
        extensions: ["thmx"]
      },
      "application/vnd.ms-opentype": {
        source: "apache",
        compressible: true
      },
      "application/vnd.ms-outlook": {
        compressible: false,
        extensions: ["msg"]
      },
      "application/vnd.ms-package.obfuscated-opentype": {
        source: "apache"
      },
      "application/vnd.ms-pki.seccat": {
        source: "apache",
        extensions: ["cat"]
      },
      "application/vnd.ms-pki.stl": {
        source: "apache",
        extensions: ["stl"]
      },
      "application/vnd.ms-playready.initiator+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ms-powerpoint": {
        source: "iana",
        compressible: false,
        extensions: ["ppt", "pps", "pot"]
      },
      "application/vnd.ms-powerpoint.addin.macroenabled.12": {
        source: "iana",
        extensions: ["ppam"]
      },
      "application/vnd.ms-powerpoint.presentation.macroenabled.12": {
        source: "iana",
        extensions: ["pptm"]
      },
      "application/vnd.ms-powerpoint.slide.macroenabled.12": {
        source: "iana",
        extensions: ["sldm"]
      },
      "application/vnd.ms-powerpoint.slideshow.macroenabled.12": {
        source: "iana",
        extensions: ["ppsm"]
      },
      "application/vnd.ms-powerpoint.template.macroenabled.12": {
        source: "iana",
        extensions: ["potm"]
      },
      "application/vnd.ms-printdevicecapabilities+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ms-printing.printticket+xml": {
        source: "apache",
        compressible: true
      },
      "application/vnd.ms-printschematicket+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ms-project": {
        source: "iana",
        extensions: ["mpp", "mpt"]
      },
      "application/vnd.ms-tnef": {
        source: "iana"
      },
      "application/vnd.ms-windows.devicepairing": {
        source: "iana"
      },
      "application/vnd.ms-windows.nwprinting.oob": {
        source: "iana"
      },
      "application/vnd.ms-windows.printerpairing": {
        source: "iana"
      },
      "application/vnd.ms-windows.wsd.oob": {
        source: "iana"
      },
      "application/vnd.ms-wmdrm.lic-chlg-req": {
        source: "iana"
      },
      "application/vnd.ms-wmdrm.lic-resp": {
        source: "iana"
      },
      "application/vnd.ms-wmdrm.meter-chlg-req": {
        source: "iana"
      },
      "application/vnd.ms-wmdrm.meter-resp": {
        source: "iana"
      },
      "application/vnd.ms-word.document.macroenabled.12": {
        source: "iana",
        extensions: ["docm"]
      },
      "application/vnd.ms-word.template.macroenabled.12": {
        source: "iana",
        extensions: ["dotm"]
      },
      "application/vnd.ms-works": {
        source: "iana",
        extensions: ["wps", "wks", "wcm", "wdb"]
      },
      "application/vnd.ms-wpl": {
        source: "iana",
        extensions: ["wpl"]
      },
      "application/vnd.ms-xpsdocument": {
        source: "iana",
        compressible: false,
        extensions: ["xps"]
      },
      "application/vnd.msa-disk-image": {
        source: "iana"
      },
      "application/vnd.mseq": {
        source: "iana",
        extensions: ["mseq"]
      },
      "application/vnd.msign": {
        source: "iana"
      },
      "application/vnd.multiad.creator": {
        source: "iana"
      },
      "application/vnd.multiad.creator.cif": {
        source: "iana"
      },
      "application/vnd.music-niff": {
        source: "iana"
      },
      "application/vnd.musician": {
        source: "iana",
        extensions: ["mus"]
      },
      "application/vnd.muvee.style": {
        source: "iana",
        extensions: ["msty"]
      },
      "application/vnd.mynfc": {
        source: "iana",
        extensions: ["taglet"]
      },
      "application/vnd.nacamar.ybrid+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ncd.control": {
        source: "iana"
      },
      "application/vnd.ncd.reference": {
        source: "iana"
      },
      "application/vnd.nearst.inv+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nebumind.line": {
        source: "iana"
      },
      "application/vnd.nervana": {
        source: "iana"
      },
      "application/vnd.netfpx": {
        source: "iana"
      },
      "application/vnd.neurolanguage.nlu": {
        source: "iana",
        extensions: ["nlu"]
      },
      "application/vnd.nimn": {
        source: "iana"
      },
      "application/vnd.nintendo.nitro.rom": {
        source: "iana"
      },
      "application/vnd.nintendo.snes.rom": {
        source: "iana"
      },
      "application/vnd.nitf": {
        source: "iana",
        extensions: ["ntf", "nitf"]
      },
      "application/vnd.noblenet-directory": {
        source: "iana",
        extensions: ["nnd"]
      },
      "application/vnd.noblenet-sealer": {
        source: "iana",
        extensions: ["nns"]
      },
      "application/vnd.noblenet-web": {
        source: "iana",
        extensions: ["nnw"]
      },
      "application/vnd.nokia.catalogs": {
        source: "iana"
      },
      "application/vnd.nokia.conml+wbxml": {
        source: "iana"
      },
      "application/vnd.nokia.conml+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.iptv.config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.isds-radio-presets": {
        source: "iana"
      },
      "application/vnd.nokia.landmark+wbxml": {
        source: "iana"
      },
      "application/vnd.nokia.landmark+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.landmarkcollection+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.n-gage.ac+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ac"]
      },
      "application/vnd.nokia.n-gage.data": {
        source: "iana",
        extensions: ["ngdat"]
      },
      "application/vnd.nokia.n-gage.symbian.install": {
        source: "iana",
        extensions: ["n-gage"]
      },
      "application/vnd.nokia.ncd": {
        source: "iana"
      },
      "application/vnd.nokia.pcd+wbxml": {
        source: "iana"
      },
      "application/vnd.nokia.pcd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.radio-preset": {
        source: "iana",
        extensions: ["rpst"]
      },
      "application/vnd.nokia.radio-presets": {
        source: "iana",
        extensions: ["rpss"]
      },
      "application/vnd.novadigm.edm": {
        source: "iana",
        extensions: ["edm"]
      },
      "application/vnd.novadigm.edx": {
        source: "iana",
        extensions: ["edx"]
      },
      "application/vnd.novadigm.ext": {
        source: "iana",
        extensions: ["ext"]
      },
      "application/vnd.ntt-local.content-share": {
        source: "iana"
      },
      "application/vnd.ntt-local.file-transfer": {
        source: "iana"
      },
      "application/vnd.ntt-local.ogw_remote-access": {
        source: "iana"
      },
      "application/vnd.ntt-local.sip-ta_remote": {
        source: "iana"
      },
      "application/vnd.ntt-local.sip-ta_tcp_stream": {
        source: "iana"
      },
      "application/vnd.oasis.opendocument.chart": {
        source: "iana",
        extensions: ["odc"]
      },
      "application/vnd.oasis.opendocument.chart-template": {
        source: "iana",
        extensions: ["otc"]
      },
      "application/vnd.oasis.opendocument.database": {
        source: "iana",
        extensions: ["odb"]
      },
      "application/vnd.oasis.opendocument.formula": {
        source: "iana",
        extensions: ["odf"]
      },
      "application/vnd.oasis.opendocument.formula-template": {
        source: "iana",
        extensions: ["odft"]
      },
      "application/vnd.oasis.opendocument.graphics": {
        source: "iana",
        compressible: false,
        extensions: ["odg"]
      },
      "application/vnd.oasis.opendocument.graphics-template": {
        source: "iana",
        extensions: ["otg"]
      },
      "application/vnd.oasis.opendocument.image": {
        source: "iana",
        extensions: ["odi"]
      },
      "application/vnd.oasis.opendocument.image-template": {
        source: "iana",
        extensions: ["oti"]
      },
      "application/vnd.oasis.opendocument.presentation": {
        source: "iana",
        compressible: false,
        extensions: ["odp"]
      },
      "application/vnd.oasis.opendocument.presentation-template": {
        source: "iana",
        extensions: ["otp"]
      },
      "application/vnd.oasis.opendocument.spreadsheet": {
        source: "iana",
        compressible: false,
        extensions: ["ods"]
      },
      "application/vnd.oasis.opendocument.spreadsheet-template": {
        source: "iana",
        extensions: ["ots"]
      },
      "application/vnd.oasis.opendocument.text": {
        source: "iana",
        compressible: false,
        extensions: ["odt"]
      },
      "application/vnd.oasis.opendocument.text-master": {
        source: "iana",
        extensions: ["odm"]
      },
      "application/vnd.oasis.opendocument.text-template": {
        source: "iana",
        extensions: ["ott"]
      },
      "application/vnd.oasis.opendocument.text-web": {
        source: "iana",
        extensions: ["oth"]
      },
      "application/vnd.obn": {
        source: "iana"
      },
      "application/vnd.ocf+cbor": {
        source: "iana"
      },
      "application/vnd.oci.image.manifest.v1+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oftn.l10n+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.contentaccessdownload+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.contentaccessstreaming+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.cspg-hexbinary": {
        source: "iana"
      },
      "application/vnd.oipf.dae.svg+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.dae.xhtml+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.mippvcontrolmessage+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.pae.gem": {
        source: "iana"
      },
      "application/vnd.oipf.spdiscovery+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.spdlist+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.ueprofile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.userprofile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.olpc-sugar": {
        source: "iana",
        extensions: ["xo"]
      },
      "application/vnd.oma-scws-config": {
        source: "iana"
      },
      "application/vnd.oma-scws-http-request": {
        source: "iana"
      },
      "application/vnd.oma-scws-http-response": {
        source: "iana"
      },
      "application/vnd.oma.bcast.associated-procedure-parameter+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.drm-trigger+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.imd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.ltkm": {
        source: "iana"
      },
      "application/vnd.oma.bcast.notification+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.provisioningtrigger": {
        source: "iana"
      },
      "application/vnd.oma.bcast.sgboot": {
        source: "iana"
      },
      "application/vnd.oma.bcast.sgdd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.sgdu": {
        source: "iana"
      },
      "application/vnd.oma.bcast.simple-symbol-container": {
        source: "iana"
      },
      "application/vnd.oma.bcast.smartcard-trigger+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.sprov+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.stkm": {
        source: "iana"
      },
      "application/vnd.oma.cab-address-book+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.cab-feature-handler+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.cab-pcc+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.cab-subs-invite+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.cab-user-prefs+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.dcd": {
        source: "iana"
      },
      "application/vnd.oma.dcdc": {
        source: "iana"
      },
      "application/vnd.oma.dd2+xml": {
        source: "iana",
        compressible: true,
        extensions: ["dd2"]
      },
      "application/vnd.oma.drm.risd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.group-usage-list+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.lwm2m+cbor": {
        source: "iana"
      },
      "application/vnd.oma.lwm2m+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.lwm2m+tlv": {
        source: "iana"
      },
      "application/vnd.oma.pal+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.detailed-progress-report+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.final-report+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.groups+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.invocation-descriptor+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.optimized-progress-report+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.push": {
        source: "iana"
      },
      "application/vnd.oma.scidm.messages+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.xcap-directory+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.omads-email+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.omads-file+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.omads-folder+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.omaloc-supl-init": {
        source: "iana"
      },
      "application/vnd.onepager": {
        source: "iana"
      },
      "application/vnd.onepagertamp": {
        source: "iana"
      },
      "application/vnd.onepagertamx": {
        source: "iana"
      },
      "application/vnd.onepagertat": {
        source: "iana"
      },
      "application/vnd.onepagertatp": {
        source: "iana"
      },
      "application/vnd.onepagertatx": {
        source: "iana"
      },
      "application/vnd.openblox.game+xml": {
        source: "iana",
        compressible: true,
        extensions: ["obgx"]
      },
      "application/vnd.openblox.game-binary": {
        source: "iana"
      },
      "application/vnd.openeye.oeb": {
        source: "iana"
      },
      "application/vnd.openofficeorg.extension": {
        source: "apache",
        extensions: ["oxt"]
      },
      "application/vnd.openstreetmap.data+xml": {
        source: "iana",
        compressible: true,
        extensions: ["osm"]
      },
      "application/vnd.opentimestamps.ots": {
        source: "iana"
      },
      "application/vnd.openxmlformats-officedocument.custom-properties+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.customxmlproperties+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawing+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.chart+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.extended-properties+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.comments+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
        source: "iana",
        compressible: false,
        extensions: ["pptx"]
      },
      "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.presprops+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slide": {
        source: "iana",
        extensions: ["sldx"]
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slide+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slideshow": {
        source: "iana",
        extensions: ["ppsx"]
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.tags+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.template": {
        source: "iana",
        extensions: ["potx"]
      },
      "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
        source: "iana",
        compressible: false,
        extensions: ["xlsx"]
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.template": {
        source: "iana",
        extensions: ["xltx"]
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.theme+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.themeoverride+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.vmldrawing": {
        source: "iana"
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
        source: "iana",
        compressible: false,
        extensions: ["docx"]
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.template": {
        source: "iana",
        extensions: ["dotx"]
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-package.core-properties+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-package.relationships+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oracle.resource+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.orange.indata": {
        source: "iana"
      },
      "application/vnd.osa.netdeploy": {
        source: "iana"
      },
      "application/vnd.osgeo.mapguide.package": {
        source: "iana",
        extensions: ["mgp"]
      },
      "application/vnd.osgi.bundle": {
        source: "iana"
      },
      "application/vnd.osgi.dp": {
        source: "iana",
        extensions: ["dp"]
      },
      "application/vnd.osgi.subsystem": {
        source: "iana",
        extensions: ["esa"]
      },
      "application/vnd.otps.ct-kip+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oxli.countgraph": {
        source: "iana"
      },
      "application/vnd.pagerduty+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.palm": {
        source: "iana",
        extensions: ["pdb", "pqa", "oprc"]
      },
      "application/vnd.panoply": {
        source: "iana"
      },
      "application/vnd.paos.xml": {
        source: "iana"
      },
      "application/vnd.patentdive": {
        source: "iana"
      },
      "application/vnd.patientecommsdoc": {
        source: "iana"
      },
      "application/vnd.pawaafile": {
        source: "iana",
        extensions: ["paw"]
      },
      "application/vnd.pcos": {
        source: "iana"
      },
      "application/vnd.pg.format": {
        source: "iana",
        extensions: ["str"]
      },
      "application/vnd.pg.osasli": {
        source: "iana",
        extensions: ["ei6"]
      },
      "application/vnd.piaccess.application-licence": {
        source: "iana"
      },
      "application/vnd.picsel": {
        source: "iana",
        extensions: ["efif"]
      },
      "application/vnd.pmi.widget": {
        source: "iana",
        extensions: ["wg"]
      },
      "application/vnd.poc.group-advertisement+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.pocketlearn": {
        source: "iana",
        extensions: ["plf"]
      },
      "application/vnd.powerbuilder6": {
        source: "iana",
        extensions: ["pbd"]
      },
      "application/vnd.powerbuilder6-s": {
        source: "iana"
      },
      "application/vnd.powerbuilder7": {
        source: "iana"
      },
      "application/vnd.powerbuilder7-s": {
        source: "iana"
      },
      "application/vnd.powerbuilder75": {
        source: "iana"
      },
      "application/vnd.powerbuilder75-s": {
        source: "iana"
      },
      "application/vnd.preminet": {
        source: "iana"
      },
      "application/vnd.previewsystems.box": {
        source: "iana",
        extensions: ["box"]
      },
      "application/vnd.proteus.magazine": {
        source: "iana",
        extensions: ["mgz"]
      },
      "application/vnd.psfs": {
        source: "iana"
      },
      "application/vnd.publishare-delta-tree": {
        source: "iana",
        extensions: ["qps"]
      },
      "application/vnd.pvi.ptid1": {
        source: "iana",
        extensions: ["ptid"]
      },
      "application/vnd.pwg-multiplexed": {
        source: "iana"
      },
      "application/vnd.pwg-xhtml-print+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.qualcomm.brew-app-res": {
        source: "iana"
      },
      "application/vnd.quarantainenet": {
        source: "iana"
      },
      "application/vnd.quark.quarkxpress": {
        source: "iana",
        extensions: ["qxd", "qxt", "qwd", "qwt", "qxl", "qxb"]
      },
      "application/vnd.quobject-quoxdocument": {
        source: "iana"
      },
      "application/vnd.radisys.moml+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit-conf+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit-conn+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit-dialog+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit-stream+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-conf+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-base+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-fax-detect+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-fax-sendrecv+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-group+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-speech+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-transform+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.rainstor.data": {
        source: "iana"
      },
      "application/vnd.rapid": {
        source: "iana"
      },
      "application/vnd.rar": {
        source: "iana",
        extensions: ["rar"]
      },
      "application/vnd.realvnc.bed": {
        source: "iana",
        extensions: ["bed"]
      },
      "application/vnd.recordare.musicxml": {
        source: "iana",
        extensions: ["mxl"]
      },
      "application/vnd.recordare.musicxml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["musicxml"]
      },
      "application/vnd.renlearn.rlprint": {
        source: "iana"
      },
      "application/vnd.resilient.logic": {
        source: "iana"
      },
      "application/vnd.restful+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.rig.cryptonote": {
        source: "iana",
        extensions: ["cryptonote"]
      },
      "application/vnd.rim.cod": {
        source: "apache",
        extensions: ["cod"]
      },
      "application/vnd.rn-realmedia": {
        source: "apache",
        extensions: ["rm"]
      },
      "application/vnd.rn-realmedia-vbr": {
        source: "apache",
        extensions: ["rmvb"]
      },
      "application/vnd.route66.link66+xml": {
        source: "iana",
        compressible: true,
        extensions: ["link66"]
      },
      "application/vnd.rs-274x": {
        source: "iana"
      },
      "application/vnd.ruckus.download": {
        source: "iana"
      },
      "application/vnd.s3sms": {
        source: "iana"
      },
      "application/vnd.sailingtracker.track": {
        source: "iana",
        extensions: ["st"]
      },
      "application/vnd.sar": {
        source: "iana"
      },
      "application/vnd.sbm.cid": {
        source: "iana"
      },
      "application/vnd.sbm.mid2": {
        source: "iana"
      },
      "application/vnd.scribus": {
        source: "iana"
      },
      "application/vnd.sealed.3df": {
        source: "iana"
      },
      "application/vnd.sealed.csf": {
        source: "iana"
      },
      "application/vnd.sealed.doc": {
        source: "iana"
      },
      "application/vnd.sealed.eml": {
        source: "iana"
      },
      "application/vnd.sealed.mht": {
        source: "iana"
      },
      "application/vnd.sealed.net": {
        source: "iana"
      },
      "application/vnd.sealed.ppt": {
        source: "iana"
      },
      "application/vnd.sealed.tiff": {
        source: "iana"
      },
      "application/vnd.sealed.xls": {
        source: "iana"
      },
      "application/vnd.sealedmedia.softseal.html": {
        source: "iana"
      },
      "application/vnd.sealedmedia.softseal.pdf": {
        source: "iana"
      },
      "application/vnd.seemail": {
        source: "iana",
        extensions: ["see"]
      },
      "application/vnd.seis+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.sema": {
        source: "iana",
        extensions: ["sema"]
      },
      "application/vnd.semd": {
        source: "iana",
        extensions: ["semd"]
      },
      "application/vnd.semf": {
        source: "iana",
        extensions: ["semf"]
      },
      "application/vnd.shade-save-file": {
        source: "iana"
      },
      "application/vnd.shana.informed.formdata": {
        source: "iana",
        extensions: ["ifm"]
      },
      "application/vnd.shana.informed.formtemplate": {
        source: "iana",
        extensions: ["itp"]
      },
      "application/vnd.shana.informed.interchange": {
        source: "iana",
        extensions: ["iif"]
      },
      "application/vnd.shana.informed.package": {
        source: "iana",
        extensions: ["ipk"]
      },
      "application/vnd.shootproof+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.shopkick+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.shp": {
        source: "iana"
      },
      "application/vnd.shx": {
        source: "iana"
      },
      "application/vnd.sigrok.session": {
        source: "iana"
      },
      "application/vnd.simtech-mindmapper": {
        source: "iana",
        extensions: ["twd", "twds"]
      },
      "application/vnd.siren+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.smaf": {
        source: "iana",
        extensions: ["mmf"]
      },
      "application/vnd.smart.notebook": {
        source: "iana"
      },
      "application/vnd.smart.teacher": {
        source: "iana",
        extensions: ["teacher"]
      },
      "application/vnd.snesdev-page-table": {
        source: "iana"
      },
      "application/vnd.software602.filler.form+xml": {
        source: "iana",
        compressible: true,
        extensions: ["fo"]
      },
      "application/vnd.software602.filler.form-xml-zip": {
        source: "iana"
      },
      "application/vnd.solent.sdkm+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sdkm", "sdkd"]
      },
      "application/vnd.spotfire.dxp": {
        source: "iana",
        extensions: ["dxp"]
      },
      "application/vnd.spotfire.sfs": {
        source: "iana",
        extensions: ["sfs"]
      },
      "application/vnd.sqlite3": {
        source: "iana"
      },
      "application/vnd.sss-cod": {
        source: "iana"
      },
      "application/vnd.sss-dtf": {
        source: "iana"
      },
      "application/vnd.sss-ntf": {
        source: "iana"
      },
      "application/vnd.stardivision.calc": {
        source: "apache",
        extensions: ["sdc"]
      },
      "application/vnd.stardivision.draw": {
        source: "apache",
        extensions: ["sda"]
      },
      "application/vnd.stardivision.impress": {
        source: "apache",
        extensions: ["sdd"]
      },
      "application/vnd.stardivision.math": {
        source: "apache",
        extensions: ["smf"]
      },
      "application/vnd.stardivision.writer": {
        source: "apache",
        extensions: ["sdw", "vor"]
      },
      "application/vnd.stardivision.writer-global": {
        source: "apache",
        extensions: ["sgl"]
      },
      "application/vnd.stepmania.package": {
        source: "iana",
        extensions: ["smzip"]
      },
      "application/vnd.stepmania.stepchart": {
        source: "iana",
        extensions: ["sm"]
      },
      "application/vnd.street-stream": {
        source: "iana"
      },
      "application/vnd.sun.wadl+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wadl"]
      },
      "application/vnd.sun.xml.calc": {
        source: "apache",
        extensions: ["sxc"]
      },
      "application/vnd.sun.xml.calc.template": {
        source: "apache",
        extensions: ["stc"]
      },
      "application/vnd.sun.xml.draw": {
        source: "apache",
        extensions: ["sxd"]
      },
      "application/vnd.sun.xml.draw.template": {
        source: "apache",
        extensions: ["std"]
      },
      "application/vnd.sun.xml.impress": {
        source: "apache",
        extensions: ["sxi"]
      },
      "application/vnd.sun.xml.impress.template": {
        source: "apache",
        extensions: ["sti"]
      },
      "application/vnd.sun.xml.math": {
        source: "apache",
        extensions: ["sxm"]
      },
      "application/vnd.sun.xml.writer": {
        source: "apache",
        extensions: ["sxw"]
      },
      "application/vnd.sun.xml.writer.global": {
        source: "apache",
        extensions: ["sxg"]
      },
      "application/vnd.sun.xml.writer.template": {
        source: "apache",
        extensions: ["stw"]
      },
      "application/vnd.sus-calendar": {
        source: "iana",
        extensions: ["sus", "susp"]
      },
      "application/vnd.svd": {
        source: "iana",
        extensions: ["svd"]
      },
      "application/vnd.swiftview-ics": {
        source: "iana"
      },
      "application/vnd.sycle+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.syft+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.symbian.install": {
        source: "apache",
        extensions: ["sis", "sisx"]
      },
      "application/vnd.syncml+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["xsm"]
      },
      "application/vnd.syncml.dm+wbxml": {
        source: "iana",
        charset: "UTF-8",
        extensions: ["bdm"]
      },
      "application/vnd.syncml.dm+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["xdm"]
      },
      "application/vnd.syncml.dm.notification": {
        source: "iana"
      },
      "application/vnd.syncml.dmddf+wbxml": {
        source: "iana"
      },
      "application/vnd.syncml.dmddf+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["ddf"]
      },
      "application/vnd.syncml.dmtnds+wbxml": {
        source: "iana"
      },
      "application/vnd.syncml.dmtnds+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.syncml.ds.notification": {
        source: "iana"
      },
      "application/vnd.tableschema+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.tao.intent-module-archive": {
        source: "iana",
        extensions: ["tao"]
      },
      "application/vnd.tcpdump.pcap": {
        source: "iana",
        extensions: ["pcap", "cap", "dmp"]
      },
      "application/vnd.think-cell.ppttc+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.tmd.mediaflex.api+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.tml": {
        source: "iana"
      },
      "application/vnd.tmobile-livetv": {
        source: "iana",
        extensions: ["tmo"]
      },
      "application/vnd.tri.onesource": {
        source: "iana"
      },
      "application/vnd.trid.tpt": {
        source: "iana",
        extensions: ["tpt"]
      },
      "application/vnd.triscape.mxs": {
        source: "iana",
        extensions: ["mxs"]
      },
      "application/vnd.trueapp": {
        source: "iana",
        extensions: ["tra"]
      },
      "application/vnd.truedoc": {
        source: "iana"
      },
      "application/vnd.ubisoft.webplayer": {
        source: "iana"
      },
      "application/vnd.ufdl": {
        source: "iana",
        extensions: ["ufd", "ufdl"]
      },
      "application/vnd.uiq.theme": {
        source: "iana",
        extensions: ["utz"]
      },
      "application/vnd.umajin": {
        source: "iana",
        extensions: ["umj"]
      },
      "application/vnd.unity": {
        source: "iana",
        extensions: ["unityweb"]
      },
      "application/vnd.uoml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["uoml"]
      },
      "application/vnd.uplanet.alert": {
        source: "iana"
      },
      "application/vnd.uplanet.alert-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.bearer-choice": {
        source: "iana"
      },
      "application/vnd.uplanet.bearer-choice-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.cacheop": {
        source: "iana"
      },
      "application/vnd.uplanet.cacheop-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.channel": {
        source: "iana"
      },
      "application/vnd.uplanet.channel-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.list": {
        source: "iana"
      },
      "application/vnd.uplanet.list-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.listcmd": {
        source: "iana"
      },
      "application/vnd.uplanet.listcmd-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.signal": {
        source: "iana"
      },
      "application/vnd.uri-map": {
        source: "iana"
      },
      "application/vnd.valve.source.material": {
        source: "iana"
      },
      "application/vnd.vcx": {
        source: "iana",
        extensions: ["vcx"]
      },
      "application/vnd.vd-study": {
        source: "iana"
      },
      "application/vnd.vectorworks": {
        source: "iana"
      },
      "application/vnd.vel+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.verimatrix.vcas": {
        source: "iana"
      },
      "application/vnd.veritone.aion+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.veryant.thin": {
        source: "iana"
      },
      "application/vnd.ves.encrypted": {
        source: "iana"
      },
      "application/vnd.vidsoft.vidconference": {
        source: "iana"
      },
      "application/vnd.visio": {
        source: "iana",
        extensions: ["vsd", "vst", "vss", "vsw"]
      },
      "application/vnd.visionary": {
        source: "iana",
        extensions: ["vis"]
      },
      "application/vnd.vividence.scriptfile": {
        source: "iana"
      },
      "application/vnd.vsf": {
        source: "iana",
        extensions: ["vsf"]
      },
      "application/vnd.wap.sic": {
        source: "iana"
      },
      "application/vnd.wap.slc": {
        source: "iana"
      },
      "application/vnd.wap.wbxml": {
        source: "iana",
        charset: "UTF-8",
        extensions: ["wbxml"]
      },
      "application/vnd.wap.wmlc": {
        source: "iana",
        extensions: ["wmlc"]
      },
      "application/vnd.wap.wmlscriptc": {
        source: "iana",
        extensions: ["wmlsc"]
      },
      "application/vnd.webturbo": {
        source: "iana",
        extensions: ["wtb"]
      },
      "application/vnd.wfa.dpp": {
        source: "iana"
      },
      "application/vnd.wfa.p2p": {
        source: "iana"
      },
      "application/vnd.wfa.wsc": {
        source: "iana"
      },
      "application/vnd.windows.devicepairing": {
        source: "iana"
      },
      "application/vnd.wmc": {
        source: "iana"
      },
      "application/vnd.wmf.bootstrap": {
        source: "iana"
      },
      "application/vnd.wolfram.mathematica": {
        source: "iana"
      },
      "application/vnd.wolfram.mathematica.package": {
        source: "iana"
      },
      "application/vnd.wolfram.player": {
        source: "iana",
        extensions: ["nbp"]
      },
      "application/vnd.wordperfect": {
        source: "iana",
        extensions: ["wpd"]
      },
      "application/vnd.wqd": {
        source: "iana",
        extensions: ["wqd"]
      },
      "application/vnd.wrq-hp3000-labelled": {
        source: "iana"
      },
      "application/vnd.wt.stf": {
        source: "iana",
        extensions: ["stf"]
      },
      "application/vnd.wv.csp+wbxml": {
        source: "iana"
      },
      "application/vnd.wv.csp+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.wv.ssp+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.xacml+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.xara": {
        source: "iana",
        extensions: ["xar"]
      },
      "application/vnd.xfdl": {
        source: "iana",
        extensions: ["xfdl"]
      },
      "application/vnd.xfdl.webform": {
        source: "iana"
      },
      "application/vnd.xmi+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.xmpie.cpkg": {
        source: "iana"
      },
      "application/vnd.xmpie.dpkg": {
        source: "iana"
      },
      "application/vnd.xmpie.plan": {
        source: "iana"
      },
      "application/vnd.xmpie.ppkg": {
        source: "iana"
      },
      "application/vnd.xmpie.xlim": {
        source: "iana"
      },
      "application/vnd.yamaha.hv-dic": {
        source: "iana",
        extensions: ["hvd"]
      },
      "application/vnd.yamaha.hv-script": {
        source: "iana",
        extensions: ["hvs"]
      },
      "application/vnd.yamaha.hv-voice": {
        source: "iana",
        extensions: ["hvp"]
      },
      "application/vnd.yamaha.openscoreformat": {
        source: "iana",
        extensions: ["osf"]
      },
      "application/vnd.yamaha.openscoreformat.osfpvg+xml": {
        source: "iana",
        compressible: true,
        extensions: ["osfpvg"]
      },
      "application/vnd.yamaha.remote-setup": {
        source: "iana"
      },
      "application/vnd.yamaha.smaf-audio": {
        source: "iana",
        extensions: ["saf"]
      },
      "application/vnd.yamaha.smaf-phrase": {
        source: "iana",
        extensions: ["spf"]
      },
      "application/vnd.yamaha.through-ngn": {
        source: "iana"
      },
      "application/vnd.yamaha.tunnel-udpencap": {
        source: "iana"
      },
      "application/vnd.yaoweme": {
        source: "iana"
      },
      "application/vnd.yellowriver-custom-menu": {
        source: "iana",
        extensions: ["cmp"]
      },
      "application/vnd.youtube.yt": {
        source: "iana"
      },
      "application/vnd.zul": {
        source: "iana",
        extensions: ["zir", "zirz"]
      },
      "application/vnd.zzazz.deck+xml": {
        source: "iana",
        compressible: true,
        extensions: ["zaz"]
      },
      "application/voicexml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["vxml"]
      },
      "application/voucher-cms+json": {
        source: "iana",
        compressible: true
      },
      "application/vq-rtcpxr": {
        source: "iana"
      },
      "application/wasm": {
        source: "iana",
        compressible: true,
        extensions: ["wasm"]
      },
      "application/watcherinfo+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wif"]
      },
      "application/webpush-options+json": {
        source: "iana",
        compressible: true
      },
      "application/whoispp-query": {
        source: "iana"
      },
      "application/whoispp-response": {
        source: "iana"
      },
      "application/widget": {
        source: "iana",
        extensions: ["wgt"]
      },
      "application/winhlp": {
        source: "apache",
        extensions: ["hlp"]
      },
      "application/wita": {
        source: "iana"
      },
      "application/wordperfect5.1": {
        source: "iana"
      },
      "application/wsdl+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wsdl"]
      },
      "application/wspolicy+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wspolicy"]
      },
      "application/x-7z-compressed": {
        source: "apache",
        compressible: false,
        extensions: ["7z"]
      },
      "application/x-abiword": {
        source: "apache",
        extensions: ["abw"]
      },
      "application/x-ace-compressed": {
        source: "apache",
        extensions: ["ace"]
      },
      "application/x-amf": {
        source: "apache"
      },
      "application/x-apple-diskimage": {
        source: "apache",
        extensions: ["dmg"]
      },
      "application/x-arj": {
        compressible: false,
        extensions: ["arj"]
      },
      "application/x-authorware-bin": {
        source: "apache",
        extensions: ["aab", "x32", "u32", "vox"]
      },
      "application/x-authorware-map": {
        source: "apache",
        extensions: ["aam"]
      },
      "application/x-authorware-seg": {
        source: "apache",
        extensions: ["aas"]
      },
      "application/x-bcpio": {
        source: "apache",
        extensions: ["bcpio"]
      },
      "application/x-bdoc": {
        compressible: false,
        extensions: ["bdoc"]
      },
      "application/x-bittorrent": {
        source: "apache",
        extensions: ["torrent"]
      },
      "application/x-blorb": {
        source: "apache",
        extensions: ["blb", "blorb"]
      },
      "application/x-bzip": {
        source: "apache",
        compressible: false,
        extensions: ["bz"]
      },
      "application/x-bzip2": {
        source: "apache",
        compressible: false,
        extensions: ["bz2", "boz"]
      },
      "application/x-cbr": {
        source: "apache",
        extensions: ["cbr", "cba", "cbt", "cbz", "cb7"]
      },
      "application/x-cdlink": {
        source: "apache",
        extensions: ["vcd"]
      },
      "application/x-cfs-compressed": {
        source: "apache",
        extensions: ["cfs"]
      },
      "application/x-chat": {
        source: "apache",
        extensions: ["chat"]
      },
      "application/x-chess-pgn": {
        source: "apache",
        extensions: ["pgn"]
      },
      "application/x-chrome-extension": {
        extensions: ["crx"]
      },
      "application/x-cocoa": {
        source: "nginx",
        extensions: ["cco"]
      },
      "application/x-compress": {
        source: "apache"
      },
      "application/x-conference": {
        source: "apache",
        extensions: ["nsc"]
      },
      "application/x-cpio": {
        source: "apache",
        extensions: ["cpio"]
      },
      "application/x-csh": {
        source: "apache",
        extensions: ["csh"]
      },
      "application/x-deb": {
        compressible: false
      },
      "application/x-debian-package": {
        source: "apache",
        extensions: ["deb", "udeb"]
      },
      "application/x-dgc-compressed": {
        source: "apache",
        extensions: ["dgc"]
      },
      "application/x-director": {
        source: "apache",
        extensions: ["dir", "dcr", "dxr", "cst", "cct", "cxt", "w3d", "fgd", "swa"]
      },
      "application/x-doom": {
        source: "apache",
        extensions: ["wad"]
      },
      "application/x-dtbncx+xml": {
        source: "apache",
        compressible: true,
        extensions: ["ncx"]
      },
      "application/x-dtbook+xml": {
        source: "apache",
        compressible: true,
        extensions: ["dtb"]
      },
      "application/x-dtbresource+xml": {
        source: "apache",
        compressible: true,
        extensions: ["res"]
      },
      "application/x-dvi": {
        source: "apache",
        compressible: false,
        extensions: ["dvi"]
      },
      "application/x-envoy": {
        source: "apache",
        extensions: ["evy"]
      },
      "application/x-eva": {
        source: "apache",
        extensions: ["eva"]
      },
      "application/x-font-bdf": {
        source: "apache",
        extensions: ["bdf"]
      },
      "application/x-font-dos": {
        source: "apache"
      },
      "application/x-font-framemaker": {
        source: "apache"
      },
      "application/x-font-ghostscript": {
        source: "apache",
        extensions: ["gsf"]
      },
      "application/x-font-libgrx": {
        source: "apache"
      },
      "application/x-font-linux-psf": {
        source: "apache",
        extensions: ["psf"]
      },
      "application/x-font-pcf": {
        source: "apache",
        extensions: ["pcf"]
      },
      "application/x-font-snf": {
        source: "apache",
        extensions: ["snf"]
      },
      "application/x-font-speedo": {
        source: "apache"
      },
      "application/x-font-sunos-news": {
        source: "apache"
      },
      "application/x-font-type1": {
        source: "apache",
        extensions: ["pfa", "pfb", "pfm", "afm"]
      },
      "application/x-font-vfont": {
        source: "apache"
      },
      "application/x-freearc": {
        source: "apache",
        extensions: ["arc"]
      },
      "application/x-futuresplash": {
        source: "apache",
        extensions: ["spl"]
      },
      "application/x-gca-compressed": {
        source: "apache",
        extensions: ["gca"]
      },
      "application/x-glulx": {
        source: "apache",
        extensions: ["ulx"]
      },
      "application/x-gnumeric": {
        source: "apache",
        extensions: ["gnumeric"]
      },
      "application/x-gramps-xml": {
        source: "apache",
        extensions: ["gramps"]
      },
      "application/x-gtar": {
        source: "apache",
        extensions: ["gtar"]
      },
      "application/x-gzip": {
        source: "apache"
      },
      "application/x-hdf": {
        source: "apache",
        extensions: ["hdf"]
      },
      "application/x-httpd-php": {
        compressible: true,
        extensions: ["php"]
      },
      "application/x-install-instructions": {
        source: "apache",
        extensions: ["install"]
      },
      "application/x-iso9660-image": {
        source: "apache",
        extensions: ["iso"]
      },
      "application/x-iwork-keynote-sffkey": {
        extensions: ["key"]
      },
      "application/x-iwork-numbers-sffnumbers": {
        extensions: ["numbers"]
      },
      "application/x-iwork-pages-sffpages": {
        extensions: ["pages"]
      },
      "application/x-java-archive-diff": {
        source: "nginx",
        extensions: ["jardiff"]
      },
      "application/x-java-jnlp-file": {
        source: "apache",
        compressible: false,
        extensions: ["jnlp"]
      },
      "application/x-javascript": {
        compressible: true
      },
      "application/x-keepass2": {
        extensions: ["kdbx"]
      },
      "application/x-latex": {
        source: "apache",
        compressible: false,
        extensions: ["latex"]
      },
      "application/x-lua-bytecode": {
        extensions: ["luac"]
      },
      "application/x-lzh-compressed": {
        source: "apache",
        extensions: ["lzh", "lha"]
      },
      "application/x-makeself": {
        source: "nginx",
        extensions: ["run"]
      },
      "application/x-mie": {
        source: "apache",
        extensions: ["mie"]
      },
      "application/x-mobipocket-ebook": {
        source: "apache",
        extensions: ["prc", "mobi"]
      },
      "application/x-mpegurl": {
        compressible: false
      },
      "application/x-ms-application": {
        source: "apache",
        extensions: ["application"]
      },
      "application/x-ms-shortcut": {
        source: "apache",
        extensions: ["lnk"]
      },
      "application/x-ms-wmd": {
        source: "apache",
        extensions: ["wmd"]
      },
      "application/x-ms-wmz": {
        source: "apache",
        extensions: ["wmz"]
      },
      "application/x-ms-xbap": {
        source: "apache",
        extensions: ["xbap"]
      },
      "application/x-msaccess": {
        source: "apache",
        extensions: ["mdb"]
      },
      "application/x-msbinder": {
        source: "apache",
        extensions: ["obd"]
      },
      "application/x-mscardfile": {
        source: "apache",
        extensions: ["crd"]
      },
      "application/x-msclip": {
        source: "apache",
        extensions: ["clp"]
      },
      "application/x-msdos-program": {
        extensions: ["exe"]
      },
      "application/x-msdownload": {
        source: "apache",
        extensions: ["exe", "dll", "com", "bat", "msi"]
      },
      "application/x-msmediaview": {
        source: "apache",
        extensions: ["mvb", "m13", "m14"]
      },
      "application/x-msmetafile": {
        source: "apache",
        extensions: ["wmf", "wmz", "emf", "emz"]
      },
      "application/x-msmoney": {
        source: "apache",
        extensions: ["mny"]
      },
      "application/x-mspublisher": {
        source: "apache",
        extensions: ["pub"]
      },
      "application/x-msschedule": {
        source: "apache",
        extensions: ["scd"]
      },
      "application/x-msterminal": {
        source: "apache",
        extensions: ["trm"]
      },
      "application/x-mswrite": {
        source: "apache",
        extensions: ["wri"]
      },
      "application/x-netcdf": {
        source: "apache",
        extensions: ["nc", "cdf"]
      },
      "application/x-ns-proxy-autoconfig": {
        compressible: true,
        extensions: ["pac"]
      },
      "application/x-nzb": {
        source: "apache",
        extensions: ["nzb"]
      },
      "application/x-perl": {
        source: "nginx",
        extensions: ["pl", "pm"]
      },
      "application/x-pilot": {
        source: "nginx",
        extensions: ["prc", "pdb"]
      },
      "application/x-pkcs12": {
        source: "apache",
        compressible: false,
        extensions: ["p12", "pfx"]
      },
      "application/x-pkcs7-certificates": {
        source: "apache",
        extensions: ["p7b", "spc"]
      },
      "application/x-pkcs7-certreqresp": {
        source: "apache",
        extensions: ["p7r"]
      },
      "application/x-pki-message": {
        source: "iana"
      },
      "application/x-rar-compressed": {
        source: "apache",
        compressible: false,
        extensions: ["rar"]
      },
      "application/x-redhat-package-manager": {
        source: "nginx",
        extensions: ["rpm"]
      },
      "application/x-research-info-systems": {
        source: "apache",
        extensions: ["ris"]
      },
      "application/x-sea": {
        source: "nginx",
        extensions: ["sea"]
      },
      "application/x-sh": {
        source: "apache",
        compressible: true,
        extensions: ["sh"]
      },
      "application/x-shar": {
        source: "apache",
        extensions: ["shar"]
      },
      "application/x-shockwave-flash": {
        source: "apache",
        compressible: false,
        extensions: ["swf"]
      },
      "application/x-silverlight-app": {
        source: "apache",
        extensions: ["xap"]
      },
      "application/x-sql": {
        source: "apache",
        extensions: ["sql"]
      },
      "application/x-stuffit": {
        source: "apache",
        compressible: false,
        extensions: ["sit"]
      },
      "application/x-stuffitx": {
        source: "apache",
        extensions: ["sitx"]
      },
      "application/x-subrip": {
        source: "apache",
        extensions: ["srt"]
      },
      "application/x-sv4cpio": {
        source: "apache",
        extensions: ["sv4cpio"]
      },
      "application/x-sv4crc": {
        source: "apache",
        extensions: ["sv4crc"]
      },
      "application/x-t3vm-image": {
        source: "apache",
        extensions: ["t3"]
      },
      "application/x-tads": {
        source: "apache",
        extensions: ["gam"]
      },
      "application/x-tar": {
        source: "apache",
        compressible: true,
        extensions: ["tar"]
      },
      "application/x-tcl": {
        source: "apache",
        extensions: ["tcl", "tk"]
      },
      "application/x-tex": {
        source: "apache",
        extensions: ["tex"]
      },
      "application/x-tex-tfm": {
        source: "apache",
        extensions: ["tfm"]
      },
      "application/x-texinfo": {
        source: "apache",
        extensions: ["texinfo", "texi"]
      },
      "application/x-tgif": {
        source: "apache",
        extensions: ["obj"]
      },
      "application/x-ustar": {
        source: "apache",
        extensions: ["ustar"]
      },
      "application/x-virtualbox-hdd": {
        compressible: true,
        extensions: ["hdd"]
      },
      "application/x-virtualbox-ova": {
        compressible: true,
        extensions: ["ova"]
      },
      "application/x-virtualbox-ovf": {
        compressible: true,
        extensions: ["ovf"]
      },
      "application/x-virtualbox-vbox": {
        compressible: true,
        extensions: ["vbox"]
      },
      "application/x-virtualbox-vbox-extpack": {
        compressible: false,
        extensions: ["vbox-extpack"]
      },
      "application/x-virtualbox-vdi": {
        compressible: true,
        extensions: ["vdi"]
      },
      "application/x-virtualbox-vhd": {
        compressible: true,
        extensions: ["vhd"]
      },
      "application/x-virtualbox-vmdk": {
        compressible: true,
        extensions: ["vmdk"]
      },
      "application/x-wais-source": {
        source: "apache",
        extensions: ["src"]
      },
      "application/x-web-app-manifest+json": {
        compressible: true,
        extensions: ["webapp"]
      },
      "application/x-www-form-urlencoded": {
        source: "iana",
        compressible: true
      },
      "application/x-x509-ca-cert": {
        source: "iana",
        extensions: ["der", "crt", "pem"]
      },
      "application/x-x509-ca-ra-cert": {
        source: "iana"
      },
      "application/x-x509-next-ca-cert": {
        source: "iana"
      },
      "application/x-xfig": {
        source: "apache",
        extensions: ["fig"]
      },
      "application/x-xliff+xml": {
        source: "apache",
        compressible: true,
        extensions: ["xlf"]
      },
      "application/x-xpinstall": {
        source: "apache",
        compressible: false,
        extensions: ["xpi"]
      },
      "application/x-xz": {
        source: "apache",
        extensions: ["xz"]
      },
      "application/x-zmachine": {
        source: "apache",
        extensions: ["z1", "z2", "z3", "z4", "z5", "z6", "z7", "z8"]
      },
      "application/x400-bp": {
        source: "iana"
      },
      "application/xacml+xml": {
        source: "iana",
        compressible: true
      },
      "application/xaml+xml": {
        source: "apache",
        compressible: true,
        extensions: ["xaml"]
      },
      "application/xcap-att+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xav"]
      },
      "application/xcap-caps+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xca"]
      },
      "application/xcap-diff+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xdf"]
      },
      "application/xcap-el+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xel"]
      },
      "application/xcap-error+xml": {
        source: "iana",
        compressible: true
      },
      "application/xcap-ns+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xns"]
      },
      "application/xcon-conference-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/xcon-conference-info-diff+xml": {
        source: "iana",
        compressible: true
      },
      "application/xenc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xenc"]
      },
      "application/xhtml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xhtml", "xht"]
      },
      "application/xhtml-voice+xml": {
        source: "apache",
        compressible: true
      },
      "application/xliff+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xlf"]
      },
      "application/xml": {
        source: "iana",
        compressible: true,
        extensions: ["xml", "xsl", "xsd", "rng"]
      },
      "application/xml-dtd": {
        source: "iana",
        compressible: true,
        extensions: ["dtd"]
      },
      "application/xml-external-parsed-entity": {
        source: "iana"
      },
      "application/xml-patch+xml": {
        source: "iana",
        compressible: true
      },
      "application/xmpp+xml": {
        source: "iana",
        compressible: true
      },
      "application/xop+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xop"]
      },
      "application/xproc+xml": {
        source: "apache",
        compressible: true,
        extensions: ["xpl"]
      },
      "application/xslt+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xsl", "xslt"]
      },
      "application/xspf+xml": {
        source: "apache",
        compressible: true,
        extensions: ["xspf"]
      },
      "application/xv+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mxml", "xhvml", "xvml", "xvm"]
      },
      "application/yang": {
        source: "iana",
        extensions: ["yang"]
      },
      "application/yang-data+json": {
        source: "iana",
        compressible: true
      },
      "application/yang-data+xml": {
        source: "iana",
        compressible: true
      },
      "application/yang-patch+json": {
        source: "iana",
        compressible: true
      },
      "application/yang-patch+xml": {
        source: "iana",
        compressible: true
      },
      "application/yin+xml": {
        source: "iana",
        compressible: true,
        extensions: ["yin"]
      },
      "application/zip": {
        source: "iana",
        compressible: false,
        extensions: ["zip"]
      },
      "application/zlib": {
        source: "iana"
      },
      "application/zstd": {
        source: "iana"
      },
      "audio/1d-interleaved-parityfec": {
        source: "iana"
      },
      "audio/32kadpcm": {
        source: "iana"
      },
      "audio/3gpp": {
        source: "iana",
        compressible: false,
        extensions: ["3gpp"]
      },
      "audio/3gpp2": {
        source: "iana"
      },
      "audio/aac": {
        source: "iana"
      },
      "audio/ac3": {
        source: "iana"
      },
      "audio/adpcm": {
        source: "apache",
        extensions: ["adp"]
      },
      "audio/amr": {
        source: "iana",
        extensions: ["amr"]
      },
      "audio/amr-wb": {
        source: "iana"
      },
      "audio/amr-wb+": {
        source: "iana"
      },
      "audio/aptx": {
        source: "iana"
      },
      "audio/asc": {
        source: "iana"
      },
      "audio/atrac-advanced-lossless": {
        source: "iana"
      },
      "audio/atrac-x": {
        source: "iana"
      },
      "audio/atrac3": {
        source: "iana"
      },
      "audio/basic": {
        source: "iana",
        compressible: false,
        extensions: ["au", "snd"]
      },
      "audio/bv16": {
        source: "iana"
      },
      "audio/bv32": {
        source: "iana"
      },
      "audio/clearmode": {
        source: "iana"
      },
      "audio/cn": {
        source: "iana"
      },
      "audio/dat12": {
        source: "iana"
      },
      "audio/dls": {
        source: "iana"
      },
      "audio/dsr-es201108": {
        source: "iana"
      },
      "audio/dsr-es202050": {
        source: "iana"
      },
      "audio/dsr-es202211": {
        source: "iana"
      },
      "audio/dsr-es202212": {
        source: "iana"
      },
      "audio/dv": {
        source: "iana"
      },
      "audio/dvi4": {
        source: "iana"
      },
      "audio/eac3": {
        source: "iana"
      },
      "audio/encaprtp": {
        source: "iana"
      },
      "audio/evrc": {
        source: "iana"
      },
      "audio/evrc-qcp": {
        source: "iana"
      },
      "audio/evrc0": {
        source: "iana"
      },
      "audio/evrc1": {
        source: "iana"
      },
      "audio/evrcb": {
        source: "iana"
      },
      "audio/evrcb0": {
        source: "iana"
      },
      "audio/evrcb1": {
        source: "iana"
      },
      "audio/evrcnw": {
        source: "iana"
      },
      "audio/evrcnw0": {
        source: "iana"
      },
      "audio/evrcnw1": {
        source: "iana"
      },
      "audio/evrcwb": {
        source: "iana"
      },
      "audio/evrcwb0": {
        source: "iana"
      },
      "audio/evrcwb1": {
        source: "iana"
      },
      "audio/evs": {
        source: "iana"
      },
      "audio/flexfec": {
        source: "iana"
      },
      "audio/fwdred": {
        source: "iana"
      },
      "audio/g711-0": {
        source: "iana"
      },
      "audio/g719": {
        source: "iana"
      },
      "audio/g722": {
        source: "iana"
      },
      "audio/g7221": {
        source: "iana"
      },
      "audio/g723": {
        source: "iana"
      },
      "audio/g726-16": {
        source: "iana"
      },
      "audio/g726-24": {
        source: "iana"
      },
      "audio/g726-32": {
        source: "iana"
      },
      "audio/g726-40": {
        source: "iana"
      },
      "audio/g728": {
        source: "iana"
      },
      "audio/g729": {
        source: "iana"
      },
      "audio/g7291": {
        source: "iana"
      },
      "audio/g729d": {
        source: "iana"
      },
      "audio/g729e": {
        source: "iana"
      },
      "audio/gsm": {
        source: "iana"
      },
      "audio/gsm-efr": {
        source: "iana"
      },
      "audio/gsm-hr-08": {
        source: "iana"
      },
      "audio/ilbc": {
        source: "iana"
      },
      "audio/ip-mr_v2.5": {
        source: "iana"
      },
      "audio/isac": {
        source: "apache"
      },
      "audio/l16": {
        source: "iana"
      },
      "audio/l20": {
        source: "iana"
      },
      "audio/l24": {
        source: "iana",
        compressible: false
      },
      "audio/l8": {
        source: "iana"
      },
      "audio/lpc": {
        source: "iana"
      },
      "audio/melp": {
        source: "iana"
      },
      "audio/melp1200": {
        source: "iana"
      },
      "audio/melp2400": {
        source: "iana"
      },
      "audio/melp600": {
        source: "iana"
      },
      "audio/mhas": {
        source: "iana"
      },
      "audio/midi": {
        source: "apache",
        extensions: ["mid", "midi", "kar", "rmi"]
      },
      "audio/mobile-xmf": {
        source: "iana",
        extensions: ["mxmf"]
      },
      "audio/mp3": {
        compressible: false,
        extensions: ["mp3"]
      },
      "audio/mp4": {
        source: "iana",
        compressible: false,
        extensions: ["m4a", "mp4a"]
      },
      "audio/mp4a-latm": {
        source: "iana"
      },
      "audio/mpa": {
        source: "iana"
      },
      "audio/mpa-robust": {
        source: "iana"
      },
      "audio/mpeg": {
        source: "iana",
        compressible: false,
        extensions: ["mpga", "mp2", "mp2a", "mp3", "m2a", "m3a"]
      },
      "audio/mpeg4-generic": {
        source: "iana"
      },
      "audio/musepack": {
        source: "apache"
      },
      "audio/ogg": {
        source: "iana",
        compressible: false,
        extensions: ["oga", "ogg", "spx", "opus"]
      },
      "audio/opus": {
        source: "iana"
      },
      "audio/parityfec": {
        source: "iana"
      },
      "audio/pcma": {
        source: "iana"
      },
      "audio/pcma-wb": {
        source: "iana"
      },
      "audio/pcmu": {
        source: "iana"
      },
      "audio/pcmu-wb": {
        source: "iana"
      },
      "audio/prs.sid": {
        source: "iana"
      },
      "audio/qcelp": {
        source: "iana"
      },
      "audio/raptorfec": {
        source: "iana"
      },
      "audio/red": {
        source: "iana"
      },
      "audio/rtp-enc-aescm128": {
        source: "iana"
      },
      "audio/rtp-midi": {
        source: "iana"
      },
      "audio/rtploopback": {
        source: "iana"
      },
      "audio/rtx": {
        source: "iana"
      },
      "audio/s3m": {
        source: "apache",
        extensions: ["s3m"]
      },
      "audio/scip": {
        source: "iana"
      },
      "audio/silk": {
        source: "apache",
        extensions: ["sil"]
      },
      "audio/smv": {
        source: "iana"
      },
      "audio/smv-qcp": {
        source: "iana"
      },
      "audio/smv0": {
        source: "iana"
      },
      "audio/sofa": {
        source: "iana"
      },
      "audio/sp-midi": {
        source: "iana"
      },
      "audio/speex": {
        source: "iana"
      },
      "audio/t140c": {
        source: "iana"
      },
      "audio/t38": {
        source: "iana"
      },
      "audio/telephone-event": {
        source: "iana"
      },
      "audio/tetra_acelp": {
        source: "iana"
      },
      "audio/tetra_acelp_bb": {
        source: "iana"
      },
      "audio/tone": {
        source: "iana"
      },
      "audio/tsvcis": {
        source: "iana"
      },
      "audio/uemclip": {
        source: "iana"
      },
      "audio/ulpfec": {
        source: "iana"
      },
      "audio/usac": {
        source: "iana"
      },
      "audio/vdvi": {
        source: "iana"
      },
      "audio/vmr-wb": {
        source: "iana"
      },
      "audio/vnd.3gpp.iufp": {
        source: "iana"
      },
      "audio/vnd.4sb": {
        source: "iana"
      },
      "audio/vnd.audiokoz": {
        source: "iana"
      },
      "audio/vnd.celp": {
        source: "iana"
      },
      "audio/vnd.cisco.nse": {
        source: "iana"
      },
      "audio/vnd.cmles.radio-events": {
        source: "iana"
      },
      "audio/vnd.cns.anp1": {
        source: "iana"
      },
      "audio/vnd.cns.inf1": {
        source: "iana"
      },
      "audio/vnd.dece.audio": {
        source: "iana",
        extensions: ["uva", "uvva"]
      },
      "audio/vnd.digital-winds": {
        source: "iana",
        extensions: ["eol"]
      },
      "audio/vnd.dlna.adts": {
        source: "iana"
      },
      "audio/vnd.dolby.heaac.1": {
        source: "iana"
      },
      "audio/vnd.dolby.heaac.2": {
        source: "iana"
      },
      "audio/vnd.dolby.mlp": {
        source: "iana"
      },
      "audio/vnd.dolby.mps": {
        source: "iana"
      },
      "audio/vnd.dolby.pl2": {
        source: "iana"
      },
      "audio/vnd.dolby.pl2x": {
        source: "iana"
      },
      "audio/vnd.dolby.pl2z": {
        source: "iana"
      },
      "audio/vnd.dolby.pulse.1": {
        source: "iana"
      },
      "audio/vnd.dra": {
        source: "iana",
        extensions: ["dra"]
      },
      "audio/vnd.dts": {
        source: "iana",
        extensions: ["dts"]
      },
      "audio/vnd.dts.hd": {
        source: "iana",
        extensions: ["dtshd"]
      },
      "audio/vnd.dts.uhd": {
        source: "iana"
      },
      "audio/vnd.dvb.file": {
        source: "iana"
      },
      "audio/vnd.everad.plj": {
        source: "iana"
      },
      "audio/vnd.hns.audio": {
        source: "iana"
      },
      "audio/vnd.lucent.voice": {
        source: "iana",
        extensions: ["lvp"]
      },
      "audio/vnd.ms-playready.media.pya": {
        source: "iana",
        extensions: ["pya"]
      },
      "audio/vnd.nokia.mobile-xmf": {
        source: "iana"
      },
      "audio/vnd.nortel.vbk": {
        source: "iana"
      },
      "audio/vnd.nuera.ecelp4800": {
        source: "iana",
        extensions: ["ecelp4800"]
      },
      "audio/vnd.nuera.ecelp7470": {
        source: "iana",
        extensions: ["ecelp7470"]
      },
      "audio/vnd.nuera.ecelp9600": {
        source: "iana",
        extensions: ["ecelp9600"]
      },
      "audio/vnd.octel.sbc": {
        source: "iana"
      },
      "audio/vnd.presonus.multitrack": {
        source: "iana"
      },
      "audio/vnd.qcelp": {
        source: "iana"
      },
      "audio/vnd.rhetorex.32kadpcm": {
        source: "iana"
      },
      "audio/vnd.rip": {
        source: "iana",
        extensions: ["rip"]
      },
      "audio/vnd.rn-realaudio": {
        compressible: false
      },
      "audio/vnd.sealedmedia.softseal.mpeg": {
        source: "iana"
      },
      "audio/vnd.vmx.cvsd": {
        source: "iana"
      },
      "audio/vnd.wave": {
        compressible: false
      },
      "audio/vorbis": {
        source: "iana",
        compressible: false
      },
      "audio/vorbis-config": {
        source: "iana"
      },
      "audio/wav": {
        compressible: false,
        extensions: ["wav"]
      },
      "audio/wave": {
        compressible: false,
        extensions: ["wav"]
      },
      "audio/webm": {
        source: "apache",
        compressible: false,
        extensions: ["weba"]
      },
      "audio/x-aac": {
        source: "apache",
        compressible: false,
        extensions: ["aac"]
      },
      "audio/x-aiff": {
        source: "apache",
        extensions: ["aif", "aiff", "aifc"]
      },
      "audio/x-caf": {
        source: "apache",
        compressible: false,
        extensions: ["caf"]
      },
      "audio/x-flac": {
        source: "apache",
        extensions: ["flac"]
      },
      "audio/x-m4a": {
        source: "nginx",
        extensions: ["m4a"]
      },
      "audio/x-matroska": {
        source: "apache",
        extensions: ["mka"]
      },
      "audio/x-mpegurl": {
        source: "apache",
        extensions: ["m3u"]
      },
      "audio/x-ms-wax": {
        source: "apache",
        extensions: ["wax"]
      },
      "audio/x-ms-wma": {
        source: "apache",
        extensions: ["wma"]
      },
      "audio/x-pn-realaudio": {
        source: "apache",
        extensions: ["ram", "ra"]
      },
      "audio/x-pn-realaudio-plugin": {
        source: "apache",
        extensions: ["rmp"]
      },
      "audio/x-realaudio": {
        source: "nginx",
        extensions: ["ra"]
      },
      "audio/x-tta": {
        source: "apache"
      },
      "audio/x-wav": {
        source: "apache",
        extensions: ["wav"]
      },
      "audio/xm": {
        source: "apache",
        extensions: ["xm"]
      },
      "chemical/x-cdx": {
        source: "apache",
        extensions: ["cdx"]
      },
      "chemical/x-cif": {
        source: "apache",
        extensions: ["cif"]
      },
      "chemical/x-cmdf": {
        source: "apache",
        extensions: ["cmdf"]
      },
      "chemical/x-cml": {
        source: "apache",
        extensions: ["cml"]
      },
      "chemical/x-csml": {
        source: "apache",
        extensions: ["csml"]
      },
      "chemical/x-pdb": {
        source: "apache"
      },
      "chemical/x-xyz": {
        source: "apache",
        extensions: ["xyz"]
      },
      "font/collection": {
        source: "iana",
        extensions: ["ttc"]
      },
      "font/otf": {
        source: "iana",
        compressible: true,
        extensions: ["otf"]
      },
      "font/sfnt": {
        source: "iana"
      },
      "font/ttf": {
        source: "iana",
        compressible: true,
        extensions: ["ttf"]
      },
      "font/woff": {
        source: "iana",
        extensions: ["woff"]
      },
      "font/woff2": {
        source: "iana",
        extensions: ["woff2"]
      },
      "image/aces": {
        source: "iana",
        extensions: ["exr"]
      },
      "image/apng": {
        compressible: false,
        extensions: ["apng"]
      },
      "image/avci": {
        source: "iana",
        extensions: ["avci"]
      },
      "image/avcs": {
        source: "iana",
        extensions: ["avcs"]
      },
      "image/avif": {
        source: "iana",
        compressible: false,
        extensions: ["avif"]
      },
      "image/bmp": {
        source: "iana",
        compressible: true,
        extensions: ["bmp"]
      },
      "image/cgm": {
        source: "iana",
        extensions: ["cgm"]
      },
      "image/dicom-rle": {
        source: "iana",
        extensions: ["drle"]
      },
      "image/emf": {
        source: "iana",
        extensions: ["emf"]
      },
      "image/fits": {
        source: "iana",
        extensions: ["fits"]
      },
      "image/g3fax": {
        source: "iana",
        extensions: ["g3"]
      },
      "image/gif": {
        source: "iana",
        compressible: false,
        extensions: ["gif"]
      },
      "image/heic": {
        source: "iana",
        extensions: ["heic"]
      },
      "image/heic-sequence": {
        source: "iana",
        extensions: ["heics"]
      },
      "image/heif": {
        source: "iana",
        extensions: ["heif"]
      },
      "image/heif-sequence": {
        source: "iana",
        extensions: ["heifs"]
      },
      "image/hej2k": {
        source: "iana",
        extensions: ["hej2"]
      },
      "image/hsj2": {
        source: "iana",
        extensions: ["hsj2"]
      },
      "image/ief": {
        source: "iana",
        extensions: ["ief"]
      },
      "image/jls": {
        source: "iana",
        extensions: ["jls"]
      },
      "image/jp2": {
        source: "iana",
        compressible: false,
        extensions: ["jp2", "jpg2"]
      },
      "image/jpeg": {
        source: "iana",
        compressible: false,
        extensions: ["jpeg", "jpg", "jpe"]
      },
      "image/jph": {
        source: "iana",
        extensions: ["jph"]
      },
      "image/jphc": {
        source: "iana",
        extensions: ["jhc"]
      },
      "image/jpm": {
        source: "iana",
        compressible: false,
        extensions: ["jpm"]
      },
      "image/jpx": {
        source: "iana",
        compressible: false,
        extensions: ["jpx", "jpf"]
      },
      "image/jxr": {
        source: "iana",
        extensions: ["jxr"]
      },
      "image/jxra": {
        source: "iana",
        extensions: ["jxra"]
      },
      "image/jxrs": {
        source: "iana",
        extensions: ["jxrs"]
      },
      "image/jxs": {
        source: "iana",
        extensions: ["jxs"]
      },
      "image/jxsc": {
        source: "iana",
        extensions: ["jxsc"]
      },
      "image/jxsi": {
        source: "iana",
        extensions: ["jxsi"]
      },
      "image/jxss": {
        source: "iana",
        extensions: ["jxss"]
      },
      "image/ktx": {
        source: "iana",
        extensions: ["ktx"]
      },
      "image/ktx2": {
        source: "iana",
        extensions: ["ktx2"]
      },
      "image/naplps": {
        source: "iana"
      },
      "image/pjpeg": {
        compressible: false
      },
      "image/png": {
        source: "iana",
        compressible: false,
        extensions: ["png"]
      },
      "image/prs.btif": {
        source: "iana",
        extensions: ["btif"]
      },
      "image/prs.pti": {
        source: "iana",
        extensions: ["pti"]
      },
      "image/pwg-raster": {
        source: "iana"
      },
      "image/sgi": {
        source: "apache",
        extensions: ["sgi"]
      },
      "image/svg+xml": {
        source: "iana",
        compressible: true,
        extensions: ["svg", "svgz"]
      },
      "image/t38": {
        source: "iana",
        extensions: ["t38"]
      },
      "image/tiff": {
        source: "iana",
        compressible: false,
        extensions: ["tif", "tiff"]
      },
      "image/tiff-fx": {
        source: "iana",
        extensions: ["tfx"]
      },
      "image/vnd.adobe.photoshop": {
        source: "iana",
        compressible: true,
        extensions: ["psd"]
      },
      "image/vnd.airzip.accelerator.azv": {
        source: "iana",
        extensions: ["azv"]
      },
      "image/vnd.cns.inf2": {
        source: "iana"
      },
      "image/vnd.dece.graphic": {
        source: "iana",
        extensions: ["uvi", "uvvi", "uvg", "uvvg"]
      },
      "image/vnd.djvu": {
        source: "iana",
        extensions: ["djvu", "djv"]
      },
      "image/vnd.dvb.subtitle": {
        source: "iana",
        extensions: ["sub"]
      },
      "image/vnd.dwg": {
        source: "iana",
        extensions: ["dwg"]
      },
      "image/vnd.dxf": {
        source: "iana",
        extensions: ["dxf"]
      },
      "image/vnd.fastbidsheet": {
        source: "iana",
        extensions: ["fbs"]
      },
      "image/vnd.fpx": {
        source: "iana",
        extensions: ["fpx"]
      },
      "image/vnd.fst": {
        source: "iana",
        extensions: ["fst"]
      },
      "image/vnd.fujixerox.edmics-mmr": {
        source: "iana",
        extensions: ["mmr"]
      },
      "image/vnd.fujixerox.edmics-rlc": {
        source: "iana",
        extensions: ["rlc"]
      },
      "image/vnd.globalgraphics.pgb": {
        source: "iana"
      },
      "image/vnd.microsoft.icon": {
        source: "iana",
        compressible: true,
        extensions: ["ico"]
      },
      "image/vnd.mix": {
        source: "iana"
      },
      "image/vnd.mozilla.apng": {
        source: "iana"
      },
      "image/vnd.ms-dds": {
        compressible: true,
        extensions: ["dds"]
      },
      "image/vnd.ms-modi": {
        source: "iana",
        extensions: ["mdi"]
      },
      "image/vnd.ms-photo": {
        source: "apache",
        extensions: ["wdp"]
      },
      "image/vnd.net-fpx": {
        source: "iana",
        extensions: ["npx"]
      },
      "image/vnd.pco.b16": {
        source: "iana",
        extensions: ["b16"]
      },
      "image/vnd.radiance": {
        source: "iana"
      },
      "image/vnd.sealed.png": {
        source: "iana"
      },
      "image/vnd.sealedmedia.softseal.gif": {
        source: "iana"
      },
      "image/vnd.sealedmedia.softseal.jpg": {
        source: "iana"
      },
      "image/vnd.svf": {
        source: "iana"
      },
      "image/vnd.tencent.tap": {
        source: "iana",
        extensions: ["tap"]
      },
      "image/vnd.valve.source.texture": {
        source: "iana",
        extensions: ["vtf"]
      },
      "image/vnd.wap.wbmp": {
        source: "iana",
        extensions: ["wbmp"]
      },
      "image/vnd.xiff": {
        source: "iana",
        extensions: ["xif"]
      },
      "image/vnd.zbrush.pcx": {
        source: "iana",
        extensions: ["pcx"]
      },
      "image/webp": {
        source: "apache",
        extensions: ["webp"]
      },
      "image/wmf": {
        source: "iana",
        extensions: ["wmf"]
      },
      "image/x-3ds": {
        source: "apache",
        extensions: ["3ds"]
      },
      "image/x-cmu-raster": {
        source: "apache",
        extensions: ["ras"]
      },
      "image/x-cmx": {
        source: "apache",
        extensions: ["cmx"]
      },
      "image/x-freehand": {
        source: "apache",
        extensions: ["fh", "fhc", "fh4", "fh5", "fh7"]
      },
      "image/x-icon": {
        source: "apache",
        compressible: true,
        extensions: ["ico"]
      },
      "image/x-jng": {
        source: "nginx",
        extensions: ["jng"]
      },
      "image/x-mrsid-image": {
        source: "apache",
        extensions: ["sid"]
      },
      "image/x-ms-bmp": {
        source: "nginx",
        compressible: true,
        extensions: ["bmp"]
      },
      "image/x-pcx": {
        source: "apache",
        extensions: ["pcx"]
      },
      "image/x-pict": {
        source: "apache",
        extensions: ["pic", "pct"]
      },
      "image/x-portable-anymap": {
        source: "apache",
        extensions: ["pnm"]
      },
      "image/x-portable-bitmap": {
        source: "apache",
        extensions: ["pbm"]
      },
      "image/x-portable-graymap": {
        source: "apache",
        extensions: ["pgm"]
      },
      "image/x-portable-pixmap": {
        source: "apache",
        extensions: ["ppm"]
      },
      "image/x-rgb": {
        source: "apache",
        extensions: ["rgb"]
      },
      "image/x-tga": {
        source: "apache",
        extensions: ["tga"]
      },
      "image/x-xbitmap": {
        source: "apache",
        extensions: ["xbm"]
      },
      "image/x-xcf": {
        compressible: false
      },
      "image/x-xpixmap": {
        source: "apache",
        extensions: ["xpm"]
      },
      "image/x-xwindowdump": {
        source: "apache",
        extensions: ["xwd"]
      },
      "message/cpim": {
        source: "iana"
      },
      "message/delivery-status": {
        source: "iana"
      },
      "message/disposition-notification": {
        source: "iana",
        extensions: [
          "disposition-notification"
        ]
      },
      "message/external-body": {
        source: "iana"
      },
      "message/feedback-report": {
        source: "iana"
      },
      "message/global": {
        source: "iana",
        extensions: ["u8msg"]
      },
      "message/global-delivery-status": {
        source: "iana",
        extensions: ["u8dsn"]
      },
      "message/global-disposition-notification": {
        source: "iana",
        extensions: ["u8mdn"]
      },
      "message/global-headers": {
        source: "iana",
        extensions: ["u8hdr"]
      },
      "message/http": {
        source: "iana",
        compressible: false
      },
      "message/imdn+xml": {
        source: "iana",
        compressible: true
      },
      "message/news": {
        source: "iana"
      },
      "message/partial": {
        source: "iana",
        compressible: false
      },
      "message/rfc822": {
        source: "iana",
        compressible: true,
        extensions: ["eml", "mime"]
      },
      "message/s-http": {
        source: "iana"
      },
      "message/sip": {
        source: "iana"
      },
      "message/sipfrag": {
        source: "iana"
      },
      "message/tracking-status": {
        source: "iana"
      },
      "message/vnd.si.simp": {
        source: "iana"
      },
      "message/vnd.wfa.wsc": {
        source: "iana",
        extensions: ["wsc"]
      },
      "model/3mf": {
        source: "iana",
        extensions: ["3mf"]
      },
      "model/e57": {
        source: "iana"
      },
      "model/gltf+json": {
        source: "iana",
        compressible: true,
        extensions: ["gltf"]
      },
      "model/gltf-binary": {
        source: "iana",
        compressible: true,
        extensions: ["glb"]
      },
      "model/iges": {
        source: "iana",
        compressible: false,
        extensions: ["igs", "iges"]
      },
      "model/mesh": {
        source: "iana",
        compressible: false,
        extensions: ["msh", "mesh", "silo"]
      },
      "model/mtl": {
        source: "iana",
        extensions: ["mtl"]
      },
      "model/obj": {
        source: "iana",
        extensions: ["obj"]
      },
      "model/step": {
        source: "iana"
      },
      "model/step+xml": {
        source: "iana",
        compressible: true,
        extensions: ["stpx"]
      },
      "model/step+zip": {
        source: "iana",
        compressible: false,
        extensions: ["stpz"]
      },
      "model/step-xml+zip": {
        source: "iana",
        compressible: false,
        extensions: ["stpxz"]
      },
      "model/stl": {
        source: "iana",
        extensions: ["stl"]
      },
      "model/vnd.collada+xml": {
        source: "iana",
        compressible: true,
        extensions: ["dae"]
      },
      "model/vnd.dwf": {
        source: "iana",
        extensions: ["dwf"]
      },
      "model/vnd.flatland.3dml": {
        source: "iana"
      },
      "model/vnd.gdl": {
        source: "iana",
        extensions: ["gdl"]
      },
      "model/vnd.gs-gdl": {
        source: "apache"
      },
      "model/vnd.gs.gdl": {
        source: "iana"
      },
      "model/vnd.gtw": {
        source: "iana",
        extensions: ["gtw"]
      },
      "model/vnd.moml+xml": {
        source: "iana",
        compressible: true
      },
      "model/vnd.mts": {
        source: "iana",
        extensions: ["mts"]
      },
      "model/vnd.opengex": {
        source: "iana",
        extensions: ["ogex"]
      },
      "model/vnd.parasolid.transmit.binary": {
        source: "iana",
        extensions: ["x_b"]
      },
      "model/vnd.parasolid.transmit.text": {
        source: "iana",
        extensions: ["x_t"]
      },
      "model/vnd.pytha.pyox": {
        source: "iana"
      },
      "model/vnd.rosette.annotated-data-model": {
        source: "iana"
      },
      "model/vnd.sap.vds": {
        source: "iana",
        extensions: ["vds"]
      },
      "model/vnd.usdz+zip": {
        source: "iana",
        compressible: false,
        extensions: ["usdz"]
      },
      "model/vnd.valve.source.compiled-map": {
        source: "iana",
        extensions: ["bsp"]
      },
      "model/vnd.vtu": {
        source: "iana",
        extensions: ["vtu"]
      },
      "model/vrml": {
        source: "iana",
        compressible: false,
        extensions: ["wrl", "vrml"]
      },
      "model/x3d+binary": {
        source: "apache",
        compressible: false,
        extensions: ["x3db", "x3dbz"]
      },
      "model/x3d+fastinfoset": {
        source: "iana",
        extensions: ["x3db"]
      },
      "model/x3d+vrml": {
        source: "apache",
        compressible: false,
        extensions: ["x3dv", "x3dvz"]
      },
      "model/x3d+xml": {
        source: "iana",
        compressible: true,
        extensions: ["x3d", "x3dz"]
      },
      "model/x3d-vrml": {
        source: "iana",
        extensions: ["x3dv"]
      },
      "multipart/alternative": {
        source: "iana",
        compressible: false
      },
      "multipart/appledouble": {
        source: "iana"
      },
      "multipart/byteranges": {
        source: "iana"
      },
      "multipart/digest": {
        source: "iana"
      },
      "multipart/encrypted": {
        source: "iana",
        compressible: false
      },
      "multipart/form-data": {
        source: "iana",
        compressible: false
      },
      "multipart/header-set": {
        source: "iana"
      },
      "multipart/mixed": {
        source: "iana"
      },
      "multipart/multilingual": {
        source: "iana"
      },
      "multipart/parallel": {
        source: "iana"
      },
      "multipart/related": {
        source: "iana",
        compressible: false
      },
      "multipart/report": {
        source: "iana"
      },
      "multipart/signed": {
        source: "iana",
        compressible: false
      },
      "multipart/vnd.bint.med-plus": {
        source: "iana"
      },
      "multipart/voice-message": {
        source: "iana"
      },
      "multipart/x-mixed-replace": {
        source: "iana"
      },
      "text/1d-interleaved-parityfec": {
        source: "iana"
      },
      "text/cache-manifest": {
        source: "iana",
        compressible: true,
        extensions: ["appcache", "manifest"]
      },
      "text/calendar": {
        source: "iana",
        extensions: ["ics", "ifb"]
      },
      "text/calender": {
        compressible: true
      },
      "text/cmd": {
        compressible: true
      },
      "text/coffeescript": {
        extensions: ["coffee", "litcoffee"]
      },
      "text/cql": {
        source: "iana"
      },
      "text/cql-expression": {
        source: "iana"
      },
      "text/cql-identifier": {
        source: "iana"
      },
      "text/css": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["css"]
      },
      "text/csv": {
        source: "iana",
        compressible: true,
        extensions: ["csv"]
      },
      "text/csv-schema": {
        source: "iana"
      },
      "text/directory": {
        source: "iana"
      },
      "text/dns": {
        source: "iana"
      },
      "text/ecmascript": {
        source: "iana"
      },
      "text/encaprtp": {
        source: "iana"
      },
      "text/enriched": {
        source: "iana"
      },
      "text/fhirpath": {
        source: "iana"
      },
      "text/flexfec": {
        source: "iana"
      },
      "text/fwdred": {
        source: "iana"
      },
      "text/gff3": {
        source: "iana"
      },
      "text/grammar-ref-list": {
        source: "iana"
      },
      "text/html": {
        source: "iana",
        compressible: true,
        extensions: ["html", "htm", "shtml"]
      },
      "text/jade": {
        extensions: ["jade"]
      },
      "text/javascript": {
        source: "iana",
        compressible: true
      },
      "text/jcr-cnd": {
        source: "iana"
      },
      "text/jsx": {
        compressible: true,
        extensions: ["jsx"]
      },
      "text/less": {
        compressible: true,
        extensions: ["less"]
      },
      "text/markdown": {
        source: "iana",
        compressible: true,
        extensions: ["markdown", "md"]
      },
      "text/mathml": {
        source: "nginx",
        extensions: ["mml"]
      },
      "text/mdx": {
        compressible: true,
        extensions: ["mdx"]
      },
      "text/mizar": {
        source: "iana"
      },
      "text/n3": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["n3"]
      },
      "text/parameters": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/parityfec": {
        source: "iana"
      },
      "text/plain": {
        source: "iana",
        compressible: true,
        extensions: ["txt", "text", "conf", "def", "list", "log", "in", "ini"]
      },
      "text/provenance-notation": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/prs.fallenstein.rst": {
        source: "iana"
      },
      "text/prs.lines.tag": {
        source: "iana",
        extensions: ["dsc"]
      },
      "text/prs.prop.logic": {
        source: "iana"
      },
      "text/raptorfec": {
        source: "iana"
      },
      "text/red": {
        source: "iana"
      },
      "text/rfc822-headers": {
        source: "iana"
      },
      "text/richtext": {
        source: "iana",
        compressible: true,
        extensions: ["rtx"]
      },
      "text/rtf": {
        source: "iana",
        compressible: true,
        extensions: ["rtf"]
      },
      "text/rtp-enc-aescm128": {
        source: "iana"
      },
      "text/rtploopback": {
        source: "iana"
      },
      "text/rtx": {
        source: "iana"
      },
      "text/sgml": {
        source: "iana",
        extensions: ["sgml", "sgm"]
      },
      "text/shaclc": {
        source: "iana"
      },
      "text/shex": {
        source: "iana",
        extensions: ["shex"]
      },
      "text/slim": {
        extensions: ["slim", "slm"]
      },
      "text/spdx": {
        source: "iana",
        extensions: ["spdx"]
      },
      "text/strings": {
        source: "iana"
      },
      "text/stylus": {
        extensions: ["stylus", "styl"]
      },
      "text/t140": {
        source: "iana"
      },
      "text/tab-separated-values": {
        source: "iana",
        compressible: true,
        extensions: ["tsv"]
      },
      "text/troff": {
        source: "iana",
        extensions: ["t", "tr", "roff", "man", "me", "ms"]
      },
      "text/turtle": {
        source: "iana",
        charset: "UTF-8",
        extensions: ["ttl"]
      },
      "text/ulpfec": {
        source: "iana"
      },
      "text/uri-list": {
        source: "iana",
        compressible: true,
        extensions: ["uri", "uris", "urls"]
      },
      "text/vcard": {
        source: "iana",
        compressible: true,
        extensions: ["vcard"]
      },
      "text/vnd.a": {
        source: "iana"
      },
      "text/vnd.abc": {
        source: "iana"
      },
      "text/vnd.ascii-art": {
        source: "iana"
      },
      "text/vnd.curl": {
        source: "iana",
        extensions: ["curl"]
      },
      "text/vnd.curl.dcurl": {
        source: "apache",
        extensions: ["dcurl"]
      },
      "text/vnd.curl.mcurl": {
        source: "apache",
        extensions: ["mcurl"]
      },
      "text/vnd.curl.scurl": {
        source: "apache",
        extensions: ["scurl"]
      },
      "text/vnd.debian.copyright": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/vnd.dmclientscript": {
        source: "iana"
      },
      "text/vnd.dvb.subtitle": {
        source: "iana",
        extensions: ["sub"]
      },
      "text/vnd.esmertec.theme-descriptor": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/vnd.familysearch.gedcom": {
        source: "iana",
        extensions: ["ged"]
      },
      "text/vnd.ficlab.flt": {
        source: "iana"
      },
      "text/vnd.fly": {
        source: "iana",
        extensions: ["fly"]
      },
      "text/vnd.fmi.flexstor": {
        source: "iana",
        extensions: ["flx"]
      },
      "text/vnd.gml": {
        source: "iana"
      },
      "text/vnd.graphviz": {
        source: "iana",
        extensions: ["gv"]
      },
      "text/vnd.hans": {
        source: "iana"
      },
      "text/vnd.hgl": {
        source: "iana"
      },
      "text/vnd.in3d.3dml": {
        source: "iana",
        extensions: ["3dml"]
      },
      "text/vnd.in3d.spot": {
        source: "iana",
        extensions: ["spot"]
      },
      "text/vnd.iptc.newsml": {
        source: "iana"
      },
      "text/vnd.iptc.nitf": {
        source: "iana"
      },
      "text/vnd.latex-z": {
        source: "iana"
      },
      "text/vnd.motorola.reflex": {
        source: "iana"
      },
      "text/vnd.ms-mediapackage": {
        source: "iana"
      },
      "text/vnd.net2phone.commcenter.command": {
        source: "iana"
      },
      "text/vnd.radisys.msml-basic-layout": {
        source: "iana"
      },
      "text/vnd.senx.warpscript": {
        source: "iana"
      },
      "text/vnd.si.uricatalogue": {
        source: "iana"
      },
      "text/vnd.sosi": {
        source: "iana"
      },
      "text/vnd.sun.j2me.app-descriptor": {
        source: "iana",
        charset: "UTF-8",
        extensions: ["jad"]
      },
      "text/vnd.trolltech.linguist": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/vnd.wap.si": {
        source: "iana"
      },
      "text/vnd.wap.sl": {
        source: "iana"
      },
      "text/vnd.wap.wml": {
        source: "iana",
        extensions: ["wml"]
      },
      "text/vnd.wap.wmlscript": {
        source: "iana",
        extensions: ["wmls"]
      },
      "text/vtt": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["vtt"]
      },
      "text/x-asm": {
        source: "apache",
        extensions: ["s", "asm"]
      },
      "text/x-c": {
        source: "apache",
        extensions: ["c", "cc", "cxx", "cpp", "h", "hh", "dic"]
      },
      "text/x-component": {
        source: "nginx",
        extensions: ["htc"]
      },
      "text/x-fortran": {
        source: "apache",
        extensions: ["f", "for", "f77", "f90"]
      },
      "text/x-gwt-rpc": {
        compressible: true
      },
      "text/x-handlebars-template": {
        extensions: ["hbs"]
      },
      "text/x-java-source": {
        source: "apache",
        extensions: ["java"]
      },
      "text/x-jquery-tmpl": {
        compressible: true
      },
      "text/x-lua": {
        extensions: ["lua"]
      },
      "text/x-markdown": {
        compressible: true,
        extensions: ["mkd"]
      },
      "text/x-nfo": {
        source: "apache",
        extensions: ["nfo"]
      },
      "text/x-opml": {
        source: "apache",
        extensions: ["opml"]
      },
      "text/x-org": {
        compressible: true,
        extensions: ["org"]
      },
      "text/x-pascal": {
        source: "apache",
        extensions: ["p", "pas"]
      },
      "text/x-processing": {
        compressible: true,
        extensions: ["pde"]
      },
      "text/x-sass": {
        extensions: ["sass"]
      },
      "text/x-scss": {
        extensions: ["scss"]
      },
      "text/x-setext": {
        source: "apache",
        extensions: ["etx"]
      },
      "text/x-sfv": {
        source: "apache",
        extensions: ["sfv"]
      },
      "text/x-suse-ymp": {
        compressible: true,
        extensions: ["ymp"]
      },
      "text/x-uuencode": {
        source: "apache",
        extensions: ["uu"]
      },
      "text/x-vcalendar": {
        source: "apache",
        extensions: ["vcs"]
      },
      "text/x-vcard": {
        source: "apache",
        extensions: ["vcf"]
      },
      "text/xml": {
        source: "iana",
        compressible: true,
        extensions: ["xml"]
      },
      "text/xml-external-parsed-entity": {
        source: "iana"
      },
      "text/yaml": {
        compressible: true,
        extensions: ["yaml", "yml"]
      },
      "video/1d-interleaved-parityfec": {
        source: "iana"
      },
      "video/3gpp": {
        source: "iana",
        extensions: ["3gp", "3gpp"]
      },
      "video/3gpp-tt": {
        source: "iana"
      },
      "video/3gpp2": {
        source: "iana",
        extensions: ["3g2"]
      },
      "video/av1": {
        source: "iana"
      },
      "video/bmpeg": {
        source: "iana"
      },
      "video/bt656": {
        source: "iana"
      },
      "video/celb": {
        source: "iana"
      },
      "video/dv": {
        source: "iana"
      },
      "video/encaprtp": {
        source: "iana"
      },
      "video/ffv1": {
        source: "iana"
      },
      "video/flexfec": {
        source: "iana"
      },
      "video/h261": {
        source: "iana",
        extensions: ["h261"]
      },
      "video/h263": {
        source: "iana",
        extensions: ["h263"]
      },
      "video/h263-1998": {
        source: "iana"
      },
      "video/h263-2000": {
        source: "iana"
      },
      "video/h264": {
        source: "iana",
        extensions: ["h264"]
      },
      "video/h264-rcdo": {
        source: "iana"
      },
      "video/h264-svc": {
        source: "iana"
      },
      "video/h265": {
        source: "iana"
      },
      "video/iso.segment": {
        source: "iana",
        extensions: ["m4s"]
      },
      "video/jpeg": {
        source: "iana",
        extensions: ["jpgv"]
      },
      "video/jpeg2000": {
        source: "iana"
      },
      "video/jpm": {
        source: "apache",
        extensions: ["jpm", "jpgm"]
      },
      "video/jxsv": {
        source: "iana"
      },
      "video/mj2": {
        source: "iana",
        extensions: ["mj2", "mjp2"]
      },
      "video/mp1s": {
        source: "iana"
      },
      "video/mp2p": {
        source: "iana"
      },
      "video/mp2t": {
        source: "iana",
        extensions: ["ts"]
      },
      "video/mp4": {
        source: "iana",
        compressible: false,
        extensions: ["mp4", "mp4v", "mpg4"]
      },
      "video/mp4v-es": {
        source: "iana"
      },
      "video/mpeg": {
        source: "iana",
        compressible: false,
        extensions: ["mpeg", "mpg", "mpe", "m1v", "m2v"]
      },
      "video/mpeg4-generic": {
        source: "iana"
      },
      "video/mpv": {
        source: "iana"
      },
      "video/nv": {
        source: "iana"
      },
      "video/ogg": {
        source: "iana",
        compressible: false,
        extensions: ["ogv"]
      },
      "video/parityfec": {
        source: "iana"
      },
      "video/pointer": {
        source: "iana"
      },
      "video/quicktime": {
        source: "iana",
        compressible: false,
        extensions: ["qt", "mov"]
      },
      "video/raptorfec": {
        source: "iana"
      },
      "video/raw": {
        source: "iana"
      },
      "video/rtp-enc-aescm128": {
        source: "iana"
      },
      "video/rtploopback": {
        source: "iana"
      },
      "video/rtx": {
        source: "iana"
      },
      "video/scip": {
        source: "iana"
      },
      "video/smpte291": {
        source: "iana"
      },
      "video/smpte292m": {
        source: "iana"
      },
      "video/ulpfec": {
        source: "iana"
      },
      "video/vc1": {
        source: "iana"
      },
      "video/vc2": {
        source: "iana"
      },
      "video/vnd.cctv": {
        source: "iana"
      },
      "video/vnd.dece.hd": {
        source: "iana",
        extensions: ["uvh", "uvvh"]
      },
      "video/vnd.dece.mobile": {
        source: "iana",
        extensions: ["uvm", "uvvm"]
      },
      "video/vnd.dece.mp4": {
        source: "iana"
      },
      "video/vnd.dece.pd": {
        source: "iana",
        extensions: ["uvp", "uvvp"]
      },
      "video/vnd.dece.sd": {
        source: "iana",
        extensions: ["uvs", "uvvs"]
      },
      "video/vnd.dece.video": {
        source: "iana",
        extensions: ["uvv", "uvvv"]
      },
      "video/vnd.directv.mpeg": {
        source: "iana"
      },
      "video/vnd.directv.mpeg-tts": {
        source: "iana"
      },
      "video/vnd.dlna.mpeg-tts": {
        source: "iana"
      },
      "video/vnd.dvb.file": {
        source: "iana",
        extensions: ["dvb"]
      },
      "video/vnd.fvt": {
        source: "iana",
        extensions: ["fvt"]
      },
      "video/vnd.hns.video": {
        source: "iana"
      },
      "video/vnd.iptvforum.1dparityfec-1010": {
        source: "iana"
      },
      "video/vnd.iptvforum.1dparityfec-2005": {
        source: "iana"
      },
      "video/vnd.iptvforum.2dparityfec-1010": {
        source: "iana"
      },
      "video/vnd.iptvforum.2dparityfec-2005": {
        source: "iana"
      },
      "video/vnd.iptvforum.ttsavc": {
        source: "iana"
      },
      "video/vnd.iptvforum.ttsmpeg2": {
        source: "iana"
      },
      "video/vnd.motorola.video": {
        source: "iana"
      },
      "video/vnd.motorola.videop": {
        source: "iana"
      },
      "video/vnd.mpegurl": {
        source: "iana",
        extensions: ["mxu", "m4u"]
      },
      "video/vnd.ms-playready.media.pyv": {
        source: "iana",
        extensions: ["pyv"]
      },
      "video/vnd.nokia.interleaved-multimedia": {
        source: "iana"
      },
      "video/vnd.nokia.mp4vr": {
        source: "iana"
      },
      "video/vnd.nokia.videovoip": {
        source: "iana"
      },
      "video/vnd.objectvideo": {
        source: "iana"
      },
      "video/vnd.radgamettools.bink": {
        source: "iana"
      },
      "video/vnd.radgamettools.smacker": {
        source: "iana"
      },
      "video/vnd.sealed.mpeg1": {
        source: "iana"
      },
      "video/vnd.sealed.mpeg4": {
        source: "iana"
      },
      "video/vnd.sealed.swf": {
        source: "iana"
      },
      "video/vnd.sealedmedia.softseal.mov": {
        source: "iana"
      },
      "video/vnd.uvvu.mp4": {
        source: "iana",
        extensions: ["uvu", "uvvu"]
      },
      "video/vnd.vivo": {
        source: "iana",
        extensions: ["viv"]
      },
      "video/vnd.youtube.yt": {
        source: "iana"
      },
      "video/vp8": {
        source: "iana"
      },
      "video/vp9": {
        source: "iana"
      },
      "video/webm": {
        source: "apache",
        compressible: false,
        extensions: ["webm"]
      },
      "video/x-f4v": {
        source: "apache",
        extensions: ["f4v"]
      },
      "video/x-fli": {
        source: "apache",
        extensions: ["fli"]
      },
      "video/x-flv": {
        source: "apache",
        compressible: false,
        extensions: ["flv"]
      },
      "video/x-m4v": {
        source: "apache",
        extensions: ["m4v"]
      },
      "video/x-matroska": {
        source: "apache",
        compressible: false,
        extensions: ["mkv", "mk3d", "mks"]
      },
      "video/x-mng": {
        source: "apache",
        extensions: ["mng"]
      },
      "video/x-ms-asf": {
        source: "apache",
        extensions: ["asf", "asx"]
      },
      "video/x-ms-vob": {
        source: "apache",
        extensions: ["vob"]
      },
      "video/x-ms-wm": {
        source: "apache",
        extensions: ["wm"]
      },
      "video/x-ms-wmv": {
        source: "apache",
        compressible: false,
        extensions: ["wmv"]
      },
      "video/x-ms-wmx": {
        source: "apache",
        extensions: ["wmx"]
      },
      "video/x-ms-wvx": {
        source: "apache",
        extensions: ["wvx"]
      },
      "video/x-msvideo": {
        source: "apache",
        extensions: ["avi"]
      },
      "video/x-sgi-movie": {
        source: "apache",
        extensions: ["movie"]
      },
      "video/x-smv": {
        source: "apache",
        extensions: ["smv"]
      },
      "x-conference/x-cooltalk": {
        source: "apache",
        extensions: ["ice"]
      },
      "x-shader/x-fragment": {
        compressible: true
      },
      "x-shader/x-vertex": {
        compressible: true
      }
    };
  }
});

// node_modules/mime-db/index.js
var require_mime_db = __commonJS({
  "node_modules/mime-db/index.js"(exports2, module2) {
    module2.exports = require_db();
  }
});

// node_modules/mime-types/index.js
var require_mime_types = __commonJS({
  "node_modules/mime-types/index.js"(exports2) {
    "use strict";
    var db = require_mime_db();
    var extname = require("path").extname;
    var EXTRACT_TYPE_REGEXP = /^\s*([^;\s]*)(?:;|\s|$)/;
    var TEXT_TYPE_REGEXP = /^text\//i;
    exports2.charset = charset;
    exports2.charsets = { lookup: charset };
    exports2.contentType = contentType;
    exports2.extension = extension;
    exports2.extensions = /* @__PURE__ */ Object.create(null);
    exports2.lookup = lookup;
    exports2.types = /* @__PURE__ */ Object.create(null);
    populateMaps(exports2.extensions, exports2.types);
    function charset(type) {
      if (!type || typeof type !== "string") {
        return false;
      }
      var match = EXTRACT_TYPE_REGEXP.exec(type);
      var mime = match && db[match[1].toLowerCase()];
      if (mime && mime.charset) {
        return mime.charset;
      }
      if (match && TEXT_TYPE_REGEXP.test(match[1])) {
        return "UTF-8";
      }
      return false;
    }
    function contentType(str) {
      if (!str || typeof str !== "string") {
        return false;
      }
      var mime = str.indexOf("/") === -1 ? exports2.lookup(str) : str;
      if (!mime) {
        return false;
      }
      if (mime.indexOf("charset") === -1) {
        var charset2 = exports2.charset(mime);
        if (charset2) mime += "; charset=" + charset2.toLowerCase();
      }
      return mime;
    }
    function extension(type) {
      if (!type || typeof type !== "string") {
        return false;
      }
      var match = EXTRACT_TYPE_REGEXP.exec(type);
      var exts = match && exports2.extensions[match[1].toLowerCase()];
      if (!exts || !exts.length) {
        return false;
      }
      return exts[0];
    }
    function lookup(path) {
      if (!path || typeof path !== "string") {
        return false;
      }
      var extension2 = extname("x." + path).toLowerCase().substr(1);
      if (!extension2) {
        return false;
      }
      return exports2.types[extension2] || false;
    }
    function populateMaps(extensions, types) {
      var preference = ["nginx", "apache", void 0, "iana"];
      Object.keys(db).forEach(function forEachMimeType(type) {
        var mime = db[type];
        var exts = mime.extensions;
        if (!exts || !exts.length) {
          return;
        }
        extensions[type] = exts;
        for (var i = 0; i < exts.length; i++) {
          var extension2 = exts[i];
          if (types[extension2]) {
            var from = preference.indexOf(db[types[extension2]].source);
            var to = preference.indexOf(mime.source);
            if (types[extension2] !== "application/octet-stream" && (from > to || from === to && types[extension2].substr(0, 12) === "application/")) {
              continue;
            }
          }
          types[extension2] = type;
        }
      });
    }
  }
});

// node_modules/accepts/index.js
var require_accepts = __commonJS({
  "node_modules/accepts/index.js"(exports2, module2) {
    "use strict";
    var Negotiator = require_negotiator();
    var mime = require_mime_types();
    module2.exports = Accepts;
    function Accepts(req) {
      if (!(this instanceof Accepts)) {
        return new Accepts(req);
      }
      this.headers = req.headers;
      this.negotiator = new Negotiator(req);
    }
    Accepts.prototype.type = Accepts.prototype.types = function(types_) {
      var types = types_;
      if (types && !Array.isArray(types)) {
        types = new Array(arguments.length);
        for (var i = 0; i < types.length; i++) {
          types[i] = arguments[i];
        }
      }
      if (!types || types.length === 0) {
        return this.negotiator.mediaTypes();
      }
      if (!this.headers.accept) {
        return types[0];
      }
      var mimes = types.map(extToMime);
      var accepts = this.negotiator.mediaTypes(mimes.filter(validMime));
      var first = accepts[0];
      return first ? types[mimes.indexOf(first)] : false;
    };
    Accepts.prototype.encoding = Accepts.prototype.encodings = function(encodings_) {
      var encodings = encodings_;
      if (encodings && !Array.isArray(encodings)) {
        encodings = new Array(arguments.length);
        for (var i = 0; i < encodings.length; i++) {
          encodings[i] = arguments[i];
        }
      }
      if (!encodings || encodings.length === 0) {
        return this.negotiator.encodings();
      }
      return this.negotiator.encodings(encodings)[0] || false;
    };
    Accepts.prototype.charset = Accepts.prototype.charsets = function(charsets_) {
      var charsets = charsets_;
      if (charsets && !Array.isArray(charsets)) {
        charsets = new Array(arguments.length);
        for (var i = 0; i < charsets.length; i++) {
          charsets[i] = arguments[i];
        }
      }
      if (!charsets || charsets.length === 0) {
        return this.negotiator.charsets();
      }
      return this.negotiator.charsets(charsets)[0] || false;
    };
    Accepts.prototype.lang = Accepts.prototype.langs = Accepts.prototype.language = Accepts.prototype.languages = function(languages_) {
      var languages = languages_;
      if (languages && !Array.isArray(languages)) {
        languages = new Array(arguments.length);
        for (var i = 0; i < languages.length; i++) {
          languages[i] = arguments[i];
        }
      }
      if (!languages || languages.length === 0) {
        return this.negotiator.languages();
      }
      return this.negotiator.languages(languages)[0] || false;
    };
    function extToMime(type) {
      return type.indexOf("/") === -1 ? mime.lookup(type) : type;
    }
    function validMime(type) {
      return typeof type === "string";
    }
  }
});

// node_modules/engine.io/lib/transports/polling.js
var require_polling = __commonJS({
  "node_modules/engine.io/lib/transports/polling.js"(exports2, module2) {
    var Transport = require_transport();
    var parser = require_lib();
    var zlib = require("zlib");
    var accepts = require_accepts();
    var util = require("util");
    var debug = require_src()("engine:polling");
    var compressionMethods = {
      gzip: zlib.createGzip,
      deflate: zlib.createDeflate
    };
    module2.exports = Polling;
    function Polling(req) {
      Transport.call(this, req);
      this.closeTimeout = 30 * 1e3;
      this.maxHttpBufferSize = null;
      this.httpCompression = null;
    }
    util.inherits(Polling, Transport);
    Polling.prototype.name = "polling";
    Polling.prototype.onRequest = function(req) {
      var res = req.res;
      if ("GET" === req.method) {
        this.onPollRequest(req, res);
      } else if ("POST" === req.method) {
        this.onDataRequest(req, res);
      } else {
        res.writeHead(500);
        res.end();
      }
    };
    Polling.prototype.onPollRequest = function(req, res) {
      if (this.req) {
        debug("request overlap");
        this.onError("overlap from client");
        res.writeHead(500);
        res.end();
        return;
      }
      debug("setting request");
      this.req = req;
      this.res = res;
      var self = this;
      function onClose() {
        self.onError("poll connection closed prematurely");
      }
      function cleanup() {
        req.removeListener("close", onClose);
        self.req = self.res = null;
      }
      req.cleanup = cleanup;
      req.on("close", onClose);
      this.writable = true;
      this.emit("drain");
      if (this.writable && this.shouldClose) {
        debug("triggering empty send to append close packet");
        this.send([{ type: "noop" }]);
      }
    };
    Polling.prototype.onDataRequest = function(req, res) {
      if (this.dataReq) {
        this.onError("data request overlap from client");
        res.writeHead(500);
        res.end();
        return;
      }
      var isBinary = "application/octet-stream" === req.headers["content-type"];
      this.dataReq = req;
      this.dataRes = res;
      var chunks = isBinary ? Buffer.concat([]) : "";
      var self = this;
      function cleanup() {
        req.removeListener("data", onData);
        req.removeListener("end", onEnd);
        req.removeListener("close", onClose);
        self.dataReq = self.dataRes = chunks = null;
      }
      function onClose() {
        cleanup();
        self.onError("data request connection closed prematurely");
      }
      function onData(data) {
        var contentLength;
        if (isBinary) {
          chunks = Buffer.concat([chunks, data]);
          contentLength = chunks.length;
        } else {
          chunks += data;
          contentLength = Buffer.byteLength(chunks);
        }
        if (contentLength > self.maxHttpBufferSize) {
          chunks = isBinary ? Buffer.concat([]) : "";
          req.connection.destroy();
        }
      }
      function onEnd() {
        self.onData(chunks);
        var headers = {
          // text/html is required instead of text/plain to avoid an
          // unwanted download dialog on certain user-agents (GH-43)
          "Content-Type": "text/html",
          "Content-Length": 2
        };
        res.writeHead(200, self.headers(req, headers));
        res.end("ok");
        cleanup();
      }
      req.on("close", onClose);
      if (!isBinary) req.setEncoding("utf8");
      req.on("data", onData);
      req.on("end", onEnd);
    };
    Polling.prototype.onData = function(data) {
      debug('received "%s"', data);
      var self = this;
      var callback = function(packet) {
        if ("close" === packet.type) {
          debug("got xhr close packet");
          self.onClose();
          return false;
        }
        self.onPacket(packet);
      };
      parser.decodePayload(data, callback);
    };
    Polling.prototype.onClose = function() {
      if (this.writable) {
        this.send([{ type: "noop" }]);
      }
      Transport.prototype.onClose.call(this);
    };
    Polling.prototype.send = function(packets) {
      this.writable = false;
      if (this.shouldClose) {
        debug("appending close packet to payload");
        packets.push({ type: "close" });
        this.shouldClose();
        this.shouldClose = null;
      }
      var self = this;
      parser.encodePayload(packets, this.supportsBinary, function(data) {
        var compress = packets.some(function(packet) {
          return packet.options && packet.options.compress;
        });
        self.write(data, { compress });
      });
    };
    Polling.prototype.write = function(data, options) {
      debug('writing "%s"', data);
      var self = this;
      this.doWrite(data, options, function() {
        self.req.cleanup();
      });
    };
    Polling.prototype.doWrite = function(data, options, callback) {
      var self = this;
      var isString = typeof data === "string";
      var contentType = isString ? "text/plain; charset=UTF-8" : "application/octet-stream";
      var headers = {
        "Content-Type": contentType
      };
      if (!this.httpCompression || !options.compress) {
        respond(data);
        return;
      }
      var len = isString ? Buffer.byteLength(data) : data.length;
      if (len < this.httpCompression.threshold) {
        respond(data);
        return;
      }
      var encoding = accepts(this.req).encodings(["gzip", "deflate"]);
      if (!encoding) {
        respond(data);
        return;
      }
      this.compress(data, encoding, function(err, data2) {
        if (err) {
          self.res.writeHead(500);
          self.res.end();
          callback(err);
          return;
        }
        headers["Content-Encoding"] = encoding;
        respond(data2);
      });
      function respond(data2) {
        headers["Content-Length"] = "string" === typeof data2 ? Buffer.byteLength(data2) : data2.length;
        self.res.writeHead(200, self.headers(self.req, headers));
        self.res.end(data2);
        callback();
      }
    };
    Polling.prototype.compress = function(data, encoding, callback) {
      debug("compressing");
      var buffers = [];
      var nread = 0;
      compressionMethods[encoding](this.httpCompression).on("error", callback).on("data", function(chunk) {
        buffers.push(chunk);
        nread += chunk.length;
      }).on("end", function() {
        callback(null, Buffer.concat(buffers, nread));
      }).end(data);
    };
    Polling.prototype.doClose = function(fn) {
      debug("closing");
      var self = this;
      var closeTimeoutTimer;
      if (this.dataReq) {
        debug("aborting ongoing data request");
        this.dataReq.destroy();
      }
      if (this.writable) {
        debug("transport writable - closing right away");
        this.send([{ type: "close" }]);
        onClose();
      } else if (this.discarded) {
        debug("transport discarded - closing right away");
        onClose();
      } else {
        debug("transport not writable - buffering orderly close");
        this.shouldClose = onClose;
        closeTimeoutTimer = setTimeout(onClose, this.closeTimeout);
      }
      function onClose() {
        clearTimeout(closeTimeoutTimer);
        fn();
        self.onClose();
      }
    };
    Polling.prototype.headers = function(req, headers) {
      headers = headers || {};
      var ua = req.headers["user-agent"];
      if (ua && (~ua.indexOf(";MSIE") || ~ua.indexOf("Trident/"))) {
        headers["X-XSS-Protection"] = "0";
      }
      this.emit("headers", headers);
      return headers;
    };
  }
});

// node_modules/engine.io/lib/transports/polling-xhr.js
var require_polling_xhr = __commonJS({
  "node_modules/engine.io/lib/transports/polling-xhr.js"(exports2, module2) {
    var Polling = require_polling();
    var util = require("util");
    module2.exports = XHR;
    function XHR(req) {
      Polling.call(this, req);
    }
    util.inherits(XHR, Polling);
    XHR.prototype.onRequest = function(req) {
      if ("OPTIONS" === req.method) {
        var res = req.res;
        var headers = this.headers(req);
        headers["Access-Control-Allow-Headers"] = "Content-Type";
        res.writeHead(200, headers);
        res.end();
      } else {
        Polling.prototype.onRequest.call(this, req);
      }
    };
    XHR.prototype.headers = function(req, headers) {
      headers = headers || {};
      if (req.headers.origin) {
        headers["Access-Control-Allow-Credentials"] = "true";
        headers["Access-Control-Allow-Origin"] = req.headers.origin;
      } else {
        headers["Access-Control-Allow-Origin"] = "*";
      }
      return Polling.prototype.headers.call(this, req, headers);
    };
  }
});

// node_modules/engine.io/lib/transports/polling-jsonp.js
var require_polling_jsonp = __commonJS({
  "node_modules/engine.io/lib/transports/polling-jsonp.js"(exports2, module2) {
    var Polling = require_polling();
    var qs = require("querystring");
    var rDoubleSlashes = /\\\\n/g;
    var rSlashes = /(\\)?\\n/g;
    var util = require("util");
    module2.exports = JSONP;
    function JSONP(req) {
      Polling.call(this, req);
      this.head = "___eio[" + (req._query.j || "").replace(/[^0-9]/g, "") + "](";
      this.foot = ");";
    }
    util.inherits(JSONP, Polling);
    JSONP.prototype.onData = function(data) {
      data = qs.parse(data).d;
      if ("string" === typeof data) {
        data = data.replace(rSlashes, function(match, slashes) {
          return slashes ? match : "\n";
        });
        Polling.prototype.onData.call(this, data.replace(rDoubleSlashes, "\\n"));
      }
    };
    JSONP.prototype.doWrite = function(data, options, callback) {
      var js = JSON.stringify(data).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
      data = this.head + js + this.foot;
      Polling.prototype.doWrite.call(this, data, options, callback);
    };
  }
});

// node_modules/engine.io/lib/transports/websocket.js
var require_websocket = __commonJS({
  "node_modules/engine.io/lib/transports/websocket.js"(exports2, module2) {
    var Transport = require_transport();
    var parser = require_lib();
    var util = require("util");
    var debug = require_src()("engine:ws");
    module2.exports = WebSocket;
    function WebSocket(req) {
      Transport.call(this, req);
      var self = this;
      this.socket = req.websocket;
      this.socket.on("message", this.onData.bind(this));
      this.socket.once("close", this.onClose.bind(this));
      this.socket.on("error", this.onError.bind(this));
      this.socket.on("headers", onHeaders);
      this.writable = true;
      this.perMessageDeflate = null;
      function onHeaders(headers) {
        self.emit("headers", headers);
      }
    }
    util.inherits(WebSocket, Transport);
    WebSocket.prototype.name = "websocket";
    WebSocket.prototype.handlesUpgrades = true;
    WebSocket.prototype.supportsFraming = true;
    WebSocket.prototype.onData = function(data) {
      debug('received "%s"', data);
      Transport.prototype.onData.call(this, data);
    };
    WebSocket.prototype.send = function(packets) {
      var self = this;
      for (var i = 0; i < packets.length; i++) {
        var packet = packets[i];
        parser.encodePacket(packet, self.supportsBinary, send);
      }
      function send(data) {
        debug('writing "%s"', data);
        var opts = {};
        if (packet.options) {
          opts.compress = packet.options.compress;
        }
        if (self.perMessageDeflate) {
          var len = "string" === typeof data ? Buffer.byteLength(data) : data.length;
          if (len < self.perMessageDeflate.threshold) {
            opts.compress = false;
          }
        }
        self.writable = false;
        self.socket.send(data, opts, onEnd);
      }
      function onEnd(err) {
        if (err) return self.onError("write error", err.stack);
        self.writable = true;
        self.emit("drain");
      }
    };
    WebSocket.prototype.doClose = function(fn) {
      debug("closing");
      this.socket.close();
      fn && fn();
    };
  }
});

// node_modules/engine.io/lib/transports/index.js
var require_transports = __commonJS({
  "node_modules/engine.io/lib/transports/index.js"(exports2, module2) {
    var XHR = require_polling_xhr();
    var JSONP = require_polling_jsonp();
    module2.exports = exports2 = {
      polling,
      websocket: require_websocket()
    };
    exports2.polling.upgradesTo = ["websocket"];
    function polling(req) {
      if ("string" === typeof req._query.j) {
        return new JSONP(req);
      } else {
        return new XHR(req);
      }
    }
  }
});

// node_modules/engine.io/lib/socket.js
var require_socket = __commonJS({
  "node_modules/engine.io/lib/socket.js"(exports2, module2) {
    var EventEmitter = require("events").EventEmitter;
    var util = require("util");
    var debug = require_src()("engine:socket");
    module2.exports = Socket;
    function Socket(id, server, transport, req) {
      this.id = id;
      this.server = server;
      this.upgrading = false;
      this.upgraded = false;
      this.readyState = "opening";
      this.writeBuffer = [];
      this.packetsFn = [];
      this.sentCallbackFn = [];
      this.cleanupFn = [];
      this.request = req;
      if (req.websocket && req.websocket._socket) {
        this.remoteAddress = req.websocket._socket.remoteAddress;
      } else {
        this.remoteAddress = req.connection.remoteAddress;
      }
      this.checkIntervalTimer = null;
      this.upgradeTimeoutTimer = null;
      this.pingTimeoutTimer = null;
      this.setTransport(transport);
      this.onOpen();
    }
    util.inherits(Socket, EventEmitter);
    Socket.prototype.onOpen = function() {
      this.readyState = "open";
      this.transport.sid = this.id;
      this.sendPacket("open", JSON.stringify({
        sid: this.id,
        upgrades: this.getAvailableUpgrades(),
        pingInterval: this.server.pingInterval,
        pingTimeout: this.server.pingTimeout
      }));
      if (this.server.initialPacket) {
        this.sendPacket("message", this.server.initialPacket);
      }
      this.emit("open");
      this.setPingTimeout();
    };
    Socket.prototype.onPacket = function(packet) {
      if ("open" === this.readyState) {
        debug("packet");
        this.emit("packet", packet);
        this.setPingTimeout();
        switch (packet.type) {
          case "ping":
            debug("got ping");
            this.sendPacket("pong");
            this.emit("heartbeat");
            break;
          case "error":
            this.onClose("parse error");
            break;
          case "message":
            this.emit("data", packet.data);
            this.emit("message", packet.data);
            break;
        }
      } else {
        debug("packet received with closed socket");
      }
    };
    Socket.prototype.onError = function(err) {
      debug("transport error");
      this.onClose("transport error", err);
    };
    Socket.prototype.setPingTimeout = function() {
      var self = this;
      clearTimeout(self.pingTimeoutTimer);
      self.pingTimeoutTimer = setTimeout(function() {
        self.onClose("ping timeout");
      }, self.server.pingInterval + self.server.pingTimeout);
    };
    Socket.prototype.setTransport = function(transport) {
      var onError = this.onError.bind(this);
      var onPacket = this.onPacket.bind(this);
      var flush = this.flush.bind(this);
      var onClose = this.onClose.bind(this, "transport close");
      this.transport = transport;
      this.transport.once("error", onError);
      this.transport.on("packet", onPacket);
      this.transport.on("drain", flush);
      this.transport.once("close", onClose);
      this.setupSendCallback();
      this.cleanupFn.push(function() {
        transport.removeListener("error", onError);
        transport.removeListener("packet", onPacket);
        transport.removeListener("drain", flush);
        transport.removeListener("close", onClose);
      });
    };
    Socket.prototype.maybeUpgrade = function(transport) {
      debug(
        'might upgrade socket transport from "%s" to "%s"',
        this.transport.name,
        transport.name
      );
      this.upgrading = true;
      var self = this;
      self.upgradeTimeoutTimer = setTimeout(function() {
        debug("client did not complete upgrade - closing transport");
        cleanup();
        if ("open" === transport.readyState) {
          transport.close();
        }
      }, this.server.upgradeTimeout);
      function onPacket(packet) {
        if ("ping" === packet.type && "probe" === packet.data) {
          transport.send([{ type: "pong", data: "probe" }]);
          self.emit("upgrading", transport);
          clearInterval(self.checkIntervalTimer);
          self.checkIntervalTimer = setInterval(check, 100);
        } else if ("upgrade" === packet.type && self.readyState !== "closed") {
          debug("got upgrade packet - upgrading");
          cleanup();
          self.transport.discard();
          self.upgraded = true;
          self.clearTransport();
          self.setTransport(transport);
          self.emit("upgrade", transport);
          self.setPingTimeout();
          self.flush();
          if (self.readyState === "closing") {
            transport.close(function() {
              self.onClose("forced close");
            });
          }
        } else {
          cleanup();
          transport.close();
        }
      }
      function check() {
        if ("polling" === self.transport.name && self.transport.writable) {
          debug("writing a noop packet to polling for fast upgrade");
          self.transport.send([{ type: "noop" }]);
        }
      }
      function cleanup() {
        self.upgrading = false;
        clearInterval(self.checkIntervalTimer);
        self.checkIntervalTimer = null;
        clearTimeout(self.upgradeTimeoutTimer);
        self.upgradeTimeoutTimer = null;
        transport.removeListener("packet", onPacket);
        transport.removeListener("close", onTransportClose);
        transport.removeListener("error", onError);
        self.removeListener("close", onClose);
      }
      function onError(err) {
        debug("client did not complete upgrade - %s", err);
        cleanup();
        transport.close();
        transport = null;
      }
      function onTransportClose() {
        onError("transport closed");
      }
      function onClose() {
        onError("socket closed");
      }
      transport.on("packet", onPacket);
      transport.once("close", onTransportClose);
      transport.once("error", onError);
      self.once("close", onClose);
    };
    Socket.prototype.clearTransport = function() {
      var cleanup;
      var toCleanUp = this.cleanupFn.length;
      for (var i = 0; i < toCleanUp; i++) {
        cleanup = this.cleanupFn.shift();
        cleanup();
      }
      this.transport.on("error", function() {
        debug("error triggered by discarded transport");
      });
      this.transport.close();
      clearTimeout(this.pingTimeoutTimer);
    };
    Socket.prototype.onClose = function(reason, description) {
      if ("closed" !== this.readyState) {
        this.readyState = "closed";
        clearTimeout(this.pingTimeoutTimer);
        clearInterval(this.checkIntervalTimer);
        this.checkIntervalTimer = null;
        clearTimeout(this.upgradeTimeoutTimer);
        var self = this;
        process.nextTick(function() {
          self.writeBuffer = [];
        });
        this.packetsFn = [];
        this.sentCallbackFn = [];
        this.clearTransport();
        this.emit("close", reason, description);
      }
    };
    Socket.prototype.setupSendCallback = function() {
      var self = this;
      this.transport.on("drain", onDrain);
      this.cleanupFn.push(function() {
        self.transport.removeListener("drain", onDrain);
      });
      function onDrain() {
        if (self.sentCallbackFn.length > 0) {
          var seqFn = self.sentCallbackFn.splice(0, 1)[0];
          if ("function" === typeof seqFn) {
            debug("executing send callback");
            seqFn(self.transport);
          } else if (Array.isArray(seqFn)) {
            debug("executing batch send callback");
            for (var l = seqFn.length, i = 0; i < l; i++) {
              if ("function" === typeof seqFn[i]) {
                seqFn[i](self.transport);
              }
            }
          }
        }
      }
    };
    Socket.prototype.send = Socket.prototype.write = function(data, options, callback) {
      this.sendPacket("message", data, options, callback);
      return this;
    };
    Socket.prototype.sendPacket = function(type, data, options, callback) {
      if ("function" === typeof options) {
        callback = options;
        options = null;
      }
      options = options || {};
      options.compress = false !== options.compress;
      if ("closing" !== this.readyState && "closed" !== this.readyState) {
        debug('sending packet "%s" (%s)', type, data);
        var packet = {
          type,
          options
        };
        if (data) packet.data = data;
        this.emit("packetCreate", packet);
        this.writeBuffer.push(packet);
        if (callback) this.packetsFn.push(callback);
        this.flush();
      }
    };
    Socket.prototype.flush = function() {
      if ("closed" !== this.readyState && this.transport.writable && this.writeBuffer.length) {
        debug("flushing buffer to transport");
        this.emit("flush", this.writeBuffer);
        this.server.emit("flush", this, this.writeBuffer);
        var wbuf = this.writeBuffer;
        this.writeBuffer = [];
        if (!this.transport.supportsFraming) {
          this.sentCallbackFn.push(this.packetsFn);
        } else {
          this.sentCallbackFn.push.apply(this.sentCallbackFn, this.packetsFn);
        }
        this.packetsFn = [];
        this.transport.send(wbuf);
        this.emit("drain");
        this.server.emit("drain", this);
      }
    };
    Socket.prototype.getAvailableUpgrades = function() {
      var availableUpgrades = [];
      var allUpgrades = this.server.upgrades(this.transport.name);
      for (var i = 0, l = allUpgrades.length; i < l; ++i) {
        var upg = allUpgrades[i];
        if (this.server.transports.indexOf(upg) !== -1) {
          availableUpgrades.push(upg);
        }
      }
      return availableUpgrades;
    };
    Socket.prototype.close = function(discard) {
      if ("open" !== this.readyState) return;
      this.readyState = "closing";
      if (this.writeBuffer.length) {
        this.once("drain", this.closeTransport.bind(this, discard));
        return;
      }
      this.closeTransport(discard);
    };
    Socket.prototype.closeTransport = function(discard) {
      if (discard) this.transport.discard();
      this.transport.close(this.onClose.bind(this, "forced close"));
    };
  }
});

// node_modules/cookie/index.js
var require_cookie = __commonJS({
  "node_modules/cookie/index.js"(exports2) {
    "use strict";
    exports2.parse = parse;
    exports2.serialize = serialize;
    var decode = decodeURIComponent;
    var encode = encodeURIComponent;
    var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
    function parse(str, options) {
      if (typeof str !== "string") {
        throw new TypeError("argument str must be a string");
      }
      var obj = {};
      var opt = options || {};
      var pairs = str.split(";");
      var dec = opt.decode || decode;
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        var index = pair.indexOf("=");
        if (index < 0) {
          continue;
        }
        var key = pair.substring(0, index).trim();
        if (void 0 == obj[key]) {
          var val = pair.substring(index + 1, pair.length).trim();
          if (val[0] === '"') {
            val = val.slice(1, -1);
          }
          obj[key] = tryDecode(val, dec);
        }
      }
      return obj;
    }
    function serialize(name, val, options) {
      var opt = options || {};
      var enc = opt.encode || encode;
      if (typeof enc !== "function") {
        throw new TypeError("option encode is invalid");
      }
      if (!fieldContentRegExp.test(name)) {
        throw new TypeError("argument name is invalid");
      }
      var value = enc(val);
      if (value && !fieldContentRegExp.test(value)) {
        throw new TypeError("argument val is invalid");
      }
      var str = name + "=" + value;
      if (null != opt.maxAge) {
        var maxAge = opt.maxAge - 0;
        if (isNaN(maxAge) || !isFinite(maxAge)) {
          throw new TypeError("option maxAge is invalid");
        }
        str += "; Max-Age=" + Math.floor(maxAge);
      }
      if (opt.domain) {
        if (!fieldContentRegExp.test(opt.domain)) {
          throw new TypeError("option domain is invalid");
        }
        str += "; Domain=" + opt.domain;
      }
      if (opt.path) {
        if (!fieldContentRegExp.test(opt.path)) {
          throw new TypeError("option path is invalid");
        }
        str += "; Path=" + opt.path;
      }
      if (opt.expires) {
        if (typeof opt.expires.toUTCString !== "function") {
          throw new TypeError("option expires is invalid");
        }
        str += "; Expires=" + opt.expires.toUTCString();
      }
      if (opt.httpOnly) {
        str += "; HttpOnly";
      }
      if (opt.secure) {
        str += "; Secure";
      }
      if (opt.sameSite) {
        var sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
        switch (sameSite) {
          case true:
            str += "; SameSite=Strict";
            break;
          case "lax":
            str += "; SameSite=Lax";
            break;
          case "strict":
            str += "; SameSite=Strict";
            break;
          case "none":
            str += "; SameSite=None";
            break;
          default:
            throw new TypeError("option sameSite is invalid");
        }
      }
      return str;
    }
    function tryDecode(str, decode2) {
      try {
        return decode2(str);
      } catch (e) {
        return str;
      }
    }
  }
});

// node_modules/ws/lib/constants.js
var require_constants = __commonJS({
  "node_modules/ws/lib/constants.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      BINARY_TYPES: ["nodebuffer", "arraybuffer", "fragments"],
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      kStatusCode: Symbol("status-code"),
      kWebSocket: Symbol("websocket"),
      EMPTY_BUFFER: Buffer.alloc(0),
      NOOP: () => {
      }
    };
  }
});

// node_modules/ws/lib/buffer-util.js
var require_buffer_util = __commonJS({
  "node_modules/ws/lib/buffer-util.js"(exports2, module2) {
    "use strict";
    var { EMPTY_BUFFER } = require_constants();
    function concat(list, totalLength) {
      if (list.length === 0) return EMPTY_BUFFER;
      if (list.length === 1) return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;
      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        target.set(buf, offset);
        offset += buf.length;
      }
      if (offset < totalLength) return target.slice(0, offset);
      return target;
    }
    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }
    function _unmask(buffer, mask) {
      const length = buffer.length;
      for (let i = 0; i < length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }
    function toArrayBuffer(buf) {
      if (buf.byteLength === buf.buffer.byteLength) {
        return buf.buffer;
      }
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    }
    function toBuffer(data) {
      toBuffer.readOnly = true;
      if (Buffer.isBuffer(data)) return data;
      let buf;
      if (data instanceof ArrayBuffer) {
        buf = Buffer.from(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }
      return buf;
    }
    try {
      const bufferUtil = require("bufferutil");
      const bu = bufferUtil.BufferUtil || bufferUtil;
      module2.exports = {
        concat,
        mask(source, mask, output, offset, length) {
          if (length < 48) _mask(source, mask, output, offset, length);
          else bu.mask(source, mask, output, offset, length);
        },
        toArrayBuffer,
        toBuffer,
        unmask(buffer, mask) {
          if (buffer.length < 32) _unmask(buffer, mask);
          else bu.unmask(buffer, mask);
        }
      };
    } catch (e) {
      module2.exports = {
        concat,
        mask: _mask,
        toArrayBuffer,
        toBuffer,
        unmask: _unmask
      };
    }
  }
});

// node_modules/ws/lib/limiter.js
var require_limiter = __commonJS({
  "node_modules/ws/lib/limiter.js"(exports2, module2) {
    "use strict";
    var kDone = Symbol("kDone");
    var kRun = Symbol("kRun");
    var Limiter = class {
      /**
       * Creates a new `Limiter`.
       *
       * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
       *     to run concurrently
       */
      constructor(concurrency) {
        this[kDone] = () => {
          this.pending--;
          this[kRun]();
        };
        this.concurrency = concurrency || Infinity;
        this.jobs = [];
        this.pending = 0;
      }
      /**
       * Adds a job to the queue.
       *
       * @param {Function} job The job to run
       * @public
       */
      add(job) {
        this.jobs.push(job);
        this[kRun]();
      }
      /**
       * Removes a job from the queue and runs it if possible.
       *
       * @private
       */
      [kRun]() {
        if (this.pending === this.concurrency) return;
        if (this.jobs.length) {
          const job = this.jobs.shift();
          this.pending++;
          job(this[kDone]);
        }
      }
    };
    module2.exports = Limiter;
  }
});

// node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = __commonJS({
  "node_modules/ws/lib/permessage-deflate.js"(exports2, module2) {
    "use strict";
    var zlib = require("zlib");
    var bufferUtil = require_buffer_util();
    var Limiter = require_limiter();
    var { kStatusCode, NOOP } = require_constants();
    var TRAILER = Buffer.from([0, 0, 255, 255]);
    var kPerMessageDeflate = Symbol("permessage-deflate");
    var kTotalLength = Symbol("total-length");
    var kCallback = Symbol("callback");
    var kBuffers = Symbol("buffers");
    var kError = Symbol("error");
    var zlibLimiter;
    var PerMessageDeflate = class {
      /**
       * Creates a PerMessageDeflate instance.
       *
       * @param {Object} [options] Configuration options
       * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
       *     disabling of server context takeover
       * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
       *     acknowledge disabling of client context takeover
       * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
       *     use of a custom server window size
       * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
       *     for, or request, a custom client window size
       * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
       *     deflate
       * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
       *     inflate
       * @param {Number} [options.threshold=1024] Size (in bytes) below which
       *     messages should not be compressed
       * @param {Number} [options.concurrencyLimit=10] The number of concurrent
       *     calls to zlib
       * @param {Boolean} [isServer=false] Create the instance in either server or
       *     client mode
       * @param {Number} [maxPayload=0] The maximum allowed message length
       */
      constructor(options, isServer, maxPayload) {
        this._maxPayload = maxPayload | 0;
        this._options = options || {};
        this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
        this._isServer = !!isServer;
        this._deflate = null;
        this._inflate = null;
        this.params = null;
        if (!zlibLimiter) {
          const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
          zlibLimiter = new Limiter(concurrency);
        }
      }
      /**
       * @type {String}
       */
      static get extensionName() {
        return "permessage-deflate";
      }
      /**
       * Create an extension negotiation offer.
       *
       * @return {Object} Extension parameters
       * @public
       */
      offer() {
        const params = {};
        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }
        return params;
      }
      /**
       * Accept an extension negotiation offer/response.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Object} Accepted configuration
       * @public
       */
      accept(configurations) {
        configurations = this.normalizeParams(configurations);
        this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
        return this.params;
      }
      /**
       * Releases all resources used by the extension.
       *
       * @public
       */
      cleanup() {
        if (this._inflate) {
          this._inflate.close();
          this._inflate = null;
        }
        if (this._deflate) {
          const callback = this._deflate[kCallback];
          this._deflate.close();
          this._deflate = null;
          if (callback) {
            callback(
              new Error(
                "The deflate stream was closed while data was being processed"
              )
            );
          }
        }
      }
      /**
       *  Accept an extension negotiation offer.
       *
       * @param {Array} offers The extension negotiation offers
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsServer(offers) {
        const opts = this._options;
        const accepted = offers.find((params) => {
          if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && !params.client_max_window_bits) {
            return false;
          }
          return true;
        });
        if (!accepted) {
          throw new Error("None of the extension offers can be accepted");
        }
        if (opts.serverNoContextTakeover) {
          accepted.server_no_context_takeover = true;
        }
        if (opts.clientNoContextTakeover) {
          accepted.client_no_context_takeover = true;
        }
        if (typeof opts.serverMaxWindowBits === "number") {
          accepted.server_max_window_bits = opts.serverMaxWindowBits;
        }
        if (typeof opts.clientMaxWindowBits === "number") {
          accepted.client_max_window_bits = opts.clientMaxWindowBits;
        } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
          delete accepted.client_max_window_bits;
        }
        return accepted;
      }
      /**
       * Accept the extension negotiation response.
       *
       * @param {Array} response The extension negotiation response
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsClient(response) {
        const params = response[0];
        if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        }
        if (!params.client_max_window_bits) {
          if (typeof this._options.clientMaxWindowBits === "number") {
            params.client_max_window_bits = this._options.clientMaxWindowBits;
          }
        } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
          throw new Error(
            'Unexpected or invalid parameter "client_max_window_bits"'
          );
        }
        return params;
      }
      /**
       * Normalize parameters.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Array} The offers/response with normalized parameters
       * @private
       */
      normalizeParams(configurations) {
        configurations.forEach((params) => {
          Object.keys(params).forEach((key) => {
            let value = params[key];
            if (value.length > 1) {
              throw new Error(`Parameter "${key}" must have only a single value`);
            }
            value = value[0];
            if (key === "client_max_window_bits") {
              if (value !== true) {
                const num = +value;
                if (!Number.isInteger(num) || num < 8 || num > 15) {
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
                }
                value = num;
              } else if (!this._isServer) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else if (key === "server_max_window_bits") {
              const num = +value;
              if (!Number.isInteger(num) || num < 8 || num > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
              value = num;
            } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
              if (value !== true) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else {
              throw new Error(`Unknown parameter "${key}"`);
            }
            params[key] = value;
          });
        });
        return configurations;
      }
      /**
       * Decompress data. Concurrency limited.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      decompress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._decompress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Compress data. Concurrency limited.
       *
       * @param {Buffer} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      compress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._compress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Decompress data.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._inflate = zlib.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits
          });
          this._inflate[kPerMessageDeflate] = this;
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          this._inflate.on("error", inflateOnError);
          this._inflate.on("data", inflateOnData);
        }
        this._inflate[kCallback] = callback;
        this._inflate.write(data);
        if (fin) this._inflate.write(TRAILER);
        this._inflate.flush(() => {
          const err = this._inflate[kError];
          if (err) {
            this._inflate.close();
            this._inflate = null;
            callback(err);
            return;
          }
          const data2 = bufferUtil.concat(
            this._inflate[kBuffers],
            this._inflate[kTotalLength]
          );
          if (this._inflate._readableState.endEmitted) {
            this._inflate.close();
            this._inflate = null;
          } else {
            this._inflate[kTotalLength] = 0;
            this._inflate[kBuffers] = [];
            if (fin && this.params[`${endpoint}_no_context_takeover`]) {
              this._inflate.reset();
            }
          }
          callback(null, data2);
        });
      }
      /**
       * Compress data.
       *
       * @param {Buffer} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _compress(data, fin, callback) {
        const endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._deflate = zlib.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits
          });
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          this._deflate.on("error", NOOP);
          this._deflate.on("data", deflateOnData);
        }
        this._deflate[kCallback] = callback;
        this._deflate.write(data);
        this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
          if (!this._deflate) {
            return;
          }
          let data2 = bufferUtil.concat(
            this._deflate[kBuffers],
            this._deflate[kTotalLength]
          );
          if (fin) data2 = data2.slice(0, data2.length - 4);
          this._deflate[kCallback] = null;
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._deflate.reset();
          }
          callback(null, data2);
        });
      }
    };
    module2.exports = PerMessageDeflate;
    function deflateOnData(chunk) {
      this[kBuffers].push(chunk);
      this[kTotalLength] += chunk.length;
    }
    function inflateOnData(chunk) {
      this[kTotalLength] += chunk.length;
      if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
        this[kBuffers].push(chunk);
        return;
      }
      this[kError] = new RangeError("Max payload size exceeded");
      this[kError][kStatusCode] = 1009;
      this.removeListener("data", inflateOnData);
      this.reset();
    }
    function inflateOnError(err) {
      this[kPerMessageDeflate]._inflate = null;
      err[kStatusCode] = 1007;
      this[kCallback](err);
    }
  }
});

// node_modules/ws/lib/validation.js
var require_validation = __commonJS({
  "node_modules/ws/lib/validation.js"(exports2, module2) {
    "use strict";
    function isValidStatusCode(code) {
      return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
    }
    function _isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
          buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
          buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    try {
      let isValidUTF8 = require("utf-8-validate");
      if (typeof isValidUTF8 === "object") {
        isValidUTF8 = isValidUTF8.Validation.isValidUTF8;
      }
      module2.exports = {
        isValidStatusCode,
        isValidUTF8(buf) {
          return buf.length < 150 ? _isValidUTF8(buf) : isValidUTF8(buf);
        }
      };
    } catch (e) {
      module2.exports = {
        isValidStatusCode,
        isValidUTF8: _isValidUTF8
      };
    }
  }
});

// node_modules/ws/lib/receiver.js
var require_receiver = __commonJS({
  "node_modules/ws/lib/receiver.js"(exports2, module2) {
    "use strict";
    var { Writable } = require("stream");
    var PerMessageDeflate = require_permessage_deflate();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      kStatusCode,
      kWebSocket
    } = require_constants();
    var { concat, toArrayBuffer, unmask } = require_buffer_util();
    var { isValidStatusCode, isValidUTF8 } = require_validation();
    var GET_INFO = 0;
    var GET_PAYLOAD_LENGTH_16 = 1;
    var GET_PAYLOAD_LENGTH_64 = 2;
    var GET_MASK = 3;
    var GET_DATA = 4;
    var INFLATING = 5;
    var Receiver = class extends Writable {
      /**
       * Creates a Receiver instance.
       *
       * @param {String} [binaryType=nodebuffer] The type for binary data
       * @param {Object} [extensions] An object containing the negotiated extensions
       * @param {Boolean} [isServer=false] Specifies whether to operate in client or
       *     server mode
       * @param {Number} [maxPayload=0] The maximum allowed message length
       */
      constructor(binaryType, extensions, isServer, maxPayload) {
        super();
        this._binaryType = binaryType || BINARY_TYPES[0];
        this[kWebSocket] = void 0;
        this._extensions = extensions || {};
        this._isServer = !!isServer;
        this._maxPayload = maxPayload | 0;
        this._bufferedBytes = 0;
        this._buffers = [];
        this._compressed = false;
        this._payloadLength = 0;
        this._mask = void 0;
        this._fragmented = 0;
        this._masked = false;
        this._fin = false;
        this._opcode = 0;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragments = [];
        this._state = GET_INFO;
        this._loop = false;
      }
      /**
       * Implements `Writable.prototype._write()`.
       *
       * @param {Buffer} chunk The chunk of data to write
       * @param {String} encoding The character encoding of `chunk`
       * @param {Function} cb Callback
       * @private
       */
      _write(chunk, encoding, cb) {
        if (this._opcode === 8 && this._state == GET_INFO) return cb();
        this._bufferedBytes += chunk.length;
        this._buffers.push(chunk);
        this.startLoop(cb);
      }
      /**
       * Consumes `n` bytes from the buffered data.
       *
       * @param {Number} n The number of bytes to consume
       * @return {Buffer} The consumed bytes
       * @private
       */
      consume(n) {
        this._bufferedBytes -= n;
        if (n === this._buffers[0].length) return this._buffers.shift();
        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          this._buffers[0] = buf.slice(n);
          return buf.slice(0, n);
        }
        const dst = Buffer.allocUnsafe(n);
        do {
          const buf = this._buffers[0];
          const offset = dst.length - n;
          if (n >= buf.length) {
            dst.set(this._buffers.shift(), offset);
          } else {
            dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
            this._buffers[0] = buf.slice(n);
          }
          n -= buf.length;
        } while (n > 0);
        return dst;
      }
      /**
       * Starts the parsing loop.
       *
       * @param {Function} cb Callback
       * @private
       */
      startLoop(cb) {
        let err;
        this._loop = true;
        do {
          switch (this._state) {
            case GET_INFO:
              err = this.getInfo();
              break;
            case GET_PAYLOAD_LENGTH_16:
              err = this.getPayloadLength16();
              break;
            case GET_PAYLOAD_LENGTH_64:
              err = this.getPayloadLength64();
              break;
            case GET_MASK:
              this.getMask();
              break;
            case GET_DATA:
              err = this.getData(cb);
              break;
            default:
              this._loop = false;
              return;
          }
        } while (this._loop);
        cb(err);
      }
      /**
       * Reads the first two bytes of a frame.
       *
       * @return {(RangeError|undefined)} A possible error
       * @private
       */
      getInfo() {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        const buf = this.consume(2);
        if ((buf[0] & 48) !== 0) {
          this._loop = false;
          return error(RangeError, "RSV2 and RSV3 must be clear", true, 1002);
        }
        const compressed = (buf[0] & 64) === 64;
        if (compressed && !this._extensions[PerMessageDeflate.extensionName]) {
          this._loop = false;
          return error(RangeError, "RSV1 must be clear", true, 1002);
        }
        this._fin = (buf[0] & 128) === 128;
        this._opcode = buf[0] & 15;
        this._payloadLength = buf[1] & 127;
        if (this._opcode === 0) {
          if (compressed) {
            this._loop = false;
            return error(RangeError, "RSV1 must be clear", true, 1002);
          }
          if (!this._fragmented) {
            this._loop = false;
            return error(RangeError, "invalid opcode 0", true, 1002);
          }
          this._opcode = this._fragmented;
        } else if (this._opcode === 1 || this._opcode === 2) {
          if (this._fragmented) {
            this._loop = false;
            return error(RangeError, `invalid opcode ${this._opcode}`, true, 1002);
          }
          this._compressed = compressed;
        } else if (this._opcode > 7 && this._opcode < 11) {
          if (!this._fin) {
            this._loop = false;
            return error(RangeError, "FIN must be set", true, 1002);
          }
          if (compressed) {
            this._loop = false;
            return error(RangeError, "RSV1 must be clear", true, 1002);
          }
          if (this._payloadLength > 125) {
            this._loop = false;
            return error(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              true,
              1002
            );
          }
        } else {
          this._loop = false;
          return error(RangeError, `invalid opcode ${this._opcode}`, true, 1002);
        }
        if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
        this._masked = (buf[1] & 128) === 128;
        if (this._isServer) {
          if (!this._masked) {
            this._loop = false;
            return error(RangeError, "MASK must be set", true, 1002);
          }
        } else if (this._masked) {
          this._loop = false;
          return error(RangeError, "MASK must be clear", true, 1002);
        }
        if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
        else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
        else return this.haveLength();
      }
      /**
       * Gets extended payload length (7+16).
       *
       * @return {(RangeError|undefined)} A possible error
       * @private
       */
      getPayloadLength16() {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        this._payloadLength = this.consume(2).readUInt16BE(0);
        return this.haveLength();
      }
      /**
       * Gets extended payload length (7+64).
       *
       * @return {(RangeError|undefined)} A possible error
       * @private
       */
      getPayloadLength64() {
        if (this._bufferedBytes < 8) {
          this._loop = false;
          return;
        }
        const buf = this.consume(8);
        const num = buf.readUInt32BE(0);
        if (num > Math.pow(2, 53 - 32) - 1) {
          this._loop = false;
          return error(
            RangeError,
            "Unsupported WebSocket frame: payload length > 2^53 - 1",
            false,
            1009
          );
        }
        this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
        return this.haveLength();
      }
      /**
       * Payload length has been read.
       *
       * @return {(RangeError|undefined)} A possible error
       * @private
       */
      haveLength() {
        if (this._payloadLength && this._opcode < 8) {
          this._totalPayloadLength += this._payloadLength;
          if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
            this._loop = false;
            return error(RangeError, "Max payload size exceeded", false, 1009);
          }
        }
        if (this._masked) this._state = GET_MASK;
        else this._state = GET_DATA;
      }
      /**
       * Reads mask bytes.
       *
       * @private
       */
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = false;
          return;
        }
        this._mask = this.consume(4);
        this._state = GET_DATA;
      }
      /**
       * Reads data bytes.
       *
       * @param {Function} cb Callback
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      getData(cb) {
        let data = EMPTY_BUFFER;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = false;
            return;
          }
          data = this.consume(this._payloadLength);
          if (this._masked) unmask(data, this._mask);
        }
        if (this._opcode > 7) return this.controlMessage(data);
        if (this._compressed) {
          this._state = INFLATING;
          this.decompress(data, cb);
          return;
        }
        if (data.length) {
          this._messageLength = this._totalPayloadLength;
          this._fragments.push(data);
        }
        return this.dataMessage();
      }
      /**
       * Decompresses data.
       *
       * @param {Buffer} data Compressed data
       * @param {Function} cb Callback
       * @private
       */
      decompress(data, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        perMessageDeflate.decompress(data, this._fin, (err, buf) => {
          if (err) return cb(err);
          if (buf.length) {
            this._messageLength += buf.length;
            if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
              return cb(
                error(RangeError, "Max payload size exceeded", false, 1009)
              );
            }
            this._fragments.push(buf);
          }
          const er = this.dataMessage();
          if (er) return cb(er);
          this.startLoop(cb);
        });
      }
      /**
       * Handles a data message.
       *
       * @return {(Error|undefined)} A possible error
       * @private
       */
      dataMessage() {
        if (this._fin) {
          const messageLength = this._messageLength;
          const fragments = this._fragments;
          this._totalPayloadLength = 0;
          this._messageLength = 0;
          this._fragmented = 0;
          this._fragments = [];
          if (this._opcode === 2) {
            let data;
            if (this._binaryType === "nodebuffer") {
              data = concat(fragments, messageLength);
            } else if (this._binaryType === "arraybuffer") {
              data = toArrayBuffer(concat(fragments, messageLength));
            } else {
              data = fragments;
            }
            this.emit("message", data);
          } else {
            const buf = concat(fragments, messageLength);
            if (!isValidUTF8(buf)) {
              this._loop = false;
              return error(Error, "invalid UTF-8 sequence", true, 1007);
            }
            this.emit("message", buf.toString());
          }
        }
        this._state = GET_INFO;
      }
      /**
       * Handles a control message.
       *
       * @param {Buffer} data Data to handle
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      controlMessage(data) {
        if (this._opcode === 8) {
          this._loop = false;
          if (data.length === 0) {
            this.emit("conclude", 1005, "");
            this.end();
          } else if (data.length === 1) {
            return error(RangeError, "invalid payload length 1", true, 1002);
          } else {
            const code = data.readUInt16BE(0);
            if (!isValidStatusCode(code)) {
              return error(RangeError, `invalid status code ${code}`, true, 1002);
            }
            const buf = data.slice(2);
            if (!isValidUTF8(buf)) {
              return error(Error, "invalid UTF-8 sequence", true, 1007);
            }
            this.emit("conclude", code, buf.toString());
            this.end();
          }
        } else if (this._opcode === 9) {
          this.emit("ping", data);
        } else {
          this.emit("pong", data);
        }
        this._state = GET_INFO;
      }
    };
    module2.exports = Receiver;
    function error(ErrorCtor, message, prefix, statusCode) {
      const err = new ErrorCtor(
        prefix ? `Invalid WebSocket frame: ${message}` : message
      );
      Error.captureStackTrace(err, error);
      err[kStatusCode] = statusCode;
      return err;
    }
  }
});

// node_modules/ws/lib/sender.js
var require_sender = __commonJS({
  "node_modules/ws/lib/sender.js"(exports2, module2) {
    "use strict";
    var { randomFillSync } = require("crypto");
    var PerMessageDeflate = require_permessage_deflate();
    var { EMPTY_BUFFER } = require_constants();
    var { isValidStatusCode } = require_validation();
    var { mask: applyMask, toBuffer } = require_buffer_util();
    var mask = Buffer.alloc(4);
    var Sender = class _Sender {
      /**
       * Creates a Sender instance.
       *
       * @param {net.Socket} socket The connection socket
       * @param {Object} [extensions] An object containing the negotiated extensions
       */
      constructor(socket, extensions) {
        this._extensions = extensions || {};
        this._socket = socket;
        this._firstFragment = true;
        this._compress = false;
        this._bufferedBytes = 0;
        this._deflating = false;
        this._queue = [];
      }
      /**
       * Frames a piece of data according to the HyBi WebSocket protocol.
       *
       * @param {Buffer} data The data to frame
       * @param {Object} options Options object
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @return {Buffer[]} The framed data as a list of `Buffer` instances
       * @public
       */
      static frame(data, options) {
        const merge = options.mask && options.readOnly;
        let offset = options.mask ? 6 : 2;
        let payloadLength = data.length;
        if (data.length >= 65536) {
          offset += 8;
          payloadLength = 127;
        } else if (data.length > 125) {
          offset += 2;
          payloadLength = 126;
        }
        const target = Buffer.allocUnsafe(merge ? data.length + offset : offset);
        target[0] = options.fin ? options.opcode | 128 : options.opcode;
        if (options.rsv1) target[0] |= 64;
        target[1] = payloadLength;
        if (payloadLength === 126) {
          target.writeUInt16BE(data.length, 2);
        } else if (payloadLength === 127) {
          target.writeUInt32BE(0, 2);
          target.writeUInt32BE(data.length, 6);
        }
        if (!options.mask) return [target, data];
        randomFillSync(mask, 0, 4);
        target[1] |= 128;
        target[offset - 4] = mask[0];
        target[offset - 3] = mask[1];
        target[offset - 2] = mask[2];
        target[offset - 1] = mask[3];
        if (merge) {
          applyMask(data, mask, target, offset, data.length);
          return [target];
        }
        applyMask(data, mask, data, 0, data.length);
        return [target, data];
      }
      /**
       * Sends a close message to the other peer.
       *
       * @param {Number} [code] The status code component of the body
       * @param {String} [data] The message component of the body
       * @param {Boolean} [mask=false] Specifies whether or not to mask the message
       * @param {Function} [cb] Callback
       * @public
       */
      close(code, data, mask2, cb) {
        let buf;
        if (code === void 0) {
          buf = EMPTY_BUFFER;
        } else if (typeof code !== "number" || !isValidStatusCode(code)) {
          throw new TypeError("First argument must be a valid error code number");
        } else if (data === void 0 || data === "") {
          buf = Buffer.allocUnsafe(2);
          buf.writeUInt16BE(code, 0);
        } else {
          const length = Buffer.byteLength(data);
          if (length > 123) {
            throw new RangeError("The message must not be greater than 123 bytes");
          }
          buf = Buffer.allocUnsafe(2 + length);
          buf.writeUInt16BE(code, 0);
          buf.write(data, 2);
        }
        if (this._deflating) {
          this.enqueue([this.doClose, buf, mask2, cb]);
        } else {
          this.doClose(buf, mask2, cb);
        }
      }
      /**
       * Frames and sends a close message.
       *
       * @param {Buffer} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @private
       */
      doClose(data, mask2, cb) {
        this.sendFrame(
          _Sender.frame(data, {
            fin: true,
            rsv1: false,
            opcode: 8,
            mask: mask2,
            readOnly: false
          }),
          cb
        );
      }
      /**
       * Sends a ping message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      ping(data, mask2, cb) {
        const buf = toBuffer(data);
        if (buf.length > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        if (this._deflating) {
          this.enqueue([this.doPing, buf, mask2, toBuffer.readOnly, cb]);
        } else {
          this.doPing(buf, mask2, toBuffer.readOnly, cb);
        }
      }
      /**
       * Frames and sends a ping message.
       *
       * @param {Buffer} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Boolean} [readOnly=false] Specifies whether `data` can be modified
       * @param {Function} [cb] Callback
       * @private
       */
      doPing(data, mask2, readOnly, cb) {
        this.sendFrame(
          _Sender.frame(data, {
            fin: true,
            rsv1: false,
            opcode: 9,
            mask: mask2,
            readOnly
          }),
          cb
        );
      }
      /**
       * Sends a pong message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      pong(data, mask2, cb) {
        const buf = toBuffer(data);
        if (buf.length > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        if (this._deflating) {
          this.enqueue([this.doPong, buf, mask2, toBuffer.readOnly, cb]);
        } else {
          this.doPong(buf, mask2, toBuffer.readOnly, cb);
        }
      }
      /**
       * Frames and sends a pong message.
       *
       * @param {Buffer} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Boolean} [readOnly=false] Specifies whether `data` can be modified
       * @param {Function} [cb] Callback
       * @private
       */
      doPong(data, mask2, readOnly, cb) {
        this.sendFrame(
          _Sender.frame(data, {
            fin: true,
            rsv1: false,
            opcode: 10,
            mask: mask2,
            readOnly
          }),
          cb
        );
      }
      /**
       * Sends a data message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Object} options Options object
       * @param {Boolean} [options.compress=false] Specifies whether or not to
       *     compress `data`
       * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
       *     or text
       * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Function} [cb] Callback
       * @public
       */
      send(data, options, cb) {
        const buf = toBuffer(data);
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        let opcode = options.binary ? 2 : 1;
        let rsv1 = options.compress;
        if (this._firstFragment) {
          this._firstFragment = false;
          if (rsv1 && perMessageDeflate) {
            rsv1 = buf.length >= perMessageDeflate._threshold;
          }
          this._compress = rsv1;
        } else {
          rsv1 = false;
          opcode = 0;
        }
        if (options.fin) this._firstFragment = true;
        if (perMessageDeflate) {
          const opts = {
            fin: options.fin,
            rsv1,
            opcode,
            mask: options.mask,
            readOnly: toBuffer.readOnly
          };
          if (this._deflating) {
            this.enqueue([this.dispatch, buf, this._compress, opts, cb]);
          } else {
            this.dispatch(buf, this._compress, opts, cb);
          }
        } else {
          this.sendFrame(
            _Sender.frame(buf, {
              fin: options.fin,
              rsv1: false,
              opcode,
              mask: options.mask,
              readOnly: toBuffer.readOnly
            }),
            cb
          );
        }
      }
      /**
       * Dispatches a data message.
       *
       * @param {Buffer} data The message to send
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     `data`
       * @param {Object} options Options object
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      dispatch(data, compress, options, cb) {
        if (!compress) {
          this.sendFrame(_Sender.frame(data, options), cb);
          return;
        }
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        this._bufferedBytes += data.length;
        this._deflating = true;
        perMessageDeflate.compress(data, options.fin, (_, buf) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while data was being compressed"
            );
            if (typeof cb === "function") cb(err);
            for (let i = 0; i < this._queue.length; i++) {
              const callback = this._queue[i][4];
              if (typeof callback === "function") callback(err);
            }
            return;
          }
          this._bufferedBytes -= data.length;
          this._deflating = false;
          options.readOnly = false;
          this.sendFrame(_Sender.frame(buf, options), cb);
          this.dequeue();
        });
      }
      /**
       * Executes queued send operations.
       *
       * @private
       */
      dequeue() {
        while (!this._deflating && this._queue.length) {
          const params = this._queue.shift();
          this._bufferedBytes -= params[1].length;
          Reflect.apply(params[0], this, params.slice(1));
        }
      }
      /**
       * Enqueues a send operation.
       *
       * @param {Array} params Send operation parameters.
       * @private
       */
      enqueue(params) {
        this._bufferedBytes += params[1].length;
        this._queue.push(params);
      }
      /**
       * Sends a frame.
       *
       * @param {Buffer[]} list The frame to send
       * @param {Function} [cb] Callback
       * @private
       */
      sendFrame(list, cb) {
        if (list.length === 2) {
          this._socket.cork();
          this._socket.write(list[0]);
          this._socket.write(list[1], cb);
          this._socket.uncork();
        } else {
          this._socket.write(list[0], cb);
        }
      }
    };
    module2.exports = Sender;
  }
});

// node_modules/ws/lib/event-target.js
var require_event_target = __commonJS({
  "node_modules/ws/lib/event-target.js"(exports2, module2) {
    "use strict";
    var Event = class {
      /**
       * Create a new `Event`.
       *
       * @param {String} type The name of the event
       * @param {Object} target A reference to the target to which the event was
       *     dispatched
       */
      constructor(type, target) {
        this.target = target;
        this.type = type;
      }
    };
    var MessageEvent = class extends Event {
      /**
       * Create a new `MessageEvent`.
       *
       * @param {(String|Buffer|ArrayBuffer|Buffer[])} data The received data
       * @param {WebSocket} target A reference to the target to which the event was
       *     dispatched
       */
      constructor(data, target) {
        super("message", target);
        this.data = data;
      }
    };
    var CloseEvent = class extends Event {
      /**
       * Create a new `CloseEvent`.
       *
       * @param {Number} code The status code explaining why the connection is being
       *     closed
       * @param {String} reason A human-readable string explaining why the
       *     connection is closing
       * @param {WebSocket} target A reference to the target to which the event was
       *     dispatched
       */
      constructor(code, reason, target) {
        super("close", target);
        this.wasClean = target._closeFrameReceived && target._closeFrameSent;
        this.reason = reason;
        this.code = code;
      }
    };
    var OpenEvent = class extends Event {
      /**
       * Create a new `OpenEvent`.
       *
       * @param {WebSocket} target A reference to the target to which the event was
       *     dispatched
       */
      constructor(target) {
        super("open", target);
      }
    };
    var ErrorEvent = class extends Event {
      /**
       * Create a new `ErrorEvent`.
       *
       * @param {Object} error The error that generated this event
       * @param {WebSocket} target A reference to the target to which the event was
       *     dispatched
       */
      constructor(error, target) {
        super("error", target);
        this.message = error.message;
        this.error = error;
      }
    };
    var EventTarget = {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {Function} listener The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean`` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(type, listener, options) {
        if (typeof listener !== "function") return;
        function onMessage(data) {
          listener.call(this, new MessageEvent(data, this));
        }
        function onClose(code, message) {
          listener.call(this, new CloseEvent(code, message, this));
        }
        function onError(error) {
          listener.call(this, new ErrorEvent(error, this));
        }
        function onOpen() {
          listener.call(this, new OpenEvent(this));
        }
        const method = options && options.once ? "once" : "on";
        if (type === "message") {
          onMessage._listener = listener;
          this[method](type, onMessage);
        } else if (type === "close") {
          onClose._listener = listener;
          this[method](type, onClose);
        } else if (type === "error") {
          onError._listener = listener;
          this[method](type, onError);
        } else if (type === "open") {
          onOpen._listener = listener;
          this[method](type, onOpen);
        } else {
          this[method](type, listener);
        }
      },
      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {Function} listener The listener to remove
       * @public
       */
      removeEventListener(type, listener) {
        const listeners = this.listeners(type);
        for (let i = 0; i < listeners.length; i++) {
          if (listeners[i] === listener || listeners[i]._listener === listener) {
            this.removeListener(type, listeners[i]);
          }
        }
      }
    };
    module2.exports = EventTarget;
  }
});

// node_modules/ws/lib/extension.js
var require_extension = __commonJS({
  "node_modules/ws/lib/extension.js"(exports2, module2) {
    "use strict";
    var tokenChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 0 - 15
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 16 - 31
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      // 32 - 47
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      // 48 - 63
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 64 - 79
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      // 80 - 95
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 96 - 111
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      0
      // 112 - 127
    ];
    function push(dest, name, elem) {
      if (dest[name] === void 0) dest[name] = [elem];
      else dest[name].push(elem);
    }
    function parse(header) {
      const offers = /* @__PURE__ */ Object.create(null);
      if (header === void 0 || header === "") return offers;
      let params = /* @__PURE__ */ Object.create(null);
      let mustUnescape = false;
      let isEscaping = false;
      let inQuotes = false;
      let extensionName;
      let paramName;
      let start = -1;
      let end = -1;
      let i = 0;
      for (; i < header.length; i++) {
        const code = header.charCodeAt(i);
        if (extensionName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            const name = header.slice(start, end);
            if (code === 44) {
              push(offers, name, params);
              params = /* @__PURE__ */ Object.create(null);
            } else {
              extensionName = name;
            }
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (paramName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            push(params, header.slice(start, end), true);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            start = end = -1;
          } else if (code === 61 && start !== -1 && end === -1) {
            paramName = header.slice(start, i);
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else {
          if (isEscaping) {
            if (tokenChars[code] !== 1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (start === -1) start = i;
            else if (!mustUnescape) mustUnescape = true;
            isEscaping = false;
          } else if (inQuotes) {
            if (tokenChars[code] === 1) {
              if (start === -1) start = i;
            } else if (code === 34 && start !== -1) {
              inQuotes = false;
              end = i;
            } else if (code === 92) {
              isEscaping = true;
            } else {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
          } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
            inQuotes = true;
          } else if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (start !== -1 && (code === 32 || code === 9)) {
            if (end === -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            let value = header.slice(start, end);
            if (mustUnescape) {
              value = value.replace(/\\/g, "");
              mustUnescape = false;
            }
            push(params, paramName, value);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            paramName = void 0;
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        }
      }
      if (start === -1 || inQuotes) {
        throw new SyntaxError("Unexpected end of input");
      }
      if (end === -1) end = i;
      const token = header.slice(start, end);
      if (extensionName === void 0) {
        push(offers, token, params);
      } else {
        if (paramName === void 0) {
          push(params, token, true);
        } else if (mustUnescape) {
          push(params, paramName, token.replace(/\\/g, ""));
        } else {
          push(params, paramName, token);
        }
        push(offers, extensionName, params);
      }
      return offers;
    }
    function format(extensions) {
      return Object.keys(extensions).map((extension) => {
        let configurations = extensions[extension];
        if (!Array.isArray(configurations)) configurations = [configurations];
        return configurations.map((params) => {
          return [extension].concat(
            Object.keys(params).map((k) => {
              let values = params[k];
              if (!Array.isArray(values)) values = [values];
              return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
            })
          ).join("; ");
        }).join(", ");
      }).join(", ");
    }
    module2.exports = { format, parse };
  }
});

// node_modules/ws/lib/websocket.js
var require_websocket2 = __commonJS({
  "node_modules/ws/lib/websocket.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events");
    var https = require("https");
    var http = require("http");
    var net = require("net");
    var tls = require("tls");
    var { randomBytes, createHash } = require("crypto");
    var { URL } = require("url");
    var PerMessageDeflate = require_permessage_deflate();
    var Receiver = require_receiver();
    var Sender = require_sender();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      GUID,
      kStatusCode,
      kWebSocket,
      NOOP
    } = require_constants();
    var { addEventListener, removeEventListener } = require_event_target();
    var { format, parse } = require_extension();
    var { toBuffer } = require_buffer_util();
    var readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
    var protocolVersions = [8, 13];
    var closeTimeout = 30 * 1e3;
    var WebSocket = class _WebSocket extends EventEmitter {
      /**
       * Create a new `WebSocket`.
       *
       * @param {(String|url.URL)} address The URL to which to connect
       * @param {(String|String[])} [protocols] The subprotocols
       * @param {Object} [options] Connection options
       */
      constructor(address, protocols, options) {
        super();
        this._binaryType = BINARY_TYPES[0];
        this._closeCode = 1006;
        this._closeFrameReceived = false;
        this._closeFrameSent = false;
        this._closeMessage = "";
        this._closeTimer = null;
        this._extensions = {};
        this._protocol = "";
        this._readyState = _WebSocket.CONNECTING;
        this._receiver = null;
        this._sender = null;
        this._socket = null;
        if (address !== null) {
          this._bufferedAmount = 0;
          this._isServer = false;
          this._redirects = 0;
          if (Array.isArray(protocols)) {
            protocols = protocols.join(", ");
          } else if (typeof protocols === "object" && protocols !== null) {
            options = protocols;
            protocols = void 0;
          }
          initAsClient(this, address, protocols, options);
        } else {
          this._isServer = true;
        }
      }
      /**
       * This deviates from the WHATWG interface since ws doesn't support the
       * required default "blob" type (instead we define a custom "nodebuffer"
       * type).
       *
       * @type {String}
       */
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(type) {
        if (!BINARY_TYPES.includes(type)) return;
        this._binaryType = type;
        if (this._receiver) this._receiver._binaryType = type;
      }
      /**
       * @type {Number}
       */
      get bufferedAmount() {
        if (!this._socket) return this._bufferedAmount;
        return this._socket._writableState.length + this._sender._bufferedBytes;
      }
      /**
       * @type {String}
       */
      get extensions() {
        return Object.keys(this._extensions).join();
      }
      /**
       * @type {String}
       */
      get protocol() {
        return this._protocol;
      }
      /**
       * @type {Number}
       */
      get readyState() {
        return this._readyState;
      }
      /**
       * @type {String}
       */
      get url() {
        return this._url;
      }
      /**
       * Set up the socket and the internal resources.
       *
       * @param {net.Socket} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Number} [maxPayload=0] The maximum allowed message size
       * @private
       */
      setSocket(socket, head, maxPayload) {
        const receiver = new Receiver(
          this.binaryType,
          this._extensions,
          this._isServer,
          maxPayload
        );
        this._sender = new Sender(socket, this._extensions);
        this._receiver = receiver;
        this._socket = socket;
        receiver[kWebSocket] = this;
        socket[kWebSocket] = this;
        receiver.on("conclude", receiverOnConclude);
        receiver.on("drain", receiverOnDrain);
        receiver.on("error", receiverOnError);
        receiver.on("message", receiverOnMessage);
        receiver.on("ping", receiverOnPing);
        receiver.on("pong", receiverOnPong);
        socket.setTimeout(0);
        socket.setNoDelay();
        if (head.length > 0) socket.unshift(head);
        socket.on("close", socketOnClose);
        socket.on("data", socketOnData);
        socket.on("end", socketOnEnd);
        socket.on("error", socketOnError);
        this._readyState = _WebSocket.OPEN;
        this.emit("open");
      }
      /**
       * Emit the `'close'` event.
       *
       * @private
       */
      emitClose() {
        if (!this._socket) {
          this._readyState = _WebSocket.CLOSED;
          this.emit("close", this._closeCode, this._closeMessage);
          return;
        }
        if (this._extensions[PerMessageDeflate.extensionName]) {
          this._extensions[PerMessageDeflate.extensionName].cleanup();
        }
        this._receiver.removeAllListeners();
        this._readyState = _WebSocket.CLOSED;
        this.emit("close", this._closeCode, this._closeMessage);
      }
      /**
       * Start a closing handshake.
       *
       *          +----------+   +-----------+   +----------+
       *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
       *    |     +----------+   +-----------+   +----------+     |
       *          +----------+   +-----------+         |
       * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
       *          +----------+   +-----------+   |
       *    |           |                        |   +---+        |
       *                +------------------------+-->|fin| - - - -
       *    |         +---+                      |   +---+
       *     - - - - -|fin|<---------------------+
       *              +---+
       *
       * @param {Number} [code] Status code explaining why the connection is closing
       * @param {String} [data] A string explaining why the connection is closing
       * @public
       */
      close(code, data) {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          return abortHandshake(this, this._req, msg);
        }
        if (this.readyState === _WebSocket.CLOSING) {
          if (this._closeFrameSent && this._closeFrameReceived) this._socket.end();
          return;
        }
        this._readyState = _WebSocket.CLOSING;
        this._sender.close(code, data, !this._isServer, (err) => {
          if (err) return;
          this._closeFrameSent = true;
          if (this._closeFrameReceived) this._socket.end();
        });
        this._closeTimer = setTimeout(
          this._socket.destroy.bind(this._socket),
          closeTimeout
        );
      }
      /**
       * Send a ping.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the ping is sent
       * @public
       */
      ping(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.ping(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Send a pong.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the pong is sent
       * @public
       */
      pong(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.pong(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Send a data message.
       *
       * @param {*} data The message to send
       * @param {Object} [options] Options object
       * @param {Boolean} [options.compress] Specifies whether or not to compress
       *     `data`
       * @param {Boolean} [options.binary] Specifies whether `data` is binary or
       *     text
       * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when data is written out
       * @public
       */
      send(data, options, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        const opts = {
          binary: typeof data !== "string",
          mask: !this._isServer,
          compress: true,
          fin: true,
          ...options
        };
        if (!this._extensions[PerMessageDeflate.extensionName]) {
          opts.compress = false;
        }
        this._sender.send(data || EMPTY_BUFFER, opts, cb);
      }
      /**
       * Forcibly close the connection.
       *
       * @public
       */
      terminate() {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          return abortHandshake(this, this._req, msg);
        }
        if (this._socket) {
          this._readyState = _WebSocket.CLOSING;
          this._socket.destroy();
        }
      }
    };
    readyStates.forEach((readyState, i) => {
      const descriptor = { enumerable: true, value: i };
      Object.defineProperty(WebSocket.prototype, readyState, descriptor);
      Object.defineProperty(WebSocket, readyState, descriptor);
    });
    [
      "binaryType",
      "bufferedAmount",
      "extensions",
      "protocol",
      "readyState",
      "url"
    ].forEach((property) => {
      Object.defineProperty(WebSocket.prototype, property, { enumerable: true });
    });
    ["open", "error", "close", "message"].forEach((method) => {
      Object.defineProperty(WebSocket.prototype, `on${method}`, {
        configurable: true,
        enumerable: true,
        /**
         * Return the listener of the event.
         *
         * @return {(Function|undefined)} The event listener or `undefined`
         * @public
         */
        get() {
          const listeners = this.listeners(method);
          for (let i = 0; i < listeners.length; i++) {
            if (listeners[i]._listener) return listeners[i]._listener;
          }
          return void 0;
        },
        /**
         * Add a listener for the event.
         *
         * @param {Function} listener The listener to add
         * @public
         */
        set(listener) {
          const listeners = this.listeners(method);
          for (let i = 0; i < listeners.length; i++) {
            if (listeners[i]._listener) this.removeListener(method, listeners[i]);
          }
          this.addEventListener(method, listener);
        }
      });
    });
    WebSocket.prototype.addEventListener = addEventListener;
    WebSocket.prototype.removeEventListener = removeEventListener;
    module2.exports = WebSocket;
    function initAsClient(websocket, address, protocols, options) {
      const opts = {
        protocolVersion: protocolVersions[1],
        maxPayload: 100 * 1024 * 1024,
        perMessageDeflate: true,
        followRedirects: false,
        maxRedirects: 10,
        ...options,
        createConnection: void 0,
        socketPath: void 0,
        hostname: void 0,
        protocol: void 0,
        timeout: void 0,
        method: void 0,
        host: void 0,
        path: void 0,
        port: void 0
      };
      if (!protocolVersions.includes(opts.protocolVersion)) {
        throw new RangeError(
          `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
        );
      }
      let parsedUrl;
      if (address instanceof URL) {
        parsedUrl = address;
        websocket._url = address.href;
      } else {
        parsedUrl = new URL(address);
        websocket._url = address;
      }
      const isUnixSocket = parsedUrl.protocol === "ws+unix:";
      if (!parsedUrl.host && (!isUnixSocket || !parsedUrl.pathname)) {
        throw new Error(`Invalid URL: ${websocket.url}`);
      }
      const isSecure = parsedUrl.protocol === "wss:" || parsedUrl.protocol === "https:";
      const defaultPort = isSecure ? 443 : 80;
      const key = randomBytes(16).toString("base64");
      const get = isSecure ? https.get : http.get;
      let perMessageDeflate;
      opts.createConnection = isSecure ? tlsConnect : netConnect;
      opts.defaultPort = opts.defaultPort || defaultPort;
      opts.port = parsedUrl.port || defaultPort;
      opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
      opts.headers = {
        "Sec-WebSocket-Version": opts.protocolVersion,
        "Sec-WebSocket-Key": key,
        Connection: "Upgrade",
        Upgrade: "websocket",
        ...opts.headers
      };
      opts.path = parsedUrl.pathname + parsedUrl.search;
      opts.timeout = opts.handshakeTimeout;
      if (opts.perMessageDeflate) {
        perMessageDeflate = new PerMessageDeflate(
          opts.perMessageDeflate !== true ? opts.perMessageDeflate : {},
          false,
          opts.maxPayload
        );
        opts.headers["Sec-WebSocket-Extensions"] = format({
          [PerMessageDeflate.extensionName]: perMessageDeflate.offer()
        });
      }
      if (protocols) {
        opts.headers["Sec-WebSocket-Protocol"] = protocols;
      }
      if (opts.origin) {
        if (opts.protocolVersion < 13) {
          opts.headers["Sec-WebSocket-Origin"] = opts.origin;
        } else {
          opts.headers.Origin = opts.origin;
        }
      }
      if (parsedUrl.username || parsedUrl.password) {
        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
      }
      if (isUnixSocket) {
        const parts = opts.path.split(":");
        opts.socketPath = parts[0];
        opts.path = parts[1];
      }
      let req = websocket._req = get(opts);
      if (opts.timeout) {
        req.on("timeout", () => {
          abortHandshake(websocket, req, "Opening handshake has timed out");
        });
      }
      req.on("error", (err) => {
        if (req === null || req.aborted) return;
        req = websocket._req = null;
        websocket._readyState = WebSocket.CLOSING;
        websocket.emit("error", err);
        websocket.emitClose();
      });
      req.on("response", (res) => {
        const location = res.headers.location;
        const statusCode = res.statusCode;
        if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
          if (++websocket._redirects > opts.maxRedirects) {
            abortHandshake(websocket, req, "Maximum redirects exceeded");
            return;
          }
          req.abort();
          const addr = new URL(location, address);
          initAsClient(websocket, addr, protocols, options);
        } else if (!websocket.emit("unexpected-response", req, res)) {
          abortHandshake(
            websocket,
            req,
            `Unexpected server response: ${res.statusCode}`
          );
        }
      });
      req.on("upgrade", (res, socket, head) => {
        websocket.emit("upgrade", res);
        if (websocket.readyState !== WebSocket.CONNECTING) return;
        req = websocket._req = null;
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        if (res.headers["sec-websocket-accept"] !== digest) {
          abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
          return;
        }
        const serverProt = res.headers["sec-websocket-protocol"];
        const protList = (protocols || "").split(/, */);
        let protError;
        if (!protocols && serverProt) {
          protError = "Server sent a subprotocol but none was requested";
        } else if (protocols && !serverProt) {
          protError = "Server sent no subprotocol";
        } else if (serverProt && !protList.includes(serverProt)) {
          protError = "Server sent an invalid subprotocol";
        }
        if (protError) {
          abortHandshake(websocket, socket, protError);
          return;
        }
        if (serverProt) websocket._protocol = serverProt;
        if (perMessageDeflate) {
          try {
            const extensions = parse(res.headers["sec-websocket-extensions"]);
            if (extensions[PerMessageDeflate.extensionName]) {
              perMessageDeflate.accept(extensions[PerMessageDeflate.extensionName]);
              websocket._extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            abortHandshake(
              websocket,
              socket,
              "Invalid Sec-WebSocket-Extensions header"
            );
            return;
          }
        }
        websocket.setSocket(socket, head, opts.maxPayload);
      });
    }
    function netConnect(options) {
      options.path = options.socketPath;
      return net.connect(options);
    }
    function tlsConnect(options) {
      options.path = void 0;
      if (!options.servername && options.servername !== "") {
        options.servername = net.isIP(options.host) ? "" : options.host;
      }
      return tls.connect(options);
    }
    function abortHandshake(websocket, stream, message) {
      websocket._readyState = WebSocket.CLOSING;
      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshake);
      if (stream.setHeader) {
        stream.abort();
        if (stream.socket && !stream.socket.destroyed) {
          stream.socket.destroy();
        }
        stream.once("abort", websocket.emitClose.bind(websocket));
        websocket.emit("error", err);
      } else {
        stream.destroy(err);
        stream.once("error", websocket.emit.bind(websocket, "error"));
        stream.once("close", websocket.emitClose.bind(websocket));
      }
    }
    function sendAfterClose(websocket, data, cb) {
      if (data) {
        const length = toBuffer(data).length;
        if (websocket._socket) websocket._sender._bufferedBytes += length;
        else websocket._bufferedAmount += length;
      }
      if (cb) {
        const err = new Error(
          `WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`
        );
        cb(err);
      }
    }
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];
      websocket._socket.removeListener("data", socketOnData);
      websocket._socket.resume();
      websocket._closeFrameReceived = true;
      websocket._closeMessage = reason;
      websocket._closeCode = code;
      if (code === 1005) websocket.close();
      else websocket.close(code, reason);
    }
    function receiverOnDrain() {
      this[kWebSocket]._socket.resume();
    }
    function receiverOnError(err) {
      const websocket = this[kWebSocket];
      websocket._socket.removeListener("data", socketOnData);
      websocket._readyState = WebSocket.CLOSING;
      websocket._closeCode = err[kStatusCode];
      websocket.emit("error", err);
      websocket._socket.destroy();
    }
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }
    function receiverOnMessage(data) {
      this[kWebSocket].emit("message", data);
    }
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];
      websocket.pong(data, !websocket._isServer, NOOP);
      websocket.emit("ping", data);
    }
    function receiverOnPong(data) {
      this[kWebSocket].emit("pong", data);
    }
    function socketOnClose() {
      const websocket = this[kWebSocket];
      this.removeListener("close", socketOnClose);
      this.removeListener("end", socketOnEnd);
      websocket._readyState = WebSocket.CLOSING;
      websocket._socket.read();
      websocket._receiver.end();
      this.removeListener("data", socketOnData);
      this[kWebSocket] = void 0;
      clearTimeout(websocket._closeTimer);
      if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
        websocket.emitClose();
      } else {
        websocket._receiver.on("error", receiverOnFinish);
        websocket._receiver.on("finish", receiverOnFinish);
      }
    }
    function socketOnData(chunk) {
      if (!this[kWebSocket]._receiver.write(chunk)) {
        this.pause();
      }
    }
    function socketOnEnd() {
      const websocket = this[kWebSocket];
      websocket._readyState = WebSocket.CLOSING;
      websocket._receiver.end();
      this.end();
    }
    function socketOnError() {
      const websocket = this[kWebSocket];
      this.removeListener("error", socketOnError);
      this.on("error", NOOP);
      if (websocket) {
        websocket._readyState = WebSocket.CLOSING;
        this.destroy();
      }
    }
  }
});

// node_modules/ws/lib/stream.js
var require_stream = __commonJS({
  "node_modules/ws/lib/stream.js"(exports2, module2) {
    "use strict";
    var { Duplex } = require("stream");
    function emitClose(stream) {
      stream.emit("close");
    }
    function duplexOnEnd() {
      if (!this.destroyed && this._writableState.finished) {
        this.destroy();
      }
    }
    function duplexOnError(err) {
      this.removeListener("error", duplexOnError);
      this.destroy();
      if (this.listenerCount("error") === 0) {
        this.emit("error", err);
      }
    }
    function createWebSocketStream(ws, options) {
      let resumeOnReceiverDrain = true;
      function receiverOnDrain() {
        if (resumeOnReceiverDrain) ws._socket.resume();
      }
      if (ws.readyState === ws.CONNECTING) {
        ws.once("open", function open() {
          ws._receiver.removeAllListeners("drain");
          ws._receiver.on("drain", receiverOnDrain);
        });
      } else {
        ws._receiver.removeAllListeners("drain");
        ws._receiver.on("drain", receiverOnDrain);
      }
      const duplex = new Duplex({
        ...options,
        autoDestroy: false,
        emitClose: false,
        objectMode: false,
        writableObjectMode: false
      });
      ws.on("message", function message(msg) {
        if (!duplex.push(msg)) {
          resumeOnReceiverDrain = false;
          ws._socket.pause();
        }
      });
      ws.once("error", function error(err) {
        if (duplex.destroyed) return;
        duplex.destroy(err);
      });
      ws.once("close", function close() {
        if (duplex.destroyed) return;
        duplex.push(null);
      });
      duplex._destroy = function(err, callback) {
        if (ws.readyState === ws.CLOSED) {
          callback(err);
          process.nextTick(emitClose, duplex);
          return;
        }
        let called = false;
        ws.once("error", function error(err2) {
          called = true;
          callback(err2);
        });
        ws.once("close", function close() {
          if (!called) callback(err);
          process.nextTick(emitClose, duplex);
        });
        ws.terminate();
      };
      duplex._final = function(callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._final(callback);
          });
          return;
        }
        if (ws._socket === null) return;
        if (ws._socket._writableState.finished) {
          callback();
          if (duplex._readableState.endEmitted) duplex.destroy();
        } else {
          ws._socket.once("finish", function finish() {
            callback();
          });
          ws.close();
        }
      };
      duplex._read = function() {
        if (ws.readyState === ws.OPEN && !resumeOnReceiverDrain) {
          resumeOnReceiverDrain = true;
          if (!ws._receiver._writableState.needDrain) ws._socket.resume();
        }
      };
      duplex._write = function(chunk, encoding, callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._write(chunk, encoding, callback);
          });
          return;
        }
        ws.send(chunk, callback);
      };
      duplex.on("end", duplexOnEnd);
      duplex.on("error", duplexOnError);
      return duplex;
    }
    module2.exports = createWebSocketStream;
  }
});

// node_modules/ws/lib/websocket-server.js
var require_websocket_server = __commonJS({
  "node_modules/ws/lib/websocket-server.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events");
    var { createHash } = require("crypto");
    var { createServer, STATUS_CODES } = require("http");
    var PerMessageDeflate = require_permessage_deflate();
    var WebSocket = require_websocket2();
    var { format, parse } = require_extension();
    var { GUID, kWebSocket } = require_constants();
    var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
    var WebSocketServer = class extends EventEmitter {
      /**
       * Create a `WebSocketServer` instance.
       *
       * @param {Object} options Configuration options
       * @param {Number} [options.backlog=511] The maximum length of the queue of
       *     pending connections
       * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
       *     track clients
       * @param {Function} [options.handleProtocols] A hook to handle protocols
       * @param {String} [options.host] The hostname where to bind the server
       * @param {Number} [options.maxPayload=104857600] The maximum allowed message
       *     size
       * @param {Boolean} [options.noServer=false] Enable no server mode
       * @param {String} [options.path] Accept only connections matching this path
       * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
       *     permessage-deflate
       * @param {Number} [options.port] The port where to bind the server
       * @param {http.Server} [options.server] A pre-created HTTP/S server to use
       * @param {Function} [options.verifyClient] A hook to reject connections
       * @param {Function} [callback] A listener for the `listening` event
       */
      constructor(options, callback) {
        super();
        options = {
          maxPayload: 100 * 1024 * 1024,
          perMessageDeflate: false,
          handleProtocols: null,
          clientTracking: true,
          verifyClient: null,
          noServer: false,
          backlog: null,
          // use default (511 as implemented in net.js)
          server: null,
          host: null,
          path: null,
          port: null,
          ...options
        };
        if (options.port == null && !options.server && !options.noServer) {
          throw new TypeError(
            'One of the "port", "server", or "noServer" options must be specified'
          );
        }
        if (options.port != null) {
          this._server = createServer((req, res) => {
            const body = STATUS_CODES[426];
            res.writeHead(426, {
              "Content-Length": body.length,
              "Content-Type": "text/plain"
            });
            res.end(body);
          });
          this._server.listen(
            options.port,
            options.host,
            options.backlog,
            callback
          );
        } else if (options.server) {
          this._server = options.server;
        }
        if (this._server) {
          const emitConnection = this.emit.bind(this, "connection");
          this._removeListeners = addListeners(this._server, {
            listening: this.emit.bind(this, "listening"),
            error: this.emit.bind(this, "error"),
            upgrade: (req, socket, head) => {
              this.handleUpgrade(req, socket, head, emitConnection);
            }
          });
        }
        if (options.perMessageDeflate === true) options.perMessageDeflate = {};
        if (options.clientTracking) this.clients = /* @__PURE__ */ new Set();
        this.options = options;
      }
      /**
       * Returns the bound address, the address family name, and port of the server
       * as reported by the operating system if listening on an IP socket.
       * If the server is listening on a pipe or UNIX domain socket, the name is
       * returned as a string.
       *
       * @return {(Object|String|null)} The address of the server
       * @public
       */
      address() {
        if (this.options.noServer) {
          throw new Error('The server is operating in "noServer" mode');
        }
        if (!this._server) return null;
        return this._server.address();
      }
      /**
       * Close the server.
       *
       * @param {Function} [cb] Callback
       * @public
       */
      close(cb) {
        if (cb) this.once("close", cb);
        if (this.clients) {
          for (const client of this.clients) client.terminate();
        }
        const server = this._server;
        if (server) {
          this._removeListeners();
          this._removeListeners = this._server = null;
          if (this.options.port != null) {
            server.close(() => this.emit("close"));
            return;
          }
        }
        process.nextTick(emitClose, this);
      }
      /**
       * See if a given request should be handled by this server instance.
       *
       * @param {http.IncomingMessage} req Request object to inspect
       * @return {Boolean} `true` if the request is valid, else `false`
       * @public
       */
      shouldHandle(req) {
        if (this.options.path) {
          const index = req.url.indexOf("?");
          const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
          if (pathname !== this.options.path) return false;
        }
        return true;
      }
      /**
       * Handle a HTTP Upgrade request.
       *
       * @param {http.IncomingMessage} req The request object
       * @param {net.Socket} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @public
       */
      handleUpgrade(req, socket, head, cb) {
        socket.on("error", socketOnError);
        const key = req.headers["sec-websocket-key"] !== void 0 ? req.headers["sec-websocket-key"].trim() : false;
        const version = +req.headers["sec-websocket-version"];
        const extensions = {};
        if (req.method !== "GET" || req.headers.upgrade.toLowerCase() !== "websocket" || !key || !keyRegex.test(key) || version !== 8 && version !== 13 || !this.shouldHandle(req)) {
          return abortHandshake(socket, 400);
        }
        if (this.options.perMessageDeflate) {
          const perMessageDeflate = new PerMessageDeflate(
            this.options.perMessageDeflate,
            true,
            this.options.maxPayload
          );
          try {
            const offers = parse(req.headers["sec-websocket-extensions"]);
            if (offers[PerMessageDeflate.extensionName]) {
              perMessageDeflate.accept(offers[PerMessageDeflate.extensionName]);
              extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            return abortHandshake(socket, 400);
          }
        }
        if (this.options.verifyClient) {
          const info = {
            origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
            secure: !!(req.socket.authorized || req.socket.encrypted),
            req
          };
          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(info, (verified, code, message, headers) => {
              if (!verified) {
                return abortHandshake(socket, code || 401, message, headers);
              }
              this.completeUpgrade(key, extensions, req, socket, head, cb);
            });
            return;
          }
          if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
        }
        this.completeUpgrade(key, extensions, req, socket, head, cb);
      }
      /**
       * Upgrade the connection to WebSocket.
       *
       * @param {String} key The value of the `Sec-WebSocket-Key` header
       * @param {Object} extensions The accepted extensions
       * @param {http.IncomingMessage} req The request object
       * @param {net.Socket} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @throws {Error} If called more than once with the same socket
       * @private
       */
      completeUpgrade(key, extensions, req, socket, head, cb) {
        if (!socket.readable || !socket.writable) return socket.destroy();
        if (socket[kWebSocket]) {
          throw new Error(
            "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
          );
        }
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        const headers = [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${digest}`
        ];
        const ws = new WebSocket(null);
        let protocol = req.headers["sec-websocket-protocol"];
        if (protocol) {
          protocol = protocol.split(",").map(trim);
          if (this.options.handleProtocols) {
            protocol = this.options.handleProtocols(protocol, req);
          } else {
            protocol = protocol[0];
          }
          if (protocol) {
            headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
            ws._protocol = protocol;
          }
        }
        if (extensions[PerMessageDeflate.extensionName]) {
          const params = extensions[PerMessageDeflate.extensionName].params;
          const value = format({
            [PerMessageDeflate.extensionName]: [params]
          });
          headers.push(`Sec-WebSocket-Extensions: ${value}`);
          ws._extensions = extensions;
        }
        this.emit("headers", headers, req);
        socket.write(headers.concat("\r\n").join("\r\n"));
        socket.removeListener("error", socketOnError);
        ws.setSocket(socket, head, this.options.maxPayload);
        if (this.clients) {
          this.clients.add(ws);
          ws.on("close", () => this.clients.delete(ws));
        }
        cb(ws, req);
      }
    };
    module2.exports = WebSocketServer;
    function addListeners(server, map) {
      for (const event of Object.keys(map)) server.on(event, map[event]);
      return function removeListeners() {
        for (const event of Object.keys(map)) {
          server.removeListener(event, map[event]);
        }
      };
    }
    function emitClose(server) {
      server.emit("close");
    }
    function socketOnError() {
      this.destroy();
    }
    function abortHandshake(socket, code, message, headers) {
      if (socket.writable) {
        message = message || STATUS_CODES[code];
        headers = {
          Connection: "close",
          "Content-Type": "text/html",
          "Content-Length": Buffer.byteLength(message),
          ...headers
        };
        socket.write(
          `HTTP/1.1 ${code} ${STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message
        );
      }
      socket.removeListener("error", socketOnError);
      socket.destroy();
    }
    function trim(str) {
      return str.trim();
    }
  }
});

// node_modules/ws/index.js
var require_ws = __commonJS({
  "node_modules/ws/index.js"(exports2, module2) {
    "use strict";
    var WebSocket = require_websocket2();
    WebSocket.createWebSocketStream = require_stream();
    WebSocket.Server = require_websocket_server();
    WebSocket.Receiver = require_receiver();
    WebSocket.Sender = require_sender();
    module2.exports = WebSocket;
  }
});

// node_modules/engine.io/lib/server.js
var require_server = __commonJS({
  "node_modules/engine.io/lib/server.js"(exports2, module2) {
    var qs = require("querystring");
    var parse = require("url").parse;
    var base64id = require_base64id();
    var transports = require_transports();
    var EventEmitter = require("events").EventEmitter;
    var Socket = require_socket();
    var util = require("util");
    var debug = require_src()("engine");
    var cookieMod = require_cookie();
    module2.exports = Server;
    function Server(opts) {
      if (!(this instanceof Server)) {
        return new Server(opts);
      }
      this.clients = {};
      this.clientsCount = 0;
      opts = opts || {};
      this.wsEngine = opts.wsEngine || process.env.EIO_WS_ENGINE || "ws";
      this.pingTimeout = opts.pingTimeout || 5e3;
      this.pingInterval = opts.pingInterval || 25e3;
      this.upgradeTimeout = opts.upgradeTimeout || 1e4;
      this.maxHttpBufferSize = opts.maxHttpBufferSize || 1e8;
      this.transports = opts.transports || Object.keys(transports);
      this.allowUpgrades = false !== opts.allowUpgrades;
      this.allowRequest = opts.allowRequest;
      this.cookie = false !== opts.cookie ? opts.cookie || "io" : false;
      this.cookiePath = false !== opts.cookiePath ? opts.cookiePath || "/" : false;
      this.cookieHttpOnly = false !== opts.cookieHttpOnly;
      this.perMessageDeflate = opts.perMessageDeflate || false;
      this.httpCompression = false !== opts.httpCompression ? opts.httpCompression || {} : false;
      this.initialPacket = opts.initialPacket;
      var self = this;
      ["perMessageDeflate", "httpCompression"].forEach(function(type) {
        var compression = self[type];
        if (true === compression) self[type] = compression = {};
        if (compression && null == compression.threshold) {
          compression.threshold = 1024;
        }
      });
      this.init();
    }
    Server.errors = {
      UNKNOWN_TRANSPORT: 0,
      UNKNOWN_SID: 1,
      BAD_HANDSHAKE_METHOD: 2,
      BAD_REQUEST: 3,
      FORBIDDEN: 4
    };
    Server.errorMessages = {
      0: "Transport unknown",
      1: "Session ID unknown",
      2: "Bad handshake method",
      3: "Bad request",
      4: "Forbidden"
    };
    util.inherits(Server, EventEmitter);
    Server.prototype.init = function() {
      if (!~this.transports.indexOf("websocket")) return;
      if (this.ws) this.ws.close();
      var wsModule = this.wsEngine === "ws" ? require_ws() : require(this.wsEngine);
      this.ws = new wsModule.Server({
        noServer: true,
        clientTracking: false,
        perMessageDeflate: this.perMessageDeflate,
        maxPayload: this.maxHttpBufferSize
      });
    };
    Server.prototype.upgrades = function(transport) {
      if (!this.allowUpgrades) return [];
      return transports[transport].upgradesTo || [];
    };
    Server.prototype.verify = function(req, upgrade, fn) {
      var transport = req._query.transport;
      if (!~this.transports.indexOf(transport)) {
        debug('unknown transport "%s"', transport);
        return fn(Server.errors.UNKNOWN_TRANSPORT, false);
      }
      var isOriginInvalid = checkInvalidHeaderChar(req.headers.origin);
      if (isOriginInvalid) {
        req.headers.origin = null;
        debug("origin header invalid");
        return fn(Server.errors.BAD_REQUEST, false);
      }
      var sid = req._query.sid;
      if (sid) {
        if (!this.clients.hasOwnProperty(sid)) {
          debug('unknown sid "%s"', sid);
          return fn(Server.errors.UNKNOWN_SID, false);
        }
        if (!upgrade && this.clients[sid].transport.name !== transport) {
          debug("bad request: unexpected transport without upgrade");
          return fn(Server.errors.BAD_REQUEST, false);
        }
      } else {
        if ("GET" !== req.method) return fn(Server.errors.BAD_HANDSHAKE_METHOD, false);
        if (!this.allowRequest) return fn(null, true);
        return this.allowRequest(req, fn);
      }
      fn(null, true);
    };
    Server.prototype.prepare = function(req) {
      if (!req._query) {
        req._query = ~req.url.indexOf("?") ? qs.parse(parse(req.url).query) : {};
      }
    };
    Server.prototype.close = function() {
      debug("closing all open clients");
      for (var i in this.clients) {
        if (this.clients.hasOwnProperty(i)) {
          this.clients[i].close(true);
        }
      }
      if (this.ws) {
        debug("closing webSocketServer");
        this.ws.close();
      }
      return this;
    };
    Server.prototype.handleRequest = function(req, res) {
      debug('handling "%s" http request "%s"', req.method, req.url);
      this.prepare(req);
      req.res = res;
      var self = this;
      this.verify(req, false, function(err, success) {
        if (!success) {
          sendErrorMessage(req, res, err);
          return;
        }
        if (req._query.sid) {
          debug("setting new request for existing client");
          self.clients[req._query.sid].transport.onRequest(req);
        } else {
          self.handshake(req._query.transport, req);
        }
      });
    };
    function sendErrorMessage(req, res, code) {
      var headers = { "Content-Type": "application/json" };
      var isForbidden = !Server.errorMessages.hasOwnProperty(code);
      if (isForbidden) {
        res.writeHead(403, headers);
        res.end(JSON.stringify({
          code: Server.errors.FORBIDDEN,
          message: code || Server.errorMessages[Server.errors.FORBIDDEN]
        }));
        return;
      }
      if (req.headers.origin) {
        headers["Access-Control-Allow-Credentials"] = "true";
        headers["Access-Control-Allow-Origin"] = req.headers.origin;
      } else {
        headers["Access-Control-Allow-Origin"] = "*";
      }
      if (res !== void 0) {
        res.writeHead(400, headers);
        res.end(JSON.stringify({
          code,
          message: Server.errorMessages[code]
        }));
      }
    }
    Server.prototype.generateId = function(req) {
      return base64id.generateId();
    };
    Server.prototype.handshake = function(transportName, req) {
      var id = this.generateId(req);
      debug('handshaking client "%s"', id);
      try {
        var transport = new transports[transportName](req);
        if ("polling" === transportName) {
          transport.maxHttpBufferSize = this.maxHttpBufferSize;
          transport.httpCompression = this.httpCompression;
        } else if ("websocket" === transportName) {
          transport.perMessageDeflate = this.perMessageDeflate;
        }
        if (req._query && req._query.b64) {
          transport.supportsBinary = false;
        } else {
          transport.supportsBinary = true;
        }
      } catch (e) {
        debug('error handshaking to transport "%s"', transportName);
        sendErrorMessage(req, req.res, Server.errors.BAD_REQUEST);
        return;
      }
      var socket = new Socket(id, this, transport, req);
      var self = this;
      if (false !== this.cookie) {
        transport.on("headers", function(headers) {
          if (typeof self.cookie === "object") {
            headers["Set-Cookie"] = cookieMod.serialize(self.cookie.name, id, self.cookie);
          } else {
            headers["Set-Cookie"] = cookieMod.serialize(
              self.cookie,
              id,
              {
                path: self.cookiePath,
                httpOnly: self.cookiePath ? self.cookieHttpOnly : false,
                sameSite: true
              }
            );
          }
        });
      }
      transport.onRequest(req);
      this.clients[id] = socket;
      this.clientsCount++;
      socket.once("close", function() {
        delete self.clients[id];
        self.clientsCount--;
      });
      this.emit("connection", socket);
    };
    Server.prototype.handleUpgrade = function(req, socket, upgradeHead) {
      this.prepare(req);
      var self = this;
      this.verify(req, true, function(err, success) {
        if (!success) {
          abortConnection(socket, err);
          return;
        }
        var head = Buffer.from(upgradeHead);
        upgradeHead = null;
        self.ws.handleUpgrade(req, socket, head, function(conn) {
          self.onWebSocket(req, conn);
        });
      });
    };
    Server.prototype.onWebSocket = function(req, socket) {
      socket.on("error", onUpgradeError);
      if (transports[req._query.transport] !== void 0 && !transports[req._query.transport].prototype.handlesUpgrades) {
        debug("transport doesnt handle upgraded requests");
        socket.close();
        return;
      }
      var id = req._query.sid;
      req.websocket = socket;
      if (id) {
        var client = this.clients[id];
        if (!client) {
          debug("upgrade attempt for closed client");
          socket.close();
        } else if (client.upgrading) {
          debug("transport has already been trying to upgrade");
          socket.close();
        } else if (client.upgraded) {
          debug("transport had already been upgraded");
          socket.close();
        } else {
          debug("upgrading existing transport");
          socket.removeListener("error", onUpgradeError);
          var transport = new transports[req._query.transport](req);
          if (req._query && req._query.b64) {
            transport.supportsBinary = false;
          } else {
            transport.supportsBinary = true;
          }
          transport.perMessageDeflate = this.perMessageDeflate;
          client.maybeUpgrade(transport);
        }
      } else {
        socket.removeListener("error", onUpgradeError);
        this.handshake(req._query.transport, req);
      }
      function onUpgradeError() {
        debug("websocket error before upgrade");
      }
    };
    Server.prototype.attach = function(server, options) {
      var self = this;
      options = options || {};
      var path = (options.path || "/engine.io").replace(/\/$/, "");
      var destroyUpgradeTimeout = options.destroyUpgradeTimeout || 1e3;
      path += "/";
      function check(req) {
        if ("OPTIONS" === req.method && false === options.handlePreflightRequest) {
          return false;
        }
        return path === req.url.substr(0, path.length);
      }
      var listeners = server.listeners("request").slice(0);
      server.removeAllListeners("request");
      server.on("close", self.close.bind(self));
      server.on("listening", self.init.bind(self));
      server.on("request", function(req, res) {
        if (check(req)) {
          debug('intercepting request for path "%s"', path);
          if ("OPTIONS" === req.method && "function" === typeof options.handlePreflightRequest) {
            options.handlePreflightRequest.call(server, req, res);
          } else {
            self.handleRequest(req, res);
          }
        } else {
          for (var i = 0, l = listeners.length; i < l; i++) {
            listeners[i].call(server, req, res);
          }
        }
      });
      if (~self.transports.indexOf("websocket")) {
        server.on("upgrade", function(req, socket, head) {
          if (check(req)) {
            self.handleUpgrade(req, socket, head);
          } else if (false !== options.destroyUpgrade) {
            setTimeout(function() {
              if (socket.writable && socket.bytesWritten <= 0) {
                return socket.end();
              }
            }, destroyUpgradeTimeout);
          }
        });
      }
    };
    function abortConnection(socket, code) {
      socket.on("error", () => {
        debug("ignoring error from closed connection");
      });
      if (socket.writable) {
        var message = Server.errorMessages.hasOwnProperty(code) ? Server.errorMessages[code] : String(code || "");
        var length = Buffer.byteLength(message);
        socket.write(
          "HTTP/1.1 400 Bad Request\r\nConnection: close\r\nContent-type: text/html\r\nContent-Length: " + length + "\r\n\r\n" + message
        );
      }
      socket.destroy();
    }
    var validHdrChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      // 0 - 15
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 16 - 31
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 32 - 47
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 48 - 63
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 64 - 79
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 80 - 95
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 96 - 111
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      // 112 - 127
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 128 ...
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1
      // ... 255
    ];
    function checkInvalidHeaderChar(val) {
      val += "";
      if (val.length < 1)
        return false;
      if (!validHdrChars[val.charCodeAt(0)]) {
        debug('invalid header, index 0, char "%s"', val.charCodeAt(0));
        return true;
      }
      if (val.length < 2)
        return false;
      if (!validHdrChars[val.charCodeAt(1)]) {
        debug('invalid header, index 1, char "%s"', val.charCodeAt(1));
        return true;
      }
      if (val.length < 3)
        return false;
      if (!validHdrChars[val.charCodeAt(2)]) {
        debug('invalid header, index 2, char "%s"', val.charCodeAt(2));
        return true;
      }
      if (val.length < 4)
        return false;
      if (!validHdrChars[val.charCodeAt(3)]) {
        debug('invalid header, index 3, char "%s"', val.charCodeAt(3));
        return true;
      }
      for (var i = 4; i < val.length; ++i) {
        if (!validHdrChars[val.charCodeAt(i)]) {
          debug('invalid header, index "%i", char "%s"', i, val.charCodeAt(i));
          return true;
        }
      }
      return false;
    }
  }
});

// node_modules/engine.io/lib/engine.io.js
var require_engine_io = __commonJS({
  "node_modules/engine.io/lib/engine.io.js"(exports2, module2) {
    var http = require("http");
    exports2 = module2.exports = function() {
      if (arguments.length && arguments[0] instanceof http.Server) {
        return attach.apply(this, arguments);
      }
      return exports2.Server.apply(null, arguments);
    };
    exports2.protocol = 1;
    exports2.Server = require_server();
    exports2.Socket = require_socket();
    exports2.Transport = require_transport();
    exports2.transports = require_transports();
    exports2.parser = require_lib();
    exports2.listen = listen;
    function listen(port, options, fn) {
      if ("function" === typeof options) {
        fn = options;
        options = {};
      }
      var server = http.createServer(function(req, res) {
        res.writeHead(501);
        res.end("Not Implemented");
      });
      var engine = exports2.attach(server, options);
      engine.httpServer = server;
      server.listen(port, fn);
      return engine;
    }
    exports2.attach = attach;
    function attach(server, options) {
      var engine = new exports2.Server(options);
      engine.attach(server, options);
      return engine;
    }
  }
});

// node_modules/socket.io-client/package.json
var require_package = __commonJS({
  "node_modules/socket.io-client/package.json"(exports2, module2) {
    module2.exports = {
      name: "socket.io-client",
      version: "2.4.0",
      keywords: [
        "realtime",
        "framework",
        "websocket",
        "tcp",
        "events",
        "client"
      ],
      main: "./lib/index",
      files: [
        "lib/",
        "dist/"
      ],
      dependencies: {
        backo2: "1.0.2",
        "component-bind": "1.0.0",
        "component-emitter": "~1.3.0",
        debug: "~3.1.0",
        "engine.io-client": "~3.5.0",
        "has-binary2": "~1.0.2",
        indexof: "0.0.1",
        parseqs: "0.0.6",
        parseuri: "0.0.6",
        "socket.io-parser": "~3.3.0",
        "to-array": "0.1.4"
      },
      devDependencies: {
        "babel-core": "^6.24.1",
        "babel-eslint": "4.1.7",
        "babel-loader": "7.0.0",
        "babel-preset-es2015": "6.24.1",
        "base64-arraybuffer": "^0.1.5",
        "concat-stream": "^1.6.0",
        derequire: "^2.0.6",
        "eslint-config-standard": "4.4.0",
        "eslint-plugin-standard": "1.3.1",
        "expect.js": "0.3.1",
        gulp: "^3.9.1",
        "gulp-eslint": "1.1.1",
        "gulp-file": "^0.3.0",
        "gulp-istanbul": "^1.1.1",
        "gulp-mocha": "^4.3.1",
        "gulp-task-listing": "1.0.1",
        "has-cors": "^1.1.0",
        "imports-loader": "^0.7.1",
        istanbul: "^0.4.5",
        mocha: "^3.3.0",
        "socket.io": "2.3.0",
        "socket.io-browsers": "^1.0.0",
        "strip-loader": "0.1.2",
        "text-blob-builder": "0.0.1",
        "webpack-merge": "4.1.2",
        "webpack-stream": "3.2.0",
        zuul: "~3.11.1",
        "zuul-builder-webpack": "^1.2.0",
        "zuul-ngrok": "4.0.0"
      },
      scripts: {
        test: "gulp test"
      },
      contributors: [
        {
          name: "Guillermo Rauch",
          email: "rauchg@gmail.com"
        },
        {
          name: "Arnout Kazemier",
          email: "info@3rd-eden.com"
        },
        {
          name: "Vladimir Dronnikov",
          email: "dronnikov@gmail.com"
        },
        {
          name: "Einar Otto Stangvik",
          email: "einaros@gmail.com"
        }
      ],
      repository: {
        type: "git",
        url: "https://github.com/Automattic/socket.io-client.git"
      },
      license: "MIT"
    };
  }
});

// node_modules/socket.io-parser/node_modules/component-emitter/index.js
var require_component_emitter = __commonJS({
  "node_modules/socket.io-parser/node_modules/component-emitter/index.js"(exports2, module2) {
    if (typeof module2 !== "undefined") {
      module2.exports = Emitter;
    }
    function Emitter(obj) {
      if (obj) return mixin(obj);
    }
    function mixin(obj) {
      for (var key in Emitter.prototype) {
        obj[key] = Emitter.prototype[key];
      }
      return obj;
    }
    Emitter.prototype.on = Emitter.prototype.addEventListener = function(event, fn) {
      this._callbacks = this._callbacks || {};
      (this._callbacks["$" + event] = this._callbacks["$" + event] || []).push(fn);
      return this;
    };
    Emitter.prototype.once = function(event, fn) {
      function on() {
        this.off(event, on);
        fn.apply(this, arguments);
      }
      on.fn = fn;
      this.on(event, on);
      return this;
    };
    Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function(event, fn) {
      this._callbacks = this._callbacks || {};
      if (0 == arguments.length) {
        this._callbacks = {};
        return this;
      }
      var callbacks = this._callbacks["$" + event];
      if (!callbacks) return this;
      if (1 == arguments.length) {
        delete this._callbacks["$" + event];
        return this;
      }
      var cb;
      for (var i = 0; i < callbacks.length; i++) {
        cb = callbacks[i];
        if (cb === fn || cb.fn === fn) {
          callbacks.splice(i, 1);
          break;
        }
      }
      return this;
    };
    Emitter.prototype.emit = function(event) {
      this._callbacks = this._callbacks || {};
      var args = [].slice.call(arguments, 1), callbacks = this._callbacks["$" + event];
      if (callbacks) {
        callbacks = callbacks.slice(0);
        for (var i = 0, len = callbacks.length; i < len; ++i) {
          callbacks[i].apply(this, args);
        }
      }
      return this;
    };
    Emitter.prototype.listeners = function(event) {
      this._callbacks = this._callbacks || {};
      return this._callbacks["$" + event] || [];
    };
    Emitter.prototype.hasListeners = function(event) {
      return !!this.listeners(event).length;
    };
  }
});

// node_modules/socket.io-parser/is-buffer.js
var require_is_buffer = __commonJS({
  "node_modules/socket.io-parser/is-buffer.js"(exports2, module2) {
    module2.exports = isBuf;
    var withNativeBuffer = typeof Buffer === "function" && typeof Buffer.isBuffer === "function";
    var withNativeArrayBuffer = typeof ArrayBuffer === "function";
    var isView = function(obj) {
      return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj.buffer instanceof ArrayBuffer;
    };
    function isBuf(obj) {
      return withNativeBuffer && Buffer.isBuffer(obj) || withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj));
    }
  }
});

// node_modules/socket.io-parser/binary.js
var require_binary = __commonJS({
  "node_modules/socket.io-parser/binary.js"(exports2) {
    var isArray = require_isarray();
    var isBuf = require_is_buffer();
    var toString = Object.prototype.toString;
    var withNativeBlob = typeof Blob === "function" || typeof Blob !== "undefined" && toString.call(Blob) === "[object BlobConstructor]";
    var withNativeFile = typeof File === "function" || typeof File !== "undefined" && toString.call(File) === "[object FileConstructor]";
    exports2.deconstructPacket = function(packet) {
      var buffers = [];
      var packetData = packet.data;
      var pack = packet;
      pack.data = _deconstructPacket(packetData, buffers);
      pack.attachments = buffers.length;
      return { packet: pack, buffers };
    };
    function _deconstructPacket(data, buffers) {
      if (!data) return data;
      if (isBuf(data)) {
        var placeholder = { _placeholder: true, num: buffers.length };
        buffers.push(data);
        return placeholder;
      } else if (isArray(data)) {
        var newData = new Array(data.length);
        for (var i = 0; i < data.length; i++) {
          newData[i] = _deconstructPacket(data[i], buffers);
        }
        return newData;
      } else if (typeof data === "object" && !(data instanceof Date)) {
        var newData = {};
        for (var key in data) {
          newData[key] = _deconstructPacket(data[key], buffers);
        }
        return newData;
      }
      return data;
    }
    exports2.reconstructPacket = function(packet, buffers) {
      packet.data = _reconstructPacket(packet.data, buffers);
      packet.attachments = void 0;
      return packet;
    };
    function _reconstructPacket(data, buffers) {
      if (!data) return data;
      if (data && data._placeholder === true) {
        var isIndexValid = typeof data.num === "number" && data.num >= 0 && data.num < buffers.length;
        if (isIndexValid) {
          return buffers[data.num];
        } else {
          throw new Error("illegal attachments");
        }
      } else if (isArray(data)) {
        for (var i = 0; i < data.length; i++) {
          data[i] = _reconstructPacket(data[i], buffers);
        }
      } else if (typeof data === "object") {
        for (var key in data) {
          data[key] = _reconstructPacket(data[key], buffers);
        }
      }
      return data;
    }
    exports2.removeBlobs = function(data, callback) {
      function _removeBlobs(obj, curKey, containingObject) {
        if (!obj) return obj;
        if (withNativeBlob && obj instanceof Blob || withNativeFile && obj instanceof File) {
          pendingBlobs++;
          var fileReader = new FileReader();
          fileReader.onload = function() {
            if (containingObject) {
              containingObject[curKey] = this.result;
            } else {
              bloblessData = this.result;
            }
            if (!--pendingBlobs) {
              callback(bloblessData);
            }
          };
          fileReader.readAsArrayBuffer(obj);
        } else if (isArray(obj)) {
          for (var i = 0; i < obj.length; i++) {
            _removeBlobs(obj[i], i, obj);
          }
        } else if (typeof obj === "object" && !isBuf(obj)) {
          for (var key in obj) {
            _removeBlobs(obj[key], key, obj);
          }
        }
      }
      var pendingBlobs = 0;
      var bloblessData = data;
      _removeBlobs(bloblessData);
      if (!pendingBlobs) {
        callback(bloblessData);
      }
    };
  }
});

// node_modules/socket.io-parser/index.js
var require_socket2 = __commonJS({
  "node_modules/socket.io-parser/index.js"(exports2) {
    var debug = require_src()("socket.io-parser");
    var Emitter = require_component_emitter();
    var binary = require_binary();
    var isArray = require_isarray();
    var isBuf = require_is_buffer();
    exports2.protocol = 4;
    exports2.types = [
      "CONNECT",
      "DISCONNECT",
      "EVENT",
      "ACK",
      "ERROR",
      "BINARY_EVENT",
      "BINARY_ACK"
    ];
    exports2.CONNECT = 0;
    exports2.DISCONNECT = 1;
    exports2.EVENT = 2;
    exports2.ACK = 3;
    exports2.ERROR = 4;
    exports2.BINARY_EVENT = 5;
    exports2.BINARY_ACK = 6;
    exports2.Encoder = Encoder;
    exports2.Decoder = Decoder;
    function Encoder() {
    }
    var ERROR_PACKET = exports2.ERROR + '"encode error"';
    Encoder.prototype.encode = function(obj, callback) {
      debug("encoding packet %j", obj);
      if (exports2.BINARY_EVENT === obj.type || exports2.BINARY_ACK === obj.type) {
        encodeAsBinary(obj, callback);
      } else {
        var encoding = encodeAsString(obj);
        callback([encoding]);
      }
    };
    function encodeAsString(obj) {
      var str = "" + obj.type;
      if (exports2.BINARY_EVENT === obj.type || exports2.BINARY_ACK === obj.type) {
        str += obj.attachments + "-";
      }
      if (obj.nsp && "/" !== obj.nsp) {
        str += obj.nsp + ",";
      }
      if (null != obj.id) {
        str += obj.id;
      }
      if (null != obj.data) {
        var payload = tryStringify(obj.data);
        if (payload !== false) {
          str += payload;
        } else {
          return ERROR_PACKET;
        }
      }
      debug("encoded %j as %s", obj, str);
      return str;
    }
    function tryStringify(str) {
      try {
        return JSON.stringify(str);
      } catch (e) {
        return false;
      }
    }
    function encodeAsBinary(obj, callback) {
      function writeEncoding(bloblessData) {
        var deconstruction = binary.deconstructPacket(bloblessData);
        var pack = encodeAsString(deconstruction.packet);
        var buffers = deconstruction.buffers;
        buffers.unshift(pack);
        callback(buffers);
      }
      binary.removeBlobs(obj, writeEncoding);
    }
    function Decoder(opts) {
      this.reconstructor = null;
      opts = opts || {};
      this.opts = {
        maxAttachments: opts.maxAttachments || 10
      };
    }
    Emitter(Decoder.prototype);
    Decoder.prototype.add = function(obj) {
      var packet;
      if (typeof obj === "string") {
        if (this.reconstructor) {
          throw new Error("got plaintext data when reconstructing a packet");
        }
        packet = decodeString(obj, this.opts.maxAttachments);
        if (exports2.BINARY_EVENT === packet.type || exports2.BINARY_ACK === packet.type) {
          this.reconstructor = new BinaryReconstructor(packet);
        } else {
          this.emit("decoded", packet);
        }
      } else if (isBuf(obj) || obj.base64) {
        if (!this.reconstructor) {
          throw new Error("got binary data when not reconstructing a packet");
        } else {
          packet = this.reconstructor.takeBinaryData(obj);
          if (packet) {
            this.reconstructor = null;
            this.emit("decoded", packet);
          }
        }
      } else {
        throw new Error("Unknown type: " + obj);
      }
    };
    function decodeString(str, maxAttachments) {
      var i = 0;
      var p = {
        type: Number(str.charAt(0))
      };
      if (null == exports2.types[p.type]) {
        return error("unknown packet type " + p.type);
      }
      if (exports2.BINARY_EVENT === p.type || exports2.BINARY_ACK === p.type) {
        var start = i + 1;
        while (str.charAt(++i) !== "-" && i != str.length) {
        }
        var buf = str.substring(start, i);
        if (buf != Number(buf) || str.charAt(i) !== "-") {
          throw new Error("Illegal attachments");
        }
        var n = Number(buf);
        if (!isInteger(n) || n < 1) {
          throw new Error("Illegal attachments");
        } else if (n > maxAttachments) {
          throw new Error("too many attachments");
        }
        p.attachments = n;
      }
      if ("/" === str.charAt(i + 1)) {
        var start = i + 1;
        while (++i) {
          var c = str.charAt(i);
          if ("," === c) break;
          if (i === str.length) break;
        }
        p.nsp = str.substring(start, i);
      } else {
        p.nsp = "/";
      }
      var next = str.charAt(i + 1);
      if ("" !== next && Number(next) == next) {
        var start = i + 1;
        while (++i) {
          var c = str.charAt(i);
          if (null == c || Number(c) != c) {
            --i;
            break;
          }
          if (i === str.length) break;
        }
        p.id = Number(str.substring(start, i + 1));
      }
      if (str.charAt(++i)) {
        var payload = tryParse(str.substr(i));
        if (isPayloadValid(p.type, payload)) {
          p.data = payload;
        } else {
          throw new Error("invalid payload");
        }
      }
      debug("decoded %s as %j", str, p);
      return p;
    }
    function tryParse(str) {
      try {
        return JSON.parse(str);
      } catch (e) {
        return false;
      }
    }
    function isPayloadValid(type, payload) {
      switch (type) {
        case 0:
          return typeof payload === "object";
        case 1:
          return payload === void 0;
        case 4:
          return typeof payload === "string" || typeof payload === "object";
        case 2:
        case 5:
          return isArray(payload) && (typeof payload[0] === "string" || typeof payload[0] === "number");
        case 3:
        case 6:
          return isArray(payload);
      }
    }
    Decoder.prototype.destroy = function() {
      if (this.reconstructor) {
        this.reconstructor.finishedReconstruction();
      }
    };
    function BinaryReconstructor(packet) {
      this.reconPack = packet;
      this.buffers = [];
    }
    BinaryReconstructor.prototype.takeBinaryData = function(binData) {
      this.buffers.push(binData);
      if (this.buffers.length === this.reconPack.attachments) {
        var packet = binary.reconstructPacket(this.reconPack, this.buffers);
        this.finishedReconstruction();
        return packet;
      }
      return null;
    };
    BinaryReconstructor.prototype.finishedReconstruction = function() {
      this.reconPack = null;
      this.buffers = [];
    };
    function error(msg) {
      return {
        type: exports2.ERROR,
        data: "parser error: " + msg
      };
    }
    var isInteger = Number.isInteger || function(value) {
      return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
    };
  }
});

// node_modules/socket.io/lib/client.js
var require_client = __commonJS({
  "node_modules/socket.io/lib/client.js"(exports2, module2) {
    var parser = require_socket2();
    var debug = require_src()("socket.io:client");
    var url = require("url");
    module2.exports = Client;
    function Client(server, conn) {
      this.server = server;
      this.conn = conn;
      this.encoder = server.encoder;
      this.decoder = new server.parser.Decoder();
      this.id = conn.id;
      this.request = conn.request;
      this.setup();
      this.sockets = {};
      this.nsps = {};
      this.connectBuffer = [];
    }
    Client.prototype.setup = function() {
      this.onclose = this.onclose.bind(this);
      this.ondata = this.ondata.bind(this);
      this.onerror = this.onerror.bind(this);
      this.ondecoded = this.ondecoded.bind(this);
      this.decoder.on("decoded", this.ondecoded);
      this.conn.on("data", this.ondata);
      this.conn.on("error", this.onerror);
      this.conn.on("close", this.onclose);
    };
    Client.prototype.connect = function(name, query) {
      if (this.server.nsps[name]) {
        debug("connecting to namespace %s", name);
        return this.doConnect(name, query);
      }
      this.server.checkNamespace(name, query, (dynamicNsp) => {
        if (dynamicNsp) {
          debug("dynamic namespace %s was created", dynamicNsp.name);
          this.doConnect(name, query);
        } else {
          debug("creation of namespace %s was denied", name);
          this.packet({ type: parser.ERROR, nsp: name, data: "Invalid namespace" });
        }
      });
    };
    Client.prototype.doConnect = function(name, query) {
      var nsp = this.server.of(name);
      if ("/" != name && !this.nsps["/"]) {
        this.connectBuffer.push(name);
        return;
      }
      var self = this;
      var socket = nsp.add(this, query, function() {
        self.sockets[socket.id] = socket;
        self.nsps[nsp.name] = socket;
        if ("/" == nsp.name && self.connectBuffer.length > 0) {
          self.connectBuffer.forEach(self.connect, self);
          self.connectBuffer = [];
        }
      });
    };
    Client.prototype.disconnect = function() {
      for (var id in this.sockets) {
        if (this.sockets.hasOwnProperty(id)) {
          this.sockets[id].disconnect();
        }
      }
      this.sockets = {};
      this.close();
    };
    Client.prototype.remove = function(socket) {
      if (this.sockets.hasOwnProperty(socket.id)) {
        var nsp = this.sockets[socket.id].nsp.name;
        delete this.sockets[socket.id];
        delete this.nsps[nsp];
      } else {
        debug("ignoring remove for %s", socket.id);
      }
    };
    Client.prototype.close = function() {
      if ("open" == this.conn.readyState) {
        debug("forcing transport close");
        this.conn.close();
        this.onclose("forced server close");
      }
    };
    Client.prototype.packet = function(packet, opts) {
      opts = opts || {};
      var self = this;
      function writeToEngine(encodedPackets) {
        if (opts.volatile && !self.conn.transport.writable) return;
        for (var i = 0; i < encodedPackets.length; i++) {
          self.conn.write(encodedPackets[i], { compress: opts.compress });
        }
      }
      if ("open" == this.conn.readyState) {
        debug("writing packet %j", packet);
        if (!opts.preEncoded) {
          this.encoder.encode(packet, writeToEngine);
        } else {
          writeToEngine(packet);
        }
      } else {
        debug("ignoring packet write %j", packet);
      }
    };
    Client.prototype.ondata = function(data) {
      try {
        this.decoder.add(data);
      } catch (e) {
        this.onerror(e);
      }
    };
    Client.prototype.ondecoded = function(packet) {
      if (parser.CONNECT == packet.type) {
        this.connect(url.parse(packet.nsp).pathname, url.parse(packet.nsp, true).query);
      } else {
        var socket = this.nsps[packet.nsp];
        if (socket) {
          process.nextTick(function() {
            socket.onpacket(packet);
          });
        } else {
          debug("no socket for namespace %s", packet.nsp);
        }
      }
    };
    Client.prototype.onerror = function(err) {
      for (var id in this.sockets) {
        if (this.sockets.hasOwnProperty(id)) {
          this.sockets[id].onerror(err);
        }
      }
      this.conn.close();
    };
    Client.prototype.onclose = function(reason) {
      debug("client close with reason %s", reason);
      this.destroy();
      for (var id in this.sockets) {
        if (this.sockets.hasOwnProperty(id)) {
          this.sockets[id].onclose(reason);
        }
      }
      this.sockets = {};
      this.decoder.destroy();
    };
    Client.prototype.destroy = function() {
      this.conn.removeListener("data", this.ondata);
      this.conn.removeListener("error", this.onerror);
      this.conn.removeListener("close", this.onclose);
      this.decoder.removeListener("decoded", this.ondecoded);
    };
  }
});

// node_modules/socket.io/lib/socket.js
var require_socket3 = __commonJS({
  "node_modules/socket.io/lib/socket.js"(exports2, module2) {
    var Emitter = require("events").EventEmitter;
    var parser = require_socket2();
    var hasBin = require_has_binary2();
    var url = require("url");
    var debug = require_src()("socket.io:socket");
    module2.exports = exports2 = Socket;
    exports2.events = [
      "error",
      "connect",
      "disconnect",
      "disconnecting",
      "newListener",
      "removeListener"
    ];
    var flags = [
      "json",
      "volatile",
      "broadcast",
      "local"
    ];
    var emit = Emitter.prototype.emit;
    function Socket(nsp, client, query) {
      this.nsp = nsp;
      this.server = nsp.server;
      this.adapter = this.nsp.adapter;
      this.id = nsp.name !== "/" ? nsp.name + "#" + client.id : client.id;
      this.client = client;
      this.conn = client.conn;
      this.rooms = {};
      this.acks = {};
      this.connected = true;
      this.disconnected = false;
      this.handshake = this.buildHandshake(query);
      this.fns = [];
      this.flags = {};
      this._rooms = [];
    }
    Socket.prototype.__proto__ = Emitter.prototype;
    flags.forEach(function(flag) {
      Object.defineProperty(Socket.prototype, flag, {
        get: function() {
          this.flags[flag] = true;
          return this;
        }
      });
    });
    Object.defineProperty(Socket.prototype, "request", {
      get: function() {
        return this.conn.request;
      }
    });
    Socket.prototype.buildHandshake = function(query) {
      var self = this;
      function buildQuery() {
        var requestQuery = url.parse(self.request.url, true).query;
        return Object.assign({}, requestQuery, query);
      }
      return {
        headers: this.request.headers,
        time: /* @__PURE__ */ new Date() + "",
        address: this.conn.remoteAddress,
        xdomain: !!this.request.headers.origin,
        secure: !!this.request.connection.encrypted,
        issued: +/* @__PURE__ */ new Date(),
        url: this.request.url,
        query: buildQuery()
      };
    };
    Socket.prototype.emit = function(ev) {
      if (~exports2.events.indexOf(ev)) {
        emit.apply(this, arguments);
        return this;
      }
      var args = Array.prototype.slice.call(arguments);
      var packet = {
        type: (this.flags.binary !== void 0 ? this.flags.binary : hasBin(args)) ? parser.BINARY_EVENT : parser.EVENT,
        data: args
      };
      if (typeof args[args.length - 1] === "function") {
        if (this._rooms.length || this.flags.broadcast) {
          throw new Error("Callbacks are not supported when broadcasting");
        }
        debug("emitting packet with ack id %d", this.nsp.ids);
        this.acks[this.nsp.ids] = args.pop();
        packet.id = this.nsp.ids++;
      }
      var rooms = this._rooms.slice(0);
      var flags2 = Object.assign({}, this.flags);
      this._rooms = [];
      this.flags = {};
      if (rooms.length || flags2.broadcast) {
        this.adapter.broadcast(packet, {
          except: [this.id],
          rooms,
          flags: flags2
        });
      } else {
        this.packet(packet, flags2);
      }
      return this;
    };
    Socket.prototype.to = Socket.prototype.in = function(name) {
      if (!~this._rooms.indexOf(name)) this._rooms.push(name);
      return this;
    };
    Socket.prototype.send = Socket.prototype.write = function() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift("message");
      this.emit.apply(this, args);
      return this;
    };
    Socket.prototype.packet = function(packet, opts) {
      packet.nsp = this.nsp.name;
      opts = opts || {};
      opts.compress = false !== opts.compress;
      this.client.packet(packet, opts);
    };
    Socket.prototype.join = function(rooms, fn) {
      debug("joining room %s", rooms);
      var self = this;
      if (!Array.isArray(rooms)) {
        rooms = [rooms];
      }
      rooms = rooms.filter(function(room) {
        return !self.rooms.hasOwnProperty(room);
      });
      if (!rooms.length) {
        fn && fn(null);
        return this;
      }
      this.adapter.addAll(this.id, rooms, function(err) {
        if (err) return fn && fn(err);
        debug("joined room %s", rooms);
        rooms.forEach(function(room) {
          self.rooms[room] = room;
        });
        fn && fn(null);
      });
      return this;
    };
    Socket.prototype.leave = function(room, fn) {
      debug("leave room %s", room);
      var self = this;
      this.adapter.del(this.id, room, function(err) {
        if (err) return fn && fn(err);
        debug("left room %s", room);
        delete self.rooms[room];
        fn && fn(null);
      });
      return this;
    };
    Socket.prototype.leaveAll = function() {
      this.adapter.delAll(this.id);
      this.rooms = {};
    };
    Socket.prototype.onconnect = function() {
      debug("socket connected - writing packet");
      this.nsp.connected[this.id] = this;
      this.join(this.id);
      var skip = this.nsp.name === "/" && this.nsp.fns.length === 0;
      if (skip) {
        debug("packet already sent in initial handshake");
      } else {
        this.packet({ type: parser.CONNECT });
      }
    };
    Socket.prototype.onpacket = function(packet) {
      debug("got packet %j", packet);
      switch (packet.type) {
        case parser.EVENT:
          this.onevent(packet);
          break;
        case parser.BINARY_EVENT:
          this.onevent(packet);
          break;
        case parser.ACK:
          this.onack(packet);
          break;
        case parser.BINARY_ACK:
          this.onack(packet);
          break;
        case parser.DISCONNECT:
          this.ondisconnect();
          break;
        case parser.ERROR:
          this.onerror(new Error(packet.data));
      }
    };
    Socket.prototype.onevent = function(packet) {
      var args = packet.data || [];
      debug("emitting event %j", args);
      if (null != packet.id) {
        debug("attaching ack callback to event");
        args.push(this.ack(packet.id));
      }
      this.dispatch(args);
    };
    Socket.prototype.ack = function(id) {
      var self = this;
      var sent = false;
      return function() {
        if (sent) return;
        var args = Array.prototype.slice.call(arguments);
        debug("sending ack %j", args);
        self.packet({
          id,
          type: hasBin(args) ? parser.BINARY_ACK : parser.ACK,
          data: args
        });
        sent = true;
      };
    };
    Socket.prototype.onack = function(packet) {
      var ack = this.acks[packet.id];
      if ("function" == typeof ack) {
        debug("calling ack %s with %j", packet.id, packet.data);
        ack.apply(this, packet.data);
        delete this.acks[packet.id];
      } else {
        debug("bad ack %s", packet.id);
      }
    };
    Socket.prototype.ondisconnect = function() {
      debug("got disconnect packet");
      this.onclose("client namespace disconnect");
    };
    Socket.prototype.onerror = function(err) {
      if (this.listeners("error").length) {
        this.emit("error", err);
      } else {
        console.error("Missing error handler on `socket`.");
        console.error(err.stack);
      }
    };
    Socket.prototype.onclose = function(reason) {
      if (!this.connected) return this;
      debug("closing socket - reason %s", reason);
      this.emit("disconnecting", reason);
      this.leaveAll();
      this.nsp.remove(this);
      this.client.remove(this);
      this.connected = false;
      this.disconnected = true;
      delete this.nsp.connected[this.id];
      this.emit("disconnect", reason);
    };
    Socket.prototype.error = function(err) {
      this.packet({ type: parser.ERROR, data: err });
    };
    Socket.prototype.disconnect = function(close) {
      if (!this.connected) return this;
      if (close) {
        this.client.disconnect();
      } else {
        this.packet({ type: parser.DISCONNECT });
        this.onclose("server namespace disconnect");
      }
      return this;
    };
    Socket.prototype.compress = function(compress) {
      this.flags.compress = compress;
      return this;
    };
    Socket.prototype.binary = function(binary) {
      this.flags.binary = binary;
      return this;
    };
    Socket.prototype.dispatch = function(event) {
      debug("dispatching an event %j", event);
      var self = this;
      function dispatchSocket(err) {
        process.nextTick(function() {
          if (err) {
            return self.error(err.data || err.message);
          }
          emit.apply(self, event);
        });
      }
      this.run(event, dispatchSocket);
    };
    Socket.prototype.use = function(fn) {
      this.fns.push(fn);
      return this;
    };
    Socket.prototype.run = function(event, fn) {
      var fns = this.fns.slice(0);
      if (!fns.length) return fn(null);
      function run(i) {
        fns[i](event, function(err) {
          if (err) return fn(err);
          if (!fns[i + 1]) return fn(null);
          run(i + 1);
        });
      }
      run(0);
    };
  }
});

// node_modules/socket.io/lib/namespace.js
var require_namespace = __commonJS({
  "node_modules/socket.io/lib/namespace.js"(exports2, module2) {
    var Socket = require_socket3();
    var Emitter = require("events").EventEmitter;
    var parser = require_socket2();
    var hasBin = require_has_binary2();
    var debug = require_src()("socket.io:namespace");
    module2.exports = exports2 = Namespace;
    exports2.events = [
      "connect",
      // for symmetry with client
      "connection",
      "newListener"
    ];
    exports2.flags = [
      "json",
      "volatile",
      "local"
    ];
    var emit = Emitter.prototype.emit;
    function Namespace(server, name) {
      this.name = name;
      this.server = server;
      this.sockets = {};
      this.connected = {};
      this.fns = [];
      this.ids = 0;
      this.rooms = [];
      this.flags = {};
      this.initAdapter();
    }
    Namespace.prototype.__proto__ = Emitter.prototype;
    exports2.flags.forEach(function(flag) {
      Object.defineProperty(Namespace.prototype, flag, {
        get: function() {
          this.flags[flag] = true;
          return this;
        }
      });
    });
    Namespace.prototype.initAdapter = function() {
      this.adapter = new (this.server.adapter())(this);
    };
    Namespace.prototype.use = function(fn) {
      if (this.server.eio && this.name === "/") {
        debug("removing initial packet");
        delete this.server.eio.initialPacket;
      }
      this.fns.push(fn);
      return this;
    };
    Namespace.prototype.run = function(socket, fn) {
      var fns = this.fns.slice(0);
      if (!fns.length) return fn(null);
      function run(i) {
        fns[i](socket, function(err) {
          if (err) return fn(err);
          if (!fns[i + 1]) return fn(null);
          run(i + 1);
        });
      }
      run(0);
    };
    Namespace.prototype.to = Namespace.prototype.in = function(name) {
      if (!~this.rooms.indexOf(name)) this.rooms.push(name);
      return this;
    };
    Namespace.prototype.add = function(client, query, fn) {
      debug("adding socket to nsp %s", this.name);
      var socket = new Socket(this, client, query);
      var self = this;
      this.run(socket, function(err) {
        process.nextTick(function() {
          if ("open" == client.conn.readyState) {
            if (err) return socket.error(err.data || err.message);
            self.sockets[socket.id] = socket;
            socket.onconnect();
            if (fn) fn();
            self.emit("connect", socket);
            self.emit("connection", socket);
          } else {
            debug("next called after client was closed - ignoring socket");
          }
        });
      });
      return socket;
    };
    Namespace.prototype.remove = function(socket) {
      if (this.sockets.hasOwnProperty(socket.id)) {
        delete this.sockets[socket.id];
      } else {
        debug("ignoring remove for %s", socket.id);
      }
    };
    Namespace.prototype.emit = function(ev) {
      if (~exports2.events.indexOf(ev)) {
        emit.apply(this, arguments);
        return this;
      }
      var args = Array.prototype.slice.call(arguments);
      var packet = {
        type: (this.flags.binary !== void 0 ? this.flags.binary : hasBin(args)) ? parser.BINARY_EVENT : parser.EVENT,
        data: args
      };
      if ("function" == typeof args[args.length - 1]) {
        throw new Error("Callbacks are not supported when broadcasting");
      }
      var rooms = this.rooms.slice(0);
      var flags = Object.assign({}, this.flags);
      this.rooms = [];
      this.flags = {};
      this.adapter.broadcast(packet, {
        rooms,
        flags
      });
      return this;
    };
    Namespace.prototype.send = Namespace.prototype.write = function() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift("message");
      this.emit.apply(this, args);
      return this;
    };
    Namespace.prototype.clients = function(fn) {
      if (!this.adapter) {
        throw new Error("No adapter for this namespace, are you trying to get the list of clients of a dynamic namespace?");
      }
      this.adapter.clients(this.rooms, fn);
      this.rooms = [];
      return this;
    };
    Namespace.prototype.compress = function(compress) {
      this.flags.compress = compress;
      return this;
    };
    Namespace.prototype.binary = function(binary) {
      this.flags.binary = binary;
      return this;
    };
  }
});

// node_modules/socket.io/lib/parent-namespace.js
var require_parent_namespace = __commonJS({
  "node_modules/socket.io/lib/parent-namespace.js"(exports2, module2) {
    "use strict";
    var Namespace = require_namespace();
    var count = 0;
    var ParentNamespace = class extends Namespace {
      constructor(server) {
        super(server, "/_" + count++);
        this.children = /* @__PURE__ */ new Set();
      }
      initAdapter() {
      }
      emit() {
        const args = Array.prototype.slice.call(arguments);
        this.children.forEach((nsp) => {
          nsp.rooms = this.rooms;
          nsp.flags = this.flags;
          nsp.emit.apply(nsp, args);
        });
        this.rooms = [];
        this.flags = {};
      }
      createChild(name) {
        const namespace = new Namespace(this.server, name);
        namespace.fns = this.fns.slice(0);
        this.listeners("connect").forEach((listener) => namespace.on("connect", listener));
        this.listeners("connection").forEach((listener) => namespace.on("connection", listener));
        this.children.add(namespace);
        this.server.nsps[name] = namespace;
        return namespace;
      }
    };
    module2.exports = ParentNamespace;
  }
});

// node_modules/socket.io-adapter/index.js
var require_socket4 = __commonJS({
  "node_modules/socket.io-adapter/index.js"(exports2, module2) {
    var Emitter = require("events").EventEmitter;
    module2.exports = Adapter;
    function Adapter(nsp) {
      this.nsp = nsp;
      this.rooms = {};
      this.sids = {};
      this.encoder = nsp.server.encoder;
    }
    Adapter.prototype.__proto__ = Emitter.prototype;
    Adapter.prototype.add = function(id, room, fn) {
      return this.addAll(id, [room], fn);
    };
    Adapter.prototype.addAll = function(id, rooms, fn) {
      for (var i = 0; i < rooms.length; i++) {
        var room = rooms[i];
        this.sids[id] = this.sids[id] || {};
        this.sids[id][room] = true;
        this.rooms[room] = this.rooms[room] || Room();
        this.rooms[room].add(id);
      }
      if (fn) process.nextTick(fn.bind(null, null));
    };
    Adapter.prototype.del = function(id, room, fn) {
      if (this.sids[id]) delete this.sids[id][room];
      if (this.rooms.hasOwnProperty(room)) {
        this.rooms[room].del(id);
        if (this.rooms[room].length === 0) delete this.rooms[room];
      }
      if (fn) process.nextTick(fn.bind(null, null));
    };
    Adapter.prototype.delAll = function(id, fn) {
      var rooms = this.sids[id];
      if (rooms) {
        for (var room in rooms) {
          if (this.rooms.hasOwnProperty(room)) {
            this.rooms[room].del(id);
            if (this.rooms[room].length === 0) delete this.rooms[room];
          }
        }
      }
      delete this.sids[id];
      if (fn) process.nextTick(fn.bind(null, null));
    };
    Adapter.prototype.broadcast = function(packet, opts) {
      var rooms = opts.rooms || [];
      var except = opts.except || [];
      var flags = opts.flags || {};
      var packetOpts = {
        preEncoded: true,
        volatile: flags.volatile,
        compress: flags.compress
      };
      var ids = {};
      var self = this;
      var socket;
      packet.nsp = this.nsp.name;
      this.encoder.encode(packet, function(encodedPackets) {
        if (rooms.length) {
          for (var i = 0; i < rooms.length; i++) {
            var room = self.rooms[rooms[i]];
            if (!room) continue;
            var sockets = room.sockets;
            for (var id in sockets) {
              if (sockets.hasOwnProperty(id)) {
                if (ids[id] || ~except.indexOf(id)) continue;
                socket = self.nsp.connected[id];
                if (socket) {
                  socket.packet(encodedPackets, packetOpts);
                  ids[id] = true;
                }
              }
            }
          }
        } else {
          for (var id in self.sids) {
            if (self.sids.hasOwnProperty(id)) {
              if (~except.indexOf(id)) continue;
              socket = self.nsp.connected[id];
              if (socket) socket.packet(encodedPackets, packetOpts);
            }
          }
        }
      });
    };
    Adapter.prototype.clients = function(rooms, fn) {
      if ("function" == typeof rooms) {
        fn = rooms;
        rooms = null;
      }
      rooms = rooms || [];
      var ids = {};
      var sids = [];
      var socket;
      if (rooms.length) {
        for (var i = 0; i < rooms.length; i++) {
          var room = this.rooms[rooms[i]];
          if (!room) continue;
          var sockets = room.sockets;
          for (var id in sockets) {
            if (sockets.hasOwnProperty(id)) {
              if (ids[id]) continue;
              socket = this.nsp.connected[id];
              if (socket) {
                sids.push(id);
                ids[id] = true;
              }
            }
          }
        }
      } else {
        for (var id in this.sids) {
          if (this.sids.hasOwnProperty(id)) {
            socket = this.nsp.connected[id];
            if (socket) sids.push(id);
          }
        }
      }
      if (fn) process.nextTick(fn.bind(null, null, sids));
    };
    Adapter.prototype.clientRooms = function(id, fn) {
      var rooms = this.sids[id];
      if (fn) process.nextTick(fn.bind(null, null, rooms ? Object.keys(rooms) : null));
    };
    function Room() {
      if (!(this instanceof Room)) return new Room();
      this.sockets = {};
      this.length = 0;
    }
    Room.prototype.add = function(id) {
      if (!this.sockets.hasOwnProperty(id)) {
        this.sockets[id] = true;
        this.length++;
      }
    };
    Room.prototype.del = function(id) {
      if (this.sockets.hasOwnProperty(id)) {
        delete this.sockets[id];
        this.length--;
      }
    };
  }
});

// node_modules/socket.io/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/socket.io/lib/index.js"(exports2, module2) {
    "use strict";
    var http = require("http");
    var read = require("fs").readFileSync;
    var path = require("path");
    var exists = require("fs").existsSync;
    var engine = require_engine_io();
    var clientVersion = require_package().version;
    var Client = require_client();
    var Emitter = require("events").EventEmitter;
    var Namespace = require_namespace();
    var ParentNamespace = require_parent_namespace();
    var Adapter = require_socket4();
    var parser = require_socket2();
    var debug = require_src()("socket.io:server");
    var url = require("url");
    module2.exports = Server;
    var clientSource = void 0;
    var clientSourceMap = void 0;
    function Server(srv, opts) {
      if (!(this instanceof Server)) return new Server(srv, opts);
      if ("object" == typeof srv && srv instanceof Object && !srv.listen) {
        opts = srv;
        srv = null;
      }
      opts = opts || {};
      this.nsps = {};
      this.parentNsps = /* @__PURE__ */ new Map();
      this.path(opts.path || "/socket.io");
      this.serveClient(false !== opts.serveClient);
      this.parser = opts.parser || parser;
      this.encoder = new this.parser.Encoder();
      this.adapter(opts.adapter || Adapter);
      this.origins(opts.origins || []);
      this.sockets = this.of("/");
      if (srv) this.attach(srv, opts);
    }
    Server.prototype.checkRequest = function(req, fn) {
      const origin = req.headers.origin;
      if (typeof this._origins === "function") {
        return this._origins(origin, fn);
      }
      if (origin) {
        fn(null, this._origins.includes(origin));
      } else {
        const noOriginIsValid = this._origins.length === 0;
        fn(null, noOriginIsValid);
      }
    };
    Server.prototype.serveClient = function(v) {
      if (!arguments.length) return this._serveClient;
      this._serveClient = v;
      var resolvePath = function(file) {
        var filepath = path.resolve(__dirname, "./../../", file);
        if (exists(filepath)) {
          return filepath;
        }
        return require.resolve(file);
      };
      if (v && !clientSource) {
        clientSource = read(resolvePath("socket.io-client/dist/socket.io.js"), "utf-8");
        try {
          clientSourceMap = read(resolvePath("socket.io-client/dist/socket.io.js.map"), "utf-8");
        } catch (err) {
          debug("could not load sourcemap file");
        }
      }
      return this;
    };
    var oldSettings = {
      "transports": "transports",
      "heartbeat timeout": "pingTimeout",
      "heartbeat interval": "pingInterval",
      "destroy buffer size": "maxHttpBufferSize"
    };
    Server.prototype.set = function(key, val) {
      if ("authorization" == key && val) {
        this.use(function(socket, next) {
          val(socket.request, function(err, authorized) {
            if (err) return next(new Error(err));
            if (!authorized) return next(new Error("Not authorized"));
            next();
          });
        });
      } else if ("origins" == key && val) {
        this.origins(val);
      } else if ("resource" == key) {
        this.path(val);
      } else if (oldSettings[key] && this.eio[oldSettings[key]]) {
        this.eio[oldSettings[key]] = val;
      } else {
        console.error("Option %s is not valid. Please refer to the README.", key);
      }
      return this;
    };
    Server.prototype.checkNamespace = function(name, query, fn) {
      if (this.parentNsps.size === 0) return fn(false);
      const keysIterator = this.parentNsps.keys();
      const run = () => {
        let nextFn = keysIterator.next();
        if (nextFn.done) {
          return fn(false);
        }
        nextFn.value(name, query, (err, allow) => {
          if (err || !allow) {
            run();
          } else {
            fn(this.parentNsps.get(nextFn.value).createChild(name));
          }
        });
      };
      run();
    };
    Server.prototype.path = function(v) {
      if (!arguments.length) return this._path;
      this._path = v.replace(/\/$/, "");
      return this;
    };
    Server.prototype.adapter = function(v) {
      if (!arguments.length) return this._adapter;
      this._adapter = v;
      for (var i in this.nsps) {
        if (this.nsps.hasOwnProperty(i)) {
          this.nsps[i].initAdapter();
        }
      }
      return this;
    };
    Server.prototype.origins = function(v) {
      if (!arguments.length) return this._origins;
      this._origins = typeof v === "string" ? [v] : v;
      return this;
    };
    Server.prototype.listen = Server.prototype.attach = function(srv, opts) {
      if ("function" == typeof srv) {
        var msg = "You are trying to attach socket.io to an express request handler function. Please pass a http.Server instance.";
        throw new Error(msg);
      }
      if (Number(srv) == srv) {
        srv = Number(srv);
      }
      if ("number" == typeof srv) {
        debug("creating http server and binding to %d", srv);
        var port = srv;
        srv = http.Server(function(req, res) {
          res.writeHead(404);
          res.end();
        });
        srv.listen(port);
      }
      opts = opts || {};
      opts.path = opts.path || this.path();
      opts.allowRequest = opts.allowRequest || this.checkRequest.bind(this);
      if (this.sockets.fns.length > 0) {
        this.initEngine(srv, opts);
        return this;
      }
      var self = this;
      var connectPacket = { type: parser.CONNECT, nsp: "/" };
      this.encoder.encode(connectPacket, function(encodedPacket) {
        opts.initialPacket = encodedPacket;
        self.initEngine(srv, opts);
      });
      return this;
    };
    Server.prototype.initEngine = function(srv, opts) {
      debug("creating engine.io instance with opts %j", opts);
      this.eio = engine.attach(srv, opts);
      if (this._serveClient) this.attachServe(srv);
      this.httpServer = srv;
      this.bind(this.eio);
    };
    Server.prototype.attachServe = function(srv) {
      debug("attaching client serving req handler");
      var url2 = this._path + "/socket.io.js";
      var urlMap = this._path + "/socket.io.js.map";
      var evs = srv.listeners("request").slice(0);
      var self = this;
      srv.removeAllListeners("request");
      srv.on("request", function(req, res) {
        if (0 === req.url.indexOf(urlMap)) {
          self.serveMap(req, res);
        } else if (0 === req.url.indexOf(url2)) {
          self.serve(req, res);
        } else {
          for (var i = 0; i < evs.length; i++) {
            evs[i].call(srv, req, res);
          }
        }
      });
    };
    Server.prototype.serve = function(req, res) {
      var expectedEtag = '"' + clientVersion + '"';
      var etag = req.headers["if-none-match"];
      if (etag) {
        if (expectedEtag == etag) {
          debug("serve client 304");
          res.writeHead(304);
          res.end();
          return;
        }
      }
      debug("serve client source");
      res.setHeader("Cache-Control", "public, max-age=0");
      res.setHeader("Content-Type", "application/javascript");
      res.setHeader("ETag", expectedEtag);
      res.writeHead(200);
      res.end(clientSource);
    };
    Server.prototype.serveMap = function(req, res) {
      var expectedEtag = '"' + clientVersion + '"';
      var etag = req.headers["if-none-match"];
      if (etag) {
        if (expectedEtag == etag) {
          debug("serve client 304");
          res.writeHead(304);
          res.end();
          return;
        }
      }
      debug("serve client sourcemap");
      res.setHeader("Content-Type", "application/json");
      res.setHeader("ETag", expectedEtag);
      res.writeHead(200);
      res.end(clientSourceMap);
    };
    Server.prototype.bind = function(engine2) {
      this.engine = engine2;
      this.engine.on("connection", this.onconnection.bind(this));
      return this;
    };
    Server.prototype.onconnection = function(conn) {
      debug("incoming connection with id %s", conn.id);
      var client = new Client(this, conn);
      client.connect("/");
      return this;
    };
    Server.prototype.of = function(name, fn) {
      if (typeof name === "function" || name instanceof RegExp) {
        const parentNsp = new ParentNamespace(this);
        debug("initializing parent namespace %s", parentNsp.name);
        if (typeof name === "function") {
          this.parentNsps.set(name, parentNsp);
        } else {
          this.parentNsps.set((nsp2, conn, next) => next(null, name.test(nsp2)), parentNsp);
        }
        if (fn) parentNsp.on("connect", fn);
        return parentNsp;
      }
      if (String(name)[0] !== "/") name = "/" + name;
      var nsp = this.nsps[name];
      if (!nsp) {
        debug("initializing namespace %s", name);
        nsp = new Namespace(this, name);
        this.nsps[name] = nsp;
      }
      if (fn) nsp.on("connect", fn);
      return nsp;
    };
    Server.prototype.close = function(fn) {
      for (var id in this.nsps["/"].sockets) {
        if (this.nsps["/"].sockets.hasOwnProperty(id)) {
          this.nsps["/"].sockets[id].onclose();
        }
      }
      this.engine.close();
      if (this.httpServer) {
        this.httpServer.close(fn);
      } else {
        fn && fn();
      }
    };
    var emitterMethods = Object.keys(Emitter.prototype).filter(function(key) {
      return typeof Emitter.prototype[key] === "function";
    });
    emitterMethods.concat(["to", "in", "use", "send", "write", "clients", "compress", "binary"]).forEach(function(fn) {
      Server.prototype[fn] = function() {
        return this.sockets[fn].apply(this.sockets, arguments);
      };
    });
    Namespace.flags.forEach(function(flag) {
      Object.defineProperty(Server.prototype, flag, {
        get: function() {
          this.sockets.flags = this.sockets.flags || {};
          this.sockets.flags[flag] = true;
          return this;
        }
      });
    });
    Server.listen = Server;
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/buffer-global.js
var require_buffer_global = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/buffer-global.js"(exports2, module2) {
    module2.exports = c("undefined" !== typeof Buffer && Buffer) || c(exports2.Buffer) || c("undefined" !== typeof window && window.Buffer) || exports2.Buffer;
    function c(B) {
      return B && B.isBuffer && B;
    }
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/bufferish-array.js
var require_bufferish_array = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/bufferish-array.js"(exports2, module2) {
    var Bufferish = require_bufferish();
    var exports2 = module2.exports = alloc(0);
    exports2.alloc = alloc;
    exports2.concat = Bufferish.concat;
    exports2.from = from;
    function alloc(size) {
      return new Array(size);
    }
    function from(value) {
      if (!Bufferish.isBuffer(value) && Bufferish.isView(value)) {
        value = Bufferish.Uint8Array.from(value);
      } else if (Bufferish.isArrayBuffer(value)) {
        value = new Uint8Array(value);
      } else if (typeof value === "string") {
        return Bufferish.from.call(exports2, value);
      } else if (typeof value === "number") {
        throw new TypeError('"value" argument must not be a number');
      }
      return Array.prototype.slice.call(value);
    }
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/bufferish-buffer.js
var require_bufferish_buffer = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/bufferish-buffer.js"(exports2, module2) {
    var Bufferish = require_bufferish();
    var Buffer2 = Bufferish.global;
    var exports2 = module2.exports = Bufferish.hasBuffer ? alloc(0) : [];
    exports2.alloc = Bufferish.hasBuffer && Buffer2.alloc || alloc;
    exports2.concat = Bufferish.concat;
    exports2.from = from;
    function alloc(size) {
      return Buffer2.alloc(size);
    }
    function from(value) {
      if (!Bufferish.isBuffer(value) && Bufferish.isView(value)) {
        value = Bufferish.Uint8Array.from(value);
      } else if (Bufferish.isArrayBuffer(value)) {
        value = new Uint8Array(value);
      } else if (typeof value === "string") {
        return Bufferish.from.call(exports2, value);
      } else if (typeof value === "number") {
        throw new TypeError('"value" argument must not be a number');
      }
      if (Buffer2.from && Buffer2.from.length !== 1) {
        return Buffer2.from(value);
      } else {
        return new Buffer2(value);
      }
    }
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/bufferish-uint8array.js
var require_bufferish_uint8array = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/bufferish-uint8array.js"(exports2, module2) {
    var Bufferish = require_bufferish();
    var exports2 = module2.exports = Bufferish.hasArrayBuffer ? alloc(0) : [];
    exports2.alloc = alloc;
    exports2.concat = Bufferish.concat;
    exports2.from = from;
    function alloc(size) {
      return new Uint8Array(size);
    }
    function from(value) {
      if (Bufferish.isView(value)) {
        var byteOffset = value.byteOffset;
        var byteLength = value.byteLength;
        value = value.buffer;
        if (value.byteLength !== byteLength) {
          if (value.slice) {
            value = value.slice(byteOffset, byteOffset + byteLength);
          } else {
            value = new Uint8Array(value);
            if (value.byteLength !== byteLength) {
              value = Array.prototype.slice.call(value, byteOffset, byteOffset + byteLength);
            }
          }
        }
      } else if (typeof value === "string") {
        return Bufferish.from.call(exports2, value);
      } else if (typeof value === "number") {
        throw new TypeError('"value" argument must not be a number');
      }
      return new Uint8Array(value);
    }
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/buffer-lite.js
var require_buffer_lite = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/buffer-lite.js"(exports2) {
    exports2.copy = copy;
    exports2.toString = toString;
    exports2.write = write;
    function write(string, offset) {
      var buffer = this;
      var index = offset || (offset |= 0);
      var length = string.length;
      var chr = 0;
      var i = 0;
      while (i < length) {
        chr = string.charCodeAt(i++);
        if (chr < 128) {
          buffer[index++] = chr;
        } else if (chr < 2048) {
          buffer[index++] = 192 | chr >>> 6;
          buffer[index++] = 128 | chr & 63;
        } else if (chr < 55296 || chr > 57343) {
          buffer[index++] = 224 | chr >>> 12;
          buffer[index++] = 128 | chr >>> 6 & 63;
          buffer[index++] = 128 | chr & 63;
        } else {
          chr = (chr - 55296 << 10 | string.charCodeAt(i++) - 56320) + 65536;
          buffer[index++] = 240 | chr >>> 18;
          buffer[index++] = 128 | chr >>> 12 & 63;
          buffer[index++] = 128 | chr >>> 6 & 63;
          buffer[index++] = 128 | chr & 63;
        }
      }
      return index - offset;
    }
    function toString(encoding, start, end) {
      var buffer = this;
      var index = start | 0;
      if (!end) end = buffer.length;
      var string = "";
      var chr = 0;
      while (index < end) {
        chr = buffer[index++];
        if (chr < 128) {
          string += String.fromCharCode(chr);
          continue;
        }
        if ((chr & 224) === 192) {
          chr = (chr & 31) << 6 | buffer[index++] & 63;
        } else if ((chr & 240) === 224) {
          chr = (chr & 15) << 12 | (buffer[index++] & 63) << 6 | buffer[index++] & 63;
        } else if ((chr & 248) === 240) {
          chr = (chr & 7) << 18 | (buffer[index++] & 63) << 12 | (buffer[index++] & 63) << 6 | buffer[index++] & 63;
        }
        if (chr >= 65536) {
          chr -= 65536;
          string += String.fromCharCode((chr >>> 10) + 55296, (chr & 1023) + 56320);
        } else {
          string += String.fromCharCode(chr);
        }
      }
      return string;
    }
    function copy(target, targetStart, start, end) {
      var i;
      if (!start) start = 0;
      if (!end && end !== 0) end = this.length;
      if (!targetStart) targetStart = 0;
      var len = end - start;
      if (target === this && start < targetStart && targetStart < end) {
        for (i = len - 1; i >= 0; i--) {
          target[i + targetStart] = this[i + start];
        }
      } else {
        for (i = 0; i < len; i++) {
          target[i + targetStart] = this[i + start];
        }
      }
      return len;
    }
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/bufferish-proto.js
var require_bufferish_proto = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/bufferish-proto.js"(exports2) {
    var BufferLite = require_buffer_lite();
    exports2.copy = copy;
    exports2.slice = slice;
    exports2.toString = toString;
    exports2.write = gen("write");
    var Bufferish = require_bufferish();
    var Buffer2 = Bufferish.global;
    var isBufferShim = Bufferish.hasBuffer && "TYPED_ARRAY_SUPPORT" in Buffer2;
    var brokenTypedArray = isBufferShim && !Buffer2.TYPED_ARRAY_SUPPORT;
    function copy(target, targetStart, start, end) {
      var thisIsBuffer = Bufferish.isBuffer(this);
      var targetIsBuffer = Bufferish.isBuffer(target);
      if (thisIsBuffer && targetIsBuffer) {
        return this.copy(target, targetStart, start, end);
      } else if (!brokenTypedArray && !thisIsBuffer && !targetIsBuffer && Bufferish.isView(this) && Bufferish.isView(target)) {
        var buffer = start || end != null ? slice.call(this, start, end) : this;
        target.set(buffer, targetStart);
        return buffer.length;
      } else {
        return BufferLite.copy.call(this, target, targetStart, start, end);
      }
    }
    function slice(start, end) {
      var f = this.slice || !brokenTypedArray && this.subarray;
      if (f) return f.call(this, start, end);
      var target = Bufferish.alloc.call(this, end - start);
      copy.call(this, target, 0, start, end);
      return target;
    }
    function toString(encoding, start, end) {
      var f = !isBufferShim && Bufferish.isBuffer(this) ? this.toString : BufferLite.toString;
      return f.apply(this, arguments);
    }
    function gen(method) {
      return wrap;
      function wrap() {
        var f = this[method] || BufferLite[method];
        return f.apply(this, arguments);
      }
    }
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/bufferish.js
var require_bufferish = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/bufferish.js"(exports2) {
    var Buffer2 = exports2.global = require_buffer_global();
    var hasBuffer = exports2.hasBuffer = Buffer2 && !!Buffer2.isBuffer;
    var hasArrayBuffer = exports2.hasArrayBuffer = "undefined" !== typeof ArrayBuffer;
    exports2.isArrayBuffer = hasArrayBuffer ? isArrayBuffer : _false;
    var isBuffer = exports2.isBuffer = hasBuffer ? Buffer2.isBuffer : _false;
    var isView = exports2.isView = hasArrayBuffer ? ArrayBuffer.isView || _is("ArrayBuffer", "buffer") : _false;
    exports2.alloc = alloc;
    exports2.concat = concat;
    exports2.from = from;
    var BufferArray = exports2.Array = require_bufferish_array();
    var BufferBuffer = exports2.Buffer = require_bufferish_buffer();
    var BufferUint8Array = exports2.Uint8Array = require_bufferish_uint8array();
    var BufferProto = exports2.prototype = require_bufferish_proto();
    function from(value) {
      if (typeof value === "string") {
        return fromString.call(this, value);
      } else {
        return auto(this).from(value);
      }
    }
    function alloc(size) {
      return auto(this).alloc(size);
    }
    function concat(list, length) {
      if (!length) {
        length = 0;
        Array.prototype.forEach.call(list, dryrun);
      }
      var ref = this !== exports2 && this || list[0];
      var result = alloc.call(ref, length);
      var offset = 0;
      Array.prototype.forEach.call(list, append);
      return result;
      function dryrun(buffer) {
        length += buffer.length;
      }
      function append(buffer) {
        offset += BufferProto.copy.call(buffer, result, offset);
      }
    }
    var _isArrayBuffer = _is("ArrayBuffer");
    function isArrayBuffer(value) {
      return value instanceof ArrayBuffer || _isArrayBuffer(value);
    }
    function fromString(value) {
      var expected = value.length * 3;
      var that = alloc.call(this, expected);
      var actual = BufferProto.write.call(that, value);
      if (expected !== actual) {
        that = BufferProto.slice.call(that, 0, actual);
      }
      return that;
    }
    function auto(that) {
      return isBuffer(that) ? BufferBuffer : isView(that) ? BufferUint8Array : Array.isArray(that) ? BufferArray : hasBuffer ? BufferBuffer : hasArrayBuffer ? BufferUint8Array : BufferArray;
    }
    function _false() {
      return false;
    }
    function _is(name, key) {
      name = "[object " + name + "]";
      return function(value) {
        return value != null && {}.toString.call(key ? value[key] : value) === name;
      };
    }
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/ext-buffer.js
var require_ext_buffer = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/ext-buffer.js"(exports2) {
    exports2.ExtBuffer = ExtBuffer;
    var Bufferish = require_bufferish();
    function ExtBuffer(buffer, type) {
      if (!(this instanceof ExtBuffer)) return new ExtBuffer(buffer, type);
      this.buffer = Bufferish.from(buffer);
      this.type = type;
    }
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/ext-packer.js
var require_ext_packer = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/ext-packer.js"(exports2) {
    exports2.setExtPackers = setExtPackers;
    var Bufferish = require_bufferish();
    var Buffer2 = Bufferish.global;
    var packTypedArray = Bufferish.Uint8Array.from;
    var _encode;
    var ERROR_COLUMNS = { name: 1, message: 1, stack: 1, columnNumber: 1, fileName: 1, lineNumber: 1 };
    function setExtPackers(codec) {
      codec.addExtPacker(14, Error, [packError, encode]);
      codec.addExtPacker(1, EvalError, [packError, encode]);
      codec.addExtPacker(2, RangeError, [packError, encode]);
      codec.addExtPacker(3, ReferenceError, [packError, encode]);
      codec.addExtPacker(4, SyntaxError, [packError, encode]);
      codec.addExtPacker(5, TypeError, [packError, encode]);
      codec.addExtPacker(6, URIError, [packError, encode]);
      codec.addExtPacker(10, RegExp, [packRegExp, encode]);
      codec.addExtPacker(11, Boolean, [packValueOf, encode]);
      codec.addExtPacker(12, String, [packValueOf, encode]);
      codec.addExtPacker(13, Date, [Number, encode]);
      codec.addExtPacker(15, Number, [packValueOf, encode]);
      if ("undefined" !== typeof Uint8Array) {
        codec.addExtPacker(17, Int8Array, packTypedArray);
        codec.addExtPacker(18, Uint8Array, packTypedArray);
        codec.addExtPacker(19, Int16Array, packTypedArray);
        codec.addExtPacker(20, Uint16Array, packTypedArray);
        codec.addExtPacker(21, Int32Array, packTypedArray);
        codec.addExtPacker(22, Uint32Array, packTypedArray);
        codec.addExtPacker(23, Float32Array, packTypedArray);
        if ("undefined" !== typeof Float64Array) {
          codec.addExtPacker(24, Float64Array, packTypedArray);
        }
        if ("undefined" !== typeof Uint8ClampedArray) {
          codec.addExtPacker(25, Uint8ClampedArray, packTypedArray);
        }
        codec.addExtPacker(26, ArrayBuffer, packTypedArray);
        codec.addExtPacker(29, DataView, packTypedArray);
      }
      if (Bufferish.hasBuffer) {
        codec.addExtPacker(27, Buffer2, Bufferish.from);
      }
    }
    function encode(input) {
      if (!_encode) _encode = require_encode().encode;
      return _encode(input);
    }
    function packValueOf(value) {
      return value.valueOf();
    }
    function packRegExp(value) {
      value = RegExp.prototype.toString.call(value).split("/");
      value.shift();
      var out = [value.pop()];
      out.unshift(value.join("/"));
      return out;
    }
    function packError(value) {
      var out = {};
      for (var key in ERROR_COLUMNS) {
        out[key] = value[key];
      }
      return out;
    }
  }
});

// node_modules/int64-buffer/int64-buffer.js
var require_int64_buffer = __commonJS({
  "node_modules/int64-buffer/int64-buffer.js"(exports2) {
    var Uint64BE;
    var Int64BE;
    var Uint64LE;
    var Int64LE;
    !function(exports3) {
      var UNDEFINED = "undefined";
      var BUFFER = UNDEFINED !== typeof Buffer && Buffer;
      var UINT8ARRAY = UNDEFINED !== typeof Uint8Array && Uint8Array;
      var ARRAYBUFFER = UNDEFINED !== typeof ArrayBuffer && ArrayBuffer;
      var ZERO = [0, 0, 0, 0, 0, 0, 0, 0];
      var isArray = Array.isArray || _isArray;
      var BIT32 = 4294967296;
      var BIT24 = 16777216;
      var storage;
      Uint64BE = factory("Uint64BE", true, true);
      Int64BE = factory("Int64BE", true, false);
      Uint64LE = factory("Uint64LE", false, true);
      Int64LE = factory("Int64LE", false, false);
      function factory(name, bigendian, unsigned) {
        var posH = bigendian ? 0 : 4;
        var posL = bigendian ? 4 : 0;
        var pos0 = bigendian ? 0 : 3;
        var pos1 = bigendian ? 1 : 2;
        var pos2 = bigendian ? 2 : 1;
        var pos3 = bigendian ? 3 : 0;
        var fromPositive = bigendian ? fromPositiveBE : fromPositiveLE;
        var fromNegative = bigendian ? fromNegativeBE : fromNegativeLE;
        var proto = Int64.prototype;
        var isName = "is" + name;
        var _isInt64 = "_" + isName;
        proto.buffer = void 0;
        proto.offset = 0;
        proto[_isInt64] = true;
        proto.toNumber = toNumber;
        proto.toString = toString;
        proto.toJSON = toNumber;
        proto.toArray = toArray;
        if (BUFFER) proto.toBuffer = toBuffer;
        if (UINT8ARRAY) proto.toArrayBuffer = toArrayBuffer;
        Int64[isName] = isInt64;
        exports3[name] = Int64;
        return Int64;
        function Int64(buffer, offset, value, raddix) {
          if (!(this instanceof Int64)) return new Int64(buffer, offset, value, raddix);
          return init(this, buffer, offset, value, raddix);
        }
        function isInt64(b) {
          return !!(b && b[_isInt64]);
        }
        function init(that, buffer, offset, value, raddix) {
          if (UINT8ARRAY && ARRAYBUFFER) {
            if (buffer instanceof ARRAYBUFFER) buffer = new UINT8ARRAY(buffer);
            if (value instanceof ARRAYBUFFER) value = new UINT8ARRAY(value);
          }
          if (!buffer && !offset && !value && !storage) {
            that.buffer = newArray(ZERO, 0);
            return;
          }
          if (!isValidBuffer(buffer, offset)) {
            var _storage = storage || Array;
            raddix = offset;
            value = buffer;
            offset = 0;
            buffer = new _storage(8);
          }
          that.buffer = buffer;
          that.offset = offset |= 0;
          if (UNDEFINED === typeof value) return;
          if ("string" === typeof value) {
            fromString(buffer, offset, value, raddix || 10);
          } else if (isValidBuffer(value, raddix)) {
            fromArray(buffer, offset, value, raddix);
          } else if ("number" === typeof raddix) {
            writeInt32(buffer, offset + posH, value);
            writeInt32(buffer, offset + posL, raddix);
          } else if (value > 0) {
            fromPositive(buffer, offset, value);
          } else if (value < 0) {
            fromNegative(buffer, offset, value);
          } else {
            fromArray(buffer, offset, ZERO, 0);
          }
        }
        function fromString(buffer, offset, str, raddix) {
          var pos = 0;
          var len = str.length;
          var high = 0;
          var low = 0;
          if (str[0] === "-") pos++;
          var sign = pos;
          while (pos < len) {
            var chr = parseInt(str[pos++], raddix);
            if (!(chr >= 0)) break;
            low = low * raddix + chr;
            high = high * raddix + Math.floor(low / BIT32);
            low %= BIT32;
          }
          if (sign) {
            high = ~high;
            if (low) {
              low = BIT32 - low;
            } else {
              high++;
            }
          }
          writeInt32(buffer, offset + posH, high);
          writeInt32(buffer, offset + posL, low);
        }
        function toNumber() {
          var buffer = this.buffer;
          var offset = this.offset;
          var high = readInt32(buffer, offset + posH);
          var low = readInt32(buffer, offset + posL);
          if (!unsigned) high |= 0;
          return high ? high * BIT32 + low : low;
        }
        function toString(radix) {
          var buffer = this.buffer;
          var offset = this.offset;
          var high = readInt32(buffer, offset + posH);
          var low = readInt32(buffer, offset + posL);
          var str = "";
          var sign = !unsigned && high & 2147483648;
          if (sign) {
            high = ~high;
            low = BIT32 - low;
          }
          radix = radix || 10;
          while (1) {
            var mod = high % radix * BIT32 + low;
            high = Math.floor(high / radix);
            low = Math.floor(mod / radix);
            str = (mod % radix).toString(radix) + str;
            if (!high && !low) break;
          }
          if (sign) {
            str = "-" + str;
          }
          return str;
        }
        function writeInt32(buffer, offset, value) {
          buffer[offset + pos3] = value & 255;
          value = value >> 8;
          buffer[offset + pos2] = value & 255;
          value = value >> 8;
          buffer[offset + pos1] = value & 255;
          value = value >> 8;
          buffer[offset + pos0] = value & 255;
        }
        function readInt32(buffer, offset) {
          return buffer[offset + pos0] * BIT24 + (buffer[offset + pos1] << 16) + (buffer[offset + pos2] << 8) + buffer[offset + pos3];
        }
      }
      function toArray(raw) {
        var buffer = this.buffer;
        var offset = this.offset;
        storage = null;
        if (raw !== false && offset === 0 && buffer.length === 8 && isArray(buffer)) return buffer;
        return newArray(buffer, offset);
      }
      function toBuffer(raw) {
        var buffer = this.buffer;
        var offset = this.offset;
        storage = BUFFER;
        if (raw !== false && offset === 0 && buffer.length === 8 && Buffer.isBuffer(buffer)) return buffer;
        var dest = new BUFFER(8);
        fromArray(dest, 0, buffer, offset);
        return dest;
      }
      function toArrayBuffer(raw) {
        var buffer = this.buffer;
        var offset = this.offset;
        var arrbuf = buffer.buffer;
        storage = UINT8ARRAY;
        if (raw !== false && offset === 0 && arrbuf instanceof ARRAYBUFFER && arrbuf.byteLength === 8) return arrbuf;
        var dest = new UINT8ARRAY(8);
        fromArray(dest, 0, buffer, offset);
        return dest.buffer;
      }
      function isValidBuffer(buffer, offset) {
        var len = buffer && buffer.length;
        offset |= 0;
        return len && offset + 8 <= len && "string" !== typeof buffer[offset];
      }
      function fromArray(destbuf, destoff, srcbuf, srcoff) {
        destoff |= 0;
        srcoff |= 0;
        for (var i = 0; i < 8; i++) {
          destbuf[destoff++] = srcbuf[srcoff++] & 255;
        }
      }
      function newArray(buffer, offset) {
        return Array.prototype.slice.call(buffer, offset, offset + 8);
      }
      function fromPositiveBE(buffer, offset, value) {
        var pos = offset + 8;
        while (pos > offset) {
          buffer[--pos] = value & 255;
          value /= 256;
        }
      }
      function fromNegativeBE(buffer, offset, value) {
        var pos = offset + 8;
        value++;
        while (pos > offset) {
          buffer[--pos] = -value & 255 ^ 255;
          value /= 256;
        }
      }
      function fromPositiveLE(buffer, offset, value) {
        var end = offset + 8;
        while (offset < end) {
          buffer[offset++] = value & 255;
          value /= 256;
        }
      }
      function fromNegativeLE(buffer, offset, value) {
        var end = offset + 8;
        value++;
        while (offset < end) {
          buffer[offset++] = -value & 255 ^ 255;
          value /= 256;
        }
      }
      function _isArray(val) {
        return !!val && "[object Array]" == Object.prototype.toString.call(val);
      }
    }(typeof exports2 === "object" && typeof exports2.nodeName !== "string" ? exports2 : exports2 || {});
  }
});

// node_modules/ieee754/index.js
var require_ieee754 = __commonJS({
  "node_modules/ieee754/index.js"(exports2) {
    exports2.read = function(buffer, offset, isLE, mLen, nBytes) {
      var e, m;
      var eLen = nBytes * 8 - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var nBits = -7;
      var i = isLE ? nBytes - 1 : 0;
      var d = isLE ? -1 : 1;
      var s = buffer[offset + i];
      i += d;
      e = s & (1 << -nBits) - 1;
      s >>= -nBits;
      nBits += eLen;
      for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {
      }
      m = e & (1 << -nBits) - 1;
      e >>= -nBits;
      nBits += mLen;
      for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {
      }
      if (e === 0) {
        e = 1 - eBias;
      } else if (e === eMax) {
        return m ? NaN : (s ? -1 : 1) * Infinity;
      } else {
        m = m + Math.pow(2, mLen);
        e = e - eBias;
      }
      return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
    };
    exports2.write = function(buffer, value, offset, isLE, mLen, nBytes) {
      var e, m, c;
      var eLen = nBytes * 8 - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
      var i = isLE ? 0 : nBytes - 1;
      var d = isLE ? 1 : -1;
      var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
      value = Math.abs(value);
      if (isNaN(value) || value === Infinity) {
        m = isNaN(value) ? 1 : 0;
        e = eMax;
      } else {
        e = Math.floor(Math.log(value) / Math.LN2);
        if (value * (c = Math.pow(2, -e)) < 1) {
          e--;
          c *= 2;
        }
        if (e + eBias >= 1) {
          value += rt / c;
        } else {
          value += rt * Math.pow(2, 1 - eBias);
        }
        if (value * c >= 2) {
          e++;
          c /= 2;
        }
        if (e + eBias >= eMax) {
          m = 0;
          e = eMax;
        } else if (e + eBias >= 1) {
          m = (value * c - 1) * Math.pow(2, mLen);
          e = e + eBias;
        } else {
          m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
          e = 0;
        }
      }
      for (; mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8) {
      }
      e = e << mLen | m;
      eLen += mLen;
      for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8) {
      }
      buffer[offset + i - d] |= s * 128;
    };
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/write-uint8.js
var require_write_uint8 = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/write-uint8.js"(exports2) {
    var constant = exports2.uint8 = new Array(256);
    for (i = 0; i <= 255; i++) {
      constant[i] = write0(i);
    }
    var i;
    function write0(type) {
      return function(encoder) {
        var offset = encoder.reserve(1);
        encoder.buffer[offset] = type;
      };
    }
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/write-token.js
var require_write_token = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/write-token.js"(exports2) {
    var ieee754 = require_ieee754();
    var Int64Buffer = require_int64_buffer();
    var Uint64BE = Int64Buffer.Uint64BE;
    var Int64BE = Int64Buffer.Int64BE;
    var uint8 = require_write_uint8().uint8;
    var Bufferish = require_bufferish();
    var Buffer2 = Bufferish.global;
    var IS_BUFFER_SHIM = Bufferish.hasBuffer && "TYPED_ARRAY_SUPPORT" in Buffer2;
    var NO_TYPED_ARRAY = IS_BUFFER_SHIM && !Buffer2.TYPED_ARRAY_SUPPORT;
    var Buffer_prototype = Bufferish.hasBuffer && Buffer2.prototype || {};
    exports2.getWriteToken = getWriteToken;
    function getWriteToken(options) {
      if (options && options.uint8array) {
        return init_uint8array();
      } else if (NO_TYPED_ARRAY || Bufferish.hasBuffer && options && options.safe) {
        return init_safe();
      } else {
        return init_token();
      }
    }
    function init_uint8array() {
      var token = init_token();
      token[202] = writeN(202, 4, writeFloatBE);
      token[203] = writeN(203, 8, writeDoubleBE);
      return token;
    }
    function init_token() {
      var token = uint8.slice();
      token[196] = write1(196);
      token[197] = write2(197);
      token[198] = write4(198);
      token[199] = write1(199);
      token[200] = write2(200);
      token[201] = write4(201);
      token[202] = writeN(202, 4, Buffer_prototype.writeFloatBE || writeFloatBE, true);
      token[203] = writeN(203, 8, Buffer_prototype.writeDoubleBE || writeDoubleBE, true);
      token[204] = write1(204);
      token[205] = write2(205);
      token[206] = write4(206);
      token[207] = writeN(207, 8, writeUInt64BE);
      token[208] = write1(208);
      token[209] = write2(209);
      token[210] = write4(210);
      token[211] = writeN(211, 8, writeInt64BE);
      token[217] = write1(217);
      token[218] = write2(218);
      token[219] = write4(219);
      token[220] = write2(220);
      token[221] = write4(221);
      token[222] = write2(222);
      token[223] = write4(223);
      return token;
    }
    function init_safe() {
      var token = uint8.slice();
      token[196] = writeN(196, 1, Buffer2.prototype.writeUInt8);
      token[197] = writeN(197, 2, Buffer2.prototype.writeUInt16BE);
      token[198] = writeN(198, 4, Buffer2.prototype.writeUInt32BE);
      token[199] = writeN(199, 1, Buffer2.prototype.writeUInt8);
      token[200] = writeN(200, 2, Buffer2.prototype.writeUInt16BE);
      token[201] = writeN(201, 4, Buffer2.prototype.writeUInt32BE);
      token[202] = writeN(202, 4, Buffer2.prototype.writeFloatBE);
      token[203] = writeN(203, 8, Buffer2.prototype.writeDoubleBE);
      token[204] = writeN(204, 1, Buffer2.prototype.writeUInt8);
      token[205] = writeN(205, 2, Buffer2.prototype.writeUInt16BE);
      token[206] = writeN(206, 4, Buffer2.prototype.writeUInt32BE);
      token[207] = writeN(207, 8, writeUInt64BE);
      token[208] = writeN(208, 1, Buffer2.prototype.writeInt8);
      token[209] = writeN(209, 2, Buffer2.prototype.writeInt16BE);
      token[210] = writeN(210, 4, Buffer2.prototype.writeInt32BE);
      token[211] = writeN(211, 8, writeInt64BE);
      token[217] = writeN(217, 1, Buffer2.prototype.writeUInt8);
      token[218] = writeN(218, 2, Buffer2.prototype.writeUInt16BE);
      token[219] = writeN(219, 4, Buffer2.prototype.writeUInt32BE);
      token[220] = writeN(220, 2, Buffer2.prototype.writeUInt16BE);
      token[221] = writeN(221, 4, Buffer2.prototype.writeUInt32BE);
      token[222] = writeN(222, 2, Buffer2.prototype.writeUInt16BE);
      token[223] = writeN(223, 4, Buffer2.prototype.writeUInt32BE);
      return token;
    }
    function write1(type) {
      return function(encoder, value) {
        var offset = encoder.reserve(2);
        var buffer = encoder.buffer;
        buffer[offset++] = type;
        buffer[offset] = value;
      };
    }
    function write2(type) {
      return function(encoder, value) {
        var offset = encoder.reserve(3);
        var buffer = encoder.buffer;
        buffer[offset++] = type;
        buffer[offset++] = value >>> 8;
        buffer[offset] = value;
      };
    }
    function write4(type) {
      return function(encoder, value) {
        var offset = encoder.reserve(5);
        var buffer = encoder.buffer;
        buffer[offset++] = type;
        buffer[offset++] = value >>> 24;
        buffer[offset++] = value >>> 16;
        buffer[offset++] = value >>> 8;
        buffer[offset] = value;
      };
    }
    function writeN(type, len, method, noAssert) {
      return function(encoder, value) {
        var offset = encoder.reserve(len + 1);
        encoder.buffer[offset++] = type;
        method.call(encoder.buffer, value, offset, noAssert);
      };
    }
    function writeUInt64BE(value, offset) {
      new Uint64BE(this, offset, value);
    }
    function writeInt64BE(value, offset) {
      new Int64BE(this, offset, value);
    }
    function writeFloatBE(value, offset) {
      ieee754.write(this, value, offset, false, 23, 4);
    }
    function writeDoubleBE(value, offset) {
      ieee754.write(this, value, offset, false, 52, 8);
    }
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/write-type.js
var require_write_type = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/write-type.js"(exports2) {
    var Int64Buffer = require_int64_buffer();
    var Uint64BE = Int64Buffer.Uint64BE;
    var Int64BE = Int64Buffer.Int64BE;
    var Bufferish = require_bufferish();
    var BufferProto = require_bufferish_proto();
    var WriteToken = require_write_token();
    var uint8 = require_write_uint8().uint8;
    var ExtBuffer = require_ext_buffer().ExtBuffer;
    var HAS_UINT8ARRAY = "undefined" !== typeof Uint8Array;
    var HAS_MAP = "undefined" !== typeof Map;
    var extmap = [];
    extmap[1] = 212;
    extmap[2] = 213;
    extmap[4] = 214;
    extmap[8] = 215;
    extmap[16] = 216;
    exports2.getWriteType = getWriteType;
    function getWriteType(options) {
      var token = WriteToken.getWriteToken(options);
      var useraw = options && options.useraw;
      var binarraybuffer = HAS_UINT8ARRAY && options && options.binarraybuffer;
      var isBuffer = binarraybuffer ? Bufferish.isArrayBuffer : Bufferish.isBuffer;
      var bin = binarraybuffer ? bin_arraybuffer : bin_buffer;
      var usemap = HAS_MAP && options && options.usemap;
      var map = usemap ? map_to_map : obj_to_map;
      var writeType = {
        "boolean": bool,
        "function": nil,
        "number": number,
        "object": useraw ? object_raw : object,
        "string": _string(useraw ? raw_head_size : str_head_size),
        "symbol": nil,
        "undefined": nil
      };
      return writeType;
      function bool(encoder, value) {
        var type = value ? 195 : 194;
        token[type](encoder, value);
      }
      function number(encoder, value) {
        var ivalue = value | 0;
        var type;
        if (value !== ivalue) {
          type = 203;
          token[type](encoder, value);
          return;
        } else if (-32 <= ivalue && ivalue <= 127) {
          type = ivalue & 255;
        } else if (0 <= ivalue) {
          type = ivalue <= 255 ? 204 : ivalue <= 65535 ? 205 : 206;
        } else {
          type = -128 <= ivalue ? 208 : -32768 <= ivalue ? 209 : 210;
        }
        token[type](encoder, ivalue);
      }
      function uint64(encoder, value) {
        var type = 207;
        token[type](encoder, value.toArray());
      }
      function int64(encoder, value) {
        var type = 211;
        token[type](encoder, value.toArray());
      }
      function str_head_size(length) {
        return length < 32 ? 1 : length <= 255 ? 2 : length <= 65535 ? 3 : 5;
      }
      function raw_head_size(length) {
        return length < 32 ? 1 : length <= 65535 ? 3 : 5;
      }
      function _string(head_size) {
        return string;
        function string(encoder, value) {
          var length = value.length;
          var maxsize = 5 + length * 3;
          encoder.offset = encoder.reserve(maxsize);
          var buffer = encoder.buffer;
          var expected = head_size(length);
          var start = encoder.offset + expected;
          length = BufferProto.write.call(buffer, value, start);
          var actual = head_size(length);
          if (expected !== actual) {
            var targetStart = start + actual - expected;
            var end = start + length;
            BufferProto.copy.call(buffer, buffer, targetStart, start, end);
          }
          var type = actual === 1 ? 160 + length : actual <= 3 ? 215 + actual : 219;
          token[type](encoder, length);
          encoder.offset += length;
        }
      }
      function object(encoder, value) {
        if (value === null) return nil(encoder, value);
        if (isBuffer(value)) return bin(encoder, value);
        if (Array.isArray(value)) return array(encoder, value);
        if (Uint64BE.isUint64BE(value)) return uint64(encoder, value);
        if (Int64BE.isInt64BE(value)) return int64(encoder, value);
        var packer = encoder.codec.getExtPacker(value);
        if (packer) value = packer(value);
        if (value instanceof ExtBuffer) return ext(encoder, value);
        map(encoder, value);
      }
      function object_raw(encoder, value) {
        if (isBuffer(value)) return raw(encoder, value);
        object(encoder, value);
      }
      function nil(encoder, value) {
        var type = 192;
        token[type](encoder, value);
      }
      function array(encoder, value) {
        var length = value.length;
        var type = length < 16 ? 144 + length : length <= 65535 ? 220 : 221;
        token[type](encoder, length);
        var encode = encoder.codec.encode;
        for (var i = 0; i < length; i++) {
          encode(encoder, value[i]);
        }
      }
      function bin_buffer(encoder, value) {
        var length = value.length;
        var type = length < 255 ? 196 : length <= 65535 ? 197 : 198;
        token[type](encoder, length);
        encoder.send(value);
      }
      function bin_arraybuffer(encoder, value) {
        bin_buffer(encoder, new Uint8Array(value));
      }
      function ext(encoder, value) {
        var buffer = value.buffer;
        var length = buffer.length;
        var type = extmap[length] || (length < 255 ? 199 : length <= 65535 ? 200 : 201);
        token[type](encoder, length);
        uint8[value.type](encoder);
        encoder.send(buffer);
      }
      function obj_to_map(encoder, value) {
        var keys = [];
        for (let [key, val] of Object.entries(value)) {
          if (val !== void 0) keys.push(key);
        }
        var length = keys.length;
        var type = length < 16 ? 128 + length : length <= 65535 ? 222 : 223;
        token[type](encoder, length);
        var encode = encoder.codec.encode;
        keys.forEach(function(key) {
          encode(encoder, key);
          encode(encoder, value[key]);
        });
      }
      function map_to_map(encoder, value) {
        if (!(value instanceof Map)) return obj_to_map(encoder, value);
        var length = value.size;
        var type = length < 16 ? 128 + length : length <= 65535 ? 222 : 223;
        token[type](encoder, length);
        var encode = encoder.codec.encode;
        value.forEach(function(val, key, m) {
          encode(encoder, key);
          encode(encoder, val);
        });
      }
      function raw(encoder, value) {
        var length = value.length;
        var type = length < 32 ? 160 + length : length <= 65535 ? 218 : 219;
        token[type](encoder, length);
        encoder.send(value);
      }
    }
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/codec-base.js
var require_codec_base = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/codec-base.js"(exports2) {
    exports2.createCodec = createCodec;
    exports2.install = install;
    exports2.filter = filter;
    var Bufferish = require_bufferish();
    function Codec(options) {
      if (!(this instanceof Codec)) return new Codec(options);
      this.options = options;
      this.init();
    }
    Codec.prototype.init = function() {
      var options = this.options;
      if (options && options.uint8array) {
        this.bufferish = Bufferish.Uint8Array;
      }
      return this;
    };
    function install(props) {
      for (var key in props) {
        Codec.prototype[key] = add(Codec.prototype[key], props[key]);
      }
    }
    function add(a, b) {
      return a && b ? ab : a || b;
      function ab() {
        a.apply(this, arguments);
        return b.apply(this, arguments);
      }
    }
    function join(filters) {
      filters = filters.slice();
      return function(value) {
        return filters.reduce(iterator, value);
      };
      function iterator(value, filter2) {
        return filter2(value);
      }
    }
    function filter(filter2) {
      return Array.isArray(filter2) ? join(filter2) : filter2;
    }
    function createCodec(options) {
      return new Codec(options);
    }
    exports2.preset = createCodec({ preset: true });
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/write-core.js
var require_write_core = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/write-core.js"(exports2) {
    var ExtBuffer = require_ext_buffer().ExtBuffer;
    var ExtPacker = require_ext_packer();
    var WriteType = require_write_type();
    var CodecBase = require_codec_base();
    CodecBase.install({
      addExtPacker,
      getExtPacker,
      init
    });
    exports2.preset = init.call(CodecBase.preset);
    function getEncoder(options) {
      var writeType = WriteType.getWriteType(options);
      return encode;
      function encode(encoder, value) {
        var func = writeType[typeof value];
        if (!func) throw new Error('Unsupported type "' + typeof value + '": ' + value);
        func(encoder, value);
      }
    }
    function init() {
      var options = this.options;
      this.encode = getEncoder(options);
      if (options && options.preset) {
        ExtPacker.setExtPackers(this);
      }
      return this;
    }
    function addExtPacker(etype, Class, packer) {
      packer = CodecBase.filter(packer);
      var name = Class.name;
      if (name && name !== "Object") {
        var packers = this.extPackers || (this.extPackers = {});
        packers[name] = extPacker;
      } else {
        var list = this.extEncoderList || (this.extEncoderList = []);
        list.unshift([Class, extPacker]);
      }
      function extPacker(value) {
        if (packer) value = packer(value);
        return new ExtBuffer(value, etype);
      }
    }
    function getExtPacker(value) {
      var packers = this.extPackers || (this.extPackers = {});
      var c = value.constructor;
      var e = c && c.name && packers[c.name];
      if (e) return e;
      var list = this.extEncoderList || (this.extEncoderList = []);
      var len = list.length;
      for (var i = 0; i < len; i++) {
        var pair = list[i];
        if (c === pair[0]) return pair[1];
      }
    }
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/flex-buffer.js
var require_flex_buffer = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/flex-buffer.js"(exports2) {
    exports2.FlexDecoder = FlexDecoder;
    exports2.FlexEncoder = FlexEncoder;
    var Bufferish = require_bufferish();
    var MIN_BUFFER_SIZE = 2048;
    var MAX_BUFFER_SIZE = 65536;
    var BUFFER_SHORTAGE = "BUFFER_SHORTAGE";
    function FlexDecoder() {
      if (!(this instanceof FlexDecoder)) return new FlexDecoder();
    }
    function FlexEncoder() {
      if (!(this instanceof FlexEncoder)) return new FlexEncoder();
    }
    FlexDecoder.mixin = mixinFactory(getDecoderMethods());
    FlexDecoder.mixin(FlexDecoder.prototype);
    FlexEncoder.mixin = mixinFactory(getEncoderMethods());
    FlexEncoder.mixin(FlexEncoder.prototype);
    function getDecoderMethods() {
      return {
        bufferish: Bufferish,
        write: write2,
        fetch,
        flush,
        push,
        pull,
        read,
        reserve,
        offset: 0
      };
      function write2(chunk) {
        var prev = this.offset ? Bufferish.prototype.slice.call(this.buffer, this.offset) : this.buffer;
        this.buffer = prev ? chunk ? this.bufferish.concat([prev, chunk]) : prev : chunk;
        this.offset = 0;
      }
      function flush() {
        while (this.offset < this.buffer.length) {
          var start = this.offset;
          var value;
          try {
            value = this.fetch();
          } catch (e) {
            if (e && e.message != BUFFER_SHORTAGE) throw e;
            this.offset = start;
            break;
          }
          this.push(value);
        }
      }
      function reserve(length) {
        var start = this.offset;
        var end = start + length;
        if (end > this.buffer.length) throw new Error(BUFFER_SHORTAGE);
        this.offset = end;
        return start;
      }
    }
    function getEncoderMethods() {
      return {
        bufferish: Bufferish,
        write,
        fetch: fetch2,
        flush,
        push,
        pull: pull2,
        read,
        reserve,
        send,
        maxBufferSize: MAX_BUFFER_SIZE,
        minBufferSize: MIN_BUFFER_SIZE,
        offset: 0,
        start: 0
      };
      function fetch2() {
        var start = this.start;
        if (start < this.offset) {
          var end = this.start = this.offset;
          return Bufferish.prototype.slice.call(this.buffer, start, end);
        }
      }
      function flush() {
        while (this.start < this.offset) {
          var value = this.fetch();
          if (value) this.push(value);
        }
      }
      function pull2() {
        var buffers = this.buffers || (this.buffers = []);
        var chunk = buffers.length > 1 ? this.bufferish.concat(buffers) : buffers[0];
        buffers.length = 0;
        return chunk;
      }
      function reserve(length) {
        var req = length | 0;
        if (this.buffer) {
          var size = this.buffer.length;
          var start = this.offset | 0;
          var end = start + req;
          if (end < size) {
            this.offset = end;
            return start;
          }
          this.flush();
          length = Math.max(length, Math.min(size * 2, this.maxBufferSize));
        }
        length = Math.max(length, this.minBufferSize);
        this.buffer = this.bufferish.alloc(length);
        this.start = 0;
        this.offset = req;
        return 0;
      }
      function send(buffer) {
        var length = buffer.length;
        if (length > this.minBufferSize) {
          this.flush();
          this.push(buffer);
        } else {
          var offset = this.reserve(length);
          Bufferish.prototype.copy.call(buffer, this.buffer, offset);
        }
      }
    }
    function write() {
      throw new Error("method not implemented: write()");
    }
    function fetch() {
      throw new Error("method not implemented: fetch()");
    }
    function read() {
      var length = this.buffers && this.buffers.length;
      if (!length) return this.fetch();
      this.flush();
      return this.pull();
    }
    function push(chunk) {
      var buffers = this.buffers || (this.buffers = []);
      buffers.push(chunk);
    }
    function pull() {
      var buffers = this.buffers || (this.buffers = []);
      return buffers.shift();
    }
    function mixinFactory(source) {
      return mixin;
      function mixin(target) {
        for (var key in source) {
          target[key] = source[key];
        }
        return target;
      }
    }
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/encode-buffer.js
var require_encode_buffer = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/encode-buffer.js"(exports2) {
    exports2.EncodeBuffer = EncodeBuffer;
    var preset = require_write_core().preset;
    var FlexEncoder = require_flex_buffer().FlexEncoder;
    FlexEncoder.mixin(EncodeBuffer.prototype);
    function EncodeBuffer(options) {
      if (!(this instanceof EncodeBuffer)) return new EncodeBuffer(options);
      if (options) {
        this.options = options;
        if (options.codec) {
          var codec = this.codec = options.codec;
          if (codec.bufferish) this.bufferish = codec.bufferish;
        }
      }
    }
    EncodeBuffer.prototype.codec = preset;
    EncodeBuffer.prototype.write = function(input) {
      this.codec.encode(this, input);
    };
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/encode.js
var require_encode = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/encode.js"(exports2) {
    exports2.encode = encode;
    var EncodeBuffer = require_encode_buffer().EncodeBuffer;
    function encode(input, options) {
      var encoder = new EncodeBuffer(options);
      encoder.write(input);
      return encoder.read();
    }
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/ext-unpacker.js
var require_ext_unpacker = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/ext-unpacker.js"(exports2) {
    exports2.setExtUnpackers = setExtUnpackers;
    var Bufferish = require_bufferish();
    var Buffer2 = Bufferish.global;
    var _decode;
    var ERROR_COLUMNS = { name: 1, message: 1, stack: 1, columnNumber: 1, fileName: 1, lineNumber: 1 };
    function setExtUnpackers(codec) {
      codec.addExtUnpacker(14, [decode, unpackError(Error)]);
      codec.addExtUnpacker(1, [decode, unpackError(EvalError)]);
      codec.addExtUnpacker(2, [decode, unpackError(RangeError)]);
      codec.addExtUnpacker(3, [decode, unpackError(ReferenceError)]);
      codec.addExtUnpacker(4, [decode, unpackError(SyntaxError)]);
      codec.addExtUnpacker(5, [decode, unpackError(TypeError)]);
      codec.addExtUnpacker(6, [decode, unpackError(URIError)]);
      codec.addExtUnpacker(10, [decode, unpackRegExp]);
      codec.addExtUnpacker(11, [decode, unpackClass(Boolean)]);
      codec.addExtUnpacker(12, [decode, unpackClass(String)]);
      codec.addExtUnpacker(13, [decode, unpackClass(Date)]);
      codec.addExtUnpacker(15, [decode, unpackClass(Number)]);
      if ("undefined" !== typeof Uint8Array) {
        codec.addExtUnpacker(17, unpackClass(Int8Array));
        codec.addExtUnpacker(18, unpackClass(Uint8Array));
        codec.addExtUnpacker(19, [unpackArrayBuffer, unpackClass(Int16Array)]);
        codec.addExtUnpacker(20, [unpackArrayBuffer, unpackClass(Uint16Array)]);
        codec.addExtUnpacker(21, [unpackArrayBuffer, unpackClass(Int32Array)]);
        codec.addExtUnpacker(22, [unpackArrayBuffer, unpackClass(Uint32Array)]);
        codec.addExtUnpacker(23, [unpackArrayBuffer, unpackClass(Float32Array)]);
        if ("undefined" !== typeof Float64Array) {
          codec.addExtUnpacker(24, [unpackArrayBuffer, unpackClass(Float64Array)]);
        }
        if ("undefined" !== typeof Uint8ClampedArray) {
          codec.addExtUnpacker(25, unpackClass(Uint8ClampedArray));
        }
        codec.addExtUnpacker(26, unpackArrayBuffer);
        codec.addExtUnpacker(29, [unpackArrayBuffer, unpackClass(DataView)]);
      }
      if (Bufferish.hasBuffer) {
        codec.addExtUnpacker(27, unpackClass(Buffer2));
      }
    }
    function decode(input) {
      if (!_decode) _decode = require_decode().decode;
      return _decode(input);
    }
    function unpackRegExp(value) {
      return RegExp.apply(null, value);
    }
    function unpackError(Class) {
      return function(value) {
        var out = new Class();
        for (var key in ERROR_COLUMNS) {
          out[key] = value[key];
        }
        return out;
      };
    }
    function unpackClass(Class) {
      return function(value) {
        return new Class(value);
      };
    }
    function unpackArrayBuffer(value) {
      return new Uint8Array(value).buffer;
    }
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/read-format.js
var require_read_format = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/read-format.js"(exports2) {
    var ieee754 = require_ieee754();
    var Int64Buffer = require_int64_buffer();
    var Uint64BE = Int64Buffer.Uint64BE;
    var Int64BE = Int64Buffer.Int64BE;
    exports2.getReadFormat = getReadFormat;
    exports2.readUint8 = uint8;
    var Bufferish = require_bufferish();
    var BufferProto = require_bufferish_proto();
    var HAS_MAP = "undefined" !== typeof Map;
    var NO_ASSERT = true;
    function getReadFormat(options) {
      var binarraybuffer = Bufferish.hasArrayBuffer && options && options.binarraybuffer;
      var int64 = options && options.int64;
      var usemap = HAS_MAP && options && options.usemap;
      var readFormat = {
        map: usemap ? map_to_map : map_to_obj,
        array,
        str,
        bin: binarraybuffer ? bin_arraybuffer : bin_buffer,
        ext,
        uint8,
        uint16,
        uint32,
        uint64: read(8, int64 ? readUInt64BE_int64 : readUInt64BE),
        int8,
        int16,
        int32,
        int64: read(8, int64 ? readInt64BE_int64 : readInt64BE),
        float32: read(4, readFloatBE),
        float64: read(8, readDoubleBE)
      };
      return readFormat;
    }
    function map_to_obj(decoder, len) {
      var value = {};
      var i;
      var k = new Array(len);
      var v = new Array(len);
      var decode = decoder.codec.decode;
      for (i = 0; i < len; i++) {
        k[i] = decode(decoder);
        v[i] = decode(decoder);
      }
      for (i = 0; i < len; i++) {
        value[k[i]] = v[i];
      }
      return value;
    }
    function map_to_map(decoder, len) {
      var value = /* @__PURE__ */ new Map();
      var i;
      var k = new Array(len);
      var v = new Array(len);
      var decode = decoder.codec.decode;
      for (i = 0; i < len; i++) {
        k[i] = decode(decoder);
        v[i] = decode(decoder);
      }
      for (i = 0; i < len; i++) {
        value.set(k[i], v[i]);
      }
      return value;
    }
    function array(decoder, len) {
      var value = new Array(len);
      var decode = decoder.codec.decode;
      for (var i = 0; i < len; i++) {
        value[i] = decode(decoder);
      }
      return value;
    }
    function str(decoder, len) {
      var start = decoder.reserve(len);
      var end = start + len;
      return BufferProto.toString.call(decoder.buffer, "utf-8", start, end);
    }
    function bin_buffer(decoder, len) {
      var start = decoder.reserve(len);
      var end = start + len;
      var buf = BufferProto.slice.call(decoder.buffer, start, end);
      return Bufferish.from(buf);
    }
    function bin_arraybuffer(decoder, len) {
      var start = decoder.reserve(len);
      var end = start + len;
      var buf = BufferProto.slice.call(decoder.buffer, start, end);
      return Bufferish.Uint8Array.from(buf).buffer;
    }
    function ext(decoder, len) {
      var start = decoder.reserve(len + 1);
      var type = decoder.buffer[start++];
      var end = start + len;
      var unpack = decoder.codec.getExtUnpacker(type);
      if (!unpack) throw new Error("Invalid ext type: " + (type ? "0x" + type.toString(16) : type));
      var buf = BufferProto.slice.call(decoder.buffer, start, end);
      return unpack(buf);
    }
    function uint8(decoder) {
      var start = decoder.reserve(1);
      return decoder.buffer[start];
    }
    function int8(decoder) {
      var start = decoder.reserve(1);
      var value = decoder.buffer[start];
      return value & 128 ? value - 256 : value;
    }
    function uint16(decoder) {
      var start = decoder.reserve(2);
      var buffer = decoder.buffer;
      return buffer[start++] << 8 | buffer[start];
    }
    function int16(decoder) {
      var start = decoder.reserve(2);
      var buffer = decoder.buffer;
      var value = buffer[start++] << 8 | buffer[start];
      return value & 32768 ? value - 65536 : value;
    }
    function uint32(decoder) {
      var start = decoder.reserve(4);
      var buffer = decoder.buffer;
      return buffer[start++] * 16777216 + (buffer[start++] << 16) + (buffer[start++] << 8) + buffer[start];
    }
    function int32(decoder) {
      var start = decoder.reserve(4);
      var buffer = decoder.buffer;
      return buffer[start++] << 24 | buffer[start++] << 16 | buffer[start++] << 8 | buffer[start];
    }
    function read(len, method) {
      return function(decoder) {
        var start = decoder.reserve(len);
        return method.call(decoder.buffer, start, NO_ASSERT);
      };
    }
    function readUInt64BE(start) {
      return new Uint64BE(this, start).toNumber();
    }
    function readInt64BE(start) {
      return new Int64BE(this, start).toNumber();
    }
    function readUInt64BE_int64(start) {
      return new Uint64BE(this, start);
    }
    function readInt64BE_int64(start) {
      return new Int64BE(this, start);
    }
    function readFloatBE(start) {
      return ieee754.read(this, start, false, 23, 4);
    }
    function readDoubleBE(start) {
      return ieee754.read(this, start, false, 52, 8);
    }
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/read-token.js
var require_read_token = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/read-token.js"(exports2) {
    var ReadFormat = require_read_format();
    exports2.getReadToken = getReadToken;
    function getReadToken(options) {
      var format = ReadFormat.getReadFormat(options);
      if (options && options.useraw) {
        return init_useraw(format);
      } else {
        return init_token(format);
      }
    }
    function init_token(format) {
      var i;
      var token = new Array(256);
      for (i = 0; i <= 127; i++) {
        token[i] = constant(i);
      }
      for (i = 128; i <= 143; i++) {
        token[i] = fix(i - 128, format.map);
      }
      for (i = 144; i <= 159; i++) {
        token[i] = fix(i - 144, format.array);
      }
      for (i = 160; i <= 191; i++) {
        token[i] = fix(i - 160, format.str);
      }
      token[192] = constant(null);
      token[193] = null;
      token[194] = constant(false);
      token[195] = constant(true);
      token[196] = flex(format.uint8, format.bin);
      token[197] = flex(format.uint16, format.bin);
      token[198] = flex(format.uint32, format.bin);
      token[199] = flex(format.uint8, format.ext);
      token[200] = flex(format.uint16, format.ext);
      token[201] = flex(format.uint32, format.ext);
      token[202] = format.float32;
      token[203] = format.float64;
      token[204] = format.uint8;
      token[205] = format.uint16;
      token[206] = format.uint32;
      token[207] = format.uint64;
      token[208] = format.int8;
      token[209] = format.int16;
      token[210] = format.int32;
      token[211] = format.int64;
      token[212] = fix(1, format.ext);
      token[213] = fix(2, format.ext);
      token[214] = fix(4, format.ext);
      token[215] = fix(8, format.ext);
      token[216] = fix(16, format.ext);
      token[217] = flex(format.uint8, format.str);
      token[218] = flex(format.uint16, format.str);
      token[219] = flex(format.uint32, format.str);
      token[220] = flex(format.uint16, format.array);
      token[221] = flex(format.uint32, format.array);
      token[222] = flex(format.uint16, format.map);
      token[223] = flex(format.uint32, format.map);
      for (i = 224; i <= 255; i++) {
        token[i] = constant(i - 256);
      }
      return token;
    }
    function init_useraw(format) {
      var i;
      var token = init_token(format).slice();
      token[217] = token[196];
      token[218] = token[197];
      token[219] = token[198];
      for (i = 160; i <= 191; i++) {
        token[i] = fix(i - 160, format.bin);
      }
      return token;
    }
    function constant(value) {
      return function() {
        return value;
      };
    }
    function flex(lenFunc, decodeFunc) {
      return function(decoder) {
        var len = lenFunc(decoder);
        return decodeFunc(decoder, len);
      };
    }
    function fix(len, method) {
      return function(decoder) {
        return method(decoder, len);
      };
    }
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/read-core.js
var require_read_core = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/read-core.js"(exports2) {
    var ExtBuffer = require_ext_buffer().ExtBuffer;
    var ExtUnpacker = require_ext_unpacker();
    var readUint8 = require_read_format().readUint8;
    var ReadToken = require_read_token();
    var CodecBase = require_codec_base();
    CodecBase.install({
      addExtUnpacker,
      getExtUnpacker,
      init
    });
    exports2.preset = init.call(CodecBase.preset);
    function getDecoder(options) {
      var readToken = ReadToken.getReadToken(options);
      return decode;
      function decode(decoder) {
        var type = readUint8(decoder);
        var func = readToken[type];
        if (!func) throw new Error("Invalid type: " + (type ? "0x" + type.toString(16) : type));
        return func(decoder);
      }
    }
    function init() {
      var options = this.options;
      this.decode = getDecoder(options);
      if (options && options.preset) {
        ExtUnpacker.setExtUnpackers(this);
      }
      return this;
    }
    function addExtUnpacker(etype, unpacker) {
      var unpackers = this.extUnpackers || (this.extUnpackers = []);
      unpackers[etype] = CodecBase.filter(unpacker);
    }
    function getExtUnpacker(type) {
      var unpackers = this.extUnpackers || (this.extUnpackers = []);
      return unpackers[type] || extUnpacker;
      function extUnpacker(buffer) {
        return new ExtBuffer(buffer, type);
      }
    }
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/decode-buffer.js
var require_decode_buffer = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/decode-buffer.js"(exports2) {
    exports2.DecodeBuffer = DecodeBuffer;
    var preset = require_read_core().preset;
    var FlexDecoder = require_flex_buffer().FlexDecoder;
    FlexDecoder.mixin(DecodeBuffer.prototype);
    function DecodeBuffer(options) {
      if (!(this instanceof DecodeBuffer)) return new DecodeBuffer(options);
      if (options) {
        this.options = options;
        if (options.codec) {
          var codec = this.codec = options.codec;
          if (codec.bufferish) this.bufferish = codec.bufferish;
        }
      }
    }
    DecodeBuffer.prototype.codec = preset;
    DecodeBuffer.prototype.fetch = function() {
      return this.codec.decode(this);
    };
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/decode.js
var require_decode = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/decode.js"(exports2) {
    exports2.decode = decode;
    var DecodeBuffer = require_decode_buffer().DecodeBuffer;
    function decode(input, options) {
      var decoder = new DecodeBuffer(options);
      decoder.write(input);
      return decoder.read();
    }
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/encoder.js
var require_encoder = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/encoder.js"(exports2) {
    exports2.Encoder = Encoder;
    var EncodeBuffer = require_encode_buffer().EncodeBuffer;
    function Encoder(options) {
      if (!(this instanceof Encoder)) return new Encoder(options);
      EncodeBuffer.call(this, options);
    }
    Encoder.prototype = new EncodeBuffer();
    Encoder.prototype.encode = function(chunk) {
      this.write(chunk);
    };
    Encoder.prototype.end = function(chunk) {
      if (arguments.length) this.encode(chunk);
      this.flush();
    };
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/decoder.js
var require_decoder = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/decoder.js"(exports2) {
    exports2.Decoder = Decoder;
    var DecodeBuffer = require_decode_buffer().DecodeBuffer;
    function Decoder(options) {
      if (!(this instanceof Decoder)) return new Decoder(options);
      DecodeBuffer.call(this, options);
    }
    Decoder.prototype = new DecodeBuffer();
    Decoder.prototype.decode = function(chunk) {
      if (arguments.length) this.write(chunk);
      this.flush();
    };
    Decoder.prototype.end = function(chunk) {
      this.decode(chunk);
    };
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/encode-stream.js
var require_encode_stream = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/encode-stream.js"(exports2) {
    exports2.createEncodeStream = EncodeStream;
    var util = require("util");
    var Transform = require("stream").Transform;
    var EncodeBuffer = require_encode_buffer().EncodeBuffer;
    util.inherits(EncodeStream, Transform);
    var DEFAULT_OPTIONS = { objectMode: true };
    function EncodeStream(options) {
      if (!(this instanceof EncodeStream)) return new EncodeStream(options);
      if (options) {
        options.objectMode = true;
      } else {
        options = DEFAULT_OPTIONS;
      }
      Transform.call(this, options);
      var stream = this;
      var encoder = this.encoder = new EncodeBuffer(options);
      encoder.push = function(chunk) {
        stream.push(chunk);
      };
    }
    EncodeStream.prototype._transform = function(chunk, encoding, callback) {
      this.encoder.write(chunk);
      if (callback) callback();
    };
    EncodeStream.prototype._flush = function(callback) {
      this.encoder.flush();
      if (callback) callback();
    };
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/decode-stream.js
var require_decode_stream = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/decode-stream.js"(exports2) {
    exports2.createDecodeStream = DecodeStream;
    var util = require("util");
    var Transform = require("stream").Transform;
    var DecodeBuffer = require_decode_buffer().DecodeBuffer;
    util.inherits(DecodeStream, Transform);
    var DEFAULT_OPTIONS = { objectMode: true };
    function DecodeStream(options) {
      if (!(this instanceof DecodeStream)) return new DecodeStream(options);
      if (options) {
        options.objectMode = true;
      } else {
        options = DEFAULT_OPTIONS;
      }
      Transform.call(this, options);
      var stream = this;
      var decoder = this.decoder = new DecodeBuffer(options);
      decoder.push = function(chunk) {
        stream.push(chunk);
      };
    }
    DecodeStream.prototype._transform = function(chunk, encoding, callback) {
      this.decoder.write(chunk);
      this.decoder.flush();
      if (callback) callback();
    };
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/ext.js
var require_ext = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/ext.js"(exports2) {
    require_read_core();
    require_write_core();
    exports2.createCodec = require_codec_base().createCodec;
  }
});

// node_modules/@chemzqm/msgpack-lite/lib/codec.js
var require_codec = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/lib/codec.js"(exports2) {
    require_read_core();
    require_write_core();
    exports2.codec = {
      preset: require_codec_base().preset
    };
  }
});

// node_modules/@chemzqm/msgpack-lite/index.js
var require_msgpack_lite = __commonJS({
  "node_modules/@chemzqm/msgpack-lite/index.js"(exports2) {
    exports2.encode = require_encode().encode;
    exports2.decode = require_decode().decode;
    exports2.Encoder = require_encoder().Encoder;
    exports2.Decoder = require_decoder().Decoder;
    exports2.createEncodeStream = require_encode_stream().createEncodeStream;
    exports2.createDecodeStream = require_decode_stream().createDecodeStream;
    exports2.createCodec = require_ext().createCodec;
    exports2.codec = require_codec().codec;
  }
});

// node_modules/@chemzqm/neovim/lib/utils/buffered.js
var require_buffered = __commonJS({
  "node_modules/@chemzqm/neovim/lib/utils/buffered.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var stream_1 = require("stream");
    var MIN_SIZE = Buffer.poolSize;
    var waterMark = 10 * 1024 * 1024;
    var Buffered = class extends stream_1.Transform {
      constructor() {
        super({
          readableHighWaterMark: waterMark,
          writableHighWaterMark: waterMark
        });
        this.chunks = null;
        this.timer = null;
      }
      sendData() {
        const { chunks } = this;
        if (chunks) {
          this.chunks = null;
          this.push(Buffer.concat(chunks));
        }
      }
      // eslint-disable-next-line consistent-return
      _transform(chunk, _encoding, callback) {
        const { chunks, timer } = this;
        if (timer)
          clearTimeout(timer);
        if (chunk.length < MIN_SIZE) {
          if (!chunks)
            return callback(null, chunk);
          chunks.push(chunk);
          this.sendData();
          callback();
        } else {
          if (!chunks) {
            this.chunks = [chunk];
          } else {
            chunks.push(chunk);
          }
          this.timer = setTimeout(this.sendData.bind(this), 20);
          callback();
        }
      }
      _flush(callback) {
        const { chunks } = this;
        if (chunks) {
          this.chunks = null;
          const buf = Buffer.concat(chunks);
          callback(null, buf);
        } else {
          callback();
        }
      }
    };
    exports2.default = Buffered;
  }
});

// node_modules/@chemzqm/neovim/lib/api/Base.js
var require_Base = __commonJS({
  "node_modules/@chemzqm/neovim/lib/api/Base.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.BaseApi = void 0;
    var events_1 = require("events");
    var BaseApi = class extends events_1.EventEmitter {
      constructor({ transport, data, client }) {
        super();
        this.setTransport(transport);
        this.data = data;
        this.client = client;
      }
      setTransport(transport) {
        this.transport = transport;
      }
      equals(other) {
        try {
          return String(this.data) === String(other.data);
        } catch (e) {
          return false;
        }
      }
      async request(name, args = []) {
        Error.captureStackTrace(args);
        return new Promise((resolve, reject) => {
          this.transport.request(name, this.getArgsByPrefix(args), (err, res) => {
            if (err) {
              let e = new Error(err[1]);
              if (!name.endsWith("get_var")) {
                let stack = args.stack;
                e.stack = `Error: request error on "${name}" - ${err[1]}
` + stack.split(/\r?\n/).slice(3).join("\n");
                this.client.logError(`request error on "${name}"`, args, e);
              }
              reject(e);
            } else {
              resolve(res);
            }
          });
        });
      }
      getArgsByPrefix(args) {
        if (this.prefix !== "nvim_" && args[0] != this) {
          let id = this.transport.isVim ? this.data : this;
          return [id, ...args];
        }
        return args;
      }
      /** Retrieves a scoped variable depending on type (using `this.prefix`) */
      getVar(name) {
        return this.request(`${this.prefix}get_var`, [name]).then((res) => res, (_err) => {
          return null;
        });
      }
      setVar(name, value, isNotify = false) {
        if (isNotify) {
          this.notify(`${this.prefix}set_var`, [name, value]);
          return;
        }
        return this.request(`${this.prefix}set_var`, [name, value]);
      }
      /** Delete a scoped variable */
      deleteVar(name) {
        this.notify(`${this.prefix}del_var`, [name]);
      }
      /** Retrieves a scoped option depending on type of `this` */
      getOption(name) {
        return this.request(`${this.prefix}get_option`, [name]);
      }
      setOption(name, value, isNotify) {
        if (isNotify) {
          this.notify(`${this.prefix}set_option`, [name, value]);
          return;
        }
        return this.request(`${this.prefix}set_option`, [name, value]);
      }
      /** `request` is basically the same except you can choose to wait forpromise to be resolved */
      notify(name, args = []) {
        this.transport.notify(name, this.getArgsByPrefix(args));
      }
      toJSON() {
        return this.data;
      }
    };
    exports2.BaseApi = BaseApi;
  }
});

// node_modules/@chemzqm/neovim/lib/api/Buffer.js
var require_Buffer = __commonJS({
  "node_modules/@chemzqm/neovim/lib/api/Buffer.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Buffer = void 0;
    var Base_1 = require_Base();
    var Buffer2 = class extends Base_1.BaseApi {
      constructor() {
        super(...arguments);
        this.prefix = "nvim_buf_";
      }
      /**
       * Attach to buffer to listen to buffer events
       * @param sendBuffer Set to true if the initial notification should contain
       *        the whole buffer. If so, the first notification will be a
       *        `nvim_buf_lines_event`. Otherwise, the first notification will be
       *        a `nvim_buf_changedtick_event`
       */
      async attach(sendBuffer = false, options = {}) {
        return await this.request(`${this.prefix}attach`, [sendBuffer, options]);
      }
      /**
       * Detach from buffer to stop listening to buffer events
       */
      async detach() {
        return await this.request(`${this.prefix}detach`, []);
      }
      /**
       * Get the bufnr of Buffer
       */
      get id() {
        return this.data;
      }
      /** Total number of lines in buffer */
      get length() {
        return this.request(`${this.prefix}line_count`, []);
      }
      /** Get lines in buffer */
      get lines() {
        return this.getLines();
      }
      /** Gets a changed tick of a buffer */
      get changedtick() {
        return this.request(`${this.prefix}get_changedtick`, []);
      }
      get commands() {
        return this.getCommands();
      }
      getCommands(options = {}) {
        return this.request(`${this.prefix}get_commands`, [options]);
      }
      /** Get specific lines of buffer */
      getLines({ start, end, strictIndexing } = { start: 0, end: -1, strictIndexing: true }) {
        const indexing = typeof strictIndexing === "undefined" ? true : strictIndexing;
        return this.request(`${this.prefix}get_lines`, [
          start,
          end,
          indexing
        ]);
      }
      setLines(lines, opts, notify = false) {
        let { start, end, strictIndexing } = opts !== null && opts !== void 0 ? opts : {};
        start = start !== null && start !== void 0 ? start : 0;
        end = end !== null && end !== void 0 ? end : start + 1;
        const indexing = strictIndexing !== null && strictIndexing !== void 0 ? strictIndexing : true;
        const method = notify ? "notify" : "request";
        return this[method](`${this.prefix}set_lines`, [
          start,
          end,
          indexing,
          typeof lines === "string" ? [lines] : lines
        ]);
      }
      /**
       * Set virtual text for a line, works on nvim >= 0.5.0 and vim9
       *
       * @public
       * @param {number} src_id - Source group to use or 0 to use a new group, or -1
       * @param {number} line - Line to annotate with virtual text (zero-indexed)
       * @param {Chunk[]} chunks - List with [text, hl_group]
       * @param {{[index} opts
       * @returns {Promise<number>}
       */
      setVirtualText(src_id, line, chunks, opts = {}) {
        this.client.call("coc#vtext#add", [this.id, src_id, line, chunks, opts], true);
        return Promise.resolve(src_id);
      }
      /**
       * Removes an ext mark by notification.
       *
       * @public
       * @param {number} ns_id - Namespace id
       * @param {number} id - Extmark id
       */
      deleteExtMark(ns_id, id) {
        this.notify(`${this.prefix}del_extmark`, [
          ns_id,
          id
        ]);
      }
      /**
       * Gets the position (0-indexed) of an extmark.
       *
       * @param {number} ns_id - Namespace id
       * @param {number} id - Extmark id
       * @param {Object} opts - Optional parameters.
       * @returns {Promise<[] | [number, number] | [number, number, ExtmarkDetails]>}
       */
      async getExtMarkById(ns_id, id, opts = {}) {
        return this.request(`${this.prefix}get_extmark_by_id`, [ns_id, id, opts]);
      }
      /**
       * Gets extmarks in "traversal order" from a |charwise| region defined by
       * buffer positions (inclusive, 0-indexed |api-indexing|).
       *
       * Region can be given as (row,col) tuples, or valid extmark ids (whose
       * positions define the bounds). 0 and -1 are understood as (0,0) and (-1,-1)
       * respectively, thus the following are equivalent:
       *
       *     nvim_buf_get_extmarks(0, my_ns, 0, -1, {})
       *     nvim_buf_get_extmarks(0, my_ns, [0,0], [-1,-1], {})
       *
       * @param {number} ns_id - Namespace id
       * @param {[number, number] | number} start
       * @param {[number, number] | number} end
       * @param {Object} opts
       * @returns {Promise<[number, number, number, ExtmarkDetails?][]>}
       */
      async getExtMarks(ns_id, start, end, opts = {}) {
        return this.request(`${this.prefix}get_extmarks`, [ns_id, start, end, opts]);
      }
      /**
       * Creates or updates an extmark by notification, `:h nvim_buf_set_extmark`.
       *
       * @param {number} ns_id
       * @param {number} line
       * @param {number} col
       * @param {ExtmarkOptions} opts
       * @returns {void}
       */
      setExtMark(ns_id, line, col, opts = {}) {
        this.notify(`${this.prefix}set_extmark`, [
          ns_id,
          line,
          col,
          opts
        ]);
      }
      /** Insert lines at `start` index */
      insert(lines, start) {
        return this.setLines(lines, {
          start,
          end: start,
          strictIndexing: true
        });
      }
      /** Replace lines starting at `start` index */
      replace(_lines, start) {
        const lines = typeof _lines === "string" ? [_lines] : _lines;
        return this.setLines(lines, {
          start,
          end: start + lines.length,
          strictIndexing: false
        });
      }
      /** Remove lines at index */
      remove(start, end, strictIndexing = false) {
        return this.setLines([], { start, end, strictIndexing });
      }
      /** Append a string or list of lines to end of buffer */
      append(lines) {
        return this.setLines(lines, {
          start: -1,
          end: -1,
          strictIndexing: false
        });
      }
      /** Get buffer name */
      get name() {
        return this.request(`${this.prefix}get_name`, []);
      }
      /** Set current buffer name */
      setName(value) {
        return this.request(`${this.prefix}set_name`, [value]);
      }
      /** Is current buffer valid */
      get valid() {
        return this.request(`${this.prefix}is_valid`, []);
      }
      /** Get mark position given mark name */
      mark(name) {
        return this.request(`${this.prefix}get_mark`, [name]);
      }
      // range(start, end) {
      // """Return a `Range` object, which represents part of the Buffer."""
      // return Range(this, start, end)
      // }
      /** Gets keymap */
      getKeymap(mode) {
        return this.request(`${this.prefix}get_keymap`, [mode]);
      }
      /**
       * Add keymap by notification.
       */
      setKeymap(mode, lhs, rhs, opts = {}) {
        this.client.call("coc#compat#buf_add_keymap", [this.id, mode, lhs, rhs, opts], true);
      }
      /**
      * Checks if a buffer is valid and loaded. See |api-buffer| for
      * more info about unloaded buffers.
      */
      get loaded() {
        return this.request(`${this.prefix}is_loaded`, []);
      }
      /**
       * Returns the byte offset for a line.
       *
       * Line 1 (index=0) has offset 0. UTF-8 bytes are counted. EOL is
       * one byte. 'fileformat' and 'fileencoding' are ignored. The
       * line index just after the last line gives the total byte-count
       * of the buffer. A final EOL byte is counted if it would be
       * written, see 'eol'.
       *
       * Unlike |line2byte()|, throws error for out-of-bounds indexing.
       * Returns -1 for unloaded buffer.
       *
       * @return {Number} Integer byte offset, or -1 for unloaded buffer.
       */
      getOffset(index) {
        return this.request(`${this.prefix}get_offset`, [index]);
      }
      /**
          Adds a highlight to buffer.
      
          This can be used for plugins which dynamically generate
          highlights to a buffer (like a semantic highlighter or
          linter). The function adds a single highlight to a buffer.
          Unlike matchaddpos() highlights follow changes to line
          numbering (as lines are inserted/removed above the highlighted
          line), like signs and marks do.
      
          "src_id" is useful for batch deletion/updating of a set of
          highlights. When called with src_id = 0, an unique source id
          is generated and returned. Succesive calls can pass in it as
          "src_id" to add new highlights to the same source group. All
          highlights in the same group can then be cleared with
          nvim_buf_clear_namespace. If the highlight never will be
          manually deleted pass in -1 for "src_id".
      
          If "hl_group" is the empty string no highlight is added, but a
          new src_id is still returned. This is useful for an external
          plugin to synchrounously request an unique src_id at
          initialization, and later asynchronously add and clear
          highlights in response to buffer changes. */
      addHighlight({ hlGroup, line, colStart: _start, colEnd: _end, srcId: _srcId }) {
        if (!hlGroup)
          throw new Error("hlGroup should not empty");
        const colEnd = typeof _end !== "undefined" ? _end : -1;
        const colStart = typeof _start !== "undefined" ? _start : -0;
        const srcId = typeof _srcId !== "undefined" ? _srcId : -1;
        const method = srcId == 0 ? "request" : "notify";
        let res = this[method](`${this.prefix}add_highlight`, [
          srcId,
          hlGroup,
          line,
          colStart,
          colEnd
        ]);
        return method === "request" ? res : Promise.resolve(null);
      }
      /**
       * Clear highlights of specified lins.
       *
       * @deprecated use clearNamespace() instead.
       */
      clearHighlight(args = {}) {
        const defaults = {
          srcId: -1,
          lineStart: 0,
          lineEnd: -1
        };
        const { srcId, lineStart, lineEnd } = Object.assign({}, defaults, args);
        return this.notify(`${this.prefix}clear_highlight`, [
          srcId,
          lineStart,
          lineEnd
        ]);
      }
      /**
       * Add highlight to ranges by notification.
       *
       * @param {string | number} srcId Unique key or namespace number.
       * @param {string} hlGroup Highlight group.
       * @param {Range[]} ranges List of highlight ranges
       */
      highlightRanges(srcId, hlGroup, ranges) {
        this.client.call("coc#highlight#ranges", [this.id, srcId, hlGroup, ranges], true);
      }
      /**
       * Clear namespace by id or name.
       *
       * @param key Unique key or namespace number, use -1 for all namespaces
       * @param lineStart Start of line, 0 based, default to 0.
       * @param lineEnd End of line, 0 based, default to -1.
       */
      clearNamespace(key, lineStart = 0, lineEnd = -1) {
        this.client.call("coc#highlight#clear_highlight", [this.id, key, lineStart, lineEnd], true);
      }
      /**
       * Add sign to buffer by notification.
       *
       * @param {SignPlaceOption} sign
       * @returns {void}
       */
      placeSign(sign) {
        let opts = { lnum: sign.lnum };
        if (typeof sign.priority === "number")
          opts.priority = sign.priority;
        this.client.call("sign_place", [sign.id || 0, sign.group || "", sign.name, this.id, opts], true);
      }
      /**
       * Unplace signs by notification
       */
      unplaceSign(opts) {
        let details = { buffer: this.id };
        if (opts.id != null)
          details.id = opts.id;
        this.client.call("sign_unplace", [opts.group || "", details], true);
      }
      /**
       * Get signs by group name or id and lnum.
       *
       * @param {SignPlacedOption} opts
       * @returns {Promise<SignItem[]>}
       */
      async getSigns(opts) {
        let res = await this.client.call("sign_getplaced", [this.id, opts || {}]);
        return res[0].signs;
      }
      /**
       * Get highlight items by name space (end inclusive).
       *
       * @param {string} ns Namespace key.
       * @param {number} start 0 based line number.
       * @param {number} end 0 based line number.
       * @returns {Promise<HighlightItem[]>}
       */
      async getHighlights(ns, start = 0, end = -1) {
        let res = [];
        let arr = await this.client.call("coc#highlight#get_highlights", [this.id, ns, start, end]);
        for (let item of arr) {
          res.push({
            hlGroup: item[0],
            lnum: item[1],
            colStart: item[2],
            colEnd: item[3],
            id: item[4]
          });
        }
        return res;
      }
      /**
       * Update highlight items by notification.
       *
       * @param {string | number} ns Namespace key or id.
       * @param {HighlightItem[]} highlights Highlight items.
       * @param {HighlightOption} opts Optional options.
       * @returns {void}
       */
      updateHighlights(ns, highlights, opts = {}) {
        if (typeof opts === "number") {
          this.client.logError("Bad option for buffer.updateHighlights()", new Error());
          return;
        }
        let start = typeof opts.start === "number" ? opts.start : 0;
        let end = typeof opts.end === "number" ? opts.end : -1;
        let changedtick = typeof opts.changedtick === "number" ? opts.changedtick : null;
        let priority = typeof opts.priority === "number" ? opts.priority : null;
        if (start == 0 && end == -1) {
          let arr = highlights.map((o) => [o.hlGroup, o.lnum, o.colStart, o.colEnd, o.combine === false ? 0 : 1, o.start_incl ? 1 : 0, o.end_incl ? 1 : 0]);
          this.client.call("coc#highlight#buffer_update", [this.id, ns, arr, priority, changedtick], true);
          return;
        }
        this.client.call("coc#highlight#update_highlights", [this.id, ns, highlights, start, end, priority, changedtick], true);
      }
      /**
       * Listens to buffer for events
       */
      listen(eventName, cb, disposables) {
        this.client.attachBufferEvent(this, eventName, cb);
        if (disposables) {
          disposables.push({
            dispose: () => {
              this.client.detachBufferEvent(this, eventName, cb);
            }
          });
        }
      }
    };
    exports2.Buffer = Buffer2;
  }
});

// node_modules/@chemzqm/neovim/lib/api/Window.js
var require_Window = __commonJS({
  "node_modules/@chemzqm/neovim/lib/api/Window.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Window = void 0;
    var Base_1 = require_Base();
    var Window = class extends Base_1.BaseApi {
      constructor() {
        super(...arguments);
        this.prefix = "nvim_win_";
      }
      /**
       * The windowid that not change within a Vim session
       */
      get id() {
        return this.data;
      }
      setBuffer(buffer) {
        return this.request(`${this.prefix}set_buf`, [buffer]);
      }
      /** Get current buffer of window */
      get buffer() {
        return this.request(`${this.prefix}get_buf`, []);
      }
      /** Get the Tabpage that contains the window */
      get tabpage() {
        return this.request(`${this.prefix}get_tabpage`, []);
      }
      /** Get cursor position */
      get cursor() {
        return this.request(`${this.prefix}get_cursor`, []);
      }
      setCursor(pos, isNotify = false) {
        let method = isNotify ? "notify" : "request";
        return this[method](`${this.prefix}set_cursor`, [pos]);
      }
      /** Get window height by number of rows */
      get height() {
        return this.request(`${this.prefix}get_height`, []);
      }
      setHeight(height, isNotify = false) {
        let method = isNotify ? "notify" : "request";
        return this[method](`${this.prefix}set_height`, [height]);
      }
      /** Get window width by number of columns */
      get width() {
        return this.request(`${this.prefix}get_width`, []);
      }
      setWidth(width, isNotify = false) {
        let method = isNotify ? "notify" : "request";
        return this[method](`${this.prefix}set_width`, [width]);
      }
      /** Get window position */
      get position() {
        return this.request(`${this.prefix}get_position`, []);
      }
      /** 0-indexed, on-screen window position(row) in display cells. */
      get row() {
        return this.request(`${this.prefix}get_position`, []).then((position) => position[0]);
      }
      /** 0-indexed, on-screen window position(col) in display cells. */
      get col() {
        return this.request(`${this.prefix}get_position`, []).then((position) => position[1]);
      }
      /** Is window valid */
      get valid() {
        return this.request(`${this.prefix}is_valid`, []);
      }
      /** Get window number */
      get number() {
        return this.request(`${this.prefix}get_number`, []);
      }
      setConfig(options, isNotify) {
        let method = isNotify ? "notify" : "request";
        return this[method](`${this.prefix}set_config`, [options]);
      }
      getConfig() {
        return this.request(`${this.prefix}get_config`, []);
      }
      close(force, isNotify) {
        if (isNotify) {
          this.notify(`${this.prefix}close`, [force]);
          return null;
        }
        return this.request(`${this.prefix}close`, [force]);
      }
      highlightRanges(hlGroup, ranges, priority = 10, isNotify) {
        if (isNotify) {
          this.client.call("coc#highlight#match_ranges", [this.id, 0, ranges, hlGroup, priority], true);
          return void 0;
        }
        return this.client.call("coc#highlight#match_ranges", [this.id, 0, ranges, hlGroup, priority]);
      }
      /**
       * Clear match by highlight group.
       */
      clearMatchGroup(hlGroup) {
        this.client.call("coc#highlight#clear_match_group", [this.id, hlGroup], true);
      }
      /**
       * Clear match by match ids.
       */
      clearMatches(ids) {
        this.client.call("coc#highlight#clear_matches", [this.id, ids], true);
      }
    };
    exports2.Window = Window;
  }
});

// node_modules/@chemzqm/neovim/lib/api/Tabpage.js
var require_Tabpage = __commonJS({
  "node_modules/@chemzqm/neovim/lib/api/Tabpage.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Tabpage = void 0;
    var Base_1 = require_Base();
    var Tabpage = class extends Base_1.BaseApi {
      constructor() {
        super(...arguments);
        this.prefix = "nvim_tabpage_";
      }
      /**
       * The windowid that not change within a Vim session
       */
      get id() {
        return this.data;
      }
      /** Returns all windows of tabpage */
      get windows() {
        return this.request(`${this.prefix}list_wins`, []);
      }
      /** Gets the current window of tabpage */
      get window() {
        return this.request(`${this.prefix}get_win`, []);
      }
      /** Is current tabpage valid */
      get valid() {
        return this.request(`${this.prefix}is_valid`, []);
      }
      /** Tabpage number */
      get number() {
        return this.request(`${this.prefix}get_number`, []);
      }
      /** Invalid */
      getOption() {
        throw new Error("Tabpage does not have `getOption`");
      }
      /** Invalid */
      setOption() {
        throw new Error("Tabpage does not have `setOption`");
      }
    };
    exports2.Tabpage = Tabpage;
  }
});

// node_modules/@chemzqm/neovim/lib/api/types.js
var require_types = __commonJS({
  "node_modules/@chemzqm/neovim/lib/api/types.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Metadata = exports2.ExtType = void 0;
    var Buffer_1 = require_Buffer();
    var Window_1 = require_Window();
    var Tabpage_1 = require_Tabpage();
    var ExtType;
    (function(ExtType2) {
      ExtType2[ExtType2["Buffer"] = 0] = "Buffer";
      ExtType2[ExtType2["Window"] = 1] = "Window";
      ExtType2[ExtType2["Tabpage"] = 2] = "Tabpage";
    })(ExtType = exports2.ExtType || (exports2.ExtType = {}));
    exports2.Metadata = [
      {
        constructor: Buffer_1.Buffer,
        name: "Buffer",
        prefix: "nvim_buf_"
      },
      {
        constructor: Window_1.Window,
        name: "Window",
        prefix: "nvim_win_"
      },
      {
        constructor: Tabpage_1.Tabpage,
        name: "Tabpage",
        prefix: "nvim_tabpage_"
      }
    ];
  }
});

// node_modules/@chemzqm/neovim/lib/utils/logger.js
var require_logger = __commonJS({
  "node_modules/@chemzqm/neovim/lib/utils/logger.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createLogger = exports2.level = exports2.nullLogger = void 0;
    var fs_1 = __importDefault(require("fs"));
    var os_1 = __importDefault(require("os"));
    var path_1 = __importDefault(require("path"));
    var util_1 = require("util");
    var debugging = process.env.COC_NODE_CLIENT_DEBUG == "1" && process.env.COC_TESTER == "1";
    exports2.nullLogger = {
      debug: () => {
      },
      info: () => {
      },
      warn: () => {
      },
      error: () => {
      },
      trace: () => {
      }
    };
    function getLogFile() {
      let file = process.env.NODE_CLIENT_LOG_FILE;
      if (file)
        return file;
      let dir = process.env.XDG_RUNTIME_DIR;
      if (dir)
        return path_1.default.join(dir, "node-client.log");
      return path_1.default.join(os_1.default.tmpdir(), `node-client-${process.pid}.log`);
    }
    var LOG_FILE_PATH = getLogFile();
    exports2.level = debugging ? "debug" : process.env.NODE_CLIENT_LOG_LEVEL || "info";
    var invalid = !debugging && process.getuid && process.getuid() == 0;
    if (!invalid && !debugging) {
      try {
        fs_1.default.mkdirSync(path_1.default.dirname(LOG_FILE_PATH), { recursive: true });
        fs_1.default.writeFileSync(LOG_FILE_PATH, "", { encoding: "utf8", mode: 438 });
      } catch (_e) {
        invalid = true;
      }
    }
    function toObject(arg) {
      if (arg == null) {
        return arg;
      }
      if (Array.isArray(arg)) {
        return arg.map((o) => toObject(o));
      }
      if (typeof arg == "object" && typeof arg.prefix == "string" && typeof arg.data == "number") {
        return "[" + arg.prefix + arg.data + "]";
      }
      return arg;
    }
    function toString(arg) {
      if (debugging)
        return (0, util_1.inspect)(arg, { depth: null, colors: true, compact: false });
      if (arg == null)
        return String(arg);
      if (typeof arg == "object")
        return JSON.stringify(arg, null, 2);
      return String(arg);
    }
    var toTwoDigits = (v) => v < 10 ? `0${v}` : v.toString();
    var toThreeDigits = (v) => v < 10 ? `00${v}` : v < 100 ? `0${v}` : v.toString();
    function toTimeString(currentTime) {
      return `${toTwoDigits(currentTime.getHours())}:${toTwoDigits(currentTime.getMinutes())}:${toTwoDigits(currentTime.getSeconds())}.${toThreeDigits(currentTime.getMilliseconds())}`;
    }
    var Logger = class {
      constructor(name) {
        this.name = name;
      }
      get stream() {
        if (this._stream)
          return this._stream;
        if (debugging) {
          this._stream = process.stdout;
        } else {
          this._stream = fs_1.default.createWriteStream(LOG_FILE_PATH, { encoding: "utf8" });
        }
        return this._stream;
      }
      getText(level, data, meta) {
        let more = "";
        if (meta.length) {
          let arr = toObject(meta);
          more = " " + arr.map((o) => toString(o)).join(", ");
        }
        return `${toTimeString(/* @__PURE__ */ new Date())} ${level.toUpperCase()} [${this.name}] - ${data}${more}
`;
      }
      debug(data, ...meta) {
        if (exports2.level != "debug" || invalid)
          return;
        this.stream.write(this.getText("debug", data, meta));
      }
      info(data, ...meta) {
        if (invalid)
          return;
        this.stream.write(this.getText("info", data, meta));
      }
      warn(data, ...meta) {
        if (invalid)
          return;
        this.stream.write(this.getText("warn", data, meta));
      }
      error(data, ...meta) {
        if (invalid)
          return;
        let stream = debugging ? process.stderr : this.stream;
        stream.write(this.getText("error", data, meta));
      }
      trace(data, ...meta) {
        if (exports2.level != "trace" || invalid)
          return;
        this.stream.write(this.getText("trace", data, meta));
      }
    };
    function createLogger(name) {
      return new Logger(name);
    }
    exports2.createLogger = createLogger;
  }
});

// node_modules/@chemzqm/neovim/lib/transport/base.js
var require_base = __commonJS({
  "node_modules/@chemzqm/neovim/lib/transport/base.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var events_1 = require("events");
    var logger_1 = require_logger();
    var debug = logger_1.level === "debug";
    var logger = (0, logger_1.createLogger)("transport");
    var Transport = class extends events_1.EventEmitter {
      constructor(logger2, isVim) {
        super();
        this.logger = logger2;
        this.isVim = isVim;
        this.pauseLevel = 0;
        this.paused = /* @__PURE__ */ new Map();
      }
      debug(key, ...meta) {
        if (!debug)
          return;
        logger.debug(key, ...meta);
      }
      info(key, ...meta) {
        logger.info(key, ...meta);
      }
      debugMessage(msg) {
        if (!debug)
          return;
        const msgType = msg[0];
        if (msgType == 0) {
          logger.debug("receive request:", msg.slice(1));
        } else if (msgType == 1) {
        } else if (msgType == 2) {
          logger.debug("receive notification:", msg.slice(1));
        } else {
          logger.debug("unknown message:", msg);
        }
      }
      pauseNotification() {
        this.pauseLevel = this.pauseLevel + 1;
        this.paused.set(this.pauseLevel, []);
      }
      cancelNotification() {
        let { pauseLevel } = this;
        if (pauseLevel > 0) {
          this.paused.delete(pauseLevel);
          this.pauseLevel = pauseLevel - 1;
        }
      }
      resumeNotification(isNotify = false) {
        let { pauseLevel } = this;
        if (pauseLevel == 0)
          return isNotify ? null : Promise.resolve([[], null]);
        let obj = {};
        Error.captureStackTrace(obj);
        this.pauseLevel = pauseLevel - 1;
        let list = this.paused.get(pauseLevel);
        this.paused.delete(pauseLevel);
        if (list && list.length) {
          return new Promise((resolve, reject) => {
            if (!isNotify) {
              return this.request("nvim_call_atomic", [list], (err, res) => {
                if (err) {
                  let e = new Error(`call_atomic error: ${err[1]}`);
                  e.stack = obj.stack.replace(/^Error/, `Error: ${e.message}`);
                  return reject(e);
                }
                if (Array.isArray(res) && res[1] != null) {
                  let [index, errType, message] = res[1];
                  let [fname, args] = list[index];
                  let e = new Error(`call_atomic request error on "${fname}": ${message}`);
                  e.stack = obj.stack.replace(/^Error/, `Error: ${e.message}`);
                  this.logger.error(`call_atomic request error ${errType} on "${fname}"`, args, message, e);
                  return reject(e);
                }
                resolve(res);
              });
            }
            this.notify("nvim_call_atomic", [list]);
            resolve(void 0);
          });
        }
        return isNotify ? null : Promise.resolve([[], void 0]);
      }
    };
    exports2.default = Transport;
  }
});

// node_modules/@chemzqm/neovim/lib/transport/nvim.js
var require_nvim = __commonJS({
  "node_modules/@chemzqm/neovim/lib/transport/nvim.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.NvimTransport = void 0;
    var msgpack = __importStar(require_msgpack_lite());
    var buffered_1 = __importDefault(require_buffered());
    var types_1 = require_types();
    var base_1 = __importDefault(require_base());
    var NvimTransport = class extends base_1.default {
      constructor(logger) {
        super(logger, false);
        this.pending = /* @__PURE__ */ new Map();
        this.nextRequestId = 1;
        this.attached = false;
        const codec = this.setupCodec();
        this.encodeStream = msgpack.createEncodeStream({ codec });
        this.decodeStream = msgpack.createDecodeStream({ codec });
        this.decodeStream.on("data", (msg) => {
          this.parseMessage(msg);
        });
        this.decodeStream.on("end", () => {
          this.detach();
          this.emit("detach");
        });
      }
      parseMessage(msg) {
        const msgType = msg[0];
        this.debugMessage(msg);
        if (msgType === 0) {
          let method = msg[2].toString();
          this.emit("request", method, msg[3], this.createResponse(method, msg[1]));
        } else if (msgType === 1) {
          const id = msg[1];
          const handler = this.pending.get(id);
          if (handler) {
            this.pending.delete(id);
            let err = msg[2];
            if (err && err.length != 2) {
              err = [0, err.toString()];
            }
            handler(err, msg[3]);
          }
        } else if (msgType === 2) {
          this.emit("notification", msg[1].toString(), msg[2]);
        } else {
          console.error(`Invalid message type ${msgType}`);
        }
      }
      setupCodec() {
        const codec = msgpack.createCodec();
        types_1.Metadata.forEach(({ constructor }, id) => {
          codec.addExtPacker(id, constructor, (obj) => msgpack.encode(obj.data));
          codec.addExtUnpacker(id, (data) => new constructor({
            transport: this,
            client: this.client,
            data: msgpack.decode(data)
          }));
        });
        this.codec = codec;
        return this.codec;
      }
      attach(writer, reader, client) {
        this.encodeStream = this.encodeStream.pipe(writer);
        const buffered = new buffered_1.default();
        reader.pipe(buffered).pipe(this.decodeStream);
        this.writer = writer;
        this.reader = reader;
        this.client = client;
        this.attached = true;
      }
      detach() {
        if (!this.attached)
          return;
        this.attached = false;
        this.encodeStream.unpipe(this.writer);
        this.reader.unpipe(this.decodeStream);
        for (let handler of this.pending.values()) {
          handler([0, "transport disconnected"]);
        }
        this.pending.clear();
      }
      request(method, args, cb) {
        if (!this.attached)
          return cb([0, "transport disconnected"]);
        let id = this.nextRequestId;
        this.nextRequestId = this.nextRequestId + 1;
        let startTs = Date.now();
        this.debug("request to nvim:", id, method, args);
        this.encodeStream.write(msgpack.encode([0, id, method, args], {
          codec: this.codec
        }));
        this.pending.set(id, (err, res) => {
          this.debug("response of nvim:", id, Date.now() - startTs, res, err);
          cb(err, res);
        });
      }
      notify(method, args) {
        if (!this.attached)
          return;
        if (this.pauseLevel != 0) {
          let arr = this.paused.get(this.pauseLevel);
          if (arr) {
            arr.push([method, args]);
            return;
          }
        }
        this.debug("nvim notification:", method, args);
        this.encodeStream.write(msgpack.encode([2, method, args], {
          codec: this.codec
        }));
      }
      send(arr) {
        this.encodeStream.write(msgpack.encode(arr, {
          codec: this.codec
        }));
      }
      createResponse(method, requestId) {
        let { encodeStream } = this;
        let startTs = Date.now();
        let called = false;
        let timer = setTimeout(() => {
          this.debug(`request to client cost more than 1s`, requestId);
        }, 1e3);
        return {
          send: (resp, isError) => {
            clearTimeout(timer);
            if (called || !this.attached)
              return;
            this.debug("response of client:", requestId, `${Date.now() - startTs}ms`, resp, isError == true);
            called = true;
            encodeStream.write(msgpack.encode([
              1,
              requestId,
              isError ? resp : null,
              !isError ? resp : null
            ]));
          }
        };
      }
    };
    exports2.NvimTransport = NvimTransport;
  }
});

// node_modules/@chemzqm/neovim/lib/utils/constants.js
var require_constants2 = __commonJS({
  "node_modules/@chemzqm/neovim/lib/utils/constants.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isTester = exports2.isCocNvim = void 0;
    exports2.isCocNvim = process.env.COC_NVIM == "1";
    exports2.isTester = process.env.COC_TESTER == "1";
  }
});

// node_modules/@chemzqm/neovim/lib/transport/connection.js
var require_connection = __commonJS({
  "node_modules/@chemzqm/neovim/lib/transport/connection.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    var events_1 = __importDefault(require("events"));
    var logger_1 = require_logger();
    var logger = (0, logger_1.createLogger)("connection");
    var NR_CODE = 10;
    var Connection = class extends events_1.default {
      constructor(readable, writeable) {
        super();
        this.writeable = writeable;
        let cached = [];
        let hasCache = false;
        readable.once("data", (buf) => {
          if (!Buffer.isBuffer(buf))
            throw new Error(`Vim connection expect buffer from readable stream.`);
        });
        let onData = (buf) => {
          let start = 0;
          let len = buf.byteLength;
          for (let i = 0; i < len; i++) {
            if (buf[i] === NR_CODE) {
              let b = buf.slice(start, i);
              if (hasCache) {
                cached.push(b);
                let concated = Buffer.concat(cached);
                hasCache = false;
                cached = [];
                this.parseData(concated.toString("utf8"));
              } else {
                this.parseData(b.toString("utf8"));
              }
              start = i + 1;
            }
          }
          if (start < len) {
            cached.push(start == 0 ? buf : buf.slice(start));
            hasCache = true;
          }
        };
        readable.on("data", onData);
        let onClose = () => {
          logger.warn("readable stream closed.");
        };
        readable.on("close", onClose);
        this.clean = () => {
          readable.off("data", onData);
          readable.off("close", onClose);
        };
      }
      parseData(str) {
        if (str.length == 0)
          return;
        let arr;
        try {
          arr = JSON.parse(str);
        } catch (e) {
          console.error(`Invalid data from vim: ${str}`);
          return;
        }
        let [id, obj] = arr;
        if (id > 0) {
          logger.debug("received request:", id, obj);
          this.emit("request", id, obj);
        } else if (id == 0) {
          logger.debug("received notification:", obj);
          this.emit("notification", obj);
        } else {
          logger.debug("received response:", id, obj);
          this.emit("response", id, obj);
        }
      }
      response(requestId, data) {
        this.send([requestId, data || null]);
      }
      notify(event, data) {
        this.send([0, [event, data || null]]);
      }
      send(arr) {
        logger.debug("send to vim:", arr);
        this.writeable.write(JSON.stringify(arr) + "\n");
      }
      redraw(force) {
        this.send(["redraw", force ? "force" : ""]);
      }
      command(cmd) {
        this.send(["ex", cmd]);
      }
      expr(expr) {
        this.send(["expr", expr]);
      }
      call(func, args, requestId) {
        if (typeof requestId === "number") {
          this.send(["call", func, args, requestId]);
          return;
        }
        this.send(["call", func, args]);
      }
      dispose() {
        if (typeof this.clean === "function") {
          this.clean();
          this.clean = void 0;
        }
        this.removeAllListeners();
      }
    };
    exports2.default = Connection;
  }
});

// node_modules/@chemzqm/neovim/lib/transport/request.js
var require_request = __commonJS({
  "node_modules/@chemzqm/neovim/lib/transport/request.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var constants_1 = require_constants2();
    var func = constants_1.isCocNvim ? "coc#api#call" : "nvim#api#call";
    var Request = class {
      constructor(connection, cb, id) {
        this.connection = connection;
        this.cb = cb;
        this.id = id;
      }
      request(method, args = []) {
        this.method = method;
        this.connection.call(func, [method.slice(5), args], this.id);
      }
      callback(client, err, result) {
        let { method, cb } = this;
        if (err)
          return cb([0, err.toString()]);
        switch (method) {
          case "nvim_list_wins":
          case "nvim_tabpage_list_wins":
            return cb(null, result.map((o) => client.createWindow(o)));
          case "nvim_tabpage_get_win":
          case "nvim_get_current_win":
          case "nvim_open_win":
            return cb(null, client.createWindow(result));
          case "nvim_list_bufs":
            return cb(null, result.map((o) => client.createBuffer(o)));
          case "nvim_win_get_buf":
          case "nvim_create_buf":
          case "nvim_get_current_buf":
            return cb(null, client.createBuffer(result));
          case "nvim_list_tabpages":
            return cb(null, result.map((o) => client.createTabpage(o)));
          case "nvim_win_get_tabpage":
          case "nvim_get_current_tabpage":
            return cb(null, client.createTabpage(result));
          default:
            return cb(null, result);
        }
      }
    };
    exports2.default = Request;
  }
});

// node_modules/@chemzqm/neovim/lib/transport/vim.js
var require_vim = __commonJS({
  "node_modules/@chemzqm/neovim/lib/transport/vim.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.VimTransport = void 0;
    var constants_1 = require_constants2();
    var base_1 = __importDefault(require_base());
    var connection_1 = __importDefault(require_connection());
    var request_1 = __importDefault(require_request());
    var VimTransport = class extends base_1.default {
      constructor(logger) {
        super(logger, true);
        this.pending = /* @__PURE__ */ new Map();
        this.nextRequestId = -1;
        this.attached = false;
        this.errText = "";
        this.outText = "";
        this.notifyMethod = constants_1.isCocNvim ? "coc#api#notify" : "nvim#api#notify";
      }
      attach(writer, reader, client) {
        let connection = this.connection = new connection_1.default(reader, writer);
        this.attached = true;
        this.client = client;
        connection.on("request", (id, obj) => {
          let [method, args] = obj;
          this.emit("request", method, args, this.createResponse(method, id));
        });
        connection.on("notification", (obj) => {
          let [event, args] = obj;
          this.emit("notification", event.toString(), args);
        });
        connection.on("response", (id, obj) => {
          let req = this.pending.get(id);
          if (req) {
            this.pending.delete(id);
            let err = null;
            let result = null;
            if (!Array.isArray(obj)) {
              err = obj;
            } else {
              err = obj[0];
              result = obj[1];
            }
            req.callback(this.client, err, result);
          }
        });
      }
      send(arr) {
        this.connection.send(arr);
      }
      detach() {
        if (!this.attached)
          return;
        this.attached = false;
        this.connection.dispose();
        for (let req of this.pending.values()) {
          req.callback(this.client, "connection disconnected", null);
        }
        this.pending.clear();
      }
      /**
       * Send request to vim
       */
      request(method, args, cb) {
        if (!this.attached)
          return cb([0, "transport disconnected"]);
        let id = this.nextRequestId;
        this.nextRequestId = this.nextRequestId - 1;
        let req = new request_1.default(this.connection, (err, res) => {
          cb(err, res);
        }, id);
        this.pending.set(id, req);
        req.request(method, args);
      }
      notify(method, args) {
        if (!this.attached)
          return;
        if (this.pauseLevel != 0) {
          let arr = this.paused.get(this.pauseLevel);
          if (arr) {
            arr.push([method, args]);
            return;
          }
        }
        let fname = method.slice(5);
        if (fname == "err_write") {
          this.errText = this.errText + args[0].toString();
          return;
        }
        if (fname == "out_write") {
          let msg = args[0].toString() || "";
          if (!msg.includes("\n")) {
            this.outText = this.outText + msg;
          } else {
            let text = this.outText + args[0].toString();
            this.outText = "";
            this.connection.call(this.notifyMethod, [fname, [text]]);
          }
          return;
        }
        if (fname == "err_writeln") {
          let text = this.errText + args[0].toString();
          this.errText = "";
          this.connection.call(this.notifyMethod, [fname, [text]]);
          return;
        }
        this.connection.call(this.notifyMethod, [fname, args]);
      }
      createResponse(method, requestId) {
        let called = false;
        let { connection } = this;
        return {
          send: (resp, isError) => {
            if (called || !this.attached)
              return;
            called = true;
            let err = null;
            if (isError)
              err = typeof resp === "string" ? resp : resp.toString();
            connection.response(requestId, [err, isError ? null : resp]);
          }
        };
      }
    };
    exports2.VimTransport = VimTransport;
  }
});

// node_modules/@chemzqm/neovim/lib/api/Neovim.js
var require_Neovim = __commonJS({
  "node_modules/@chemzqm/neovim/lib/api/Neovim.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Neovim = void 0;
    var Base_1 = require_Base();
    var Buffer_1 = require_Buffer();
    var Tabpage_1 = require_Tabpage();
    var Window_1 = require_Window();
    var constants_1 = require_constants2();
    var Neovim = class extends Base_1.BaseApi {
      constructor() {
        super(...arguments);
        this.prefix = "nvim_";
        this.Buffer = Buffer_1.Buffer;
        this.Window = Window_1.Window;
        this.Tabpage = Tabpage_1.Tabpage;
      }
      getArgs(args) {
        if (!args)
          return [];
        if (Array.isArray(args))
          return args;
        return [args];
      }
      get apiInfo() {
        return this.request(`${this.prefix}get_api_info`);
      }
      /** Get list of all buffers */
      get buffers() {
        return this.request(`${this.prefix}list_bufs`);
      }
      /** Get current buffer */
      get buffer() {
        return this.request(`${this.prefix}get_current_buf`);
      }
      /** Set current buffer */
      async setBuffer(buffer) {
        await this.request(`${this.prefix}set_current_buf`, [buffer]);
      }
      get chans() {
        return this.request(`${this.prefix}list_chans`);
      }
      getChanInfo(chan) {
        return this.request(`${this.prefix}get_chan_info`, [chan]);
      }
      createNamespace(name = "") {
        if (constants_1.isCocNvim) {
          name = name.startsWith("coc-") ? name.slice(4) : name;
          return this.request(`${this.prefix}call_function`, ["coc#highlight#create_namespace", [name]]);
        }
        return this.request(`${this.prefix}create_namespace`, [name]);
      }
      get namespaces() {
        return this.request(`${this.prefix}get_namespaces`, []);
      }
      get commands() {
        return this.getCommands();
      }
      getCommands(options = {}) {
        return this.request(`${this.prefix}get_commands`, [options]);
      }
      /** Get list of all tabpages */
      get tabpages() {
        return this.request(`${this.prefix}list_tabpages`);
      }
      /** Get current tabpage */
      get tabpage() {
        return this.request(`${this.prefix}get_current_tabpage`);
      }
      /** Set current tabpage */
      async setTabpage(tabpage) {
        await this.request(`${this.prefix}set_current_tabpage`, [tabpage]);
      }
      /** Get list of all windows */
      get windows() {
        return this.getWindows();
      }
      /** Get current window */
      get window() {
        return this.request(`${this.prefix}get_current_win`);
      }
      /** Get list of all windows */
      getWindows() {
        return this.request(`${this.prefix}list_wins`);
      }
      async setWindow(win) {
        await this.request(`${this.prefix}set_current_win`, [win]);
      }
      /** Get list of all runtime paths */
      get runtimePaths() {
        return this.request(`${this.prefix}list_runtime_paths`);
      }
      /** Set current directory */
      setDirectory(dir) {
        return this.request(`${this.prefix}set_current_dir`, [dir]);
      }
      /** Get current line. Always returns a Promise. */
      get line() {
        return this.getLine();
      }
      createNewBuffer(listed = false, scratch = false) {
        return this.request(`${this.prefix}create_buf`, [listed, scratch]);
      }
      openFloatWindow(buffer, enter, options) {
        return this.request(`${this.prefix}open_win`, [buffer, enter, options]);
      }
      getLine() {
        return this.request(`${this.prefix}get_current_line`);
      }
      /** Set current line */
      setLine(line) {
        return this.request(`${this.prefix}set_current_line`, [line]);
      }
      /** Gets keymap */
      getKeymap(mode) {
        return this.request(`${this.prefix}get_keymap`, [mode]);
      }
      /** Gets current mode */
      get mode() {
        return this.request(`${this.prefix}get_mode`);
      }
      /** Gets map of defined colors */
      get colorMap() {
        return this.request(`${this.prefix}get_color_map`);
      }
      /** Get color by name */
      getColorByName(name) {
        return this.request(`${this.prefix}get_color_by_name`, [name]);
      }
      /** Get highlight by name or id */
      getHighlight(nameOrId, isRgb = true) {
        const functionName = typeof nameOrId === "string" ? "by_name" : "by_id";
        return this.request(`${this.prefix}get_hl_${functionName}`, [
          nameOrId,
          isRgb
        ]);
      }
      getHighlightByName(name, isRgb = true) {
        return this.request(`${this.prefix}get_hl_by_name`, [name, isRgb]);
      }
      getHighlightById(id, isRgb = true) {
        return this.request(`${this.prefix}get_hl_by_id`, [id, isRgb]);
      }
      /** Delete current line in buffer */
      deleteCurrentLine() {
        return this.request(`${this.prefix}del_current_line`);
      }
      /**
       * Evaluates a VimL expression (:help expression). Dictionaries
       * and Lists are recursively expanded. On VimL error: Returns a
       * generic error; v:errmsg is not updated.
       *
       */
      eval(expr) {
        return this.request(`${this.prefix}eval`, [expr]);
      }
      /**
       * Executes lua, it's possible neovim client does not support this
       */
      lua(code, args = []) {
        return this.request(`${this.prefix}exec_lua`, [code, args]);
      }
      // Alias for `lua()` to be consistent with neovim API
      executeLua(code, args = []) {
        const _args = this.getArgs(args);
        return this.lua(code, _args);
      }
      callDictFunction(dict, fname, args = []) {
        const _args = this.getArgs(args);
        return this.request(`${this.prefix}call_dict_function`, [
          dict,
          fname,
          _args
        ]);
      }
      call(fname, args = [], isNotify) {
        const _args = this.getArgs(args);
        if (isNotify) {
          this.notify(`${this.prefix}call_function`, [fname, _args]);
          return null;
        }
        return this.request(`${this.prefix}call_function`, [fname, _args]);
      }
      callTimer(fname, args = [], isNotify) {
        const _args = this.getArgs(args);
        if (isNotify) {
          this.notify(`${this.prefix}call_function`, ["coc#util#timer", [fname, _args]]);
          return null;
        }
        if (this.transport.isVim) {
          this.notify(`${this.prefix}call_function`, ["coc#util#timer", [fname, _args]]);
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(null);
            }, 20);
          });
        }
        return this.request(`${this.prefix}call_function`, ["coc#util#timer", [fname, _args]]);
      }
      callAsync(fname, args = []) {
        const _args = this.getArgs(args);
        return this.client.sendAsyncRequest(fname, _args);
      }
      /** Alias for `call` */
      callFunction(fname, args = []) {
        return this.call(fname, args);
      }
      /** Call Atomic calls */
      callAtomic(calls) {
        return this.request(`${this.prefix}call_atomic`, [calls]);
      }
      command(arg, isNotify) {
        if (isNotify) {
          this.notify(`${this.prefix}command`, [arg]);
          return null;
        }
        return this.request(`${this.prefix}command`, [arg]);
      }
      /**
       * Runs a command and returns output.
       *
       * @deprecated Use exec instead.
       */
      commandOutput(arg) {
        return this.request(`${this.prefix}command_output`, [arg]);
      }
      /**
       * Executes Vimscript (multiline block of Ex-commands), like
       * anonymous |:source|
       */
      exec(src, output = false) {
        return this.request(`${this.prefix}exec`, [src, output]);
      }
      /** Gets a v: variable */
      getVvar(name) {
        return this.request(`${this.prefix}get_vvar`, [name]);
      }
      /** feedKeys */
      feedKeys(keys, mode, escapeCsi) {
        return this.request(`${this.prefix}feedkeys`, [keys, mode, escapeCsi]);
      }
      /** Sends input keys */
      input(keys) {
        return this.request(`${this.prefix}input`, [keys]);
      }
      /**
       * Parse a VimL Expression
       *
       * TODO: return type, see :help
       */
      parseExpression(expr, flags, highlight) {
        return this.request(`${this.prefix}parse_expression`, [
          expr,
          flags,
          highlight
        ]);
      }
      getProc(pid) {
        return this.request(`${this.prefix}get_proc`, [pid]);
      }
      getProcChildren(pid) {
        return this.request(`${this.prefix}get_proc_children`, [pid]);
      }
      /** Replace term codes */
      replaceTermcodes(str, fromPart, doIt, special) {
        return this.request(`${this.prefix}replace_termcodes`, [
          str,
          fromPart,
          doIt,
          special
        ]);
      }
      /** Gets width of string */
      strWidth(str) {
        return this.request(`${this.prefix}strwidth`, [str]);
      }
      /** Write to output buffer */
      outWrite(str) {
        this.notify(`${this.prefix}out_write`, [str]);
      }
      outWriteLine(str) {
        this.outWrite(`${str}
`);
      }
      /** Write to error buffer */
      errWrite(str) {
        this.notify(`${this.prefix}err_write`, [str]);
      }
      /** Write to error buffer */
      errWriteLine(str) {
        this.notify(`${this.prefix}err_writeln`, [str]);
      }
      // TODO: add type
      get uis() {
        return this.request(`${this.prefix}list_uis`);
      }
      uiAttach(width, height, options) {
        return this.request(`${this.prefix}ui_attach`, [width, height, options]);
      }
      uiDetach() {
        return this.request(`${this.prefix}ui_detach`, []);
      }
      uiTryResize(width, height) {
        return this.request(`${this.prefix}ui_try_resize`, [width, height]);
      }
      /** Set UI Option */
      uiSetOption(name, value) {
        return this.request(`${this.prefix}ui_set_option`, [name, value]);
      }
      /** Subscribe to nvim event broadcasts */
      subscribe(event) {
        return this.request(`${this.prefix}subscribe`, [event]);
      }
      /** Unsubscribe to nvim event broadcasts */
      unsubscribe(event) {
        return this.request(`${this.prefix}unsubscribe`, [event]);
      }
      setClientInfo(name, version, type, methods, attributes) {
        this.notify(`${this.prefix}set_client_info`, [
          name,
          version,
          type,
          methods,
          attributes
        ]);
      }
      /** Quit nvim */
      async quit() {
        this.command("qa!", true);
        if (this.transport) {
          this.transport.detach();
        }
      }
    };
    exports2.Neovim = Neovim;
  }
});

// node_modules/@chemzqm/neovim/lib/api/client.js
var require_client2 = __commonJS({
  "node_modules/@chemzqm/neovim/lib/api/client.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.NeovimClient = exports2.AsyncResponse = void 0;
    var nvim_1 = require_nvim();
    var vim_1 = require_vim();
    var constants_1 = require_constants2();
    var Buffer_1 = require_Buffer();
    var Neovim_1 = require_Neovim();
    var Tabpage_1 = require_Tabpage();
    var Window_1 = require_Window();
    var functionsOnVim = [
      "nvim_buf_attach",
      "nvim_get_mode",
      "nvim_list_runtime_paths",
      "nvim_win_del_var",
      "nvim_tabpage_list_wins",
      "nvim_buf_del_var",
      "nvim_buf_get_mark",
      "nvim_tabpage_set_var",
      "nvim_create_namespace",
      "nvim_win_get_position",
      "nvim_win_set_height",
      "nvim_call_atomic",
      "nvim_buf_detach",
      "nvim_buf_line_count",
      "nvim_set_current_buf",
      "nvim_set_current_dir",
      "nvim_get_var",
      "nvim_del_current_line",
      "nvim_win_set_width",
      "nvim_out_write",
      "nvim_win_is_valid",
      "nvim_set_current_win",
      "nvim_get_current_tabpage",
      "nvim_tabpage_is_valid",
      "nvim_set_var",
      "nvim_win_get_height",
      "nvim_win_get_buf",
      "nvim_win_get_width",
      "nvim_buf_set_name",
      "nvim_subscribe",
      "nvim_get_current_win",
      "nvim_feedkeys",
      "nvim_get_vvar",
      "nvim_tabpage_get_number",
      "nvim_get_current_buf",
      "nvim_win_get_option",
      "nvim_win_get_cursor",
      "nvim_get_current_line",
      "nvim_win_get_var",
      "nvim_buf_get_var",
      "nvim_set_current_tabpage",
      "nvim_buf_clear_namespace",
      "nvim_err_write",
      "nvim_del_var",
      "nvim_call_dict_function",
      "nvim_set_current_line",
      "nvim_get_api_info",
      "nvim_unsubscribe",
      "nvim_get_option",
      "nvim_list_wins",
      "nvim_set_client_info",
      "nvim_win_set_cursor",
      "nvim_win_set_option",
      "nvim_eval",
      "nvim_tabpage_get_var",
      "nvim_buf_get_option",
      "nvim_tabpage_del_var",
      "nvim_buf_get_name",
      "nvim_list_bufs",
      "nvim_win_set_buf",
      "nvim_win_close",
      "nvim_command_output",
      "nvim_command",
      "nvim_tabpage_get_win",
      "nvim_win_set_var",
      "nvim_buf_add_highlight",
      "nvim_buf_set_var",
      "nvim_win_get_number",
      "nvim_strwidth",
      "nvim_buf_set_lines",
      "nvim_err_writeln",
      "nvim_buf_set_option",
      "nvim_list_tabpages",
      "nvim_set_option",
      "nvim_buf_get_lines",
      "nvim_buf_get_changedtick",
      "nvim_win_get_tabpage",
      "nvim_call_function",
      "nvim_buf_is_valid"
    ];
    var AsyncResponse = class {
      constructor(requestId, cb) {
        this.requestId = requestId;
        this.cb = cb;
        this.finished = false;
      }
      finish(err, res) {
        if (this.finished)
          return;
        this.finished = true;
        if (err) {
          this.cb(new Error(err));
          return;
        }
        this.cb(null, res);
      }
    };
    exports2.AsyncResponse = AsyncResponse;
    var NeovimClient = class extends Neovim_1.Neovim {
      constructor(logger, isVim) {
        super({});
        this.logger = logger;
        this.isVim = isVim;
        this.requestId = 1;
        this.responses = /* @__PURE__ */ new Map();
        this.attachedBuffers = /* @__PURE__ */ new Map();
        Object.defineProperty(this, "client", {
          value: this
        });
        let transport = isVim ? new vim_1.VimTransport(logger) : new nvim_1.NvimTransport(logger);
        this.setTransport(transport);
        this.transportAttached = false;
        this.handleRequest = this.handleRequest.bind(this);
        this.handleNotification = this.handleNotification.bind(this);
      }
      echoError(msg) {
        let prefix = constants_1.isCocNvim ? "[coc.nvim] " : "";
        if (msg instanceof Error) {
          if (!constants_1.isTester)
            this.errWriteLine(prefix + msg.message + " use :CocOpenLog for details");
          this.logError(msg.message || "Unknown error", msg);
        } else {
          if (!constants_1.isTester)
            this.errWriteLine(prefix + msg);
          this.logError(msg.toString(), new Error());
        }
      }
      logError(msg, ...args) {
        if (constants_1.isTester)
          console.error(msg, ...args);
        if (!this.logger)
          return;
        this.logger.error(msg, ...args);
      }
      createBuffer(id) {
        return new Buffer_1.Buffer({
          transport: this.transport,
          data: id,
          client: this
        });
      }
      createWindow(id) {
        return new Window_1.Window({
          transport: this.transport,
          data: id,
          client: this
        });
      }
      createTabpage(id) {
        return new Tabpage_1.Tabpage({
          transport: this.transport,
          data: id,
          client: this
        });
      }
      send(arr) {
        this.transport.send(arr);
      }
      /**
       * Invoke redraw on vim.
       */
      redrawVim(force) {
        if (!this.isVim)
          return;
        this.transport.notify("nvim_command", ["redraw" + (force ? "!" : "")]);
      }
      /** Attaches msgpack to read/write streams * */
      attach({ reader, writer }, requestApi = true) {
        this.transport.attach(writer, reader, this);
        this.transportAttached = true;
        this.setupTransport(requestApi);
      }
      /* called when attach process disconnected*/
      detach() {
        this.attachedBuffers.clear();
        this.transport.detach();
        this.transportAttached = false;
        this.removeAllListeners();
      }
      get isApiReady() {
        return this.transportAttached && typeof this._channelId !== "undefined";
      }
      get channelId() {
        return this._isReady.then(() => {
          return this._channelId;
        });
      }
      isAttached(bufnr) {
        return this.attachedBuffers.has(bufnr);
      }
      handleRequest(method, args, resp) {
        this.emit("request", method, args, resp);
      }
      sendAsyncRequest(method, args) {
        let id = this.requestId;
        this.requestId = id + 1;
        this.notify("nvim_call_function", ["coc#rpc#async_request", [id, method, args || []]]);
        return new Promise((resolve, reject) => {
          let response = new AsyncResponse(id, (err, res) => {
            if (err)
              return reject(err);
            resolve(res);
          });
          this.responses.set(id, response);
        });
      }
      emitNotification(method, args) {
        if (method.endsWith("_event")) {
          if (method.startsWith("nvim_buf_")) {
            const shortName = method.replace(/nvim_buf_(.*)_event/, "$1");
            const { id } = args[0];
            if (!this.attachedBuffers.has(id))
              return;
            const bufferMap = this.attachedBuffers.get(id);
            const cbs = bufferMap.get(shortName) || [];
            cbs.forEach((cb) => cb(...args));
            if (shortName === "detach") {
              this.attachedBuffers.delete(id);
            }
            return;
          }
          if (method.startsWith("nvim_async_request")) {
            const [id, method2, arr] = args;
            this.handleRequest(method2, arr, {
              send: (resp, isError) => {
                this.notify("nvim_call_function", ["coc#rpc#async_response", [id, resp, isError]]);
              }
            });
            return;
          }
          if (method.startsWith("nvim_async_response")) {
            const [id, err, res] = args;
            const response = this.responses.get(id);
            if (!response) {
              console.error(`Response not found for request ${id}`);
              return;
            }
            this.responses.delete(id);
            response.finish(err, res);
            return;
          }
          if (method === "nvim_error_event") {
            this.logger.error(`Error event from nvim:`, args[0], args[1]);
            this.emit("vim_error", args[1]);
            return;
          }
          this.logger.warn(`Unhandled event: ${method}`, args);
        } else {
          this.emit("notification", method, args);
        }
      }
      handleNotification(method, args) {
        this.emitNotification(method, args);
      }
      // Listen and setup handlers for transport
      setupTransport(requestApi = true) {
        if (!this.transportAttached) {
          throw new Error("Not attached to input/output");
        }
        this.transport.on("request", this.handleRequest);
        this.transport.on("notification", this.handleNotification);
        this.transport.on("detach", () => {
          this.emit("disconnect");
          this.transport.removeAllListeners("request");
          this.transport.removeAllListeners("notification");
          this.transport.removeAllListeners("detach");
        });
        if (requestApi) {
          this._isReady = this.generateApi().catch((err) => {
            this.logger.error(err);
            return false;
          });
        } else {
          this._channelId = 1;
          this._isReady = Promise.resolve(true);
        }
      }
      requestApi() {
        return new Promise((resolve, reject) => {
          this.transport.request("nvim_get_api_info", [], (err, res) => {
            if (err) {
              reject(new Error(Array.isArray(err) ? err[1] : err.message || err.toString()));
            } else {
              resolve(res);
            }
          });
        });
      }
      async generateApi() {
        let results = await this.requestApi();
        const [channelId, metadata] = results;
        this._channelId = channelId;
        return true;
      }
      attachBufferEvent(buffer, eventName, cb) {
        const bufferMap = this.attachedBuffers.get(buffer.id) || /* @__PURE__ */ new Map();
        const cbs = bufferMap.get(eventName) || [];
        if (cbs.includes(cb))
          return;
        cbs.push(cb);
        bufferMap.set(eventName, cbs);
        this.attachedBuffers.set(buffer.id, bufferMap);
        return;
      }
      /**
       * Returns `true` if buffer should be detached
       */
      detachBufferEvent(buffer, eventName, cb) {
        const bufferMap = this.attachedBuffers.get(buffer.id);
        if (!bufferMap || !bufferMap.has(eventName))
          return;
        const handlers = bufferMap.get(eventName).filter((handler) => handler !== cb);
        bufferMap.set(eventName, handlers);
      }
      pauseNotification() {
        let o = {};
        Error.captureStackTrace(o);
        if (this.transport.pauseLevel != 0) {
          this.logError(`Nested nvim.pauseNotification() detected, please avoid it:`, o.stack);
        }
        this.transport.pauseNotification();
        process.nextTick(() => {
          if (this.transport.pauseLevel > 0) {
            this.logError(`resumeNotification not called within same tick:`, o.stack);
          }
        });
      }
      resumeNotification(redrawVim, notify) {
        if (this.isVim && redrawVim) {
          this.transport.notify("nvim_command", ["redraw"]);
        }
        if (notify) {
          this.transport.resumeNotification(true);
          return Promise.resolve(null);
        }
        return this.transport.resumeNotification();
      }
      /**
       * @deprecated
       */
      hasFunction(name) {
        if (!this.isVim)
          return true;
        return functionsOnVim.includes(name);
      }
    };
    exports2.NeovimClient = NeovimClient;
  }
});

// node_modules/@chemzqm/neovim/lib/attach/attach.js
var require_attach = __commonJS({
  "node_modules/@chemzqm/neovim/lib/attach/attach.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.attach = void 0;
    var net_1 = require("net");
    var client_1 = require_client2();
    var logger_1 = require_logger();
    function attach({ reader: _reader, writer: _writer, proc, socket }, logger = null, requestApi = true) {
      let writer;
      let reader;
      let neovim;
      if (!logger)
        logger = logger_1.nullLogger;
      if (socket) {
        const client = (0, net_1.createConnection)(socket);
        writer = client;
        reader = client;
        client.once("close", () => {
          neovim.detach();
        });
      } else if (_reader && _writer) {
        writer = _writer;
        reader = _reader;
      } else if (proc) {
        writer = proc.stdin;
        reader = proc.stdout;
        proc.once("disconnect", () => {
          neovim.detach();
        });
      }
      writer.on("error", (err) => {
        if (err.code == "EPIPE") {
          neovim.detach();
        }
      });
      if (writer && reader) {
        neovim = new client_1.NeovimClient(logger, process.env.VIM_NODE_RPC == "1");
        neovim.attach({
          writer,
          reader
        }, requestApi);
        return neovim;
      }
      throw new Error("Invalid arguments, could not attach");
    }
    exports2.attach = attach;
  }
});

// node_modules/@chemzqm/neovim/lib/api/index.js
var require_api = __commonJS({
  "node_modules/@chemzqm/neovim/lib/api/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Tabpage = exports2.Window = exports2.Buffer = exports2.NeovimClient = exports2.Neovim = void 0;
    var client_1 = require_client2();
    Object.defineProperty(exports2, "Neovim", { enumerable: true, get: function() {
      return client_1.NeovimClient;
    } });
    var client_2 = require_client2();
    Object.defineProperty(exports2, "NeovimClient", { enumerable: true, get: function() {
      return client_2.NeovimClient;
    } });
    var Buffer_1 = require_Buffer();
    Object.defineProperty(exports2, "Buffer", { enumerable: true, get: function() {
      return Buffer_1.Buffer;
    } });
    var Window_1 = require_Window();
    Object.defineProperty(exports2, "Window", { enumerable: true, get: function() {
      return Window_1.Window;
    } });
    var Tabpage_1 = require_Tabpage();
    Object.defineProperty(exports2, "Tabpage", { enumerable: true, get: function() {
      return Tabpage_1.Tabpage;
    } });
  }
});

// node_modules/@chemzqm/neovim/lib/index.js
var require_lib3 = __commonJS({
  "node_modules/@chemzqm/neovim/lib/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Window = exports2.Tabpage = exports2.Buffer = exports2.NeovimClient = exports2.Neovim = exports2.attach = void 0;
    var attach_1 = require_attach();
    Object.defineProperty(exports2, "attach", { enumerable: true, get: function() {
      return attach_1.attach;
    } });
    var index_1 = require_api();
    Object.defineProperty(exports2, "Neovim", { enumerable: true, get: function() {
      return index_1.Neovim;
    } });
    Object.defineProperty(exports2, "NeovimClient", { enumerable: true, get: function() {
      return index_1.NeovimClient;
    } });
    Object.defineProperty(exports2, "Buffer", { enumerable: true, get: function() {
      return index_1.Buffer;
    } });
    Object.defineProperty(exports2, "Tabpage", { enumerable: true, get: function() {
      return index_1.Tabpage;
    } });
    Object.defineProperty(exports2, "Window", { enumerable: true, get: function() {
      return index_1.Window;
    } });
  }
});

// log.js
var require_log = __commonJS({
  "log.js"(exports2, module2) {
    "use strict";
    function log(...args) {
      if (process.env.MKDP_DEBUG) {
        console.error("[mkdp]", ...args);
      }
    }
    module2.exports = { log };
  }
});

// attach.js
var require_attach2 = __commonJS({
  "attach.js"(exports2, module2) {
    "use strict";
    var { attach } = require_lib3();
    var { log } = require_log();
    var app;
    function create() {
      const nvim = attach({ reader: process.stdin, writer: process.stdout });
      nvim.on("notification", async (method, args) => {
        const opts = args[0] || args;
        const bufnr = opts && opts.bufnr;
        const buffers = await nvim.buffers;
        const buffer = buffers.find((b) => b.id === bufnr);
        if (method === "refresh_content") {
          const winline = await nvim.call("winline");
          const currentWindow = await nvim.window;
          const winheight = await nvim.call("winheight", currentWindow.id);
          const cursor = await nvim.call("getpos", ".");
          const renderOpts = await nvim.getVar("mkdp_preview_options");
          const pageTitle = await nvim.getVar("mkdp_page_title");
          const theme = await nvim.getVar("mkdp_theme");
          const name = await buffer.name;
          const content = await buffer.getLines();
          const currentBuffer = await nvim.buffer;
          app.refreshPage({
            bufnr,
            data: {
              options: renderOpts,
              isActive: currentBuffer.id === buffer.id,
              winline,
              winheight,
              cursor,
              pageTitle,
              theme,
              name,
              content
            }
          });
        } else if (method === "close_page") {
          app.closePage({ bufnr });
        } else if (method === "open_browser") {
          app.openBrowser({ bufnr });
        }
      });
      nvim.on("request", (method, args, resp) => {
        if (method === "close_all_pages") {
          app.closeAllPages();
        }
        resp.send();
      });
      nvim.channelId.then((channelId) => {
        nvim.setVar("mkdp_node_channel_id", channelId);
      }).catch((e) => {
        log("channelId:", e && e.message);
      });
      return {
        nvim,
        init: (param) => {
          app = param;
        }
      };
    }
    module2.exports = create;
  }
});

// paths.js
var require_paths = __commonJS({
  "paths.js"(exports2, module2) {
    "use strict";
    var fs = require("fs");
    var path = require("path");
    function findAppDir() {
      let dir = __dirname;
      for (let i = 0; i < 4; i++) {
        if (fs.existsSync(path.join(dir, "_static")) || fs.existsSync(path.join(dir, "out"))) {
          return dir;
        }
        dir = path.join(dir, "..");
      }
      return path.join(__dirname, "..");
    }
    module2.exports = { APP_DIR: findAppDir() };
  }
});

// routes.js
var require_routes = __commonJS({
  "routes.js"(exports2, module2) {
    "use strict";
    var fs = require("fs");
    var path = require("path");
    var childProcess = require("child_process");
    var { APP_DIR } = require_paths();
    var { log } = require_log();
    var OUT_DIR = path.join(APP_DIR, "out");
    var STATIC_DIR = path.join(APP_DIR, "_static");
    var routes = [];
    var use = (fn) => routes.push(fn);
    use((req, res, next) => {
      if (/^\/page\/\d+\/?$/.test(req.asPath)) {
        return fs.createReadStream(path.join(OUT_DIR, "index.html")).pipe(res);
      }
      next();
    });
    use((req, res, next) => {
      if (/^\/_next\//.test(req.asPath)) {
        const file = path.join(OUT_DIR, req.asPath);
        if (fs.existsSync(file) && fs.statSync(file).isFile()) {
          return fs.createReadStream(file).pipe(res);
        }
      }
      next();
    });
    use((req, res, next) => {
      try {
        if (req.mkcss && req.asPath === "/_static/markdown.css") {
          if (fs.existsSync(req.mkcss)) {
            return fs.createReadStream(req.mkcss).pipe(res);
          }
        } else if (req.hicss && req.asPath === "/_static/highlight.css") {
          if (fs.existsSync(req.hicss)) {
            return fs.createReadStream(req.hicss).pipe(res);
          }
        }
      } catch (e) {
        log("load custom css fail:", req.asPath, e.message);
      }
      next();
    });
    use((req, res, next) => {
      if (/^\/_static\//.test(req.asPath)) {
        const rel = req.asPath.replace(/^\/_static\//, "");
        const file = path.join(STATIC_DIR, rel);
        if (fs.existsSync(file) && fs.statSync(file).isFile()) {
          return fs.createReadStream(file).pipe(res);
        }
        log("no such static file:", req.asPath);
      }
      next();
    });
    use(async (req, res, next) => {
      const reg = /^\/_local_image_/;
      if (reg.test(req.asPath) && req.asPath !== "") {
        const plugin = req.plugin;
        const buffers = await plugin.nvim.buffers;
        const buffer = buffers.find((b) => b.id === Number(req.bufnr));
        if (buffer) {
          let fileDir = "";
          if (req.custImgPath) {
            fileDir = req.custImgPath;
          } else {
            fileDir = await plugin.nvim.call("expand", `#${req.bufnr}:p:h`);
          }
          const mingwHome = process.env.MINGW_HOME;
          if (mingwHome && !fileDir.includes(":")) {
            try {
              const result = childProcess.execSync(`cygpath.exe -w -a ${fileDir}`);
              fileDir = result.toString("utf8").replace("\n", "");
            } catch (e) {
              log("cygpath fail:", e.message);
            }
          }
          let imgPath = decodeURIComponent(
            decodeURIComponent(req.asPath.replace(reg, ""))
          );
          imgPath = imgPath.replace(/\\ /g, " ");
          if (imgPath[0] !== "/" && imgPath[0] !== "\\") {
            imgPath = path.join(fileDir, imgPath);
          } else if (!fs.existsSync(imgPath)) {
            let tmpDirPath = fileDir;
            while (tmpDirPath !== "/" && tmpDirPath !== "\\") {
              tmpDirPath = path.normalize(path.join(tmpDirPath, ".."));
              const tmpImgPath = path.join(tmpDirPath, imgPath);
              if (fs.existsSync(tmpImgPath)) {
                imgPath = tmpImgPath;
                break;
              }
            }
          }
          if (fs.existsSync(imgPath) && !fs.statSync(imgPath).isDirectory()) {
            if (imgPath.endsWith("svg")) {
              res.setHeader("content-type", "image/svg+xml");
            }
            return fs.createReadStream(imgPath).pipe(res);
          }
          log("image not exists:", imgPath);
        }
      }
      next();
    });
    use((req, res) => {
      res.statusCode = 404;
      const file = path.join(OUT_DIR, "404.html");
      if (fs.existsSync(file)) {
        return fs.createReadStream(file).pipe(res);
      }
      res.end("404");
    });
    module2.exports = function(req, res) {
      let i = 0;
      const next = (err) => {
        if (err) {
          res.statusCode = 500;
          return res.end(String(err));
        }
        const route = routes[i++];
        if (route) {
          return route(req, res, next);
        }
      };
      next();
    };
  }
});

// opener.js
var require_opener = __commonJS({
  "opener.js"(exports2, module2) {
    "use strict";
    var childProcess = require("child_process");
    var os = require("os");
    function opener(args, tool) {
      let platform = process.platform;
      args = [].concat(args);
      if (platform === "linux" && os.release().toLowerCase().indexOf("microsoft") !== -1) {
        platform = "win32";
      }
      let command;
      switch (platform) {
        case "win32": {
          command = "cmd.exe";
          if (tool) {
            args.unshift(tool);
          }
          break;
        }
        case "darwin": {
          command = "open";
          if (tool) {
            args.unshift(tool);
            args.unshift("-a");
          }
          break;
        }
        default: {
          command = tool || "xdg-open";
          break;
        }
      }
      if (platform === "win32") {
        args = args.map((value) => String(value).replace(/&/g, "^&"));
        args = ["/c", "start", '""'].concat(args);
      }
      return childProcess.spawn(command, args, {
        shell: false,
        detached: true
      });
    }
    module2.exports = opener;
  }
});

// getIP.js
var require_getIP = __commonJS({
  "getIP.js"(exports2, module2) {
    "use strict";
    var os = require("os");
    function getIP() {
      const interfaces = os.networkInterfaces();
      let IP = "";
      Object.keys(interfaces).some((devName) => {
        const iface = interfaces[devName] || [];
        for (const alias of iface) {
          if (alias.family === "IPv4" && alias.address !== "127.0.0.1" && !alias.internal) {
            IP = alias.address;
            return true;
          }
        }
        return false;
      });
      return IP;
    }
    module2.exports = { getIP };
  }
});

// lua.js
var require_lua = __commonJS({
  "lua.js"(exports2, module2) {
    "use strict";
    function lua(nvim, method, args) {
      return nvim.lua("return require('mkdp')._rpc(...)", [
        method,
        args === void 0 ? null : args
      ]);
    }
    module2.exports = { lua };
  }
});

// server.js
var require_server2 = __commonJS({
  "server.js"(exports2, module2) {
    "use strict";
    var http = require("http");
    var socketio = require_lib2();
    var createAttach = require_attach2();
    var routes = require_routes();
    var opener = require_opener();
    var { getIP } = require_getIP();
    var { lua } = require_lua();
    var { log } = require_log();
    function run() {
      const plugin = createAttach();
      process.on("uncaughtException", (err) => {
        const msg = `[markdown-preview.nvim] uncaught exception: ${err && err.stack || err}`;
        log(msg);
        lua(plugin.nvim, "echo", { hl: "Error", msgs: msg.split("\n") });
      });
      process.on("unhandledRejection", (reason) => {
        log("unhandledRejection:", reason);
        lua(plugin.nvim, "echo", {
          hl: "Error",
          msgs: ["[markdown-preview.nvim] unhandledRejection", String(reason)]
        });
      });
      let clients = {};
      const openUrl = (url, browser) => {
        const handler = opener(url, browser);
        handler.on("error", (err) => {
          const message = err.message || "";
          const match = message.match(/\s*spawn\s+(.+)\s+ENOENT\s*/);
          if (match) {
            lua(plugin.nvim, "echo", {
              hl: "Error",
              msgs: [
                `[markdown-preview.nvim]: Can not open browser by using ${match[1]} command`
              ]
            });
          } else {
            lua(plugin.nvim, "echo", {
              hl: "Error",
              msgs: [err.name, err.message]
            });
          }
        });
      };
      const updateClientsActiveVar = () => {
        const active = Object.values(clients).some(
          (cs) => cs.some((c) => c.connected)
        ) ? 1 : 0;
        plugin.nvim.setVar("mkdp_clients_active", active);
      };
      const server = http.createServer(async (req, res) => {
        req.plugin = plugin;
        req.bufnr = (req.headers.referer || req.url).replace(/[?#].*$/, "").split("/").pop();
        req.asPath = req.url.replace(/[?#].*$/, "");
        req.mkcss = await plugin.nvim.getVar("mkdp_markdown_css");
        req.hicss = await plugin.nvim.getVar("mkdp_highlight_css");
        req.custImgPath = await plugin.nvim.getVar("mkdp_images_path");
        routes(req, res);
      });
      const io = socketio(server);
      io.on("connection", async (client) => {
        const bufnr = client.handshake.query.bufnr;
        clients[bufnr] = clients[bufnr] || [];
        clients[bufnr].push(client);
        updateClientsActiveVar();
        const buffers = await plugin.nvim.buffers;
        buffers.forEach(async (buffer) => {
          if (buffer.id === Number(bufnr)) {
            const winline = await plugin.nvim.call("winline");
            const currentWindow = await plugin.nvim.window;
            const winheight = await plugin.nvim.call("winheight", currentWindow.id);
            const cursor = await plugin.nvim.call("getpos", ".");
            const options = await plugin.nvim.getVar("mkdp_preview_options");
            const pageTitle = await plugin.nvim.getVar("mkdp_page_title");
            const theme = await plugin.nvim.getVar("mkdp_theme");
            const name = await buffer.name;
            const content = await buffer.getLines();
            const currentBuffer = await plugin.nvim.buffer;
            client.emit("refresh_content", {
              options,
              isActive: currentBuffer.id === buffer.id,
              winline,
              winheight,
              cursor,
              pageTitle,
              theme,
              name,
              content
            });
          }
        });
        client.on("disconnect", () => {
          clients[bufnr] = (clients[bufnr] || []).filter((c) => c.id !== client.id);
          updateClientsActiveVar();
        });
      });
      async function startServer() {
        const openToTheWorld = await plugin.nvim.getVar("mkdp_open_to_the_world");
        const host = openToTheWorld ? "0.0.0.0" : "127.0.0.1";
        let port = await plugin.nvim.getVar("mkdp_port");
        port = port || 8080 + Number(`${Date.now()}`.slice(-3));
        server.listen({ host, port }, () => {
          log("server listening on", `${host}:${port}`);
          function refreshPage({ bufnr, data }) {
            ;
            (clients[bufnr] || []).forEach((c) => {
              if (c.connected) {
                c.emit("refresh_content", data);
              }
            });
          }
          function closePage({ bufnr }) {
            clients[bufnr] = (clients[bufnr] || []).filter((c) => {
              if (c.connected) {
                c.emit("close_page");
                return false;
              }
              return true;
            });
          }
          function closeAllPages() {
            Object.keys(clients).forEach((bufnr) => {
              ;
              (clients[bufnr] || []).forEach((c) => {
                if (c.connected) {
                  c.emit("close_page");
                }
              });
            });
            clients = {};
          }
          async function openBrowser({ bufnr }) {
            const combinePreview = await plugin.nvim.getVar("mkdp_combine_preview");
            if (combinePreview && Object.values(clients).some((cs) => cs.some((c) => c.connected))) {
              Object.values(clients).forEach((cs) => {
                cs.forEach((c) => {
                  if (c.connected) {
                    c.emit("change_bufnr", bufnr);
                  }
                });
              });
            } else {
              const openIp = await plugin.nvim.getVar("mkdp_open_ip");
              const openHost = openIp !== "" ? openIp : openToTheWorld ? getIP() : "localhost";
              const url = `http://${openHost}:${port}/page/${bufnr}`;
              const browserfunc = await plugin.nvim.getVar("mkdp_browserfunc");
              if (browserfunc) {
                lua(plugin.nvim, "browserfunc", url);
              } else {
                const browser = await plugin.nvim.getVar("mkdp_browser");
                if (browser !== "") {
                  openUrl(url, browser);
                } else {
                  openUrl(url);
                }
              }
              const isEchoUrl = await plugin.nvim.getVar("mkdp_echo_preview_url");
              if (isEchoUrl) {
                lua(plugin.nvim, "echo_url", url);
              }
            }
          }
          plugin.init({ refreshPage, closePage, closeAllPages, openBrowser });
          lua(plugin.nvim, "open_browser");
        });
      }
      startServer();
    }
    module2.exports = { run };
  }
});

// entry.js
process.noDeprecation = true;
require_server2().run();
/*! Bundled license information:

base64id/lib/base64id.js:
  (*!
   * base64id v0.1.0
   *)

engine.io-parser/lib/utf8.js:
  (*! https://mths.be/utf8js v2.1.2 by @mathias *)

negotiator/index.js:
  (*!
   * negotiator
   * Copyright(c) 2012 Federico Romero
   * Copyright(c) 2012-2014 Isaac Z. Schlueter
   * Copyright(c) 2015 Douglas Christopher Wilson
   * MIT Licensed
   *)

mime-db/index.js:
  (*!
   * mime-db
   * Copyright(c) 2014 Jonathan Ong
   * Copyright(c) 2015-2022 Douglas Christopher Wilson
   * MIT Licensed
   *)

mime-types/index.js:
  (*!
   * mime-types
   * Copyright(c) 2014 Jonathan Ong
   * Copyright(c) 2015 Douglas Christopher Wilson
   * MIT Licensed
   *)

accepts/index.js:
  (*!
   * accepts
   * Copyright(c) 2014 Jonathan Ong
   * Copyright(c) 2015 Douglas Christopher Wilson
   * MIT Licensed
   *)

cookie/index.js:
  (*!
   * cookie
   * Copyright(c) 2012-2014 Roman Shtylman
   * Copyright(c) 2015 Douglas Christopher Wilson
   * MIT Licensed
   *)

ieee754/index.js:
  (*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> *)
*/
