# react-spring-carousel

> A performant React carousel component powered by `react-spring` and `@use-gesture`.

[![NPM](https://img.shields.io/npm/v/react-spring-carousel.svg)](https://www.npmjs.com/package/react-spring-carousel) [![NPM](https://img.shields.io/bundlephobia/minzip/react-spring-carousel)](https://img.shields.io/bundlephobia/minzip/react-spring-carousel)

## Install

```bash
// npm v7.x
npm install --save react-spring-carousel
```

```bash
// npm v6.x or less
npm install --save react-spring react-spring-carousel
```

```bash
yarn add react-spring react-spring-carousel
```

## Usage

```tsx
import { useSpringCarousel } from 'react-spring-carousel'

const { carouselFragment, slideToPrevItem, slideToNextItem } = useSpringCarousel({
  items: [
    {
      id: 'item-1',
      renderItem: <div>Item 1</div>,
    },
    {
      id: 'item-2',
      renderItem: <div>Item 2</div>,
    },
  ],
})

return (
  <div>
    <button onClick={slideToPrevItem}>Prev item</button>
    <div>{carouselFragment}</div>
    <button onClick={slideToNextItem}>Next item</button>
  </div>
)
```

## Official documentation

For a complete overview of the library, please visit the official documentation.

[Visit here](https://react-spring-carousel.emilianobucci.com)
