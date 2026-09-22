import { StyleSheet } from "react-native";

import { CREATE_SIZE } from "./constants";

export const createBlobTokens = {
  face: ["#ffd2e5", "#f98db9", "#ed4f91", "#ce2f73"],
  underside: ["#c52b6e", "#8e1d55"],
  gloss: ["rgba(255, 255, 255, 0.72)", "rgba(255, 255, 255, 0.08)"],
  plus: "#4b1237",
  ring: "rgba(255, 226, 239, 0.62)",
};

export const createBlobStyles = StyleSheet.create({
  motion: {
    width: CREATE_SIZE,
    height: CREATE_SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: CREATE_SIZE / 2,
    boxShadow: "0px 4px 7px rgba(93, 10, 49, 0.24)",
  },
  fill: { ...StyleSheet.absoluteFill },
  art: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  underside: {
    position: "absolute",
    left: 2,
    right: 2,
    bottom: 0,
    height: 53,
    borderRadius: 28,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  face: {
    position: "absolute",
    top: 0,
    left: 1,
    right: 1,
    height: 55,
    borderRadius: 29,
    borderTopLeftRadius: 27,
    borderTopRightRadius: 31,
    borderBottomRightRadius: 28,
    borderBottomLeftRadius: 30,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: "rgba(255, 235, 244, 0.5)",
    overflow: "hidden",
  },
  gloss: {
    position: "absolute",
    top: 5,
    left: 11,
    width: 31,
    height: 13,
    borderRadius: 999,
    transform: [{ rotate: "-17deg" }],
    overflow: "hidden",
  },
  highlightRing: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    position: "absolute",
    borderRadius: 29,
    borderTopLeftRadius: 27,
    borderTopRightRadius: 31,
    borderBottomRightRadius: 28,
    borderBottomLeftRadius: 30,
    borderWidth: 1,
    borderColor: createBlobTokens.ring,
    boxShadow: [
      { inset: true, offsetX: 0, offsetY: 2, blurRadius: 4, color: "rgba(255,255,255,0.48)" },
      { inset: true, offsetX: 0, offsetY: -4, blurRadius: 7, color: "rgba(122,17,68,0.22)" },
    ],
  },
  plus: {
    color: createBlobTokens.plus,
  },
});
