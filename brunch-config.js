module.exports = {
  files: {
    javascripts: {joinTo: {
        'lib.js': /^(?!app\/)/,
        'app.js': /^app\//
    }},
    stylesheets: {joinTo: 'app.css'}
  }
};
