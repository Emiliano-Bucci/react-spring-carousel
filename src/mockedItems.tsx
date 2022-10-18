import { ItemWithNoThumb } from './types/common'
export const mockedItems: ItemWithNoThumb[] = [
  {
    id: 'item-1',
    renderItem: (
      <div
        style={{
          flex: '1',
          background: '#34495E',
        }}
      >
        div 1
      </div>
    ),
  },
  {
    id: 'item-2',
    renderItem: () => {
      return (
        <div
          style={{
            flex: '1',
            background: '#E74C3C',
          }}
        >
          div 2
        </div>
      )
    },
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
          background: '#F39C12',
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
          background: '#16A085',
        }}
      >
        div 5
      </div>
    ),
  },
]
