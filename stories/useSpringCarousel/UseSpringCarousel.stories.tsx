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
    itemsPerSlide: {
      defaultValue: 1,
      control: 'number',
      if: {
        arg: 'slideType',
        eq: 'fixed',
      },
    },
    withLoop: {
      defaultValue: false,
      control: 'boolean',
    },
    // freeScroll: {
    //   defaultValue: false,
    //   control: 'boolean',
    //   if: {
    //     arg: 'slideType',
    //     eq: 'fluid',
    //   },
    // },

    // initialActiveItem: {
    //   defaultValue: 0,
    //   control: {
    //     type: 'number',
    //   },
    // },
    // animateWhenActiveItemChange: {
    //   defaultValue: true,
    //   control: {
    //     type: 'boolean',
    //   },
    // },
    // gutter: {
    //   defaultValue: 0,
    //   control: {
    //     type: 'number',
    //   },
    // },
    // startEndGutter: {
    //   defaultValue: 0,
    //   control: 'number',
    // },
    // initialStartingPosition: {
    //   defaultValue: 'start',
    //   control: 'radio',
    //   options: ['start', 'center', 'end'],
    //   if: {
    //     arg: 'slideType',
    //     eq: 'fixed',
    //   },
    // },
    // disableGestures: {
    //   defaultValue: false,
    //   control: {
    //     type: 'boolean',
    //   },
    // },
    // slideWhenThresholdIsReached: {
    //   defaultValue: false,
    //   control: {
    //     type: 'boolean',
    //   },
    // },
  },
}

export const Development = {}

export default meta
