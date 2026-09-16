const React = require("react");
const { Text, View } = require("react-native");

module.exports = {
  Text: React.forwardRef((props, ref) => React.createElement(Text, { ...props, ref })),
  View: React.forwardRef((props, ref) => React.createElement(View, { ...props, ref })),
};
