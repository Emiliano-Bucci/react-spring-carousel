import { ItemWithNoThumb } from './types/common'
export const mockedItems: ItemWithNoThumb<'use-transition'>[] = [
  {
    id: 'item-1',
    renderItem: (
      <div
        style={{
          flex: '1',
          background: '#1ABC9C',
        }}
      >
        div 1
      </div>
    ),
  },
  {
    id: 'item-2',
    renderItem: (
      <div
        style={{
          flex: '1',
          background: '#F1C40F',
        }}
      >
        div 2
      </div>
    ),
  },
  {
    id: 'item-3',
    renderItem: (
      <div
        style={{
          flex: '1',
          background: '#2ECC71',
        }}
      >
        div 3
      </div>
    ),
  },
  {
    id: 'item-4',
    renderItem: (
      <div
        style={{
          flex: '1',
          background: '#E67E22',
        }}
      >
        div 4
      </div>
    ),
  },
  {
    id: 'item-5',
    renderItem: (
      <div
        style={{
          flex: '5',
          background: '#3498DB',
        }}
      >
        div 5
      </div>
    ),
  },
  {
    id: 'item-6',
    renderItem: (
      <div
        style={{
          flex: '6',
          background: 'red',
        }}
      >
        div 6
      </div>
    ),
  },
]
