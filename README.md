Misskey Core
============

[![][travis-badge]][travis-link]
[![][dependencies-badge]][dependencies-link]
[![][mit-badge]][mit]

A core server of *Misskey*.

Dependencies
------------
* Node.js
* MongoDB
* Redis
* GraphicsMagick

Optional dependencies
---------------------
* Elasticsearch

Get started
-----------
ドメインをふたつ用意してください。

* ひとつめのドメインはプライマリドメインと呼んでいて、Misskeyの主要なサービスを提供するために利用されます。
* ふたつめのドメインはセカンダリドメインと呼んでいて、XSSなどの脆弱性を回避するために利用されます。

**セカンダリドメインはプライマリドメインのサブドメインであってはなりません。**

Build
-----
1. `git clone git://github.com/syuilo/misskey-core.git` ... リポジトリをダウンロードします。
2. `cd misskey-core` ... リポジトリに移動します。
3. `npm install` ... 依存関係をインストールします。
4. `npm run config` ... Misskeyの設定を行います。
5. `git clone git://github.com/syuilo/misskey-web.git` ... Webリソースをダウンロードします。
6. `npm run build` ... ビルドします。

Launch
------
`npm start`

License
-------
[MIT](LICENSE)

[mit]:                http://opensource.org/licenses/MIT
[mit-badge]:          https://img.shields.io/badge/license-MIT-444444.svg?style=flat-square
[travis-link]:        https://travis-ci.org/syuilo/misskey-core
[travis-badge]:       http://img.shields.io/travis/syuilo/misskey-core.svg?style=flat-square
[dependencies-link]:  https://gemnasium.com/syuilo/misskey-core
[dependencies-badge]: https://img.shields.io/gemnasium/syuilo/misskey-core.svg?style=flat-square
