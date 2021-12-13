# hexo-filter-text-autospace

本项目是一个 hexo 插件，用于在 CJK 字符与拉丁字符中间插入适当的间距。值得注意的是，并不直接插入一个半角空格，而是精确控制插入间距的宽度，像 Word 一样。

本项目独立完成，但从 [text-autospace.js](https://github.com/mastermay/text-autospace.js) 中汲取许多灵感，在此对 text-autospace.js 和 [findAndReplaceDomText](https://github.com/padolsey/findAndReplaceDOMText) 的作者以及维护者表示感谢。

## 用法
```shell
$ npm install hexo-filter-text-autospace
```

在项目根目录的 `_config.yml` 中添加
```yaml
text_autospace_filter:
  enable: true
  inject_css: true
  tag_name: 'hanla'
  entry: 'body' # tag
  # entry: '#post' # id
  # entry: '.content' # class
```

**Notice** 当 `entry` 为 `class` 类型时，仅支持输入一个类，形如 `.class1.class2` 的规则是不被允许的。

## 示例
我的 hexo 主题展示站：[https://cerallin.github.io](https://cerallin.github.io).

## 本项目的一个替代方案

~~那你为什么写这个插件呢~~

使用 [text-autospace.js](https://github.com/mastermay/text-autospace.js).

如果你不介意向你的 hexo 网站 / 主题中添加 jQuery 依赖以及 js 文件，推荐使用 [text-autospace.js](https://github.com/mastermay/text-autospace.js).

## LICENSE
GPL3+
