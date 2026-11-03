import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/.pnpm/bn.js@4.12.5/node_modules/bn.js/lib/bn.js
var require_bn = __commonJS({
  "node_modules/.pnpm/bn.js@4.12.5/node_modules/bn.js/lib/bn.js"(exports, module) {
    (function(module2, exports2) {
      "use strict";
      function assert(val, msg) {
        if (!val) throw new Error(msg || "Assertion failed");
      }
      function inherits(ctor, superCtor) {
        ctor.super_ = superCtor;
        var TempCtor = function() {
        };
        TempCtor.prototype = superCtor.prototype;
        ctor.prototype = new TempCtor();
        ctor.prototype.constructor = ctor;
      }
      function BN(number, base, endian) {
        if (BN.isBN(number)) {
          return number;
        }
        this.negative = 0;
        this.words = null;
        this.length = 0;
        this.red = null;
        if (number !== null) {
          if (base === "le" || base === "be") {
            endian = base;
            base = 10;
          }
          this._init(number || 0, base || 10, endian || "be");
        }
      }
      if (typeof module2 === "object") {
        module2.exports = BN;
      } else {
        exports2.BN = BN;
      }
      BN.BN = BN;
      BN.wordSize = 26;
      var Buffer2;
      try {
        if (typeof window !== "undefined" && typeof window.Buffer !== "undefined") {
          Buffer2 = window.Buffer;
        } else {
          Buffer2 = __require("buffer").Buffer;
        }
      } catch (e) {
      }
      BN.isBN = function isBN(num) {
        if (num instanceof BN) {
          return true;
        }
        return num !== null && typeof num === "object" && num.constructor.wordSize === BN.wordSize && Array.isArray(num.words);
      };
      BN.max = function max(left, right) {
        if (left.cmp(right) > 0) return left;
        return right;
      };
      BN.min = function min(left, right) {
        if (left.cmp(right) < 0) return left;
        return right;
      };
      BN.prototype._init = function init2(number, base, endian) {
        if (typeof number === "number") {
          return this._initNumber(number, base, endian);
        }
        if (typeof number === "object") {
          return this._initArray(number, base, endian);
        }
        if (base === "hex") {
          base = 16;
        }
        assert(base === (base | 0) && base >= 2 && base <= 36);
        number = number.toString().replace(/\s+/g, "");
        var start = 0;
        if (number[0] === "-") {
          start++;
          this.negative = 1;
        }
        if (start < number.length) {
          if (base === 16) {
            this._parseHex(number, start, endian);
          } else {
            this._parseBase(number, base, start);
            if (endian === "le") {
              this._initArray(this.toArray(), base, endian);
            }
          }
        }
      };
      BN.prototype._initNumber = function _initNumber(number, base, endian) {
        if (number < 0) {
          this.negative = 1;
          number = -number;
        }
        if (number < 67108864) {
          this.words = [number & 67108863];
          this.length = 1;
        } else if (number < 4503599627370496) {
          this.words = [
            number & 67108863,
            number / 67108864 & 67108863
          ];
          this.length = 2;
        } else {
          assert(number < 9007199254740992);
          this.words = [
            number & 67108863,
            number / 67108864 & 67108863,
            1
          ];
          this.length = 3;
        }
        if (endian !== "le") return;
        this._initArray(this.toArray(), base, endian);
      };
      BN.prototype._initArray = function _initArray(number, base, endian) {
        assert(typeof number.length === "number");
        if (number.length <= 0) {
          this.words = [0];
          this.length = 1;
          return this;
        }
        this.length = Math.ceil(number.length / 3);
        this.words = new Array(this.length);
        for (var i = 0; i < this.length; i++) {
          this.words[i] = 0;
        }
        var j, w;
        var off = 0;
        if (endian === "be") {
          for (i = number.length - 1, j = 0; i >= 0; i -= 3) {
            w = number[i] | number[i - 1] << 8 | number[i - 2] << 16;
            this.words[j] |= w << off & 67108863;
            this.words[j + 1] = w >>> 26 - off & 67108863;
            off += 24;
            if (off >= 26) {
              off -= 26;
              j++;
            }
          }
        } else if (endian === "le") {
          for (i = 0, j = 0; i < number.length; i += 3) {
            w = number[i] | number[i + 1] << 8 | number[i + 2] << 16;
            this.words[j] |= w << off & 67108863;
            this.words[j + 1] = w >>> 26 - off & 67108863;
            off += 24;
            if (off >= 26) {
              off -= 26;
              j++;
            }
          }
        }
        return this.strip();
      };
      function parseHex4Bits(string, index) {
        var c = string.charCodeAt(index);
        if (c >= 65 && c <= 70) {
          return c - 55;
        } else if (c >= 97 && c <= 102) {
          return c - 87;
        } else {
          return c - 48 & 15;
        }
      }
      function parseHexByte(string, lowerBound, index) {
        var r = parseHex4Bits(string, index);
        if (index - 1 >= lowerBound) {
          r |= parseHex4Bits(string, index - 1) << 4;
        }
        return r;
      }
      BN.prototype._parseHex = function _parseHex(number, start, endian) {
        this.length = Math.ceil((number.length - start) / 6);
        this.words = new Array(this.length);
        for (var i = 0; i < this.length; i++) {
          this.words[i] = 0;
        }
        var off = 0;
        var j = 0;
        var w;
        if (endian === "be") {
          for (i = number.length - 1; i >= start; i -= 2) {
            w = parseHexByte(number, start, i) << off;
            this.words[j] |= w & 67108863;
            if (off >= 18) {
              off -= 18;
              j += 1;
              this.words[j] |= w >>> 26;
            } else {
              off += 8;
            }
          }
        } else {
          var parseLength = number.length - start;
          for (i = parseLength % 2 === 0 ? start + 1 : start; i < number.length; i += 2) {
            w = parseHexByte(number, start, i) << off;
            this.words[j] |= w & 67108863;
            if (off >= 18) {
              off -= 18;
              j += 1;
              this.words[j] |= w >>> 26;
            } else {
              off += 8;
            }
          }
        }
        this.strip();
      };
      function parseBase(str, start, end, mul) {
        var r = 0;
        var len = Math.min(str.length, end);
        for (var i = start; i < len; i++) {
          var c = str.charCodeAt(i) - 48;
          r *= mul;
          if (c >= 49) {
            r += c - 49 + 10;
          } else if (c >= 17) {
            r += c - 17 + 10;
          } else {
            r += c;
          }
        }
        return r;
      }
      BN.prototype._parseBase = function _parseBase(number, base, start) {
        this.words = [0];
        this.length = 1;
        for (var limbLen = 0, limbPow = 1; limbPow <= 67108863; limbPow *= base) {
          limbLen++;
        }
        limbLen--;
        limbPow = limbPow / base | 0;
        var total = number.length - start;
        var mod = total % limbLen;
        var end = Math.min(total, total - mod) + start;
        var word = 0;
        for (var i = start; i < end; i += limbLen) {
          word = parseBase(number, i, i + limbLen, base);
          this.imuln(limbPow);
          if (this.words[0] + word < 67108864) {
            this.words[0] += word;
          } else {
            this._iaddn(word);
          }
        }
        if (mod !== 0) {
          var pow = 1;
          word = parseBase(number, i, number.length, base);
          for (i = 0; i < mod; i++) {
            pow *= base;
          }
          this.imuln(pow);
          if (this.words[0] + word < 67108864) {
            this.words[0] += word;
          } else {
            this._iaddn(word);
          }
        }
        this.strip();
      };
      BN.prototype.copy = function copy(dest) {
        dest.words = new Array(this.length);
        for (var i = 0; i < this.length; i++) {
          dest.words[i] = this.words[i];
        }
        dest.length = this.length;
        dest.negative = this.negative;
        dest.red = this.red;
      };
      BN.prototype.clone = function clone() {
        var r = new BN(null);
        this.copy(r);
        return r;
      };
      BN.prototype._expand = function _expand(size) {
        while (this.length < size) {
          this.words[this.length++] = 0;
        }
        return this;
      };
      BN.prototype.strip = function strip() {
        while (this.length > 1 && this.words[this.length - 1] === 0) {
          this.length--;
        }
        return this._normSign();
      };
      BN.prototype._normSign = function _normSign() {
        if (this.length === 1 && this.words[0] === 0) {
          this.negative = 0;
        }
        return this;
      };
      BN.prototype.inspect = function inspect() {
        return (this.red ? "<BN-R: " : "<BN: ") + this.toString(16) + ">";
      };
      var zeros = [
        "",
        "0",
        "00",
        "000",
        "0000",
        "00000",
        "000000",
        "0000000",
        "00000000",
        "000000000",
        "0000000000",
        "00000000000",
        "000000000000",
        "0000000000000",
        "00000000000000",
        "000000000000000",
        "0000000000000000",
        "00000000000000000",
        "000000000000000000",
        "0000000000000000000",
        "00000000000000000000",
        "000000000000000000000",
        "0000000000000000000000",
        "00000000000000000000000",
        "000000000000000000000000",
        "0000000000000000000000000"
      ];
      var groupSizes = [
        0,
        0,
        25,
        16,
        12,
        11,
        10,
        9,
        8,
        8,
        7,
        7,
        7,
        7,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5
      ];
      var groupBases = [
        0,
        0,
        33554432,
        43046721,
        16777216,
        48828125,
        60466176,
        40353607,
        16777216,
        43046721,
        1e7,
        19487171,
        35831808,
        62748517,
        7529536,
        11390625,
        16777216,
        24137569,
        34012224,
        47045881,
        64e6,
        4084101,
        5153632,
        6436343,
        7962624,
        9765625,
        11881376,
        14348907,
        17210368,
        20511149,
        243e5,
        28629151,
        33554432,
        39135393,
        45435424,
        52521875,
        60466176
      ];
      BN.prototype.toString = function toString(base, padding) {
        base = base || 10;
        padding = padding | 0 || 1;
        var out;
        if (base === 16 || base === "hex") {
          out = "";
          var off = 0;
          var carry = 0;
          for (var i = 0; i < this.length; i++) {
            var w = this.words[i];
            var word = ((w << off | carry) & 16777215).toString(16);
            carry = w >>> 24 - off & 16777215;
            off += 2;
            if (off >= 26) {
              off -= 26;
              i--;
            }
            if (carry !== 0 || i !== this.length - 1) {
              out = zeros[6 - word.length] + word + out;
            } else {
              out = word + out;
            }
          }
          if (carry !== 0) {
            out = carry.toString(16) + out;
          }
          while (out.length % padding !== 0) {
            out = "0" + out;
          }
          if (this.negative !== 0) {
            out = "-" + out;
          }
          return out;
        }
        if (base === (base | 0) && base >= 2 && base <= 36) {
          var groupSize = groupSizes[base];
          var groupBase = groupBases[base];
          out = "";
          var c = this.clone();
          c.negative = 0;
          while (!c.isZero()) {
            var r = c.modn(groupBase).toString(base);
            c = c.idivn(groupBase);
            if (!c.isZero()) {
              out = zeros[groupSize - r.length] + r + out;
            } else {
              out = r + out;
            }
          }
          if (this.isZero()) {
            out = "0" + out;
          }
          while (out.length % padding !== 0) {
            out = "0" + out;
          }
          if (this.negative !== 0) {
            out = "-" + out;
          }
          return out;
        }
        assert(false, "Base should be between 2 and 36");
      };
      BN.prototype.toNumber = function toNumber() {
        var ret = this.words[0];
        if (this.length === 2) {
          ret += this.words[1] * 67108864;
        } else if (this.length === 3 && this.words[2] === 1) {
          ret += 4503599627370496 + this.words[1] * 67108864;
        } else if (this.length > 2) {
          assert(false, "Number can only safely store up to 53 bits");
        }
        return this.negative !== 0 ? -ret : ret;
      };
      BN.prototype.toJSON = function toJSON() {
        return this.toString(16);
      };
      BN.prototype.toBuffer = function toBuffer(endian, length) {
        assert(typeof Buffer2 !== "undefined");
        return this.toArrayLike(Buffer2, endian, length);
      };
      BN.prototype.toArray = function toArray(endian, length) {
        return this.toArrayLike(Array, endian, length);
      };
      BN.prototype.toArrayLike = function toArrayLike(ArrayType, endian, length) {
        var byteLength = this.byteLength();
        var reqLength = length || Math.max(1, byteLength);
        assert(byteLength <= reqLength, "byte array longer than desired length");
        assert(reqLength > 0, "Requested array length <= 0");
        this.strip();
        var littleEndian = endian === "le";
        var res = new ArrayType(reqLength);
        var b, i;
        var q = this.clone();
        if (!littleEndian) {
          for (i = 0; i < reqLength - byteLength; i++) {
            res[i] = 0;
          }
          for (i = 0; !q.isZero(); i++) {
            b = q.andln(255);
            q.iushrn(8);
            res[reqLength - i - 1] = b;
          }
        } else {
          for (i = 0; !q.isZero(); i++) {
            b = q.andln(255);
            q.iushrn(8);
            res[i] = b;
          }
          for (; i < reqLength; i++) {
            res[i] = 0;
          }
        }
        return res;
      };
      if (Math.clz32) {
        BN.prototype._countBits = function _countBits(w) {
          return 32 - Math.clz32(w);
        };
      } else {
        BN.prototype._countBits = function _countBits(w) {
          var t = w;
          var r = 0;
          if (t >= 4096) {
            r += 13;
            t >>>= 13;
          }
          if (t >= 64) {
            r += 7;
            t >>>= 7;
          }
          if (t >= 8) {
            r += 4;
            t >>>= 4;
          }
          if (t >= 2) {
            r += 2;
            t >>>= 2;
          }
          return r + t;
        };
      }
      BN.prototype._zeroBits = function _zeroBits(w) {
        if (w === 0) return 26;
        var t = w;
        var r = 0;
        if ((t & 8191) === 0) {
          r += 13;
          t >>>= 13;
        }
        if ((t & 127) === 0) {
          r += 7;
          t >>>= 7;
        }
        if ((t & 15) === 0) {
          r += 4;
          t >>>= 4;
        }
        if ((t & 3) === 0) {
          r += 2;
          t >>>= 2;
        }
        if ((t & 1) === 0) {
          r++;
        }
        return r;
      };
      BN.prototype.bitLength = function bitLength() {
        var w = this.words[this.length - 1];
        var hi = this._countBits(w);
        return (this.length - 1) * 26 + hi;
      };
      function toBitArray(num) {
        var w = new Array(num.bitLength());
        for (var bit = 0; bit < w.length; bit++) {
          var off = bit / 26 | 0;
          var wbit = bit % 26;
          w[bit] = (num.words[off] & 1 << wbit) >>> wbit;
        }
        return w;
      }
      BN.prototype.zeroBits = function zeroBits() {
        if (this.isZero()) return 0;
        var r = 0;
        for (var i = 0; i < this.length; i++) {
          var b = this._zeroBits(this.words[i]);
          r += b;
          if (b !== 26) break;
        }
        return r;
      };
      BN.prototype.byteLength = function byteLength() {
        return Math.ceil(this.bitLength() / 8);
      };
      BN.prototype.toTwos = function toTwos(width) {
        if (this.negative !== 0) {
          return this.abs().inotn(width).iaddn(1);
        }
        return this.clone();
      };
      BN.prototype.fromTwos = function fromTwos(width) {
        if (this.testn(width - 1)) {
          return this.notn(width).iaddn(1).ineg();
        }
        return this.clone();
      };
      BN.prototype.isNeg = function isNeg() {
        return this.negative !== 0;
      };
      BN.prototype.neg = function neg() {
        return this.clone().ineg();
      };
      BN.prototype.ineg = function ineg() {
        if (!this.isZero()) {
          this.negative ^= 1;
        }
        return this;
      };
      BN.prototype.iuor = function iuor(num) {
        while (this.length < num.length) {
          this.words[this.length++] = 0;
        }
        for (var i = 0; i < num.length; i++) {
          this.words[i] = this.words[i] | num.words[i];
        }
        return this.strip();
      };
      BN.prototype.ior = function ior(num) {
        assert((this.negative | num.negative) === 0);
        return this.iuor(num);
      };
      BN.prototype.or = function or(num) {
        if (this.length > num.length) return this.clone().ior(num);
        return num.clone().ior(this);
      };
      BN.prototype.uor = function uor(num) {
        if (this.length > num.length) return this.clone().iuor(num);
        return num.clone().iuor(this);
      };
      BN.prototype.iuand = function iuand(num) {
        var b;
        if (this.length > num.length) {
          b = num;
        } else {
          b = this;
        }
        for (var i = 0; i < b.length; i++) {
          this.words[i] = this.words[i] & num.words[i];
        }
        this.length = b.length;
        return this.strip();
      };
      BN.prototype.iand = function iand(num) {
        assert((this.negative | num.negative) === 0);
        return this.iuand(num);
      };
      BN.prototype.and = function and(num) {
        if (this.length > num.length) return this.clone().iand(num);
        return num.clone().iand(this);
      };
      BN.prototype.uand = function uand(num) {
        if (this.length > num.length) return this.clone().iuand(num);
        return num.clone().iuand(this);
      };
      BN.prototype.iuxor = function iuxor(num) {
        var a;
        var b;
        if (this.length > num.length) {
          a = this;
          b = num;
        } else {
          a = num;
          b = this;
        }
        for (var i = 0; i < b.length; i++) {
          this.words[i] = a.words[i] ^ b.words[i];
        }
        if (this !== a) {
          for (; i < a.length; i++) {
            this.words[i] = a.words[i];
          }
        }
        this.length = a.length;
        return this.strip();
      };
      BN.prototype.ixor = function ixor(num) {
        assert((this.negative | num.negative) === 0);
        return this.iuxor(num);
      };
      BN.prototype.xor = function xor(num) {
        if (this.length > num.length) return this.clone().ixor(num);
        return num.clone().ixor(this);
      };
      BN.prototype.uxor = function uxor(num) {
        if (this.length > num.length) return this.clone().iuxor(num);
        return num.clone().iuxor(this);
      };
      BN.prototype.inotn = function inotn(width) {
        assert(typeof width === "number" && width >= 0);
        var bytesNeeded = Math.ceil(width / 26) | 0;
        var bitsLeft = width % 26;
        this._expand(bytesNeeded);
        if (bitsLeft > 0) {
          bytesNeeded--;
        }
        for (var i = 0; i < bytesNeeded; i++) {
          this.words[i] = ~this.words[i] & 67108863;
        }
        if (bitsLeft > 0) {
          this.words[i] = ~this.words[i] & 67108863 >> 26 - bitsLeft;
          i++;
        }
        for (; i < this.length; i++) {
          this.words[i] = 0;
        }
        return this.strip();
      };
      BN.prototype.notn = function notn(width) {
        return this.clone().inotn(width);
      };
      BN.prototype.setn = function setn(bit, val) {
        assert(typeof bit === "number" && bit >= 0);
        var off = bit / 26 | 0;
        var wbit = bit % 26;
        this._expand(off + 1);
        if (val) {
          this.words[off] = this.words[off] | 1 << wbit;
        } else {
          this.words[off] = this.words[off] & ~(1 << wbit);
        }
        return this.strip();
      };
      BN.prototype.iadd = function iadd(num) {
        var r;
        if (this.negative !== 0 && num.negative === 0) {
          this.negative = 0;
          r = this.isub(num);
          this.negative ^= 1;
          return this._normSign();
        } else if (this.negative === 0 && num.negative !== 0) {
          num.negative = 0;
          r = this.isub(num);
          num.negative = 1;
          return r._normSign();
        }
        var a, b;
        if (this.length > num.length) {
          a = this;
          b = num;
        } else {
          a = num;
          b = this;
        }
        var carry = 0;
        for (var i = 0; i < b.length; i++) {
          r = (a.words[i] | 0) + (b.words[i] | 0) + carry;
          this.words[i] = r & 67108863;
          carry = r >>> 26;
        }
        for (; carry !== 0 && i < a.length; i++) {
          r = (a.words[i] | 0) + carry;
          this.words[i] = r & 67108863;
          carry = r >>> 26;
        }
        this.length = a.length;
        if (carry !== 0) {
          this.words[this.length] = carry;
          this.length++;
        } else if (a !== this) {
          for (; i < a.length; i++) {
            this.words[i] = a.words[i];
          }
        }
        return this;
      };
      BN.prototype.add = function add(num) {
        var res;
        if (num.negative !== 0 && this.negative === 0) {
          num.negative = 0;
          res = this.sub(num);
          num.negative ^= 1;
          return res;
        } else if (num.negative === 0 && this.negative !== 0) {
          this.negative = 0;
          res = num.sub(this);
          this.negative = 1;
          return res;
        }
        if (this.length > num.length) return this.clone().iadd(num);
        return num.clone().iadd(this);
      };
      BN.prototype.isub = function isub(num) {
        if (num.negative !== 0) {
          num.negative = 0;
          var r = this.iadd(num);
          num.negative = 1;
          return r._normSign();
        } else if (this.negative !== 0) {
          this.negative = 0;
          this.iadd(num);
          this.negative = 1;
          return this._normSign();
        }
        var cmp = this.cmp(num);
        if (cmp === 0) {
          this.negative = 0;
          this.length = 1;
          this.words[0] = 0;
          return this;
        }
        var a, b;
        if (cmp > 0) {
          a = this;
          b = num;
        } else {
          a = num;
          b = this;
        }
        var carry = 0;
        for (var i = 0; i < b.length; i++) {
          r = (a.words[i] | 0) - (b.words[i] | 0) + carry;
          carry = r >> 26;
          this.words[i] = r & 67108863;
        }
        for (; carry !== 0 && i < a.length; i++) {
          r = (a.words[i] | 0) + carry;
          carry = r >> 26;
          this.words[i] = r & 67108863;
        }
        if (carry === 0 && i < a.length && a !== this) {
          for (; i < a.length; i++) {
            this.words[i] = a.words[i];
          }
        }
        this.length = Math.max(this.length, i);
        if (a !== this) {
          this.negative = 1;
        }
        return this.strip();
      };
      BN.prototype.sub = function sub(num) {
        return this.clone().isub(num);
      };
      function smallMulTo(self, num, out) {
        out.negative = num.negative ^ self.negative;
        var len = self.length + num.length | 0;
        out.length = len;
        len = len - 1 | 0;
        var a = self.words[0] | 0;
        var b = num.words[0] | 0;
        var r = a * b;
        var lo = r & 67108863;
        var carry = r / 67108864 | 0;
        out.words[0] = lo;
        for (var k = 1; k < len; k++) {
          var ncarry = carry >>> 26;
          var rword = carry & 67108863;
          var maxJ = Math.min(k, num.length - 1);
          for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
            var i = k - j | 0;
            a = self.words[i] | 0;
            b = num.words[j] | 0;
            r = a * b + rword;
            ncarry += r / 67108864 | 0;
            rword = r & 67108863;
          }
          out.words[k] = rword | 0;
          carry = ncarry | 0;
        }
        if (carry !== 0) {
          out.words[k] = carry | 0;
        } else {
          out.length--;
        }
        return out.strip();
      }
      var comb10MulTo = function comb10MulTo2(self, num, out) {
        var a = self.words;
        var b = num.words;
        var o = out.words;
        var c = 0;
        var lo;
        var mid;
        var hi;
        var a0 = a[0] | 0;
        var al0 = a0 & 8191;
        var ah0 = a0 >>> 13;
        var a1 = a[1] | 0;
        var al1 = a1 & 8191;
        var ah1 = a1 >>> 13;
        var a2 = a[2] | 0;
        var al2 = a2 & 8191;
        var ah2 = a2 >>> 13;
        var a3 = a[3] | 0;
        var al3 = a3 & 8191;
        var ah3 = a3 >>> 13;
        var a4 = a[4] | 0;
        var al4 = a4 & 8191;
        var ah4 = a4 >>> 13;
        var a5 = a[5] | 0;
        var al5 = a5 & 8191;
        var ah5 = a5 >>> 13;
        var a6 = a[6] | 0;
        var al6 = a6 & 8191;
        var ah6 = a6 >>> 13;
        var a7 = a[7] | 0;
        var al7 = a7 & 8191;
        var ah7 = a7 >>> 13;
        var a8 = a[8] | 0;
        var al8 = a8 & 8191;
        var ah8 = a8 >>> 13;
        var a9 = a[9] | 0;
        var al9 = a9 & 8191;
        var ah9 = a9 >>> 13;
        var b0 = b[0] | 0;
        var bl0 = b0 & 8191;
        var bh0 = b0 >>> 13;
        var b1 = b[1] | 0;
        var bl1 = b1 & 8191;
        var bh1 = b1 >>> 13;
        var b2 = b[2] | 0;
        var bl2 = b2 & 8191;
        var bh2 = b2 >>> 13;
        var b3 = b[3] | 0;
        var bl3 = b3 & 8191;
        var bh3 = b3 >>> 13;
        var b4 = b[4] | 0;
        var bl4 = b4 & 8191;
        var bh4 = b4 >>> 13;
        var b5 = b[5] | 0;
        var bl5 = b5 & 8191;
        var bh5 = b5 >>> 13;
        var b6 = b[6] | 0;
        var bl6 = b6 & 8191;
        var bh6 = b6 >>> 13;
        var b7 = b[7] | 0;
        var bl7 = b7 & 8191;
        var bh7 = b7 >>> 13;
        var b8 = b[8] | 0;
        var bl8 = b8 & 8191;
        var bh8 = b8 >>> 13;
        var b9 = b[9] | 0;
        var bl9 = b9 & 8191;
        var bh9 = b9 >>> 13;
        out.negative = self.negative ^ num.negative;
        out.length = 19;
        lo = Math.imul(al0, bl0);
        mid = Math.imul(al0, bh0);
        mid = mid + Math.imul(ah0, bl0) | 0;
        hi = Math.imul(ah0, bh0);
        var w0 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w0 >>> 26) | 0;
        w0 &= 67108863;
        lo = Math.imul(al1, bl0);
        mid = Math.imul(al1, bh0);
        mid = mid + Math.imul(ah1, bl0) | 0;
        hi = Math.imul(ah1, bh0);
        lo = lo + Math.imul(al0, bl1) | 0;
        mid = mid + Math.imul(al0, bh1) | 0;
        mid = mid + Math.imul(ah0, bl1) | 0;
        hi = hi + Math.imul(ah0, bh1) | 0;
        var w1 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w1 >>> 26) | 0;
        w1 &= 67108863;
        lo = Math.imul(al2, bl0);
        mid = Math.imul(al2, bh0);
        mid = mid + Math.imul(ah2, bl0) | 0;
        hi = Math.imul(ah2, bh0);
        lo = lo + Math.imul(al1, bl1) | 0;
        mid = mid + Math.imul(al1, bh1) | 0;
        mid = mid + Math.imul(ah1, bl1) | 0;
        hi = hi + Math.imul(ah1, bh1) | 0;
        lo = lo + Math.imul(al0, bl2) | 0;
        mid = mid + Math.imul(al0, bh2) | 0;
        mid = mid + Math.imul(ah0, bl2) | 0;
        hi = hi + Math.imul(ah0, bh2) | 0;
        var w2 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w2 >>> 26) | 0;
        w2 &= 67108863;
        lo = Math.imul(al3, bl0);
        mid = Math.imul(al3, bh0);
        mid = mid + Math.imul(ah3, bl0) | 0;
        hi = Math.imul(ah3, bh0);
        lo = lo + Math.imul(al2, bl1) | 0;
        mid = mid + Math.imul(al2, bh1) | 0;
        mid = mid + Math.imul(ah2, bl1) | 0;
        hi = hi + Math.imul(ah2, bh1) | 0;
        lo = lo + Math.imul(al1, bl2) | 0;
        mid = mid + Math.imul(al1, bh2) | 0;
        mid = mid + Math.imul(ah1, bl2) | 0;
        hi = hi + Math.imul(ah1, bh2) | 0;
        lo = lo + Math.imul(al0, bl3) | 0;
        mid = mid + Math.imul(al0, bh3) | 0;
        mid = mid + Math.imul(ah0, bl3) | 0;
        hi = hi + Math.imul(ah0, bh3) | 0;
        var w3 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w3 >>> 26) | 0;
        w3 &= 67108863;
        lo = Math.imul(al4, bl0);
        mid = Math.imul(al4, bh0);
        mid = mid + Math.imul(ah4, bl0) | 0;
        hi = Math.imul(ah4, bh0);
        lo = lo + Math.imul(al3, bl1) | 0;
        mid = mid + Math.imul(al3, bh1) | 0;
        mid = mid + Math.imul(ah3, bl1) | 0;
        hi = hi + Math.imul(ah3, bh1) | 0;
        lo = lo + Math.imul(al2, bl2) | 0;
        mid = mid + Math.imul(al2, bh2) | 0;
        mid = mid + Math.imul(ah2, bl2) | 0;
        hi = hi + Math.imul(ah2, bh2) | 0;
        lo = lo + Math.imul(al1, bl3) | 0;
        mid = mid + Math.imul(al1, bh3) | 0;
        mid = mid + Math.imul(ah1, bl3) | 0;
        hi = hi + Math.imul(ah1, bh3) | 0;
        lo = lo + Math.imul(al0, bl4) | 0;
        mid = mid + Math.imul(al0, bh4) | 0;
        mid = mid + Math.imul(ah0, bl4) | 0;
        hi = hi + Math.imul(ah0, bh4) | 0;
        var w4 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w4 >>> 26) | 0;
        w4 &= 67108863;
        lo = Math.imul(al5, bl0);
        mid = Math.imul(al5, bh0);
        mid = mid + Math.imul(ah5, bl0) | 0;
        hi = Math.imul(ah5, bh0);
        lo = lo + Math.imul(al4, bl1) | 0;
        mid = mid + Math.imul(al4, bh1) | 0;
        mid = mid + Math.imul(ah4, bl1) | 0;
        hi = hi + Math.imul(ah4, bh1) | 0;
        lo = lo + Math.imul(al3, bl2) | 0;
        mid = mid + Math.imul(al3, bh2) | 0;
        mid = mid + Math.imul(ah3, bl2) | 0;
        hi = hi + Math.imul(ah3, bh2) | 0;
        lo = lo + Math.imul(al2, bl3) | 0;
        mid = mid + Math.imul(al2, bh3) | 0;
        mid = mid + Math.imul(ah2, bl3) | 0;
        hi = hi + Math.imul(ah2, bh3) | 0;
        lo = lo + Math.imul(al1, bl4) | 0;
        mid = mid + Math.imul(al1, bh4) | 0;
        mid = mid + Math.imul(ah1, bl4) | 0;
        hi = hi + Math.imul(ah1, bh4) | 0;
        lo = lo + Math.imul(al0, bl5) | 0;
        mid = mid + Math.imul(al0, bh5) | 0;
        mid = mid + Math.imul(ah0, bl5) | 0;
        hi = hi + Math.imul(ah0, bh5) | 0;
        var w5 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w5 >>> 26) | 0;
        w5 &= 67108863;
        lo = Math.imul(al6, bl0);
        mid = Math.imul(al6, bh0);
        mid = mid + Math.imul(ah6, bl0) | 0;
        hi = Math.imul(ah6, bh0);
        lo = lo + Math.imul(al5, bl1) | 0;
        mid = mid + Math.imul(al5, bh1) | 0;
        mid = mid + Math.imul(ah5, bl1) | 0;
        hi = hi + Math.imul(ah5, bh1) | 0;
        lo = lo + Math.imul(al4, bl2) | 0;
        mid = mid + Math.imul(al4, bh2) | 0;
        mid = mid + Math.imul(ah4, bl2) | 0;
        hi = hi + Math.imul(ah4, bh2) | 0;
        lo = lo + Math.imul(al3, bl3) | 0;
        mid = mid + Math.imul(al3, bh3) | 0;
        mid = mid + Math.imul(ah3, bl3) | 0;
        hi = hi + Math.imul(ah3, bh3) | 0;
        lo = lo + Math.imul(al2, bl4) | 0;
        mid = mid + Math.imul(al2, bh4) | 0;
        mid = mid + Math.imul(ah2, bl4) | 0;
        hi = hi + Math.imul(ah2, bh4) | 0;
        lo = lo + Math.imul(al1, bl5) | 0;
        mid = mid + Math.imul(al1, bh5) | 0;
        mid = mid + Math.imul(ah1, bl5) | 0;
        hi = hi + Math.imul(ah1, bh5) | 0;
        lo = lo + Math.imul(al0, bl6) | 0;
        mid = mid + Math.imul(al0, bh6) | 0;
        mid = mid + Math.imul(ah0, bl6) | 0;
        hi = hi + Math.imul(ah0, bh6) | 0;
        var w6 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w6 >>> 26) | 0;
        w6 &= 67108863;
        lo = Math.imul(al7, bl0);
        mid = Math.imul(al7, bh0);
        mid = mid + Math.imul(ah7, bl0) | 0;
        hi = Math.imul(ah7, bh0);
        lo = lo + Math.imul(al6, bl1) | 0;
        mid = mid + Math.imul(al6, bh1) | 0;
        mid = mid + Math.imul(ah6, bl1) | 0;
        hi = hi + Math.imul(ah6, bh1) | 0;
        lo = lo + Math.imul(al5, bl2) | 0;
        mid = mid + Math.imul(al5, bh2) | 0;
        mid = mid + Math.imul(ah5, bl2) | 0;
        hi = hi + Math.imul(ah5, bh2) | 0;
        lo = lo + Math.imul(al4, bl3) | 0;
        mid = mid + Math.imul(al4, bh3) | 0;
        mid = mid + Math.imul(ah4, bl3) | 0;
        hi = hi + Math.imul(ah4, bh3) | 0;
        lo = lo + Math.imul(al3, bl4) | 0;
        mid = mid + Math.imul(al3, bh4) | 0;
        mid = mid + Math.imul(ah3, bl4) | 0;
        hi = hi + Math.imul(ah3, bh4) | 0;
        lo = lo + Math.imul(al2, bl5) | 0;
        mid = mid + Math.imul(al2, bh5) | 0;
        mid = mid + Math.imul(ah2, bl5) | 0;
        hi = hi + Math.imul(ah2, bh5) | 0;
        lo = lo + Math.imul(al1, bl6) | 0;
        mid = mid + Math.imul(al1, bh6) | 0;
        mid = mid + Math.imul(ah1, bl6) | 0;
        hi = hi + Math.imul(ah1, bh6) | 0;
        lo = lo + Math.imul(al0, bl7) | 0;
        mid = mid + Math.imul(al0, bh7) | 0;
        mid = mid + Math.imul(ah0, bl7) | 0;
        hi = hi + Math.imul(ah0, bh7) | 0;
        var w7 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w7 >>> 26) | 0;
        w7 &= 67108863;
        lo = Math.imul(al8, bl0);
        mid = Math.imul(al8, bh0);
        mid = mid + Math.imul(ah8, bl0) | 0;
        hi = Math.imul(ah8, bh0);
        lo = lo + Math.imul(al7, bl1) | 0;
        mid = mid + Math.imul(al7, bh1) | 0;
        mid = mid + Math.imul(ah7, bl1) | 0;
        hi = hi + Math.imul(ah7, bh1) | 0;
        lo = lo + Math.imul(al6, bl2) | 0;
        mid = mid + Math.imul(al6, bh2) | 0;
        mid = mid + Math.imul(ah6, bl2) | 0;
        hi = hi + Math.imul(ah6, bh2) | 0;
        lo = lo + Math.imul(al5, bl3) | 0;
        mid = mid + Math.imul(al5, bh3) | 0;
        mid = mid + Math.imul(ah5, bl3) | 0;
        hi = hi + Math.imul(ah5, bh3) | 0;
        lo = lo + Math.imul(al4, bl4) | 0;
        mid = mid + Math.imul(al4, bh4) | 0;
        mid = mid + Math.imul(ah4, bl4) | 0;
        hi = hi + Math.imul(ah4, bh4) | 0;
        lo = lo + Math.imul(al3, bl5) | 0;
        mid = mid + Math.imul(al3, bh5) | 0;
        mid = mid + Math.imul(ah3, bl5) | 0;
        hi = hi + Math.imul(ah3, bh5) | 0;
        lo = lo + Math.imul(al2, bl6) | 0;
        mid = mid + Math.imul(al2, bh6) | 0;
        mid = mid + Math.imul(ah2, bl6) | 0;
        hi = hi + Math.imul(ah2, bh6) | 0;
        lo = lo + Math.imul(al1, bl7) | 0;
        mid = mid + Math.imul(al1, bh7) | 0;
        mid = mid + Math.imul(ah1, bl7) | 0;
        hi = hi + Math.imul(ah1, bh7) | 0;
        lo = lo + Math.imul(al0, bl8) | 0;
        mid = mid + Math.imul(al0, bh8) | 0;
        mid = mid + Math.imul(ah0, bl8) | 0;
        hi = hi + Math.imul(ah0, bh8) | 0;
        var w8 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w8 >>> 26) | 0;
        w8 &= 67108863;
        lo = Math.imul(al9, bl0);
        mid = Math.imul(al9, bh0);
        mid = mid + Math.imul(ah9, bl0) | 0;
        hi = Math.imul(ah9, bh0);
        lo = lo + Math.imul(al8, bl1) | 0;
        mid = mid + Math.imul(al8, bh1) | 0;
        mid = mid + Math.imul(ah8, bl1) | 0;
        hi = hi + Math.imul(ah8, bh1) | 0;
        lo = lo + Math.imul(al7, bl2) | 0;
        mid = mid + Math.imul(al7, bh2) | 0;
        mid = mid + Math.imul(ah7, bl2) | 0;
        hi = hi + Math.imul(ah7, bh2) | 0;
        lo = lo + Math.imul(al6, bl3) | 0;
        mid = mid + Math.imul(al6, bh3) | 0;
        mid = mid + Math.imul(ah6, bl3) | 0;
        hi = hi + Math.imul(ah6, bh3) | 0;
        lo = lo + Math.imul(al5, bl4) | 0;
        mid = mid + Math.imul(al5, bh4) | 0;
        mid = mid + Math.imul(ah5, bl4) | 0;
        hi = hi + Math.imul(ah5, bh4) | 0;
        lo = lo + Math.imul(al4, bl5) | 0;
        mid = mid + Math.imul(al4, bh5) | 0;
        mid = mid + Math.imul(ah4, bl5) | 0;
        hi = hi + Math.imul(ah4, bh5) | 0;
        lo = lo + Math.imul(al3, bl6) | 0;
        mid = mid + Math.imul(al3, bh6) | 0;
        mid = mid + Math.imul(ah3, bl6) | 0;
        hi = hi + Math.imul(ah3, bh6) | 0;
        lo = lo + Math.imul(al2, bl7) | 0;
        mid = mid + Math.imul(al2, bh7) | 0;
        mid = mid + Math.imul(ah2, bl7) | 0;
        hi = hi + Math.imul(ah2, bh7) | 0;
        lo = lo + Math.imul(al1, bl8) | 0;
        mid = mid + Math.imul(al1, bh8) | 0;
        mid = mid + Math.imul(ah1, bl8) | 0;
        hi = hi + Math.imul(ah1, bh8) | 0;
        lo = lo + Math.imul(al0, bl9) | 0;
        mid = mid + Math.imul(al0, bh9) | 0;
        mid = mid + Math.imul(ah0, bl9) | 0;
        hi = hi + Math.imul(ah0, bh9) | 0;
        var w9 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w9 >>> 26) | 0;
        w9 &= 67108863;
        lo = Math.imul(al9, bl1);
        mid = Math.imul(al9, bh1);
        mid = mid + Math.imul(ah9, bl1) | 0;
        hi = Math.imul(ah9, bh1);
        lo = lo + Math.imul(al8, bl2) | 0;
        mid = mid + Math.imul(al8, bh2) | 0;
        mid = mid + Math.imul(ah8, bl2) | 0;
        hi = hi + Math.imul(ah8, bh2) | 0;
        lo = lo + Math.imul(al7, bl3) | 0;
        mid = mid + Math.imul(al7, bh3) | 0;
        mid = mid + Math.imul(ah7, bl3) | 0;
        hi = hi + Math.imul(ah7, bh3) | 0;
        lo = lo + Math.imul(al6, bl4) | 0;
        mid = mid + Math.imul(al6, bh4) | 0;
        mid = mid + Math.imul(ah6, bl4) | 0;
        hi = hi + Math.imul(ah6, bh4) | 0;
        lo = lo + Math.imul(al5, bl5) | 0;
        mid = mid + Math.imul(al5, bh5) | 0;
        mid = mid + Math.imul(ah5, bl5) | 0;
        hi = hi + Math.imul(ah5, bh5) | 0;
        lo = lo + Math.imul(al4, bl6) | 0;
        mid = mid + Math.imul(al4, bh6) | 0;
        mid = mid + Math.imul(ah4, bl6) | 0;
        hi = hi + Math.imul(ah4, bh6) | 0;
        lo = lo + Math.imul(al3, bl7) | 0;
        mid = mid + Math.imul(al3, bh7) | 0;
        mid = mid + Math.imul(ah3, bl7) | 0;
        hi = hi + Math.imul(ah3, bh7) | 0;
        lo = lo + Math.imul(al2, bl8) | 0;
        mid = mid + Math.imul(al2, bh8) | 0;
        mid = mid + Math.imul(ah2, bl8) | 0;
        hi = hi + Math.imul(ah2, bh8) | 0;
        lo = lo + Math.imul(al1, bl9) | 0;
        mid = mid + Math.imul(al1, bh9) | 0;
        mid = mid + Math.imul(ah1, bl9) | 0;
        hi = hi + Math.imul(ah1, bh9) | 0;
        var w10 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w10 >>> 26) | 0;
        w10 &= 67108863;
        lo = Math.imul(al9, bl2);
        mid = Math.imul(al9, bh2);
        mid = mid + Math.imul(ah9, bl2) | 0;
        hi = Math.imul(ah9, bh2);
        lo = lo + Math.imul(al8, bl3) | 0;
        mid = mid + Math.imul(al8, bh3) | 0;
        mid = mid + Math.imul(ah8, bl3) | 0;
        hi = hi + Math.imul(ah8, bh3) | 0;
        lo = lo + Math.imul(al7, bl4) | 0;
        mid = mid + Math.imul(al7, bh4) | 0;
        mid = mid + Math.imul(ah7, bl4) | 0;
        hi = hi + Math.imul(ah7, bh4) | 0;
        lo = lo + Math.imul(al6, bl5) | 0;
        mid = mid + Math.imul(al6, bh5) | 0;
        mid = mid + Math.imul(ah6, bl5) | 0;
        hi = hi + Math.imul(ah6, bh5) | 0;
        lo = lo + Math.imul(al5, bl6) | 0;
        mid = mid + Math.imul(al5, bh6) | 0;
        mid = mid + Math.imul(ah5, bl6) | 0;
        hi = hi + Math.imul(ah5, bh6) | 0;
        lo = lo + Math.imul(al4, bl7) | 0;
        mid = mid + Math.imul(al4, bh7) | 0;
        mid = mid + Math.imul(ah4, bl7) | 0;
        hi = hi + Math.imul(ah4, bh7) | 0;
        lo = lo + Math.imul(al3, bl8) | 0;
        mid = mid + Math.imul(al3, bh8) | 0;
        mid = mid + Math.imul(ah3, bl8) | 0;
        hi = hi + Math.imul(ah3, bh8) | 0;
        lo = lo + Math.imul(al2, bl9) | 0;
        mid = mid + Math.imul(al2, bh9) | 0;
        mid = mid + Math.imul(ah2, bl9) | 0;
        hi = hi + Math.imul(ah2, bh9) | 0;
        var w11 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w11 >>> 26) | 0;
        w11 &= 67108863;
        lo = Math.imul(al9, bl3);
        mid = Math.imul(al9, bh3);
        mid = mid + Math.imul(ah9, bl3) | 0;
        hi = Math.imul(ah9, bh3);
        lo = lo + Math.imul(al8, bl4) | 0;
        mid = mid + Math.imul(al8, bh4) | 0;
        mid = mid + Math.imul(ah8, bl4) | 0;
        hi = hi + Math.imul(ah8, bh4) | 0;
        lo = lo + Math.imul(al7, bl5) | 0;
        mid = mid + Math.imul(al7, bh5) | 0;
        mid = mid + Math.imul(ah7, bl5) | 0;
        hi = hi + Math.imul(ah7, bh5) | 0;
        lo = lo + Math.imul(al6, bl6) | 0;
        mid = mid + Math.imul(al6, bh6) | 0;
        mid = mid + Math.imul(ah6, bl6) | 0;
        hi = hi + Math.imul(ah6, bh6) | 0;
        lo = lo + Math.imul(al5, bl7) | 0;
        mid = mid + Math.imul(al5, bh7) | 0;
        mid = mid + Math.imul(ah5, bl7) | 0;
        hi = hi + Math.imul(ah5, bh7) | 0;
        lo = lo + Math.imul(al4, bl8) | 0;
        mid = mid + Math.imul(al4, bh8) | 0;
        mid = mid + Math.imul(ah4, bl8) | 0;
        hi = hi + Math.imul(ah4, bh8) | 0;
        lo = lo + Math.imul(al3, bl9) | 0;
        mid = mid + Math.imul(al3, bh9) | 0;
        mid = mid + Math.imul(ah3, bl9) | 0;
        hi = hi + Math.imul(ah3, bh9) | 0;
        var w12 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w12 >>> 26) | 0;
        w12 &= 67108863;
        lo = Math.imul(al9, bl4);
        mid = Math.imul(al9, bh4);
        mid = mid + Math.imul(ah9, bl4) | 0;
        hi = Math.imul(ah9, bh4);
        lo = lo + Math.imul(al8, bl5) | 0;
        mid = mid + Math.imul(al8, bh5) | 0;
        mid = mid + Math.imul(ah8, bl5) | 0;
        hi = hi + Math.imul(ah8, bh5) | 0;
        lo = lo + Math.imul(al7, bl6) | 0;
        mid = mid + Math.imul(al7, bh6) | 0;
        mid = mid + Math.imul(ah7, bl6) | 0;
        hi = hi + Math.imul(ah7, bh6) | 0;
        lo = lo + Math.imul(al6, bl7) | 0;
        mid = mid + Math.imul(al6, bh7) | 0;
        mid = mid + Math.imul(ah6, bl7) | 0;
        hi = hi + Math.imul(ah6, bh7) | 0;
        lo = lo + Math.imul(al5, bl8) | 0;
        mid = mid + Math.imul(al5, bh8) | 0;
        mid = mid + Math.imul(ah5, bl8) | 0;
        hi = hi + Math.imul(ah5, bh8) | 0;
        lo = lo + Math.imul(al4, bl9) | 0;
        mid = mid + Math.imul(al4, bh9) | 0;
        mid = mid + Math.imul(ah4, bl9) | 0;
        hi = hi + Math.imul(ah4, bh9) | 0;
        var w13 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w13 >>> 26) | 0;
        w13 &= 67108863;
        lo = Math.imul(al9, bl5);
        mid = Math.imul(al9, bh5);
        mid = mid + Math.imul(ah9, bl5) | 0;
        hi = Math.imul(ah9, bh5);
        lo = lo + Math.imul(al8, bl6) | 0;
        mid = mid + Math.imul(al8, bh6) | 0;
        mid = mid + Math.imul(ah8, bl6) | 0;
        hi = hi + Math.imul(ah8, bh6) | 0;
        lo = lo + Math.imul(al7, bl7) | 0;
        mid = mid + Math.imul(al7, bh7) | 0;
        mid = mid + Math.imul(ah7, bl7) | 0;
        hi = hi + Math.imul(ah7, bh7) | 0;
        lo = lo + Math.imul(al6, bl8) | 0;
        mid = mid + Math.imul(al6, bh8) | 0;
        mid = mid + Math.imul(ah6, bl8) | 0;
        hi = hi + Math.imul(ah6, bh8) | 0;
        lo = lo + Math.imul(al5, bl9) | 0;
        mid = mid + Math.imul(al5, bh9) | 0;
        mid = mid + Math.imul(ah5, bl9) | 0;
        hi = hi + Math.imul(ah5, bh9) | 0;
        var w14 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w14 >>> 26) | 0;
        w14 &= 67108863;
        lo = Math.imul(al9, bl6);
        mid = Math.imul(al9, bh6);
        mid = mid + Math.imul(ah9, bl6) | 0;
        hi = Math.imul(ah9, bh6);
        lo = lo + Math.imul(al8, bl7) | 0;
        mid = mid + Math.imul(al8, bh7) | 0;
        mid = mid + Math.imul(ah8, bl7) | 0;
        hi = hi + Math.imul(ah8, bh7) | 0;
        lo = lo + Math.imul(al7, bl8) | 0;
        mid = mid + Math.imul(al7, bh8) | 0;
        mid = mid + Math.imul(ah7, bl8) | 0;
        hi = hi + Math.imul(ah7, bh8) | 0;
        lo = lo + Math.imul(al6, bl9) | 0;
        mid = mid + Math.imul(al6, bh9) | 0;
        mid = mid + Math.imul(ah6, bl9) | 0;
        hi = hi + Math.imul(ah6, bh9) | 0;
        var w15 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w15 >>> 26) | 0;
        w15 &= 67108863;
        lo = Math.imul(al9, bl7);
        mid = Math.imul(al9, bh7);
        mid = mid + Math.imul(ah9, bl7) | 0;
        hi = Math.imul(ah9, bh7);
        lo = lo + Math.imul(al8, bl8) | 0;
        mid = mid + Math.imul(al8, bh8) | 0;
        mid = mid + Math.imul(ah8, bl8) | 0;
        hi = hi + Math.imul(ah8, bh8) | 0;
        lo = lo + Math.imul(al7, bl9) | 0;
        mid = mid + Math.imul(al7, bh9) | 0;
        mid = mid + Math.imul(ah7, bl9) | 0;
        hi = hi + Math.imul(ah7, bh9) | 0;
        var w16 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w16 >>> 26) | 0;
        w16 &= 67108863;
        lo = Math.imul(al9, bl8);
        mid = Math.imul(al9, bh8);
        mid = mid + Math.imul(ah9, bl8) | 0;
        hi = Math.imul(ah9, bh8);
        lo = lo + Math.imul(al8, bl9) | 0;
        mid = mid + Math.imul(al8, bh9) | 0;
        mid = mid + Math.imul(ah8, bl9) | 0;
        hi = hi + Math.imul(ah8, bh9) | 0;
        var w17 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w17 >>> 26) | 0;
        w17 &= 67108863;
        lo = Math.imul(al9, bl9);
        mid = Math.imul(al9, bh9);
        mid = mid + Math.imul(ah9, bl9) | 0;
        hi = Math.imul(ah9, bh9);
        var w18 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w18 >>> 26) | 0;
        w18 &= 67108863;
        o[0] = w0;
        o[1] = w1;
        o[2] = w2;
        o[3] = w3;
        o[4] = w4;
        o[5] = w5;
        o[6] = w6;
        o[7] = w7;
        o[8] = w8;
        o[9] = w9;
        o[10] = w10;
        o[11] = w11;
        o[12] = w12;
        o[13] = w13;
        o[14] = w14;
        o[15] = w15;
        o[16] = w16;
        o[17] = w17;
        o[18] = w18;
        if (c !== 0) {
          o[19] = c;
          out.length++;
        }
        return out;
      };
      if (!Math.imul) {
        comb10MulTo = smallMulTo;
      }
      function bigMulTo(self, num, out) {
        out.negative = num.negative ^ self.negative;
        out.length = self.length + num.length;
        var carry = 0;
        var hncarry = 0;
        for (var k = 0; k < out.length - 1; k++) {
          var ncarry = hncarry;
          hncarry = 0;
          var rword = carry & 67108863;
          var maxJ = Math.min(k, num.length - 1);
          for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
            var i = k - j;
            var a = self.words[i] | 0;
            var b = num.words[j] | 0;
            var r = a * b;
            var lo = r & 67108863;
            ncarry = ncarry + (r / 67108864 | 0) | 0;
            lo = lo + rword | 0;
            rword = lo & 67108863;
            ncarry = ncarry + (lo >>> 26) | 0;
            hncarry += ncarry >>> 26;
            ncarry &= 67108863;
          }
          out.words[k] = rword;
          carry = ncarry;
          ncarry = hncarry;
        }
        if (carry !== 0) {
          out.words[k] = carry;
        } else {
          out.length--;
        }
        return out.strip();
      }
      function jumboMulTo(self, num, out) {
        var fftm = new FFTM();
        return fftm.mulp(self, num, out);
      }
      BN.prototype.mulTo = function mulTo(num, out) {
        var res;
        var len = this.length + num.length;
        if (this.length === 10 && num.length === 10) {
          res = comb10MulTo(this, num, out);
        } else if (len < 63) {
          res = smallMulTo(this, num, out);
        } else if (len < 1024) {
          res = bigMulTo(this, num, out);
        } else {
          res = jumboMulTo(this, num, out);
        }
        return res;
      };
      function FFTM(x, y) {
        this.x = x;
        this.y = y;
      }
      FFTM.prototype.makeRBT = function makeRBT(N) {
        var t = new Array(N);
        var l = BN.prototype._countBits(N) - 1;
        for (var i = 0; i < N; i++) {
          t[i] = this.revBin(i, l, N);
        }
        return t;
      };
      FFTM.prototype.revBin = function revBin(x, l, N) {
        if (x === 0 || x === N - 1) return x;
        var rb = 0;
        for (var i = 0; i < l; i++) {
          rb |= (x & 1) << l - i - 1;
          x >>= 1;
        }
        return rb;
      };
      FFTM.prototype.permute = function permute(rbt, rws, iws, rtws, itws, N) {
        for (var i = 0; i < N; i++) {
          rtws[i] = rws[rbt[i]];
          itws[i] = iws[rbt[i]];
        }
      };
      FFTM.prototype.transform = function transform(rws, iws, rtws, itws, N, rbt) {
        this.permute(rbt, rws, iws, rtws, itws, N);
        for (var s = 1; s < N; s <<= 1) {
          var l = s << 1;
          var rtwdf = Math.cos(2 * Math.PI / l);
          var itwdf = Math.sin(2 * Math.PI / l);
          for (var p = 0; p < N; p += l) {
            var rtwdf_ = rtwdf;
            var itwdf_ = itwdf;
            for (var j = 0; j < s; j++) {
              var re = rtws[p + j];
              var ie = itws[p + j];
              var ro = rtws[p + j + s];
              var io = itws[p + j + s];
              var rx = rtwdf_ * ro - itwdf_ * io;
              io = rtwdf_ * io + itwdf_ * ro;
              ro = rx;
              rtws[p + j] = re + ro;
              itws[p + j] = ie + io;
              rtws[p + j + s] = re - ro;
              itws[p + j + s] = ie - io;
              if (j !== l) {
                rx = rtwdf * rtwdf_ - itwdf * itwdf_;
                itwdf_ = rtwdf * itwdf_ + itwdf * rtwdf_;
                rtwdf_ = rx;
              }
            }
          }
        }
      };
      FFTM.prototype.guessLen13b = function guessLen13b(n, m) {
        var N = Math.max(m, n) | 1;
        var odd = N & 1;
        var i = 0;
        for (N = N / 2 | 0; N; N = N >>> 1) {
          i++;
        }
        return 1 << i + 1 + odd;
      };
      FFTM.prototype.conjugate = function conjugate(rws, iws, N) {
        if (N <= 1) return;
        for (var i = 0; i < N / 2; i++) {
          var t = rws[i];
          rws[i] = rws[N - i - 1];
          rws[N - i - 1] = t;
          t = iws[i];
          iws[i] = -iws[N - i - 1];
          iws[N - i - 1] = -t;
        }
      };
      FFTM.prototype.normalize13b = function normalize13b(ws, N) {
        var carry = 0;
        for (var i = 0; i < N / 2; i++) {
          var w = Math.round(ws[2 * i + 1] / N) * 8192 + Math.round(ws[2 * i] / N) + carry;
          ws[i] = w & 67108863;
          if (w < 67108864) {
            carry = 0;
          } else {
            carry = w / 67108864 | 0;
          }
        }
        return ws;
      };
      FFTM.prototype.convert13b = function convert13b(ws, len, rws, N) {
        var carry = 0;
        for (var i = 0; i < len; i++) {
          carry = carry + (ws[i] | 0);
          rws[2 * i] = carry & 8191;
          carry = carry >>> 13;
          rws[2 * i + 1] = carry & 8191;
          carry = carry >>> 13;
        }
        for (i = 2 * len; i < N; ++i) {
          rws[i] = 0;
        }
        assert(carry === 0);
        assert((carry & ~8191) === 0);
      };
      FFTM.prototype.stub = function stub(N) {
        var ph = new Array(N);
        for (var i = 0; i < N; i++) {
          ph[i] = 0;
        }
        return ph;
      };
      FFTM.prototype.mulp = function mulp(x, y, out) {
        var N = 2 * this.guessLen13b(x.length, y.length);
        var rbt = this.makeRBT(N);
        var _ = this.stub(N);
        var rws = new Array(N);
        var rwst = new Array(N);
        var iwst = new Array(N);
        var nrws = new Array(N);
        var nrwst = new Array(N);
        var niwst = new Array(N);
        var rmws = out.words;
        rmws.length = N;
        this.convert13b(x.words, x.length, rws, N);
        this.convert13b(y.words, y.length, nrws, N);
        this.transform(rws, _, rwst, iwst, N, rbt);
        this.transform(nrws, _, nrwst, niwst, N, rbt);
        for (var i = 0; i < N; i++) {
          var rx = rwst[i] * nrwst[i] - iwst[i] * niwst[i];
          iwst[i] = rwst[i] * niwst[i] + iwst[i] * nrwst[i];
          rwst[i] = rx;
        }
        this.conjugate(rwst, iwst, N);
        this.transform(rwst, iwst, rmws, _, N, rbt);
        this.conjugate(rmws, _, N);
        this.normalize13b(rmws, N);
        out.negative = x.negative ^ y.negative;
        out.length = x.length + y.length;
        return out.strip();
      };
      BN.prototype.mul = function mul(num) {
        var out = new BN(null);
        out.words = new Array(this.length + num.length);
        return this.mulTo(num, out);
      };
      BN.prototype.mulf = function mulf(num) {
        var out = new BN(null);
        out.words = new Array(this.length + num.length);
        return jumboMulTo(this, num, out);
      };
      BN.prototype.imul = function imul(num) {
        return this.clone().mulTo(num, this);
      };
      BN.prototype.imuln = function imuln(num) {
        assert(typeof num === "number");
        assert(num < 67108864);
        var carry = 0;
        for (var i = 0; i < this.length; i++) {
          var w = (this.words[i] | 0) * num;
          var lo = (w & 67108863) + (carry & 67108863);
          carry >>= 26;
          carry += w / 67108864 | 0;
          carry += lo >>> 26;
          this.words[i] = lo & 67108863;
        }
        if (carry !== 0) {
          this.words[i] = carry;
          this.length++;
        }
        if (num === 0) {
          this.length = 1;
          this._normSign();
        }
        return this;
      };
      BN.prototype.muln = function muln(num) {
        return this.clone().imuln(num);
      };
      BN.prototype.sqr = function sqr() {
        return this.mul(this);
      };
      BN.prototype.isqr = function isqr() {
        return this.imul(this.clone());
      };
      BN.prototype.pow = function pow(num) {
        var w = toBitArray(num);
        if (w.length === 0) return new BN(1);
        var res = this;
        for (var i = 0; i < w.length; i++, res = res.sqr()) {
          if (w[i] !== 0) break;
        }
        if (++i < w.length) {
          for (var q = res.sqr(); i < w.length; i++, q = q.sqr()) {
            if (w[i] === 0) continue;
            res = res.mul(q);
          }
        }
        return res;
      };
      BN.prototype.iushln = function iushln(bits) {
        assert(typeof bits === "number" && bits >= 0);
        var r = bits % 26;
        var s = (bits - r) / 26;
        var carryMask = 67108863 >>> 26 - r << 26 - r;
        var i;
        if (r !== 0) {
          var carry = 0;
          for (i = 0; i < this.length; i++) {
            var newCarry = this.words[i] & carryMask;
            var c = (this.words[i] | 0) - newCarry << r;
            this.words[i] = c | carry;
            carry = newCarry >>> 26 - r;
          }
          if (carry) {
            this.words[i] = carry;
            this.length++;
          }
        }
        if (s !== 0) {
          for (i = this.length - 1; i >= 0; i--) {
            this.words[i + s] = this.words[i];
          }
          for (i = 0; i < s; i++) {
            this.words[i] = 0;
          }
          this.length += s;
        }
        return this.strip();
      };
      BN.prototype.ishln = function ishln(bits) {
        assert(this.negative === 0);
        return this.iushln(bits);
      };
      BN.prototype.iushrn = function iushrn(bits, hint, extended) {
        assert(typeof bits === "number" && bits >= 0);
        var h;
        if (hint) {
          h = (hint - hint % 26) / 26;
        } else {
          h = 0;
        }
        var r = bits % 26;
        var s = Math.min((bits - r) / 26, this.length);
        var mask = 67108863 ^ 67108863 >>> r << r;
        var maskedWords = extended;
        h -= s;
        h = Math.max(0, h);
        if (maskedWords) {
          for (var i = 0; i < s; i++) {
            maskedWords.words[i] = this.words[i];
          }
          maskedWords.length = s;
        }
        if (s === 0) {
        } else if (this.length > s) {
          this.length -= s;
          for (i = 0; i < this.length; i++) {
            this.words[i] = this.words[i + s];
          }
        } else {
          this.words[0] = 0;
          this.length = 1;
        }
        var carry = 0;
        for (i = this.length - 1; i >= 0 && (carry !== 0 || i >= h); i--) {
          var word = this.words[i] | 0;
          this.words[i] = carry << 26 - r | word >>> r;
          carry = word & mask;
        }
        if (maskedWords && carry !== 0) {
          maskedWords.words[maskedWords.length++] = carry;
        }
        if (this.length === 0) {
          this.words[0] = 0;
          this.length = 1;
        }
        return this.strip();
      };
      BN.prototype.ishrn = function ishrn(bits, hint, extended) {
        assert(this.negative === 0);
        return this.iushrn(bits, hint, extended);
      };
      BN.prototype.shln = function shln(bits) {
        return this.clone().ishln(bits);
      };
      BN.prototype.ushln = function ushln(bits) {
        return this.clone().iushln(bits);
      };
      BN.prototype.shrn = function shrn(bits) {
        return this.clone().ishrn(bits);
      };
      BN.prototype.ushrn = function ushrn(bits) {
        return this.clone().iushrn(bits);
      };
      BN.prototype.testn = function testn(bit) {
        assert(typeof bit === "number" && bit >= 0);
        var r = bit % 26;
        var s = (bit - r) / 26;
        var q = 1 << r;
        if (this.length <= s) return false;
        var w = this.words[s];
        return !!(w & q);
      };
      BN.prototype.imaskn = function imaskn(bits) {
        assert(typeof bits === "number" && bits >= 0);
        var r = bits % 26;
        var s = (bits - r) / 26;
        assert(this.negative === 0, "imaskn works only with positive numbers");
        if (this.length <= s) {
          return this;
        }
        if (r !== 0) {
          s++;
        }
        this.length = Math.min(s, this.length);
        if (r !== 0) {
          var mask = 67108863 ^ 67108863 >>> r << r;
          this.words[this.length - 1] &= mask;
        }
        if (this.length === 0) {
          this.words[0] = 0;
          this.length = 1;
        }
        return this.strip();
      };
      BN.prototype.maskn = function maskn(bits) {
        return this.clone().imaskn(bits);
      };
      BN.prototype.iaddn = function iaddn(num) {
        assert(typeof num === "number");
        assert(num < 67108864);
        if (num < 0) return this.isubn(-num);
        if (this.negative !== 0) {
          if (this.length === 1 && (this.words[0] | 0) < num) {
            this.words[0] = num - (this.words[0] | 0);
            this.negative = 0;
            return this;
          }
          this.negative = 0;
          this.isubn(num);
          this.negative = 1;
          return this;
        }
        return this._iaddn(num);
      };
      BN.prototype._iaddn = function _iaddn(num) {
        this.words[0] += num;
        for (var i = 0; i < this.length && this.words[i] >= 67108864; i++) {
          this.words[i] -= 67108864;
          if (i === this.length - 1) {
            this.words[i + 1] = 1;
          } else {
            this.words[i + 1]++;
          }
        }
        this.length = Math.max(this.length, i + 1);
        return this;
      };
      BN.prototype.isubn = function isubn(num) {
        assert(typeof num === "number");
        assert(num < 67108864);
        if (num < 0) return this.iaddn(-num);
        if (this.negative !== 0) {
          this.negative = 0;
          this.iaddn(num);
          this.negative = 1;
          return this;
        }
        this.words[0] -= num;
        if (this.length === 1 && this.words[0] < 0) {
          this.words[0] = -this.words[0];
          this.negative = 1;
        } else {
          for (var i = 0; i < this.length && this.words[i] < 0; i++) {
            this.words[i] += 67108864;
            this.words[i + 1] -= 1;
          }
        }
        return this.strip();
      };
      BN.prototype.addn = function addn(num) {
        return this.clone().iaddn(num);
      };
      BN.prototype.subn = function subn(num) {
        return this.clone().isubn(num);
      };
      BN.prototype.iabs = function iabs() {
        this.negative = 0;
        return this;
      };
      BN.prototype.abs = function abs() {
        return this.clone().iabs();
      };
      BN.prototype._ishlnsubmul = function _ishlnsubmul(num, mul, shift) {
        var len = num.length + shift;
        var i;
        this._expand(len);
        var w;
        var carry = 0;
        for (i = 0; i < num.length; i++) {
          w = (this.words[i + shift] | 0) + carry;
          var right = (num.words[i] | 0) * mul;
          w -= right & 67108863;
          carry = (w >> 26) - (right / 67108864 | 0);
          this.words[i + shift] = w & 67108863;
        }
        for (; i < this.length - shift; i++) {
          w = (this.words[i + shift] | 0) + carry;
          carry = w >> 26;
          this.words[i + shift] = w & 67108863;
        }
        if (carry === 0) return this.strip();
        assert(carry === -1);
        carry = 0;
        for (i = 0; i < this.length; i++) {
          w = -(this.words[i] | 0) + carry;
          carry = w >> 26;
          this.words[i] = w & 67108863;
        }
        this.negative = 1;
        return this.strip();
      };
      BN.prototype._wordDiv = function _wordDiv(num, mode) {
        var shift = this.length - num.length;
        var a = this.clone();
        var b = num;
        var bhi = b.words[b.length - 1] | 0;
        var bhiBits = this._countBits(bhi);
        shift = 26 - bhiBits;
        if (shift !== 0) {
          b = b.ushln(shift);
          a.iushln(shift);
          bhi = b.words[b.length - 1] | 0;
        }
        var m = a.length - b.length;
        var q;
        if (mode !== "mod") {
          q = new BN(null);
          q.length = m + 1;
          q.words = new Array(q.length);
          for (var i = 0; i < q.length; i++) {
            q.words[i] = 0;
          }
        }
        var diff = a.clone()._ishlnsubmul(b, 1, m);
        if (diff.negative === 0) {
          a = diff;
          if (q) {
            q.words[m] = 1;
          }
        }
        for (var j = m - 1; j >= 0; j--) {
          var qj = (a.words[b.length + j] | 0) * 67108864 + (a.words[b.length + j - 1] | 0);
          qj = Math.min(qj / bhi | 0, 67108863);
          a._ishlnsubmul(b, qj, j);
          while (a.negative !== 0) {
            qj--;
            a.negative = 0;
            a._ishlnsubmul(b, 1, j);
            if (!a.isZero()) {
              a.negative ^= 1;
            }
          }
          if (q) {
            q.words[j] = qj;
          }
        }
        if (q) {
          q.strip();
        }
        a.strip();
        if (mode !== "div" && shift !== 0) {
          a.iushrn(shift);
        }
        return {
          div: q || null,
          mod: a
        };
      };
      BN.prototype.divmod = function divmod(num, mode, positive) {
        assert(!num.isZero());
        if (this.isZero()) {
          return {
            div: new BN(0),
            mod: new BN(0)
          };
        }
        var div, mod, res;
        if (this.negative !== 0 && num.negative === 0) {
          res = this.neg().divmod(num, mode);
          if (mode !== "mod") {
            div = res.div.neg();
          }
          if (mode !== "div") {
            mod = res.mod.neg();
            if (positive && mod.negative !== 0) {
              mod.iadd(num);
            }
          }
          return {
            div,
            mod
          };
        }
        if (this.negative === 0 && num.negative !== 0) {
          res = this.divmod(num.neg(), mode);
          if (mode !== "mod") {
            div = res.div.neg();
          }
          return {
            div,
            mod: res.mod
          };
        }
        if ((this.negative & num.negative) !== 0) {
          res = this.neg().divmod(num.neg(), mode);
          if (mode !== "div") {
            mod = res.mod.neg();
            if (positive && mod.negative !== 0) {
              mod.isub(num);
            }
          }
          return {
            div: res.div,
            mod
          };
        }
        if (num.length > this.length || this.cmp(num) < 0) {
          return {
            div: new BN(0),
            mod: this
          };
        }
        if (num.length === 1) {
          if (mode === "div") {
            return {
              div: this.divn(num.words[0]),
              mod: null
            };
          }
          if (mode === "mod") {
            return {
              div: null,
              mod: new BN(this.modn(num.words[0]))
            };
          }
          return {
            div: this.divn(num.words[0]),
            mod: new BN(this.modn(num.words[0]))
          };
        }
        return this._wordDiv(num, mode);
      };
      BN.prototype.div = function div(num) {
        return this.divmod(num, "div", false).div;
      };
      BN.prototype.mod = function mod(num) {
        return this.divmod(num, "mod", false).mod;
      };
      BN.prototype.umod = function umod(num) {
        return this.divmod(num, "mod", true).mod;
      };
      BN.prototype.divRound = function divRound(num) {
        var dm = this.divmod(num);
        if (dm.mod.isZero()) return dm.div;
        var mod = dm.mod.abs();
        var half = num.abs().iushrn(1);
        var r2 = num.words[0] & 1;
        var cmp = mod.cmp(half);
        if (cmp < 0 || r2 === 1 && cmp === 0) return dm.div;
        var up = new BN(1);
        up.negative = this.negative ^ num.negative;
        return dm.div.iadd(up);
      };
      BN.prototype.modn = function modn(num) {
        assert(num <= 67108863);
        var p = (1 << 26) % num;
        var acc = 0;
        for (var i = this.length - 1; i >= 0; i--) {
          acc = (p * acc + (this.words[i] | 0)) % num;
        }
        return acc;
      };
      BN.prototype.idivn = function idivn(num) {
        assert(num <= 67108863);
        var carry = 0;
        for (var i = this.length - 1; i >= 0; i--) {
          var w = (this.words[i] | 0) + carry * 67108864;
          this.words[i] = w / num | 0;
          carry = w % num;
        }
        return this.strip();
      };
      BN.prototype.divn = function divn(num) {
        return this.clone().idivn(num);
      };
      BN.prototype.egcd = function egcd(p) {
        assert(p.negative === 0);
        assert(!p.isZero());
        var x = this;
        var y = p.clone();
        if (x.negative !== 0) {
          x = x.umod(p);
        } else {
          x = x.clone();
        }
        var A = new BN(1);
        var B = new BN(0);
        var C = new BN(0);
        var D = new BN(1);
        var g = 0;
        while (x.isEven() && y.isEven()) {
          x.iushrn(1);
          y.iushrn(1);
          ++g;
        }
        var yp = y.clone();
        var xp = x.clone();
        while (!x.isZero()) {
          for (var i = 0, im = 1; (x.words[0] & im) === 0 && i < 26; ++i, im <<= 1) ;
          if (i > 0) {
            x.iushrn(i);
            while (i-- > 0) {
              if (A.isOdd() || B.isOdd()) {
                A.iadd(yp);
                B.isub(xp);
              }
              A.iushrn(1);
              B.iushrn(1);
            }
          }
          for (var j = 0, jm = 1; (y.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1) ;
          if (j > 0) {
            y.iushrn(j);
            while (j-- > 0) {
              if (C.isOdd() || D.isOdd()) {
                C.iadd(yp);
                D.isub(xp);
              }
              C.iushrn(1);
              D.iushrn(1);
            }
          }
          if (x.cmp(y) >= 0) {
            x.isub(y);
            A.isub(C);
            B.isub(D);
          } else {
            y.isub(x);
            C.isub(A);
            D.isub(B);
          }
        }
        return {
          a: C,
          b: D,
          gcd: y.iushln(g)
        };
      };
      BN.prototype._invmp = function _invmp(p) {
        assert(p.negative === 0);
        assert(!p.isZero());
        var a = this;
        var b = p.clone();
        if (a.negative !== 0) {
          a = a.umod(p);
        } else {
          a = a.clone();
        }
        var x1 = new BN(1);
        var x2 = new BN(0);
        var delta = b.clone();
        while (a.cmpn(1) > 0 && b.cmpn(1) > 0) {
          for (var i = 0, im = 1; (a.words[0] & im) === 0 && i < 26; ++i, im <<= 1) ;
          if (i > 0) {
            a.iushrn(i);
            while (i-- > 0) {
              if (x1.isOdd()) {
                x1.iadd(delta);
              }
              x1.iushrn(1);
            }
          }
          for (var j = 0, jm = 1; (b.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1) ;
          if (j > 0) {
            b.iushrn(j);
            while (j-- > 0) {
              if (x2.isOdd()) {
                x2.iadd(delta);
              }
              x2.iushrn(1);
            }
          }
          if (a.cmp(b) >= 0) {
            a.isub(b);
            x1.isub(x2);
          } else {
            b.isub(a);
            x2.isub(x1);
          }
        }
        var res;
        if (a.cmpn(1) === 0) {
          res = x1;
        } else {
          res = x2;
        }
        if (res.cmpn(0) < 0) {
          res.iadd(p);
        }
        return res;
      };
      BN.prototype.gcd = function gcd(num) {
        if (this.isZero()) return num.abs();
        if (num.isZero()) return this.abs();
        var a = this.clone();
        var b = num.clone();
        a.negative = 0;
        b.negative = 0;
        for (var shift = 0; a.isEven() && b.isEven(); shift++) {
          a.iushrn(1);
          b.iushrn(1);
        }
        do {
          while (a.isEven()) {
            a.iushrn(1);
          }
          while (b.isEven()) {
            b.iushrn(1);
          }
          var r = a.cmp(b);
          if (r < 0) {
            var t = a;
            a = b;
            b = t;
          } else if (r === 0 || b.cmpn(1) === 0) {
            break;
          }
          a.isub(b);
        } while (true);
        return b.iushln(shift);
      };
      BN.prototype.invm = function invm(num) {
        return this.egcd(num).a.umod(num);
      };
      BN.prototype.isEven = function isEven() {
        return (this.words[0] & 1) === 0;
      };
      BN.prototype.isOdd = function isOdd() {
        return (this.words[0] & 1) === 1;
      };
      BN.prototype.andln = function andln(num) {
        return this.words[0] & num;
      };
      BN.prototype.bincn = function bincn(bit) {
        assert(typeof bit === "number");
        var r = bit % 26;
        var s = (bit - r) / 26;
        var q = 1 << r;
        if (this.length <= s) {
          this._expand(s + 1);
          this.words[s] |= q;
          return this;
        }
        var carry = q;
        for (var i = s; carry !== 0 && i < this.length; i++) {
          var w = this.words[i] | 0;
          w += carry;
          carry = w >>> 26;
          w &= 67108863;
          this.words[i] = w;
        }
        if (carry !== 0) {
          this.words[i] = carry;
          this.length++;
        }
        return this;
      };
      BN.prototype.isZero = function isZero() {
        return this.length === 1 && this.words[0] === 0;
      };
      BN.prototype.cmpn = function cmpn(num) {
        var negative = num < 0;
        if (this.negative !== 0 && !negative) return -1;
        if (this.negative === 0 && negative) return 1;
        this.strip();
        var res;
        if (this.length > 1) {
          res = 1;
        } else {
          if (negative) {
            num = -num;
          }
          assert(num <= 67108863, "Number is too big");
          var w = this.words[0] | 0;
          res = w === num ? 0 : w < num ? -1 : 1;
        }
        if (this.negative !== 0) return -res | 0;
        return res;
      };
      BN.prototype.cmp = function cmp(num) {
        if (this.negative !== 0 && num.negative === 0) return -1;
        if (this.negative === 0 && num.negative !== 0) return 1;
        var res = this.ucmp(num);
        if (this.negative !== 0) return -res | 0;
        return res;
      };
      BN.prototype.ucmp = function ucmp(num) {
        if (this.length > num.length) return 1;
        if (this.length < num.length) return -1;
        var res = 0;
        for (var i = this.length - 1; i >= 0; i--) {
          var a = this.words[i] | 0;
          var b = num.words[i] | 0;
          if (a === b) continue;
          if (a < b) {
            res = -1;
          } else if (a > b) {
            res = 1;
          }
          break;
        }
        return res;
      };
      BN.prototype.gtn = function gtn(num) {
        return this.cmpn(num) === 1;
      };
      BN.prototype.gt = function gt(num) {
        return this.cmp(num) === 1;
      };
      BN.prototype.gten = function gten(num) {
        return this.cmpn(num) >= 0;
      };
      BN.prototype.gte = function gte(num) {
        return this.cmp(num) >= 0;
      };
      BN.prototype.ltn = function ltn(num) {
        return this.cmpn(num) === -1;
      };
      BN.prototype.lt = function lt(num) {
        return this.cmp(num) === -1;
      };
      BN.prototype.lten = function lten(num) {
        return this.cmpn(num) <= 0;
      };
      BN.prototype.lte = function lte(num) {
        return this.cmp(num) <= 0;
      };
      BN.prototype.eqn = function eqn(num) {
        return this.cmpn(num) === 0;
      };
      BN.prototype.eq = function eq(num) {
        return this.cmp(num) === 0;
      };
      BN.red = function red(num) {
        return new Red(num);
      };
      BN.prototype.toRed = function toRed(ctx) {
        assert(!this.red, "Already a number in reduction context");
        assert(this.negative === 0, "red works only with positives");
        return ctx.convertTo(this)._forceRed(ctx);
      };
      BN.prototype.fromRed = function fromRed() {
        assert(this.red, "fromRed works only with numbers in reduction context");
        return this.red.convertFrom(this);
      };
      BN.prototype._forceRed = function _forceRed(ctx) {
        this.red = ctx;
        return this;
      };
      BN.prototype.forceRed = function forceRed(ctx) {
        assert(!this.red, "Already a number in reduction context");
        return this._forceRed(ctx);
      };
      BN.prototype.redAdd = function redAdd(num) {
        assert(this.red, "redAdd works only with red numbers");
        return this.red.add(this, num);
      };
      BN.prototype.redIAdd = function redIAdd(num) {
        assert(this.red, "redIAdd works only with red numbers");
        return this.red.iadd(this, num);
      };
      BN.prototype.redSub = function redSub(num) {
        assert(this.red, "redSub works only with red numbers");
        return this.red.sub(this, num);
      };
      BN.prototype.redISub = function redISub(num) {
        assert(this.red, "redISub works only with red numbers");
        return this.red.isub(this, num);
      };
      BN.prototype.redShl = function redShl(num) {
        assert(this.red, "redShl works only with red numbers");
        return this.red.shl(this, num);
      };
      BN.prototype.redMul = function redMul(num) {
        assert(this.red, "redMul works only with red numbers");
        this.red._verify2(this, num);
        return this.red.mul(this, num);
      };
      BN.prototype.redIMul = function redIMul(num) {
        assert(this.red, "redMul works only with red numbers");
        this.red._verify2(this, num);
        return this.red.imul(this, num);
      };
      BN.prototype.redSqr = function redSqr() {
        assert(this.red, "redSqr works only with red numbers");
        this.red._verify1(this);
        return this.red.sqr(this);
      };
      BN.prototype.redISqr = function redISqr() {
        assert(this.red, "redISqr works only with red numbers");
        this.red._verify1(this);
        return this.red.isqr(this);
      };
      BN.prototype.redSqrt = function redSqrt() {
        assert(this.red, "redSqrt works only with red numbers");
        this.red._verify1(this);
        return this.red.sqrt(this);
      };
      BN.prototype.redInvm = function redInvm() {
        assert(this.red, "redInvm works only with red numbers");
        this.red._verify1(this);
        return this.red.invm(this);
      };
      BN.prototype.redNeg = function redNeg() {
        assert(this.red, "redNeg works only with red numbers");
        this.red._verify1(this);
        return this.red.neg(this);
      };
      BN.prototype.redPow = function redPow(num) {
        assert(this.red && !num.red, "redPow(normalNum)");
        this.red._verify1(this);
        return this.red.pow(this, num);
      };
      var primes = {
        k256: null,
        p224: null,
        p192: null,
        p25519: null
      };
      function MPrime(name, p) {
        this.name = name;
        this.p = new BN(p, 16);
        this.n = this.p.bitLength();
        this.k = new BN(1).iushln(this.n).isub(this.p);
        this.tmp = this._tmp();
      }
      MPrime.prototype._tmp = function _tmp() {
        var tmp = new BN(null);
        tmp.words = new Array(Math.ceil(this.n / 13));
        return tmp;
      };
      MPrime.prototype.ireduce = function ireduce(num) {
        var r = num;
        var rlen;
        do {
          this.split(r, this.tmp);
          r = this.imulK(r);
          r = r.iadd(this.tmp);
          rlen = r.bitLength();
        } while (rlen > this.n);
        var cmp = rlen < this.n ? -1 : r.ucmp(this.p);
        if (cmp === 0) {
          r.words[0] = 0;
          r.length = 1;
        } else if (cmp > 0) {
          r.isub(this.p);
        } else {
          if (r.strip !== void 0) {
            r.strip();
          } else {
            r._strip();
          }
        }
        return r;
      };
      MPrime.prototype.split = function split(input, out) {
        input.iushrn(this.n, 0, out);
      };
      MPrime.prototype.imulK = function imulK(num) {
        return num.imul(this.k);
      };
      function K256() {
        MPrime.call(
          this,
          "k256",
          "ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f"
        );
      }
      inherits(K256, MPrime);
      K256.prototype.split = function split(input, output) {
        var mask = 4194303;
        var outLen = Math.min(input.length, 9);
        for (var i = 0; i < outLen; i++) {
          output.words[i] = input.words[i];
        }
        output.length = outLen;
        if (input.length <= 9) {
          input.words[0] = 0;
          input.length = 1;
          return;
        }
        var prev = input.words[9];
        output.words[output.length++] = prev & mask;
        for (i = 10; i < input.length; i++) {
          var next = input.words[i] | 0;
          input.words[i - 10] = (next & mask) << 4 | prev >>> 22;
          prev = next;
        }
        prev >>>= 22;
        input.words[i - 10] = prev;
        if (prev === 0 && input.length > 10) {
          input.length -= 10;
        } else {
          input.length -= 9;
        }
      };
      K256.prototype.imulK = function imulK(num) {
        num.words[num.length] = 0;
        num.words[num.length + 1] = 0;
        num.length += 2;
        var lo = 0;
        for (var i = 0; i < num.length; i++) {
          var w = num.words[i] | 0;
          lo += w * 977;
          num.words[i] = lo & 67108863;
          lo = w * 64 + (lo / 67108864 | 0);
        }
        if (num.words[num.length - 1] === 0) {
          num.length--;
          if (num.words[num.length - 1] === 0) {
            num.length--;
          }
        }
        return num;
      };
      function P224() {
        MPrime.call(
          this,
          "p224",
          "ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001"
        );
      }
      inherits(P224, MPrime);
      function P192() {
        MPrime.call(
          this,
          "p192",
          "ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff"
        );
      }
      inherits(P192, MPrime);
      function P25519() {
        MPrime.call(
          this,
          "25519",
          "7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed"
        );
      }
      inherits(P25519, MPrime);
      P25519.prototype.imulK = function imulK(num) {
        var carry = 0;
        for (var i = 0; i < num.length; i++) {
          var hi = (num.words[i] | 0) * 19 + carry;
          var lo = hi & 67108863;
          hi >>>= 26;
          num.words[i] = lo;
          carry = hi;
        }
        if (carry !== 0) {
          num.words[num.length++] = carry;
        }
        return num;
      };
      BN._prime = function prime(name) {
        if (primes[name]) return primes[name];
        var prime2;
        if (name === "k256") {
          prime2 = new K256();
        } else if (name === "p224") {
          prime2 = new P224();
        } else if (name === "p192") {
          prime2 = new P192();
        } else if (name === "p25519") {
          prime2 = new P25519();
        } else {
          throw new Error("Unknown prime " + name);
        }
        primes[name] = prime2;
        return prime2;
      };
      function Red(m) {
        if (typeof m === "string") {
          var prime = BN._prime(m);
          this.m = prime.p;
          this.prime = prime;
        } else {
          assert(m.gtn(1), "modulus must be greater than 1");
          this.m = m;
          this.prime = null;
        }
      }
      Red.prototype._verify1 = function _verify1(a) {
        assert(a.negative === 0, "red works only with positives");
        assert(a.red, "red works only with red numbers");
      };
      Red.prototype._verify2 = function _verify2(a, b) {
        assert((a.negative | b.negative) === 0, "red works only with positives");
        assert(
          a.red && a.red === b.red,
          "red works only with red numbers"
        );
      };
      Red.prototype.imod = function imod(a) {
        if (this.prime) return this.prime.ireduce(a)._forceRed(this);
        return a.umod(this.m)._forceRed(this);
      };
      Red.prototype.neg = function neg(a) {
        if (a.isZero()) {
          return a.clone();
        }
        return this.m.sub(a)._forceRed(this);
      };
      Red.prototype.add = function add(a, b) {
        this._verify2(a, b);
        var res = a.add(b);
        if (res.cmp(this.m) >= 0) {
          res.isub(this.m);
        }
        return res._forceRed(this);
      };
      Red.prototype.iadd = function iadd(a, b) {
        this._verify2(a, b);
        var res = a.iadd(b);
        if (res.cmp(this.m) >= 0) {
          res.isub(this.m);
        }
        return res;
      };
      Red.prototype.sub = function sub(a, b) {
        this._verify2(a, b);
        var res = a.sub(b);
        if (res.cmpn(0) < 0) {
          res.iadd(this.m);
        }
        return res._forceRed(this);
      };
      Red.prototype.isub = function isub(a, b) {
        this._verify2(a, b);
        var res = a.isub(b);
        if (res.cmpn(0) < 0) {
          res.iadd(this.m);
        }
        return res;
      };
      Red.prototype.shl = function shl(a, num) {
        this._verify1(a);
        return this.imod(a.ushln(num));
      };
      Red.prototype.imul = function imul(a, b) {
        this._verify2(a, b);
        return this.imod(a.imul(b));
      };
      Red.prototype.mul = function mul(a, b) {
        this._verify2(a, b);
        return this.imod(a.mul(b));
      };
      Red.prototype.isqr = function isqr(a) {
        return this.imul(a, a.clone());
      };
      Red.prototype.sqr = function sqr(a) {
        return this.mul(a, a);
      };
      Red.prototype.sqrt = function sqrt(a) {
        if (a.isZero()) return a.clone();
        var mod3 = this.m.andln(3);
        assert(mod3 % 2 === 1);
        if (mod3 === 3) {
          var pow = this.m.add(new BN(1)).iushrn(2);
          return this.pow(a, pow);
        }
        var q = this.m.subn(1);
        var s = 0;
        while (!q.isZero() && q.andln(1) === 0) {
          s++;
          q.iushrn(1);
        }
        assert(!q.isZero());
        var one = new BN(1).toRed(this);
        var nOne = one.redNeg();
        var lpow = this.m.subn(1).iushrn(1);
        var z = this.m.bitLength();
        z = new BN(2 * z * z).toRed(this);
        while (this.pow(z, lpow).cmp(nOne) !== 0) {
          z.redIAdd(nOne);
        }
        var c = this.pow(z, q);
        var r = this.pow(a, q.addn(1).iushrn(1));
        var t = this.pow(a, q);
        var m = s;
        while (t.cmp(one) !== 0) {
          var tmp = t;
          for (var i = 0; tmp.cmp(one) !== 0; i++) {
            tmp = tmp.redSqr();
          }
          assert(i < m);
          var b = this.pow(c, new BN(1).iushln(m - i - 1));
          r = r.redMul(b);
          c = b.redSqr();
          t = t.redMul(c);
          m = i;
        }
        return r;
      };
      Red.prototype.invm = function invm(a) {
        var inv = a._invmp(this.m);
        if (inv.negative !== 0) {
          inv.negative = 0;
          return this.imod(inv).redNeg();
        } else {
          return this.imod(inv);
        }
      };
      Red.prototype.pow = function pow(a, num) {
        if (num.isZero()) return new BN(1).toRed(this);
        if (num.cmpn(1) === 0) return a.clone();
        var windowSize = 4;
        var wnd = new Array(1 << windowSize);
        wnd[0] = new BN(1).toRed(this);
        wnd[1] = a;
        for (var i = 2; i < wnd.length; i++) {
          wnd[i] = this.mul(wnd[i - 1], a);
        }
        var res = wnd[0];
        var current = 0;
        var currentLen = 0;
        var start = num.bitLength() % 26;
        if (start === 0) {
          start = 26;
        }
        for (i = num.length - 1; i >= 0; i--) {
          var word = num.words[i];
          for (var j = start - 1; j >= 0; j--) {
            var bit = word >> j & 1;
            if (res !== wnd[0]) {
              res = this.sqr(res);
            }
            if (bit === 0 && current === 0) {
              currentLen = 0;
              continue;
            }
            current <<= 1;
            current |= bit;
            currentLen++;
            if (currentLen !== windowSize && (i !== 0 || j !== 0)) continue;
            res = this.mul(res, wnd[current]);
            currentLen = 0;
            current = 0;
          }
          start = 26;
        }
        return res;
      };
      Red.prototype.convertTo = function convertTo(num) {
        var r = num.umod(this.m);
        return r === num ? r.clone() : r;
      };
      Red.prototype.convertFrom = function convertFrom(num) {
        var res = num.clone();
        res.red = null;
        return res;
      };
      BN.mont = function mont(num) {
        return new Mont(num);
      };
      function Mont(m) {
        Red.call(this, m);
        this.shift = this.m.bitLength();
        if (this.shift % 26 !== 0) {
          this.shift += 26 - this.shift % 26;
        }
        this.r = new BN(1).iushln(this.shift);
        this.r2 = this.imod(this.r.sqr());
        this.rinv = this.r._invmp(this.m);
        this.minv = this.rinv.mul(this.r).isubn(1).div(this.m);
        this.minv = this.minv.umod(this.r);
        this.minv = this.r.sub(this.minv);
      }
      inherits(Mont, Red);
      Mont.prototype.convertTo = function convertTo(num) {
        return this.imod(num.ushln(this.shift));
      };
      Mont.prototype.convertFrom = function convertFrom(num) {
        var r = this.imod(num.mul(this.rinv));
        r.red = null;
        return r;
      };
      Mont.prototype.imul = function imul(a, b) {
        if (a.isZero() || b.isZero()) {
          a.words[0] = 0;
          a.length = 1;
          return a;
        }
        var t = a.imul(b);
        var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
        var u = t.isub(c).iushrn(this.shift);
        var res = u;
        if (u.cmp(this.m) >= 0) {
          res = u.isub(this.m);
        } else if (u.cmpn(0) < 0) {
          res = u.iadd(this.m);
        }
        return res._forceRed(this);
      };
      Mont.prototype.mul = function mul(a, b) {
        if (a.isZero() || b.isZero()) return new BN(0)._forceRed(this);
        var t = a.mul(b);
        var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
        var u = t.isub(c).iushrn(this.shift);
        var res = u;
        if (u.cmp(this.m) >= 0) {
          res = u.isub(this.m);
        } else if (u.cmpn(0) < 0) {
          res = u.iadd(this.m);
        }
        return res._forceRed(this);
      };
      Mont.prototype.invm = function invm(a) {
        var res = this.imod(a._invmp(this.m).mul(this.r2));
        return res._forceRed(this);
      };
    })(typeof module === "undefined" || module, exports);
  }
});

// node_modules/.pnpm/inherits@2.0.4/node_modules/inherits/inherits_browser.js
var require_inherits_browser = __commonJS({
  "node_modules/.pnpm/inherits@2.0.4/node_modules/inherits/inherits_browser.js"(exports, module) {
    if (typeof Object.create === "function") {
      module.exports = function inherits(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          ctor.prototype = Object.create(superCtor.prototype, {
            constructor: {
              value: ctor,
              enumerable: false,
              writable: true,
              configurable: true
            }
          });
        }
      };
    } else {
      module.exports = function inherits(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          var TempCtor = function() {
          };
          TempCtor.prototype = superCtor.prototype;
          ctor.prototype = new TempCtor();
          ctor.prototype.constructor = ctor;
        }
      };
    }
  }
});

// node_modules/.pnpm/inherits@2.0.4/node_modules/inherits/inherits.js
var require_inherits = __commonJS({
  "node_modules/.pnpm/inherits@2.0.4/node_modules/inherits/inherits.js"(exports, module) {
    try {
      util = __require("util");
      if (typeof util.inherits !== "function") throw "";
      module.exports = util.inherits;
    } catch (e) {
      module.exports = require_inherits_browser();
    }
    var util;
  }
});

// node_modules/.pnpm/safer-buffer@2.1.2/node_modules/safer-buffer/safer.js
var require_safer = __commonJS({
  "node_modules/.pnpm/safer-buffer@2.1.2/node_modules/safer-buffer/safer.js"(exports, module) {
    "use strict";
    var buffer = __require("buffer");
    var Buffer2 = buffer.Buffer;
    var safer = {};
    var key;
    for (key in buffer) {
      if (!buffer.hasOwnProperty(key)) continue;
      if (key === "SlowBuffer" || key === "Buffer") continue;
      safer[key] = buffer[key];
    }
    var Safer = safer.Buffer = {};
    for (key in Buffer2) {
      if (!Buffer2.hasOwnProperty(key)) continue;
      if (key === "allocUnsafe" || key === "allocUnsafeSlow") continue;
      Safer[key] = Buffer2[key];
    }
    safer.Buffer.prototype = Buffer2.prototype;
    if (!Safer.from || Safer.from === Uint8Array.from) {
      Safer.from = function(value, encodingOrOffset, length) {
        if (typeof value === "number") {
          throw new TypeError('The "value" argument must not be of type number. Received type ' + typeof value);
        }
        if (value && typeof value.length === "undefined") {
          throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value);
        }
        return Buffer2(value, encodingOrOffset, length);
      };
    }
    if (!Safer.alloc) {
      Safer.alloc = function(size, fill, encoding) {
        if (typeof size !== "number") {
          throw new TypeError('The "size" argument must be of type number. Received type ' + typeof size);
        }
        if (size < 0 || size >= 2 * (1 << 30)) {
          throw new RangeError('The value "' + size + '" is invalid for option "size"');
        }
        var buf = Buffer2(size);
        if (!fill || fill.length === 0) {
          buf.fill(0);
        } else if (typeof encoding === "string") {
          buf.fill(fill, encoding);
        } else {
          buf.fill(fill);
        }
        return buf;
      };
    }
    if (!safer.kStringMaxLength) {
      try {
        safer.kStringMaxLength = process.binding("buffer").kStringMaxLength;
      } catch (e) {
      }
    }
    if (!safer.constants) {
      safer.constants = {
        MAX_LENGTH: safer.kMaxLength
      };
      if (safer.kStringMaxLength) {
        safer.constants.MAX_STRING_LENGTH = safer.kStringMaxLength;
      }
    }
    module.exports = safer;
  }
});

// node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/base/reporter.js
var require_reporter = __commonJS({
  "node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/base/reporter.js"(exports) {
    "use strict";
    var inherits = require_inherits();
    function Reporter(options) {
      this._reporterState = {
        obj: null,
        path: [],
        options: options || {},
        errors: []
      };
    }
    exports.Reporter = Reporter;
    Reporter.prototype.isError = function isError(obj) {
      return obj instanceof ReporterError;
    };
    Reporter.prototype.save = function save() {
      const state = this._reporterState;
      return { obj: state.obj, pathLen: state.path.length };
    };
    Reporter.prototype.restore = function restore(data) {
      const state = this._reporterState;
      state.obj = data.obj;
      state.path = state.path.slice(0, data.pathLen);
    };
    Reporter.prototype.enterKey = function enterKey(key) {
      return this._reporterState.path.push(key);
    };
    Reporter.prototype.exitKey = function exitKey(index) {
      const state = this._reporterState;
      state.path = state.path.slice(0, index - 1);
    };
    Reporter.prototype.leaveKey = function leaveKey(index, key, value) {
      const state = this._reporterState;
      this.exitKey(index);
      if (state.obj !== null)
        state.obj[key] = value;
    };
    Reporter.prototype.path = function path() {
      return this._reporterState.path.join("/");
    };
    Reporter.prototype.enterObject = function enterObject() {
      const state = this._reporterState;
      const prev = state.obj;
      state.obj = {};
      return prev;
    };
    Reporter.prototype.leaveObject = function leaveObject(prev) {
      const state = this._reporterState;
      const now = state.obj;
      state.obj = prev;
      return now;
    };
    Reporter.prototype.error = function error(msg) {
      let err;
      const state = this._reporterState;
      const inherited = msg instanceof ReporterError;
      if (inherited) {
        err = msg;
      } else {
        err = new ReporterError(state.path.map(function(elem) {
          return "[" + JSON.stringify(elem) + "]";
        }).join(""), msg.message || msg, msg.stack);
      }
      if (!state.options.partial)
        throw err;
      if (!inherited)
        state.errors.push(err);
      return err;
    };
    Reporter.prototype.wrapResult = function wrapResult(result) {
      const state = this._reporterState;
      if (!state.options.partial)
        return result;
      return {
        result: this.isError(result) ? null : result,
        errors: state.errors
      };
    };
    function ReporterError(path, msg) {
      this.path = path;
      this.rethrow(msg);
    }
    inherits(ReporterError, Error);
    ReporterError.prototype.rethrow = function rethrow(msg) {
      this.message = msg + " at: " + (this.path || "(shallow)");
      if (Error.captureStackTrace)
        Error.captureStackTrace(this, ReporterError);
      if (!this.stack) {
        try {
          throw new Error(this.message);
        } catch (e) {
          this.stack = e.stack;
        }
      }
      return this;
    };
  }
});

// node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/base/buffer.js
var require_buffer = __commonJS({
  "node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/base/buffer.js"(exports) {
    "use strict";
    var inherits = require_inherits();
    var Reporter = require_reporter().Reporter;
    var Buffer2 = require_safer().Buffer;
    function DecoderBuffer(base, options) {
      Reporter.call(this, options);
      if (!Buffer2.isBuffer(base)) {
        this.error("Input not Buffer");
        return;
      }
      this.base = base;
      this.offset = 0;
      this.length = base.length;
    }
    inherits(DecoderBuffer, Reporter);
    exports.DecoderBuffer = DecoderBuffer;
    DecoderBuffer.isDecoderBuffer = function isDecoderBuffer(data) {
      if (data instanceof DecoderBuffer) {
        return true;
      }
      const isCompatible = typeof data === "object" && Buffer2.isBuffer(data.base) && data.constructor.name === "DecoderBuffer" && typeof data.offset === "number" && typeof data.length === "number" && typeof data.save === "function" && typeof data.restore === "function" && typeof data.isEmpty === "function" && typeof data.readUInt8 === "function" && typeof data.skip === "function" && typeof data.raw === "function";
      return isCompatible;
    };
    DecoderBuffer.prototype.save = function save() {
      return { offset: this.offset, reporter: Reporter.prototype.save.call(this) };
    };
    DecoderBuffer.prototype.restore = function restore(save) {
      const res = new DecoderBuffer(this.base);
      res.offset = save.offset;
      res.length = this.offset;
      this.offset = save.offset;
      Reporter.prototype.restore.call(this, save.reporter);
      return res;
    };
    DecoderBuffer.prototype.isEmpty = function isEmpty() {
      return this.offset === this.length;
    };
    DecoderBuffer.prototype.readUInt8 = function readUInt8(fail) {
      if (this.offset + 1 <= this.length)
        return this.base.readUInt8(this.offset++, true);
      else
        return this.error(fail || "DecoderBuffer overrun");
    };
    DecoderBuffer.prototype.skip = function skip(bytes, fail) {
      if (!(this.offset + bytes <= this.length))
        return this.error(fail || "DecoderBuffer overrun");
      const res = new DecoderBuffer(this.base);
      res._reporterState = this._reporterState;
      res.offset = this.offset;
      res.length = this.offset + bytes;
      this.offset += bytes;
      return res;
    };
    DecoderBuffer.prototype.raw = function raw2(save) {
      return this.base.slice(save ? save.offset : this.offset, this.length);
    };
    function EncoderBuffer(value, reporter) {
      if (Array.isArray(value)) {
        this.length = 0;
        this.value = value.map(function(item) {
          if (!EncoderBuffer.isEncoderBuffer(item))
            item = new EncoderBuffer(item, reporter);
          this.length += item.length;
          return item;
        }, this);
      } else if (typeof value === "number") {
        if (!(0 <= value && value <= 255))
          return reporter.error("non-byte EncoderBuffer value");
        this.value = value;
        this.length = 1;
      } else if (typeof value === "string") {
        this.value = value;
        this.length = Buffer2.byteLength(value);
      } else if (Buffer2.isBuffer(value)) {
        this.value = value;
        this.length = value.length;
      } else {
        return reporter.error("Unsupported type: " + typeof value);
      }
    }
    exports.EncoderBuffer = EncoderBuffer;
    EncoderBuffer.isEncoderBuffer = function isEncoderBuffer(data) {
      if (data instanceof EncoderBuffer) {
        return true;
      }
      const isCompatible = typeof data === "object" && data.constructor.name === "EncoderBuffer" && typeof data.length === "number" && typeof data.join === "function";
      return isCompatible;
    };
    EncoderBuffer.prototype.join = function join(out, offset) {
      if (!out)
        out = Buffer2.alloc(this.length);
      if (!offset)
        offset = 0;
      if (this.length === 0)
        return out;
      if (Array.isArray(this.value)) {
        this.value.forEach(function(item) {
          item.join(out, offset);
          offset += item.length;
        });
      } else {
        if (typeof this.value === "number")
          out[offset] = this.value;
        else if (typeof this.value === "string")
          out.write(this.value, offset);
        else if (Buffer2.isBuffer(this.value))
          this.value.copy(out, offset);
        offset += this.length;
      }
      return out;
    };
  }
});

// node_modules/.pnpm/minimalistic-assert@1.0.1/node_modules/minimalistic-assert/index.js
var require_minimalistic_assert = __commonJS({
  "node_modules/.pnpm/minimalistic-assert@1.0.1/node_modules/minimalistic-assert/index.js"(exports, module) {
    module.exports = assert;
    function assert(val, msg) {
      if (!val)
        throw new Error(msg || "Assertion failed");
    }
    assert.equal = function assertEqual(l, r, msg) {
      if (l != r)
        throw new Error(msg || "Assertion failed: " + l + " != " + r);
    };
  }
});

// node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/base/node.js
var require_node = __commonJS({
  "node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/base/node.js"(exports, module) {
    "use strict";
    var Reporter = require_reporter().Reporter;
    var EncoderBuffer = require_buffer().EncoderBuffer;
    var DecoderBuffer = require_buffer().DecoderBuffer;
    var assert = require_minimalistic_assert();
    var tags = [
      "seq",
      "seqof",
      "set",
      "setof",
      "objid",
      "bool",
      "gentime",
      "utctime",
      "null_",
      "enum",
      "int",
      "objDesc",
      "bitstr",
      "bmpstr",
      "charstr",
      "genstr",
      "graphstr",
      "ia5str",
      "iso646str",
      "numstr",
      "octstr",
      "printstr",
      "t61str",
      "unistr",
      "utf8str",
      "videostr"
    ];
    var methods = [
      "key",
      "obj",
      "use",
      "optional",
      "explicit",
      "implicit",
      "def",
      "choice",
      "any",
      "contains"
    ].concat(tags);
    var overrided = [
      "_peekTag",
      "_decodeTag",
      "_use",
      "_decodeStr",
      "_decodeObjid",
      "_decodeTime",
      "_decodeNull",
      "_decodeInt",
      "_decodeBool",
      "_decodeList",
      "_encodeComposite",
      "_encodeStr",
      "_encodeObjid",
      "_encodeTime",
      "_encodeNull",
      "_encodeInt",
      "_encodeBool"
    ];
    function Node5(enc, parent, name) {
      const state = {};
      this._baseState = state;
      state.name = name;
      state.enc = enc;
      state.parent = parent || null;
      state.children = null;
      state.tag = null;
      state.args = null;
      state.reverseArgs = null;
      state.choice = null;
      state.optional = false;
      state.any = false;
      state.obj = false;
      state.use = null;
      state.useDecoder = null;
      state.key = null;
      state["default"] = null;
      state.explicit = null;
      state.implicit = null;
      state.contains = null;
      if (!state.parent) {
        state.children = [];
        this._wrap();
      }
    }
    module.exports = Node5;
    var stateProps = [
      "enc",
      "parent",
      "children",
      "tag",
      "args",
      "reverseArgs",
      "choice",
      "optional",
      "any",
      "obj",
      "use",
      "alteredUse",
      "key",
      "default",
      "explicit",
      "implicit",
      "contains"
    ];
    Node5.prototype.clone = function clone() {
      const state = this._baseState;
      const cstate = {};
      stateProps.forEach(function(prop) {
        cstate[prop] = state[prop];
      });
      const res = new this.constructor(cstate.parent);
      res._baseState = cstate;
      return res;
    };
    Node5.prototype._wrap = function wrap() {
      const state = this._baseState;
      methods.forEach(function(method) {
        this[method] = function _wrappedMethod() {
          const clone = new this.constructor(this);
          state.children.push(clone);
          return clone[method].apply(clone, arguments);
        };
      }, this);
    };
    Node5.prototype._init = function init2(body) {
      const state = this._baseState;
      assert(state.parent === null);
      body.call(this);
      state.children = state.children.filter(function(child) {
        return child._baseState.parent === this;
      }, this);
      assert.equal(state.children.length, 1, "Root node can have only one child");
    };
    Node5.prototype._useArgs = function useArgs(args) {
      const state = this._baseState;
      const children = args.filter(function(arg) {
        return arg instanceof this.constructor;
      }, this);
      args = args.filter(function(arg) {
        return !(arg instanceof this.constructor);
      }, this);
      if (children.length !== 0) {
        assert(state.children === null);
        state.children = children;
        children.forEach(function(child) {
          child._baseState.parent = this;
        }, this);
      }
      if (args.length !== 0) {
        assert(state.args === null);
        state.args = args;
        state.reverseArgs = args.map(function(arg) {
          if (typeof arg !== "object" || arg.constructor !== Object)
            return arg;
          const res = {};
          Object.keys(arg).forEach(function(key) {
            if (key == (key | 0))
              key |= 0;
            const value = arg[key];
            res[value] = key;
          });
          return res;
        });
      }
    };
    overrided.forEach(function(method) {
      Node5.prototype[method] = function _overrided() {
        const state = this._baseState;
        throw new Error(method + " not implemented for encoding: " + state.enc);
      };
    });
    tags.forEach(function(tag) {
      Node5.prototype[tag] = function _tagMethod() {
        const state = this._baseState;
        const args = Array.prototype.slice.call(arguments);
        assert(state.tag === null);
        state.tag = tag;
        this._useArgs(args);
        return this;
      };
    });
    Node5.prototype.use = function use(item) {
      assert(item);
      const state = this._baseState;
      assert(state.use === null);
      state.use = item;
      return this;
    };
    Node5.prototype.optional = function optional() {
      const state = this._baseState;
      state.optional = true;
      return this;
    };
    Node5.prototype.def = function def(val) {
      const state = this._baseState;
      assert(state["default"] === null);
      state["default"] = val;
      state.optional = true;
      return this;
    };
    Node5.prototype.explicit = function explicit(num) {
      const state = this._baseState;
      assert(state.explicit === null && state.implicit === null);
      state.explicit = num;
      return this;
    };
    Node5.prototype.implicit = function implicit(num) {
      const state = this._baseState;
      assert(state.explicit === null && state.implicit === null);
      state.implicit = num;
      return this;
    };
    Node5.prototype.obj = function obj() {
      const state = this._baseState;
      const args = Array.prototype.slice.call(arguments);
      state.obj = true;
      if (args.length !== 0)
        this._useArgs(args);
      return this;
    };
    Node5.prototype.key = function key(newKey) {
      const state = this._baseState;
      assert(state.key === null);
      state.key = newKey;
      return this;
    };
    Node5.prototype.any = function any() {
      const state = this._baseState;
      state.any = true;
      return this;
    };
    Node5.prototype.choice = function choice(obj) {
      const state = this._baseState;
      assert(state.choice === null);
      state.choice = obj;
      this._useArgs(Object.keys(obj).map(function(key) {
        return obj[key];
      }));
      return this;
    };
    Node5.prototype.contains = function contains(item) {
      const state = this._baseState;
      assert(state.use === null);
      state.contains = item;
      return this;
    };
    Node5.prototype._decode = function decode(input, options) {
      const state = this._baseState;
      if (state.parent === null)
        return input.wrapResult(state.children[0]._decode(input, options));
      let result = state["default"];
      let present = true;
      let prevKey = null;
      if (state.key !== null)
        prevKey = input.enterKey(state.key);
      if (state.optional) {
        let tag = null;
        if (state.explicit !== null)
          tag = state.explicit;
        else if (state.implicit !== null)
          tag = state.implicit;
        else if (state.tag !== null)
          tag = state.tag;
        if (tag === null && !state.any) {
          const save = input.save();
          try {
            if (state.choice === null)
              this._decodeGeneric(state.tag, input, options);
            else
              this._decodeChoice(input, options);
            present = true;
          } catch (e) {
            present = false;
          }
          input.restore(save);
        } else {
          present = this._peekTag(input, tag, state.any);
          if (input.isError(present))
            return present;
        }
      }
      let prevObj;
      if (state.obj && present)
        prevObj = input.enterObject();
      if (present) {
        if (state.explicit !== null) {
          const explicit = this._decodeTag(input, state.explicit);
          if (input.isError(explicit))
            return explicit;
          input = explicit;
        }
        const start = input.offset;
        if (state.use === null && state.choice === null) {
          let save;
          if (state.any)
            save = input.save();
          const body = this._decodeTag(
            input,
            state.implicit !== null ? state.implicit : state.tag,
            state.any
          );
          if (input.isError(body))
            return body;
          if (state.any)
            result = input.raw(save);
          else
            input = body;
        }
        if (options && options.track && state.tag !== null)
          options.track(input.path(), start, input.length, "tagged");
        if (options && options.track && state.tag !== null)
          options.track(input.path(), input.offset, input.length, "content");
        if (state.any) {
        } else if (state.choice === null) {
          result = this._decodeGeneric(state.tag, input, options);
        } else {
          result = this._decodeChoice(input, options);
        }
        if (input.isError(result))
          return result;
        if (!state.any && state.choice === null && state.children !== null) {
          state.children.forEach(function decodeChildren(child) {
            child._decode(input, options);
          });
        }
        if (state.contains && (state.tag === "octstr" || state.tag === "bitstr")) {
          const data = new DecoderBuffer(result);
          result = this._getUse(state.contains, input._reporterState.obj)._decode(data, options);
        }
      }
      if (state.obj && present)
        result = input.leaveObject(prevObj);
      if (state.key !== null && (result !== null || present === true))
        input.leaveKey(prevKey, state.key, result);
      else if (prevKey !== null)
        input.exitKey(prevKey);
      return result;
    };
    Node5.prototype._decodeGeneric = function decodeGeneric(tag, input, options) {
      const state = this._baseState;
      if (tag === "seq" || tag === "set")
        return null;
      if (tag === "seqof" || tag === "setof")
        return this._decodeList(input, tag, state.args[0], options);
      else if (/str$/.test(tag))
        return this._decodeStr(input, tag, options);
      else if (tag === "objid" && state.args)
        return this._decodeObjid(input, state.args[0], state.args[1], options);
      else if (tag === "objid")
        return this._decodeObjid(input, null, null, options);
      else if (tag === "gentime" || tag === "utctime")
        return this._decodeTime(input, tag, options);
      else if (tag === "null_")
        return this._decodeNull(input, options);
      else if (tag === "bool")
        return this._decodeBool(input, options);
      else if (tag === "objDesc")
        return this._decodeStr(input, tag, options);
      else if (tag === "int" || tag === "enum")
        return this._decodeInt(input, state.args && state.args[0], options);
      if (state.use !== null) {
        return this._getUse(state.use, input._reporterState.obj)._decode(input, options);
      } else {
        return input.error("unknown tag: " + tag);
      }
    };
    Node5.prototype._getUse = function _getUse(entity, obj) {
      const state = this._baseState;
      state.useDecoder = this._use(entity, obj);
      assert(state.useDecoder._baseState.parent === null);
      state.useDecoder = state.useDecoder._baseState.children[0];
      if (state.implicit !== state.useDecoder._baseState.implicit) {
        state.useDecoder = state.useDecoder.clone();
        state.useDecoder._baseState.implicit = state.implicit;
      }
      return state.useDecoder;
    };
    Node5.prototype._decodeChoice = function decodeChoice(input, options) {
      const state = this._baseState;
      let result = null;
      let match2 = false;
      Object.keys(state.choice).some(function(key) {
        const save = input.save();
        const node = state.choice[key];
        try {
          const value = node._decode(input, options);
          if (input.isError(value))
            return false;
          result = { type: key, value };
          match2 = true;
        } catch (e) {
          input.restore(save);
          return false;
        }
        return true;
      }, this);
      if (!match2)
        return input.error("Choice not matched");
      return result;
    };
    Node5.prototype._createEncoderBuffer = function createEncoderBuffer(data) {
      return new EncoderBuffer(data, this.reporter);
    };
    Node5.prototype._encode = function encode(data, reporter, parent) {
      const state = this._baseState;
      if (state["default"] !== null && state["default"] === data)
        return;
      const result = this._encodeValue(data, reporter, parent);
      if (result === void 0)
        return;
      if (this._skipDefault(result, reporter, parent))
        return;
      return result;
    };
    Node5.prototype._encodeValue = function encode(data, reporter, parent) {
      const state = this._baseState;
      if (state.parent === null)
        return state.children[0]._encode(data, reporter || new Reporter());
      let result = null;
      this.reporter = reporter;
      if (state.optional && data === void 0) {
        if (state["default"] !== null)
          data = state["default"];
        else
          return;
      }
      let content = null;
      let primitive = false;
      if (state.any) {
        result = this._createEncoderBuffer(data);
      } else if (state.choice) {
        result = this._encodeChoice(data, reporter);
      } else if (state.contains) {
        content = this._getUse(state.contains, parent)._encode(data, reporter);
        primitive = true;
      } else if (state.children) {
        content = state.children.map(function(child) {
          if (child._baseState.tag === "null_")
            return child._encode(null, reporter, data);
          if (child._baseState.key === null)
            return reporter.error("Child should have a key");
          const prevKey = reporter.enterKey(child._baseState.key);
          if (typeof data !== "object")
            return reporter.error("Child expected, but input is not object");
          const res = child._encode(data[child._baseState.key], reporter, data);
          reporter.leaveKey(prevKey);
          return res;
        }, this).filter(function(child) {
          return child;
        });
        content = this._createEncoderBuffer(content);
      } else {
        if (state.tag === "seqof" || state.tag === "setof") {
          if (!(state.args && state.args.length === 1))
            return reporter.error("Too many args for : " + state.tag);
          if (!Array.isArray(data))
            return reporter.error("seqof/setof, but data is not Array");
          const child = this.clone();
          child._baseState.implicit = null;
          content = this._createEncoderBuffer(data.map(function(item) {
            const state2 = this._baseState;
            return this._getUse(state2.args[0], data)._encode(item, reporter);
          }, child));
        } else if (state.use !== null) {
          result = this._getUse(state.use, parent)._encode(data, reporter);
        } else {
          content = this._encodePrimitive(state.tag, data);
          primitive = true;
        }
      }
      if (!state.any && state.choice === null) {
        const tag = state.implicit !== null ? state.implicit : state.tag;
        const cls = state.implicit === null ? "universal" : "context";
        if (tag === null) {
          if (state.use === null)
            reporter.error("Tag could be omitted only for .use()");
        } else {
          if (state.use === null)
            result = this._encodeComposite(tag, primitive, cls, content);
        }
      }
      if (state.explicit !== null)
        result = this._encodeComposite(state.explicit, false, "context", result);
      return result;
    };
    Node5.prototype._encodeChoice = function encodeChoice(data, reporter) {
      const state = this._baseState;
      const node = state.choice[data.type];
      if (!node) {
        assert(
          false,
          data.type + " not found in " + JSON.stringify(Object.keys(state.choice))
        );
      }
      return node._encode(data.value, reporter);
    };
    Node5.prototype._encodePrimitive = function encodePrimitive(tag, data) {
      const state = this._baseState;
      if (/str$/.test(tag))
        return this._encodeStr(data, tag);
      else if (tag === "objid" && state.args)
        return this._encodeObjid(data, state.reverseArgs[0], state.args[1]);
      else if (tag === "objid")
        return this._encodeObjid(data, null, null);
      else if (tag === "gentime" || tag === "utctime")
        return this._encodeTime(data, tag);
      else if (tag === "null_")
        return this._encodeNull();
      else if (tag === "int" || tag === "enum")
        return this._encodeInt(data, state.args && state.reverseArgs[0]);
      else if (tag === "bool")
        return this._encodeBool(data);
      else if (tag === "objDesc")
        return this._encodeStr(data, tag);
      else
        throw new Error("Unsupported tag: " + tag);
    };
    Node5.prototype._isNumstr = function isNumstr(str) {
      return /^[0-9 ]*$/.test(str);
    };
    Node5.prototype._isPrintstr = function isPrintstr(str) {
      return /^[A-Za-z0-9 '()+,-./:=?]*$/.test(str);
    };
  }
});

// node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/constants/der.js
var require_der = __commonJS({
  "node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/constants/der.js"(exports) {
    "use strict";
    function reverse(map) {
      const res = {};
      Object.keys(map).forEach(function(key) {
        if ((key | 0) == key)
          key = key | 0;
        const value = map[key];
        res[value] = key;
      });
      return res;
    }
    exports.tagClass = {
      0: "universal",
      1: "application",
      2: "context",
      3: "private"
    };
    exports.tagClassByName = reverse(exports.tagClass);
    exports.tag = {
      0: "end",
      1: "bool",
      2: "int",
      3: "bitstr",
      4: "octstr",
      5: "null_",
      6: "objid",
      7: "objDesc",
      8: "external",
      9: "real",
      10: "enum",
      11: "embed",
      12: "utf8str",
      13: "relativeOid",
      16: "seq",
      17: "set",
      18: "numstr",
      19: "printstr",
      20: "t61str",
      21: "videostr",
      22: "ia5str",
      23: "utctime",
      24: "gentime",
      25: "graphstr",
      26: "iso646str",
      27: "genstr",
      28: "unistr",
      29: "charstr",
      30: "bmpstr"
    };
    exports.tagByName = reverse(exports.tag);
  }
});

// node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/encoders/der.js
var require_der2 = __commonJS({
  "node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/encoders/der.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var Buffer2 = require_safer().Buffer;
    var Node5 = require_node();
    var der = require_der();
    function DEREncoder(entity) {
      this.enc = "der";
      this.name = entity.name;
      this.entity = entity;
      this.tree = new DERNode();
      this.tree._init(entity.body);
    }
    module.exports = DEREncoder;
    DEREncoder.prototype.encode = function encode(data, reporter) {
      return this.tree._encode(data, reporter).join();
    };
    function DERNode(parent) {
      Node5.call(this, "der", parent);
    }
    inherits(DERNode, Node5);
    DERNode.prototype._encodeComposite = function encodeComposite(tag, primitive, cls, content) {
      const encodedTag = encodeTag(tag, primitive, cls, this.reporter);
      if (content.length < 128) {
        const header2 = Buffer2.alloc(2);
        header2[0] = encodedTag;
        header2[1] = content.length;
        return this._createEncoderBuffer([header2, content]);
      }
      let lenOctets = 1;
      for (let i = content.length; i >= 256; i >>= 8)
        lenOctets++;
      const header = Buffer2.alloc(1 + 1 + lenOctets);
      header[0] = encodedTag;
      header[1] = 128 | lenOctets;
      for (let i = 1 + lenOctets, j = content.length; j > 0; i--, j >>= 8)
        header[i] = j & 255;
      return this._createEncoderBuffer([header, content]);
    };
    DERNode.prototype._encodeStr = function encodeStr(str, tag) {
      if (tag === "bitstr") {
        return this._createEncoderBuffer([str.unused | 0, str.data]);
      } else if (tag === "bmpstr") {
        const buf = Buffer2.alloc(str.length * 2);
        for (let i = 0; i < str.length; i++) {
          buf.writeUInt16BE(str.charCodeAt(i), i * 2);
        }
        return this._createEncoderBuffer(buf);
      } else if (tag === "numstr") {
        if (!this._isNumstr(str)) {
          return this.reporter.error("Encoding of string type: numstr supports only digits and space");
        }
        return this._createEncoderBuffer(str);
      } else if (tag === "printstr") {
        if (!this._isPrintstr(str)) {
          return this.reporter.error("Encoding of string type: printstr supports only latin upper and lower case letters, digits, space, apostrophe, left and rigth parenthesis, plus sign, comma, hyphen, dot, slash, colon, equal sign, question mark");
        }
        return this._createEncoderBuffer(str);
      } else if (/str$/.test(tag)) {
        return this._createEncoderBuffer(str);
      } else if (tag === "objDesc") {
        return this._createEncoderBuffer(str);
      } else {
        return this.reporter.error("Encoding of string type: " + tag + " unsupported");
      }
    };
    DERNode.prototype._encodeObjid = function encodeObjid(id, values, relative) {
      if (typeof id === "string") {
        if (!values)
          return this.reporter.error("string objid given, but no values map found");
        if (!values.hasOwnProperty(id))
          return this.reporter.error("objid not found in values map");
        id = values[id].split(/[\s.]+/g);
        for (let i = 0; i < id.length; i++)
          id[i] |= 0;
      } else if (Array.isArray(id)) {
        id = id.slice();
        for (let i = 0; i < id.length; i++)
          id[i] |= 0;
      }
      if (!Array.isArray(id)) {
        return this.reporter.error("objid() should be either array or string, got: " + JSON.stringify(id));
      }
      if (!relative) {
        if (id[1] >= 40)
          return this.reporter.error("Second objid identifier OOB");
        id.splice(0, 2, id[0] * 40 + id[1]);
      }
      let size = 0;
      for (let i = 0; i < id.length; i++) {
        let ident = id[i];
        for (size++; ident >= 128; ident >>= 7)
          size++;
      }
      const objid = Buffer2.alloc(size);
      let offset = objid.length - 1;
      for (let i = id.length - 1; i >= 0; i--) {
        let ident = id[i];
        objid[offset--] = ident & 127;
        while ((ident >>= 7) > 0)
          objid[offset--] = 128 | ident & 127;
      }
      return this._createEncoderBuffer(objid);
    };
    function two(num) {
      if (num < 10)
        return "0" + num;
      else
        return num;
    }
    DERNode.prototype._encodeTime = function encodeTime(time, tag) {
      let str;
      const date = new Date(time);
      if (tag === "gentime") {
        str = [
          two(date.getUTCFullYear()),
          two(date.getUTCMonth() + 1),
          two(date.getUTCDate()),
          two(date.getUTCHours()),
          two(date.getUTCMinutes()),
          two(date.getUTCSeconds()),
          "Z"
        ].join("");
      } else if (tag === "utctime") {
        str = [
          two(date.getUTCFullYear() % 100),
          two(date.getUTCMonth() + 1),
          two(date.getUTCDate()),
          two(date.getUTCHours()),
          two(date.getUTCMinutes()),
          two(date.getUTCSeconds()),
          "Z"
        ].join("");
      } else {
        this.reporter.error("Encoding " + tag + " time is not supported yet");
      }
      return this._encodeStr(str, "octstr");
    };
    DERNode.prototype._encodeNull = function encodeNull() {
      return this._createEncoderBuffer("");
    };
    DERNode.prototype._encodeInt = function encodeInt(num, values) {
      if (typeof num === "string") {
        if (!values)
          return this.reporter.error("String int or enum given, but no values map");
        if (!values.hasOwnProperty(num)) {
          return this.reporter.error("Values map doesn't contain: " + JSON.stringify(num));
        }
        num = values[num];
      }
      if (typeof num !== "number" && !Buffer2.isBuffer(num)) {
        const numArray = num.toArray();
        if (!num.sign && numArray[0] & 128) {
          numArray.unshift(0);
        }
        num = Buffer2.from(numArray);
      }
      if (Buffer2.isBuffer(num)) {
        let size2 = num.length;
        if (num.length === 0)
          size2++;
        const out2 = Buffer2.alloc(size2);
        num.copy(out2);
        if (num.length === 0)
          out2[0] = 0;
        return this._createEncoderBuffer(out2);
      }
      if (num < 128)
        return this._createEncoderBuffer(num);
      if (num < 256)
        return this._createEncoderBuffer([0, num]);
      let size = 1;
      for (let i = num; i >= 256; i >>= 8)
        size++;
      const out = new Array(size);
      for (let i = out.length - 1; i >= 0; i--) {
        out[i] = num & 255;
        num >>= 8;
      }
      if (out[0] & 128) {
        out.unshift(0);
      }
      return this._createEncoderBuffer(Buffer2.from(out));
    };
    DERNode.prototype._encodeBool = function encodeBool(value) {
      return this._createEncoderBuffer(value ? 255 : 0);
    };
    DERNode.prototype._use = function use(entity, obj) {
      if (typeof entity === "function")
        entity = entity(obj);
      return entity._getEncoder("der").tree;
    };
    DERNode.prototype._skipDefault = function skipDefault(dataBuffer, reporter, parent) {
      const state = this._baseState;
      let i;
      if (state["default"] === null)
        return false;
      const data = dataBuffer.join();
      if (state.defaultBuffer === void 0)
        state.defaultBuffer = this._encodeValue(state["default"], reporter, parent).join();
      if (data.length !== state.defaultBuffer.length)
        return false;
      for (i = 0; i < data.length; i++)
        if (data[i] !== state.defaultBuffer[i])
          return false;
      return true;
    };
    function encodeTag(tag, primitive, cls, reporter) {
      let res;
      if (tag === "seqof")
        tag = "seq";
      else if (tag === "setof")
        tag = "set";
      if (der.tagByName.hasOwnProperty(tag))
        res = der.tagByName[tag];
      else if (typeof tag === "number" && (tag | 0) === tag)
        res = tag;
      else
        return reporter.error("Unknown tag: " + tag);
      if (res >= 31)
        return reporter.error("Multi-octet tag encoding unsupported");
      if (!primitive)
        res |= 32;
      res |= der.tagClassByName[cls || "universal"] << 6;
      return res;
    }
  }
});

// node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/encoders/pem.js
var require_pem = __commonJS({
  "node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/encoders/pem.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var DEREncoder = require_der2();
    function PEMEncoder(entity) {
      DEREncoder.call(this, entity);
      this.enc = "pem";
    }
    inherits(PEMEncoder, DEREncoder);
    module.exports = PEMEncoder;
    PEMEncoder.prototype.encode = function encode(data, options) {
      const buf = DEREncoder.prototype.encode.call(this, data);
      const p = buf.toString("base64");
      const out = ["-----BEGIN " + options.label + "-----"];
      for (let i = 0; i < p.length; i += 64)
        out.push(p.slice(i, i + 64));
      out.push("-----END " + options.label + "-----");
      return out.join("\n");
    };
  }
});

// node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/encoders/index.js
var require_encoders = __commonJS({
  "node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/encoders/index.js"(exports) {
    "use strict";
    var encoders = exports;
    encoders.der = require_der2();
    encoders.pem = require_pem();
  }
});

// node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/decoders/der.js
var require_der3 = __commonJS({
  "node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/decoders/der.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var bignum = require_bn();
    var DecoderBuffer = require_buffer().DecoderBuffer;
    var Node5 = require_node();
    var der = require_der();
    function DERDecoder(entity) {
      this.enc = "der";
      this.name = entity.name;
      this.entity = entity;
      this.tree = new DERNode();
      this.tree._init(entity.body);
    }
    module.exports = DERDecoder;
    DERDecoder.prototype.decode = function decode(data, options) {
      if (!DecoderBuffer.isDecoderBuffer(data)) {
        data = new DecoderBuffer(data, options);
      }
      return this.tree._decode(data, options);
    };
    function DERNode(parent) {
      Node5.call(this, "der", parent);
    }
    inherits(DERNode, Node5);
    DERNode.prototype._peekTag = function peekTag(buffer, tag, any) {
      if (buffer.isEmpty())
        return false;
      const state = buffer.save();
      const decodedTag = derDecodeTag(buffer, 'Failed to peek tag: "' + tag + '"');
      if (buffer.isError(decodedTag))
        return decodedTag;
      buffer.restore(state);
      return decodedTag.tag === tag || decodedTag.tagStr === tag || decodedTag.tagStr + "of" === tag || any;
    };
    DERNode.prototype._decodeTag = function decodeTag(buffer, tag, any) {
      const decodedTag = derDecodeTag(
        buffer,
        'Failed to decode tag of "' + tag + '"'
      );
      if (buffer.isError(decodedTag))
        return decodedTag;
      let len = derDecodeLen(
        buffer,
        decodedTag.primitive,
        'Failed to get length of "' + tag + '"'
      );
      if (buffer.isError(len))
        return len;
      if (!any && decodedTag.tag !== tag && decodedTag.tagStr !== tag && decodedTag.tagStr + "of" !== tag) {
        return buffer.error('Failed to match tag: "' + tag + '"');
      }
      if (decodedTag.primitive || len !== null)
        return buffer.skip(len, 'Failed to match body of: "' + tag + '"');
      const state = buffer.save();
      const res = this._skipUntilEnd(
        buffer,
        'Failed to skip indefinite length body: "' + this.tag + '"'
      );
      if (buffer.isError(res))
        return res;
      len = buffer.offset - state.offset;
      buffer.restore(state);
      return buffer.skip(len, 'Failed to match body of: "' + tag + '"');
    };
    DERNode.prototype._skipUntilEnd = function skipUntilEnd(buffer, fail) {
      for (; ; ) {
        const tag = derDecodeTag(buffer, fail);
        if (buffer.isError(tag))
          return tag;
        const len = derDecodeLen(buffer, tag.primitive, fail);
        if (buffer.isError(len))
          return len;
        let res;
        if (tag.primitive || len !== null)
          res = buffer.skip(len);
        else
          res = this._skipUntilEnd(buffer, fail);
        if (buffer.isError(res))
          return res;
        if (tag.tagStr === "end")
          break;
      }
    };
    DERNode.prototype._decodeList = function decodeList(buffer, tag, decoder, options) {
      const result = [];
      while (!buffer.isEmpty()) {
        const possibleEnd = this._peekTag(buffer, "end");
        if (buffer.isError(possibleEnd))
          return possibleEnd;
        const res = decoder.decode(buffer, "der", options);
        if (buffer.isError(res) && possibleEnd)
          break;
        result.push(res);
      }
      return result;
    };
    DERNode.prototype._decodeStr = function decodeStr(buffer, tag) {
      if (tag === "bitstr") {
        const unused = buffer.readUInt8();
        if (buffer.isError(unused))
          return unused;
        return { unused, data: buffer.raw() };
      } else if (tag === "bmpstr") {
        const raw2 = buffer.raw();
        if (raw2.length % 2 === 1)
          return buffer.error("Decoding of string type: bmpstr length mismatch");
        let str = "";
        for (let i = 0; i < raw2.length / 2; i++) {
          str += String.fromCharCode(raw2.readUInt16BE(i * 2));
        }
        return str;
      } else if (tag === "numstr") {
        const numstr = buffer.raw().toString("ascii");
        if (!this._isNumstr(numstr)) {
          return buffer.error("Decoding of string type: numstr unsupported characters");
        }
        return numstr;
      } else if (tag === "octstr") {
        return buffer.raw();
      } else if (tag === "objDesc") {
        return buffer.raw();
      } else if (tag === "printstr") {
        const printstr = buffer.raw().toString("ascii");
        if (!this._isPrintstr(printstr)) {
          return buffer.error("Decoding of string type: printstr unsupported characters");
        }
        return printstr;
      } else if (/str$/.test(tag)) {
        return buffer.raw().toString();
      } else {
        return buffer.error("Decoding of string type: " + tag + " unsupported");
      }
    };
    DERNode.prototype._decodeObjid = function decodeObjid(buffer, values, relative) {
      let result;
      const identifiers = [];
      let ident = 0;
      let subident = 0;
      while (!buffer.isEmpty()) {
        subident = buffer.readUInt8();
        ident <<= 7;
        ident |= subident & 127;
        if ((subident & 128) === 0) {
          identifiers.push(ident);
          ident = 0;
        }
      }
      if (subident & 128)
        identifiers.push(ident);
      const first = identifiers[0] / 40 | 0;
      const second = identifiers[0] % 40;
      if (relative)
        result = identifiers;
      else
        result = [first, second].concat(identifiers.slice(1));
      if (values) {
        let tmp = values[result.join(" ")];
        if (tmp === void 0)
          tmp = values[result.join(".")];
        if (tmp !== void 0)
          result = tmp;
      }
      return result;
    };
    DERNode.prototype._decodeTime = function decodeTime(buffer, tag) {
      const str = buffer.raw().toString();
      let year;
      let mon;
      let day;
      let hour;
      let min;
      let sec;
      if (tag === "gentime") {
        year = str.slice(0, 4) | 0;
        mon = str.slice(4, 6) | 0;
        day = str.slice(6, 8) | 0;
        hour = str.slice(8, 10) | 0;
        min = str.slice(10, 12) | 0;
        sec = str.slice(12, 14) | 0;
      } else if (tag === "utctime") {
        year = str.slice(0, 2) | 0;
        mon = str.slice(2, 4) | 0;
        day = str.slice(4, 6) | 0;
        hour = str.slice(6, 8) | 0;
        min = str.slice(8, 10) | 0;
        sec = str.slice(10, 12) | 0;
        if (year < 70)
          year = 2e3 + year;
        else
          year = 1900 + year;
      } else {
        return buffer.error("Decoding " + tag + " time is not supported yet");
      }
      return Date.UTC(year, mon - 1, day, hour, min, sec, 0);
    };
    DERNode.prototype._decodeNull = function decodeNull() {
      return null;
    };
    DERNode.prototype._decodeBool = function decodeBool(buffer) {
      const res = buffer.readUInt8();
      if (buffer.isError(res))
        return res;
      else
        return res !== 0;
    };
    DERNode.prototype._decodeInt = function decodeInt(buffer, values) {
      const raw2 = buffer.raw();
      let res = new bignum(raw2);
      if (values)
        res = values[res.toString(10)] || res;
      return res;
    };
    DERNode.prototype._use = function use(entity, obj) {
      if (typeof entity === "function")
        entity = entity(obj);
      return entity._getDecoder("der").tree;
    };
    function derDecodeTag(buf, fail) {
      let tag = buf.readUInt8(fail);
      if (buf.isError(tag))
        return tag;
      const cls = der.tagClass[tag >> 6];
      const primitive = (tag & 32) === 0;
      if ((tag & 31) === 31) {
        let oct = tag;
        tag = 0;
        while ((oct & 128) === 128) {
          oct = buf.readUInt8(fail);
          if (buf.isError(oct))
            return oct;
          tag <<= 7;
          tag |= oct & 127;
        }
      } else {
        tag &= 31;
      }
      const tagStr = der.tag[tag];
      return {
        cls,
        primitive,
        tag,
        tagStr
      };
    }
    function derDecodeLen(buf, primitive, fail) {
      let len = buf.readUInt8(fail);
      if (buf.isError(len))
        return len;
      if (!primitive && len === 128)
        return null;
      if ((len & 128) === 0) {
        return len;
      }
      const num = len & 127;
      if (num > 4)
        return buf.error("length octect is too long");
      len = 0;
      for (let i = 0; i < num; i++) {
        len <<= 8;
        const j = buf.readUInt8(fail);
        if (buf.isError(j))
          return j;
        len |= j;
      }
      return len;
    }
  }
});

// node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/decoders/pem.js
var require_pem2 = __commonJS({
  "node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/decoders/pem.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var Buffer2 = require_safer().Buffer;
    var DERDecoder = require_der3();
    function PEMDecoder(entity) {
      DERDecoder.call(this, entity);
      this.enc = "pem";
    }
    inherits(PEMDecoder, DERDecoder);
    module.exports = PEMDecoder;
    PEMDecoder.prototype.decode = function decode(data, options) {
      const lines = data.toString().split(/[\r\n]+/g);
      const label = options.label.toUpperCase();
      const re = /^-----(BEGIN|END) ([^-]+)-----$/;
      let start = -1;
      let end = -1;
      for (let i = 0; i < lines.length; i++) {
        const match2 = lines[i].match(re);
        if (match2 === null)
          continue;
        if (match2[2] !== label)
          continue;
        if (start === -1) {
          if (match2[1] !== "BEGIN")
            break;
          start = i;
        } else {
          if (match2[1] !== "END")
            break;
          end = i;
          break;
        }
      }
      if (start === -1 || end === -1)
        throw new Error("PEM section not found for: " + label);
      const base64 = lines.slice(start + 1, end).join("");
      base64.replace(/[^a-z0-9+/=]+/gi, "");
      const input = Buffer2.from(base64, "base64");
      return DERDecoder.prototype.decode.call(this, input, options);
    };
  }
});

// node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/decoders/index.js
var require_decoders = __commonJS({
  "node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/decoders/index.js"(exports) {
    "use strict";
    var decoders = exports;
    decoders.der = require_der3();
    decoders.pem = require_pem2();
  }
});

// node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/api.js
var require_api = __commonJS({
  "node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/api.js"(exports) {
    "use strict";
    var encoders = require_encoders();
    var decoders = require_decoders();
    var inherits = require_inherits();
    var api = exports;
    api.define = function define(name, body) {
      return new Entity(name, body);
    };
    function Entity(name, body) {
      this.name = name;
      this.body = body;
      this.decoders = {};
      this.encoders = {};
    }
    Entity.prototype._createNamed = function createNamed(Base) {
      const name = this.name;
      function Generated(entity) {
        this._initNamed(entity, name);
      }
      inherits(Generated, Base);
      Generated.prototype._initNamed = function _initNamed(entity, name2) {
        Base.call(this, entity, name2);
      };
      return new Generated(this);
    };
    Entity.prototype._getDecoder = function _getDecoder(enc) {
      enc = enc || "der";
      if (!this.decoders.hasOwnProperty(enc))
        this.decoders[enc] = this._createNamed(decoders[enc]);
      return this.decoders[enc];
    };
    Entity.prototype.decode = function decode(data, enc, options) {
      return this._getDecoder(enc).decode(data, options);
    };
    Entity.prototype._getEncoder = function _getEncoder(enc) {
      enc = enc || "der";
      if (!this.encoders.hasOwnProperty(enc))
        this.encoders[enc] = this._createNamed(encoders[enc]);
      return this.encoders[enc];
    };
    Entity.prototype.encode = function encode(data, enc, reporter) {
      return this._getEncoder(enc).encode(data, reporter);
    };
  }
});

// node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/base/index.js
var require_base = __commonJS({
  "node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/base/index.js"(exports) {
    "use strict";
    var base = exports;
    base.Reporter = require_reporter().Reporter;
    base.DecoderBuffer = require_buffer().DecoderBuffer;
    base.EncoderBuffer = require_buffer().EncoderBuffer;
    base.Node = require_node();
  }
});

// node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/constants/index.js
var require_constants = __commonJS({
  "node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/constants/index.js"(exports) {
    "use strict";
    var constants = exports;
    constants._reverse = function reverse(map) {
      const res = {};
      Object.keys(map).forEach(function(key) {
        if ((key | 0) == key)
          key = key | 0;
        const value = map[key];
        res[value] = key;
      });
      return res;
    };
    constants.der = require_der();
  }
});

// node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1.js
var require_asn1 = __commonJS({
  "node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1.js"(exports) {
    "use strict";
    var asn1 = exports;
    asn1.bignum = require_bn();
    asn1.define = require_api().define;
    asn1.base = require_base();
    asn1.constants = require_constants();
    asn1.decoders = require_decoders();
    asn1.encoders = require_encoders();
  }
});

// node_modules/.pnpm/safe-buffer@5.2.1/node_modules/safe-buffer/index.js
var require_safe_buffer = __commonJS({
  "node_modules/.pnpm/safe-buffer@5.2.1/node_modules/safe-buffer/index.js"(exports, module) {
    var buffer = __require("buffer");
    var Buffer2 = buffer.Buffer;
    function copyProps(src, dst) {
      for (var key in src) {
        dst[key] = src[key];
      }
    }
    if (Buffer2.from && Buffer2.alloc && Buffer2.allocUnsafe && Buffer2.allocUnsafeSlow) {
      module.exports = buffer;
    } else {
      copyProps(buffer, exports);
      exports.Buffer = SafeBuffer;
    }
    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer2(arg, encodingOrOffset, length);
    }
    SafeBuffer.prototype = Object.create(Buffer2.prototype);
    copyProps(Buffer2, SafeBuffer);
    SafeBuffer.from = function(arg, encodingOrOffset, length) {
      if (typeof arg === "number") {
        throw new TypeError("Argument must not be a number");
      }
      return Buffer2(arg, encodingOrOffset, length);
    };
    SafeBuffer.alloc = function(size, fill, encoding) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      var buf = Buffer2(size);
      if (fill !== void 0) {
        if (typeof encoding === "string") {
          buf.fill(fill, encoding);
        } else {
          buf.fill(fill);
        }
      } else {
        buf.fill(0);
      }
      return buf;
    };
    SafeBuffer.allocUnsafe = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return Buffer2(size);
    };
    SafeBuffer.allocUnsafeSlow = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return buffer.SlowBuffer(size);
    };
  }
});

// node_modules/.pnpm/jws@4.0.1/node_modules/jws/lib/data-stream.js
var require_data_stream = __commonJS({
  "node_modules/.pnpm/jws@4.0.1/node_modules/jws/lib/data-stream.js"(exports, module) {
    var Buffer2 = require_safe_buffer().Buffer;
    var Stream = __require("stream");
    var util = __require("util");
    function DataStream(data) {
      this.buffer = null;
      this.writable = true;
      this.readable = true;
      if (!data) {
        this.buffer = Buffer2.alloc(0);
        return this;
      }
      if (typeof data.pipe === "function") {
        this.buffer = Buffer2.alloc(0);
        data.pipe(this);
        return this;
      }
      if (data.length || typeof data === "object") {
        this.buffer = data;
        this.writable = false;
        process.nextTick(function() {
          this.emit("end", data);
          this.readable = false;
          this.emit("close");
        }.bind(this));
        return this;
      }
      throw new TypeError("Unexpected data type (" + typeof data + ")");
    }
    util.inherits(DataStream, Stream);
    DataStream.prototype.write = function write(data) {
      this.buffer = Buffer2.concat([this.buffer, Buffer2.from(data)]);
      this.emit("data", data);
    };
    DataStream.prototype.end = function end(data) {
      if (data)
        this.write(data);
      this.emit("end", data);
      this.emit("close");
      this.writable = false;
      this.readable = false;
    };
    module.exports = DataStream;
  }
});

// node_modules/.pnpm/ecdsa-sig-formatter@1.0.11/node_modules/ecdsa-sig-formatter/src/param-bytes-for-alg.js
var require_param_bytes_for_alg = __commonJS({
  "node_modules/.pnpm/ecdsa-sig-formatter@1.0.11/node_modules/ecdsa-sig-formatter/src/param-bytes-for-alg.js"(exports, module) {
    "use strict";
    function getParamSize(keySize) {
      var result = (keySize / 8 | 0) + (keySize % 8 === 0 ? 0 : 1);
      return result;
    }
    var paramBytesForAlg = {
      ES256: getParamSize(256),
      ES384: getParamSize(384),
      ES512: getParamSize(521)
    };
    function getParamBytesForAlg(alg) {
      var paramBytes = paramBytesForAlg[alg];
      if (paramBytes) {
        return paramBytes;
      }
      throw new Error('Unknown algorithm "' + alg + '"');
    }
    module.exports = getParamBytesForAlg;
  }
});

// node_modules/.pnpm/ecdsa-sig-formatter@1.0.11/node_modules/ecdsa-sig-formatter/src/ecdsa-sig-formatter.js
var require_ecdsa_sig_formatter = __commonJS({
  "node_modules/.pnpm/ecdsa-sig-formatter@1.0.11/node_modules/ecdsa-sig-formatter/src/ecdsa-sig-formatter.js"(exports, module) {
    "use strict";
    var Buffer2 = require_safe_buffer().Buffer;
    var getParamBytesForAlg = require_param_bytes_for_alg();
    var MAX_OCTET = 128;
    var CLASS_UNIVERSAL = 0;
    var PRIMITIVE_BIT = 32;
    var TAG_SEQ = 16;
    var TAG_INT = 2;
    var ENCODED_TAG_SEQ = TAG_SEQ | PRIMITIVE_BIT | CLASS_UNIVERSAL << 6;
    var ENCODED_TAG_INT = TAG_INT | CLASS_UNIVERSAL << 6;
    function base64Url(base64) {
      return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    function signatureAsBuffer(signature) {
      if (Buffer2.isBuffer(signature)) {
        return signature;
      } else if ("string" === typeof signature) {
        return Buffer2.from(signature, "base64");
      }
      throw new TypeError("ECDSA signature must be a Base64 string or a Buffer");
    }
    function derToJose(signature, alg) {
      signature = signatureAsBuffer(signature);
      var paramBytes = getParamBytesForAlg(alg);
      var maxEncodedParamLength = paramBytes + 1;
      var inputLength = signature.length;
      var offset = 0;
      if (signature[offset++] !== ENCODED_TAG_SEQ) {
        throw new Error('Could not find expected "seq"');
      }
      var seqLength = signature[offset++];
      if (seqLength === (MAX_OCTET | 1)) {
        seqLength = signature[offset++];
      }
      if (inputLength - offset < seqLength) {
        throw new Error('"seq" specified length of "' + seqLength + '", only "' + (inputLength - offset) + '" remaining');
      }
      if (signature[offset++] !== ENCODED_TAG_INT) {
        throw new Error('Could not find expected "int" for "r"');
      }
      var rLength = signature[offset++];
      if (inputLength - offset - 2 < rLength) {
        throw new Error('"r" specified length of "' + rLength + '", only "' + (inputLength - offset - 2) + '" available');
      }
      if (maxEncodedParamLength < rLength) {
        throw new Error('"r" specified length of "' + rLength + '", max of "' + maxEncodedParamLength + '" is acceptable');
      }
      var rOffset = offset;
      offset += rLength;
      if (signature[offset++] !== ENCODED_TAG_INT) {
        throw new Error('Could not find expected "int" for "s"');
      }
      var sLength = signature[offset++];
      if (inputLength - offset !== sLength) {
        throw new Error('"s" specified length of "' + sLength + '", expected "' + (inputLength - offset) + '"');
      }
      if (maxEncodedParamLength < sLength) {
        throw new Error('"s" specified length of "' + sLength + '", max of "' + maxEncodedParamLength + '" is acceptable');
      }
      var sOffset = offset;
      offset += sLength;
      if (offset !== inputLength) {
        throw new Error('Expected to consume entire buffer, but "' + (inputLength - offset) + '" bytes remain');
      }
      var rPadding = paramBytes - rLength, sPadding = paramBytes - sLength;
      var dst = Buffer2.allocUnsafe(rPadding + rLength + sPadding + sLength);
      for (offset = 0; offset < rPadding; ++offset) {
        dst[offset] = 0;
      }
      signature.copy(dst, offset, rOffset + Math.max(-rPadding, 0), rOffset + rLength);
      offset = paramBytes;
      for (var o = offset; offset < o + sPadding; ++offset) {
        dst[offset] = 0;
      }
      signature.copy(dst, offset, sOffset + Math.max(-sPadding, 0), sOffset + sLength);
      dst = dst.toString("base64");
      dst = base64Url(dst);
      return dst;
    }
    function countPadding(buf, start, stop) {
      var padding = 0;
      while (start + padding < stop && buf[start + padding] === 0) {
        ++padding;
      }
      var needsSign = buf[start + padding] >= MAX_OCTET;
      if (needsSign) {
        --padding;
      }
      return padding;
    }
    function joseToDer(signature, alg) {
      signature = signatureAsBuffer(signature);
      var paramBytes = getParamBytesForAlg(alg);
      var signatureBytes = signature.length;
      if (signatureBytes !== paramBytes * 2) {
        throw new TypeError('"' + alg + '" signatures must be "' + paramBytes * 2 + '" bytes, saw "' + signatureBytes + '"');
      }
      var rPadding = countPadding(signature, 0, paramBytes);
      var sPadding = countPadding(signature, paramBytes, signature.length);
      var rLength = paramBytes - rPadding;
      var sLength = paramBytes - sPadding;
      var rsBytes = 1 + 1 + rLength + 1 + 1 + sLength;
      var shortLength = rsBytes < MAX_OCTET;
      var dst = Buffer2.allocUnsafe((shortLength ? 2 : 3) + rsBytes);
      var offset = 0;
      dst[offset++] = ENCODED_TAG_SEQ;
      if (shortLength) {
        dst[offset++] = rsBytes;
      } else {
        dst[offset++] = MAX_OCTET | 1;
        dst[offset++] = rsBytes & 255;
      }
      dst[offset++] = ENCODED_TAG_INT;
      dst[offset++] = rLength;
      if (rPadding < 0) {
        dst[offset++] = 0;
        offset += signature.copy(dst, offset, 0, paramBytes);
      } else {
        offset += signature.copy(dst, offset, rPadding, paramBytes);
      }
      dst[offset++] = ENCODED_TAG_INT;
      dst[offset++] = sLength;
      if (sPadding < 0) {
        dst[offset++] = 0;
        signature.copy(dst, offset, paramBytes);
      } else {
        signature.copy(dst, offset, paramBytes + sPadding);
      }
      return dst;
    }
    module.exports = {
      derToJose,
      joseToDer
    };
  }
});

// node_modules/.pnpm/buffer-equal-constant-time@1.0.1/node_modules/buffer-equal-constant-time/index.js
var require_buffer_equal_constant_time = __commonJS({
  "node_modules/.pnpm/buffer-equal-constant-time@1.0.1/node_modules/buffer-equal-constant-time/index.js"(exports, module) {
    "use strict";
    var Buffer2 = __require("buffer").Buffer;
    var SlowBuffer = __require("buffer").SlowBuffer;
    module.exports = bufferEq;
    function bufferEq(a, b) {
      if (!Buffer2.isBuffer(a) || !Buffer2.isBuffer(b)) {
        return false;
      }
      if (a.length !== b.length) {
        return false;
      }
      var c = 0;
      for (var i = 0; i < a.length; i++) {
        c |= a[i] ^ b[i];
      }
      return c === 0;
    }
    bufferEq.install = function() {
      Buffer2.prototype.equal = SlowBuffer.prototype.equal = function equal(that) {
        return bufferEq(this, that);
      };
    };
    var origBufEqual = Buffer2.prototype.equal;
    var origSlowBufEqual = SlowBuffer.prototype.equal;
    bufferEq.restore = function() {
      Buffer2.prototype.equal = origBufEqual;
      SlowBuffer.prototype.equal = origSlowBufEqual;
    };
  }
});

// node_modules/.pnpm/jwa@2.0.1/node_modules/jwa/index.js
var require_jwa = __commonJS({
  "node_modules/.pnpm/jwa@2.0.1/node_modules/jwa/index.js"(exports, module) {
    var Buffer2 = require_safe_buffer().Buffer;
    var crypto2 = __require("crypto");
    var formatEcdsa = require_ecdsa_sig_formatter();
    var util = __require("util");
    var MSG_INVALID_ALGORITHM = '"%s" is not a valid algorithm.\n  Supported algorithms are:\n  "HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512" and "none".';
    var MSG_INVALID_SECRET = "secret must be a string or buffer";
    var MSG_INVALID_VERIFIER_KEY = "key must be a string or a buffer";
    var MSG_INVALID_SIGNER_KEY = "key must be a string, a buffer or an object";
    var supportsKeyObjects = typeof crypto2.createPublicKey === "function";
    if (supportsKeyObjects) {
      MSG_INVALID_VERIFIER_KEY += " or a KeyObject";
      MSG_INVALID_SECRET += "or a KeyObject";
    }
    function checkIsPublicKey(key) {
      if (Buffer2.isBuffer(key)) {
        return;
      }
      if (typeof key === "string") {
        return;
      }
      if (!supportsKeyObjects) {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if (typeof key !== "object") {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if (typeof key.type !== "string") {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if (typeof key.asymmetricKeyType !== "string") {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if (typeof key.export !== "function") {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
    }
    function checkIsPrivateKey(key) {
      if (Buffer2.isBuffer(key)) {
        return;
      }
      if (typeof key === "string") {
        return;
      }
      if (typeof key === "object") {
        return;
      }
      throw typeError(MSG_INVALID_SIGNER_KEY);
    }
    function checkIsSecretKey(key) {
      if (Buffer2.isBuffer(key)) {
        return;
      }
      if (typeof key === "string") {
        return key;
      }
      if (!supportsKeyObjects) {
        throw typeError(MSG_INVALID_SECRET);
      }
      if (typeof key !== "object") {
        throw typeError(MSG_INVALID_SECRET);
      }
      if (key.type !== "secret") {
        throw typeError(MSG_INVALID_SECRET);
      }
      if (typeof key.export !== "function") {
        throw typeError(MSG_INVALID_SECRET);
      }
    }
    function fromBase64(base64) {
      return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    function toBase642(base64url) {
      base64url = base64url.toString();
      var padding = 4 - base64url.length % 4;
      if (padding !== 4) {
        for (var i = 0; i < padding; ++i) {
          base64url += "=";
        }
      }
      return base64url.replace(/\-/g, "+").replace(/_/g, "/");
    }
    function typeError(template) {
      var args = [].slice.call(arguments, 1);
      var errMsg = util.format.bind(util, template).apply(null, args);
      return new TypeError(errMsg);
    }
    function bufferOrString(obj) {
      return Buffer2.isBuffer(obj) || typeof obj === "string";
    }
    function normalizeInput(thing) {
      if (!bufferOrString(thing))
        thing = JSON.stringify(thing);
      return thing;
    }
    function createHmacSigner(bits) {
      return function sign(thing, secret) {
        checkIsSecretKey(secret);
        thing = normalizeInput(thing);
        var hmac = crypto2.createHmac("sha" + bits, secret);
        var sig = (hmac.update(thing), hmac.digest("base64"));
        return fromBase64(sig);
      };
    }
    var bufferEqual;
    var timingSafeEqual2 = "timingSafeEqual" in crypto2 ? function timingSafeEqual3(a, b) {
      if (a.byteLength !== b.byteLength) {
        return false;
      }
      return crypto2.timingSafeEqual(a, b);
    } : function timingSafeEqual3(a, b) {
      if (!bufferEqual) {
        bufferEqual = require_buffer_equal_constant_time();
      }
      return bufferEqual(a, b);
    };
    function createHmacVerifier(bits) {
      return function verify(thing, signature, secret) {
        var computedSig = createHmacSigner(bits)(thing, secret);
        return timingSafeEqual2(Buffer2.from(signature), Buffer2.from(computedSig));
      };
    }
    function createKeySigner(bits) {
      return function sign(thing, privateKey) {
        checkIsPrivateKey(privateKey);
        thing = normalizeInput(thing);
        var signer = crypto2.createSign("RSA-SHA" + bits);
        var sig = (signer.update(thing), signer.sign(privateKey, "base64"));
        return fromBase64(sig);
      };
    }
    function createKeyVerifier(bits) {
      return function verify(thing, signature, publicKey) {
        checkIsPublicKey(publicKey);
        thing = normalizeInput(thing);
        signature = toBase642(signature);
        var verifier = crypto2.createVerify("RSA-SHA" + bits);
        verifier.update(thing);
        return verifier.verify(publicKey, signature, "base64");
      };
    }
    function createPSSKeySigner(bits) {
      return function sign(thing, privateKey) {
        checkIsPrivateKey(privateKey);
        thing = normalizeInput(thing);
        var signer = crypto2.createSign("RSA-SHA" + bits);
        var sig = (signer.update(thing), signer.sign({
          key: privateKey,
          padding: crypto2.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: crypto2.constants.RSA_PSS_SALTLEN_DIGEST
        }, "base64"));
        return fromBase64(sig);
      };
    }
    function createPSSKeyVerifier(bits) {
      return function verify(thing, signature, publicKey) {
        checkIsPublicKey(publicKey);
        thing = normalizeInput(thing);
        signature = toBase642(signature);
        var verifier = crypto2.createVerify("RSA-SHA" + bits);
        verifier.update(thing);
        return verifier.verify({
          key: publicKey,
          padding: crypto2.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: crypto2.constants.RSA_PSS_SALTLEN_DIGEST
        }, signature, "base64");
      };
    }
    function createECDSASigner(bits) {
      var inner = createKeySigner(bits);
      return function sign() {
        var signature = inner.apply(null, arguments);
        signature = formatEcdsa.derToJose(signature, "ES" + bits);
        return signature;
      };
    }
    function createECDSAVerifer(bits) {
      var inner = createKeyVerifier(bits);
      return function verify(thing, signature, publicKey) {
        signature = formatEcdsa.joseToDer(signature, "ES" + bits).toString("base64");
        var result = inner(thing, signature, publicKey);
        return result;
      };
    }
    function createNoneSigner() {
      return function sign() {
        return "";
      };
    }
    function createNoneVerifier() {
      return function verify(thing, signature) {
        return signature === "";
      };
    }
    module.exports = function jwa(algorithm) {
      var signerFactories = {
        hs: createHmacSigner,
        rs: createKeySigner,
        ps: createPSSKeySigner,
        es: createECDSASigner,
        none: createNoneSigner
      };
      var verifierFactories = {
        hs: createHmacVerifier,
        rs: createKeyVerifier,
        ps: createPSSKeyVerifier,
        es: createECDSAVerifer,
        none: createNoneVerifier
      };
      var match2 = algorithm.match(/^(RS|PS|ES|HS)(256|384|512)$|^(none)$/);
      if (!match2)
        throw typeError(MSG_INVALID_ALGORITHM, algorithm);
      var algo = (match2[1] || match2[3]).toLowerCase();
      var bits = match2[2];
      return {
        sign: signerFactories[algo](bits),
        verify: verifierFactories[algo](bits)
      };
    };
  }
});

// node_modules/.pnpm/jws@4.0.1/node_modules/jws/lib/tostring.js
var require_tostring = __commonJS({
  "node_modules/.pnpm/jws@4.0.1/node_modules/jws/lib/tostring.js"(exports, module) {
    var Buffer2 = __require("buffer").Buffer;
    module.exports = function toString(obj) {
      if (typeof obj === "string")
        return obj;
      if (typeof obj === "number" || Buffer2.isBuffer(obj))
        return obj.toString();
      return JSON.stringify(obj);
    };
  }
});

// node_modules/.pnpm/jws@4.0.1/node_modules/jws/lib/sign-stream.js
var require_sign_stream = __commonJS({
  "node_modules/.pnpm/jws@4.0.1/node_modules/jws/lib/sign-stream.js"(exports, module) {
    var Buffer2 = require_safe_buffer().Buffer;
    var DataStream = require_data_stream();
    var jwa = require_jwa();
    var Stream = __require("stream");
    var toString = require_tostring();
    var util = __require("util");
    function base64url(string, encoding) {
      return Buffer2.from(string, encoding).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    function jwsSecuredInput(header, payload, encoding) {
      encoding = encoding || "utf8";
      var encodedHeader = base64url(toString(header), "binary");
      var encodedPayload = base64url(toString(payload), encoding);
      return util.format("%s.%s", encodedHeader, encodedPayload);
    }
    function jwsSign(opts) {
      var header = opts.header;
      var payload = opts.payload;
      var secretOrKey = opts.secret || opts.privateKey;
      var encoding = opts.encoding;
      var algo = jwa(header.alg);
      var securedInput = jwsSecuredInput(header, payload, encoding);
      var signature = algo.sign(securedInput, secretOrKey);
      return util.format("%s.%s", securedInput, signature);
    }
    function SignStream(opts) {
      var secret = opts.secret;
      secret = secret == null ? opts.privateKey : secret;
      secret = secret == null ? opts.key : secret;
      if (/^hs/i.test(opts.header.alg) === true && secret == null) {
        throw new TypeError("secret must be a string or buffer or a KeyObject");
      }
      var secretStream = new DataStream(secret);
      this.readable = true;
      this.header = opts.header;
      this.encoding = opts.encoding;
      this.secret = this.privateKey = this.key = secretStream;
      this.payload = new DataStream(opts.payload);
      this.secret.once("close", function() {
        if (!this.payload.writable && this.readable)
          this.sign();
      }.bind(this));
      this.payload.once("close", function() {
        if (!this.secret.writable && this.readable)
          this.sign();
      }.bind(this));
    }
    util.inherits(SignStream, Stream);
    SignStream.prototype.sign = function sign() {
      try {
        var signature = jwsSign({
          header: this.header,
          payload: this.payload.buffer,
          secret: this.secret.buffer,
          encoding: this.encoding
        });
        this.emit("done", signature);
        this.emit("data", signature);
        this.emit("end");
        this.readable = false;
        return signature;
      } catch (e) {
        this.readable = false;
        this.emit("error", e);
        this.emit("close");
      }
    };
    SignStream.sign = jwsSign;
    module.exports = SignStream;
  }
});

// node_modules/.pnpm/jws@4.0.1/node_modules/jws/lib/verify-stream.js
var require_verify_stream = __commonJS({
  "node_modules/.pnpm/jws@4.0.1/node_modules/jws/lib/verify-stream.js"(exports, module) {
    var Buffer2 = require_safe_buffer().Buffer;
    var DataStream = require_data_stream();
    var jwa = require_jwa();
    var Stream = __require("stream");
    var toString = require_tostring();
    var util = __require("util");
    var JWS_REGEX = /^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/;
    function isObject(thing) {
      return Object.prototype.toString.call(thing) === "[object Object]";
    }
    function safeJsonParse(thing) {
      if (isObject(thing))
        return thing;
      try {
        return JSON.parse(thing);
      } catch (e) {
        return void 0;
      }
    }
    function headerFromJWS(jwsSig) {
      var encodedHeader = jwsSig.split(".", 1)[0];
      return safeJsonParse(Buffer2.from(encodedHeader, "base64").toString("binary"));
    }
    function securedInputFromJWS(jwsSig) {
      return jwsSig.split(".", 2).join(".");
    }
    function signatureFromJWS(jwsSig) {
      return jwsSig.split(".")[2];
    }
    function payloadFromJWS(jwsSig, encoding) {
      encoding = encoding || "utf8";
      var payload = jwsSig.split(".")[1];
      return Buffer2.from(payload, "base64").toString(encoding);
    }
    function isValidJws(string) {
      return JWS_REGEX.test(string) && !!headerFromJWS(string);
    }
    function jwsVerify(jwsSig, algorithm, secretOrKey) {
      if (!algorithm) {
        var err = new Error("Missing algorithm parameter for jws.verify");
        err.code = "MISSING_ALGORITHM";
        throw err;
      }
      jwsSig = toString(jwsSig);
      var signature = signatureFromJWS(jwsSig);
      var securedInput = securedInputFromJWS(jwsSig);
      var algo = jwa(algorithm);
      return algo.verify(securedInput, signature, secretOrKey);
    }
    function jwsDecode(jwsSig, opts) {
      opts = opts || {};
      jwsSig = toString(jwsSig);
      if (!isValidJws(jwsSig))
        return null;
      var header = headerFromJWS(jwsSig);
      if (!header)
        return null;
      var payload = payloadFromJWS(jwsSig);
      if (header.typ === "JWT" || opts.json)
        payload = JSON.parse(payload, opts.encoding);
      return {
        header,
        payload,
        signature: signatureFromJWS(jwsSig)
      };
    }
    function VerifyStream(opts) {
      opts = opts || {};
      var secretOrKey = opts.secret;
      secretOrKey = secretOrKey == null ? opts.publicKey : secretOrKey;
      secretOrKey = secretOrKey == null ? opts.key : secretOrKey;
      if (/^hs/i.test(opts.algorithm) === true && secretOrKey == null) {
        throw new TypeError("secret must be a string or buffer or a KeyObject");
      }
      var secretStream = new DataStream(secretOrKey);
      this.readable = true;
      this.algorithm = opts.algorithm;
      this.encoding = opts.encoding;
      this.secret = this.publicKey = this.key = secretStream;
      this.signature = new DataStream(opts.signature);
      this.secret.once("close", function() {
        if (!this.signature.writable && this.readable)
          this.verify();
      }.bind(this));
      this.signature.once("close", function() {
        if (!this.secret.writable && this.readable)
          this.verify();
      }.bind(this));
    }
    util.inherits(VerifyStream, Stream);
    VerifyStream.prototype.verify = function verify() {
      try {
        var valid = jwsVerify(this.signature.buffer, this.algorithm, this.key.buffer);
        var obj = jwsDecode(this.signature.buffer, this.encoding);
        this.emit("done", valid, obj);
        this.emit("data", valid);
        this.emit("end");
        this.readable = false;
        return valid;
      } catch (e) {
        this.readable = false;
        this.emit("error", e);
        this.emit("close");
      }
    };
    VerifyStream.decode = jwsDecode;
    VerifyStream.isValid = isValidJws;
    VerifyStream.verify = jwsVerify;
    module.exports = VerifyStream;
  }
});

// node_modules/.pnpm/jws@4.0.1/node_modules/jws/index.js
var require_jws = __commonJS({
  "node_modules/.pnpm/jws@4.0.1/node_modules/jws/index.js"(exports) {
    var SignStream = require_sign_stream();
    var VerifyStream = require_verify_stream();
    var ALGORITHMS = [
      "HS256",
      "HS384",
      "HS512",
      "RS256",
      "RS384",
      "RS512",
      "PS256",
      "PS384",
      "PS512",
      "ES256",
      "ES384",
      "ES512"
    ];
    exports.ALGORITHMS = ALGORITHMS;
    exports.sign = SignStream.sign;
    exports.verify = VerifyStream.verify;
    exports.decode = VerifyStream.decode;
    exports.isValid = VerifyStream.isValid;
    exports.createSign = function createSign(opts) {
      return new SignStream(opts);
    };
    exports.createVerify = function createVerify(opts) {
      return new VerifyStream(opts);
    };
  }
});

// node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/web-push-constants.js
var require_web_push_constants = __commonJS({
  "node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/web-push-constants.js"(exports, module) {
    "use strict";
    var WebPushConstants = {};
    WebPushConstants.supportedContentEncodings = {
      AES_GCM: "aesgcm",
      AES_128_GCM: "aes128gcm"
    };
    WebPushConstants.supportedUrgency = {
      VERY_LOW: "very-low",
      LOW: "low",
      NORMAL: "normal",
      HIGH: "high"
    };
    module.exports = WebPushConstants;
  }
});

// node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/urlsafe-base64-helper.js
var require_urlsafe_base64_helper = __commonJS({
  "node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/urlsafe-base64-helper.js"(exports, module) {
    "use strict";
    function validate(base64) {
      return /^[A-Za-z0-9\-_]+$/.test(base64);
    }
    module.exports = {
      validate
    };
  }
});

// node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/vapid-helper.js
var require_vapid_helper = __commonJS({
  "node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/vapid-helper.js"(exports, module) {
    "use strict";
    var crypto2 = __require("crypto");
    var asn1 = require_asn1();
    var jws = require_jws();
    var { URL: URL2 } = __require("url");
    var WebPushConstants = require_web_push_constants();
    var urlBase64Helper = require_urlsafe_base64_helper();
    var DEFAULT_EXPIRATION_SECONDS = 12 * 60 * 60;
    var MAX_EXPIRATION_SECONDS = 24 * 60 * 60;
    var ECPrivateKeyASN = asn1.define("ECPrivateKey", function() {
      this.seq().obj(
        this.key("version").int(),
        this.key("privateKey").octstr(),
        this.key("parameters").explicit(0).objid().optional(),
        this.key("publicKey").explicit(1).bitstr().optional()
      );
    });
    function toPEM(key) {
      return ECPrivateKeyASN.encode({
        version: 1,
        privateKey: key,
        parameters: [1, 2, 840, 10045, 3, 1, 7]
        // prime256v1
      }, "pem", {
        label: "EC PRIVATE KEY"
      });
    }
    function generateVAPIDKeys() {
      const curve = crypto2.createECDH("prime256v1");
      curve.generateKeys();
      let publicKeyBuffer = curve.getPublicKey();
      let privateKeyBuffer = curve.getPrivateKey();
      if (privateKeyBuffer.length < 32) {
        const padding = Buffer.alloc(32 - privateKeyBuffer.length);
        padding.fill(0);
        privateKeyBuffer = Buffer.concat([padding, privateKeyBuffer]);
      }
      if (publicKeyBuffer.length < 65) {
        const padding = Buffer.alloc(65 - publicKeyBuffer.length);
        padding.fill(0);
        publicKeyBuffer = Buffer.concat([padding, publicKeyBuffer]);
      }
      return {
        publicKey: publicKeyBuffer.toString("base64url"),
        privateKey: privateKeyBuffer.toString("base64url")
      };
    }
    function validateSubject(subject) {
      if (!subject) {
        throw new Error("No subject set in vapidDetails.subject.");
      }
      if (typeof subject !== "string" || subject.length === 0) {
        throw new Error("The subject value must be a string containing an https: URL or mailto: address. " + subject);
      }
      let subjectParseResult = null;
      try {
        subjectParseResult = new URL2(subject);
      } catch (err) {
        throw new Error("Vapid subject is not a valid URL. " + subject);
      }
      if (!["https:", "mailto:"].includes(subjectParseResult.protocol)) {
        throw new Error("Vapid subject is not an https: or mailto: URL. " + subject);
      }
      if (subjectParseResult.hostname === "localhost") {
        console.warn("Vapid subject points to a localhost web URI, which is unsupported by Apple's push notification server and will result in a BadJwtToken error when sending notifications.");
      }
    }
    function validatePublicKey(publicKey) {
      if (!publicKey) {
        throw new Error("No key set vapidDetails.publicKey");
      }
      if (typeof publicKey !== "string") {
        throw new Error("Vapid public key is must be a URL safe Base 64 encoded string.");
      }
      if (!urlBase64Helper.validate(publicKey)) {
        throw new Error('Vapid public key must be a URL safe Base 64 (without "=")');
      }
      publicKey = Buffer.from(publicKey, "base64url");
      if (publicKey.length !== 65) {
        throw new Error("Vapid public key should be 65 bytes long when decoded.");
      }
    }
    function validatePrivateKey(privateKey) {
      if (!privateKey) {
        throw new Error("No key set in vapidDetails.privateKey");
      }
      if (typeof privateKey !== "string") {
        throw new Error("Vapid private key must be a URL safe Base 64 encoded string.");
      }
      if (!urlBase64Helper.validate(privateKey)) {
        throw new Error('Vapid private key must be a URL safe Base 64 (without "=")');
      }
      privateKey = Buffer.from(privateKey, "base64url");
      if (privateKey.length !== 32) {
        throw new Error("Vapid private key should be 32 bytes long when decoded.");
      }
    }
    function getFutureExpirationTimestamp(numSeconds) {
      const futureExp = /* @__PURE__ */ new Date();
      futureExp.setSeconds(futureExp.getSeconds() + numSeconds);
      return Math.floor(futureExp.getTime() / 1e3);
    }
    function validateExpiration(expiration) {
      if (!Number.isInteger(expiration)) {
        throw new Error("`expiration` value must be a number");
      }
      if (expiration < 0) {
        throw new Error("`expiration` must be a positive integer");
      }
      const maxExpirationTimestamp = getFutureExpirationTimestamp(MAX_EXPIRATION_SECONDS);
      if (expiration >= maxExpirationTimestamp) {
        throw new Error("`expiration` value is greater than maximum of 24 hours");
      }
    }
    function getVapidHeaders(audience, subject, publicKey, privateKey, contentEncoding, expiration) {
      if (!audience) {
        throw new Error("No audience could be generated for VAPID.");
      }
      if (typeof audience !== "string" || audience.length === 0) {
        throw new Error("The audience value must be a string containing the origin of a push service. " + audience);
      }
      try {
        new URL2(audience);
      } catch (err) {
        throw new Error("VAPID audience is not a url. " + audience);
      }
      validateSubject(subject);
      validatePublicKey(publicKey);
      validatePrivateKey(privateKey);
      privateKey = Buffer.from(privateKey, "base64url");
      if (expiration) {
        validateExpiration(expiration);
      } else {
        expiration = getFutureExpirationTimestamp(DEFAULT_EXPIRATION_SECONDS);
      }
      const header = {
        typ: "JWT",
        alg: "ES256"
      };
      const jwtPayload = {
        aud: audience,
        exp: expiration,
        sub: subject
      };
      const jwt = jws.sign({
        header,
        payload: jwtPayload,
        privateKey: toPEM(privateKey)
      });
      if (contentEncoding === WebPushConstants.supportedContentEncodings.AES_128_GCM) {
        return {
          Authorization: "vapid t=" + jwt + ", k=" + publicKey
        };
      }
      if (contentEncoding === WebPushConstants.supportedContentEncodings.AES_GCM) {
        return {
          Authorization: "WebPush " + jwt,
          "Crypto-Key": "p256ecdsa=" + publicKey
        };
      }
      throw new Error("Unsupported encoding type specified.");
    }
    module.exports = {
      generateVAPIDKeys,
      getFutureExpirationTimestamp,
      getVapidHeaders,
      validateSubject,
      validatePublicKey,
      validatePrivateKey,
      validateExpiration
    };
  }
});

// node_modules/.pnpm/http_ece@1.2.0/node_modules/http_ece/ece.js
var require_ece = __commonJS({
  "node_modules/.pnpm/http_ece@1.2.0/node_modules/http_ece/ece.js"(exports, module) {
    "use strict";
    var crypto2 = __require("crypto");
    var AES_GCM = "aes-128-gcm";
    var PAD_SIZE = { "aes128gcm": 1, "aesgcm": 2 };
    var TAG_LENGTH = 16;
    var KEY_LENGTH = 16;
    var NONCE_LENGTH = 12;
    var SHA_256_LENGTH = 32;
    var MODE_ENCRYPT = "encrypt";
    var MODE_DECRYPT = "decrypt";
    var keylog;
    if (process.env.ECE_KEYLOG === "1") {
      keylog = function(m, k) {
        console.warn(m + " [" + k.length + "]: " + k.toString("base64url"));
        return k;
      };
    } else {
      keylog = function(m, k) {
        return k;
      };
    }
    function decode(b) {
      if (typeof b === "string") {
        return Buffer.from(b, "base64url");
      }
      return b;
    }
    function HMAC_hash(key, input) {
      var hmac = crypto2.createHmac("sha256", key);
      hmac.update(input);
      return hmac.digest();
    }
    function HKDF_extract(salt, ikm) {
      keylog("salt", salt);
      keylog("ikm", ikm);
      return keylog("extract", HMAC_hash(salt, ikm));
    }
    function HKDF_expand(prk, info2, l) {
      keylog("prk", prk);
      keylog("info", info2);
      var output = Buffer.alloc(0);
      var T = Buffer.alloc(0);
      info2 = Buffer.from(info2, "ascii");
      var counter = 0;
      var cbuf = Buffer.alloc(1);
      while (output.length < l) {
        cbuf.writeUIntBE(++counter, 0, 1);
        T = HMAC_hash(prk, Buffer.concat([T, info2, cbuf]));
        output = Buffer.concat([output, T]);
      }
      return keylog("expand", output.slice(0, l));
    }
    function HKDF(salt, ikm, info2, len) {
      return HKDF_expand(HKDF_extract(salt, ikm), info2, len);
    }
    function info(base, context) {
      var result = Buffer.concat([
        Buffer.from("Content-Encoding: " + base + "\0", "ascii"),
        context
      ]);
      keylog("info " + base, result);
      return result;
    }
    function lengthPrefix(buffer) {
      var b = Buffer.concat([Buffer.alloc(2), buffer]);
      b.writeUIntBE(buffer.length, 0, 2);
      return b;
    }
    function extractDH(header, mode) {
      var key = header.privateKey;
      var senderPubKey, receiverPubKey;
      if (mode === MODE_ENCRYPT) {
        senderPubKey = key.getPublicKey();
        receiverPubKey = header.dh;
      } else if (mode === MODE_DECRYPT) {
        senderPubKey = header.dh;
        receiverPubKey = key.getPublicKey();
      } else {
        throw new Error("Unknown mode only " + MODE_ENCRYPT + " and " + MODE_DECRYPT + " supported");
      }
      return {
        secret: key.computeSecret(header.dh),
        context: Buffer.concat([
          Buffer.from(header.keylabel, "ascii"),
          Buffer.from([0]),
          lengthPrefix(receiverPubKey),
          // user agent
          lengthPrefix(senderPubKey)
          // application server
        ])
      };
    }
    function extractSecretAndContext(header, mode) {
      var result = { secret: null, context: Buffer.alloc(0) };
      if (header.key) {
        result.secret = header.key;
        if (result.secret.length !== KEY_LENGTH) {
          throw new Error("An explicit key must be " + KEY_LENGTH + " bytes");
        }
      } else if (header.dh) {
        result = extractDH(header, mode);
      } else if (typeof header.keyid !== void 0) {
        result.secret = header.keymap[header.keyid];
      }
      if (!result.secret) {
        throw new Error("Unable to determine key");
      }
      keylog("secret", result.secret);
      keylog("context", result.context);
      if (header.authSecret) {
        result.secret = HKDF(
          header.authSecret,
          result.secret,
          info("auth", Buffer.alloc(0)),
          SHA_256_LENGTH
        );
        keylog("authsecret", result.secret);
      }
      return result;
    }
    function webpushSecret(header, mode) {
      if (!header.authSecret) {
        throw new Error("No authentication secret for webpush");
      }
      keylog("authsecret", header.authSecret);
      var remotePubKey, senderPubKey, receiverPubKey;
      if (mode === MODE_ENCRYPT) {
        senderPubKey = header.privateKey.getPublicKey();
        remotePubKey = receiverPubKey = header.dh;
      } else if (mode === MODE_DECRYPT) {
        remotePubKey = senderPubKey = header.keyid;
        receiverPubKey = header.privateKey.getPublicKey();
      } else {
        throw new Error("Unknown mode only " + MODE_ENCRYPT + " and " + MODE_DECRYPT + " supported");
      }
      keylog("remote pubkey", remotePubKey);
      keylog("sender pubkey", senderPubKey);
      keylog("receiver pubkey", receiverPubKey);
      return keylog(
        "secret dh",
        HKDF(
          header.authSecret,
          header.privateKey.computeSecret(remotePubKey),
          Buffer.concat([
            Buffer.from("WebPush: info\0"),
            receiverPubKey,
            senderPubKey
          ]),
          SHA_256_LENGTH
        )
      );
    }
    function extractSecret(header, mode, keyLookupCallback) {
      if (keyLookupCallback) {
        if (!isFunction(keyLookupCallback)) {
          throw new Error("Callback is not a function");
        }
      }
      if (header.key) {
        if (header.key.length !== KEY_LENGTH) {
          throw new Error("An explicit key must be " + KEY_LENGTH + " bytes");
        }
        return keylog("secret key", header.key);
      }
      if (!header.privateKey) {
        if (!keyLookupCallback) {
          var key = header.keymap && header.keymap[header.keyid];
        } else {
          var key = keyLookupCallback(header.keyid);
        }
        if (!key) {
          throw new Error('No saved key (keyid: "' + header.keyid + '")');
        }
        return key;
      }
      return webpushSecret(header, mode);
    }
    function deriveKeyAndNonce(header, mode, lookupKeyCallback) {
      if (!header.salt) {
        throw new Error("must include a salt parameter for " + header.version);
      }
      var keyInfo;
      var nonceInfo;
      var secret;
      if (header.version === "aesgcm") {
        var s = extractSecretAndContext(header, mode, lookupKeyCallback);
        keyInfo = info("aesgcm", s.context);
        nonceInfo = info("nonce", s.context);
        secret = s.secret;
      } else if (header.version === "aes128gcm") {
        keyInfo = Buffer.from("Content-Encoding: aes128gcm\0");
        nonceInfo = Buffer.from("Content-Encoding: nonce\0");
        secret = extractSecret(header, mode, lookupKeyCallback);
      } else {
        throw new Error("Unable to set context for mode " + header.version);
      }
      var prk = HKDF_extract(header.salt, secret);
      var result = {
        key: HKDF_expand(prk, keyInfo, KEY_LENGTH),
        nonce: HKDF_expand(prk, nonceInfo, NONCE_LENGTH)
      };
      keylog("key", result.key);
      keylog("nonce base", result.nonce);
      return result;
    }
    function parseParams(params) {
      var header = {};
      header.version = params.version || "aes128gcm";
      header.rs = parseInt(params.rs, 10);
      if (isNaN(header.rs)) {
        header.rs = 4096;
      }
      var overhead = PAD_SIZE[header.version];
      if (header.version === "aes128gcm") {
        overhead += TAG_LENGTH;
      }
      if (header.rs <= overhead) {
        throw new Error("The rs parameter has to be greater than " + overhead);
      }
      if (params.salt) {
        header.salt = decode(params.salt);
        if (header.salt.length !== KEY_LENGTH) {
          throw new Error("The salt parameter must be " + KEY_LENGTH + " bytes");
        }
      }
      header.keyid = params.keyid;
      if (params.key) {
        header.key = decode(params.key);
      } else {
        header.privateKey = params.privateKey;
        if (!header.privateKey) {
          header.keymap = params.keymap;
        }
        if (header.version !== "aes128gcm") {
          header.keylabel = params.keylabel || "P-256";
        }
        if (params.dh) {
          header.dh = decode(params.dh);
        }
      }
      if (params.authSecret) {
        header.authSecret = decode(params.authSecret);
      }
      return header;
    }
    function generateNonce(base, counter) {
      var nonce = Buffer.from(base);
      var m = nonce.readUIntBE(nonce.length - 6, 6);
      var x = ((m ^ counter) & 16777215) + ((m / 16777216 ^ counter / 16777216) & 16777215) * 16777216;
      nonce.writeUIntBE(x, nonce.length - 6, 6);
      keylog("nonce" + counter, nonce);
      return nonce;
    }
    function readHeader(buffer, header) {
      var idsz = buffer.readUIntBE(20, 1);
      header.salt = buffer.slice(0, KEY_LENGTH);
      header.rs = buffer.readUIntBE(KEY_LENGTH, 4);
      header.keyid = buffer.slice(21, 21 + idsz);
      return 21 + idsz;
    }
    function unpadLegacy(data, version) {
      var padSize = PAD_SIZE[version];
      var pad = data.readUIntBE(0, padSize);
      if (pad + padSize > data.length) {
        throw new Error("padding exceeds block size");
      }
      keylog("padding", data.slice(0, padSize + pad));
      var padCheck = Buffer.alloc(pad);
      padCheck.fill(0);
      if (padCheck.compare(data.slice(padSize, padSize + pad)) !== 0) {
        throw new Error("invalid padding");
      }
      return data.slice(padSize + pad);
    }
    function unpad(data, last) {
      var i = data.length - 1;
      while (i >= 0) {
        if (data[i]) {
          if (last) {
            if (data[i] !== 2) {
              throw new Error("last record needs to start padding with a 2");
            }
          } else {
            if (data[i] !== 1) {
              throw new Error("last record needs to start padding with a 2");
            }
          }
          return data.slice(0, i);
        }
        --i;
      }
      throw new Error("all zero plaintext");
    }
    function decryptRecord(key, counter, buffer, header, last) {
      keylog("decrypt", buffer);
      var nonce = generateNonce(key.nonce, counter);
      var gcm = crypto2.createDecipheriv(AES_GCM, key.key, nonce);
      gcm.setAuthTag(buffer.slice(buffer.length - TAG_LENGTH));
      var data = gcm.update(buffer.slice(0, buffer.length - TAG_LENGTH));
      data = Buffer.concat([data, gcm.final()]);
      keylog("decrypted", data);
      if (header.version !== "aes128gcm") {
        return unpadLegacy(data, header.version);
      }
      return unpad(data, last);
    }
    function decrypt(buffer, params, keyLookupCallback) {
      var header = parseParams(params);
      if (header.version === "aes128gcm") {
        var headerLength = readHeader(buffer, header);
        buffer = buffer.slice(headerLength);
      }
      var key = deriveKeyAndNonce(header, MODE_DECRYPT, keyLookupCallback);
      var start = 0;
      var result = Buffer.alloc(0);
      var chunkSize = header.rs;
      if (header.version !== "aes128gcm") {
        chunkSize += TAG_LENGTH;
      }
      for (var i = 0; start < buffer.length; ++i) {
        var end = start + chunkSize;
        if (header.version !== "aes128gcm" && end === buffer.length) {
          throw new Error("Truncated payload");
        }
        end = Math.min(end, buffer.length);
        if (end - start <= TAG_LENGTH) {
          throw new Error("Invalid block: too small at " + i);
        }
        var block = decryptRecord(
          key,
          i,
          buffer.slice(start, end),
          header,
          end >= buffer.length
        );
        result = Buffer.concat([result, block]);
        start = end;
      }
      return result;
    }
    function encryptRecord(key, counter, buffer, pad, header, last) {
      keylog("encrypt", buffer);
      pad = pad || 0;
      var nonce = generateNonce(key.nonce, counter);
      var gcm = crypto2.createCipheriv(AES_GCM, key.key, nonce);
      var ciphertext = [];
      var padSize = PAD_SIZE[header.version];
      var padding = Buffer.alloc(pad + padSize);
      padding.fill(0);
      if (header.version !== "aes128gcm") {
        padding.writeUIntBE(pad, 0, padSize);
        keylog("padding", padding);
        ciphertext.push(gcm.update(padding));
        ciphertext.push(gcm.update(buffer));
        if (!last && padding.length + buffer.length < header.rs) {
          throw new Error("Unable to pad to record size");
        }
      } else {
        ciphertext.push(gcm.update(buffer));
        padding.writeUIntBE(last ? 2 : 1, 0, 1);
        keylog("padding", padding);
        ciphertext.push(gcm.update(padding));
      }
      gcm.final();
      var tag = gcm.getAuthTag();
      if (tag.length !== TAG_LENGTH) {
        throw new Error("invalid tag generated");
      }
      ciphertext.push(tag);
      return keylog("encrypted", Buffer.concat(ciphertext));
    }
    function writeHeader(header) {
      var ints = Buffer.alloc(5);
      var keyid = Buffer.from(header.keyid || []);
      if (keyid.length > 255) {
        throw new Error("keyid is too large");
      }
      ints.writeUIntBE(header.rs, 0, 4);
      ints.writeUIntBE(keyid.length, 4, 1);
      return Buffer.concat([header.salt, ints, keyid]);
    }
    function encrypt(buffer, params, keyLookupCallback) {
      if (!Buffer.isBuffer(buffer)) {
        throw new Error("buffer argument must be a Buffer");
      }
      var header = parseParams(params);
      if (!header.salt) {
        header.salt = crypto2.randomBytes(KEY_LENGTH);
      }
      var result;
      if (header.version === "aes128gcm") {
        if (header.privateKey && !header.keyid) {
          header.keyid = header.privateKey.getPublicKey();
        }
        result = writeHeader(header);
      } else {
        result = Buffer.alloc(0);
      }
      var key = deriveKeyAndNonce(header, MODE_ENCRYPT, keyLookupCallback);
      var start = 0;
      var padSize = PAD_SIZE[header.version];
      var overhead = padSize;
      if (header.version === "aes128gcm") {
        overhead += TAG_LENGTH;
      }
      var pad = isNaN(parseInt(params.pad, 10)) ? 0 : parseInt(params.pad, 10);
      var counter = 0;
      var last = false;
      while (!last) {
        var recordPad = Math.min(header.rs - overhead - 1, pad);
        if (header.version !== "aes128gcm") {
          recordPad = Math.min((1 << padSize * 8) - 1, recordPad);
        }
        if (pad > 0 && recordPad === 0) {
          ++recordPad;
        }
        pad -= recordPad;
        var end = start + header.rs - overhead - recordPad;
        if (header.version !== "aes128gcm") {
          last = end > buffer.length;
        } else {
          last = end >= buffer.length;
        }
        last = last && pad <= 0;
        var block = encryptRecord(
          key,
          counter,
          buffer.slice(start, end),
          recordPad,
          header,
          last
        );
        result = Buffer.concat([result, block]);
        start = end;
        ++counter;
      }
      return result;
    }
    function isFunction(object) {
      return typeof object === "function";
    }
    module.exports = {
      decrypt,
      encrypt
    };
  }
});

// node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/encryption-helper.js
var require_encryption_helper = __commonJS({
  "node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/encryption-helper.js"(exports, module) {
    "use strict";
    var crypto2 = __require("crypto");
    var ece = require_ece();
    var encrypt = function(userPublicKey, userAuth, payload, contentEncoding) {
      if (!userPublicKey) {
        throw new Error("No user public key provided for encryption.");
      }
      if (typeof userPublicKey !== "string") {
        throw new Error("The subscription p256dh value must be a string.");
      }
      if (Buffer.from(userPublicKey, "base64url").length !== 65) {
        throw new Error("The subscription p256dh value should be 65 bytes long.");
      }
      if (!userAuth) {
        throw new Error("No user auth provided for encryption.");
      }
      if (typeof userAuth !== "string") {
        throw new Error("The subscription auth key must be a string.");
      }
      if (Buffer.from(userAuth, "base64url").length < 16) {
        throw new Error("The subscription auth key should be at least 16 bytes long");
      }
      if (typeof payload !== "string" && !Buffer.isBuffer(payload)) {
        throw new Error("Payload must be either a string or a Node Buffer.");
      }
      if (typeof payload === "string" || payload instanceof String) {
        payload = Buffer.from(payload);
      }
      const localCurve = crypto2.createECDH("prime256v1");
      const localPublicKey = localCurve.generateKeys();
      const salt = crypto2.randomBytes(16).toString("base64url");
      const cipherText = ece.encrypt(payload, {
        version: contentEncoding,
        dh: userPublicKey,
        privateKey: localCurve,
        salt,
        authSecret: userAuth
      });
      return {
        localPublicKey,
        salt,
        cipherText
      };
    };
    module.exports = {
      encrypt
    };
  }
});

// node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/web-push-error.js
var require_web_push_error = __commonJS({
  "node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/web-push-error.js"(exports, module) {
    "use strict";
    function WebPushError(message, statusCode, headers, body, endpoint) {
      Error.captureStackTrace(this, this.constructor);
      this.name = this.constructor.name;
      this.message = message;
      this.statusCode = statusCode;
      this.headers = headers;
      this.body = body;
      this.endpoint = endpoint;
    }
    __require("util").inherits(WebPushError, Error);
    module.exports = WebPushError;
  }
});

// node_modules/.pnpm/ms@2.1.3/node_modules/ms/index.js
var require_ms = __commonJS({
  "node_modules/.pnpm/ms@2.1.3/node_modules/ms/index.js"(exports, module) {
    var s = 1e3;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var w = d * 7;
    var y = d * 365.25;
    module.exports = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === "string" && val.length > 0) {
        return parse2(val);
      } else if (type === "number" && isFinite(val)) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error(
        "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
      );
    };
    function parse2(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match2 = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match2) {
        return;
      }
      var n = parseFloat(match2[1]);
      var type = (match2[2] || "ms").toLowerCase();
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

// node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/common.js
var require_common = __commonJS({
  "node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/common.js"(exports, module) {
    function setup(env) {
      createDebug.debug = createDebug;
      createDebug.default = createDebug;
      createDebug.coerce = coerce;
      createDebug.disable = disable;
      createDebug.enable = enable;
      createDebug.enabled = enabled;
      createDebug.humanize = require_ms();
      createDebug.destroy = destroy;
      Object.keys(env).forEach((key) => {
        createDebug[key] = env[key];
      });
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
        let enableOverride = null;
        let namespacesCache;
        let enabledCache;
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
          args[0] = args[0].replace(/%([a-zA-Z%])/g, (match2, format) => {
            if (match2 === "%%") {
              return "%";
            }
            index++;
            const formatter = createDebug.formatters[format];
            if (typeof formatter === "function") {
              const val = args[index];
              match2 = formatter.call(self, val);
              args.splice(index, 1);
              index--;
            }
            return match2;
          });
          createDebug.formatArgs.call(self, args);
          const logFn = self.log || createDebug.log;
          logFn.apply(self, args);
        }
        debug.namespace = namespace;
        debug.useColors = createDebug.useColors();
        debug.color = createDebug.selectColor(namespace);
        debug.extend = extend;
        debug.destroy = createDebug.destroy;
        Object.defineProperty(debug, "enabled", {
          enumerable: true,
          configurable: false,
          get: () => {
            if (enableOverride !== null) {
              return enableOverride;
            }
            if (namespacesCache !== createDebug.namespaces) {
              namespacesCache = createDebug.namespaces;
              enabledCache = createDebug.enabled(namespace);
            }
            return enabledCache;
          },
          set: (v) => {
            enableOverride = v;
          }
        });
        if (typeof createDebug.init === "function") {
          createDebug.init(debug);
        }
        return debug;
      }
      function extend(namespace, delimiter) {
        const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
        newDebug.log = this.log;
        return newDebug;
      }
      function enable(namespaces) {
        createDebug.save(namespaces);
        createDebug.namespaces = namespaces;
        createDebug.names = [];
        createDebug.skips = [];
        const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
        for (const ns of split) {
          if (ns[0] === "-") {
            createDebug.skips.push(ns.slice(1));
          } else {
            createDebug.names.push(ns);
          }
        }
      }
      function matchesTemplate(search, template) {
        let searchIndex = 0;
        let templateIndex = 0;
        let starIndex = -1;
        let matchIndex = 0;
        while (searchIndex < search.length) {
          if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
            if (template[templateIndex] === "*") {
              starIndex = templateIndex;
              matchIndex = searchIndex;
              templateIndex++;
            } else {
              searchIndex++;
              templateIndex++;
            }
          } else if (starIndex !== -1) {
            templateIndex = starIndex + 1;
            matchIndex++;
            searchIndex = matchIndex;
          } else {
            return false;
          }
        }
        while (templateIndex < template.length && template[templateIndex] === "*") {
          templateIndex++;
        }
        return templateIndex === template.length;
      }
      function disable() {
        const namespaces = [
          ...createDebug.names,
          ...createDebug.skips.map((namespace) => "-" + namespace)
        ].join(",");
        createDebug.enable("");
        return namespaces;
      }
      function enabled(name) {
        for (const skip of createDebug.skips) {
          if (matchesTemplate(name, skip)) {
            return false;
          }
        }
        for (const ns of createDebug.names) {
          if (matchesTemplate(name, ns)) {
            return true;
          }
        }
        return false;
      }
      function coerce(val) {
        if (val instanceof Error) {
          return val.stack || val.message;
        }
        return val;
      }
      function destroy() {
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }
      createDebug.enable(createDebug.load());
      return createDebug;
    }
    module.exports = setup;
  }
});

// node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/browser.js
var require_browser = __commonJS({
  "node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/browser.js"(exports, module) {
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage = localstorage();
    exports.destroy = /* @__PURE__ */ (() => {
      let warned = false;
      return () => {
        if (!warned) {
          warned = true;
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
      };
    })();
    exports.colors = [
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
      let m;
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function formatArgs(args) {
      args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
      if (!this.useColors) {
        return;
      }
      const c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      let index = 0;
      let lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, (match2) => {
        if (match2 === "%%") {
          return;
        }
        index++;
        if (match2 === "%c") {
          lastC = index;
        }
      });
      args.splice(lastC, 0, c);
    }
    exports.log = console.debug || console.log || (() => {
    });
    function save(namespaces) {
      try {
        if (namespaces) {
          exports.storage.setItem("debug", namespaces);
        } else {
          exports.storage.removeItem("debug");
        }
      } catch (error) {
      }
    }
    function load() {
      let r;
      try {
        r = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
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
    module.exports = require_common()(exports);
    var { formatters } = module.exports;
    formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (error) {
        return "[UnexpectedJSONParseError]: " + error.message;
      }
    };
  }
});

// node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/node.js
var require_node2 = __commonJS({
  "node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/node.js"(exports, module) {
    var tty = __require("tty");
    var util = __require("util");
    exports.init = init2;
    exports.log = log;
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.destroy = util.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    );
    exports.colors = [6, 2, 3, 4, 5, 1];
    try {
      const supportsColor = __require("supports-color");
      if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
        exports.colors = [
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
    exports.inspectOpts = Object.keys(process.env).filter((key) => {
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
      return "colors" in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty.isatty(process.stderr.fd);
    }
    function formatArgs(args) {
      const { namespace: name, useColors: useColors2 } = this;
      if (useColors2) {
        const c = this.color;
        const colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
        const prefix = `  ${colorCode};1m${name} \x1B[0m`;
        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push(colorCode + "m+" + module.exports.humanize(this.diff) + "\x1B[0m");
      } else {
        args[0] = getDate() + name + " " + args[0];
      }
    }
    function getDate() {
      if (exports.inspectOpts.hideDate) {
        return "";
      }
      return (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function log(...args) {
      return process.stderr.write(util.formatWithOptions(exports.inspectOpts, ...args) + "\n");
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
    function init2(debug) {
      debug.inspectOpts = {};
      const keys = Object.keys(exports.inspectOpts);
      for (let i = 0; i < keys.length; i++) {
        debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
      }
    }
    module.exports = require_common()(exports);
    var { formatters } = module.exports;
    formatters.o = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts).split("\n").map((str) => str.trim()).join(" ");
    };
    formatters.O = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts);
    };
  }
});

// node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/index.js
var require_src = __commonJS({
  "node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/index.js"(exports, module) {
    if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) {
      module.exports = require_browser();
    } else {
      module.exports = require_node2();
    }
  }
});

// node_modules/.pnpm/agent-base@7.1.4/node_modules/agent-base/dist/helpers.js
var require_helpers = __commonJS({
  "node_modules/.pnpm/agent-base@7.1.4/node_modules/agent-base/dist/helpers.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.req = exports.json = exports.toBuffer = void 0;
    var http = __importStar(__require("http"));
    var https = __importStar(__require("https"));
    async function toBuffer(stream) {
      let length = 0;
      const chunks = [];
      for await (const chunk of stream) {
        length += chunk.length;
        chunks.push(chunk);
      }
      return Buffer.concat(chunks, length);
    }
    exports.toBuffer = toBuffer;
    async function json(stream) {
      const buf = await toBuffer(stream);
      const str = buf.toString("utf8");
      try {
        return JSON.parse(str);
      } catch (_err) {
        const err = _err;
        err.message += ` (input: ${str})`;
        throw err;
      }
    }
    exports.json = json;
    function req(url, opts = {}) {
      const href = typeof url === "string" ? url : url.href;
      const req2 = (href.startsWith("https:") ? https : http).request(url, opts);
      const promise = new Promise((resolve, reject) => {
        req2.once("response", resolve).once("error", reject).end();
      });
      req2.then = promise.then.bind(promise);
      return req2;
    }
    exports.req = req;
  }
});

// node_modules/.pnpm/agent-base@7.1.4/node_modules/agent-base/dist/index.js
var require_dist = __commonJS({
  "node_modules/.pnpm/agent-base@7.1.4/node_modules/agent-base/dist/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Agent = void 0;
    var net = __importStar(__require("net"));
    var http = __importStar(__require("http"));
    var https_1 = __require("https");
    __exportStar(require_helpers(), exports);
    var INTERNAL = /* @__PURE__ */ Symbol("AgentBaseInternalState");
    var Agent = class extends http.Agent {
      constructor(opts) {
        super(opts);
        this[INTERNAL] = {};
      }
      /**
       * Determine whether this is an `http` or `https` request.
       */
      isSecureEndpoint(options) {
        if (options) {
          if (typeof options.secureEndpoint === "boolean") {
            return options.secureEndpoint;
          }
          if (typeof options.protocol === "string") {
            return options.protocol === "https:";
          }
        }
        const { stack } = new Error();
        if (typeof stack !== "string")
          return false;
        return stack.split("\n").some((l) => l.indexOf("(https.js:") !== -1 || l.indexOf("node:https:") !== -1);
      }
      // In order to support async signatures in `connect()` and Node's native
      // connection pooling in `http.Agent`, the array of sockets for each origin
      // has to be updated synchronously. This is so the length of the array is
      // accurate when `addRequest()` is next called. We achieve this by creating a
      // fake socket and adding it to `sockets[origin]` and incrementing
      // `totalSocketCount`.
      incrementSockets(name) {
        if (this.maxSockets === Infinity && this.maxTotalSockets === Infinity) {
          return null;
        }
        if (!this.sockets[name]) {
          this.sockets[name] = [];
        }
        const fakeSocket = new net.Socket({ writable: false });
        this.sockets[name].push(fakeSocket);
        this.totalSocketCount++;
        return fakeSocket;
      }
      decrementSockets(name, socket) {
        if (!this.sockets[name] || socket === null) {
          return;
        }
        const sockets = this.sockets[name];
        const index = sockets.indexOf(socket);
        if (index !== -1) {
          sockets.splice(index, 1);
          this.totalSocketCount--;
          if (sockets.length === 0) {
            delete this.sockets[name];
          }
        }
      }
      // In order to properly update the socket pool, we need to call `getName()` on
      // the core `https.Agent` if it is a secureEndpoint.
      getName(options) {
        const secureEndpoint = this.isSecureEndpoint(options);
        if (secureEndpoint) {
          return https_1.Agent.prototype.getName.call(this, options);
        }
        return super.getName(options);
      }
      createSocket(req, options, cb) {
        const connectOpts = {
          ...options,
          secureEndpoint: this.isSecureEndpoint(options)
        };
        const name = this.getName(connectOpts);
        const fakeSocket = this.incrementSockets(name);
        Promise.resolve().then(() => this.connect(req, connectOpts)).then((socket) => {
          this.decrementSockets(name, fakeSocket);
          if (socket instanceof http.Agent) {
            try {
              return socket.addRequest(req, connectOpts);
            } catch (err) {
              return cb(err);
            }
          }
          this[INTERNAL].currentSocket = socket;
          super.createSocket(req, options, cb);
        }, (err) => {
          this.decrementSockets(name, fakeSocket);
          cb(err);
        });
      }
      createConnection() {
        const socket = this[INTERNAL].currentSocket;
        this[INTERNAL].currentSocket = void 0;
        if (!socket) {
          throw new Error("No socket was returned in the `connect()` function");
        }
        return socket;
      }
      get defaultPort() {
        return this[INTERNAL].defaultPort ?? (this.protocol === "https:" ? 443 : 80);
      }
      set defaultPort(v) {
        if (this[INTERNAL]) {
          this[INTERNAL].defaultPort = v;
        }
      }
      get protocol() {
        return this[INTERNAL].protocol ?? (this.isSecureEndpoint() ? "https:" : "http:");
      }
      set protocol(v) {
        if (this[INTERNAL]) {
          this[INTERNAL].protocol = v;
        }
      }
    };
    exports.Agent = Agent;
  }
});

// node_modules/.pnpm/https-proxy-agent@7.0.6/node_modules/https-proxy-agent/dist/parse-proxy-response.js
var require_parse_proxy_response = __commonJS({
  "node_modules/.pnpm/https-proxy-agent@7.0.6/node_modules/https-proxy-agent/dist/parse-proxy-response.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseProxyResponse = void 0;
    var debug_1 = __importDefault(require_src());
    var debug = (0, debug_1.default)("https-proxy-agent:parse-proxy-response");
    function parseProxyResponse(socket) {
      return new Promise((resolve, reject) => {
        let buffersLength = 0;
        const buffers = [];
        function read() {
          const b = socket.read();
          if (b)
            ondata(b);
          else
            socket.once("readable", read);
        }
        function cleanup() {
          socket.removeListener("end", onend);
          socket.removeListener("error", onerror);
          socket.removeListener("readable", read);
        }
        function onend() {
          cleanup();
          debug("onend");
          reject(new Error("Proxy connection ended before receiving CONNECT response"));
        }
        function onerror(err) {
          cleanup();
          debug("onerror %o", err);
          reject(err);
        }
        function ondata(b) {
          buffers.push(b);
          buffersLength += b.length;
          const buffered = Buffer.concat(buffers, buffersLength);
          const endOfHeaders = buffered.indexOf("\r\n\r\n");
          if (endOfHeaders === -1) {
            debug("have not received end of HTTP headers yet...");
            read();
            return;
          }
          const headerParts = buffered.slice(0, endOfHeaders).toString("ascii").split("\r\n");
          const firstLine = headerParts.shift();
          if (!firstLine) {
            socket.destroy();
            return reject(new Error("No header received from proxy CONNECT response"));
          }
          const firstLineParts = firstLine.split(" ");
          const statusCode = +firstLineParts[1];
          const statusText = firstLineParts.slice(2).join(" ");
          const headers = {};
          for (const header of headerParts) {
            if (!header)
              continue;
            const firstColon = header.indexOf(":");
            if (firstColon === -1) {
              socket.destroy();
              return reject(new Error(`Invalid header from proxy CONNECT response: "${header}"`));
            }
            const key = header.slice(0, firstColon).toLowerCase();
            const value = header.slice(firstColon + 1).trimStart();
            const current = headers[key];
            if (typeof current === "string") {
              headers[key] = [current, value];
            } else if (Array.isArray(current)) {
              current.push(value);
            } else {
              headers[key] = value;
            }
          }
          debug("got proxy server response: %o %o", firstLine, headers);
          cleanup();
          resolve({
            connect: {
              statusCode,
              statusText,
              headers
            },
            buffered
          });
        }
        socket.on("error", onerror);
        socket.on("end", onend);
        read();
      });
    }
    exports.parseProxyResponse = parseProxyResponse;
  }
});

// node_modules/.pnpm/https-proxy-agent@7.0.6/node_modules/https-proxy-agent/dist/index.js
var require_dist2 = __commonJS({
  "node_modules/.pnpm/https-proxy-agent@7.0.6/node_modules/https-proxy-agent/dist/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HttpsProxyAgent = void 0;
    var net = __importStar(__require("net"));
    var tls = __importStar(__require("tls"));
    var assert_1 = __importDefault(__require("assert"));
    var debug_1 = __importDefault(require_src());
    var agent_base_1 = require_dist();
    var url_1 = __require("url");
    var parse_proxy_response_1 = require_parse_proxy_response();
    var debug = (0, debug_1.default)("https-proxy-agent");
    var setServernameFromNonIpHost = (options) => {
      if (options.servername === void 0 && options.host && !net.isIP(options.host)) {
        return {
          ...options,
          servername: options.host
        };
      }
      return options;
    };
    var HttpsProxyAgent = class extends agent_base_1.Agent {
      constructor(proxy, opts) {
        super(opts);
        this.options = { path: void 0 };
        this.proxy = typeof proxy === "string" ? new url_1.URL(proxy) : proxy;
        this.proxyHeaders = opts?.headers ?? {};
        debug("Creating new HttpsProxyAgent instance: %o", this.proxy.href);
        const host = (this.proxy.hostname || this.proxy.host).replace(/^\[|\]$/g, "");
        const port = this.proxy.port ? parseInt(this.proxy.port, 10) : this.proxy.protocol === "https:" ? 443 : 80;
        this.connectOpts = {
          // Attempt to negotiate http/1.1 for proxy servers that support http/2
          ALPNProtocols: ["http/1.1"],
          ...opts ? omit(opts, "headers") : null,
          host,
          port
        };
      }
      /**
       * Called when the node-core HTTP client library is creating a
       * new HTTP request.
       */
      async connect(req, opts) {
        const { proxy } = this;
        if (!opts.host) {
          throw new TypeError('No "host" provided');
        }
        let socket;
        if (proxy.protocol === "https:") {
          debug("Creating `tls.Socket`: %o", this.connectOpts);
          socket = tls.connect(setServernameFromNonIpHost(this.connectOpts));
        } else {
          debug("Creating `net.Socket`: %o", this.connectOpts);
          socket = net.connect(this.connectOpts);
        }
        const headers = typeof this.proxyHeaders === "function" ? this.proxyHeaders() : { ...this.proxyHeaders };
        const host = net.isIPv6(opts.host) ? `[${opts.host}]` : opts.host;
        let payload = `CONNECT ${host}:${opts.port} HTTP/1.1\r
`;
        if (proxy.username || proxy.password) {
          const auth = `${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`;
          headers["Proxy-Authorization"] = `Basic ${Buffer.from(auth).toString("base64")}`;
        }
        headers.Host = `${host}:${opts.port}`;
        if (!headers["Proxy-Connection"]) {
          headers["Proxy-Connection"] = this.keepAlive ? "Keep-Alive" : "close";
        }
        for (const name of Object.keys(headers)) {
          payload += `${name}: ${headers[name]}\r
`;
        }
        const proxyResponsePromise = (0, parse_proxy_response_1.parseProxyResponse)(socket);
        socket.write(`${payload}\r
`);
        const { connect, buffered } = await proxyResponsePromise;
        req.emit("proxyConnect", connect);
        this.emit("proxyConnect", connect, req);
        if (connect.statusCode === 200) {
          req.once("socket", resume);
          if (opts.secureEndpoint) {
            debug("Upgrading socket connection to TLS");
            return tls.connect({
              ...omit(setServernameFromNonIpHost(opts), "host", "path", "port"),
              socket
            });
          }
          return socket;
        }
        socket.destroy();
        const fakeSocket = new net.Socket({ writable: false });
        fakeSocket.readable = true;
        req.once("socket", (s) => {
          debug("Replaying proxy buffer for failed request");
          (0, assert_1.default)(s.listenerCount("data") > 0);
          s.push(buffered);
          s.push(null);
        });
        return fakeSocket;
      }
    };
    HttpsProxyAgent.protocols = ["http", "https"];
    exports.HttpsProxyAgent = HttpsProxyAgent;
    function resume(socket) {
      socket.resume();
    }
    function omit(obj, ...keys) {
      const ret = {};
      let key;
      for (key in obj) {
        if (!keys.includes(key)) {
          ret[key] = obj[key];
        }
      }
      return ret;
    }
  }
});

// node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/web-push-lib.js
var require_web_push_lib = __commonJS({
  "node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/web-push-lib.js"(exports, module) {
    "use strict";
    var url = __require("url");
    var https = __require("https");
    var WebPushError = require_web_push_error();
    var vapidHelper = require_vapid_helper();
    var encryptionHelper = require_encryption_helper();
    var webPushConstants = require_web_push_constants();
    var urlBase64Helper = require_urlsafe_base64_helper();
    var DEFAULT_TTL = 2419200;
    var gcmAPIKey = "";
    var vapidDetails;
    function WebPushLib() {
    }
    WebPushLib.prototype.setGCMAPIKey = function(apiKey) {
      if (apiKey === null) {
        gcmAPIKey = null;
        return;
      }
      if (typeof apiKey === "undefined" || typeof apiKey !== "string" || apiKey.length === 0) {
        throw new Error("The GCM API Key should be a non-empty string or null.");
      }
      gcmAPIKey = apiKey;
    };
    WebPushLib.prototype.setVapidDetails = function(subject, publicKey, privateKey) {
      if (arguments.length === 1 && arguments[0] === null) {
        vapidDetails = null;
        return;
      }
      vapidHelper.validateSubject(subject);
      vapidHelper.validatePublicKey(publicKey);
      vapidHelper.validatePrivateKey(privateKey);
      vapidDetails = {
        subject,
        publicKey,
        privateKey
      };
    };
    WebPushLib.prototype.generateRequestDetails = function(subscription, payload, options) {
      if (!subscription || !subscription.endpoint) {
        throw new Error("You must pass in a subscription with at least an endpoint.");
      }
      if (typeof subscription.endpoint !== "string" || subscription.endpoint.length === 0) {
        throw new Error("The subscription endpoint must be a string with a valid URL.");
      }
      if (payload) {
        if (typeof subscription !== "object" || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
          throw new Error("To send a message with a payload, the subscription must have 'auth' and 'p256dh' keys.");
        }
      }
      let currentGCMAPIKey = gcmAPIKey;
      let currentVapidDetails = vapidDetails;
      let timeToLive = DEFAULT_TTL;
      let extraHeaders = {};
      let contentEncoding = webPushConstants.supportedContentEncodings.AES_128_GCM;
      let urgency = webPushConstants.supportedUrgency.NORMAL;
      let topic;
      let proxy;
      let agent;
      let timeout;
      if (options) {
        const validOptionKeys = [
          "headers",
          "gcmAPIKey",
          "vapidDetails",
          "TTL",
          "contentEncoding",
          "urgency",
          "topic",
          "proxy",
          "agent",
          "timeout"
        ];
        const optionKeys = Object.keys(options);
        for (let i = 0; i < optionKeys.length; i += 1) {
          const optionKey = optionKeys[i];
          if (!validOptionKeys.includes(optionKey)) {
            throw new Error("'" + optionKey + "' is an invalid option. The valid options are ['" + validOptionKeys.join("', '") + "'].");
          }
        }
        if (options.headers) {
          extraHeaders = options.headers;
          let duplicates = Object.keys(extraHeaders).filter(function(header) {
            return typeof options[header] !== "undefined";
          });
          if (duplicates.length > 0) {
            throw new Error("Duplicated headers defined [" + duplicates.join(",") + "]. Please either define the header in thetop level options OR in the 'headers' key.");
          }
        }
        if (options.gcmAPIKey) {
          currentGCMAPIKey = options.gcmAPIKey;
        }
        if (options.vapidDetails !== void 0) {
          currentVapidDetails = options.vapidDetails;
        }
        if (options.TTL !== void 0) {
          timeToLive = Number(options.TTL);
          if (timeToLive < 0) {
            throw new Error("TTL should be a number and should be at least 0");
          }
        }
        if (options.contentEncoding) {
          if (options.contentEncoding === webPushConstants.supportedContentEncodings.AES_128_GCM || options.contentEncoding === webPushConstants.supportedContentEncodings.AES_GCM) {
            contentEncoding = options.contentEncoding;
          } else {
            throw new Error("Unsupported content encoding specified.");
          }
        }
        if (options.urgency) {
          if (options.urgency === webPushConstants.supportedUrgency.VERY_LOW || options.urgency === webPushConstants.supportedUrgency.LOW || options.urgency === webPushConstants.supportedUrgency.NORMAL || options.urgency === webPushConstants.supportedUrgency.HIGH) {
            urgency = options.urgency;
          } else {
            throw new Error("Unsupported urgency specified.");
          }
        }
        if (options.topic) {
          if (!urlBase64Helper.validate(options.topic)) {
            throw new Error("Unsupported characters set use the URL or filename-safe Base64 characters set");
          }
          if (options.topic.length > 32) {
            throw new Error("use maximum of 32 characters from the URL or filename-safe Base64 characters set");
          }
          topic = options.topic;
        }
        if (options.proxy) {
          if (typeof options.proxy === "string" || typeof options.proxy.host === "string") {
            proxy = options.proxy;
          } else {
            console.warn("Attempt to use proxy option, but invalid type it should be a string or proxy options object.");
          }
        }
        if (options.agent) {
          if (options.agent instanceof https.Agent) {
            if (proxy) {
              console.warn("Agent option will be ignored because proxy option is defined.");
            }
            agent = options.agent;
          } else {
            console.warn("Wrong type for the agent option, it should be an instance of https.Agent.");
          }
        }
        if (typeof options.timeout === "number") {
          timeout = options.timeout;
        }
      }
      if (typeof timeToLive === "undefined") {
        timeToLive = DEFAULT_TTL;
      }
      const requestDetails = {
        method: "POST",
        headers: {
          TTL: timeToLive
        }
      };
      Object.keys(extraHeaders).forEach(function(header) {
        requestDetails.headers[header] = extraHeaders[header];
      });
      let requestPayload = null;
      if (payload) {
        const encrypted = encryptionHelper.encrypt(subscription.keys.p256dh, subscription.keys.auth, payload, contentEncoding);
        requestDetails.headers["Content-Length"] = encrypted.cipherText.length;
        requestDetails.headers["Content-Type"] = "application/octet-stream";
        if (contentEncoding === webPushConstants.supportedContentEncodings.AES_128_GCM) {
          requestDetails.headers["Content-Encoding"] = webPushConstants.supportedContentEncodings.AES_128_GCM;
        } else if (contentEncoding === webPushConstants.supportedContentEncodings.AES_GCM) {
          requestDetails.headers["Content-Encoding"] = webPushConstants.supportedContentEncodings.AES_GCM;
          requestDetails.headers.Encryption = "salt=" + encrypted.salt;
          requestDetails.headers["Crypto-Key"] = "dh=" + encrypted.localPublicKey.toString("base64url");
        }
        requestPayload = encrypted.cipherText;
      } else {
        requestDetails.headers["Content-Length"] = 0;
      }
      const isGCM = subscription.endpoint.startsWith("https://android.googleapis.com/gcm/send");
      const isFCM = subscription.endpoint.startsWith("https://fcm.googleapis.com/fcm/send");
      if (isGCM) {
        if (!currentGCMAPIKey) {
          console.warn("Attempt to send push notification to GCM endpoint, but no GCM key is defined. Please use setGCMApiKey() or add 'gcmAPIKey' as an option.");
        } else {
          requestDetails.headers.Authorization = "key=" + currentGCMAPIKey;
        }
      } else if (currentVapidDetails) {
        const parsedUrl = url.parse(subscription.endpoint);
        const audience = parsedUrl.protocol + "//" + parsedUrl.host;
        const vapidHeaders = vapidHelper.getVapidHeaders(
          audience,
          currentVapidDetails.subject,
          currentVapidDetails.publicKey,
          currentVapidDetails.privateKey,
          contentEncoding
        );
        requestDetails.headers.Authorization = vapidHeaders.Authorization;
        if (contentEncoding === webPushConstants.supportedContentEncodings.AES_GCM) {
          if (requestDetails.headers["Crypto-Key"]) {
            requestDetails.headers["Crypto-Key"] += ";" + vapidHeaders["Crypto-Key"];
          } else {
            requestDetails.headers["Crypto-Key"] = vapidHeaders["Crypto-Key"];
          }
        }
      } else if (isFCM && currentGCMAPIKey) {
        requestDetails.headers.Authorization = "key=" + currentGCMAPIKey;
      }
      requestDetails.headers.Urgency = urgency;
      if (topic) {
        requestDetails.headers.Topic = topic;
      }
      requestDetails.body = requestPayload;
      requestDetails.endpoint = subscription.endpoint;
      if (proxy) {
        requestDetails.proxy = proxy;
      }
      if (agent) {
        requestDetails.agent = agent;
      }
      if (timeout) {
        requestDetails.timeout = timeout;
      }
      return requestDetails;
    };
    WebPushLib.prototype.sendNotification = function(subscription, payload, options) {
      let requestDetails;
      try {
        requestDetails = this.generateRequestDetails(subscription, payload, options);
      } catch (err) {
        return Promise.reject(err);
      }
      return new Promise(function(resolve, reject) {
        const httpsOptions = {};
        const urlParts = url.parse(requestDetails.endpoint);
        httpsOptions.hostname = urlParts.hostname;
        httpsOptions.port = urlParts.port;
        httpsOptions.path = urlParts.path;
        httpsOptions.headers = requestDetails.headers;
        httpsOptions.method = requestDetails.method;
        if (requestDetails.timeout) {
          httpsOptions.timeout = requestDetails.timeout;
        }
        if (requestDetails.agent) {
          httpsOptions.agent = requestDetails.agent;
        }
        if (requestDetails.proxy) {
          const { HttpsProxyAgent } = require_dist2();
          httpsOptions.agent = new HttpsProxyAgent(requestDetails.proxy);
        }
        const pushRequest = https.request(httpsOptions, function(pushResponse) {
          let responseText = "";
          pushResponse.on("data", function(chunk) {
            responseText += chunk;
          });
          pushResponse.on("end", function() {
            if (pushResponse.statusCode < 200 || pushResponse.statusCode > 299) {
              reject(new WebPushError(
                "Received unexpected response code",
                pushResponse.statusCode,
                pushResponse.headers,
                responseText,
                requestDetails.endpoint
              ));
            } else {
              resolve({
                statusCode: pushResponse.statusCode,
                body: responseText,
                headers: pushResponse.headers
              });
            }
          });
        });
        if (requestDetails.timeout) {
          pushRequest.on("timeout", function() {
            pushRequest.destroy(new Error("Socket timeout"));
          });
        }
        pushRequest.on("error", function(e) {
          reject(e);
        });
        if (requestDetails.body) {
          pushRequest.write(requestDetails.body);
        }
        pushRequest.end();
      });
    };
    module.exports = WebPushLib;
  }
});

// node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/index.js
var require_src2 = __commonJS({
  "node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/index.js"(exports, module) {
    "use strict";
    var vapidHelper = require_vapid_helper();
    var encryptionHelper = require_encryption_helper();
    var WebPushLib = require_web_push_lib();
    var WebPushError = require_web_push_error();
    var WebPushConstants = require_web_push_constants();
    var webPush = new WebPushLib();
    module.exports = {
      WebPushError,
      supportedContentEncodings: WebPushConstants.supportedContentEncodings,
      encrypt: encryptionHelper.encrypt,
      getVapidHeaders: vapidHelper.getVapidHeaders,
      generateVAPIDKeys: vapidHelper.generateVAPIDKeys,
      setGCMAPIKey: webPush.setGCMAPIKey,
      setVapidDetails: webPush.setVapidDetails,
      generateRequestDetails: webPush.generateRequestDetails,
      sendNotification: webPush.sendNotification.bind(webPush)
    };
  }
});

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/http-exception.js
var HTTPException = class extends Error {
  res;
  status;
  /**
  * Creates an instance of `HTTPException`.
  * @param status - HTTP status code for the exception. Defaults to 500.
  * @param options - Additional options for the exception.
  */
  constructor(status = 500, options) {
    super(options?.message, { cause: options?.cause });
    this.res = options?.res;
    this.status = status;
  }
  /**
  * Returns the response object associated with the exception.
  * If a response object is not provided, a new response is created with the error message and status code.
  * @returns The response object.
  */
  getResponse() {
    if (this.res) return new Response(this.res.body, {
      status: this.status,
      headers: this.res.headers
    });
    return new Response(this.message, { status: this.status });
  }
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/utils/buffer.js
var bufferToFormData = (arrayBuffer, contentType) => {
  return new Response(arrayBuffer, { headers: { "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase()) } }).formData();
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/utils/body.js
var MAX_NESTED_OBJECTS = 1e4;
var isRawRequest = (request) => "headers" in request;
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const mediaType = (isRawRequest(request) ? request.headers : request.raw.headers).get("Content-Type")?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") return parseFormData(request, {
    all,
    dot
  });
  return {};
};
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData) return convertFormDataToBodyData(await request.bodyCache.formData, options);
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request)) request.bodyCache.formData = formDataPromise;
  const formData = await formDataPromise;
  if (formData) return convertFormDataToBodyData(formData, options);
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  const nestingState = { count: 0 };
  formData.forEach((value, key) => {
    if (!(options.all || key.endsWith("[]"))) form[key] = value;
    else handleParsingAllValues(form, key, value);
  });
  if (options.dot) Object.entries(form).forEach(([key, value]) => {
    if (key.includes(".")) {
      handleParsingNestedValues(form, key, value, nestingState);
      delete form[key];
    }
  });
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) form[key].push(value);
    else form[key] = [form[key], value];
  } else if (!key.endsWith("[]")) form[key] = value;
  else form[key] = [value];
};
var handleParsingNestedValues = (form, key, value, state) => {
  if (/(?:^|\.)__proto__\./.test(key)) return;
  let nestedForm = form;
  const keys = key.split(".", 34);
  if (keys.length > 33) throwNestingLimitExceeded();
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) nestedForm[key2] = value;
    else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        if (state.count++ >= MAX_NESTED_OBJECTS) throwNestingLimitExceeded();
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};
var throwNestingLimitExceeded = () => {
  throw new Error("Nesting limit exceeded");
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/utils/url.js
var splitPath = (path) => {
  const paths = path.split("/");
  if (paths[0] === "") paths.shift();
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return {
    groups,
    path
  };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) if (paths[j].includes(mark)) {
      paths[j] = paths[j].replace(mark, groups[i][1]);
      break;
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") return "*";
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [
        cacheKey,
        match2[1],
        new RegExp(`^${match2[2]}(?=/${next})`)
      ] : [
        label,
        match2[1],
        new RegExp(`^${match2[2]}$`)
      ];
      else patternCache[cacheKey] = [
        label,
        match2[1],
        true
      ];
    }
    return patternCache[cacheKey];
  }
  return null;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) break;
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var stripPathPrefix = (rawPath, decodedPath, prefixLength) => {
  if (rawPath.at(-1) === "/" && decodedPath.at(-1) !== "/") rawPath = rawPath.slice(0, -1);
  let index = 0;
  for (let i = decodedPath.indexOf("/"); i !== -1 && i < prefixLength; i = decodedPath.indexOf("/", i + 1)) {
    index = rawPath.indexOf("/", index + 1);
    if (index === -1) return "/";
  }
  return rawPath.slice(index) || "/";
};
var mergePath = (base, sub, ...rest) => {
  if (rest.length) sub = mergePath(sub, ...rest);
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) return null;
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) basePath += "/" + segment;
    else if (/\:/.test(segment)) {
      if (segment.charCodeAt(segment.length - 1) === 63) {
        if (results.length === 0 && basePath === "") results.push("/");
        else results.push(basePath);
        const optionalSegment = segment.slice(0, -1);
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else basePath += "/" + segment;
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var tryDecodeURIComponent = (str) => str.indexOf("%") !== -1 ? tryDecode(str, decodeURIComponent_) : str;
var _decodeURI = (value) => {
  if (value.indexOf("+") !== -1) value = value.replace(/\+/g, " ");
  return tryDecodeURIComponent(value);
};
var _getQueryParam = (url, key, multiple) => {
  const hashIndex = url.indexOf("#", 8);
  if (hashIndex !== -1) url = url.slice(0, hashIndex);
  let encoded;
  if (!multiple && key && key.indexOf("%") === -1 && key.indexOf("+") === -1) {
    const queryIndex = url.indexOf("?", 8);
    let keyIndex2 = queryIndex;
    if (keyIndex2 === -1) return;
    if (!url.startsWith(key, keyIndex2 + 1)) keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61 || trailingKeyCode === 38 || isNaN(trailingKeyCode)) {
        if (keyIndex2 > queryIndex && /(?:^|&)[^=&]*[%+]/.test(url.slice(queryIndex + 1, keyIndex2))) break;
        if (trailingKeyCode === 61) {
          const valueIndex = keyIndex2 + key.length + 2;
          const endIndex = url.indexOf("&", valueIndex);
          return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
        }
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) return;
  }
  const results = /* @__PURE__ */ Object.create(null);
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) valueIndex = -1;
    let name = url.slice(keyIndex + 1, valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex);
    if (encoded) name = _decodeURI(name);
    keyIndex = nextKeyIndex;
    if (name === "") continue;
    let value;
    if (valueIndex === -1) value = "";
    else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) value = _decodeURI(value);
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) results[name] = [];
      results[name].push(value);
    } else results[name] ??= value;
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/request.js
var HonoRequest = class {
  /**
  * `.raw` can get the raw Request object.
  *
  * @see {@link https://hono.dev/docs/api/request#raw}
  *
  * @example
  * ```ts
  * // For Cloudflare Workers
  * app.post('/', async (c) => {
  *   const metadata = c.req.raw.cf?.hostMetadata?
  *   ...
  * })
  * ```
  */
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  /**
  * `.path` can get the pathname of the request.
  *
  * @see {@link https://hono.dev/docs/api/request#path}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const pathname = c.req.path // `/about/me`
  * })
  * ```
  */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex]?.[1][key];
    const param = this.#getParamValue(paramKey);
    return param && tryDecodeURIComponent(param);
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex]?.[1] ?? {});
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) decoded[key] = tryDecodeURIComponent(value);
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) return this.raw.headers.get(name) ?? void 0;
    const headerData = /* @__PURE__ */ Object.create(null);
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) return cachedBody;
    for (const anyCachedKey in bodyCache) return bodyCache[anyCachedKey].then((body) => {
      if (anyCachedKey === "json") body = JSON.stringify(body);
      const contentType = anyCachedKey === "formData" ? void 0 : raw2.headers.get("content-type");
      return new Response(body, { headers: contentType ? { "Content-Type": contentType } : void 0 })[key]();
    });
    return bodyCache[key] = raw2[key]();
  };
  /**
  * `.json()` can parse Request body of type `application/json`
  *
  * @see {@link https://hono.dev/docs/api/request#json}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.json()
  * })
  * ```
  */
  json() {
    return this.#cachedBody("text").then((text2) => JSON.parse(text2));
  }
  /**
  * `.text()` can parse Request body of type `text/plain`
  *
  * @see {@link https://hono.dev/docs/api/request#text}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.text()
  * })
  * ```
  */
  text() {
    return this.#cachedBody("text");
  }
  /**
  * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
  *
  * @see {@link https://hono.dev/docs/api/request#arraybuffer}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.arrayBuffer()
  * })
  * ```
  */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
  * `.bytes()` parses the request body as a `Uint8Array`.
  *
  * @see {@link https://hono.dev/docs/api/request#bytes}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.bytes()
  * })
  * ```
  */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
  * Parses the request body as a `Blob`.
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.blob();
  * });
  * ```
  * @see https://hono.dev/docs/api/request#blob
  */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
  * Parses the request body as `FormData`.
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.formData();
  * });
  * ```
  * @see https://hono.dev/docs/api/request#formdata
  */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
  * Adds validated data to the request.
  *
  * @param target - The target of the validation.
  * @param data - The validated data to add.
  */
  addValidatedData(target, data) {
    (this.#validatedData ??= {})[target] = data;
  }
  valid(target) {
    return this.#validatedData?.[target];
  }
  /**
  * `.url` can get the request url strings.
  *
  * @see {@link https://hono.dev/docs/api/request#url}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const url = c.req.url // `http://localhost:8787/about/me`
  *   ...
  * })
  * ```
  */
  get url() {
    return this.raw.url;
  }
  /**
  * `.method` can get the method name of the request.
  *
  * @see {@link https://hono.dev/docs/api/request#method}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const method = c.req.method // `GET`
  * })
  * ```
  */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
  * `.matchedRoutes` can return a matched route in the handler
  *
  * @deprecated
  *
  * Use matchedRoutes helper defined in "hono/route" instead.
  *
  * @see {@link https://hono.dev/docs/api/request#matchedroutes}
  *
  * @example
  * ```ts
  * app.use('*', async function logger(c, next) {
  *   await next()
  *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
  *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
  *     console.log(
  *       method,
  *       ' ',
  *       path,
  *       ' '.repeat(Math.max(10 - path.length, 0)),
  *       name,
  *       i === c.req.routeIndex ? '<- respond from here' : ''
  *     )
  *   })
  * })
  * ```
  */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
  * `.routePath` can retrieve the path registered within the handler
  *
  * @deprecated
  *
  * Use routePath helper defined in "hono/route" instead.
  *
  * @see {@link https://hono.dev/docs/api/request#routepath}
  *
  * @example
  * ```ts
  * app.get('/posts/:id', (c) => {
  *   return c.json({ path: c.req.routePath })
  * })
  * ```
  */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) str = str.toString();
    if (str instanceof Promise) str = await str;
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) return Promise.resolve(str);
  if (buffer) buffer[0] += str;
  else buffer = [str];
  const resStr = Promise.all(callbacks.map((c) => c({
    phase,
    buffer,
    context
  }))).then((res) => Promise.all(res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))).then(() => buffer[0]));
  if (preserveCallbacks) return raw(await resStr, callbacks);
  else return resStr;
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
};
var createResponseInstance = (body, init2) => new Response(body, init2);
var Context = class {
  #rawRequest;
  #req;
  /**
  * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
  *
  * @see {@link https://hono.dev/docs/api/context#env}
  *
  * @example
  * ```ts
  * // Environment object for Cloudflare Workers
  * app.get('*', async c => {
  *   const counter = c.env.COUNTER
  * })
  * ```
  */
  env = {};
  #var;
  finalized = false;
  /**
  * `.error` can get the error object from the middleware if the Handler throws an error.
  *
  * @see {@link https://hono.dev/docs/api/context#error}
  *
  * @example
  * ```ts
  * app.use('*', async (c, next) => {
  *   await next()
  *   if (c.error) {
  *     // do something...
  *   }
  * })
  * ```
  */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
  * Creates an instance of the Context class.
  *
  * @param req - The Request object.
  * @param options - Optional configuration options for the context.
  */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
  * `.req` is the instance of {@link HonoRequest}.
  */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#event}
  * The FetchEvent associated with the current request.
  *
  * @throws Will throw an error if the context does not have a FetchEvent.
  */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) return this.#executionCtx;
    else throw Error("This context has no FetchEvent");
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#executionctx}
  * The ExecutionContext associated with the current request.
  *
  * @throws Will throw an error if the context does not have an ExecutionContext.
  */
  get executionCtx() {
    if (this.#executionCtx) return this.#executionCtx;
    else throw Error("This context has no ExecutionContext");
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#res}
  * The Response object for the current request.
  */
  get res() {
    return this.#res ||= createResponseInstance(null, { headers: this.#preparedHeaders ??= new Headers() });
  }
  /**
  * Sets the Response object for the current request.
  *
  * @param _res - The Response object to set.
  */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") continue;
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) _res.headers.append("set-cookie", cookie);
        } else _res.headers.set(k, v);
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
  * `.render()` can create a response within a layout.
  *
  * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
  *
  * @example
  * ```ts
  * app.get('/', (c) => {
  *   return c.render('Hello!')
  * })
  * ```
  */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
  * Sets the layout for the response.
  *
  * @param layout - The layout to set.
  * @returns The layout function.
  */
  setLayout = (layout) => this.#layout = layout;
  /**
  * Gets the current layout for the response.
  *
  * @returns The current layout function.
  */
  getLayout = () => this.#layout;
  /**
  * `.setRenderer()` can set the layout in the custom middleware.
  *
  * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
  *
  * @example
  * ```tsx
  * app.use('*', async (c, next) => {
  *   c.setRenderer((content) => {
  *     return c.html(
  *       <html>
  *         <body>
  *           <p>{content}</p>
  *         </body>
  *       </html>
  *     )
  *   })
  *   await next()
  * })
  * ```
  */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
  * `.header()` can set headers.
  *
  * @see {@link https://hono.dev/docs/api/context#header}
  *
  * @example
  * ```ts
  * app.get('/welcome', (c) => {
  *   // Set headers
  *   c.header('X-Message', 'Hello!')
  *   c.header('Content-Type', 'text/plain')
  *
  *   // Append multiple headers using the append option (e.g. Vary)
  *   c.header('Vary', 'Accept-Encoding', { append: true })
  *   c.header('Vary', 'User-Agent', { append: true })
  *
  *   return c.body('Thank you for coming')
  * })
  * ```
  */
  header = (name, value, options) => {
    if (this.finalized && !this.#res.bodyUsed) this.#res = createResponseInstance(this.#res.body, this.#res);
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) headers.delete(name);
    else if (options?.append) headers.append(name, value);
    else headers.set(name, value);
  };
  status = (status) => {
    this.#status = status;
  };
  /**
  * `.set()` can set the value specified by the key.
  *
  * @see {@link https://hono.dev/docs/api/context#set-get}
  *
  * @example
  * ```ts
  * app.use('*', async (c, next) => {
  *   c.set('message', 'Hono is hot!!')
  *   await next()
  * })
  * ```
  */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
  * `.get()` can use the value specified by the key.
  *
  * @see {@link https://hono.dev/docs/api/context#set-get}
  *
  * @example
  * ```ts
  * app.get('/', (c) => {
  *   const message = c.get('message')
  *   return c.text(`The message is "${message}"`)
  * })
  * ```
  */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
  * `.var` can access the value of a variable.
  *
  * @see {@link https://hono.dev/docs/api/context#var}
  *
  * @example
  * ```ts
  * const result = c.var.client.oneMethod()
  * ```
  */
  get var() {
    if (!this.#var) return {};
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    let responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders;
    if (typeof arg === "object" && arg.headers) {
      responseHeaders ??= new Headers();
      for (const [key, value] of new Headers(arg.headers)) if (key === "set-cookie") responseHeaders.append(key, value);
      else responseHeaders.set(key, value);
    }
    if (headers) {
      if (!responseHeaders) {
        let count = 0;
        for (const k in headers) if (++count > 1 || typeof headers[k] !== "string") {
          responseHeaders = new Headers();
          break;
        }
      }
      if (responseHeaders) for (const k in headers) {
        const v = headers[k];
        if (typeof v === "string") responseHeaders.set(k, v);
        else {
          responseHeaders.delete(k);
          for (const v2 of v) responseHeaders.append(k, v2);
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, {
      status,
      headers: responseHeaders ?? headers
    });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
  * `.body()` can return the HTTP response.
  * You can set headers with `.header()` and set HTTP status code with `.status`.
  * This can also be set in `.text()`, `.json()` and so on.
  *
  * @see {@link https://hono.dev/docs/api/context#body}
  *
  * @example
  * ```ts
  * app.get('/welcome', (c) => {
  *   // Set headers
  *   c.header('X-Message', 'Hello!')
  *   c.header('Content-Type', 'text/plain')
  *   // Set HTTP status code
  *   c.status(201)
  *
  *   // Return the response body
  *   return c.body('Thank you for coming')
  * })
  * ```
  */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
  * `.text()` can render text as `Content-Type:text/plain`.
  *
  * @see {@link https://hono.dev/docs/api/context#text}
  *
  * @example
  * ```ts
  * app.get('/say', (c) => {
  *   return c.text('Hello!')
  * })
  * ```
  */
  text = (text2, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text2) : this.#newResponse(text2, arg, setDefaultContentType(TEXT_PLAIN, headers));
  };
  /**
  * `.json()` can render JSON as `Content-Type:application/json`.
  *
  * @see {@link https://hono.dev/docs/api/context#json}
  *
  * @example
  * ```ts
  * app.get('/api', (c) => {
  *   return c.json({ message: 'Hello!' })
  * })
  * ```
  */
  json = (object, arg, headers) => {
    return this.#newResponse(JSON.stringify(object), arg, setDefaultContentType("application/json", headers));
  };
  html = (html, arg, headers) => {
    const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  /**
  * `.redirect()` can Redirect, default status code is 302.
  *
  * @see {@link https://hono.dev/docs/api/context#redirect}
  *
  * @example
  * ```ts
  * app.get('/redirect', (c) => {
  *   return c.redirect('/')
  * })
  * app.get('/redirect-permanently', (c) => {
  *   return c.redirect('/', 301)
  * })
  * ```
  */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header("Location", !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString));
    return this.newResponse(null, status ?? 302);
  };
  /**
  * `.notFound()` can return the Not Found Response.
  *
  * @see {@link https://hono.dev/docs/api/context#notfound}
  *
  * @example
  * ```ts
  * app.get('/notfound', (c) => {
  *   return c.notFound()
  * })
  * ```
  */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) throw new Error("next() called multiple times");
      index = i;
      let res;
      let isError = false;
      let handler2;
      if (middleware[i]) {
        handler2 = middleware[i][0][0];
        context.req.routeIndex = i;
      } else handler2 = i === middleware.length && next || void 0;
      if (handler2) try {
        res = await handler2(context, () => dispatch(i + 1));
      } catch (err) {
        if (err instanceof Error && onError) {
          context.error = err;
          res = await onError(err, context);
          isError = true;
        } else throw err;
      }
      else if (context.finalized === false && onNotFound) res = await onNotFound(context);
      if (res && (context.finalized === false || isError)) context.res = res;
      return context;
    }
  };
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/router.js
var METHODS = [
  "get",
  "post",
  "put",
  "delete",
  "options",
  "patch",
  "query"
];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/utils/mount.js
var getPathPrefixLength = (c, pathPrefix, routePath) => {
  if (!/[:*]/.test(pathPrefix)) return pathPrefix.length;
  const path = c.req.path;
  const matchResult = c.req[GET_MATCH_RESULT];
  const paramNames = /* @__PURE__ */ new Set();
  let length = 0;
  for (const part of splitRoutingPath(pathPrefix)) {
    const pattern = getPattern(part);
    if (pattern && pattern !== "*") {
      const name = pattern[1];
      if (paramNames.has(name)) throw new Error(`mount(): Duplicate path parameter "${name}" in "${routePath}".`);
      paramNames.add(name);
    }
    if (pattern && pattern !== "*" && pattern[2] !== true) {
      const value = matchResult.length === 2 ? matchResult[1][matchResult[0][c.req.routeIndex][1][pattern[1]]] : matchResult[0][c.req.routeIndex][1][pattern[1]];
      length += value.length + 1;
    } else if (pattern || part.endsWith("*")) {
      const end = path.indexOf("/", length + 1);
      length = end === -1 ? path.length : end;
    } else length += part.length + 1;
  }
  return length;
};
var createMountedRequest = (c, pathPrefix, routePath) => {
  if (/[^/]\*$/.test(routePath)) throw new Error(`mount(): Wildcard must follow "/" in "${routePath}".`);
  const url = new URL(c.req.raw.url);
  url.pathname = stripPathPrefix(url.pathname, c.req.path, getPathPrefixLength(c, pathPrefix, routePath));
  return new Request(url, c.req.raw);
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/hono-base.js
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono = class Hono2 {
  get;
  post;
  put;
  delete;
  options;
  patch;
  query;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    [...METHODS, "all"].forEach((method) => {
      this[method] = (args1, ...args) => {
        const methodName = method.toUpperCase();
        if (typeof args1 === "string") this.#path = args1;
        else this.#addRoute(methodName, this.#path, args1);
        args.forEach((handler2) => {
          this.#addRoute(methodName, this.#path, handler2);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          const methodName = m.toUpperCase();
          for (const handler2 of handlers) this.#addRoute(methodName, this.#path, handler2);
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") this.#path = arg1;
      else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler2) => {
        this.#addRoute("ALL", this.#path, handler2);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new Hono2({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  /**
  * `.route()` allows grouping other Hono instance in routes.
  *
  * @see {@link https://hono.dev/docs/api/routing#grouping}
  *
  * @param {string} path - base Path
  * @param {Hono} app - other Hono instance
  * @returns {Hono} routed Hono instance
  *
  * @example
  * ```ts
  * const app = new Hono()
  * const app2 = new Hono()
  *
  * app2.get("/user", (c) => c.text("user"))
  * app.route("/api", app2) // GET /api/user
  * ```
  */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler2;
      if (app2.errorHandler === errorHandler) handler2 = r.handler;
      else {
        handler2 = async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res;
        handler2[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler2, r.basePath);
    });
    return this;
  }
  /**
  * `.basePath()` allows base paths to be specified.
  *
  * @see {@link https://hono.dev/docs/api/routing#base-path}
  *
  * @param {string} path - base Path
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * const api = new Hono().basePath('/api')
  * ```
  */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
  * `.onError()` handles an error and returns a customized Response.
  *
  * @see {@link https://hono.dev/docs/api/hono#error-handling}
  *
  * @param {ErrorHandler} handler - request Handler for error
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * app.onError((err, c) => {
  *   console.error(`${err}`)
  *   return c.text('Custom Error Message', 500)
  * })
  * ```
  */
  onError = (handler2) => {
    this.errorHandler = handler2;
    return this;
  };
  /**
  * `.notFound()` allows you to customize a Not Found Response.
  *
  * @see {@link https://hono.dev/docs/api/hono#not-found}
  *
  * @param {NotFoundHandler} handler - request handler for not-found
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * app.notFound((c) => {
  *   return c.text('Custom 404 Message', 404)
  * })
  * ```
  */
  notFound = (handler2) => {
    this.#notFoundHandler = handler2;
    return this;
  };
  /**
  * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
  *
  * @deprecated Use `mount()` from `hono/mount` instead. `.mount()` will be removed in v5.
  *
  * @see {@link https://hono.dev/docs/api/hono#mount}
  *
  * @param {string} path - base Path
  * @param {Function} applicationHandler - other Request Handler
  * @param {MountOptions} [options] - options of `.mount()`
  * @returns {Hono} mounted Hono instance
  *
  * @example
  * ```ts
  * import { Router as IttyRouter } from 'itty-router'
  * import { Hono } from 'hono'
  * // Create itty-router application
  * const ittyRouter = IttyRouter()
  * // GET /itty-router/hello
  * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
  *
  * const app = new Hono()
  * app.mount('/itty-router', ittyRouter.handle)
  * ```
  *
  * @example
  * ```ts
  * const app = new Hono()
  * // Send the request to another application without modification.
  * app.mount('/app', anotherApp, {
  *   replaceRequest: (req) => req,
  * })
  * ```
  */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") optionHandler = options;
      else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) replaceRequest = (request) => request;
        else replaceRequest = options.replaceRequest;
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    const mergedPath = mergePath(this._basePath, path);
    const defaultReplaceRequest = (c) => createMountedRequest(c, mergedPath.replace(/\/$/, ""), mergePath(mergedPath, "*"));
    const handler2 = async (c, next) => {
      const res = await applicationHandler(replaceRequest ? replaceRequest(c.req.raw) : defaultReplaceRequest(c), ...getOptions(c));
      if (res) return res;
      await next();
    };
    this.#addRoute("ALL", mergePath(path, "*"), handler2);
    return this;
  }
  #addRoute(method, path, handler2, baseRoutePath) {
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler: handler2
    };
    this.router.add(method, path, [handler2, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) return this.errorHandler(err, c);
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then((resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
  * `.fetch()` will be entry point of your app.
  *
  * @see {@link https://hono.dev/docs/api/hono#fetch}
  *
  * @param {Request} request - request Object of request
  * @param {Env} env - env Object
  * @param {ExecutionContext} executionCtx - context of execution
  * @returns {Response | Promise<Response>} response of request
  *
  */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
  * `.request()` is a useful method for testing.
  * You can pass a URL or pathname to send a GET request.
  * app will return a Response object.
  * ```ts
  * test('GET /hello is ok', async () => {
  *   const res = await app.request('/hello')
  *   expect(res.status).toBe(200)
  * })
  * ```
  * @see https://hono.dev/docs/api/hono#request
  */
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    input = input.toString();
    return this.fetch(new Request(/^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`, requestInit), Env, executionCtx);
  };
  /**
  * `.fire()` automatically adds a global fetch event listener.
  * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
  * @deprecated
  * Use `fire` from `hono/service-worker` instead.
  * ```ts
  * import { Hono } from 'hono'
  * import { fire } from 'hono/service-worker'
  *
  * const app = new Hono()
  * // ...
  * fire(app)
  * ```
  * @see https://hono.dev/docs/api/hono#fire
  * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
  * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
  */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/router/utils.js
var createNullObject = () => /* @__PURE__ */ Object.create(null);

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = ((method2, path2) => {
    const matcher = matchers[method2] || matchers["ALL"];
    const staticMatch = matcher[2][path2];
    if (staticMatch) return staticMatch;
    const match3 = path2.match(matcher[0]);
    if (!match3) return [[], emptyParam];
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  });
  this.match = match2;
  return match2(method, path);
}

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = "[^]*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/[^]*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = /* @__PURE__ */ new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) return b.length === 1 ? a < b ? -1 : 1 : -1;
  if (b.length === 1) return 1;
  if (a === "[^]*" || a === "(?:|/[^]*)") return b === "[^]*" ? -1 : 1;
  else if (b === "[^]*" || b === "(?:|/[^]*)") return -1;
  if (a === "[^/]+") return 1;
  else if (b === "[^/]+") return -1;
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class Node2 {
  #index;
  #varIndex;
  #children = createNullObject();
  insert(tokens, index, paramMap, context, keys) {
    let node = this;
    for (let i = 0, len = tokens.length; i < len; i++) {
      const token = tokens[i];
      const pattern = token.length === 1 ? token === "*" ? i === len - 1 ? [
        "",
        "",
        ONLY_WILDCARD_REG_EXP_STR
      ] : [
        "",
        "",
        LABEL_REG_EXP_STR
      ] : null : token === "/*" ? [
        "",
        "",
        TAIL_WILDCARD_REG_EXP_STR
      ] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      let nextNode;
      if (pattern) {
        const name = pattern[1];
        let regexpStr = pattern[2] || "[^/]+";
        if (name && pattern[2]) {
          if (new RegExp(regexpStr).test("")) throw PATH_ERROR;
          regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
          if (/\((?!\?:)/.test(regexpStr)) throw PATH_ERROR;
          if (regexpStr.length === 1 && regExpMetaChars.has(regexpStr)) throw PATH_ERROR;
        }
        keys.push(regexpStr);
        nextNode = node.#children[regexpStr];
        if (!nextNode) {
          if (regexpStr !== "[^]*" && regexpStr !== "(?:|/[^]*)") {
            for (const k in node.#children) if ((regexpStr.length > 1 || k.length > 1) && k !== "[^]*" && k !== "(?:|/[^]*)") throw PATH_ERROR;
          }
          nextNode = node.#children[regexpStr] = new Node2();
        }
        if (name !== "") {
          nextNode.#varIndex ??= context.varIndex++;
          paramMap.push([name, nextNode.#varIndex]);
        }
      } else {
        keys.push(token);
        nextNode = node.#children[token];
        if (!nextNode) {
          for (const k in node.#children) if (k.length > 1 && k !== "[^]*" && k !== "(?:|/[^]*)") throw PATH_ERROR;
          nextNode = node.#children[token] = new Node2();
        }
      }
      node = nextNode;
    }
    if (node.#index !== void 0) throw PATH_ERROR;
    node.#index = index;
  }
  buildRegExpStr() {
    const strList = Object.keys(this.#children).sort(compareKey).map((k) => {
      const c = this.#children[k];
      const childStr = c.buildRegExpStr();
      return childStr === "" ? "" : (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + childStr;
    }).filter(Boolean);
    if (typeof this.#index === "number" && this.#index !== -1) strList.unshift(`#${this.#index}`);
    if (strList.length === 0) return "";
    if (strList.length === 1) return strList[0];
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node();
  #index = 0;
  paths = createNullObject();
  insert(path, isStatic) {
    const keys = [];
    if (isStatic) {
      this.#root.insert(path.split(""), -1, [], this.#context, keys);
      this.paths[path] = [
        -1,
        [],
        keys
      ];
      return;
    }
    const paramAssoc = [];
    const groups = [];
    let markedPath = path;
    for (let i = 0; ; ) {
      let replaced = false;
      markedPath = markedPath.replace(/\{(?:\{[\d,]+\}|[^}])+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) break;
    }
    const tokens = markedPath.match(/(?::[^\/]+)|(?:\/\*$)|./gs) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) if (tokens[j].indexOf(mark) !== -1) {
        tokens[j] = tokens[j].replace(mark, groups[i][1]);
        break;
      }
    }
    this.#root.insert(tokens, this.#index, paramAssoc, this.#context, keys);
    this.paths[path] = [
      this.#index++,
      paramAssoc,
      keys
    ];
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") return [
      /^$/,
      [],
      []
    ];
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [
      new RegExp(`^${regexp}`),
      indexReplacementMap,
      paramReplacementMap
    ];
  }
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/router/reg-exp-router/router.js
function endsWithWildcard(keys) {
  const tail = keys[keys.length - 1];
  return tail === "[^]*" || tail === "(?:|/[^]*)";
}
function covers(wildcard, target) {
  const last = wildcard.length - 1;
  for (let i = 0; i < last; i++) if (wildcard[i] !== target[i]) return false;
  return wildcard[last] === "[^]*" || target.length === last || target[last] === "/";
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #handlers;
  #tries;
  constructor() {
    this.#handlers = { ["ALL"]: [] };
    this.#tries = { ["ALL"]: new Trie() };
  }
  #insertPath(method, path) {
    try {
      this.#tries[method].insert(path, !/\*|\/:/.test(path));
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
  }
  add(method, path, handler2) {
    const handlers = this.#handlers;
    if (!handlers) throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    const tries = this.#tries;
    if (!handlers[method]) {
      tries[method] = new Trie();
      handlers[method] = [...handlers["ALL"]];
      for (const p in tries["ALL"].paths) this.#insertPath(method, p);
    }
    if (path === "/*") path = "*";
    const methods = method === "ALL" ? Object.keys(handlers) : [method];
    const paths = checkOptionalParameter(path) || [path];
    for (const path2 of paths) for (const m of methods) {
      if (!tries[m].paths[path2]) this.#insertPath(m, path2);
      handlers[m].push([handler2, path2]);
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = createNullObject();
    for (const method of Object.keys(this.#handlers)) matchers[method] = this.#buildMatcher(method);
    this.#handlers = this.#tries = void 0;
    return matchers;
  }
  #buildMatcher(method) {
    const handlers = this.#handlers[method];
    const trie = this.#tries[method];
    const staticMap = createNullObject();
    const handlerData = [];
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    const own = createNullObject();
    const entries = handlers.map(([h, p], i) => {
      (own[p] ??= []).push(i);
      return [h, trie.paths[p][1].reduceRight((map, [key, varIndex]) => {
        map[key] = paramReplacementMap[varIndex];
        return map;
      }, createNullObject())];
    });
    const wildcards = Object.keys(own).filter((p) => endsWithWildcard(trie.paths[p][2]));
    for (const path in trie.paths) {
      const [index, , keys] = trie.paths[path];
      const indexes = [...own[path]];
      for (const p of wildcards) if (p !== path && covers(trie.paths[p][2], keys)) indexes.push(...own[p]);
      const data = indexes.sort((a, b) => a - b).map((i) => entries[i]);
      if (index === -1) {
        const last = Math.max(-1, ...data.flatMap(([, map]) => Object.values(map)));
        staticMap[path] = [data, last === -1 ? emptyParam : path.match(regexp).slice(0, last + 1)];
      } else handlerData[index] = data;
    }
    return [
      regexp,
      indexReplacementMap.map((i) => handlerData[i]),
      staticMap
    ];
  }
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init2) {
    this.#routers = init2.routers;
  }
  add(method, path, handler2) {
    if (!this.#routes) throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    this.#routes.push([
      method,
      path,
      handler2
    ]);
  }
  match(method, path) {
    if (!this.#routes) throw new Error("Fatal error");
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) router.add(...routes[i2]);
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) continue;
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) throw new Error("Fatal error");
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) throw new Error("No active router has been determined yet.");
    return this.#routers[0];
  }
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/router/trie-router/node.js
var emptyParams = createNullObject();
var order = 0;
var Node3 = class Node4 {
  #methods = [];
  #children = createNullObject();
  #patterns = [];
  #pattern;
  #params = emptyParams;
  insert(method, path, handler2) {
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = /* @__PURE__ */ new Set();
    let i = 0;
    for (const p of parts) {
      const nextP = parts[++i];
      const pattern = getPattern(p, nextP) || (nextP === void 0 && p && p.indexOf("*") === p.length - 1 ? p : null);
      const isParam = Array.isArray(pattern);
      const key = isParam ? pattern[0] : pattern || p;
      const child = curNode.#children[key] ||= new Node4();
      if (pattern && !child.#pattern) {
        child.#pattern = pattern;
        curNode.#patterns.push(child);
      }
      curNode = child;
      if (isParam) possibleKeys.add(pattern[1]);
    }
    curNode.#methods.push({ [method]: {
      handler: handler2,
      possibleKeys: [...possibleKeys],
      score: ++order
    } });
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m["ALL"];
      if (handlerSet) {
        handlerSet.params = createNullObject();
        handlerSets.push(handlerSet);
        for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
          const key = handlerSet.possibleKeys[i2];
          handlerSet.params[key] = params?.[key] && !i2 ? params[key] : nodeParams[key] ?? params?.[key];
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    let curNodes = [this];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else tempNodes.push(nextNode);
        }
        for (const child of node.#patterns) {
          const pattern = child.#pattern;
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (typeof pattern === "string") {
            if (pattern === "*" || part.startsWith(pattern.slice(0, -1))) {
              this.#pushHandlerSets(handlerSets, child, method, node.#params);
              if (pattern === "*") {
                child.#params = params;
                tempNodes.push(child);
              }
            }
            continue;
          }
          const [, name, matcher] = pattern;
          if (!part && matcher === true) continue;
          if (matcher !== true) {
            if (!partOffsets) {
              partOffsets = [];
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.slice(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              if (!Object.hasOwn(params, name)) params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"]) this.#pushHandlerSets(handlerSets, child.#children["*"], method, node.#params, params);
              for (const _ in child.#children) {
                child.#params = params;
                const componentCount = m[0].match(/\//g)?.length ?? 0;
                (curNodesQueue[componentCount] ||= []).push(child);
                break;
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            if (!Object.hasOwn(params, name)) params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) this.#pushHandlerSets(handlerSets, child.#children["*"], method, params, node.#params);
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets[1]) handlerSets.sort((a, b) => {
      return a.score - b.score;
    });
    return [handlerSets.map(({ handler: handler2, params }) => [handler2, params])];
  }
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node = new Node3();
  add(method, path, handler2) {
    for (const result of checkOptionalParameter(path) || [path]) this.#node.insert(method, result, handler2);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/hono.js
var Hono3 = class extends Hono {
  /**
  * Creates an instance of the Hono class.
  *
  * @param options - Optional configuration options for the Hono instance.
  */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({ routers: [new RegExpRouter(), new TrieRouter()] });
  }
};

// src/lib/id.ts
function createId(prefix = "id") {
  const raw2 = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
  return `${prefix}_${raw2.replace(/-/g, "").slice(0, 12)}`;
}

// server/api/password.ts
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const candidate = scryptSync(password, salt, 64);
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

// server/api/auth.ts
import { randomBytes as randomBytes2 } from "node:crypto";

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/utils/cookie.js
var validCookieNameRegEx = /^[\w!#$%&'*.^`|~+-]+$/;
var relaxedCookieNameRegEx = /^[!#-:<>-[\]-~]+$/;
var validCookieValueRegEx = /^[ !#-:<-[\]-~]*$/;
var trimCookieWhitespace = (value) => {
  let start = 0;
  let end = value.length;
  while (start < end) {
    const charCode = value.charCodeAt(start);
    if (charCode !== 32 && charCode !== 9) break;
    start++;
  }
  while (end > start) {
    const charCode = value.charCodeAt(end - 1);
    if (charCode !== 32 && charCode !== 9) break;
    end--;
  }
  return start === 0 && end === value.length ? value : value.slice(start, end);
};
var parse = (cookie, name) => {
  if (name && cookie.indexOf(name) === -1) return {};
  const pairs = cookie.split(";");
  const parsedCookie = /* @__PURE__ */ Object.create(null);
  for (const pairStr of pairs) {
    const valueStartPos = pairStr.indexOf("=");
    if (valueStartPos === -1) continue;
    const cookieName = trimCookieWhitespace(pairStr.substring(0, valueStartPos));
    if (name && name !== cookieName || !relaxedCookieNameRegEx.test(cookieName) || cookieName in parsedCookie) continue;
    let cookieValue = trimCookieWhitespace(pairStr.substring(valueStartPos + 1));
    if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) cookieValue = cookieValue.slice(1, -1);
    if (validCookieValueRegEx.test(cookieValue)) {
      parsedCookie[cookieName] = tryDecodeURIComponent(cookieValue);
      if (name) break;
    }
  }
  return parsedCookie;
};
var _serialize = (name, value, opt = {}) => {
  if (!validCookieNameRegEx.test(name)) throw new Error("Invalid cookie name");
  let cookie = `${name}=${value}`;
  if (name.startsWith("__Secure-") && !opt.secure) throw new Error("__Secure- Cookie must have Secure attributes");
  if (name.startsWith("__Host-")) {
    if (!opt.secure) throw new Error("__Host- Cookie must have Secure attributes");
    if (opt.path !== "/") throw new Error('__Host- Cookie must have Path attributes with "/"');
    if (opt.domain) throw new Error("__Host- Cookie must not have Domain attributes");
  }
  for (const key of [
    "domain",
    "path",
    "sameSite",
    "priority"
  ]) if (opt[key] && /[;\r\n]/.test(opt[key])) throw new Error(`${key} must not contain ";", "\\r", or "\\n"`);
  if (opt && typeof opt.maxAge === "number" && opt.maxAge >= 0) {
    if (opt.maxAge > 3456e4) throw new Error("Cookies Max-Age SHOULD NOT be greater than 400 days (34560000 seconds) in duration.");
    cookie += `; Max-Age=${opt.maxAge | 0}`;
  }
  if (opt.domain && opt.prefix !== "host") cookie += `; Domain=${opt.domain}`;
  if (opt.path) cookie += `; Path=${opt.path}`;
  if (opt.expires) {
    if (opt.expires.getTime() - Date.now() > 3456e7) throw new Error("Cookies Expires SHOULD NOT be greater than 400 days (34560000 seconds) in the future.");
    cookie += `; Expires=${opt.expires.toUTCString()}`;
  }
  if (opt.httpOnly) cookie += "; HttpOnly";
  if (opt.secure) cookie += "; Secure";
  if (opt.sameSite) cookie += `; SameSite=${opt.sameSite.charAt(0).toUpperCase() + opt.sameSite.slice(1)}`;
  if (opt.priority) cookie += `; Priority=${opt.priority.charAt(0).toUpperCase() + opt.priority.slice(1)}`;
  if (opt.partitioned) {
    if (!opt.secure) throw new Error("Partitioned Cookie must have Secure attributes");
    cookie += "; Partitioned";
  }
  return cookie;
};
var serialize = (name, value, opt) => {
  value = encodeURIComponent(value);
  return _serialize(name, value, opt);
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/helper/cookie/index.js
var getCookie = (c, key, prefix) => {
  const cookie = c.req.raw.headers.get("Cookie");
  if (typeof key === "string") {
    if (!cookie) return;
    let finalKey = key;
    if (prefix === "secure") finalKey = "__Secure-" + key;
    else if (prefix === "host") finalKey = "__Host-" + key;
    return parse(cookie, finalKey)[finalKey];
  }
  if (!cookie) return {};
  return parse(cookie);
};
var generateCookie = (name, value, opt) => {
  let cookie;
  if (opt?.prefix === "secure") cookie = serialize("__Secure-" + name, value, {
    path: "/",
    ...opt,
    secure: true
  });
  else if (opt?.prefix === "host") cookie = serialize("__Host-" + name, value, {
    ...opt,
    path: "/",
    secure: true,
    domain: void 0
  });
  else cookie = serialize(name, value, {
    path: "/",
    ...opt
  });
  return cookie;
};
var setCookie = (c, name, value, opt) => {
  const cookie = generateCookie(name, value, opt);
  c.header("Set-Cookie", cookie, { append: true });
};
var deleteCookie = (c, name, opt) => {
  const deletedCookie = getCookie(c, name, opt?.prefix);
  setCookie(c, name, "", {
    ...opt,
    maxAge: 0
  });
  return deletedCookie;
};

// node_modules/.pnpm/@tursodatabase+serverless@1.4.1/node_modules/@tursodatabase/serverless/dist/compat/index.js
var DatabaseError = class _DatabaseError extends Error {
  constructor(message, code, rawCode, cause) {
    super(message);
    this.name = "DatabaseError";
    this.code = code;
    this.rawCode = rawCode;
    this.cause = cause;
    Object.setPrototypeOf(this, _DatabaseError.prototype);
  }
};
var TimeoutError = class _TimeoutError extends DatabaseError {
  constructor(message = "Query timed out", cause) {
    super(message, "TIMEOUT", void 0, cause);
    this.name = "TimeoutError";
    Object.setPrototypeOf(this, _TimeoutError.prototype);
  }
};
function toBase64(uint8) {
  return Buffer.from(uint8.buffer, uint8.byteOffset, uint8.byteLength).toString("base64");
}
function encodeValue(value) {
  if (value === null || value === void 0) {
    return { type: "null" };
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Only finite numbers (not Infinity or NaN) can be passed as arguments");
    }
    if (Number.isSafeInteger(value)) {
      return { type: "integer", value: value.toString() };
    }
    return { type: "float", value };
  }
  if (typeof value === "bigint") {
    if (value < -(1n << 63n) || value > (1n << 63n) - 1n) {
      throw new Error("BigInt value is outside SQLite's signed 64-bit integer range");
    }
    return { type: "integer", value: value.toString() };
  }
  if (typeof value === "boolean") {
    return { type: "integer", value: value ? "1" : "0" };
  }
  if (typeof value === "string") {
    return { type: "text", value };
  }
  if (value instanceof ArrayBuffer) {
    return { type: "blob", base64: toBase64(new Uint8Array(value)) };
  }
  if (value instanceof Uint8Array) {
    return { type: "blob", base64: toBase64(value) };
  }
  return { type: "text", value: String(value) };
}
function decodeValue(value, safeIntegers = false) {
  switch (value.type) {
    case "null":
      return null;
    case "integer":
      if (safeIntegers) {
        return BigInt(value.value);
      }
      return parseInt(value.value, 10);
    case "float":
      return value.value;
    case "text":
      return value.value;
    case "blob":
      if (value.base64 !== void 0 && value.base64 !== null) {
        let b64 = value.base64;
        while (b64.length % 4 !== 0) {
          b64 += "=";
        }
        const binaryString = atob(b64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return Buffer.from(bytes);
      }
      return Buffer.alloc(0);
    default:
      return null;
  }
}
var ENCRYPTION_KEY_HEADER = "x-turso-encryption-key";
function buildHeaders(ctx) {
  const headers = {
    "Content-Type": "application/json"
  };
  if (ctx.authToken) {
    headers["Authorization"] = `Bearer ${ctx.authToken}`;
  }
  if (ctx.remoteEncryptionKey) {
    headers[ENCRYPTION_KEY_HEADER] = ctx.remoteEncryptionKey;
  }
  for (const [name, value] of Object.entries(ctx.requestHeaders ?? {})) {
    if (name.toLowerCase() === "host") {
      throw new DatabaseError("overwriting the 'Host' header is not supported");
    }
    headers[name] = value;
  }
  return headers;
}
function buildFetchOptions(ctx, body, signal) {
  return {
    method: "POST",
    headers: buildHeaders(ctx),
    body,
    signal
  };
}
function wrapAbortError(error) {
  if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
    throw new TimeoutError("Query timed out");
  }
  throw error;
}
async function executeCursor(ctx, request, signal) {
  let response;
  try {
    response = await fetch(`${ctx.url}/v3/cursor`, buildFetchOptions(ctx, JSON.stringify(request), signal));
  } catch (error) {
    wrapAbortError(error);
  }
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorBody = await response.text();
      const errorData = JSON.parse(errorBody);
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
    }
    throw new DatabaseError(errorMessage);
  }
  const reader = response.body?.getReader();
  if (!reader) {
    throw new DatabaseError("No response body");
  }
  const decoder = new TextDecoder();
  let buffer = "";
  let cursorResponse;
  try {
    while (!cursorResponse) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const newlineIndex = buffer.indexOf("\n");
      if (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (line) {
          cursorResponse = JSON.parse(line);
          break;
        }
      }
    }
  } catch (error) {
    reader.releaseLock();
    wrapAbortError(error);
  }
  if (!cursorResponse) {
    reader.releaseLock();
    throw new DatabaseError("No cursor response received");
  }
  async function* parseEntries() {
    try {
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (line) {
          yield JSON.parse(line);
        }
      }
      while (true) {
        let readResult;
        try {
          readResult = await reader.read();
        } catch (error) {
          wrapAbortError(error);
        }
        if (readResult.done) break;
        buffer += decoder.decode(readResult.value, { stream: true });
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          if (line) {
            yield JSON.parse(line);
          }
        }
      }
      if (buffer.trim()) {
        yield JSON.parse(buffer.trim());
      }
    } finally {
      reader.releaseLock();
    }
  }
  return { response: cursorResponse, entries: parseEntries() };
}
async function executePipeline(ctx, request, signal) {
  let response;
  try {
    response = await fetch(`${ctx.url}/v3/pipeline`, buildFetchOptions(ctx, JSON.stringify(request), signal));
  } catch (error) {
    wrapAbortError(error);
  }
  if (!response.ok) {
    throw new DatabaseError(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}
function encodeSqlArgs(args = []) {
  let positionalArgs = [];
  let namedArgs = [];
  if (Array.isArray(args)) {
    positionalArgs = args.map(encodeValue);
  } else {
    const keys = Object.keys(args);
    const isNumericKeys = keys.length > 0 && keys.every((key) => /^\d+$/.test(key));
    if (isNumericKeys) {
      const sortedKeys = keys.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
      const maxIndex = parseInt(sortedKeys[sortedKeys.length - 1], 10);
      positionalArgs = new Array(maxIndex);
      for (const key of sortedKeys) {
        const index = parseInt(key, 10) - 1;
        positionalArgs[index] = encodeValue(args[key]);
      }
      for (let i = 0; i < positionalArgs.length; i++) {
        if (positionalArgs[i] === void 0) {
          positionalArgs[i] = { type: "null" };
        }
      }
    } else {
      namedArgs = Object.entries(args).map(([name, value]) => ({
        name,
        value: encodeValue(value)
      }));
    }
  }
  return { args: positionalArgs, namedArgs };
}
var TRANSACTION_CONTROL_KEYWORDS = /* @__PURE__ */ new Set([
  "BEGIN",
  "COMMIT",
  "END",
  "ROLLBACK",
  "SAVEPOINT",
  "RELEASE"
]);
function normalizeBatchMode(mode) {
  switch (String(mode).toLowerCase()) {
    case "write":
      return "IMMEDIATE";
    case "read":
    case "deferred":
      return "DEFERRED";
    case "immediate":
      return "IMMEDIATE";
    case "exclusive":
      return "EXCLUSIVE";
    case "concurrent":
      return "CONCURRENT";
    default:
      return String(mode).toUpperCase();
  }
}
function firstSqlKeyword(sql) {
  let offset = 0;
  while (offset < sql.length) {
    if (/\s/.test(sql[offset]) || sql[offset] === ";") {
      offset++;
      continue;
    }
    if (sql.startsWith("--", offset)) {
      const newline = sql.indexOf("\n", offset + 2);
      if (newline < 0) return void 0;
      offset = newline + 1;
      continue;
    }
    if (sql.startsWith("/*", offset)) {
      const end = sql.indexOf("*/", offset + 2);
      if (end < 0) return void 0;
      offset = end + 2;
      continue;
    }
    break;
  }
  return /^[A-Za-z]+/.exec(sql.slice(offset))?.[0].toUpperCase();
}
function batchInputError(index, message) {
  const error = new DatabaseError(`batch statement ${index} failed: ${message}`);
  error.batchIndex = index;
  error.batchResults = [];
  return error;
}
function normalizeUrl(url) {
  return url.replace(/^(libsql|turso):\/\//, "https://").replace(/\/+$/, "");
}
function isValidIdentifier(str) {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);
}
var Session = class _Session {
  constructor(config) {
    this.baton = null;
    this.autocommit = true;
    for (const name of Object.keys(config.requestHeaders ?? {})) {
      if (name.toLowerCase() === "host") {
        throw new DatabaseError("overwriting the 'Host' header is not supported");
      }
    }
    this.config = config;
    this.baseUrl = normalizeUrl(config.url);
  }
  httpContext(queryOptions) {
    let requestHeaders = this.config.requestHeaders;
    if (queryOptions?.requestHeaders) {
      requestHeaders = { ...requestHeaders, ...queryOptions.requestHeaders };
    }
    return {
      url: this.baseUrl,
      authToken: this.config.authToken,
      remoteEncryptionKey: this.config.remoteEncryptionKey,
      requestHeaders
    };
  }
  /**
   * Whether the connection is currently inside a transaction.
   *
   * Derived from the server's authoritative `get_autocommit` answer (the same
   * value as `sqlite3_get_autocommit()`), which we refresh on every pipeline
   * request. This is the only reliable signal: a non-null baton does NOT imply
   * a transaction — the server also keeps the stream open for stored SQL or
   * pragma side effects.
   */
  get inTransaction() {
    return !this.autocommit;
  }
  /**
   * Refresh the cached autocommit status from a pipeline response, reading the
   * answer to the `get_autocommit` request we append to every pipeline call.
   */
  updateAutocommit(response) {
    if (!response.results) {
      return;
    }
    for (const result of response.results) {
      if (result.type === "ok" && result.response?.type === "get_autocommit" && typeof result.response.is_autocommit === "boolean") {
        this.autocommit = result.response.is_autocommit;
        return;
      }
    }
  }
  createAbortSignal(queryOptions) {
    const timeout = queryOptions?.queryTimeout ?? this.config.defaultQueryTimeout;
    if (timeout != null && timeout > 0) {
      return AbortSignal.timeout(timeout);
    }
    return void 0;
  }
  /**
   * Describe a SQL statement to get its column metadata.
   * 
   * @param sql - The SQL statement to describe
   * @returns Promise resolving to the statement description
   */
  async describe(sql, queryOptions) {
    const request = {
      baton: this.baton,
      requests: [
        { type: "describe", sql },
        { type: "get_autocommit" }
      ]
    };
    let response;
    try {
      response = await executePipeline(this.httpContext(queryOptions), request, this.createAbortSignal(queryOptions));
    } catch (e) {
      this.baton = null;
      this.autocommit = true;
      throw e;
    }
    this.baton = response.baton;
    if (response.base_url) {
      this.baseUrl = normalizeUrl(response.base_url);
    }
    this.updateAutocommit(response);
    if (response.results && response.results[0]) {
      const result = response.results[0];
      if (result.type === "error") {
        throw new DatabaseError(result.error?.message || "Describe execution failed", result.error?.code);
      }
      if (result.response?.type === "describe" && result.response.result) {
        return result.response.result;
      }
    }
    throw new DatabaseError("Unexpected describe response");
  }
  /**
   * Execute a SQL statement and return all results.
   *
   * @param sql - The SQL statement to execute
   * @param args - Optional array of parameter values or object with named parameters
   * @param safeIntegers - Whether to return integers as BigInt
   * @returns Promise resolving to the complete result set
   */
  async execute(sql, args = [], safeIntegers = false, queryOptions) {
    const { response, entries } = await this.executeRaw(sql, args, queryOptions);
    const result = await this.processCursorEntries(entries, safeIntegers);
    return result;
  }
  /**
   * A trailing batch step gated on `is_autocommit`, appended to every cursor
   * request. The cursor endpoint cannot carry a `get_autocommit` probe, so
   * whether this step executed tells us the connection's transaction state
   * without an extra round trip.
   */
  static autocommitProbeStep() {
    return {
      stmt: { sql: "SELECT 1", args: [], named_args: [], want_rows: false },
      condition: { type: "is_autocommit" }
    };
  }
  /**
   * Filter the probe step's entries out of a cursor stream and update the
   * cached transaction state from whether the probe executed. The probe is
   * always the last step, so everything after its step_begin belongs to it.
   *
   * If the stream ends abnormally (fatal error entry, a probe error, or the
   * consumer stops iterating early) the probe answer is unreliable, so the
   * state is refreshed with a fallback pipeline request instead.
   */
  async *trackAutocommit(entries, probeIdx, queryOptions) {
    let sawProbe = false;
    let unreliable = false;
    let completed = false;
    try {
      for await (const entry of entries) {
        if (entry.type === "step_begin" && entry.step === probeIdx) {
          sawProbe = true;
          continue;
        }
        if (sawProbe && (entry.type === "row" || entry.type === "step_end")) {
          continue;
        }
        if (entry.type === "error" || entry.type === "step_error" && entry.step === probeIdx) {
          unreliable = true;
          if (entry.type === "step_error") {
            continue;
          }
        }
        yield entry;
      }
      completed = true;
    } finally {
      if (completed && !unreliable) {
        this.autocommit = sawProbe;
      } else {
        await this.refreshAutocommit(queryOptions);
      }
    }
  }
  /**
   * Execute a SQL statement and return the raw response and entries.
   *
   * @param sql - The SQL statement to execute
   * @param args - Optional array of parameter values or object with named parameters
   * @returns Promise resolving to the raw response and cursor entries
   */
  async executeRaw(sql, args = [], queryOptions) {
    const encodedArgs = encodeSqlArgs(args);
    const request = {
      baton: this.baton,
      batch: {
        steps: [{
          stmt: {
            sql,
            args: encodedArgs.args,
            named_args: encodedArgs.namedArgs,
            want_rows: true
          }
        }, _Session.autocommitProbeStep()]
      }
    };
    let result;
    try {
      result = await executeCursor(this.httpContext(queryOptions), request, this.createAbortSignal(queryOptions));
    } catch (e) {
      this.baton = null;
      this.autocommit = true;
      throw e;
    }
    const { response, entries } = result;
    this.baton = response.baton;
    if (response.base_url) {
      this.baseUrl = normalizeUrl(response.base_url);
    }
    return { response, entries: this.trackAutocommit(entries, 1, queryOptions) };
  }
  /**
   * Refresh the cached transaction state with a standalone `get_autocommit`
   * pipeline request. Errors are not rethrown — this runs from generator
   * cleanup where an exception would mask the original failure; a dead stream
   * means the server rolled back, so the state resets to autocommit instead.
   */
  async refreshAutocommit(queryOptions) {
    const request = {
      baton: this.baton,
      requests: [{ type: "get_autocommit" }]
    };
    let response;
    try {
      response = await executePipeline(this.httpContext(), request, this.createAbortSignal(queryOptions));
    } catch {
      this.baton = null;
      this.autocommit = true;
      return;
    }
    this.baton = response.baton;
    if (response.base_url) {
      this.baseUrl = normalizeUrl(response.base_url);
    }
    this.updateAutocommit(response);
  }
  /**
   * Process cursor entries into a structured result.
   *
   * @param entries - Async generator of cursor entries
   * @returns Promise resolving to the processed result
   */
  async processCursorEntries(entries, safeIntegers = false) {
    let columns = [];
    let columnTypes = [];
    let rows = [];
    let rowsAffected = 0;
    let lastInsertRowid;
    for await (const entry of entries) {
      switch (entry.type) {
        case "step_begin":
          if (entry.cols) {
            columns = entry.cols.map((col) => col.name);
            columnTypes = entry.cols.map((col) => col.decltype || "");
          }
          break;
        case "row":
          if (entry.row) {
            const decodedRow = entry.row.map((value) => decodeValue(value, safeIntegers));
            const rowObject = this.createRowObject(decodedRow, columns);
            rows.push(rowObject);
          }
          break;
        case "step_end":
          if (entry.affected_row_count !== void 0) {
            rowsAffected = entry.affected_row_count;
          }
          if (entry.last_insert_rowid !== void 0 && entry.last_insert_rowid !== null) {
            lastInsertRowid = typeof entry.last_insert_rowid === "number" ? entry.last_insert_rowid : parseInt(entry.last_insert_rowid, 10);
          }
          break;
        case "step_error":
        case "error":
          throw new DatabaseError(entry.error?.message || "SQL execution failed", entry.error?.code);
      }
    }
    return {
      columns,
      columnTypes,
      rows,
      rowsAffected,
      lastInsertRowid
    };
  }
  /**
   * Create a row object with both array and named property access.
   * 
   * @param values - Array of column values
   * @param columns - Array of column names
   * @returns Row object with dual access patterns
   */
  createRowObject(values, columns) {
    const row = [...values];
    columns.forEach((column, index) => {
      if (column && isValidIdentifier(column) && !Object.prototype.hasOwnProperty.call(row, column)) {
        Object.defineProperty(row, column, {
          value: values[index],
          enumerable: false,
          writable: false,
          configurable: true
        });
      }
    });
    return row;
  }
  createObjectRow(values, columns) {
    const row = {};
    columns.forEach((column, index) => {
      row[column] = values[index];
    });
    return row;
  }
  /**
   * Execute multiple SQL statements in a batch.
   *
   * The batch is sent as a single `batch` request on the pipeline
   * endpoint (PROTOCOL.md section 6.2), so the whole batch completes in
   * one round-trip. Each statement is gated on its predecessor
   * succeeding, so execution stops at the first failure. When `mode` is
   * set, the request also carries `BEGIN <mode>` / `COMMIT` / `ROLLBACK`
   * steps using the server-side condition chain, giving atomic
   * execution. When `mode` is omitted, the statements run under
   * autocommit (or whatever transaction is already active on this
   * stream).
   *
   * @param statements - Array of SQL statements to execute.
   * @param mode - Optional locking mode; when set, the batch executes
   *   atomically. Accepts the same values as `Database.transaction(...)`
   *   variants: `"deferred"`, `"immediate"`, `"exclusive"`, `"concurrent"`.
   * @param safeIntegers - When true, integer column values are decoded as
   *   BigInt rather than Number.
   * @returns Promise resolving to an array of per-statement results — one
   *   per input statement, in order — each carrying that statement's
   *   `columns`, `columnTypes`, `rows`, `rowsAffected`, `lastInsertRowid`,
   *   and the server-side execution statistics `rowsRead`, `rowsWritten`,
   *   and `queryDurationMs`. On failure the thrown `DatabaseError` carries
   *   `batchIndex` (the failing statement) and `batchResults` (the results
   *   of the statements that completed).
   */
  async batch(statements, mode, queryOptions, safeIntegers = false, raw2 = false) {
    const userSteps = statements.map((statement, index) => {
      if (typeof statement === "string") {
        return {
          stmt: { sql: statement, args: [], named_args: [], want_rows: true }
        };
      }
      let encodedArgs;
      try {
        encodedArgs = encodeSqlArgs(statement.args ?? []);
      } catch (e) {
        throw batchInputError(index, e?.message ?? String(e));
      }
      return {
        stmt: {
          sql: statement.sql,
          args: encodedArgs.args,
          named_args: encodedArgs.namedArgs,
          want_rows: true
        }
      };
    });
    if (mode !== void 0) {
      for (let index = 0; index < statements.length; index++) {
        const statement = statements[index];
        const sql = typeof statement === "string" ? statement : statement.sql;
        const keyword = firstSqlKeyword(sql);
        if (keyword !== void 0 && TRANSACTION_CONTROL_KEYWORDS.has(keyword)) {
          throw batchInputError(index, `${keyword} is not allowed in an atomic batch`);
        }
      }
    }
    let steps;
    let firstUserStepIdx = 0;
    let beginIdx = -1;
    let commitIdx = -1;
    let rollbackIdx = -1;
    if (mode === void 0) {
      steps = userSteps.map(
        (step, i) => i === 0 ? step : { ...step, condition: { type: "ok", step: i - 1 } }
      );
    } else {
      beginIdx = 0;
      firstUserStepIdx = 1;
      const lastUserStepIdx = userSteps.length;
      commitIdx = lastUserStepIdx + 1;
      rollbackIdx = commitIdx + 1;
      steps = [
        { stmt: { sql: `BEGIN ${normalizeBatchMode(mode)}`, args: [], named_args: [], want_rows: false } },
        ...userSteps.map((step, i) => ({
          ...step,
          condition: { type: "ok", step: i === 0 ? beginIdx : firstUserStepIdx + i - 1 }
        })),
        {
          stmt: { sql: "COMMIT", args: [], named_args: [], want_rows: false },
          condition: { type: "ok", step: lastUserStepIdx }
        },
        {
          stmt: { sql: "ROLLBACK", args: [], named_args: [], want_rows: false },
          condition: {
            type: "and",
            conds: [
              { type: "ok", step: beginIdx },
              { type: "not", cond: { type: "ok", step: commitIdx } }
            ]
          }
        }
      ];
    }
    const request = {
      baton: this.baton,
      requests: [
        { type: "batch", batch: { steps } },
        { type: "get_autocommit" }
      ]
    };
    let response;
    try {
      response = await executePipeline(this.httpContext(queryOptions), request, this.createAbortSignal(queryOptions));
    } catch (e) {
      this.baton = null;
      this.autocommit = true;
      throw e;
    }
    this.baton = response.baton;
    if (response.base_url) {
      this.baseUrl = normalizeUrl(response.base_url);
    }
    this.updateAutocommit(response);
    const first = response.results?.[0];
    if (!first) {
      throw new DatabaseError("missing batch result in pipeline response");
    }
    if (first.type === "error") {
      throw new DatabaseError(first.error?.message || "Batch execution failed", first.error?.code);
    }
    if (first.response?.type !== "batch") {
      throw new DatabaseError(`expected batch result in pipeline response, got ${first.response?.type}`);
    }
    const batchResult = first.response.result;
    const stepResults = batchResult?.step_results;
    const stepErrors = batchResult?.step_errors;
    if (!Array.isArray(stepResults) || !Array.isArray(stepErrors) || stepResults.length !== steps.length || stepErrors.length !== steps.length) {
      throw new DatabaseError("batch response does not have one result and one error per step");
    }
    const results = statements.map((_, i) => {
      const stepResult = stepResults[firstUserStepIdx + i];
      return stepResult ? this.decodeBatchStepResult(stepResult, safeIntegers, raw2) : null;
    });
    const rollbackError = rollbackIdx >= 0 ? stepErrors[rollbackIdx] : null;
    const throwStepError = (error, batchIndex) => {
      const e = new DatabaseError(error?.message || "Batch execution failed", error?.code);
      if (batchIndex !== void 0) {
        e.batchIndex = batchIndex;
      }
      e.batchResults = results;
      if (rollbackError) {
        e.rollbackError = new DatabaseError(
          rollbackError.message || "Batch rollback failed",
          rollbackError.code
        );
      }
      throw e;
    };
    if (beginIdx >= 0 && stepErrors[beginIdx]) {
      throwStepError(stepErrors[beginIdx]);
    }
    for (let i = 0; i < userSteps.length; i++) {
      const stepError = stepErrors[firstUserStepIdx + i];
      if (stepError) {
        throwStepError(stepError, i);
      }
    }
    if (commitIdx >= 0 && stepErrors[commitIdx]) {
      throwStepError(stepErrors[commitIdx]);
    }
    if (rollbackError) {
      const error = new DatabaseError(
        rollbackError.message || "Batch rollback failed",
        rollbackError.code
      );
      error.batchResults = results;
      throw error;
    }
    if (results.some((result) => result === null)) {
      throw new DatabaseError("batch response is missing statement results");
    }
    return results;
  }
  /** Decode one statement result of a batch response (section 8.4) into
   * the per-statement result shape returned by `batch()`. */
  decodeBatchStepResult(stepResult, safeIntegers, raw2) {
    const columns = (stepResult.cols ?? []).map((col) => col.name ?? "");
    const columnTypes = (stepResult.cols ?? []).map((col) => col.decltype || "");
    const rows = (stepResult.rows ?? []).map((row) => {
      const decoded = row.map((value) => decodeValue(value, safeIntegers));
      return raw2 ? decoded : this.createObjectRow(decoded, columns);
    });
    let lastInsertRowid;
    if (stepResult.last_insert_rowid !== void 0 && stepResult.last_insert_rowid !== null) {
      lastInsertRowid = typeof stepResult.last_insert_rowid === "number" ? stepResult.last_insert_rowid : parseInt(stepResult.last_insert_rowid, 10);
    }
    const resultSet = {
      columns,
      columnTypes,
      rows,
      rowsAffected: columns.length > 0 ? 0 : stepResult.affected_row_count ?? 0,
      rowsRead: stepResult.rows_read,
      rowsWritten: stepResult.rows_written,
      queryDurationMs: stepResult.query_duration_ms
    };
    if (lastInsertRowid !== void 0) {
      resultSet.lastInsertRowid = lastInsertRowid;
    }
    return resultSet;
  }
  /**
   * Execute a sequence of SQL statements separated by semicolons.
   * 
   * @param sql - SQL string containing multiple statements separated by semicolons
   * @returns Promise resolving when all statements are executed
   */
  async sequence(sql, queryOptions) {
    const request = {
      baton: this.baton,
      requests: [
        { type: "sequence", sql },
        { type: "get_autocommit" }
      ]
    };
    let seqResponse;
    try {
      seqResponse = await executePipeline(this.httpContext(queryOptions), request, this.createAbortSignal(queryOptions));
    } catch (e) {
      this.baton = null;
      this.autocommit = true;
      throw e;
    }
    this.baton = seqResponse.baton;
    if (seqResponse.base_url) {
      this.baseUrl = normalizeUrl(seqResponse.base_url);
    }
    this.updateAutocommit(seqResponse);
    if (seqResponse.results && seqResponse.results[0]) {
      const result = seqResponse.results[0];
      if (result.type === "error") {
        throw new DatabaseError(result.error?.message || "Sequence execution failed", result.error?.code);
      }
    }
  }
  /**
   * Close the session.
   *
   * This sends a close request to the server to properly clean up the stream
   * before resetting the local state.
   */
  async close() {
    if (this.baton) {
      try {
        const request = {
          baton: this.baton,
          requests: [{
            type: "close"
          }]
        };
        await executePipeline(this.httpContext(), request);
      } catch {
      }
    }
    this.baton = null;
    this.baseUrl = "";
    this.autocommit = true;
  }
};
var AsyncLock = class {
  constructor() {
    this.locked = false;
    this.queue = [];
  }
  async acquire() {
    if (!this.locked) {
      this.locked = true;
      return;
    }
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }
  release() {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.locked = false;
    }
  }
};
var LibsqlError = class extends Error {
  constructor(message, code, extendedCode, rawCode, cause) {
    super(message);
    this.name = "LibsqlError";
    this.code = code;
    this.extendedCode = extendedCode;
    this.rawCode = rawCode;
    this.cause = cause;
  }
};
var LibSQLClient = class {
  constructor(config) {
    this.execLock = new AsyncLock();
    this._closed = false;
    this._defaultSafeIntegers = false;
    this.validateConfig(config);
    const sessionConfig = {
      url: config.url,
      authToken: config.authToken || "",
      remoteEncryptionKey: config.remoteEncryptionKey
    };
    this.sessionConfig = sessionConfig;
    this.session = new Session(sessionConfig);
  }
  validateConfig(config) {
    const unsupportedOptions = [];
    if (config.encryptionKey !== void 0) {
      unsupportedOptions.push({ key: "encryptionKey", value: config.encryptionKey });
    }
    if (config.syncUrl !== void 0) {
      unsupportedOptions.push({ key: "syncUrl", value: config.syncUrl });
    }
    if (config.syncInterval !== void 0) {
      unsupportedOptions.push({ key: "syncInterval", value: config.syncInterval });
    }
    if (config.readYourWrites !== void 0) {
      unsupportedOptions.push({ key: "readYourWrites", value: config.readYourWrites });
    }
    if (config.offline !== void 0) {
      unsupportedOptions.push({ key: "offline", value: config.offline });
    }
    if (config.tls !== void 0) {
      unsupportedOptions.push({ key: "tls", value: config.tls });
    }
    if (config.intMode !== void 0) {
      unsupportedOptions.push({ key: "intMode", value: config.intMode });
    }
    if (config.fetch !== void 0) {
      unsupportedOptions.push({ key: "fetch", value: config.fetch });
    }
    if (config.concurrency !== void 0) {
      unsupportedOptions.push({ key: "concurrency", value: config.concurrency });
    }
    if (unsupportedOptions.length > 0) {
      const optionsList = unsupportedOptions.map((opt) => `'${opt.key}'`).join(", ");
      throw new LibsqlError(
        `Unsupported configuration options: ${optionsList}. Only 'url', 'authToken', and 'remoteEncryptionKey' are supported in the serverless compatibility layer.`,
        "UNSUPPORTED_CONFIG"
      );
    }
    if (!config.url) {
      throw new LibsqlError("Missing required 'url' configuration option", "MISSING_URL");
    }
  }
  get closed() {
    return this._closed;
  }
  get protocol() {
    return "http";
  }
  normalizeStatement(stmt) {
    if (typeof stmt === "string") {
      return { sql: stmt, args: [] };
    }
    const args = stmt.args || [];
    if (Array.isArray(args)) {
      return { sql: stmt.sql, args };
    }
    return { sql: stmt.sql, args: Object.values(args) };
  }
  convertResult(result) {
    const resultSet = {
      columns: result.columns || [],
      columnTypes: result.columnTypes || [],
      rows: result.rows || [],
      rowsAffected: result.rowsAffected || 0,
      lastInsertRowid: result.lastInsertRowid != null ? BigInt(result.lastInsertRowid) : void 0,
      toJSON() {
        return {
          columns: this.columns,
          columnTypes: this.columnTypes,
          rows: this.rows,
          rowsAffected: this.rowsAffected,
          lastInsertRowid: this.lastInsertRowid?.toString()
        };
      }
    };
    return resultSet;
  }
  /** Wrap a batch failure in a LibsqlError, preserving the per-statement
   * metadata batch() attaches. */
  wrapBatchError(error) {
    const wrapped = mapDatabaseError(error, "BATCH_ERROR");
    if (error?.batchIndex !== void 0) {
      wrapped.batchIndex = error.batchIndex;
    }
    if (error?.batchResults !== void 0) {
      wrapped.batchResults = error.batchResults.map(
        (result) => result === null ? null : this.convertBatchResult(result)
      );
    }
    return wrapped;
  }
  convertBatchResult(result) {
    return this.convertResult(result);
  }
  normalizeBatchOptions(options) {
    if (options != null && typeof options === "object") {
      return {
        mode: options.mode,
        raw: options.raw === true
      };
    }
    return {
      mode: options,
      raw: false
    };
  }
  async execute(stmtOrSql, args) {
    await this.execLock.acquire();
    try {
      if (this._closed) {
        throw new LibsqlError("Client is closed", "CLIENT_CLOSED");
      }
      let normalizedStmt;
      if (typeof stmtOrSql === "string") {
        const normalizedArgs = args ? Array.isArray(args) ? args : Object.values(args) : [];
        normalizedStmt = { sql: stmtOrSql, args: normalizedArgs };
      } else {
        normalizedStmt = this.normalizeStatement(stmtOrSql);
      }
      const result = await this.session.execute(normalizedStmt.sql, normalizedStmt.args, this._defaultSafeIntegers);
      return this.convertResult(result);
    } catch (error) {
      if (error instanceof LibsqlError) {
        throw error;
      }
      throw mapDatabaseError(error, "EXECUTE_ERROR");
    } finally {
      this.execLock.release();
    }
  }
  async batch(stmts, options) {
    await this.execLock.acquire();
    try {
      if (this._closed) {
        throw new LibsqlError("Client is closed", "CLIENT_CLOSED");
      }
      if (!Array.isArray(stmts)) {
        throw new TypeError("Expected first argument to be an array of statements");
      }
      const { mode, raw: raw2 } = this.normalizeBatchOptions(options);
      const batchMode = mode ?? "deferred";
      const results = await this.session.batch(
        stmts,
        batchMode,
        void 0,
        this._defaultSafeIntegers,
        raw2
      );
      return results.map((result) => this.convertBatchResult(result));
    } catch (error) {
      if (error instanceof LibsqlError) {
        throw error;
      }
      throw this.wrapBatchError(error);
    } finally {
      this.execLock.release();
    }
  }
  async migrate(stmts) {
    return this.batch(stmts, "write");
  }
  modeToBeginSql(mode) {
    switch (mode) {
      case "write":
        return "BEGIN IMMEDIATE";
      case "deferred":
        return "BEGIN DEFERRED";
      case "read":
      default:
        return "BEGIN";
    }
  }
  async transaction(mode) {
    await this.execLock.acquire();
    if (this._closed) {
      this.execLock.release();
      throw new LibsqlError("Client is closed", "CLIENT_CLOSED");
    }
    const txSession = new Session(this.sessionConfig);
    let txClosed = false;
    let cleanupStarted = false;
    const ensureOpen = () => {
      if (txClosed) {
        throw new LibsqlError("Transaction is closed", "TRANSACTION_CLOSED");
      }
    };
    const closeTx = async () => {
      if (cleanupStarted) return;
      cleanupStarted = true;
      txClosed = true;
      try {
        await txSession.close();
      } finally {
        this.execLock.release();
      }
    };
    const executeInTx = async (stmt) => {
      ensureOpen();
      const normalized = this.normalizeStatement(stmt);
      try {
        const result = await txSession.execute(normalized.sql, normalized.args, this._defaultSafeIntegers);
        return this.convertResult(result);
      } catch (error) {
        throw mapDatabaseError(error, "EXECUTE_ERROR");
      }
    };
    try {
      await txSession.sequence(this.modeToBeginSql(mode));
    } catch (error) {
      await closeTx();
      throw mapDatabaseError(error, "BEGIN_ERROR");
    }
    return {
      execute: async (stmtOrSql, args) => {
        if (typeof stmtOrSql === "string") {
          const normalizedArgs = args ? Array.isArray(args) ? args : Object.values(args) : [];
          return executeInTx({ sql: stmtOrSql, args: normalizedArgs });
        }
        return executeInTx(stmtOrSql);
      },
      batch: async (stmts) => {
        ensureOpen();
        if (!Array.isArray(stmts)) {
          throw new TypeError("Expected first argument to be an array of statements");
        }
        try {
          const results = await txSession.batch(
            stmts,
            void 0,
            void 0,
            this._defaultSafeIntegers
          );
          return results.map((result) => this.convertBatchResult(result));
        } catch (error) {
          if (error instanceof LibsqlError) {
            throw error;
          }
          throw this.wrapBatchError(error);
        }
      },
      executeMultiple: async (sql) => {
        ensureOpen();
        try {
          await txSession.sequence(sql);
        } catch (error) {
          throw mapDatabaseError(error, "EXECUTE_MULTIPLE_ERROR");
        }
      },
      commit: async () => {
        ensureOpen();
        try {
          await txSession.sequence("COMMIT");
        } catch (error) {
          throw mapDatabaseError(error, "COMMIT_ERROR");
        } finally {
          await closeTx();
        }
      },
      rollback: async () => {
        ensureOpen();
        try {
          await txSession.sequence("ROLLBACK");
        } catch (error) {
          throw mapDatabaseError(error, "ROLLBACK_ERROR");
        } finally {
          await closeTx();
        }
      },
      close: () => {
        if (txClosed) return;
        txClosed = true;
        void txSession.sequence("ROLLBACK").catch(() => void 0).finally(() => {
          void closeTx();
        });
      },
      get closed() {
        return txClosed;
      }
    };
  }
  async executeMultiple(sql) {
    await this.execLock.acquire();
    try {
      if (this._closed) {
        throw new LibsqlError("Client is closed", "CLIENT_CLOSED");
      }
      await this.session.sequence(sql);
    } catch (error) {
      if (error instanceof LibsqlError) {
        throw error;
      }
      throw mapDatabaseError(error, "EXECUTE_MULTIPLE_ERROR");
    } finally {
      this.execLock.release();
    }
  }
  async sync() {
    throw new LibsqlError("Sync not supported for remote databases", "NOT_SUPPORTED");
  }
  close() {
    this._closed = true;
    this.session.close().catch((error) => {
      console.error("Error closing session:", error);
    });
  }
  reconnect() {
    const wasOpen = !this._closed;
    this._closed = false;
    if (wasOpen) {
      this.session.close().catch((error) => {
        console.error("Error closing session during reconnect:", error);
      });
    }
    this.session = new Session(this.sessionConfig);
  }
};
function createClient(config) {
  return new LibSQLClient(config);
}
var sqliteBaseErrorCodes = /* @__PURE__ */ new Set([
  "SQLITE_ERROR",
  "SQLITE_INTERNAL",
  "SQLITE_PERM",
  "SQLITE_ABORT",
  "SQLITE_BUSY",
  "SQLITE_LOCKED",
  "SQLITE_NOMEM",
  "SQLITE_READONLY",
  "SQLITE_INTERRUPT",
  "SQLITE_IOERR",
  "SQLITE_CORRUPT",
  "SQLITE_NOTFOUND",
  "SQLITE_FULL",
  "SQLITE_CANTOPEN",
  "SQLITE_PROTOCOL",
  "SQLITE_EMPTY",
  "SQLITE_SCHEMA",
  "SQLITE_TOOBIG",
  "SQLITE_CONSTRAINT",
  "SQLITE_MISMATCH",
  "SQLITE_MISUSE",
  "SQLITE_NOLFS",
  "SQLITE_AUTH",
  "SQLITE_FORMAT",
  "SQLITE_RANGE",
  "SQLITE_NOTADB",
  "SQLITE_NOTICE",
  "SQLITE_WARNING"
]);
function parseErrorCode(serverCode) {
  if (sqliteBaseErrorCodes.has(serverCode)) {
    return { code: serverCode };
  }
  for (const base of sqliteBaseErrorCodes) {
    if (serverCode.startsWith(base + "_")) {
      return { code: base, extendedCode: serverCode };
    }
  }
  return { code: serverCode };
}
function mapDatabaseError(error, fallbackCode) {
  if (error instanceof DatabaseError && error.code) {
    const { code, extendedCode } = parseErrorCode(error.code);
    return new LibsqlError(error.message, code, extendedCode, error.rawCode, error);
  }
  const cause = error instanceof Error ? error : void 0;
  return new LibsqlError(error.message ?? String(error), fallbackCode, void 0, void 0, cause);
}

// src/lib/motionTypes.ts
var DEFAULT_MOTION_TYPES = [
  {
    id: "motion-free",
    name: "\u81EA\u7531\u78CB\u5546",
    hasTopic: false,
    hasSpeakersList: false,
    needsTotalDuration: true,
    hasUnitDuration: false
  },
  {
    id: "motion-moderated",
    name: "\u6709\u4E3B\u6301\u6838\u5FC3\u78CB\u5546",
    hasTopic: true,
    hasSpeakersList: true,
    needsTotalDuration: true,
    hasUnitDuration: true
  },
  {
    id: "motion-debate",
    name: "\u81EA\u7531\u8FA9\u8BBA",
    hasTopic: false,
    hasSpeakersList: true,
    needsTotalDuration: true,
    hasUnitDuration: true
  }
];
function defaultMotionTypes() {
  return DEFAULT_MOTION_TYPES.map((item) => ({ ...item }));
}

// src/lib/fileTypes.ts
var DEFAULT_FILE_TYPES = [
  {
    id: "file-directive",
    name: "\u6307\u4EE4\u6587\u4EF6",
    allowPersonal: true,
    forceCoSign: false,
    allowPublic: false
  },
  {
    id: "file-draft-resolution",
    name: "\u51B3\u8BAE\u8349\u6848",
    allowPersonal: false,
    forceCoSign: false,
    allowPublic: true
  },
  {
    id: "file-amendment",
    name: "\u4FEE\u6B63\u6848",
    allowPersonal: false,
    forceCoSign: false,
    allowPublic: true
  },
  {
    id: "file-agreement",
    name: "\u534F\u5B9A",
    allowPersonal: false,
    forceCoSign: true,
    allowPublic: true
  },
  {
    id: "file-statement",
    name: "\u58F0\u660E",
    allowPersonal: false,
    forceCoSign: false,
    allowPublic: true
  }
];
function defaultFileTypes() {
  return DEFAULT_FILE_TYPES.map((item) => ({ ...item }));
}
function normalizeFileTypes(value) {
  if (!Array.isArray(value)) return defaultFileTypes();
  const types = value.filter((item) => Boolean(item) && typeof item === "object").map((item, index) => ({
    id: typeof item.id === "string" && item.id ? item.id : `file-type-${index + 1}`,
    name: typeof item.name === "string" && item.name.trim() ? item.name.trim().slice(0, 40) : `\u6587\u4EF6\u7C7B\u578B ${index + 1}`,
    allowPersonal: item.allowPersonal === true,
    forceCoSign: item.forceCoSign === true,
    allowPublic: item.allowPublic === true
  }));
  return types.length > 0 ? types : defaultFileTypes();
}

// src/state/defaults.ts
var DEFAULT_THEME = "\u5386\u53F2\u59D4\u5458\u4F1A";
var SCHEMA_VERSION = 2;
var DEFAULT_AUTHOR = {
  name: "\u{1F31F}\u5929\u9A6C\u53F8\u6211\u795D\u4F60\u661F\u9014\u7480\u74A8",
  xiaohongshuId: "4277718409",
  xiaohongshuUrl: ""
};
var DEFAULT_SETTINGS = {
  defaultMajority: "SIMPLE",
  skipVetoStep: false,
  skipMajorityStep: false,
  allowPersonalFiles: false
};
function createInitialState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    theme: DEFAULT_THEME,
    author: { ...DEFAULT_AUTHOR },
    attendanceRule: "ALL",
    voteMode: "DELEGATION",
    delegations: [],
    sessions: [],
    currentSessionId: null,
    currentTopicId: null,
    resolutions: [],
    motionTypes: defaultMotionTypes(),
    activeMotion: null,
    fileTypes: defaultFileTypes(),
    settings: { ...DEFAULT_SETTINGS },
    updatedAt: Date.now()
  };
}

// server/api/db.ts
var DEFAULT_CONFERENCE_ID = "default";
var DEFAULT_CONFERENCE_NAME = "\u5386\u53F2\u59D4\u5458\u4F1A";
var SCHEMA = [
  `CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    seat_id TEXT,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS conferences (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    created_by TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS conference_members (
    conference_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    role TEXT NOT NULL,
    seat_id TEXT,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (conference_id, account_id)
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    conference_id TEXT,
    expires_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS conference_meeting (
    conference_id TEXT PRIMARY KEY,
    state TEXT NOT NULL,
    revision INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS conference_time (
    conference_id TEXT PRIMARY KEY,
    now_ms INTEGER NOT NULL,
    rate REAL NOT NULL,
    running INTEGER NOT NULL,
    anchor_ms INTEGER NOT NULL,
    crisis_paused INTEGER NOT NULL DEFAULT 0,
    crisis_event_id TEXT,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS meeting (
    id INTEGER PRIMARY KEY,
    state TEXT NOT NULL,
    revision INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS time_state (
    id INTEGER PRIMARY KEY,
    now_ms INTEGER NOT NULL,
    rate REAL NOT NULL,
    running INTEGER NOT NULL,
    anchor_ms INTEGER NOT NULL,
    crisis_paused INTEGER NOT NULL DEFAULT 0,
    crisis_event_id TEXT,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    conference_id TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    event_time INTEGER NOT NULL,
    is_crisis INTEGER NOT NULL DEFAULT 0,
    is_realtime INTEGER NOT NULL DEFAULT 0,
    visibility TEXT NOT NULL DEFAULT 'SECRET',
    published_at INTEGER,
    created_at INTEGER NOT NULL,
    created_by TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS event_recipients (
    event_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (event_id, account_id)
  )`,
  `CREATE TABLE IF NOT EXISTS event_reads (
    event_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (event_id, account_id)
  )`,
  `CREATE TABLE IF NOT EXISTS archives (
    id TEXT PRIMARY KEY,
    conference_id TEXT,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    data BLOB NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS event_attachments (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    conference_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    mime TEXT NOT NULL,
    size INTEGER NOT NULL,
    data BLOB NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS file_cosigners (
    file_id TEXT NOT NULL,
    conference_id TEXT NOT NULL,
    delegation_id TEXT NOT NULL,
    confirmed_at INTEGER,
    confirmed_by TEXT,
    PRIMARY KEY (file_id, delegation_id)
  )`,
  `CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    conference_id TEXT,
    title TEXT NOT NULL,
    filename TEXT NOT NULL,
    mime TEXT NOT NULL,
    size INTEGER NOT NULL,
    file_type_id TEXT,
    file_type TEXT NOT NULL DEFAULT '\u5176\u4ED6',
    text_content TEXT NOT NULL DEFAULT '',
    scope TEXT NOT NULL DEFAULT 'DELEGATION',
    delegation_id TEXT,
    co_sign INTEGER NOT NULL DEFAULT 0,
    data BLOB NOT NULL,
    submitted_by TEXT NOT NULL,
    submitted_at INTEGER NOT NULL,
    read INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS push_config (
    id INTEGER PRIMARY KEY,
    public_key TEXT NOT NULL,
    private_key TEXT NOT NULL,
    subject TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS push_subscriptions (
    id TEXT PRIMARY KEY,
    conference_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`
];
var localClient = null;
var remotePromise = null;
var resolvedClient = null;
var initPromise = null;
function createRemoteClient() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error("\u672A\u914D\u7F6E TURSO_DATABASE_URL\uFF0C\u8BF7\u5728\u73AF\u5883\u53D8\u91CF\u4E2D\u8BBE\u7F6E\u6570\u636E\u5E93\u5730\u5740");
  }
  return createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN
  });
}
function getClient() {
  if (localClient) return Promise.resolve(localClient);
  if (resolvedClient) return Promise.resolve(resolvedClient);
  if (!remotePromise) {
    remotePromise = Promise.resolve().then(() => createRemoteClient()).then((client) => {
      resolvedClient = client;
      return client;
    }).catch((error) => {
      remotePromise = null;
      throw error;
    });
  }
  return remotePromise;
}
var clientProxy = new Proxy({}, {
  get(_target, property) {
    if (property === "then") return void 0;
    return (...args) => getClient().then((client) => {
      const value = client[property];
      if (typeof value === "function") {
        return value.apply(client, args);
      }
      return value;
    });
  }
});
function getDb() {
  return clientProxy;
}
async function ensureColumn(table, column, definition) {
  const db = getDb();
  const info = await db.execute(`PRAGMA table_info(${table})`);
  if (!info.rows.some((row) => String(row.name) === column)) {
    await db.execute(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  }
}
async function ensureInitialChair() {
  const db = getDb();
  const existing = await db.execute({
    sql: "SELECT id FROM accounts WHERE username = ? LIMIT 1",
    args: ["123456"]
  });
  if (existing.rows.length === 0) {
    await db.execute({
      sql: `INSERT INTO accounts (id, username, password, name, role, created_at)
            VALUES (?, ?, ?, ?, 'chair', ?)`,
      args: ["chair", "123456", hashPassword("abcd"), "\u4E3B\u5E2D\u56E2", Date.now()]
    });
  }
}
async function ensureDefaultConference() {
  const db = getDb();
  const existing = await db.execute("SELECT id FROM conferences LIMIT 1");
  if (existing.rows.length > 0) return;
  const now = Date.now();
  const legacyMeeting = await db.execute(
    "SELECT state, revision FROM meeting WHERE id = 1 LIMIT 1"
  );
  let state = createInitialState();
  let revision = 0;
  if (legacyMeeting.rows[0]) {
    revision = Number(legacyMeeting.rows[0].revision ?? 0);
    try {
      const parsed = JSON.parse(String(legacyMeeting.rows[0].state));
      if (parsed && typeof parsed === "object") {
        state = { ...state, ...parsed };
      }
    } catch {
    }
  }
  const name = typeof state.theme === "string" && state.theme.trim() ? state.theme.trim().slice(0, 80) : DEFAULT_CONFERENCE_NAME;
  state = { ...state, theme: name };
  await db.batch([
    {
      sql: "INSERT INTO conferences (id, name, created_at, created_by) VALUES (?, ?, ?, ?)",
      args: [DEFAULT_CONFERENCE_ID, name, now, "chair"]
    },
    {
      sql: `INSERT INTO conference_meeting (conference_id, state, revision, updated_at)
            VALUES (?, ?, ?, ?)`,
      args: [DEFAULT_CONFERENCE_ID, JSON.stringify(state), revision, now]
    }
  ]);
  const legacyTime = await db.execute("SELECT * FROM time_state WHERE id = 1 LIMIT 1");
  if (legacyTime.rows[0]) {
    const row = legacyTime.rows[0];
    await db.execute({
      sql: `INSERT INTO conference_time
            (conference_id, now_ms, rate, running, anchor_ms, crisis_paused, crisis_event_id, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        DEFAULT_CONFERENCE_ID,
        Number(row.now_ms),
        Number(row.rate),
        Number(row.running),
        Number(row.anchor_ms),
        Number(row.crisis_paused),
        row.crisis_event_id ? String(row.crisis_event_id) : null,
        Number(row.updated_at)
      ]
    });
  } else {
    await db.execute({
      sql: `INSERT INTO conference_time
            (conference_id, now_ms, rate, running, anchor_ms, crisis_paused, crisis_event_id, updated_at)
            VALUES (?, ?, 1, 0, ?, 0, NULL, ?)`,
      args: [DEFAULT_CONFERENCE_ID, now, now, now]
    });
  }
  await db.execute("UPDATE events SET conference_id = ? WHERE conference_id IS NULL", [
    DEFAULT_CONFERENCE_ID
  ]);
  await db.execute("UPDATE files SET conference_id = ? WHERE conference_id IS NULL", [
    DEFAULT_CONFERENCE_ID
  ]);
  await db.execute("UPDATE archives SET conference_id = ? WHERE conference_id IS NULL", [
    DEFAULT_CONFERENCE_ID
  ]);
  await db.execute("UPDATE sessions SET conference_id = ? WHERE conference_id IS NULL", [
    DEFAULT_CONFERENCE_ID
  ]);
  const accounts = await db.execute(
    "SELECT id, role, seat_id FROM accounts ORDER BY created_at ASC"
  );
  for (const account of accounts.rows) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO conference_members
            (conference_id, account_id, role, seat_id, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        DEFAULT_CONFERENCE_ID,
        String(account.id),
        String(account.role) === "chair" ? "chair" : "delegate",
        account.seat_id ? String(account.seat_id) : null,
        now
      ]
    });
  }
}
async function seed() {
  const db = getDb();
  await ensureInitialChair();
  const meeting = await db.execute(
    "SELECT conference_id FROM conference_meeting LIMIT 1"
  );
  if (meeting.rows.length === 0) {
    const state = createInitialState();
    await db.execute({
      sql: `INSERT OR IGNORE INTO conference_meeting
            (conference_id, state, revision, updated_at) VALUES (?, ?, 0, ?)`,
      args: [DEFAULT_CONFERENCE_ID, JSON.stringify(state), Date.now()]
    });
  }
  const time = await db.execute(
    "SELECT conference_id FROM conference_time LIMIT 1"
  );
  if (time.rows.length === 0) {
    const now = Date.now();
    await db.execute({
      sql: `INSERT OR IGNORE INTO conference_time
            (conference_id, now_ms, rate, running, anchor_ms, crisis_paused, crisis_event_id, updated_at)
            VALUES (?, ?, 1, 0, ?, 0, NULL, ?)`,
      args: [DEFAULT_CONFERENCE_ID, now, now, now]
    });
  }
}
async function init() {
  const db = getDb();
  await db.batch(SCHEMA);
  await ensureColumn("accounts", "seat_id", "seat_id TEXT");
  await ensureColumn(
    "events",
    "visibility",
    "visibility TEXT NOT NULL DEFAULT 'SECRET'"
  );
  await ensureColumn("events", "conference_id", "conference_id TEXT");
  await ensureColumn("files", "conference_id", "conference_id TEXT");
  await ensureColumn("archives", "conference_id", "conference_id TEXT");
  await ensureColumn("sessions", "conference_id", "conference_id TEXT");
  await ensureColumn("files", "file_type", "file_type TEXT NOT NULL DEFAULT '\u5176\u4ED6'");
  await ensureColumn("files", "file_type_id", "file_type_id TEXT");
  await ensureColumn("files", "text_content", "text_content TEXT NOT NULL DEFAULT ''");
  await ensureColumn("files", "scope", "scope TEXT NOT NULL DEFAULT 'DELEGATION'");
  await ensureColumn("files", "delegation_id", "delegation_id TEXT");
  await ensureColumn("files", "co_sign", "co_sign INTEGER NOT NULL DEFAULT 0");
  await ensureColumn("events", "is_realtime", "is_realtime INTEGER NOT NULL DEFAULT 0");
  await ensureInitialChair();
  await ensureDefaultConference();
  await db.execute(
    `INSERT OR IGNORE INTO event_reads (event_id, account_id, read)
     SELECT event_id, account_id, read FROM event_recipients`
  );
  await seed();
}
function ensureDb() {
  if (!initPromise) {
    initPromise = init().catch((error) => {
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
}

// server/api/auth.ts
var SESSION_COOKIE = "mun_session";
var SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1e3;
function toUser(row, membership) {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: membership.role === "chair" ? "chair" : "delegate",
    conferenceId: membership.conference_id,
    conferenceName: membership.conference_name
  };
}
var secureCookies = Boolean(process.env.VERCEL) || process.env.COOKIE_SECURE === "true";
async function listMemberships(accountId) {
  const result = await getDb().execute({
    sql: `SELECT c.id, c.name, cm.role
          FROM conference_members cm
          JOIN conferences c ON c.id = cm.conference_id
          WHERE cm.account_id = ?
          ORDER BY c.created_at ASC`,
    args: [accountId]
  });
  return result.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    role: String(row.role) === "chair" ? "chair" : "delegate"
  }));
}
async function findMembership(accountId, conferenceId) {
  const result = await getDb().execute({
    sql: `SELECT cm.conference_id, cm.role, c.name AS conference_name
          FROM conference_members cm
          JOIN conferences c ON c.id = cm.conference_id
          WHERE cm.account_id = ?
          ORDER BY CASE WHEN cm.conference_id = ? THEN 0 ELSE 1 END, c.created_at ASC
          LIMIT 1`,
    args: [accountId, conferenceId ?? ""]
  });
  return result.rows[0];
}
async function loginUser(c, usernameRaw, password) {
  const username = usernameRaw.trim();
  if (!username || !password) {
    throw new HTTPException(400, { message: "\u8BF7\u8F93\u5165\u8D26\u53F7\u548C\u5BC6\u7801" });
  }
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT * FROM accounts WHERE username = ? LIMIT 1",
    args: [username]
  });
  const row = result.rows[0];
  if (!row || !verifyPassword(password, row.password)) {
    throw new HTTPException(401, { message: "\u8D26\u53F7\u6216\u5BC6\u7801\u9519\u8BEF" });
  }
  const membership = await findMembership(row.id);
  if (!membership) {
    throw new HTTPException(403, { message: "\u8BE5\u8D26\u53F7\u8FD8\u6CA1\u6709\u52A0\u5165\u4EFB\u4F55\u4F1A\u573A" });
  }
  const token = randomBytes2(32).toString("hex");
  const expiresAt = Date.now() + SESSION_TTL_MS;
  await db.execute({
    sql: "DELETE FROM sessions WHERE expires_at < ?",
    args: [Date.now()]
  });
  await db.execute({
    sql: "INSERT INTO sessions (token, account_id, conference_id, expires_at) VALUES (?, ?, ?, ?)",
    args: [token, row.id, membership.conference_id, expiresAt]
  });
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1e3),
    secure: secureCookies
  });
  return toUser(row, membership);
}
async function logoutUser(c) {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) {
    await getDb().execute({
      sql: "DELETE FROM sessions WHERE token = ?",
      args: [token]
    });
  }
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
}
async function getSessionUser(c) {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return null;
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT a.id, a.username, a.name, a.role, a.created_at,
                 s.conference_id, s.expires_at,
                 cm.role AS member_role, c.name AS conference_name
          FROM sessions s
          JOIN accounts a ON a.id = s.account_id
          LEFT JOIN conference_members cm
            ON cm.conference_id = s.conference_id AND cm.account_id = a.id
          LEFT JOIN conferences c ON c.id = s.conference_id
          WHERE s.token = ?
          LIMIT 1`,
    args: [token]
  });
  const row = result.rows[0];
  if (!row) return null;
  if (Number(row.expires_at) < Date.now()) {
    await db.execute({ sql: "DELETE FROM sessions WHERE token = ?", args: [token] });
    return null;
  }
  if (!row.conference_id || !row.member_role) {
    const membership = await findMembership(row.id);
    if (!membership) return null;
    await db.execute({
      sql: "UPDATE sessions SET conference_id = ? WHERE token = ?",
      args: [membership.conference_id, token]
    });
    return toUser(row, membership);
  }
  return toUser(row, {
    conference_id: row.conference_id,
    role: row.member_role,
    conference_name: row.conference_name ?? "\u4F1A\u573A"
  });
}
async function requireUser(c) {
  const user = await getSessionUser(c);
  if (!user) throw new HTTPException(401, { message: "\u8BF7\u5148\u767B\u5F55" });
  return user;
}
async function requireChair(c) {
  const user = await requireUser(c);
  if (user.role !== "chair") {
    throw new HTTPException(403, { message: "\u53EA\u6709\u4E3B\u5E2D\u53EF\u4EE5\u6267\u884C\u6B64\u64CD\u4F5C" });
  }
  return user;
}
async function switchConference(c, conferenceId) {
  const user = await requireUser(c);
  const db = getDb();
  const token = getCookie(c, SESSION_COOKIE);
  const membership = await db.execute({
    sql: `SELECT cm.conference_id, cm.role, c.name AS conference_name
          FROM conference_members cm
          JOIN conferences c ON c.id = cm.conference_id
          WHERE cm.account_id = ? AND cm.conference_id = ?
          LIMIT 1`,
    args: [user.id, conferenceId]
  });
  const row = membership.rows[0];
  if (!row || !token) {
    throw new HTTPException(403, { message: "\u4F60\u4E0D\u662F\u8BE5\u4F1A\u573A\u6210\u5458" });
  }
  await db.execute({
    sql: "UPDATE sessions SET conference_id = ? WHERE token = ?",
    args: [conferenceId, token]
  });
  const account = await db.execute({
    sql: "SELECT * FROM accounts WHERE id = ? LIMIT 1",
    args: [user.id]
  });
  const accountRow = account.rows[0];
  return toUser(accountRow, row);
}
async function setAccountPassword(accountId, password) {
  const db = getDb();
  await db.execute({
    sql: "UPDATE accounts SET password = ? WHERE id = ?",
    args: [hashPassword(password), accountId]
  });
  await db.execute({
    sql: "DELETE FROM sessions WHERE account_id = ?",
    args: [accountId]
  });
}

// server/api/push.ts
var webpushModule = __toESM(require_src2(), 1);
var webpush = webpushModule.default ?? webpushModule;
var cachedConfig = null;
async function getVapidConfig() {
  if (cachedConfig) return cachedConfig;
  const db = getDb();
  let result = await db.execute("SELECT public_key, private_key, subject FROM push_config WHERE id = 1");
  let row = result.rows[0];
  if (!row) {
    const generated = webpush.generateVAPIDKeys();
    const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:admin@example.com";
    await db.execute({
      sql: `INSERT OR IGNORE INTO push_config (id, public_key, private_key, subject)
            VALUES (1, ?, ?, ?)`,
      args: [generated.publicKey, generated.privateKey, subject]
    });
    result = await db.execute("SELECT public_key, private_key, subject FROM push_config WHERE id = 1");
    row = result.rows[0];
  }
  if (!row) return null;
  cachedConfig = {
    publicKey: String(row.public_key),
    privateKey: String(row.private_key),
    subject: String(row.subject)
  };
  webpush.setVapidDetails(
    cachedConfig.subject,
    cachedConfig.publicKey,
    cachedConfig.privateKey
  );
  return cachedConfig;
}
async function getPushPublicKey() {
  const config = await getVapidConfig();
  return config?.publicKey ?? null;
}
async function savePushSubscription(accountId, conferenceId, subscription) {
  const endpoint = typeof subscription.endpoint === "string" ? subscription.endpoint : "";
  const p256dh = typeof subscription.keys?.p256dh === "string" ? subscription.keys.p256dh : "";
  const auth = typeof subscription.keys?.auth === "string" ? subscription.keys.auth : "";
  if (!endpoint || !p256dh || !auth) return false;
  await getDb().execute({
    sql: `INSERT INTO push_subscriptions
          (id, conference_id, account_id, endpoint, p256dh, auth, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(endpoint) DO UPDATE SET
            conference_id = excluded.conference_id,
            account_id = excluded.account_id,
            p256dh = excluded.p256dh,
            auth = excluded.auth`,
    args: [createId("sub"), conferenceId, accountId, endpoint, p256dh, auth, Date.now()]
  });
  return true;
}
async function removePushSubscription(accountId, endpoint) {
  await getDb().execute({
    sql: "DELETE FROM push_subscriptions WHERE account_id = ? AND endpoint = ?",
    args: [accountId, endpoint]
  });
}
async function sendPushToAccounts(accountIds, payload) {
  const ids = [...new Set(accountIds)];
  if (ids.length === 0) return;
  const config = await getVapidConfig();
  if (!config) return;
  const placeholders = ids.map(() => "?").join(",");
  const result = await getDb().execute({
    sql: `SELECT id, endpoint, p256dh, auth FROM push_subscriptions
          WHERE account_id IN (${placeholders})`,
    args: ids
  });
  for (const row of result.rows) {
    try {
      await webpush.sendNotification(
        {
          endpoint: String(row.endpoint),
          keys: { p256dh: String(row.p256dh), auth: String(row.auth) }
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url ?? "/#/events",
          tag: payload.tag ?? "mun-event"
        }),
        { TTL: 60 * 60 * 24 }
      );
    } catch (error) {
      const statusCode = error.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await getDb().execute({
          sql: "DELETE FROM push_subscriptions WHERE id = ?",
          args: [String(row.id)]
        }).catch(() => void 0);
      } else {
        console.warn("[push] send failed", statusCode ?? error);
      }
    }
  }
}
async function sendEventPush(conferenceId, eventId) {
  const db = getDb();
  const event = await db.execute({
    sql: "SELECT title, content, visibility FROM events WHERE id = ? AND conference_id = ? LIMIT 1",
    args: [eventId, conferenceId]
  });
  const row = event.rows[0];
  if (!row) return;
  let audience;
  if (String(row.visibility) === "PUBLIC") {
    const members = await db.execute({
      sql: "SELECT account_id FROM conference_members WHERE conference_id = ?",
      args: [conferenceId]
    });
    audience = members.rows.map((item) => String(item.account_id));
  } else {
    const recipients = await db.execute({
      sql: "SELECT account_id FROM event_recipients WHERE event_id = ?",
      args: [eventId]
    });
    audience = recipients.rows.map((item) => String(item.account_id));
  }
  await sendPushToAccounts(audience, {
    title: String(row.title),
    body: String(row.content).slice(0, 140) || "\u4F1A\u573A\u6709\u4E00\u5219\u65B0\u4E8B\u4EF6",
    url: "/#/events",
    tag: `mun-event-${eventId}`
  });
}

// server/api/time.ts
var DEFAULT_RATE = 1;
async function loadRow(conferenceId) {
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT * FROM conference_time WHERE conference_id = ? LIMIT 1",
    args: [conferenceId]
  });
  const row = result.rows[0];
  if (row) {
    return {
      now_ms: Number(row.now_ms),
      rate: Number(row.rate),
      running: Number(row.running),
      anchor_ms: Number(row.anchor_ms),
      crisis_paused: Number(row.crisis_paused),
      crisis_event_id: row.crisis_event_id ? String(row.crisis_event_id) : null,
      updated_at: Number(row.updated_at)
    };
  }
  const now = Date.now();
  await db.execute({
    sql: `INSERT OR IGNORE INTO conference_time
          (conference_id, now_ms, rate, running, anchor_ms, crisis_paused, crisis_event_id, updated_at)
          VALUES (?, ?, ?, 0, ?, 0, NULL, ?)`,
    args: [conferenceId, now, DEFAULT_RATE, now, now]
  });
  return {
    now_ms: now,
    rate: DEFAULT_RATE,
    running: 0,
    anchor_ms: now,
    crisis_paused: 0,
    crisis_event_id: null,
    updated_at: now
  };
}
function currentFromRow(row, at = Date.now()) {
  if (!row.running) return row.now_ms;
  return row.now_ms + Math.max(0, at - row.anchor_ms) * row.rate;
}
async function saveRow(conferenceId, row) {
  await getDb().execute({
    sql: `UPDATE conference_time SET
            now_ms = ?, rate = ?, running = ?, anchor_ms = ?,
            crisis_paused = ?, crisis_event_id = ?, updated_at = ?
          WHERE conference_id = ?`,
    args: [
      Math.round(row.now_ms),
      row.rate,
      row.running,
      row.anchor_ms,
      row.crisis_paused,
      row.crisis_event_id,
      row.updated_at,
      conferenceId
    ]
  });
}
async function getTimeState(conferenceId) {
  const row = await loadRow(conferenceId);
  const at = Date.now();
  return {
    nowMs: row.now_ms,
    rate: row.rate,
    running: row.running === 1,
    crisisPaused: row.crisis_paused === 1,
    crisisEventId: row.crisis_event_id,
    currentMs: Math.round(currentFromRow(row, at)),
    updatedAt: row.updated_at
  };
}
async function getCurrentTime(conferenceId) {
  const row = await loadRow(conferenceId);
  return Math.round(currentFromRow(row));
}
async function setCurrentTime(conferenceId, ms) {
  const row = await loadRow(conferenceId);
  const at = Date.now();
  await saveRow(conferenceId, {
    ...row,
    now_ms: Math.round(ms),
    anchor_ms: at,
    updated_at: at
  });
}
async function startTimeFlow(conferenceId) {
  const row = await loadRow(conferenceId);
  const at = Date.now();
  await saveRow(conferenceId, {
    ...row,
    now_ms: Math.round(currentFromRow(row, at)),
    anchor_ms: at,
    running: 1,
    updated_at: at
  });
}
async function pauseTimeFlow(conferenceId) {
  const row = await loadRow(conferenceId);
  const at = Date.now();
  await saveRow(conferenceId, {
    ...row,
    now_ms: Math.round(currentFromRow(row, at)),
    anchor_ms: at,
    running: 0,
    updated_at: at
  });
}
async function setTimeRate(conferenceId, rate) {
  const row = await loadRow(conferenceId);
  const at = Date.now();
  await saveRow(conferenceId, {
    ...row,
    now_ms: Math.round(currentFromRow(row, at)),
    anchor_ms: at,
    rate,
    updated_at: at
  });
}
async function pauseForCrisis(conferenceId, eventId) {
  const row = await loadRow(conferenceId);
  const at = Date.now();
  await saveRow(conferenceId, {
    ...row,
    now_ms: Math.round(currentFromRow(row, at)),
    anchor_ms: at,
    running: 0,
    crisis_paused: 1,
    crisis_event_id: eventId,
    updated_at: at
  });
}
async function clearCrisisPause(conferenceId, eventId) {
  const row = await loadRow(conferenceId);
  if (eventId && row.crisis_event_id && row.crisis_event_id !== eventId) return;
  const at = Date.now();
  await saveRow(conferenceId, {
    ...row,
    now_ms: Math.round(currentFromRow(row, at)),
    anchor_ms: at,
    crisis_paused: 0,
    crisis_event_id: null,
    updated_at: at
  });
}

// server/api/events.ts
function toEventRow(row) {
  return {
    id: String(row.id),
    conference_id: String(row.conference_id),
    title: String(row.title),
    content: String(row.content),
    event_time: Number(row.event_time),
    is_crisis: Number(row.is_crisis),
    is_realtime: Number(row.is_realtime ?? 0),
    visibility: row.visibility === "PUBLIC" ? "PUBLIC" : "SECRET",
    published_at: row.published_at === null ? null : Number(row.published_at),
    created_at: Number(row.created_at),
    created_by: String(row.created_by)
  };
}
async function publishDueEvents(conferenceId) {
  const db = getDb();
  const now = await getCurrentTime(conferenceId);
  const due = await db.execute({
    sql: "SELECT id, is_crisis FROM events WHERE conference_id = ? AND published_at IS NULL AND event_time <= ?",
    args: [conferenceId, now]
  });
  for (const row of due.rows) {
    const eventId = String(row.id);
    const updated = await db.execute({
      sql: "UPDATE events SET published_at = ? WHERE id = ? AND published_at IS NULL",
      args: [Date.now(), eventId]
    });
    if (updated.rowsAffected > 0) {
      if (Number(row.is_crisis) === 1) {
        await pauseForCrisis(conferenceId, eventId);
      }
      await sendEventPush(conferenceId, eventId);
    }
  }
}
async function publishAllDueEvents() {
  const result = await getDb().execute("SELECT id FROM conferences ORDER BY created_at ASC");
  for (const row of result.rows) {
    await publishDueEvents(String(row.id));
  }
}
async function getRecipients(eventId) {
  const result = await getDb().execute({
    sql: `SELECT r.account_id, COALESCE(er.read, r.read) AS read,
                 COALESCE(a.name, '\u5DF2\u5220\u9664\u8D26\u53F7') AS name
          FROM event_recipients r
          LEFT JOIN event_reads er
            ON er.event_id = r.event_id AND er.account_id = r.account_id
          LEFT JOIN accounts a ON a.id = r.account_id
          WHERE r.event_id = ?
          ORDER BY a.created_at ASC`,
    args: [eventId]
  });
  return result.rows.map((row) => ({
    accountId: String(row.account_id),
    name: String(row.name),
    read: Number(row.read) === 1
  }));
}
async function getMyRead(eventId, accountId) {
  const result = await getDb().execute({
    sql: "SELECT read FROM event_reads WHERE event_id = ? AND account_id = ? LIMIT 1",
    args: [eventId, accountId]
  });
  return Number(result.rows[0]?.read ?? 0) === 1;
}
async function countAccounts(conferenceId) {
  const result = await getDb().execute({
    sql: "SELECT COUNT(*) AS n FROM conference_members WHERE conference_id = ?",
    args: [conferenceId]
  });
  return Number(result.rows[0]?.n ?? 0);
}
async function countReads(eventId) {
  const result = await getDb().execute({
    sql: "SELECT COUNT(*) AS n FROM event_reads WHERE event_id = ? AND read = 1",
    args: [eventId]
  });
  return Number(result.rows[0]?.n ?? 0);
}
async function isRecipient(eventId, accountId) {
  const result = await getDb().execute({
    sql: "SELECT 1 AS ok FROM event_recipients WHERE event_id = ? AND account_id = ? LIMIT 1",
    args: [eventId, accountId]
  });
  return result.rows.length > 0;
}
function baseEvent(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    eventTime: row.event_time,
    isCrisis: row.is_crisis === 1,
    isRealtime: row.is_realtime === 1,
    attachment: null,
    visibility: row.visibility === "PUBLIC" ? "PUBLIC" : "SECRET",
    publishedAt: row.published_at,
    createdAt: row.created_at,
    createdBy: row.created_by
  };
}
async function getAttachment(eventId) {
  const result = await getDb().execute({
    sql: "SELECT id, filename, mime, size FROM event_attachments WHERE event_id = ? LIMIT 1",
    args: [eventId]
  });
  const row = result.rows[0];
  return row ? {
    id: String(row.id),
    filename: String(row.filename),
    mime: String(row.mime),
    size: Number(row.size)
  } : null;
}
async function listEventsForChair(user, conferenceId) {
  const result = await getDb().execute({
    sql: "SELECT * FROM events WHERE conference_id = ? ORDER BY event_time DESC, created_at DESC",
    args: [conferenceId]
  });
  const totalAccounts = await countAccounts(conferenceId);
  const events = [];
  for (const raw2 of result.rows) {
    const row = toEventRow(raw2);
    const publicEvent = row.visibility === "PUBLIC";
    const recipients = publicEvent ? [] : await getRecipients(row.id);
    const inAudience = publicEvent || await isRecipient(row.id, user.id);
    const read = inAudience ? await getMyRead(row.id, user.id) : null;
    const readCount = publicEvent ? await countReads(row.id) : recipients.filter((item) => item.read).length;
    events.push({
      ...baseEvent(row),
      attachment: await getAttachment(row.id),
      recipients,
      inAudience,
      read,
      readCount,
      recipientCount: publicEvent ? totalAccounts : recipients.length
    });
  }
  return events;
}
async function listEventsForDelegate(user, conferenceId) {
  const result = await getDb().execute({
    sql: `SELECT e.*, COALESCE(er.read, 0) AS my_read
          FROM events e
          LEFT JOIN event_reads er
            ON er.event_id = e.id AND er.account_id = ?
          WHERE e.conference_id = ? AND e.published_at IS NOT NULL
            AND (
              e.visibility = 'PUBLIC'
              OR EXISTS (
                SELECT 1 FROM event_recipients r
                WHERE r.event_id = e.id AND r.account_id = ?
              )
            )
          ORDER BY e.event_time DESC, e.created_at DESC`,
    args: [user.id, conferenceId, user.id]
  });
  const events = [];
  for (const raw2 of result.rows) {
    const row = toEventRow(raw2);
    events.push({
      ...baseEvent(row),
      attachment: await getAttachment(row.id),
      recipients: [],
      inAudience: true,
      read: Number(raw2.my_read) === 1,
      readCount: Number(raw2.my_read) === 1 ? 1 : 0,
      recipientCount: 0
    });
  }
  return events;
}
async function listEvents(user) {
  return user.role === "chair" ? listEventsForChair(user, user.conferenceId) : listEventsForDelegate(user, user.conferenceId);
}
async function replaceRecipients(eventId, recipientIds) {
  const db = getDb();
  await db.execute({
    sql: "DELETE FROM event_recipients WHERE event_id = ?",
    args: [eventId]
  });
  for (const accountId of recipientIds) {
    await db.execute({
      sql: "INSERT OR IGNORE INTO event_recipients (event_id, account_id, read) VALUES (?, ?, 0)",
      args: [eventId, accountId]
    });
  }
}
async function createEvent(user, input) {
  const db = getDb();
  const id = createId("evt");
  const createdAt = Date.now();
  const visibility = input.isCrisis ? "PUBLIC" : input.visibility;
  await db.execute({
    sql: `INSERT INTO events
          (id, conference_id, title, content, event_time, is_crisis, is_realtime, visibility, published_at, created_at, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
    args: [
      id,
      user.conferenceId,
      input.title,
      input.content,
      input.eventTime,
      input.isCrisis ? 1 : 0,
      input.isRealtime ? 1 : 0,
      visibility,
      createdAt,
      user.id
    ]
  });
  if (visibility === "SECRET") {
    await replaceRecipients(id, input.recipientIds);
  }
  await publishDueEvents(user.conferenceId);
  return id;
}
async function updateEvent(eventId, user, input) {
  const db = getDb();
  const existing = await db.execute({
    sql: "SELECT * FROM events WHERE id = ? AND conference_id = ? LIMIT 1",
    args: [eventId, user.conferenceId]
  });
  const raw2 = existing.rows[0];
  if (!raw2) return false;
  const row = toEventRow(raw2);
  const visibility = input.isCrisis ? "PUBLIC" : input.visibility;
  await db.execute({
    sql: `UPDATE events SET title = ?, content = ?, event_time = ?, is_crisis = ?,
            visibility = ?
          WHERE id = ? AND conference_id = ?`,
    args: [
      input.title,
      input.content,
      row.published_at ? row.event_time : input.eventTime,
      input.isCrisis ? 1 : 0,
      input.isRealtime ? 1 : 0,
      visibility,
      eventId,
      user.conferenceId
    ]
  });
  if (visibility === "SECRET") {
    await replaceRecipients(eventId, input.recipientIds);
  } else {
    await replaceRecipients(eventId, []);
  }
  if (row.published_at && !input.isCrisis) {
    await clearCrisisPause(user.conferenceId, eventId);
  }
  if (row.published_at && input.isCrisis) {
    await pauseForCrisis(user.conferenceId, eventId);
  }
  await publishDueEvents(user.conferenceId);
  return true;
}
async function deleteEvent(eventId, user) {
  const db = getDb();
  const existing = await db.execute({
    sql: "SELECT id FROM events WHERE id = ? AND conference_id = ? LIMIT 1",
    args: [eventId, user.conferenceId]
  });
  if (existing.rows.length === 0) return false;
  await db.execute({ sql: "DELETE FROM event_recipients WHERE event_id = ?", args: [eventId] });
  await db.execute({ sql: "DELETE FROM event_reads WHERE event_id = ?", args: [eventId] });
  await db.execute({ sql: "DELETE FROM event_attachments WHERE event_id = ?", args: [eventId] });
  await db.execute({ sql: "DELETE FROM events WHERE id = ?", args: [eventId] });
  await clearCrisisPause(user.conferenceId, eventId);
  return true;
}
async function setEventRead(user, eventId, read) {
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT visibility, published_at FROM events WHERE id = ? AND conference_id = ? LIMIT 1",
    args: [eventId, user.conferenceId]
  });
  const row = result.rows[0];
  if (!row || row.published_at === null) return false;
  const publicEvent = row.visibility === "PUBLIC";
  if (!publicEvent && !await isRecipient(eventId, user.id)) return false;
  await db.execute({
    sql: `INSERT INTO event_reads (event_id, account_id, read) VALUES (?, ?, ?)
          ON CONFLICT(event_id, account_id) DO UPDATE SET read = excluded.read`,
    args: [eventId, user.id, read ? 1 : 0]
  });
  if (!publicEvent) {
    await db.execute({
      sql: "UPDATE event_recipients SET read = ? WHERE event_id = ? AND account_id = ?",
      args: [read ? 1 : 0, eventId, user.id]
    });
  }
  return true;
}
async function setEventAttachment(user, eventId, input) {
  if (user.role !== "chair") return false;
  const db = getDb();
  const event = await db.execute({
    sql: "SELECT id FROM events WHERE id = ? AND conference_id = ? LIMIT 1",
    args: [eventId, user.conferenceId]
  });
  if (event.rows.length === 0) return false;
  await db.execute({
    sql: "DELETE FROM event_attachments WHERE event_id = ?",
    args: [eventId]
  });
  await db.execute({
    sql: `INSERT INTO event_attachments
          (id, event_id, conference_id, filename, mime, size, data)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      createId("att"),
      eventId,
      user.conferenceId,
      input.filename.slice(0, 200),
      input.mime,
      input.size,
      input.bytes
    ]
  });
  return true;
}
async function getEventAttachmentForDownload(user, eventId) {
  const db = getDb();
  const event = await db.execute({
    sql: "SELECT visibility, published_at FROM events WHERE id = ? AND conference_id = ? LIMIT 1",
    args: [eventId, user.conferenceId]
  });
  const eventRow = event.rows[0];
  if (!eventRow) return null;
  if (user.role !== "chair") {
    if (eventRow.published_at === null) return null;
    const publicEvent = eventRow.visibility === "PUBLIC";
    if (!publicEvent && !await isRecipient(eventId, user.id)) return null;
  }
  const result = await db.execute({
    sql: "SELECT filename, mime, data FROM event_attachments WHERE event_id = ? LIMIT 1",
    args: [eventId]
  });
  const row = result.rows[0];
  if (!row) return null;
  const data = row.data;
  const bytes = data instanceof Uint8Array ? data : data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(Buffer.from(String(data), "base64"));
  return { filename: String(row.filename), mime: String(row.mime), bytes };
}

// src/lib/format.ts
function clampInt(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}
function toInt(value, fallback = 0) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.trunc(value) : fallback;
  }
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// src/state/reducer.ts
function clean(value, maxLength) {
  return value.trim().slice(0, maxLength);
}
function mapDelegation(state, id, updater) {
  return {
    ...state,
    delegations: state.delegations.map(
      (delegation) => delegation.id === id ? updater(delegation) : delegation
    )
  };
}
function baseReducer(state, action) {
  switch (action.type) {
    case "theme/set": {
      const theme = clean(action.theme, 80);
      if (!theme || theme === state.theme) return state;
      return { ...state, theme };
    }
    case "author/set": {
      const patch = action.patch;
      const author = {
        name: patch.name === void 0 ? state.author.name : clean(patch.name, 40) || state.author.name,
        xiaohongshuId: patch.xiaohongshuId === void 0 ? state.author.xiaohongshuId : clean(patch.xiaohongshuId, 40),
        xiaohongshuUrl: patch.xiaohongshuUrl === void 0 ? state.author.xiaohongshuUrl : clean(patch.xiaohongshuUrl, 200)
      };
      return { ...state, author };
    }
    case "attendanceRule/set":
      return state.attendanceRule === action.rule ? state : { ...state, attendanceRule: action.rule };
    case "voteMode/set":
      return state.voteMode === action.mode ? state : { ...state, voteMode: action.mode };
    case "delegation/add":
      return { ...state, delegations: [...state.delegations, action.delegation] };
    case "delegation/rename": {
      const name = clean(action.name, 40);
      if (!name) return state;
      return mapDelegation(
        state,
        action.id,
        (delegation) => delegation.name === name ? delegation : { ...delegation, name }
      );
    }
    case "delegation/delete":
      return {
        ...state,
        delegations: state.delegations.filter((delegation) => delegation.id !== action.id)
      };
    case "delegation/setVotes": {
      const votes = clampInt(action.votes, 0, 999);
      return mapDelegation(
        state,
        action.id,
        (delegation) => delegation.votes === votes ? delegation : { ...delegation, votes }
      );
    }
    case "delegation/setHead":
      return mapDelegation(state, action.id, (delegation) => ({
        ...delegation,
        headSeatId: delegation.seats.some((seat) => seat.id === action.seatId) ? action.seatId : delegation.headSeatId
      }));
    case "delegation/toggleVeto":
      return mapDelegation(state, action.id, (delegation) => ({
        ...delegation,
        globalVeto: !delegation.globalVeto
      }));
    case "seat/add":
      return mapDelegation(state, action.delegationId, (delegation) => ({
        ...delegation,
        seats: [...delegation.seats, action.seat]
      }));
    case "seat/rename": {
      const name = clean(action.name, 30);
      if (!name) return state;
      return mapDelegation(state, action.delegationId, (delegation) => ({
        ...delegation,
        seats: delegation.seats.map(
          (seat) => seat.id === action.seatId ? seat.name === name ? seat : { ...seat, name } : seat
        )
      }));
    }
    case "seat/delete":
      return mapDelegation(state, action.delegationId, (delegation) => {
        if (delegation.seats.length <= 1) return delegation;
        const seats = delegation.seats.filter((seat) => seat.id !== action.seatId);
        return {
          ...delegation,
          seats,
          headSeatId: delegation.headSeatId === action.seatId ? seats[0]?.id ?? null : delegation.headSeatId
        };
      });
    case "seat/togglePresent":
      return mapDelegation(state, action.delegationId, (delegation) => ({
        ...delegation,
        seats: delegation.seats.map(
          (seat) => seat.id === action.seatId ? { ...seat, present: !seat.present } : seat
        )
      }));
    case "seat/setVotes": {
      const votes = clampInt(action.votes, 0, 999);
      return mapDelegation(state, action.delegationId, (delegation) => ({
        ...delegation,
        seats: delegation.seats.map(
          (seat) => seat.id === action.seatId && seat.votes !== votes ? { ...seat, votes } : seat
        )
      }));
    }
    case "session/add":
      return { ...state, sessions: [...state.sessions, action.session] };
    case "session/rename": {
      const name = clean(action.name, 40);
      if (!name) return state;
      return {
        ...state,
        sessions: state.sessions.map(
          (session) => session.id === action.id ? session.name === name ? session : { ...session, name } : session
        )
      };
    }
    case "session/delete": {
      const removed = state.sessions.find((session) => session.id === action.id);
      if (!removed) return state;
      const removedTopicIds = new Set(removed.topics.map((topic) => topic.id));
      const isCurrent = state.currentSessionId === action.id;
      return {
        ...state,
        sessions: state.sessions.filter((session) => session.id !== action.id),
        resolutions: state.resolutions.filter(
          (resolution) => resolution.sessionId !== action.id && !removedTopicIds.has(resolution.topicId)
        ),
        currentSessionId: isCurrent ? null : state.currentSessionId,
        currentTopicId: isCurrent ? null : state.currentTopicId
      };
    }
    case "topic/add":
      return {
        ...state,
        sessions: state.sessions.map(
          (session) => session.id === action.sessionId ? { ...session, topics: [...session.topics, action.topic] } : session
        )
      };
    case "topic/rename": {
      const name = clean(action.name, 60);
      if (!name) return state;
      return {
        ...state,
        sessions: state.sessions.map(
          (session) => session.id === action.sessionId ? {
            ...session,
            topics: session.topics.map(
              (topic) => topic.id === action.topicId ? topic.name === name ? topic : { ...topic, name } : topic
            )
          } : session
        )
      };
    }
    case "topic/delete":
      return {
        ...state,
        sessions: state.sessions.map(
          (session) => session.id === action.sessionId ? {
            ...session,
            topics: session.topics.filter((topic) => topic.id !== action.topicId)
          } : session
        ),
        resolutions: state.resolutions.filter(
          (resolution) => resolution.topicId !== action.topicId
        ),
        currentTopicId: state.currentTopicId === action.topicId ? null : state.currentTopicId
      };
    case "current/set": {
      const session = state.sessions.find((item) => item.id === action.sessionId);
      const topic = session?.topics.find((item) => item.id === action.topicId);
      if (!session || !topic) return state;
      return {
        ...state,
        currentSessionId: session.id,
        currentTopicId: topic.id
      };
    }
    case "current/clear":
      return { ...state, currentSessionId: null, currentTopicId: null };
    case "resolution/add":
      return { ...state, resolutions: [...state.resolutions, action.resolution] };
    case "resolution/rename": {
      const title = clean(action.title, 80);
      if (!title) return state;
      return {
        ...state,
        resolutions: state.resolutions.map(
          (resolution) => resolution.id === action.id ? resolution.title === title ? resolution : { ...resolution, title } : resolution
        )
      };
    }
    case "resolution/delete":
      return {
        ...state,
        resolutions: state.resolutions.filter(
          (resolution) => resolution.id !== action.id
        )
      };
    case "resolution/finish":
      return {
        ...state,
        resolutions: state.resolutions.map(
          (resolution) => resolution.id === action.id ? {
            ...resolution,
            result: action.result,
            status: action.result.passed ? "PASSED" : "FAILED"
          } : resolution
        )
      };
    case "motionType/add":
      return { ...state, motionTypes: [...state.motionTypes, action.motionType] };
    case "motionType/update":
      return {
        ...state,
        motionTypes: state.motionTypes.map(
          (item) => item.id === action.motionType.id ? action.motionType : item
        )
      };
    case "motionType/delete":
      return {
        ...state,
        motionTypes: state.motionTypes.filter((item) => item.id !== action.id)
      };
    case "motion/start":
      return { ...state, activeMotion: action.motion };
    case "motion/end":
      return state.activeMotion ? { ...state, activeMotion: { ...state.activeMotion, endedAt: action.endedAt } } : state;
    case "fileType/add":
      return { ...state, fileTypes: [...state.fileTypes, action.fileType] };
    case "fileType/update":
      return {
        ...state,
        fileTypes: state.fileTypes.map(
          (item) => item.id === action.fileType.id ? action.fileType : item
        )
      };
    case "fileType/delete":
      return {
        ...state,
        fileTypes: state.fileTypes.filter((item) => item.id !== action.id)
      };
    case "settings/patch":
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case "state/replace":
      return action.state;
    case "state/reset":
      return createInitialState();
    default:
      return state;
  }
}
function reducer(state, action) {
  const next = baseReducer(state, action);
  if (next === state) return state;
  return { ...next, updatedAt: Date.now() };
}

// src/lib/voting.ts
function tallyBallots(ballots) {
  let yesVotes = 0;
  let noVotes = 0;
  let abstainVotes = 0;
  let presentVotes = 0;
  for (const record of ballots) {
    if (record.ballot === "ABSENT") continue;
    presentVotes += record.votes;
    if (record.ballot === "YES") yesVotes += record.votes;
    else if (record.ballot === "NO") noVotes += record.votes;
    else abstainVotes += record.votes;
  }
  return {
    yesVotes,
    noVotes,
    abstainVotes,
    totalCast: yesVotes + noVotes,
    presentVotes
  };
}
function judgeVote(majority, vetoDelegationIds, ballots) {
  const tally = tallyBallots(ballots);
  const vetoedBy = ballots.filter(
    (record) => record.ballot === "NO" && (record.veto || vetoDelegationIds.includes(record.delegationId))
  ).map((record) => record.name);
  if (tally.totalCast <= 0) {
    return {
      ...tally,
      vetoedBy,
      passed: false,
      reason: "NO_VALID_VOTES"
    };
  }
  if (vetoedBy.length > 0) {
    return {
      ...tally,
      vetoedBy,
      passed: false,
      reason: "VETOED"
    };
  }
  let passed = false;
  switch (majority) {
    case "SIMPLE":
      passed = tally.yesVotes > tally.noVotes;
      break;
    case "TWO_THIRDS":
      passed = tally.yesVotes >= Math.ceil(tally.totalCast * 2 / 3);
      break;
    case "UNANIMOUS":
      passed = tally.noVotes === 0;
      break;
  }
  return {
    ...tally,
    vetoedBy,
    passed,
    reason: passed ? "MAJORITY_MET" : "MAJORITY_NOT_MET"
  };
}

// src/state/storage.ts
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function asText(value) {
  return typeof value === "string" ? value : "";
}
function isAttendanceRule(value) {
  return value === "ALL" || value === "HALF" || value === "TWO_THIRDS";
}
function isMajorityRule(value) {
  return value === "SIMPLE" || value === "TWO_THIRDS" || value === "UNANIMOUS";
}
function isResolutionStatus(value) {
  return value === "PENDING" || value === "PASSED" || value === "FAILED";
}
function isBallot(value) {
  return value === "YES" || value === "NO" || value === "ABSTAIN" || value === "ABSENT";
}
function isVoteReason(value) {
  return value === "MAJORITY_MET" || value === "MAJORITY_NOT_MET" || value === "VETOED" || value === "NO_VALID_VOTES";
}
function normalizeSeat(value, index) {
  if (!isRecord(value)) return null;
  const name = asText(value.name).trim().slice(0, 30) || `\u4EE3\u8868 ${index + 1}`;
  return {
    id: asText(value.id) || createId("seat"),
    name,
    votes: clampInt(toInt(value.votes, 1), 0, 999),
    present: value.present === true
  };
}
function normalizeDelegation(value, index) {
  if (!isRecord(value)) return null;
  const name = asText(value.name).trim().slice(0, 40) || `\u672A\u547D\u540D\u4EE3\u8868\u56E2 ${index + 1}`;
  const rawSeats = Array.isArray(value.seats) ? value.seats : [];
  const seats = rawSeats.map((seat, seatIndex) => normalizeSeat(seat, seatIndex)).filter((seat) => seat !== null);
  if (seats.length === 0) {
    seats.push({ id: createId("seat"), name: "\u4EE3\u8868 1", votes: 1, present: false });
  }
  const headSeatIdRaw = asText(value.headSeatId);
  const headSeatId = seats.some((seat) => seat.id === headSeatIdRaw) ? headSeatIdRaw : seats[0]?.id ?? null;
  return {
    id: asText(value.id) || createId("dlg"),
    name,
    votes: clampInt(toInt(value.votes, 1), 0, 999),
    globalVeto: value.globalVeto === true,
    headSeatId,
    seats
  };
}
function normalizeTopic(value, index) {
  if (!isRecord(value)) return null;
  return {
    id: asText(value.id) || createId("topic"),
    name: asText(value.name).trim().slice(0, 60) || `\u8BAE\u9898 ${index + 1}`
  };
}
function normalizeSession(value, index) {
  if (!isRecord(value)) return null;
  const rawTopics = Array.isArray(value.topics) ? value.topics : [];
  return {
    id: asText(value.id) || createId("session"),
    name: asText(value.name).trim().slice(0, 40) || `\u7B2C ${index + 1} \u4F1A\u671F`,
    topics: rawTopics.map((topic, topicIndex) => normalizeTopic(topic, topicIndex)).filter((topic) => topic !== null)
  };
}
function normalizeBallot(value) {
  if (!isRecord(value)) return null;
  return {
    delegationId: asText(value.delegationId) || createId("dlg"),
    name: asText(value.name).trim().slice(0, 40) || "\u672A\u547D\u540D\u4EE3\u8868\u56E2",
    votes: clampInt(toInt(value.votes, 0), 0, 999),
    ballot: isBallot(value.ballot) ? value.ballot : "ABSENT",
    veto: value.veto === true
  };
}
function normalizeResult(value) {
  if (!isRecord(value)) return null;
  const majority = isMajorityRule(value.majority) ? value.majority : "SIMPLE";
  const rawBallots = Array.isArray(value.ballots) ? value.ballots : [];
  const ballots = rawBallots.map(normalizeBallot).filter((ballot) => ballot !== null);
  if (ballots.length === 0) return null;
  const vetoDelegationIds = Array.isArray(value.vetoDelegationIds) ? value.vetoDelegationIds.filter(
    (item) => typeof item === "string" && item.length > 0
  ) : [];
  const outcome = judgeVote(majority, vetoDelegationIds, ballots);
  return {
    majority,
    vetoDelegationIds,
    ballots,
    yesVotes: outcome.yesVotes,
    noVotes: outcome.noVotes,
    abstainVotes: outcome.abstainVotes,
    totalCast: outcome.totalCast,
    vetoedBy: outcome.vetoedBy,
    passed: outcome.passed,
    reason: isVoteReason(value.reason) && value.reason === outcome.reason ? value.reason : outcome.reason,
    votedAt: toInt(value.votedAt, Date.now())
  };
}
function normalizeResolution(value) {
  if (!isRecord(value)) return null;
  const sessionId = asText(value.sessionId);
  const topicId = asText(value.topicId);
  if (!sessionId || !topicId) return null;
  const result = normalizeResult(value.result);
  const status = result ? result.passed ? "PASSED" : "FAILED" : isResolutionStatus(value.status) && value.status === "PENDING" ? "PENDING" : "PENDING";
  return {
    id: asText(value.id) || createId("res"),
    title: asText(value.title).trim().slice(0, 80) || "\u672A\u547D\u540D\u51B3\u8BAE",
    sessionId,
    topicId,
    status,
    result,
    createdAt: toInt(value.createdAt, Date.now())
  };
}
function normalizeMotionType(value, index) {
  if (!isRecord(value)) return null;
  return {
    id: asText(value.id) || createId("motion-type"),
    name: asText(value.name).trim().slice(0, 40) || `\u52A8\u8BAE\u7C7B\u578B ${index + 1}`,
    hasTopic: value.hasTopic === true,
    hasSpeakersList: value.hasSpeakersList === true,
    needsTotalDuration: value.needsTotalDuration === true,
    hasUnitDuration: value.hasUnitDuration === true
  };
}
function normalizeActiveMotion(value) {
  if (!isRecord(value)) return null;
  const id = asText(value.id);
  const typeId = asText(value.typeId);
  if (!id || !typeId) return null;
  const rawSpeakers = Array.isArray(value.speakers) ? value.speakers : [];
  const speakers = rawSpeakers.filter(isRecord).map((item) => ({
    delegationId: asText(item.delegationId),
    name: asText(item.name).slice(0, 40)
  })).filter((item) => item.delegationId);
  return {
    id,
    typeId,
    typeName: asText(value.typeName).slice(0, 40),
    proposerDelegationId: asText(value.proposerDelegationId),
    proposerName: asText(value.proposerName).slice(0, 40),
    topic: asText(value.topic).slice(0, 120),
    totalSeconds: clampInt(toInt(value.totalSeconds, 0), 0, 86400),
    unitSeconds: clampInt(toInt(value.unitSeconds, 0), 0, 86400),
    speakers,
    startedAt: toInt(value.startedAt, Date.now()),
    endedAt: value.endedAt === null ? null : toInt(value.endedAt, 0) || null
  };
}
function normalizeState(input) {
  if (!isRecord(input)) return null;
  if (!("theme" in input) && !("delegations" in input) && !("sessions" in input) && !("resolutions" in input)) {
    return null;
  }
  const fallback = createInitialState();
  const theme = asText(input.theme).trim().slice(0, 80) || fallback.theme || DEFAULT_THEME;
  const rawAuthor = isRecord(input.author) ? input.author : {};
  const author = {
    name: asText(rawAuthor.name).trim().slice(0, 40) || DEFAULT_AUTHOR.name,
    xiaohongshuId: asText(rawAuthor.xiaohongshuId).trim().slice(0, 40) || DEFAULT_AUTHOR.xiaohongshuId,
    xiaohongshuUrl: asText(rawAuthor.xiaohongshuUrl).trim().slice(0, 200)
  };
  const attendanceRule = isAttendanceRule(input.attendanceRule) ? input.attendanceRule : "ALL";
  const voteMode = input.voteMode === "MEMBER" || input.voteMode === "DELEGATION" ? input.voteMode : "DELEGATION";
  const rawDelegations = Array.isArray(input.delegations) ? input.delegations : [];
  const delegations = rawDelegations.map((delegation, index) => normalizeDelegation(delegation, index)).filter((delegation) => delegation !== null);
  const rawSessions = Array.isArray(input.sessions) ? input.sessions : [];
  const sessions = rawSessions.map((session, index) => normalizeSession(session, index)).filter((session) => session !== null);
  const sessionById = new Map(sessions.map((session) => [session.id, session]));
  const topicOwner = /* @__PURE__ */ new Map();
  for (const session of sessions) {
    for (const topic of session.topics) topicOwner.set(topic.id, session.id);
  }
  let currentSessionId = asText(input.currentSessionId) || null;
  let currentTopicId = asText(input.currentTopicId) || null;
  if (currentSessionId && !sessionById.has(currentSessionId)) {
    currentSessionId = null;
  }
  if (currentTopicId) {
    const ownerId = topicOwner.get(currentTopicId);
    if (!ownerId) {
      currentTopicId = null;
    } else if (currentSessionId !== ownerId) {
      currentSessionId = ownerId;
    }
  }
  if (currentSessionId && !currentTopicId) {
  }
  const rawMotionTypes = Array.isArray(input.motionTypes) ? input.motionTypes : [];
  const motionTypes = rawMotionTypes.map((item, index) => normalizeMotionType(item, index)).filter((item) => item !== null);
  const finalMotionTypes = motionTypes.length > 0 ? motionTypes : defaultMotionTypes();
  const rawResolutions = Array.isArray(input.resolutions) ? input.resolutions : [];
  const resolutions = rawResolutions.map(normalizeResolution).filter(
    (resolution) => resolution !== null && topicOwner.get(resolution.topicId) === resolution.sessionId
  );
  const rawSettings = isRecord(input.settings) ? input.settings : {};
  const settings = {
    defaultMajority: isMajorityRule(rawSettings.defaultMajority) ? rawSettings.defaultMajority : DEFAULT_SETTINGS.defaultMajority,
    skipVetoStep: typeof rawSettings.skipVetoStep === "boolean" ? rawSettings.skipVetoStep : DEFAULT_SETTINGS.skipVetoStep,
    skipMajorityStep: typeof rawSettings.skipMajorityStep === "boolean" ? rawSettings.skipMajorityStep : DEFAULT_SETTINGS.skipMajorityStep,
    allowPersonalFiles: typeof rawSettings.allowPersonalFiles === "boolean" ? rawSettings.allowPersonalFiles : DEFAULT_SETTINGS.allowPersonalFiles
  };
  return {
    schemaVersion: SCHEMA_VERSION,
    theme,
    author,
    attendanceRule,
    voteMode,
    delegations,
    sessions,
    currentSessionId,
    currentTopicId,
    resolutions,
    motionTypes: finalMotionTypes,
    activeMotion: normalizeActiveMotion(input.activeMotion),
    fileTypes: normalizeFileTypes(input.fileTypes),
    settings,
    updatedAt: toInt(input.updatedAt, Date.now())
  };
}

// server/api/meeting.ts
async function loadMeeting(conferenceId) {
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT state, revision FROM conference_meeting WHERE conference_id = ?",
    args: [conferenceId]
  });
  let row = result.rows[0];
  if (!row) {
    const state = createInitialState();
    await db.execute({
      sql: `INSERT OR IGNORE INTO conference_meeting
            (conference_id, state, revision, updated_at) VALUES (?, ?, 0, ?)`,
      args: [conferenceId, JSON.stringify(state), Date.now()]
    });
    row = (await db.execute({
      sql: "SELECT state, revision FROM conference_meeting WHERE conference_id = ?",
      args: [conferenceId]
    })).rows[0];
  }
  if (!row) return { state: createInitialState(), revision: 0 };
  let parsed;
  try {
    parsed = JSON.parse(String(row.state));
  } catch {
    parsed = null;
  }
  return {
    state: normalizeState(parsed) ?? createInitialState(),
    revision: Number(row.revision)
  };
}
async function applyConferenceAction(conferenceId, action) {
  const current = await loadMeeting(conferenceId);
  const next = reducer(current.state, action);
  const normalized = normalizeState(next) ?? next;
  const revision = current.revision + 1;
  const db = getDb();
  await db.execute({
    sql: `UPDATE conference_meeting SET state = ?, revision = ?, updated_at = ?
          WHERE conference_id = ?`,
    args: [JSON.stringify(normalized), revision, Date.now(), conferenceId]
  });
  await db.execute({
    sql: "UPDATE conferences SET name = ? WHERE id = ?",
    args: [normalized.theme.slice(0, 80) || "\u4F1A\u573A", conferenceId]
  });
  const seatIds = new Set(
    normalized.delegations.flatMap(
      (delegation) => delegation.seats.map((seat) => seat.id)
    )
  );
  const bound = await db.execute({
    sql: "SELECT account_id, seat_id FROM conference_members WHERE conference_id = ? AND seat_id IS NOT NULL",
    args: [conferenceId]
  });
  for (const row of bound.rows) {
    if (!seatIds.has(String(row.seat_id))) {
      await db.execute({
        sql: "UPDATE conference_members SET seat_id = NULL WHERE conference_id = ? AND account_id = ?",
        args: [conferenceId, String(row.account_id)]
      });
    }
  }
  return { state: normalized, revision };
}

// server/api/files.ts
async function getMyMembershipInfo(user) {
  if (user.role === "chair") return null;
  const member = await getDb().execute({
    sql: "SELECT seat_id FROM conference_members WHERE conference_id = ? AND account_id = ? LIMIT 1",
    args: [user.conferenceId, user.id]
  });
  const seatId = member.rows[0]?.seat_id ? String(member.rows[0].seat_id) : null;
  if (!seatId) return null;
  const meeting = await loadMeeting(user.conferenceId);
  for (const delegation of meeting.state.delegations) {
    if (delegation.seats.some((seat) => seat.id === seatId)) {
      return {
        delegationId: delegation.id,
        delegationName: delegation.name,
        seatId,
        isHead: delegation.headSeatId === seatId
      };
    }
  }
  return null;
}
async function getCosigners(fileId, delegationNames) {
  const result = await getDb().execute({
    sql: `SELECT fc.delegation_id, fc.confirmed_at, a.name AS confirmed_name
          FROM file_cosigners fc
          LEFT JOIN accounts a ON a.id = fc.confirmed_by
          WHERE fc.file_id = ?
          ORDER BY fc.delegation_id ASC`,
    args: [fileId]
  });
  return result.rows.map((row) => ({
    delegationId: String(row.delegation_id),
    delegationName: delegationNames.get(String(row.delegation_id)) ?? "\u5DF2\u5220\u9664\u4EE3\u8868\u56E2",
    confirmedAt: row.confirmed_at === null ? null : Number(row.confirmed_at),
    confirmedByName: row.confirmed_name ? String(row.confirmed_name) : null
  }));
}
function toFile(row, cosigners, myMembership, isChair) {
  const mine = myMembership ? cosigners.find((item) => item.delegationId === myMembership.delegationId) : void 0;
  return {
    id: String(row.id),
    title: String(row.title),
    filename: String(row.filename),
    mime: String(row.mime),
    size: Number(row.size),
    fileTypeId: row.file_type_id ? String(row.file_type_id) : null,
    fileType: String(row.file_type ?? "\u5176\u4ED6"),
    textContent: String(row.text_content ?? ""),
    scope: row.scope === "PERSONAL" ? "PERSONAL" : "DELEGATION",
    delegationId: row.delegation_id ? String(row.delegation_id) : null,
    delegationName: row.delegation_name ? String(row.delegation_name) : null,
    coSign: Number(row.co_sign ?? 0) === 1,
    cosigners,
    myConfirmation: mine ? mine.confirmedAt ? "CONFIRMED" : "PENDING" : null,
    canConfirm: Boolean(
      mine && myMembership?.isHead && !mine.confirmedAt && !isChair
    ),
    submittedAt: Number(row.submitted_at),
    submittedById: String(row.submitted_by),
    submittedByName: row.submitted_name ? String(row.submitted_name) : "\u5DF2\u5220\u9664\u8D26\u53F7",
    read: Number(row.read) === 1
  };
}
async function listFiles(user) {
  const db = getDb();
  const meeting = await loadMeeting(user.conferenceId);
  const delegationNames = new Map(
    meeting.state.delegations.map((delegation) => [delegation.id, delegation.name])
  );
  const myMembership = await getMyMembershipInfo(user);
  let result;
  if (user.role === "chair") {
    result = await db.execute({
      sql: `SELECT f.*, a.name AS submitted_name
            FROM files f LEFT JOIN accounts a ON a.id = f.submitted_by
            WHERE f.conference_id = ?
            ORDER BY f.submitted_at DESC`,
      args: [user.conferenceId]
    });
  } else {
    result = await db.execute({
      sql: `SELECT f.*, a.name AS submitted_name
            FROM files f LEFT JOIN accounts a ON a.id = f.submitted_by
            WHERE f.conference_id = ?
              AND (
                f.submitted_by = ?
                OR (f.scope = 'DELEGATION' AND f.delegation_id = ?)
                OR EXISTS (
                  SELECT 1 FROM file_cosigners fc
                  WHERE fc.file_id = f.id AND fc.delegation_id = ?
                )
              )
            ORDER BY f.submitted_at DESC`,
      args: [
        user.conferenceId,
        user.id,
        myMembership?.delegationId ?? "",
        myMembership?.delegationId ?? ""
      ]
    });
  }
  const files = [];
  for (const row of result.rows) {
    const cosigners = await getCosigners(String(row.id), delegationNames);
    files.push(
      toFile(
        {
          ...row,
          delegation_name: row.delegation_id ? delegationNames.get(String(row.delegation_id)) ?? null : null
        },
        cosigners,
        myMembership,
        user.role === "chair"
      )
    );
  }
  return files;
}
async function createFile(user, input) {
  const db = getDb();
  const id = createId("file");
  await db.execute({
    sql: `INSERT INTO files
          (id, conference_id, title, filename, mime, size, file_type_id, file_type,
           text_content, scope, delegation_id, co_sign, data, submitted_by, submitted_at, read)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    args: [
      id,
      user.conferenceId,
      input.title,
      input.filename,
      input.mime,
      input.size,
      input.fileTypeId,
      input.fileType,
      input.textContent,
      input.scope,
      input.delegationId,
      input.coSign ? 1 : 0,
      input.bytes,
      user.id,
      Date.now()
    ]
  });
  for (const delegationId of input.cosignerDelegationIds) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO file_cosigners
            (file_id, conference_id, delegation_id, confirmed_at, confirmed_by)
            VALUES (?, ?, ?, NULL, NULL)`,
      args: [id, user.conferenceId, delegationId]
    });
  }
  return id;
}
async function getFileForDownload(user, fileId) {
  const db = getDb();
  const meeting = await loadMeeting(user.conferenceId);
  const delegationNames = new Map(
    meeting.state.delegations.map((delegation) => [delegation.id, delegation.name])
  );
  const result = await db.execute({
    sql: `SELECT f.*, a.name AS submitted_name
          FROM files f LEFT JOIN accounts a ON a.id = f.submitted_by
          WHERE f.id = ? AND f.conference_id = ? LIMIT 1`,
    args: [fileId, user.conferenceId]
  });
  const row = result.rows[0];
  if (!row) return null;
  const myMembership = await getMyMembershipInfo(user);
  const allowed = user.role === "chair" || String(row.submitted_by) === user.id || String(row.scope) === "DELEGATION" && (String(row.delegation_id) === myMembership?.delegationId || Boolean(
    myMembership && (await db.execute({
      sql: "SELECT 1 AS ok FROM file_cosigners WHERE file_id = ? AND delegation_id = ? LIMIT 1",
      args: [fileId, myMembership.delegationId]
    })).rows.length
  ));
  if (!allowed) return null;
  const cosigners = await getCosigners(fileId, delegationNames);
  const file = toFile(
    {
      ...row,
      delegation_name: row.delegation_id ? delegationNames.get(String(row.delegation_id)) ?? null : null
    },
    cosigners,
    myMembership,
    user.role === "chair"
  );
  const dataResult = await db.execute({
    sql: "SELECT data FROM files WHERE id = ? AND conference_id = ? LIMIT 1",
    args: [fileId, user.conferenceId]
  });
  const data = dataResult.rows[0]?.data;
  if (!data) return { file, bytes: new Uint8Array() };
  const bytes = data instanceof Uint8Array ? data : data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(Buffer.from(String(data), "base64"));
  return { file, bytes };
}
async function confirmFile(user, fileId) {
  const membership = await getMyMembershipInfo(user);
  if (!membership?.isHead) return false;
  const db = getDb();
  const row = await db.execute({
    sql: `SELECT 1 AS ok FROM file_cosigners
          WHERE file_id = ? AND conference_id = ? AND delegation_id = ?
          LIMIT 1`,
    args: [fileId, user.conferenceId, membership.delegationId]
  });
  if (row.rows.length === 0) return false;
  await db.execute({
    sql: `UPDATE file_cosigners SET confirmed_at = ?, confirmed_by = ?
          WHERE file_id = ? AND delegation_id = ?`,
    args: [Date.now(), user.id, fileId, membership.delegationId]
  });
  return true;
}
async function setFileRead(user, fileId, read) {
  if (user.role !== "chair") return false;
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT id FROM files WHERE id = ? AND conference_id = ? LIMIT 1",
    args: [fileId, user.conferenceId]
  });
  if (result.rows.length === 0) return false;
  await db.execute({
    sql: "UPDATE files SET read = ? WHERE id = ? AND conference_id = ?",
    args: [read ? 1 : 0, fileId, user.conferenceId]
  });
  return true;
}
async function getCosignerHeadAccountIds(user, delegationIds) {
  if (delegationIds.length === 0) return [];
  const meeting = await loadMeeting(user.conferenceId);
  const headSeatIds = /* @__PURE__ */ new Map();
  for (const delegation of meeting.state.delegations) {
    if (delegation.headSeatId) headSeatIds.set(delegation.id, delegation.headSeatId);
  }
  const seats = delegationIds.map((id) => headSeatIds.get(id)).filter((id) => Boolean(id));
  if (seats.length === 0) return [];
  const placeholders = seats.map(() => "?").join(",");
  const result = await getDb().execute({
    sql: `SELECT account_id FROM conference_members
          WHERE conference_id = ? AND seat_id IN (${placeholders})`,
    args: [user.conferenceId, ...seats]
  });
  return result.rows.map((row) => String(row.account_id));
}

// server/api/conferences.ts
async function createConference(user, nameRaw) {
  const db = getDb();
  const name = nameRaw.trim().slice(0, 80) || "\u65B0\u4F1A\u573A";
  const id = createId("conf");
  const now = Date.now();
  const state = { ...createInitialState(), theme: name };
  await db.batch([
    {
      sql: "INSERT INTO conferences (id, name, created_at, created_by) VALUES (?, ?, ?, ?)",
      args: [id, name, now, user.id]
    },
    {
      sql: `INSERT INTO conference_members
            (conference_id, account_id, role, seat_id, created_at)
            VALUES (?, ?, 'chair', NULL, ?)`,
      args: [id, user.id, now]
    },
    {
      sql: `INSERT INTO conference_meeting
            (conference_id, state, revision, updated_at) VALUES (?, ?, 0, ?)`,
      args: [id, JSON.stringify(state), now]
    },
    {
      sql: `INSERT INTO conference_time
            (conference_id, now_ms, rate, running, anchor_ms, crisis_paused, crisis_event_id, updated_at)
            VALUES (?, ?, 1, 0, ?, 0, NULL, ?)`,
      args: [id, now, now, now]
    }
  ]);
  return { id, name, role: "chair" };
}
async function addExistingChair(conferenceId, accountId) {
  const db = getDb();
  const account = await db.execute({
    sql: "SELECT id FROM accounts WHERE id = ? AND role = 'chair' LIMIT 1",
    args: [accountId]
  });
  if (account.rows.length === 0) return false;
  await db.execute({
    sql: `INSERT OR IGNORE INTO conference_members
          (conference_id, account_id, role, seat_id, created_at)
          VALUES (?, ?, 'chair', NULL, ?)`,
    args: [conferenceId, accountId, Date.now()]
  });
  return true;
}

// src/lib/dataCategories.ts
var ALL_CATEGORY_IDS = [
  "info",
  "seats",
  "sessions",
  "motions",
  "time",
  "events",
  "files",
  "accounts"
];
function normalizeCategories(value) {
  if (!Array.isArray(value)) return [...ALL_CATEGORY_IDS];
  const allowed = new Set(ALL_CATEGORY_IDS);
  const selected = [...new Set(value.filter((item) => typeof item === "string"))].filter((item) => allowed.has(item));
  return selected.length > 0 ? selected : [];
}

// server/api/archives.ts
function bytesToBase64(value) {
  const bytes = value instanceof Uint8Array ? value : value instanceof ArrayBuffer ? new Uint8Array(value) : new Uint8Array();
  let binary = "";
  const chunk = 32768;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
async function readArchiveData(value) {
  let text2 = "";
  if (value instanceof Uint8Array) {
    text2 = new TextDecoder().decode(value);
  } else if (value instanceof ArrayBuffer) {
    text2 = new TextDecoder().decode(new Uint8Array(value));
  } else if (typeof value === "string") {
    text2 = value;
  }
  const parsed = JSON.parse(text2);
  const included = normalizeCategories(parsed.included ?? ALL_CATEGORY_IDS);
  return {
    ...parsed,
    version: 2,
    included: included.length > 0 ? included : [...ALL_CATEGORY_IDS]
  };
}
function trimmedState(state, included) {
  const base = createInitialState();
  const has = (id) => included.includes(id);
  return {
    ...state,
    theme: has("info") ? state.theme : base.theme,
    author: has("info") ? state.author : base.author,
    attendanceRule: has("info") ? state.attendanceRule : base.attendanceRule,
    voteMode: has("info") ? state.voteMode : base.voteMode,
    settings: has("info") ? state.settings : base.settings,
    delegations: has("seats") ? state.delegations : [],
    sessions: has("sessions") ? state.sessions : [],
    currentSessionId: has("sessions") ? state.currentSessionId : null,
    currentTopicId: has("sessions") ? state.currentTopicId : null,
    resolutions: has("sessions") ? state.resolutions : [],
    motionTypes: has("motions") ? state.motionTypes : createInitialState().motionTypes,
    activeMotion: has("motions") ? state.activeMotion : null,
    fileTypes: has("files") ? state.fileTypes : createInitialState().fileTypes
  };
}
async function listArchives(conferenceId) {
  const result = await getDb().execute({
    sql: "SELECT id, name, created_at, data FROM archives WHERE conference_id = ? ORDER BY created_at DESC",
    args: [conferenceId]
  });
  const archives = [];
  for (const row of result.rows) {
    try {
      const data = await readArchiveData(row.data);
      archives.push({
        id: String(row.id),
        name: String(row.name),
        createdAt: Number(row.created_at),
        included: data.included
      });
    } catch {
      archives.push({
        id: String(row.id),
        name: String(row.name),
        createdAt: Number(row.created_at),
        included: [...ALL_CATEGORY_IDS]
      });
    }
  }
  return archives;
}
async function createArchive(conferenceId, nameRaw, includedRaw) {
  const db = getDb();
  const included = normalizeCategories(includedRaw);
  const has = (id2) => included.includes(id2);
  const [meeting, conference, time, members, events, recipients, reads, attachments, files, fileCosigners] = await Promise.all([
    loadMeeting(conferenceId),
    db.execute({
      sql: "SELECT id, name FROM conferences WHERE id = ? LIMIT 1",
      args: [conferenceId]
    }),
    has("time") ? getTimeState(conferenceId) : Promise.resolve(null),
    has("accounts") ? db.execute({
      sql: `SELECT a.id, a.username, a.password, a.name, a.created_at,
                         cm.role, cm.seat_id
                  FROM conference_members cm
                  JOIN accounts a ON a.id = cm.account_id
                  WHERE cm.conference_id = ?
                  ORDER BY a.created_at ASC`,
      args: [conferenceId]
    }) : Promise.resolve({ rows: [] }),
    has("events") ? db.execute({
      sql: "SELECT * FROM events WHERE conference_id = ? ORDER BY created_at ASC",
      args: [conferenceId]
    }) : Promise.resolve({ rows: [] }),
    has("events") ? db.execute({
      sql: `SELECT r.event_id, r.account_id, r.read
                  FROM event_recipients r
                  JOIN events e ON e.id = r.event_id
                  WHERE e.conference_id = ?`,
      args: [conferenceId]
    }) : Promise.resolve({ rows: [] }),
    has("events") ? db.execute({
      sql: `SELECT er.event_id, er.account_id, er.read
                  FROM event_reads er
                  JOIN events e ON e.id = er.event_id
                  WHERE e.conference_id = ?`,
      args: [conferenceId]
    }) : Promise.resolve({ rows: [] }),
    has("events") ? db.execute({
      sql: `SELECT a.* FROM event_attachments a
                  JOIN events e ON e.id = a.event_id
                  WHERE e.conference_id = ?`,
      args: [conferenceId]
    }) : Promise.resolve({ rows: [] }),
    has("files") ? db.execute({
      sql: "SELECT * FROM files WHERE conference_id = ? ORDER BY submitted_at ASC",
      args: [conferenceId]
    }) : Promise.resolve({ rows: [] }),
    has("files") ? db.execute({
      sql: "SELECT * FROM file_cosigners WHERE conference_id = ?",
      args: [conferenceId]
    }) : Promise.resolve({ rows: [] })
  ]);
  const recipientRows = recipients.rows.map((row) => ({
    eventId: String(row.event_id),
    accountId: String(row.account_id),
    read: Number(row.read) === 1
  }));
  const readRows = reads.rows.map((row) => ({
    eventId: String(row.event_id),
    accountId: String(row.account_id),
    read: Number(row.read) === 1
  }));
  const data = {
    version: 2,
    archivedAt: Date.now(),
    conferenceName: String(conference.rows[0]?.name ?? meeting.state.theme),
    included,
    conference: trimmedState(meeting.state, included),
    revision: meeting.revision,
    accounts: members.rows.map((row) => ({
      id: String(row.id),
      username: String(row.username),
      password: String(row.password),
      name: String(row.name),
      role: String(row.role) === "chair" ? "chair" : "delegate",
      seatId: has("seats") && row.seat_id ? String(row.seat_id) : null,
      createdAt: Number(row.created_at)
    })),
    time: time ? {
      nowMs: time.currentMs,
      rate: time.rate,
      running: time.running,
      crisisPaused: time.crisisPaused,
      crisisEventId: time.crisisEventId
    } : null,
    events: events.rows.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      content: String(row.content),
      eventTime: Number(row.event_time),
      isCrisis: Number(row.is_crisis) === 1,
      isRealtime: Number(row.is_realtime ?? 0) === 1,
      visibility: String(row.visibility ?? "SECRET"),
      publishedAt: row.published_at === null ? null : Number(row.published_at),
      createdAt: Number(row.created_at),
      createdBy: String(row.created_by),
      recipients: recipientRows.filter((item) => item.eventId === String(row.id)).map((item) => ({ accountId: item.accountId, read: item.read })),
      reads: readRows.filter((item) => item.eventId === String(row.id)).map((item) => ({ accountId: item.accountId, read: item.read })),
      attachment: (() => {
        const att = attachments.rows.find((item) => String(item.event_id) === String(row.id));
        return att ? {
          filename: String(att.filename),
          mime: String(att.mime),
          size: Number(att.size),
          data: bytesToBase64(att.data)
        } : null;
      })()
    })),
    files: files.rows.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      filename: String(row.filename),
      mime: String(row.mime),
      size: Number(row.size),
      fileType: String(row.file_type ?? "\u5176\u4ED6"),
      scope: String(row.scope ?? "DELEGATION"),
      delegationId: row.delegation_id ? String(row.delegation_id) : null,
      coSign: Number(row.co_sign ?? 0) === 1,
      cosigners: fileCosigners.rows.filter((item) => String(item.file_id) === String(row.id)).map((item) => ({
        delegationId: String(item.delegation_id),
        confirmedAt: item.confirmed_at === null ? null : Number(item.confirmed_at),
        confirmedBy: item.confirmed_by ? String(item.confirmed_by) : null
      })),
      data: bytesToBase64(row.data),
      submittedBy: String(row.submitted_by),
      submittedAt: Number(row.submitted_at),
      read: Number(row.read) === 1
    }))
  };
  const id = createId("arc");
  const name = nameRaw.trim().slice(0, 80) || `${data.conferenceName || "\u4F1A\u573A"} \xB7 ${(/* @__PURE__ */ new Date()).toLocaleString("zh-CN")}`;
  const createdAt = Date.now();
  await db.execute({
    sql: "INSERT INTO archives (id, conference_id, name, created_at, data) VALUES (?, ?, ?, ?, ?)",
    args: [id, conferenceId, name, createdAt, new TextEncoder().encode(JSON.stringify(data))]
  });
  return { id, name, createdAt, included };
}
async function deleteArchive(conferenceId, id) {
  const result = await getDb().execute({
    sql: "DELETE FROM archives WHERE id = ? AND conference_id = ?",
    args: [id, conferenceId]
  });
  return result.rowsAffected > 0;
}
async function restoreArchive(conferenceId, id) {
  const db = getDb();
  const found = await db.execute({
    sql: "SELECT data FROM archives WHERE id = ? AND conference_id = ? LIMIT 1",
    args: [id, conferenceId]
  });
  const row = found.rows[0];
  if (!row) throw new Error("\u5B58\u6863\u4E0D\u5B58\u5728");
  const data = await readArchiveData(row.data);
  const included = data.included;
  const has = (category) => included.includes(category);
  const current = await loadMeeting(conferenceId);
  const currentState = current.state;
  const archivedState = normalizeState(data.conference) ?? createInitialState();
  const nextState = {
    ...currentState,
    ...has("info") ? {
      theme: archivedState.theme,
      author: archivedState.author,
      attendanceRule: archivedState.attendanceRule,
      voteMode: archivedState.voteMode,
      settings: archivedState.settings
    } : {},
    ...has("seats") ? { delegations: archivedState.delegations } : {},
    ...has("sessions") ? {
      sessions: archivedState.sessions,
      currentSessionId: archivedState.currentSessionId,
      currentTopicId: archivedState.currentTopicId,
      resolutions: archivedState.resolutions
    } : {},
    ...has("motions") ? {
      motionTypes: archivedState.motionTypes,
      activeMotion: archivedState.activeMotion
    } : {},
    ...has("files") ? { fileTypes: archivedState.fileTypes } : {},
    updatedAt: Date.now()
  };
  const revision = current.revision + 1;
  const now = Date.now();
  const statements = [
    {
      sql: `UPDATE conference_meeting SET state = ?, revision = ?, updated_at = ?
            WHERE conference_id = ?`,
      args: [JSON.stringify(nextState), revision, now, conferenceId]
    }
  ];
  if (has("info")) {
    statements.push({
      sql: "UPDATE conferences SET name = ? WHERE id = ?",
      args: [nextState.theme.slice(0, 80) || "\u4F1A\u573A", conferenceId]
    });
  }
  if (has("time") && data.time) {
    statements.push(
      { sql: "DELETE FROM conference_time WHERE conference_id = ?", args: [conferenceId] },
      {
        sql: `INSERT INTO conference_time
              (conference_id, now_ms, rate, running, anchor_ms, crisis_paused, crisis_event_id, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          conferenceId,
          data.time.nowMs,
          data.time.rate,
          data.time.running ? 1 : 0,
          now,
          data.time.crisisPaused ? 1 : 0,
          data.time.crisisEventId,
          now
        ]
      }
    );
  }
  if (has("events")) {
    statements.push(
      {
        sql: "DELETE FROM event_attachments WHERE event_id IN (SELECT id FROM events WHERE conference_id = ?)",
        args: [conferenceId]
      },
      {
        sql: "DELETE FROM event_recipients WHERE event_id IN (SELECT id FROM events WHERE conference_id = ?)",
        args: [conferenceId]
      },
      {
        sql: "DELETE FROM event_reads WHERE event_id IN (SELECT id FROM events WHERE conference_id = ?)",
        args: [conferenceId]
      },
      { sql: "DELETE FROM events WHERE conference_id = ?", args: [conferenceId] }
    );
    for (const event of data.events) {
      statements.push({
        sql: `INSERT INTO events
              (id, conference_id, title, content, event_time, is_crisis, is_realtime, visibility, published_at, created_at, created_by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          event.id,
          conferenceId,
          event.title,
          event.content,
          event.eventTime,
          event.isCrisis ? 1 : 0,
          event.isRealtime ? 1 : 0,
          event.visibility,
          event.publishedAt,
          event.createdAt,
          event.createdBy
        ]
      });
      for (const recipient of event.recipients) {
        statements.push({
          sql: "INSERT INTO event_recipients (event_id, account_id, read) VALUES (?, ?, ?)",
          args: [event.id, recipient.accountId, recipient.read ? 1 : 0]
        });
      }
      for (const read of event.reads) {
        statements.push({
          sql: "INSERT INTO event_reads (event_id, account_id, read) VALUES (?, ?, ?)",
          args: [event.id, read.accountId, read.read ? 1 : 0]
        });
      }
      if (event.attachment) {
        statements.push({
          sql: `INSERT INTO event_attachments
                (id, event_id, conference_id, filename, mime, size, data)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [
            createId("att"),
            event.id,
            conferenceId,
            event.attachment.filename,
            event.attachment.mime,
            event.attachment.size,
            base64ToBytes(event.attachment.data)
          ]
        });
      }
    }
  }
  if (has("files")) {
    statements.push({
      sql: "DELETE FROM file_cosigners WHERE conference_id = ?",
      args: [conferenceId]
    });
    statements.push({
      sql: "DELETE FROM files WHERE conference_id = ?",
      args: [conferenceId]
    });
    for (const file of data.files) {
      statements.push({
        sql: `INSERT INTO files
              (id, conference_id, title, filename, mime, size, file_type, scope, delegation_id, co_sign, data, submitted_by, submitted_at, read)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          file.id,
          conferenceId,
          file.title,
          file.filename,
          file.mime,
          file.size,
          file.fileType ?? "\u5176\u4ED6",
          file.scope ?? "DELEGATION",
          file.delegationId ?? null,
          file.coSign ? 1 : 0,
          base64ToBytes(file.data),
          file.submittedBy,
          file.submittedAt,
          file.read ? 1 : 0
        ]
      });
      for (const cosigner of file.cosigners ?? []) {
        statements.push({
          sql: `INSERT INTO file_cosigners
                (file_id, conference_id, delegation_id, confirmed_at, confirmed_by)
                VALUES (?, ?, ?, ?, ?)`,
          args: [
            file.id,
            conferenceId,
            cosigner.delegationId,
            cosigner.confirmedAt,
            cosigner.confirmedBy
          ]
        });
      }
    }
  }
  if (has("accounts")) {
    statements.push(
      { sql: "DELETE FROM conference_members WHERE conference_id = ?", args: [conferenceId] },
      { sql: "DELETE FROM sessions WHERE conference_id = ?", args: [conferenceId] }
    );
    for (const account of data.accounts) {
      statements.push({
        sql: `INSERT INTO accounts (id, username, password, name, role, created_at)
              VALUES (?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                username = excluded.username,
                password = excluded.password,
                name = excluded.name,
                role = excluded.role,
                created_at = excluded.created_at`,
        args: [
          account.id,
          account.username,
          account.password,
          account.name,
          account.role,
          account.createdAt
        ]
      });
      statements.push({
        sql: `INSERT INTO conference_members
              (conference_id, account_id, role, seat_id, created_at)
              VALUES (?, ?, ?, ?, ?)`,
        args: [
          conferenceId,
          account.id,
          account.role,
          has("seats") ? account.seatId : null,
          account.createdAt
        ]
      });
    }
  }
  await db.batch(statements);
}

// server/api/admin.ts
async function clearConferenceData(conferenceId, currentAccountId, includedRaw) {
  const db = getDb();
  const included = normalizeCategories(includedRaw);
  const has = (id) => included.includes(id);
  if (included.length === 0) return;
  const current = await loadMeeting(conferenceId);
  const now = Date.now();
  const revision = current.revision + 1;
  const defaults = createInitialState();
  let nextState = { ...current.state };
  if (has("info")) {
    nextState = {
      ...nextState,
      theme: defaults.theme,
      author: defaults.author,
      attendanceRule: defaults.attendanceRule,
      voteMode: defaults.voteMode,
      settings: defaults.settings
    };
  }
  if (has("seats")) {
    nextState = { ...nextState, delegations: [] };
  }
  if (has("sessions")) {
    nextState = {
      ...nextState,
      sessions: [],
      currentSessionId: null,
      currentTopicId: null,
      resolutions: []
    };
  }
  if (has("motions")) {
    nextState = {
      ...nextState,
      motionTypes: defaultMotionTypes(),
      activeMotion: null
    };
  }
  if (has("files")) {
    nextState = { ...nextState, fileTypes: defaultFileTypes() };
  }
  nextState = { ...nextState, updatedAt: now };
  const statements = [
    {
      sql: `UPDATE conference_meeting SET state = ?, revision = ?, updated_at = ?
            WHERE conference_id = ?`,
      args: [JSON.stringify(nextState), revision, now, conferenceId]
    }
  ];
  if (has("info")) {
    statements.push({
      sql: "UPDATE conferences SET name = ? WHERE id = ?",
      args: [defaults.theme, conferenceId]
    });
  }
  if (has("seats")) {
    statements.push({
      sql: "UPDATE conference_members SET seat_id = NULL WHERE conference_id = ?",
      args: [conferenceId]
    });
  }
  if (has("time")) {
    statements.push({
      sql: `INSERT INTO conference_time
            (conference_id, now_ms, rate, running, anchor_ms, crisis_paused, crisis_event_id, updated_at)
            VALUES (?, ?, 1, 0, ?, 0, NULL, ?)
            ON CONFLICT(conference_id) DO UPDATE SET
              now_ms = excluded.now_ms, rate = 1, running = 0,
              anchor_ms = excluded.anchor_ms, crisis_paused = 0,
              crisis_event_id = NULL, updated_at = excluded.updated_at`,
      args: [conferenceId, now, now, now]
    });
  }
  if (has("events")) {
    statements.push(
      {
        sql: "DELETE FROM event_attachments WHERE event_id IN (SELECT id FROM events WHERE conference_id = ?)",
        args: [conferenceId]
      },
      {
        sql: "DELETE FROM event_recipients WHERE event_id IN (SELECT id FROM events WHERE conference_id = ?)",
        args: [conferenceId]
      },
      {
        sql: "DELETE FROM event_reads WHERE event_id IN (SELECT id FROM events WHERE conference_id = ?)",
        args: [conferenceId]
      },
      { sql: "DELETE FROM events WHERE conference_id = ?", args: [conferenceId] }
    );
  }
  if (has("files")) {
    statements.push(
      { sql: "DELETE FROM file_cosigners WHERE conference_id = ?", args: [conferenceId] },
      { sql: "DELETE FROM files WHERE conference_id = ?", args: [conferenceId] }
    );
  }
  if (has("accounts")) {
    const members = await db.execute({
      sql: `SELECT cm.account_id, a.username, cm.role
            FROM conference_members cm
            JOIN accounts a ON a.id = cm.account_id
            WHERE cm.conference_id = ?`,
      args: [conferenceId]
    });
    for (const member of members.rows) {
      const accountId = String(member.account_id);
      if (accountId === currentAccountId || String(member.username) === "123456") {
        continue;
      }
      statements.push(
        {
          sql: `DELETE FROM event_recipients WHERE account_id = ?
                AND event_id IN (SELECT id FROM events WHERE conference_id = ?)`,
          args: [accountId, conferenceId]
        },
        {
          sql: `DELETE FROM event_reads WHERE account_id = ?
                AND event_id IN (SELECT id FROM events WHERE conference_id = ?)`,
          args: [accountId, conferenceId]
        },
        {
          sql: "DELETE FROM conference_members WHERE conference_id = ? AND account_id = ?",
          args: [conferenceId, accountId]
        },
        { sql: "DELETE FROM sessions WHERE account_id = ?", args: [accountId] }
      );
      const other = await db.execute({
        sql: "SELECT 1 AS ok FROM conference_members WHERE account_id = ? LIMIT 1",
        args: [accountId]
      });
      if (other.rows.length === 0) {
        statements.push(
          { sql: "DELETE FROM push_subscriptions WHERE account_id = ?", args: [accountId] },
          { sql: "DELETE FROM accounts WHERE id = ?", args: [accountId] }
        );
      }
    }
  }
  await db.batch(statements);
}

// server/api/app.ts
var app = new Hono3();
function isHealthRequest(c) {
  return c.req.path === "/api/health" || c.req.path === "/api" && c.req.query("route") === "/health";
}
app.use("*", async (c, next) => {
  if (isHealthRequest(c)) return next();
  await ensureDb();
  await next();
});
app.get("/api/health", async (c) => {
  const env = {
    hasDatabaseUrl: Boolean(process.env.TURSO_DATABASE_URL),
    hasAuthToken: Boolean(process.env.TURSO_AUTH_TOKEN),
    vercel: Boolean(process.env.VERCEL),
    node: process.version
  };
  try {
    const result = await getDb().execute("SELECT 1 AS ok");
    return c.json({ ok: true, env, database: "ok", probe: Number(result.rows[0]?.ok ?? 0) });
  } catch (error) {
    console.error("[health]", error);
    return c.json(
      {
        ok: false,
        env,
        database: "error",
        error: error instanceof Error ? error.message : String(error)
      },
      500
    );
  }
});
app.all("/api", async (c) => {
  const route = c.req.query("route");
  if (!route || !route.startsWith("/")) {
    throw new HTTPException(400, { message: "\u7F3A\u5C11\u63A5\u53E3\u8DEF\u7531" });
  }
  const url = new URL(c.req.url);
  url.pathname = `/api${route}`;
  url.searchParams.delete("route");
  const request = new Request(url.toString(), {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: c.req.method === "GET" || c.req.method === "HEAD" ? null : c.req.raw.body,
    duplex: "half"
  });
  return app.fetch(request);
});
var ALLOWED_ACTIONS = /* @__PURE__ */ new Set([
  "theme/set",
  "author/set",
  "attendanceRule/set",
  "voteMode/set",
  "delegation/add",
  "delegation/rename",
  "delegation/delete",
  "delegation/setVotes",
  "delegation/setHead",
  "delegation/toggleVeto",
  "seat/add",
  "seat/rename",
  "seat/delete",
  "seat/togglePresent",
  "seat/setVotes",
  "session/add",
  "session/rename",
  "session/delete",
  "topic/add",
  "topic/rename",
  "topic/delete",
  "current/set",
  "current/clear",
  "resolution/add",
  "resolution/rename",
  "resolution/delete",
  "resolution/finish",
  "motionType/add",
  "motionType/update",
  "motionType/delete",
  "motion/start",
  "motion/end",
  "fileType/add",
  "fileType/update",
  "fileType/delete",
  "settings/patch",
  "state/replace",
  "state/reset"
]);
async function readJson(c) {
  try {
    const value = await c.req.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("not object");
    }
    return value;
  } catch {
    throw new HTTPException(400, { message: "\u8BF7\u6C42\u4F53\u683C\u5F0F\u9519\u8BEF" });
  }
}
function text(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}
async function listAccounts(conferenceId) {
  const db = getDb();
  const [result, meeting] = await Promise.all([
    db.execute({
      sql: `SELECT a.id, a.username, a.name, a.created_at, cm.role, cm.seat_id
            FROM conference_members cm
            JOIN accounts a ON a.id = cm.account_id
            WHERE cm.conference_id = ?
            ORDER BY CASE cm.role WHEN 'chair' THEN 0 ELSE 1 END, a.created_at ASC`,
      args: [conferenceId]
    }),
    loadMeeting(conferenceId)
  ]);
  const seats = /* @__PURE__ */ new Map();
  for (const delegation of meeting.state.delegations) {
    for (const seat of delegation.seats) {
      seats.set(seat.id, { seatName: seat.name, delegationName: delegation.name });
    }
  }
  return result.rows.map((row) => {
    const seatId = row.seat_id ? String(row.seat_id) : null;
    const seat = seatId ? seats.get(seatId) : void 0;
    return {
      id: String(row.id),
      username: String(row.username),
      name: String(row.name),
      role: String(row.role) === "chair" ? "chair" : "delegate",
      createdAt: Number(row.created_at),
      seatId: seat ? seatId : null,
      seatName: seat?.seatName ?? null,
      delegationName: seat?.delegationName ?? null
    };
  });
}
async function getMyMembership(user) {
  const member = await getDb().execute({
    sql: "SELECT seat_id FROM conference_members WHERE conference_id = ? AND account_id = ? LIMIT 1",
    args: [user.conferenceId, user.id]
  });
  const seatId = member.rows[0]?.seat_id ? String(member.rows[0].seat_id) : null;
  if (!seatId) return null;
  const meeting = await loadMeeting(user.conferenceId);
  for (const delegation of meeting.state.delegations) {
    const seat = delegation.seats.find((item) => item.id === seatId);
    if (seat) {
      return {
        seatId,
        delegationId: delegation.id,
        delegationName: delegation.name,
        isHead: delegation.headSeatId === seatId
      };
    }
  }
  return null;
}
async function validateRecipients(conferenceId, ids) {
  if (!Array.isArray(ids)) return [];
  const unique = [...new Set(ids.filter((item) => typeof item === "string"))];
  if (unique.length === 0) return [];
  const placeholders = unique.map(() => "?").join(",");
  const result = await getDb().execute({
    sql: `SELECT account_id FROM conference_members
          WHERE conference_id = ? AND role = 'delegate'
            AND account_id IN (${placeholders})`,
    args: [conferenceId, ...unique]
  });
  const found = new Set(result.rows.map((row) => String(row.account_id)));
  return unique.filter((id) => found.has(id));
}
async function validateEventInput(conferenceId, body, currentTime) {
  const title = text(body.title, 80);
  const content = text(body.content, 8e3);
  if (!title) throw new HTTPException(400, { message: "\u4E8B\u4EF6\u6807\u9898\u4E0D\u80FD\u4E3A\u7A7A" });
  const isRealtime = body.isRealtime === true;
  const eventTimeRaw = Number(body.eventTime);
  const eventTime = isRealtime ? currentTime : Number.isFinite(eventTimeRaw) && Math.abs(eventTimeRaw) <= 864e13 ? Math.round(eventTimeRaw) : currentTime;
  const isCrisis = body.isCrisis === true;
  const visibility = isCrisis ? "PUBLIC" : body.visibility === "PUBLIC" ? "PUBLIC" : "SECRET";
  const recipientIds = visibility === "SECRET" ? await validateRecipients(conferenceId, body.recipientIds) : [];
  return { title, content, eventTime, isCrisis, isRealtime, visibility, recipientIds };
}
app.post("/api/auth/login", async (c) => {
  const body = await readJson(c);
  const user = await loginUser(c, text(body.username, 40), String(body.password ?? ""));
  return c.json({ me: user, conferences: await listMemberships(user.id) });
});
app.post("/api/auth/logout", async (c) => {
  await logoutUser(c);
  return c.json({ ok: true });
});
app.get("/api/auth/me", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ me: null, conferences: [] });
  return c.json({ me: user, conferences: await listMemberships(user.id) });
});
app.post("/api/auth/switch", async (c) => {
  const body = await readJson(c);
  const conferenceId = text(body.conferenceId, 100);
  const user = await switchConference(c, conferenceId);
  return c.json({ me: user, conferences: await listMemberships(user.id) });
});
app.get("/api/conferences", async (c) => {
  const user = await requireUser(c);
  return c.json({ conferences: await listMemberships(user.id) });
});
app.post("/api/conferences", async (c) => {
  const user = await requireChair(c);
  const body = await readJson(c);
  const conference = await createConference(user, text(body.name, 80));
  return c.json({ conference, conferences: await listMemberships(user.id) });
});
app.post("/api/conferences/chairs", async (c) => {
  const user = await requireChair(c);
  const body = await readJson(c);
  const accountId = text(body.accountId, 100);
  const ok = await addExistingChair(user.conferenceId, accountId);
  if (!ok) throw new HTTPException(404, { message: "\u4E3B\u5E2D\u8D26\u53F7\u4E0D\u5B58\u5728" });
  return c.json({ ok: true });
});
app.get("/api/bootstrap", async (c) => {
  const user = await requireUser(c);
  await publishDueEvents(user.conferenceId);
  const [meeting, time] = await Promise.all([
    loadMeeting(user.conferenceId),
    getTimeState(user.conferenceId)
  ]);
  const [events, files, conferences] = await Promise.all([
    listEvents(user),
    listFiles(user),
    listMemberships(user.id)
  ]);
  const accounts = user.role === "chair" ? await listAccounts(user.conferenceId) : [];
  const myMembership = await getMyMembership(user);
  return c.json({
    me: user,
    conference: meeting.state,
    time,
    events,
    files,
    accounts,
    conferences,
    myMembership,
    revision: meeting.revision,
    serverNow: Date.now()
  });
});
app.post("/api/conference/action", async (c) => {
  const user = await requireChair(c);
  const body = await readJson(c);
  const action = body.action;
  if (!action || typeof action !== "object" || !ALLOWED_ACTIONS.has(String(action.type))) {
    throw new HTTPException(400, { message: "\u672A\u77E5\u64CD\u4F5C" });
  }
  try {
    const snapshot = await applyConferenceAction(user.conferenceId, action);
    return c.json({ conference: snapshot.state, revision: snapshot.revision });
  } catch (error) {
    console.error("[conference action]", error);
    throw new HTTPException(400, { message: "\u64CD\u4F5C\u672A\u80FD\u5B8C\u6210" });
  }
});
app.post("/api/time", async (c) => {
  const user = await requireChair(c);
  const body = await readJson(c);
  const action = String(body.action ?? "");
  const value = Number(body.value);
  if (action === "set") {
    if (!Number.isFinite(value) || Math.abs(value) > 864e13) {
      throw new HTTPException(400, { message: "\u65F6\u95F4\u683C\u5F0F\u4E0D\u6B63\u786E" });
    }
    await setCurrentTime(user.conferenceId, value);
  } else if (action === "start") {
    await startTimeFlow(user.conferenceId);
  } else if (action === "pause") {
    await pauseTimeFlow(user.conferenceId);
  } else if (action === "rate") {
    if (!Number.isFinite(value) || value <= 0 || value > 1e3) {
      throw new HTTPException(400, { message: "\u6D41\u901F\u9700\u5728 0\u20131000 \u4E4B\u95F4" });
    }
    await setTimeRate(user.conferenceId, value);
  } else if (action === "clearCrisis") {
    await clearCrisisPause(user.conferenceId);
  } else {
    throw new HTTPException(400, { message: "\u672A\u77E5\u65F6\u95F4\u64CD\u4F5C" });
  }
  await publishDueEvents(user.conferenceId);
  return c.json({ time: await getTimeState(user.conferenceId) });
});
app.post("/api/events", async (c) => {
  const user = await requireChair(c);
  const body = await readJson(c);
  const current = await getTimeState(user.conferenceId);
  const input = await validateEventInput(user.conferenceId, body, current.currentMs);
  const id = await createEvent(user, input);
  return c.json({ id, time: await getTimeState(user.conferenceId) });
});
app.patch("/api/events/:id", async (c) => {
  const user = await requireChair(c);
  const body = await readJson(c);
  const current = await getTimeState(user.conferenceId);
  const input = await validateEventInput(user.conferenceId, body, current.currentMs);
  const ok = await updateEvent(c.req.param("id"), user, input);
  if (!ok) throw new HTTPException(404, { message: "\u4E8B\u4EF6\u4E0D\u5B58\u5728" });
  return c.json({ ok: true, time: await getTimeState(user.conferenceId) });
});
app.delete("/api/events/:id", async (c) => {
  const user = await requireChair(c);
  const ok = await deleteEvent(c.req.param("id"), user);
  if (!ok) throw new HTTPException(404, { message: "\u4E8B\u4EF6\u4E0D\u5B58\u5728" });
  return c.json({ ok: true, time: await getTimeState(user.conferenceId) });
});
app.post("/api/events/:id/read", async (c) => {
  const user = await requireUser(c);
  const body = await readJson(c);
  const ok = await setEventRead(user, c.req.param("id"), body.read === true);
  if (!ok) throw new HTTPException(404, { message: "\u6CA1\u6709\u627E\u5230\u8BE5\u4E8B\u4EF6" });
  return c.json({ ok: true });
});
app.post("/api/events/:id/attachment", async (c) => {
  const user = await requireChair(c);
  let form;
  try {
    form = await c.req.formData();
  } catch {
    throw new HTTPException(400, { message: "\u9644\u4EF6\u683C\u5F0F\u9519\u8BEF" });
  }
  const file = form.get("file");
  if (!file || typeof file === "string" || !("arrayBuffer" in file)) {
    throw new HTTPException(400, { message: "\u8BF7\u9009\u62E9\u9644\u4EF6" });
  }
  const actual = file;
  if (actual.size <= 0 || actual.size > 2 * 1024 * 1024) {
    throw new HTTPException(400, { message: "\u9644\u4EF6\u9700\u5728 2 MB \u4EE5\u5185" });
  }
  const ok = await setEventAttachment(user, c.req.param("id"), {
    filename: actual.name,
    mime: actual.type || "application/octet-stream",
    size: actual.size,
    bytes: new Uint8Array(await actual.arrayBuffer())
  });
  if (!ok) throw new HTTPException(404, { message: "\u4E8B\u4EF6\u4E0D\u5B58\u5728" });
  return c.json({ ok: true });
});
app.get("/api/events/:id/attachment", async (c) => {
  const user = await requireUser(c);
  const found = await getEventAttachmentForDownload(user, c.req.param("id"));
  if (!found) throw new HTTPException(404, { message: "\u9644\u4EF6\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u4E0B\u8F7D" });
  return new Response(new Blob([found.bytes], { type: found.mime }), {
    headers: {
      "Content-Type": found.mime,
      "Content-Length": String(found.bytes.length),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(found.filename)}`,
      "Cache-Control": "private, no-store"
    }
  });
});
var MAX_FILE_SIZE = 2 * 1024 * 1024;
app.post("/api/files", async (c) => {
  const user = await requireUser(c);
  let form;
  try {
    form = await c.req.formData();
  } catch {
    throw new HTTPException(400, { message: "\u6587\u4EF6\u4E0A\u4F20\u683C\u5F0F\u9519\u8BEF" });
  }
  const filePart = form.get("file");
  const actual = filePart && typeof filePart !== "string" && "arrayBuffer" in filePart ? filePart : null;
  if (actual && actual.size > MAX_FILE_SIZE) {
    throw new HTTPException(400, { message: "\u6587\u4EF6\u4E0D\u80FD\u8D85\u8FC7 2 MB" });
  }
  const textContent = text(form.get("text"), 2e4);
  if (!actual && !textContent) {
    throw new HTTPException(400, { message: "\u8BF7\u9009\u62E9\u6587\u4EF6\u6216\u586B\u5199\u6587\u5B57\u5185\u5BB9" });
  }
  const meeting = await loadMeeting(user.conferenceId);
  const scope = String(form.get("scope") ?? "") === "PERSONAL" ? "PERSONAL" : "DELEGATION";
  const typeId = text(form.get("typeId"), 100);
  const fileType = meeting.state.fileTypes.find((item) => item.id === typeId) ?? meeting.state.fileTypes[0];
  if (!fileType) throw new HTTPException(400, { message: "\u6587\u4EF6\u7C7B\u578B\u4E0D\u5B58\u5728" });
  const membership = await getMyMembership(user);
  let delegationId = null;
  if (user.role === "chair") {
    if (scope === "DELEGATION") {
      const requested = text(form.get("delegationId"), 100);
      const delegation = meeting.state.delegations.find((item) => item.id === requested);
      if (!delegation) throw new HTTPException(400, { message: "\u8BF7\u9009\u62E9\u4EE3\u8868\u56E2" });
      delegationId = delegation.id;
    }
  } else if (scope === "DELEGATION") {
    if (!membership) throw new HTTPException(403, { message: "\u4F60\u8FD8\u6CA1\u6709\u7ED1\u5B9A\u5E2D\u4F4D" });
    const delegation = meeting.state.delegations.find(
      (item) => item.id === membership.delegationId
    );
    if (!delegation || delegation.headSeatId !== membership.seatId) {
      throw new HTTPException(403, { message: "\u53EA\u6709\u9601\u9996\u53EF\u4EE5\u63D0\u4EA4\u4EE3\u8868\u56E2\u6587\u4EF6" });
    }
    delegationId = delegation.id;
  }
  if (scope === "PERSONAL") {
    if (!fileType.allowPersonal) {
      throw new HTTPException(403, { message: "\u8BE5\u6587\u4EF6\u7C7B\u578B\u4E0D\u5141\u8BB8\u4E2A\u4EBA\u53D1\u9001" });
    }
    if (user.role !== "chair" && !meeting.state.settings.allowPersonalFiles) {
      throw new HTTPException(403, { message: "\u4E3B\u5E2D\u56E2\u5C1A\u672A\u5F00\u653E\u4E2A\u4EBA\u6587\u4EF6\u6743\u9650" });
    }
  }
  let cosignerDelegationIds = [];
  if (scope === "DELEGATION") {
    const raw2 = form.get("cosigners");
    if (typeof raw2 === "string" && raw2) {
      try {
        const parsed = JSON.parse(raw2);
        if (Array.isArray(parsed)) {
          const valid = new Set(meeting.state.delegations.map((item) => item.id));
          cosignerDelegationIds = [
            ...new Set(
              parsed.filter(
                (item) => typeof item === "string" && item !== delegationId && valid.has(item)
              )
            )
          ];
        }
      } catch {
        cosignerDelegationIds = [];
      }
    }
    if (fileType.forceCoSign && cosignerDelegationIds.length === 0) {
      throw new HTTPException(400, { message: "\u8BE5\u6587\u4EF6\u7C7B\u578B\u5FC5\u987B\u9009\u62E9\u8054\u7F72\u56FD\u5BB6" });
    }
  }
  const coSign = scope === "DELEGATION" && (fileType.forceCoSign || form.get("coSign") === "true") && cosignerDelegationIds.length > 0;
  const title = text(form.get("title"), 80) || actual?.name || "\u6587\u5B57\u6587\u4EF6";
  const bytes = actual ? new Uint8Array(await actual.arrayBuffer()) : new Uint8Array();
  await createFile(user, {
    title,
    filename: (actual?.name ?? "\u6587\u5B57\u5185\u5BB9").slice(0, 200),
    mime: actual?.type || "text/plain",
    size: actual?.size ?? 0,
    fileTypeId: fileType.id,
    fileType: fileType.name,
    textContent,
    scope,
    delegationId,
    coSign,
    cosignerDelegationIds: coSign ? cosignerDelegationIds : [],
    bytes
  });
  if (coSign) {
    const heads = await getCosignerHeadAccountIds(user, cosignerDelegationIds);
    await sendPushToAccounts(heads, {
      title: `\u8054\u7F72\u6587\u4EF6\u5F85\u786E\u8BA4\uFF1A${title}`,
      body: "\u8BF7\u6253\u5F00\u4F1A\u573A\u6587\u4EF6\u9875\u9605\u8BFB\u5E76\u786E\u8BA4\u8054\u7F72\u3002",
      url: "/#/files",
      tag: `mun-file-${title}`
    });
  }
  return c.json({ ok: true });
});
app.get("/api/files/:id/download", async (c) => {
  const user = await requireUser(c);
  const found = await getFileForDownload(user, c.req.param("id"));
  if (!found) throw new HTTPException(404, { message: "\u6587\u4EF6\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u4E0B\u8F7D" });
  const encoded = encodeURIComponent(found.file.filename);
  const body = new Blob([found.bytes], {
    type: found.file.mime
  });
  return new Response(body, {
    headers: {
      "Content-Type": found.file.mime,
      "Content-Length": String(found.file.size),
      "Content-Disposition": `attachment; filename*=UTF-8''${encoded}`,
      "Cache-Control": "private, no-store"
    }
  });
});
app.post("/api/files/:id/read", async (c) => {
  const user = await requireChair(c);
  const body = await readJson(c);
  const ok = await setFileRead(user, c.req.param("id"), body.read === true);
  if (!ok) throw new HTTPException(404, { message: "\u6587\u4EF6\u4E0D\u5B58\u5728" });
  return c.json({ ok: true });
});
app.post("/api/files/:id/forward", async (c) => {
  const user = await requireChair(c);
  const found = await getFileForDownload(user, c.req.param("id"));
  if (!found) throw new HTTPException(404, { message: "\u6587\u4EF6\u4E0D\u5B58\u5728" });
  const meeting = await loadMeeting(user.conferenceId);
  const fileType = meeting.state.fileTypes.find((item) => item.id === found.file.fileTypeId) ?? meeting.state.fileTypes.find((item) => item.name === found.file.fileType);
  if (!fileType?.allowPublic) {
    throw new HTTPException(403, { message: "\u8BE5\u6587\u4EF6\u7C7B\u578B\u4E0D\u5141\u8BB8\u516C\u5F00\u8F6C\u53D1" });
  }
  const current = await getTimeState(user.conferenceId);
  const id = await createEvent(user, {
    title: found.file.title,
    content: found.file.textContent || `\u4E3B\u5E2D\u56E2\u8F6C\u53D1\u4E86\u6587\u4EF6\uFF1A${found.file.title}`,
    eventTime: current.currentMs,
    isCrisis: false,
    isRealtime: true,
    visibility: "PUBLIC",
    recipientIds: []
  });
  if (found.bytes.length > 0) {
    await setEventAttachment(user, id, {
      filename: found.file.filename,
      mime: found.file.mime,
      size: found.file.size,
      bytes: found.bytes
    });
  }
  return c.json({ id });
});
app.post("/api/files/:id/confirm", async (c) => {
  const user = await requireUser(c);
  const ok = await confirmFile(user, c.req.param("id"));
  if (!ok) throw new HTTPException(403, { message: "\u53EA\u6709\u8054\u7F72\u4EE3\u8868\u56E2\u7684\u9601\u9996\u53EF\u4EE5\u786E\u8BA4" });
  return c.json({ ok: true });
});
app.post("/api/accounts", async (c) => {
  const user = await requireChair(c);
  const body = await readJson(c);
  const username = text(body.username, 32);
  const password = String(body.password ?? "");
  const name = text(body.name, 40) || username;
  const role = body.role === "chair" ? "chair" : "delegate";
  if (username.length < 2) throw new HTTPException(400, { message: "\u8D26\u53F7\u81F3\u5C11 2 \u4E2A\u5B57\u7B26" });
  if (password.length < 4) throw new HTTPException(400, { message: "\u5BC6\u7801\u81F3\u5C11 4 \u4E2A\u5B57\u7B26" });
  const db = getDb();
  const exists = await db.execute({
    sql: "SELECT id FROM accounts WHERE username = ? LIMIT 1",
    args: [username]
  });
  if (exists.rows.length > 0) {
    throw new HTTPException(409, { message: "\u8BE5\u8D26\u53F7\u5DF2\u5B58\u5728" });
  }
  const id = createId("acc");
  await db.batch([
    {
      sql: `INSERT INTO accounts (id, username, password, name, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, username, hashPassword(password), name, role, Date.now()]
    },
    {
      sql: `INSERT INTO conference_members
            (conference_id, account_id, role, seat_id, created_at)
            VALUES (?, ?, ?, NULL, ?)`,
      args: [user.conferenceId, id, role, Date.now()]
    }
  ]);
  return c.json({ ok: true });
});
app.patch("/api/accounts/:id", async (c) => {
  const chair = await requireChair(c);
  const id = c.req.param("id");
  const body = await readJson(c);
  const db = getDb();
  const target = await db.execute({
    sql: `SELECT a.id, a.role, cm.role AS member_role
          FROM conference_members cm
          JOIN accounts a ON a.id = cm.account_id
          WHERE cm.conference_id = ? AND a.id = ? LIMIT 1`,
    args: [chair.conferenceId, id]
  });
  if (target.rows.length === 0) throw new HTTPException(404, { message: "\u8D26\u53F7\u4E0D\u5B58\u5728" });
  const name = text(body.name, 40);
  if (name) {
    await db.execute({ sql: "UPDATE accounts SET name = ? WHERE id = ?", args: [name, id] });
  }
  if ("seatId" in body) {
    const rawSeatId = body.seatId;
    if (rawSeatId === null || rawSeatId === "") {
      await db.execute({
        sql: "UPDATE conference_members SET seat_id = NULL WHERE conference_id = ? AND account_id = ?",
        args: [chair.conferenceId, id]
      });
    } else if (typeof rawSeatId === "string") {
      const meeting = await loadMeeting(chair.conferenceId);
      const seat = meeting.state.delegations.flatMap((delegation) => delegation.seats).find((item) => item.id === rawSeatId);
      if (!seat) throw new HTTPException(404, { message: "\u5E2D\u4F4D\u4E0D\u5B58\u5728" });
      await db.execute({
        sql: "UPDATE conference_members SET seat_id = NULL WHERE conference_id = ? AND seat_id = ? AND account_id <> ?",
        args: [chair.conferenceId, rawSeatId, id]
      });
      await db.execute({
        sql: "UPDATE conference_members SET seat_id = ? WHERE conference_id = ? AND account_id = ?",
        args: [rawSeatId, chair.conferenceId, id]
      });
    } else {
      throw new HTTPException(400, { message: "\u5E2D\u4F4D\u53C2\u6570\u4E0D\u6B63\u786E" });
    }
  }
  if (typeof body.password === "string" && body.password.length > 0) {
    if (body.password.length < 4) {
      throw new HTTPException(400, { message: "\u5BC6\u7801\u81F3\u5C11 4 \u4E2A\u5B57\u7B26" });
    }
    await setAccountPassword(id, body.password);
    if (id === chair.id) await logoutUser(c);
  }
  return c.json({ ok: true });
});
app.delete("/api/accounts/:id", async (c) => {
  const chair = await requireChair(c);
  const id = c.req.param("id");
  if (id === chair.id) throw new HTTPException(400, { message: "\u4E0D\u80FD\u5220\u9664\u5F53\u524D\u767B\u5F55\u8D26\u53F7" });
  const db = getDb();
  const target = await db.execute({
    sql: `SELECT a.role, a.username, cm.role AS member_role
          FROM conference_members cm
          JOIN accounts a ON a.id = cm.account_id
          WHERE cm.conference_id = ? AND a.id = ? LIMIT 1`,
    args: [chair.conferenceId, id]
  });
  if (target.rows.length === 0) throw new HTTPException(404, { message: "\u8D26\u53F7\u4E0D\u5B58\u5728" });
  const row = target.rows[0];
  if (String(row.username) === "123456") {
    throw new HTTPException(400, { message: "\u4E0D\u80FD\u5220\u9664\u521D\u59CB\u4E3B\u5E2D\u8D26\u53F7" });
  }
  if (String(row.member_role) === "chair") {
    const count = await db.execute({
      sql: "SELECT COUNT(*) AS n FROM conference_members WHERE conference_id = ? AND role = 'chair'",
      args: [chair.conferenceId]
    });
    if (Number(count.rows[0]?.n ?? 0) <= 1) {
      throw new HTTPException(400, { message: "\u4F1A\u573A\u81F3\u5C11\u9700\u8981\u4FDD\u7559\u4E00\u4E2A\u4E3B\u5E2D\u8D26\u53F7" });
    }
  }
  await db.execute({
    sql: `DELETE FROM event_recipients WHERE account_id = ?
          AND event_id IN (SELECT id FROM events WHERE conference_id = ?)`,
    args: [id, chair.conferenceId]
  });
  await db.execute({
    sql: `DELETE FROM event_reads WHERE account_id = ?
          AND event_id IN (SELECT id FROM events WHERE conference_id = ?)`,
    args: [id, chair.conferenceId]
  });
  await db.execute({
    sql: "DELETE FROM conference_members WHERE conference_id = ? AND account_id = ?",
    args: [chair.conferenceId, id]
  });
  await db.execute({
    sql: "DELETE FROM sessions WHERE account_id = ? AND conference_id = ?",
    args: [id, chair.conferenceId]
  });
  const others = await db.execute({
    sql: "SELECT 1 AS ok FROM conference_members WHERE account_id = ? LIMIT 1",
    args: [id]
  });
  if (others.rows.length === 0) {
    await db.execute({ sql: "DELETE FROM push_subscriptions WHERE account_id = ?", args: [id] });
    await db.execute({ sql: "DELETE FROM accounts WHERE id = ?", args: [id] });
  }
  return c.json({ ok: true });
});
app.get("/api/cron", async (c) => {
  const secret = process.env.CRON_SECRET;
  if (secret && c.req.header("authorization") !== `Bearer ${secret}`) {
    throw new HTTPException(401, { message: "unauthorized" });
  }
  await publishAllDueEvents();
  return c.json({ ok: true, at: Date.now() });
});
app.post("/api/cron", async (c) => {
  const secret = process.env.CRON_SECRET;
  if (secret && c.req.header("authorization") !== `Bearer ${secret}`) {
    throw new HTTPException(401, { message: "unauthorized" });
  }
  await publishAllDueEvents();
  return c.json({ ok: true, at: Date.now() });
});
app.get("/api/archives", async (c) => {
  const user = await requireChair(c);
  return c.json({ archives: await listArchives(user.conferenceId) });
});
app.post("/api/archives", async (c) => {
  const user = await requireChair(c);
  const body = await readJson(c);
  const name = text(body.name, 80);
  return c.json({
    archive: await createArchive(user.conferenceId, name, body.include)
  });
});
app.delete("/api/archives/:id", async (c) => {
  const user = await requireChair(c);
  const ok = await deleteArchive(user.conferenceId, c.req.param("id"));
  if (!ok) throw new HTTPException(404, { message: "\u5B58\u6863\u4E0D\u5B58\u5728" });
  return c.json({ ok: true });
});
app.post("/api/archives/:id/restore", async (c) => {
  const user = await requireChair(c);
  try {
    await restoreArchive(user.conferenceId, c.req.param("id"));
  } catch (error) {
    throw new HTTPException(400, {
      message: error instanceof Error ? error.message : "\u5B58\u6863\u8BFB\u53D6\u5931\u8D25"
    });
  }
  return c.json({ ok: true });
});
app.get("/api/push/public-key", async (c) => {
  await requireUser(c);
  const publicKey = await getPushPublicKey();
  if (!publicKey) throw new HTTPException(500, { message: "Web Push \u672A\u5C31\u7EEA" });
  return c.json({ publicKey });
});
app.post("/api/push/subscribe", async (c) => {
  const user = await requireUser(c);
  const body = await readJson(c);
  const ok = await savePushSubscription(user.id, user.conferenceId, body);
  if (!ok) throw new HTTPException(400, { message: "\u8BA2\u9605\u4FE1\u606F\u4E0D\u5B8C\u6574" });
  return c.json({ ok: true });
});
app.delete("/api/push/subscribe", async (c) => {
  const user = await requireUser(c);
  const body = await readJson(c);
  await removePushSubscription(user.id, String(body.endpoint ?? ""));
  return c.json({ ok: true });
});
app.post("/api/admin/clear", async (c) => {
  const user = await requireChair(c);
  const body = await readJson(c);
  await clearConferenceData(user.conferenceId, user.id, body.include);
  return c.json({ ok: true });
});
app.notFound((c) => c.json({ error: "\u63A5\u53E3\u4E0D\u5B58\u5728" }, 404));
app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json({ error: error.message || "\u8BF7\u6C42\u5931\u8D25" }, error.status);
  }
  console.error("[api]", error);
  return c.json({ error: error instanceof Error ? error.message : "\u670D\u52A1\u5668\u9519\u8BEF" }, 500);
});

// server/vercel-handler.ts
var handler = (request) => app.fetch(request);
var GET = handler;
var HEAD = handler;
var POST = handler;
var PUT = handler;
var PATCH = handler;
var DELETE = handler;
var OPTIONS = handler;
export {
  DELETE,
  GET,
  HEAD,
  OPTIONS,
  PATCH,
  POST,
  PUT
};
/*! Bundled license information:

safe-buffer/index.js:
  (*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> *)
*/
