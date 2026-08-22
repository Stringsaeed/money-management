const React = require("react");
const { Text } = require("react-native");

module.exports = {
  Text: React.forwardRef((props, ref) => React.createElement(Text, { ...props, ref })),
};
