const treeAdapter = require("parse5/lib/tree-adapters/default");

module.exports = treeAdapter;

treeAdapter.setTextNodeContent = function (node, text) {
  node.value = text;
}

treeAdapter.getNodeIndex = function (node) {
  return node.parentNode.childNodes.indexOf(node);
}

treeAdapter.isEmptyTextNode = function (node) {
  let text = treeAdapter.getTextNodeContent(node);
  return (!text || text.search(/^\n+\s+$/) > -1);
}

treeAdapter.insertPlaceholderTagBefore = function (node, tagName) {
  this.insertBefore(
    treeAdapter.getParentNode(node),
    this.createElement(tagName, "http://www.w3.org/1999/xhtml", []),
    node
  );
}
