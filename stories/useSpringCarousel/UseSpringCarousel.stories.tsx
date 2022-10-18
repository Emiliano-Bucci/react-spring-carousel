import React from 'react'

import { UseSpringCarousel } from './UseSpringCarousel'

export default {
  title: 'UseSpringCarousel',
  component: UseSpringCarousel,
  argTypes: {
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
  },
}

export const Development = props => {
  return <UseSpringCarousel {...props} />
}
