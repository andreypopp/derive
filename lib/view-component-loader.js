module.exports = function(src) {
  this.cacheable();
  return src;
};

module.exports.pitch = function(remainingRequest) {
  return `
    import React from 'react';
    import ReactDOM from 'react-dom';
    import Component from '${remainingRequest}';

    var elementID = '__derive_view_component__';
    var element = document.getElementById(elementID);
    if (element == null) {
      element = document.createElement('div');
      element.id = elementID;
      document.body.appendChild(element);
    }

    ReactDOM.render(React.createElement(Component, null), element);

    if (module.hot) {
      module.hot.accept();
    }
  `;
};
