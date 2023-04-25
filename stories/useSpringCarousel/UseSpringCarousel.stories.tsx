import type { Meta } from '@storybook/react'

import { Props, UseSpringCarousel } from './UseSpringCarousel'

const meta: Meta<Props> = {
  title: 'UseSpringCarousel',
  component: UseSpringCarousel,
  args: {
    init: true,
    itemsWidth: 340,
    slideType: 'fixed',
    itemsPerSlide: 1,
    withLoop: false,
    initialActiveItem: 0,
    animateWhenActiveItemChange: true,
    gutter: 0,
    startEndGutter: 0,
    disableGestures: false,
    initialStartingPosition: 'start',
    slideWhenThresholdIsReached: false,
    freeScroll: false,
    enableFreeScrollDrag: false,
  },
  argTypes: {
    init: {
      defaultValue: false,
      control: 'boolean',
    },
    itemsWidth: {
      defaultValue: 340,
      control: 'number',
      if: {
        arg: 'slideType',
        eq: 'fluid',
      },
    },
    slideType: {
      defaultValue: 'fixed',
      control: 'radio',
      options: ['fixed', 'fluid'],
    },
    initialStartingPosition: {
      defaultValue: 'start',
      control: 'radio',
      options: ['start', 'center', 'end'],
    },
    itemsPerSlide: {
      defaultValue: 1,
      control: 'number',
    },
    withLoop: {
      defaultValue: false,
      control: 'boolean',
    },
    initialActiveItem: {
      defaultValue: 0,
      control: 'number',
    },
    animateWhenActiveItemChange: {
      defaultValue: true,
      control: 'boolean',
    },
    gutter: {
      defaultValue: 0,
      control: 'number',
    },
    startEndGutter: {
      defaultValue: 0,
      control: 'number',
    },
    disableGestures: {
      defaultValue: false,
      control: 'boolean',
    },
    slideWhenThresholdIsReached: {
      defaultValue: false,
      control: 'boolean',
    },
    freeScroll: {
      defaultValue: false,
      control: 'boolean',
    },
    enableFreeScrollDrag: {
      defaultValue: false,
      control: 'boolean',
    },
  },
}

export const Development = {}

export default meta
