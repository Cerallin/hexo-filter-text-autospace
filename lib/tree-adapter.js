const treeAdapter = require("parse5/lib/tree-adapters/default");

module.exports = treeAdapter;

treeAdapter.setParentNode = function (node, parent) {
    node.parentNode = parent;
}

treeAdapter.setTextNodeContent = function (node, text) {
    node.value = text;
}

treeAdapter.getNodeIndex = function (node) {
    return node.parentNode.childNodes.indexOf(node);
}