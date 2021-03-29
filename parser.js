"use strict";

// prettier-ignore
var STATE = {
  NONE:         0,
  OPEN_TAG:     1 << 1,
  CLOSE_TAG:    1 << 2,
  SELF_CLOSING: 1 << 3,
  ATTR_NAME:    1 << 4,
  ATTR_VALUE:   1 << 5,
  TEXT:         1 << 6,
  COMMENT:      1 << 7,
  ONELINE:      1 << 8,
  MULTILINE:    1 << 9,
  SINGLE_QUOTE: 1 << 10,
  DOUBLE_QUOTE: 1 << 11,
  STYLE_TAG:    1 << 12,
  SCRIPT_TAG:   1 << 13,
};

function process(html, handler) {
  // prettier-ignore
  var 
    i = 0,                   
    c = html[i], // char or symbol
    s = STATE.TEXT, // state
    p = STATE.NONE, // previous state,
    f = STATE.NONE; // additional flags

  // checks last html symbols
  // equal to passed char or string
  function equal(str, last) {
    if (str.length <= 1 && !last) return str === c;
    return str === (last ? last : html.substring(i - str.length, i));
  }

  // cuts html substring from i to j
  function cut(i, j) {
    return html.substring(i, j);
  }

  // checks current state equals to passed state
  function is(state) {
    return state === s;
  }

  // checks previous state equals to passed state
  function was(state) {
    return state === p;
  }

  var stack = [0];

  // set index to top of stack
  stack.set = function (index) {
    stack[stack.length - 1] = index;
  };

  // get index from top of stack
  stack.get = function () {
    return stack[stack.length - 1];
  };

  var MACHINE = new (function () {
    this[STATE.TEXT] = {
      enter: function () {
        if (was(STATE.OPEN_TAG | STATE.CLOSE_TAG) || was(STATE.STYLE_TAG) || was(STATE.SCRIPT_TAG)) return;
        stack.set(i);
      },
      exit: function () {
        var text = cut(stack.get(), i);
        if (!text) return;

        // console.log(`TEXT: ${text}`);
        handler.onText(text);
      },
      do: function () {
        if (equal("<")) {
          s = STATE.OPEN_TAG | STATE.CLOSE_TAG;
        }
      },
    };

    this[STATE.OPEN_TAG | STATE.CLOSE_TAG] = {
      enter: function () {
        stack.push(i);
      },
      exit: function () {
        var start = stack.pop();
        if (is(STATE.OPEN_TAG)) stack.set(start);
      },
      do: function () {
        if (equal("!--")) s = STATE.COMMENT;
        else if (equal("/")) s = STATE.CLOSE_TAG;
        else if (equal(" ")) s = STATE.TEXT;
        else if (!equal("!") && !equal("-")) s = STATE.OPEN_TAG;
      },
    };

    this[STATE.OPEN_TAG] = {
      exit: function () {
        var tag = cut(stack.get(), i);
        if (!tag) return;

        if (tag === "style") f = STATE.STYLE_TAG;
        if (tag === "script") f = STATE.SCRIPT_TAG;

        // console.log(`OPEN TAG: ${tag}`);
        handler.onOpenTag(tag);
      },
      do: function () {
        if (equal(">")) s = STATE.SELF_CLOSING;
        else if (equal(" ")) s = STATE.ATTR_NAME;
      },
    };

    this[STATE.CLOSE_TAG] = {
      enter: function () {
        stack.set(i);
      },
      exit: function () {
        var tag = cut(stack.get(), i);
        if (!tag) return;

        // console.log(`CLOSE TAG: ${tag}`);
        handler.onCloseTag(tag);
      },
      do: function () {
        if (equal(">")) {
          s = STATE.TEXT;
        }
      },
    };

    this[STATE.SELF_CLOSING] = {
      enter: function () {
        stack.push(i);
      },
      exit: function () {
        var start = stack.pop();
        i = start - 1;

        if (f & STATE.STYLE_TAG) s = STATE.OPEN_TAG | STATE.STYLE_TAG;
        if (f & STATE.SCRIPT_TAG) s = STATE.OPEN_TAG | STATE.SCRIPT_TAG;
      },
      do: function () {
        if (equal("/>", cut(i - 2, i))) this.mark();
        else this.close();
        s = STATE.TEXT;
      },
      mark: function () {
        // console.log(`SELF CLOSING`);
        handler.onSelfClose();
      },
      close: function () {
        // console.log(`OPEN TAG EXIT`);
        handler.onOpenTagExit();
      },
    };

    this[STATE.ATTR_NAME] = {
      enter: function () {
        stack.set(i);
      },
      exit: function () {
        if (equal("/", cut(i - 1, i))) return;

        var attr = cut(stack.get(), i);
        if (!attr) return;

        // console.log(`ATTR NAME: ${attr}`);
        handler.onAttrName(attr);
      },
      do: function () {
        if (equal(" ") || equal("/")) this.repeat();
        else if (equal(">")) s = STATE.SELF_CLOSING;
        else if (equal("=")) s = STATE.ATTR_VALUE;
      },
      repeat: function () {
        this.exit();
        stack.set(i + 1);
      },
    };

    this[STATE.ATTR_VALUE] = {
      enter: function () {
        if (equal("'")) {
          s |= STATE.SINGLE_QUOTE;
          stack.set(i + 1);
        } else if (equal('"')) {
          s |= STATE.DOUBLE_QUOTE;
          stack.set(i + 1);
        } else stack.set(i);
      },
      exit: function () {
        var value = cut(stack.get(i), i);
        if (!value) return;

        // console.log(`ATTR VALUE: ${value}`);
        handler.onAttrValue(value);
      },
      do: function () {
        if (equal(" ")) s = STATE.ATTR_NAME;
        else if (equal(">")) s = STATE.SELF_CLOSING;
      },
    };

    this[STATE.ATTR_VALUE | STATE.SINGLE_QUOTE] = {
      exit: this[STATE.ATTR_VALUE].exit,
      do: function () {
        if (equal("'")) s = STATE.ATTR_NAME;
      },
    };

    this[STATE.ATTR_VALUE | STATE.DOUBLE_QUOTE] = {
      exit: this[STATE.ATTR_VALUE].exit,
      do: function () {
        if (equal('"')) s = STATE.ATTR_NAME;
      },
    };

    this[STATE.STYLE_TAG] = {
      do: function () {
        if (equal("/*")) s = STATE.STYLE_TAG | STATE.COMMENT;
        else if (equal("'")) s = STATE.STYLE_TAG | STATE.SINGLE_QUOTE;
        else if (equal('"')) s = STATE.STYLE_TAG | STATE.DOUBLE_QUOTE;
        else if (equal("<")) {
          if (equal("</style>", cut(i, i + 8))) {
            s = STATE.TEXT;
            i--;
            this.close();
          }
        }
      },
      close: function () {
        var start = stack.pop();
        stack.set(start);

        f ^= STATE.STYLE_TAG;
      },
    };

    this[STATE.OPEN_TAG | STATE.STYLE_TAG] = {
      enter: function () {
        stack.push(i);
      },
      do: this[STATE.STYLE_TAG].do,
    };

    this[STATE.STYLE_TAG | STATE.COMMENT] = {
      do: function () {
        if (equal("*/")) s = STATE.STYLE_TAG;
      },
    };

    this[STATE.STYLE_TAG | STATE.SINGLE_QUOTE] = {
      do: function () {
        if (equal("'")) s = STATE.STYLE_TAG;
      },
    };

    this[STATE.STYLE_TAG | STATE.DOUBLE_QUOTE] = {
      do: function () {
        if (equal('"')) s = STATE.STYLE_TAG;
      },
    };

    this[STATE.SCRIPT_TAG] = {
      do: function () {
        if (equal("/*")) s = STATE.SCRIPT_TAG | STATE.COMMENT | STATE.MULTILINE;
        else if (equal("//")) s = STATE.SCRIPT_TAG | STATE.COMMENT | STATE.ONELINE;
        else if (equal("'")) s = STATE.SCRIPT_TAG | STATE.SINGLE_QUOTE;
        else if (equal('"')) s = STATE.SCRIPT_TAG | STATE.DOUBLE_QUOTE;
        else if (equal("`")) s = STATE.SCRIPT_TAG | STATE.MULTILINE;
        else if (equal("<")) {
          if (equal("</script>", cut(i, i + 9))) {
            s = STATE.TEXT;
            i--;
            this.close();
          }
        }
      },
      close: function () {
        var start = stack.pop();
        stack.set(start);

        f ^= STATE.SCRIPT_TAG;
      },
    };

    this[STATE.OPEN_TAG | STATE.SCRIPT_TAG] = {
      enter: function () {
        stack.push(i);
      },
      exit: this[STATE.SCRIPT_TAG].close,
      do: this[STATE.SCRIPT_TAG].do,
    };

    this[STATE.SCRIPT_TAG | STATE.COMMENT | STATE.MULTILINE] = {
      do: function () {
        if (equal("*/")) s = STATE.SCRIPT_TAG;
      },
    };

    this[STATE.SCRIPT_TAG | STATE.COMMENT | STATE.ONELINE] = {
      do: function () {
        if (equal("\n")) s = STATE.SCRIPT_TAG;
      },
    };

    this[STATE.SCRIPT_TAG | STATE.SINGLE_QUOTE] = {
      do: function () {
        if (equal("'")) s = STATE.SCRIPT_TAG;
      },
    };

    this[STATE.SCRIPT_TAG | STATE.DOUBLE_QUOTE] = {
      do: function () {
        if (equal('"')) s = STATE.SCRIPT_TAG;
      },
    };

    this[STATE.SCRIPT_TAG | STATE.MULTILINE] = {
      do: function () {
        if (equal("`")) s = STATE.SCRIPT_TAG;
      },
    };

    this[STATE.COMMENT] = {
      enter: function () {
        stack.set(i);
      },
      exit: function () {
        var comment = cut(stack.get(), i - 2);
        if (!comment) return;

        // console.log(`COMMENT: ${comment}`);
        handler.onAttrName(comment);
      },
      do: function () {
        if (equal("-->", cut(i - 2, i + 1))) s = STATE.TEXT;
      },
    };
  })();

  var transition = {},
    last_exit;
  for (; i < html.length; i++, c = html[i]) {
    last_exit = false;

    transition = MACHINE[s];
    if (!transition) continue;

    if (p != s && transition.enter) transition.enter();

    p = s;
    if (!transition.do) continue;
    transition.do();

    if (s != p && transition.exit) {
      transition.exit();

      last_exit = true;
    }
  }
  if (!last_exit && transition.exit) transition.exit();
}

function clear(node) {
  if (node.type === "root" || node.type === "node") {
    delete node.parent;
    delete node.last;

    if (node.children)
      node.children.forEach(function (node) {
        clear(node);
      });
  }
}

function parse(html) {
  let selfClosingTags = {
    "!DOCTYPE": true,
    "!doctype": true,
    // void
    area: true,
    base: true,
    br: true,
    col: true,
    command: true,
    embed: true,
    hr: true,
    img: true,
    input: true,
    keygen: true,
    link: true,
    meta: true,
    param: true,
    source: true,
    track: true,
    wbr: true,
    // svg
    circle: true,
    ellipse: true,
    line: true,
    path: true,
    polygon: true,
    polyline: true,
    rect: true,
    stop: true,
    use: true,
  };

  let //
    stack = {
      type: "root",
    },
    top = stack,
    handler = {};

  handler.onOpenTag = function (tagName) {
    var node = {
      type: "node",
      tagName,
    };

    node.parent = top;

    if (!top.children) top.children = [];
    top.children.push(node);

    top = node;
  };

  handler.onOpenTagExit = function () {
    if (selfClosingTags[top.tagName]) top = top.parent;
  };

  handler.onCloseTag = function (tagName) {
    top = top.parent;
  };

  handler.onSelfClose = function () {
    top = top.parent;
  };

  handler.onAttrName = function (attrName) {
    if (!top.attrs) top.attrs = {};
    top.last = attrName;
    top.attrs[attrName] = "";
  };

  handler.onAttrValue = function (attrValue) {
    top.attrs[top.last] = attrValue;
  };

  handler.onText = function (text) {
    if (!top.children) top.children = [];

    var node = {
      type: "text",
      text,
    };

    top.children.push(node);
  };

  handler.onComment = function (comment) {
    if (!top.children) top.children = [];

    var node = {
      type: "text",
      comment,
    };

    top.children.push(node);
  };

  process(html, handler);
  clear(stack);

  return stack;
}

module.exports = parse;
