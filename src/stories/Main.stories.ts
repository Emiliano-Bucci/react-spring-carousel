import type { Meta, StoryObj } from "@storybook/react";

import { Main } from "./Main";

const meta = {
  title: "useSpringCarousel",
  component: Main,
  argTypes: {
    itemsQuantity: {
      type: "number",
      control: {
        min: 0,
      },
      description: "Number of items to generate (requires Main.tsx update)",
    },
    initialActiveItem: {
      type: "number",
      control: {
        min: 0,
      },
    },
    gutter: {
      control: { type: "object" },
    },
    itemsPerSlide: {
      control: { type: "object" },
    },
    carouselAxis: {
      control: { type: "select" },
      options: ["x", "y"],
    },
    startingPosition: {
      control: { type: "select" },
      options: ["start", "middle-start", "center", "middle-end", "end"],
    },
    renderWindow: {
      type: "number",
      control: {
        min: 0,
        step: 1,
      },
      description:
        "If set, only renders items within this many slots from the active one. Other slots become empty placeholders. Leave empty to render all items.",
    },
  },
} satisfies Meta<typeof Main>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Carousel: Story = {
  args: {
    init: true,
    withLoop: true,
    enableGestures: true,
    slideWhenDragThresholdIsReached: true,
    initialActiveItem: 0,
    carouselAxis: "y",
    startingPosition: "start",
    itemsQuantity: 8,

    itemsPerSlide: [
      {
        itemsPerSlide: 1,
        breakpoint: 0,
        media: undefined,
      },
      {
        itemsPerSlide: 3,
        breakpoint: 1240,
        media: undefined,
      },
    ],

    gutter: [
      {
        breakpoint: 0,
        gutter: 40,
        startEndGutter: 0,
      },
      {
        breakpoint: 728,
        gutter: 40,
        startEndGutter: 0,
      },
    ],

    renderWindow: 3,
    slideType: "item",
  },
};
