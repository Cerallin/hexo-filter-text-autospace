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
    return stepIn(tmp);
  }
  return node;
}

function nextNode(node) {
  let parent = treeAdapter.getParentNode(node);

  // Ends at root
  if (!parent)
    return undefined;

  let nodeList = treeAdapter.getChildNodes(parent);
  let num = nodeList.indexOf(node);

  if (node = nodeList[++num])
    return stepIn(node);

  return nextNode(parent);
}

function selfMatch(node, tagName = 'hanla') {
  let text = node.value;
  let num = node.parentNode.childNodes.indexOf(node);
  let updated = false;

  patterns.forEach((pattern) => {
    let reg = new RegExp(pattern, 'gi');
    if (text.search(reg) < 0)
      return;
    updated = true;
    text = text.replace(reg, '$1<' + tagName + '></' + tagName + '>$2');
  })

  if (updated) {
    let parent = treeAdapter.getParentNode(node);
    let nodeList = parse5.parseFragment(text).childNodes;

    nodeList.map(function (n, i) {
      treeAdapter.insertBefore(parent, n, node);
      return n;
    });

    // Detach
    treeAdapter.detachNode(node);

    num += nodeList.length - 1;
    let tmp = parent.childNodes[num];
    return tmp;
  }
  return node;
}

function crossMatch(node, next, tagName = 'hanla') {
  let text = node.value + next.value;
  let updated = false;

  patterns.forEach((pattern) => {
    let reg = new RegExp(pattern, 'gi');
    if (text.search(reg) < 0)
      return;
    updated = true;
  })

  if (updated) {
    let parent = treeAdapter.getParentNode(next);
    let newNode = parse5.parseFragment('<' + tagName + '></' + tagName + '>')
      .childNodes[0];
    treeAdapter.insertBefore(parent, newNode, next);
  }
}

function matchFunc(type) {
  if (type === 'class') {
    return (ele, target) => {
      let reg = new RegExp('(^|\\s+)' + target + '($|\\s+)', 'gi')
      let list = treeAdapter.getAttrList(ele)
      if (!list)
        return false;
      let attr = list.filter(attr => attr.name === 'class')[0];
      return (attr && (attr.value || '').search(reg) > -1)
    }
  } else if (type === 'id') {
    return (ele, target) => {
      let reg = new RegExp('(^|\s+)' + target + '($|\s+)', 'gi')
      let list = treeAdapter.getAttrList(ele)
      if (!list)
        return false;
      let attr = list.filter(attr => attr.name === 'id')[0];
      return (attr && (attr.value || '').search(reg) > -1)
    }
  } else { // tag
    return (ele, target) => treeAdapter.getTagName(ele) === target;
  }
}

function searchElement(entry, options) {
  let { type, name } = options;
  let res = [], list = [];
  let match = matchFunc(type);

  // BFS
  let queue = [], node = entry;
  queue.push(node);
  while (node = queue.shift()) {
    if (match(node, name))
      res.push(node);
    if (list = node.childNodes)
      for (const n of list)
        queue.push(n);
  }

  return res;
}

module.exports = function (text_autospace_filter) {
  const conf = text_autospace_filter;

  this.process = function (str) {
    var document = parse5.parse(str);

    let html = document.childNodes[1];

    let nodeList = searchElement(html, conf.entry);
    nodeList.map((node) => {
      if (!node)
        return node;
      let mounted = node.parentNode;
      node.parentNode = null;

      filter(node);

      node.parentNode = mounted;
    })

    return parse5.serialize(document);

    function filter(entry) {
      let node = stepIn(entry);
      if (!treeAdapter.isTextNode(node) || isEmptyTextNode(node))
        node = nextTextNode(node);

      if (!node)
        return;

      // Next text node
      let next = nextTextNode(node);
      while (node && next) {
        crossMatch(selfMatch(node, conf.tag_name), next);
        node = next;
        next = nextTextNode(node);
      }
      selfMatch(node, conf.tag_name);
    }

    function nextTextNode(node) {
      let tmp = nextNode(node);
      while (tmp) {
        if (treeAdapter.isTextNode(tmp) && !isEmptyTextNode(tmp)) {
          break;
        }
        if (tmp.nodeName = conf.tag_name) {
          tmp.value = ' ';
          return tmp;
        }
        tmp = nextNode(tmp);
      }

      return tmp;
    }
  }
}