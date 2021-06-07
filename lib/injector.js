
module.exports = function () {
    return `<style>
html.han-la hanla:after {
    content: " ";
    display: inline;
    font-family: Arial;
    font-size: 0.89em;
}

html.han-la code hanla,
html.han-la pre hanla,
html.han-la kbd hanla,
html.han-la samp hanla {
    display: none;
}

html.han-la ol > hanla,
html.han-la ul > hanla {
    display: none;
}
</style>`;

}