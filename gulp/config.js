var dest = "./build";
var outputDocsFolder = dest + "/docs"
var src = './src';
var core = src + '/core';
var compiler = src + '/compiler';
var primitive = src + '/primitive';
var api = src + '/api';
var utils = src + '/utils';
var pkg = require('../package');

//used both for Source reference and Order reference
var buildOrder = [
                    utils + '/ClassUtils.js',
                    utils + '/ArraySortOn.js',
                    utils + '/WeakReference.js',
                    src + '/createjs/events/*.js', // All JS in the libs folder
                    src + '/createjs/Ticker.js',

                    compiler + '/StandardLib.js',
                    compiler + '/ObjectUtil.js',
                    compiler + '/ICompiledObject.js',
                    compiler + '/CompiledConstant.js',
                    compiler + '/CompiledFunctionCall.js',
                    compiler + '/Compiler.js',



                    core + '/DynamicState.js',
                    core + '/ILinkableObject.js',
                    core + '/ILinkableCompositeObject.js',
                    core + '/CallbackCollection.js',
                    primitive + '/WeaveTreeItem.js',
                    primitive + '/Dictionary2D.js',
                    core + '/SessionManager.js',
                    core + '/ErrorManager.js',
                    core + '/EditorManager.js',

                    src + '/JavaScript.js',
                    src + '/WeaveAPI.js',

                    utils + '/URLUtil.js',
                    utils + '/URLRequestUtils.js',
                    utils + '/DebugUtils.js',
                    utils + '/AsyncSort.js',
                    utils + '/WeavePromise.js',


                    api + '/debugId.js',
                    api + '/detectLinkableObjectChange.js',

                    core + '/StageUtils.js',

                    core + '/LinkableVariable.js',
    core + '/UntypedLinkableVariable.js',
                    core + '/LinkableNumber.js',
                    core + '/LinkableBoolean.js',
                    core + '/LinkableString.js',
                    core + '/ChildListCallbackInterface.js',
                    core + '/ProgressIndicator.js',
                    core + '/LinkableWatcher.js',
                    core + '/LinkableHashMap.js',
                    core + '/LinkablePromise.js',
                    core + '/LinkableFile.js',
                    core + '/LinkableTextFormat.js',



                    core + '/LinkableDynamicObject.js',

                    core + '/ExternalSessionStateInterface.js',
                    core + '/SessionStateLog.js',

                    'src/WeavePath.js'


               ];

module.exports = {
    context: __dirname,
    browserSync: {
        server: {
            // Serve up our build folder
            baseDir: dest
        }
    },
    sass: {
        src: src + "/sass/**/*.{sass,scss}",
        dest: dest,
        settings: {
            indentedSyntax: true, // Enable .sass syntax!
            imagePath: 'images' // Used by the image-url helper
        }
    },
    images: {
        src: src + "/images/**",
        dest: dest + "/images"
    },
    markup: {
        src: src + "/htdocs/**",
        dest: dest
    },
    iconFonts: {
        name: 'Gulp Starter Icons',
        src: src + '/icons/*.svg',
        dest: dest + '/fonts',
        sassDest: src + '/sass',
        template: './gulp/tasks/iconFont/template.sass.swig',
        sassOutputName: '_icons.sass',
        fontPath: 'fonts',
        className: 'icon',
        options: {
            fontName: 'Post-Creator-Icons',
            appendCodepoints: true,
            normalize: false
        }
    },
    browserify: {
        // A separate bundle will be generated for each
        // bundle config in the list below
        bundleConfigs: [{
            entries: src + '/CallbackCollection.js',
            dest: dest,
            outputName: 'global.js',
            // Additional file extentions to make optional
            extensions: ['.coffee', '.hbs'],
            // list of modules to make require-able externally
            require: []
                // See https://github.com/greypants/gulp-starter/issues/87 for note about
                // why this is 'backbone/node_modules/underscore' and not 'underscore'
    }, {
            entries: src + '/CallbackCollection.js',
            dest: dest,
            outputName: 'page.js',
            // list of externally available modules to exclude from the bundle
            external: []
    }]
    },
    concat: {
        combined: 'weavecore.js',
        scriptFiles: buildOrder,
        dest: dest
    },

    lint: {
        scriptFiles: buildOrder
    },
    yuidoc: {
        name: pkg.name,
        version: pkg.version,
        scriptFiles: buildOrder,
        docsFolder: outputDocsFolder
    },
    production: {
        cssSrc: dest + '/*.css',
        jsSrc: dest + '/*.js',
        dest: dest
    }
};
