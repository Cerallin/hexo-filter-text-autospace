
module.exports = function (conf) {
    const { entry, tag_name } = conf;

    this.process = function () {
        return `<style>
${entry.type == "tag" ? '': '.'}${entry.name} ${tag_name}:after {
    content: ' ';
    display: inline;
    font-family: inherit;
    font-size: 0.45em;
}

html code ${tag_name},
html pre ${tag_name},
html kbd ${tag_name},
html samp ${tag_name},
html ruby ${tag_name},
html .tag-list-item ${tag_name} {
    display: none;
}

html ol > ${tag_name},
html ul > ${tag_name} {
    display: none;
}
</style>`;
    }
}
