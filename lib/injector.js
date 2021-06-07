
module.exports = function (conf) {
    const tag_name = conf.tag_name;

    this.process = function () {
        return `<style>
.hanla ${tag_name}:after {
    content: " ";
    display: inline;
    font-family: Arial;
    font-size: 0.89em;
}

html code ${tag_name},
html pre ${tag_name},
html kbd ${tag_name},
html samp ${tag_name} {
    display: none;
}

html ol > ${tag_name},
html ul > ${tag_name} {
    display: none;
}
</style>`;

    }
}