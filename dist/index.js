'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _forEach2 = require('lodash/forEach');

var _forEach3 = _interopRequireDefault(_forEach2);

var _has2 = require('lodash/has');

var _has3 = _interopRequireDefault(_has2);

var _isBoolean2 = require('lodash/isBoolean');

var _isBoolean3 = _interopRequireDefault(_isBoolean2);

var _isRegExp2 = require('lodash/isRegExp');

var _isRegExp3 = _interopRequireDefault(_isRegExp2);

var _isNull2 = require('lodash/isNull');

var _isNull3 = _interopRequireDefault(_isNull2);

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _crypto = require('crypto');

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _filesize = require('filesize');

var _filesize2 = _interopRequireDefault(_filesize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * When 'webpack' program is used, constructor name is equal to 'NodeOutputFileSystem'.
 * When 'webpack-dev-server' program is used, constructor name is equal to 'MemoryFileSystem'.
 */
var isMemoryFileSystem = function isMemoryFileSystem(outputFileSystem) {
    return outputFileSystem.constructor.name === 'MemoryFileSystem';
};

/**
 * @property test A regular expression used to test if file should be written. When not present, all bundle will be written.
 * @property useHashIndex Use hash index to write only files that have changed since the last iteration (default: true).
 * @property log Logs names of the files that are being written (or skipped because they have not changed) (default: true).
 */

exports.default = function () {
    var userOptions = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var options = (0, _assign3.default)({}, {
        log: true,
        test: null,
        useHashIndex: true
    }, userOptions);

    if (!(0, _isNull3.default)(options.test) && !(0, _isRegExp3.default)(options.test)) {
        throw new Error('options.test value must be an instance of RegExp.');
    }

    if (!(0, _isBoolean3.default)(options.useHashIndex)) {
        throw new Error('options.useHashIndex value must be of boolean type.');
    }

    if (!(0, _isBoolean3.default)(options.log)) {
        throw new Error('options.log value must be of boolean type.');
    }

    var log = function log() {
        var _console;

        for (var _len = arguments.length, append = Array(_len), _key = 0; _key < _len; _key++) {
            append[_key] = arguments[_key];
        }

        if (!options.log) {
            return;
        }

        /* eslint-disable no-console */
        (_console = console).log.apply(_console, [_chalk2.default.dim('[' + (0, _moment2.default)().format('HH:mm:ss') + '] [write-file-webpack-plugin]')].concat(append));
        /* eslint-enable no-console */
    };

    var assetSourceHashIndex = {};

    log('options', options);

    var apply = function apply(compiler) {
        var outputPath = void 0,
            setupDone = void 0,
            setupStatus = void 0;

        var setup = function setup() {
            if (setupDone) {
                return setupStatus;
            }

            setupDone = true;

            log('compiler.outputFileSystem is "' + _chalk2.default.cyan(compiler.outputFileSystem.constructor.name) + '".');

            if (!isMemoryFileSystem(compiler.outputFileSystem)) {
                return false;
            }

            // https://github.com/gajus/write-file-webpack-plugin/issues/1
            // `compiler.options.output.path` will be hardcoded to '/' in
            // webpack-dev-server's command line wrapper. So it should be
            // ignored here.
            if ((0, _has3.default)(compiler, 'options.output.path') && compiler.options.output.path !== '/') {
                outputPath = compiler.options.output.path;
            }

            if (!outputPath) {
                if (!(0, _has3.default)(compiler, 'options.devServer.outputPath')) {
                    throw new Error('output.path is not accessible and devServer.outputPath is not defined. Define devServer.outputPath.');
                }

                outputPath = compiler.options.devServer.outputPath;
            }
            outputPath = _path2.default.resolve(process.cwd(), outputPath);

            log('compiler.options.devServer.outputPath is "' + _chalk2.default.cyan(outputPath) + '".');

            setupStatus = true;

            return setupStatus;
        };

        compiler.plugin('done', function (stats) {
            if (!setup()) {
                return;
            }

            if (stats.compilation.errors.length) {
                return;
            }

            log('stats.compilation.errors.length is "' + _chalk2.default.cyan(stats.compilation.errors.length) + '".');

            (0, _forEach3.default)(stats.compilation.assets, function (asset, assetPath) {
                assetPath = assetPath.replace(new RegExp('^\/?' + outputPath.slice(1) + '\/?'), '');
                var outputFilePath = _path2.default.join(outputPath, assetPath);
                var relativeOutputPath = _path2.default.relative(process.cwd(), outputFilePath);
                var targetDefinition = 'asset: ' + _chalk2.default.cyan('./' + assetPath) + '; destination: ' + _chalk2.default.cyan('./' + relativeOutputPath);

                if (options.test && !options.test.test(assetPath)) {
                    log(targetDefinition, _chalk2.default.yellow('[skipped; does not match test]'));

                    return;
                }

                var assetSize = asset.size();
                var assetSource = asset.source();

                if (options.useHashIndex) {
                    var assetSourceHash = (0, _crypto.createHash)('sha256').update(assetSource).digest('hex');

                    if (assetSourceHashIndex[assetPath] && assetSourceHashIndex[assetPath] === assetSourceHash) {
                        log(targetDefinition, _chalk2.default.yellow('[skipped; matched hash index]'));

                        return;
                    }

                    assetSourceHashIndex[assetPath] = assetSourceHash;
                }

                log(targetDefinition, _chalk2.default.green('[written]'), _chalk2.default.magenta('(' + (0, _filesize2.default)(assetSize) + ')'));

                _mkdirp2.default.sync(_path2.default.dirname(relativeOutputPath));

                _fs2.default.writeFileSync(relativeOutputPath.split('?')[0], assetSource);
            });
        });
    };

    return {
        apply: apply
    };
};

module.exports = exports['default'];
//# sourceMappingURL=index.js.map
