'use strict';

const filter = require('./lib/filter');
const injector = require('./lib/injector');

let conf = Object.assign({
  enable: false,
  tag_name: 'hanla'
}, hexo.config.text_space_filter);

if (conf.enable) {
  hexo.extend.injector.register('head_end', injector);
  hexo.extend.filter.register('after_render:html', filter);
}
