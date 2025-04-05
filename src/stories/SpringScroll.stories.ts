import type { Meta, StoryObj } from "@storybook/react";

import { SpringScroll } from "./SpringScroll";

const meta = {
  title: "useSpringScroll",
  component: SpringScroll,
  argTypes: {
    itemsQuantity: {
      type: "number",
      control: {
        type: "number",
        min: 1,
        max: 20,
        step: 1,
      },
      description: "Number of items to display in the scroll container",
    },
  },
} satisfies Meta<typeof SpringScroll>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HorizontalScroll: Story = {
  args: {
    itemsQuantity: 10,
  },
};
