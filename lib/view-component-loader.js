module.exports = function(src) {
  this.cacheable();
  return src;
};

module.exports.pitch = function(remainingRequest) {
  return `
  import React from 'react';
  import ReactDOM from 'react-dom';
  import Component from '${remainingRequest}';

  var element = document.createElement('div');
  document.body.appendChild(element);

  ReactDOM.render(React.createElement(Component, null), element);
  `;
};
