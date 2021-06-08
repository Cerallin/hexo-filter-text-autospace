'use strict';

const Filter = require('./lib/filter');
const Injector = require('./lib/injector');

const conf = Object.assign({
  enable: false,
  inject_css: true,
  tag_name: 'hanla',
  entry: '.hanla',
}, hexo.config.text_autospace_filter);

let entry = conf.entry;
if (entry.search(/^\.[\w-]+$/) > -1) {
  conf.entry = {
    name: entry.substr(1),
    type: 'class',
  };
} else if (entry.search(/^\#[\w-]+$/) > -1) {
  conf.entry = {
    name: entry.substr(1),
    type: 'id',
  };
} else if (entry.search(/^[\w-]+$/) > -1) {
  conf.entry = {
    name: entry,
    type: 'tag',
  };
} else {
  // TODO catch error
}

const filter = new Filter(conf);
const injector = new Injector(conf);

if (conf.enable) {
  if (conf.inject_css)
    hexo.extend.injector.register('head_end', injector.process);
  hexo.extend.filter.register('after_render:html', filter.process);
}
