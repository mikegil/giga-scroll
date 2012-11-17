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

  grunt.registerTask('add-banner', 'Combines and minifies', function(){

    var banner = grunt.task.directive('<banner:meta.banner>', function() { return null });
    var js = grunt.file.read('lib/giga-scroll.min.js');
    grunt.file.write('lib/giga-scroll.min.js', banner + js);
  });

  grunt.registerTask('build', 'closure-compiler add-banner');
};
