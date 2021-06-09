'use strict';

const parse5 = require('parse5');
const treeAdapter = require("./tree-adapter");

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
  let text = treeAdapter.getTextNodeContent(node);
  return (!text || text.search(/^\n+\s+$/) > -1);
}

function matchFunc(type) {
  if (type === 'id' || type === 'class')
    return function (attrName) {
      return (ele, name) => {
        let reg = new RegExp('(^|\\s+)' + name + '($|\\s+)', 'gi')
        let list = treeAdapter.getAttrList(ele)
        if (!list) return false;
        let attr = list.filter(attr => attr.name === attrName)[0];
        return (attr && (attr.value || '').search(reg) > -1)
      }
    }(type);
  // tag by default
  return (ele, name) => treeAdapter.getTagName(ele) === name;
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
    if (list = treeAdapter.getChildNodes(node))
      for (const n of list)
        queue.push(n);
  }
  return res;
}

module.exports = function (text_autospace_filter) {
  const conf = text_autospace_filter;

  this.process = function (str) {
    const document = parse5.parse(str);
    let html = treeAdapter.getChildNodes(document)[1];

    let nodeList = searchElement(html, conf.entry);
    nodeList.map((node) => {
      if (!node)
        return node;
      let mounted = treeAdapter.getParentNode(node);
      treeAdapter.setParentNode(node, null);

      // Match and replace
      filter(node);

      treeAdapter.setParentNode(node, mounted);
    })

    return parse5.serialize(document);

    function filter(entry) {
      let list = [], res = [];
      // DFS
      let stack = [], node = entry;
      stack.push(entry);
      while (node = stack.pop()) {
        if (list = treeAdapter.getChildNodes(node))
          for (let i = list.length - 1; i >= 0; i--)
            stack.push(list[i]);
        if (treeAdapter.isTextNode(node) && !isEmptyTextNode(node))
          res.push(node);
        else if (treeAdapter.getTagName(node) === conf.tag_name) {
          treeAdapter.setTextNodeContent(node, ' ');
          res.push(node);
        }
      }

      while (res.length >= 2) {
        crossMatch(selfMatch(res[0]), res[1]);
        res.shift();
      }
      if (res.length) // Last node
        selfMatch(res[0]);
    }

    function selfMatch(node) {
      let text = treeAdapter.getTextNodeContent(node);
      let num = treeAdapter.getNodeIndex(node);
      let matched = false;

      patterns.forEach((pattern) => {
        let reg = new RegExp(pattern, 'gi');
        if (text.search(reg) < 0)
          return;
        matched = true;
        text = text.replace(reg, '$1<' + conf.tag_name + '></' + conf.tag_name + '>$2');
      })

      if (matched) {
        let parent = treeAdapter.getParentNode(node);
        let nodeList = treeAdapter.getChildNodes(parse5.parseFragment(text));
        // Insert generated nodes
        nodeList.map(function (n) {
          treeAdapter.insertBefore(parent, n, node);
          return n;
        });
        // Detach original node
        treeAdapter.detachNode(node);
        return treeAdapter.getChildNodes(parent)[num + nodeList.length - 1];
      }

      return node;
    }

    function crossMatch(node, next) {
      let text = treeAdapter.getTextNodeContent(node);
      text += treeAdapter.getTextNodeContent(next);
      let matched = false;

      patterns.forEach((pattern) => {
        let reg = new RegExp(pattern, 'gi');
        if (text.search(reg) < 0)
          return;
        matched = true;
      })

      if (matched) {
        let parent = treeAdapter.getParentNode(next);
        let newNode = treeAdapter.getChildNodes(
          parse5.parseFragment(
            '<' + conf.tag_name + '></' + conf.tag_name + '>'
          ))[0];
        treeAdapter.insertBefore(parent, newNode, next);
      }
    }
  }
}
