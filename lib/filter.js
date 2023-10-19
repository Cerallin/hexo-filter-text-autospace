'use strict';

const parse5 = require('parse5');
const treeAdapter = require("./tree-adapter");

// Pattern rules taken from text-autospace.js
const hanzi = '[\u2E80-\u2FFF\u31C0-\u31EF\u3300-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFE30-\uFE4F]',
  punc = {
    base: "[@&=_\\$%\\^\\*-\\+/]",
    open: "[\\(\\[\\{<‘“]",
    close: "[,\\.\\?!:\\)\\]\\}>’”]"
  },
  latin = '[A-Za-z0-9\u00C0-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF]' + '|' + punc.base,
  patterns = [
    RegExp('(' + hanzi + ')(' + latin + '|' + punc.open + ')', 'gi'),
    RegExp('(' + latin + '|' + punc.close + ')(' + hanzi + ')', 'gi')
  ];

/**
 * Returns a match function by type
 * to search node with selected attributes.
 *
 * @param {string} [type]
 * @returns {function}
 */
function matchFunc(type) {
  if (type === 'id' || type === 'class')
    return function (attrName) {
      return (ele, name) => {
        const reg = new RegExp('(^|\\s+)' + name + '($|\\s+)', 'gi')
        const list = treeAdapter.getAttrList(ele)
        if (!list) return false;
        const attr = list.filter(attr => attr.name === attrName)[0];
        return (attr && (attr.value || '').search(reg) > -1)
      }
    }(type);
  // tag by default
  return (ele, name) => treeAdapter.getTagName(ele) === name;
}

/**
 * Search a list of nodes matched with given rule.
 *
 * @param {Element} [entry] - Start entry of BFS
 * @param {string} [options.type] - Search nodes by tag_name|id|class
 * @param {string} [options.name] - Search rule
 * @returns {Array}
 */
function searchElement(entry, options) {
  const { type, name } = options;
  let res = [], list = [];
  const match = matchFunc(type);
  // BFS
  let node = entry, queue = [node];
  while (node = queue.shift())
    if (match(node, name))
      res.push(node);
    // Do not push child nodes if matched
    else if (list = treeAdapter.getChildNodes(node))
      queue.push(...list);

  return res;
}

module.exports = function (text_autospace_filter) {
  const { tag_name, entry } = text_autospace_filter;

  this.process = function (str) {
    const document = parse5.parse(str);
    for (const html of treeAdapter.getChildNodes(document)) {
      // Match and insert placeholder tags
      searchElement(html, entry).forEach(filter)
    }
    // Serialize and return
    return parse5.serialize(document);

    /**
     * Match and insert placeholder tags.
     * 1. match internal string of text nodes
     * 2. match adjacent text node strings
     *
     * @param {Element} entry
     *
     * @returns {null}
     */
    function filter(entry) {
      let list = [], res = [];
      let tmp, node = entry;
      // DFS
      let stack = [entry];
      while (node = stack.pop()) {
        // Push child nodes in reverse order
        if (list = treeAdapter.getChildNodes(node))
          stack.push(...list.slice().reverse());
        // If is text node and not empty
        if (treeAdapter.isTextNode(node) && !treeAdapter.isEmptyTextNode(node)) {
          // res always contains at most 1 node
          if (tmp = res.pop())
            crossMatch(tmp, node);

          // match inner text and store the node
          node = selfMatch(node);
          if (treeAdapter.isTextNode(node) && !treeAdapter.isEmptyTextNode(node))
            res.push(node);
        }
        // If is placeholder element
        else if (treeAdapter.getTagName(node) === tag_name) {
          // Set value to compat crossMatch func
          treeAdapter.setTextNodeContent(node, ' ');
          res.push(node);
        }
      }
    }

    /**
     * Match internal string and insert placeholder tags.
     *
     * @param {Element} node
     *
     * @returns {Element} last child node of generated new nodes
     */
    function selfMatch(node) {
      let text = treeAdapter.getTextNodeContent(node);

      const matched = patterns
        .map((reg) => {
          const bingo = (text.search(reg) != -1);
          if (bingo)
            text = text.replace(reg, '$1<' + tag_name + '></' + tag_name + '>$2');
          return bingo;
        })
        .reduce((sum, v) => sum || v);

      if (matched) {
        const parent = treeAdapter.getParentNode(node);
        const num = treeAdapter.getNodeIndex(node);
        // Generate new nodes
        const nodeList = treeAdapter.getChildNodes(parse5.parseFragment(text));
        // Insert generated nodes
        nodeList.forEach(n => { treeAdapter.insertBefore(parent, n, node) });
        // Detach original node
        treeAdapter.detachNode(node);

        node = treeAdapter.getChildNodes(parent)[num + nodeList.length - 1];
      }

      return node;
    }

    /**
     * Match and insert placeholder tag before "next" node
     *
     * @param {Element} node - first text node
     * @param {Element} next - second text node
     *
     * @returns {null}
     */
    function crossMatch(node, next) {
      const pre_text = treeAdapter.getTextNodeContent(node),
        suf_text = treeAdapter.getTextNodeContent(next);

      const matched = (-1 != patterns
        .findIndex(reg => (pre_text + suf_text).search(reg)))
      if (!matched)
        return;

      // Always insert tags nearby hanzi
      // Assume names of the nodes are A (the previous node) and B (the next node),
      // if A ends with latin char and B starts with hanzi, then insert a space before B.
      if (
        pre_text.search(RegExp('(' + hanzi + ')$')) != -1
        &&
        suf_text.search(RegExp('^(' + latin + '|' + punc.open + ')')) != -1
      )
        treeAdapter.insertPlaceholderTagAfter(node, tag_name);
      // if A ends with hanzi char and B starts with latin, then insert a space after A.
      else if (
        pre_text.search(RegExp('(' + latin + '|' + punc.close + ')$')) != -1
        &&
        suf_text.search(RegExp('^(' + hanzi + ')')) != -1
      )
        treeAdapter.insertPlaceholderTagBefore(next, tag_name);
    }
  }
}
