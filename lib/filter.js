'use strict';

const parse5 = require('parse5');
const treeAdapter = require("parse5/lib/tree-adapters/default");

let hanzi = '[\u2E80-\u2FFF\u31C0-\u31EF\u3300-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFE30-\uFE4F]',
  punc = {
    base: "[@&=_\\$%\\^\\*-\\+/]",
    open: "[\\(\\[\\{<‘“]",
    close: "[,\\.\\?!:\\)\\]\\}>’”]"
  },
  latin = '[A-Za-z0-9\u00C0-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF]' + '|' + punc.base,
  patterns = [
    '(' + hanzi + ')(' + latin + '|' + punc.open + ')',
    '(' + latin + '|' + punc.close + ')(' + hanzi + ')'
  ];

function isEmptyTextNode(node) {
  let text = node.value;
  return (!text || text.search(/^\s+$/) > -1);
}

// Leftest node
function stepIn(node) {
  let tmp = node;
  if (tmp.childNodes && tmp.childNodes.length) {
    tmp = treeAdapter.getFirstChild(tmp);
    tmp.no = 0;
    return stepIn(tmp);
  }
  return node;
}

function nextNode(node) {
  let num = node.no;
  let parent = treeAdapter.getParentNode(node);
  // Ends at root
  if (!parent)
    return undefined;

  let nodeList = parent.childNodes;
  if (node = nodeList[++num]) {
    node.no = num;
    return stepIn(node);
  }

  return nextNode(parent);
}

function nextTextNode(node) {
  let tmp = nextNode(node);
  while (tmp) {
    if (treeAdapter.isTextNode(tmp) && !isEmptyTextNode(tmp)) {
      break;
    }
    tmp = nextNode(tmp);
  }

  return tmp;
}

function selfMatch(node) {
  let text = node.value;
  let num = node.no;
  let updated = false;

  patterns.forEach((pattern) => {
    let reg = new RegExp(pattern, 'gi');
    if (text.search(reg) < 0)
      return;
    updated = true;
    text = text.replace(reg, '$1<hanla></hanla>$2');
  })

  if (updated) {
    let parent = treeAdapter.getParentNode(node);
    let nodeList = parse5.parseFragment(text).childNodes;
    for (const n of nodeList) {
      treeAdapter.insertBefore(parent, n, node);
    }
    treeAdapter.detachNode(node);
    node = parent.childNodes[num];
  }

  return node;
}

function crossMatch(node, next) {
  let text = node.value + next.value;

  patterns.forEach((pattern) => {
    let reg = new RegExp(pattern, 'gi');
    if (text.search(reg) < 0)
      return;

    let parent = treeAdapter.getParentNode(next);
    let newNode = parse5.parseFragment("<hanla></hanla>")
      .childNodes[0];
    treeAdapter.insertBefore(parent, newNode, next);
  })
}

module.exports = function (str) {
  const document = parse5.parse(str);

  let node = document.childNodes[1];
  node = stepIn(node);
  if (!treeAdapter.isTextNode(node))
    node = nextTextNode(node);

  if (!node)
    return str;

  // Self match
  node = selfMatch(node);

  // Next text node
  let next = nextTextNode(node);
  while (node && next) {
    node = selfMatch(node);

    crossMatch(node, next);
    node = next;
    next = nextTextNode(next);
  }

  return parse5.serialize(document);
}
