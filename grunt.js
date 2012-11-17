module.exports = function(grunt) {
  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner:
        '// GigaScroll\n' +
        '// version: <%= pkg.version %>\n' +
        '// author: <%= pkg.author.name %> <<%= pkg.author.email %>> <%= pkg.author.url %>\n' +
        '// license: <%= pkg.license %>'
    },
    'closure-compiler': {
        frontend: {
          closurePath: 'vendor/closure-compiler',
          js: [
            'src/string-template-engine.js',
            'src/binding.js',
            'src/view-model.js'
          ],
          jsOutputFile: 'lib/giga-scroll.min.js',
          options: {
            compilation_level: 'SIMPLE_OPTIMIZATIONS',
            language_in: 'ECMASCRIPT5_STRICT'
          }
        }
      }
  });

  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-closure-compiler');

  grunt.registerTask('compile', 'Combines and minifies', function(){

    var src = "";

      /*
    var coffee = require('coffee-script');
    var js = coffee.compile(grunt.file.read('src/beautiful-lies.coffee'));
    var banner = grunt.task.directive('<banner:meta.banner>', function() { return null; });
    if (js) grunt.file.write('lib/beautiful-lies.js', banner + js);

    js = coffee.compile(grunt.file.read('src/plugins.coffee'));
    if (js) grunt.file.write('lib/plugins.js', js);*/
  });

  grunt.registerTask('build', 'closure-compiler');
};
