import { fireEvent, render, screen } from "@testing-library/react-native";

import { EmojiPicker } from "@/components/common/emoji-picker";

describe("EmojiPicker", () => {
  it("renders emoji options and reports selection changes", async () => {
    const onChange = jest.fn();

    await render(<EmojiPicker value="💰" onChange={onChange} />);

    await fireEvent.press(screen.getByText("🛒"));

    expect(onChange).toHaveBeenCalledWith("🛒");
  });
});
