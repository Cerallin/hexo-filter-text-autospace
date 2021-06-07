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

// Leftest node
function stepIn(node) {
  let tmp = node;
  tmp.no = 0;

  if (tmp.childNodes)
    if (tmp = treeAdapter.getFirstChild(tmp))
      return stepIn(tmp);

  return node;
}

function nextNode(node) {
  let num = node.no;
  let parent = treeAdapter.getParentNode(node);
  // Ends at root
  if (!parent)
    return undefined;

  let nodeList = parent.childNodes;
  if (node = nodeList[++num])
    return stepIn(node);
  else
    return nextNode(parent);
}

function nextTextNode(node) {
  node = nextNode(node);
  if (!node) return undefined;
  for (; !treeAdapter.isTextNode(node) || !node.value;
    node = nextNode(node)) { }

  return node;
}

function insertArray(arr, new_arr, pos) {
  let before = arr.slice(0, pos)
  let after = arr.slice(pos + 1, arr.length)
  return before.concat(new_arr, after)
}

function selfMatch(node) {
  let text = node.value;

  patterns.forEach((pattern) => {
    let reg = new RegExp(pattern, 'gi');
    if (text.search(reg) < 0)
      return;

    text = text.replace(reg, '$1<hanla></hanla>$2');
    let nodeList = parse5.parseFragment(text).childNodes;
    let parent = treeAdapter.getParentNode(node);
    parent.childNodes = insertArray(parent.childNodes, nodeList, node.no);
    node = parent.childNodes[0];
  })

  return node;
}

function crossMatch(node, next) {
  let text = node.value + next.value;

  patterns.forEach((pattern) => {
    let reg = new RegExp(pattern, 'gi');
    if (text.search(reg) < 0)
      return;

    next = treeAdapter.getParentNode(next);
    let parent = treeAdapter.getParentNode(next);
    let newNode = parse5.parseFragment("<hanla></hanla>").childNodes[0];
    console.debug(newNode);
    treeAdapter.insertBefore(parent, newNode, next);
  })
}

module.exports = function (str) {
  const document = parse5.parse(str);

  let node = document.childNodes[1];
  node = stepIn(node);
  if (!treeAdapter.isTextNode(node))
    node = nextTextNode(node);

  // Self match
  node = selfMatch(node);

  // Next text node
  let next = nextTextNode(node);
  if (!next)
    return parse5.serialize(document);

  while (node !== next) {
    crossMatch(node, next);
    node = next;
    next = nextNode(next);
  }

  return parse5.serialize(document);
}
