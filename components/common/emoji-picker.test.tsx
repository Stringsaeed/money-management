import { fireEvent, render, screen } from "@testing-library/react-native";

import { EmojiPicker } from "@/components/common/emoji-picker";

describe("EmojiPicker", () => {
  it("renders emoji options and reports selection changes", () => {
    const onChange = jest.fn();

    render(<EmojiPicker value="💰" onChange={onChange} />);

    fireEvent.press(screen.getByText("🛒"));

    expect(onChange).toHaveBeenCalledWith("🛒");
  });
});
