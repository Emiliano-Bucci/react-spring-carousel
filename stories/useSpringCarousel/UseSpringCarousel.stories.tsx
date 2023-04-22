import React from 'react'

import { Props, UseSpringCarousel } from './UseSpringCarousel'

export default {
  title: 'UseSpringCarousel',
  component: UseSpringCarousel,
  argTypes: {
    init: {
      defaultValue: true,
      control: {
        type: 'boolean',
      },
    },
    withLoop: {
      defaultValue: false,
      control: { type: 'boolean' },
    },
    itemsPerSlide: {
      defaultValue: 1,
      if: {
        arg: 'slideType',
        eq: 'fixed',
      },
      control: {
        type: 'number',
      },
    },
    slideType: {
      defaultValue: 'fixed',
      control: {
        type: 'radio',
        options: ['fixed', 'fluid'],
      },
    },
    initialActiveItem: {
      defaultValue: 0,
      control: {
        type: 'number',
      },
    },
    animateWhenActiveItemChange: {
      defaultValue: true,
      control: {
        type: 'boolean',
      },
    },
    gutter: {
      defaultValue: 0,
      control: {
        type: 'number',
      },
    },
    startEndGutter: {
      defaultValue: 0,
      control: 'number',
    },
    initialStartingPosition: {
      defaultValue: 'start',
      control: 'radio',
      options: ['start', 'center', 'end'],
      if: {
        arg: 'slideType',
        eq: 'fixed',
      },
    },
    disableGestures: {
      defaultValue: false,
      control: {
        type: 'boolean',
      },
    },
    slideWhenThresholdIsReached: {
      defaultValue: false,
      control: {
        type: 'boolean',
      },
    },
  },
}

export const Development = (props: Props) => {
  return <UseSpringCarousel {...props} />
}
